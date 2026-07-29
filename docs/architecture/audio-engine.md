# Audio Engine & Digital Signal Processing (DSP) Architecture

This document defines the architecture of the **Tunerly Audio Engine**. It outlines the stages of the audio processing pipeline, data transformations, and the abstraction layer that allows switching underlying algorithms (e.g. replacing YIN with MPM or Autocorrelation) without modifying UI or presentation logic.

---

## 1. Pipeline Overview

The audio engine processes raw real-time PCM audio input and converts it into display-ready pitch data through a series of decoupled signal-processing components:

```
[ Microphone Stream ]
         │
         ▼ (44100Hz Float32Array PCM)
┌──────────────────────────────────────┐
│  InstrumentBandpassFilter (IIR IIR)  │ <-- Bandpass filter based on instrument frequency limits
└──────────────────────────────────────┘
         │
         ▼ (Filtered Buffer)
┌──────────────────────────────────────┐
│      RMS Amplitude Calculator        │ <-- Computes Root Mean Square (signal power)
└──────────────────────────────────────┘
         │
         ▼ (RMS Value)
┌──────────────────────────────────────┐
│         NoiseGate Service            │ <-- Suppresses room noise, gates stream
└──────────────────────────────────────┘
         │
         ├── [Open] ──► [Pitch Estimator (e.g. YIN)] ──► [Confidence & Stability Checks] ──► [Filter & Smoother] ──► [MIDI & Cents Mapper]
         │
         └── [Closed] ──► [300ms Silence Timeout] ──► [Reset Filters] ──► [Center Needle]
```

---

## 2. Core Processing Stages

### Audio Capture (`IAudioRecorder`)
* **Role:** Interfaces with device microphone hardware to capture PCM audio chunks at a sample rate of 44100Hz (standard quality).
* **Abstraction:** The presentation layer communicates only with the abstract `IAudioRecorder` interface, allowing the app to use `WebAudioRecorder` (using Browser/Native microphone API) or `SimulatedAudioRecorder` (producing mathematical sine waves for emulator testing) seamlessly.

### Bandpass Filtering (`InstrumentBandpassFilter`)
* **Role:** Restricts raw signal to the instrument's active frequency range, rejecting out-of-band noises (e.g., low-frequency room rumbles, AC units, high-frequency hiss).
* **Behavior:** Applies high-pass and low-pass biquad filters dynamically when the selected instrument shifts.
  - *Guitar standard limits:* 70Hz - 1400Hz
  - *Bass standard limits:* 25Hz - 350Hz

### Noise Gate (`NoiseGate`)
* **Role:** Analyzes the power of the filtered signal and shuts down processing if amplitude is insufficient.
* **Algorithm:** Computes the Root Mean Square (RMS) of the PCM buffer. If the RMS is lower than the active threshold, the gate closes:
  - Autocorrelation / Pitch estimation is skipped, conserving CPU.
  - The needle begins a smooth spring animation returning to 0 cents.
  - The last valid note display is preserved to prevent note flickering.

### Pitch Estimation (`IPitchDetector`)
* **Role:** Performs fundamental frequency estimation ($f_0$) on the gated PCM audio buffer.
* **Current Implementation:** **YIN Algorithm**. YIN uses the Cumulative Mean Normalized Difference Function (CMNDF) to search for periodicities in the time-domain buffer, returning frequency in Hz and a confidence value.
* **Interchangeability:** To prevent lock-in to YIN, the engine defines a generic `IPitchDetector` interface. In the future, this can be swapped with the McLeod Pitch Method (MPM) or FFT-based harmonic product spectrum estimators without impacting other components.

### Temporal Pitch Smoothing (`PitchFilter`)
* **Role:** Stabilizes frequency indicators against ambient noise spikes and physical note decay.
* **Technique:**
  1. **Median Filter (Window Size 5):** Discards outlier spikes (spurious frequency double or half-octave errors).
  2. **Exponential Moving Average (EMA):** Smoothes the remaining values using a decay factor $\alpha = 0.15$:
     $$S_t = \alpha \cdot M_t + (1 - \alpha) \cdot S_{t-1}$$
     This provides a smooth, physical lag to the needle, resembling hardware analog needles.
  3. **Note Snap/Reset:** If a new frequency differs from the current estimate by $> 5\%$ for 2 consecutive frames, the filter wipes its history and snaps immediately to the new pitch, allowing instant string transitions.

### Pitch Mapping (`PitchProcessor`)
* **Role:** Matches the smoothed frequency to the physical instrument parameters.
* **Logic:**
  - Converts frequency to MIDI note numbers using $A_4 = 440\text{Hz}$ calibration:
    $$d = 12 \cdot \log_2(f / 440) + 69$$
  - Determines the target tuning string and computes the pitch deviation in cents:
    $$\text{cents} = 1200 \cdot \log_2(f_{\text{actual}} / f_{\text{target}})$$

---

## 3. Future Improvements & Scalability

- **Calibration Offset (Phase 4):** Modify the `PitchProcessor` to accept arbitrary base reference calibrations (e.g. $A_4 = 432\text{Hz}$ or $442\text{Hz}$) instead of hardcoding $440\text{Hz}$.
- **Multi-Pitch Estimation:** Investigate autocorrelation improvements for handling complex polyphonic signals if chord recognition is introduced in later phases.
