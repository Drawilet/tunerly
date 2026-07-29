import { Platform } from 'react-native';

/**
 * AudioEngineConfig
 *
 * Central configuration object for all audio DSP pipeline parameters.
 * Every numeric constant that affects detection sensitivity, filtering, or
 * timing is declared here — never hardcoded inside pipeline classes.
 *
 * This allows per-platform tuning without touching business logic.
 */
export interface AudioEngineConfig {
  // ── Noise Gate ──────────────────────────────────────────────────────────
  /**
   * Base RMS threshold below which the signal is treated as silence.
   * Mobile mics require a higher value because ambient noise RMS is higher
   * relative to the signal floor than on desktop.
   */
  noiseGateBaseThreshold: number;

  // ── Noise Floor Calibration ──────────────────────────────────────────────
  /**
   * Duration in milliseconds over which the noise floor is sampled on startup.
   * Longer calibration captures more variation in ambient noise on mobile.
   */
  calibrationDurationMs: number;

  /**
   * Multiplier applied to the measured noise floor average to set the
   * final gate threshold (thresholdVal = avgNoiseFloor * calibrationMultiplier).
   */
  calibrationMultiplier: number;

  /**
   * Hard minimum for the calibrated threshold regardless of noise floor.
   * Prevents the gate from being set too low even in very quiet rooms.
   */
  calibrationMinimum: number;

  // ── Silence Timeout ──────────────────────────────────────────────────────
  /**
   * Milliseconds to wait after the last valid pitch before clearing the
   * display and resetting internal state.
   * A longer timeout keeps the last detected note visible through normal
   * note decay envelopes (prevents the display from flashing on mobile).
   */
  silenceTimeoutMs: number;

  // ── YIN Detector ─────────────────────────────────────────────────────────
  /**
   * YIN absolute threshold. Lower values require sharper periodicity for a
   * detection to be accepted. Mobile benefits from a lower threshold to
   * reject ambiguous low-SNR frames before they reach later filters.
   */
  yinThreshold: number;

  /**
   * YIN fallback global-minimum threshold. If no local minimum below
   * yinThreshold is found, YIN falls back to the frame's global minimum
   * only if it is below this value. Tightening this on mobile reduces
   * spurious detections on noisy frames.
   */
  yinFallbackThreshold: number;

  // ── Confidence Gate ──────────────────────────────────────────────────────
  /**
   * Minimum YIN confidence score (0–1) required before a frequency is
   * forwarded to the pitch processor. Higher = stricter.
   */
  confidenceThreshold: number;

  // ── Pitch Filter (Median + EMA) ───────────────────────────────────────────
  /**
   * Sliding window size for the median filter that eliminates outlier spikes.
   * Larger window = more spike rejection, slightly more latency.
   */
  medianWindowSize: number;

  /**
   * EMA smoothing factor. Lower alpha = smoother needle but more sluggish.
   * Mobile benefits from lower alpha to compensate for noisier YIN estimates.
   */
  emaAlpha: number;

  /**
   * Percentage deviation (0–1) from the last smoothed frequency that triggers
   * a filter reset (assumed to be a new string pluck).
   */
  pitchResetThreshold: number;

  // ── Signal Validator ──────────────────────────────────────────────────────
  /**
   * Number of frames tracked in the stability rolling history.
   */
  stabilityHistorySize: number;

  /**
   * Maximum relative deviation (max - min) / min across the history window
   * for the signal to be considered stable.
   */
  stabilityDeviationLimit: number;

  /**
   * Number of consecutive frames the same chromatic note must appear
   * before being accepted as the locked note.
   */
  debounceFrames: number;

  // ── Note Lock ────────────────────────────────────────────────────────────
  /**
   * Maximum deviation in cents from the locked note's frequency that is
   * still considered "same note" for lock-maintenance purposes.
   * 100 cents = 1 semitone. 75 cents allows for natural pitch wobble and
   * minor mic noise without breaking the lock.
   */
  noteLockCentsTolerance: number;
}

// ---------------------------------------------------------------------------
// Per-platform presets
// ---------------------------------------------------------------------------

/**
 * Web / Desktop preset.
 * Desktop microphones are less sensitive to ambient noise; default thresholds
 * and filter parameters are appropriate.
 */
const WEB_CONFIG: AudioEngineConfig = {
  noiseGateBaseThreshold:  0.06,
  calibrationDurationMs:   500,
  calibrationMultiplier:   3.0,
  calibrationMinimum:      0.06,
  silenceTimeoutMs:        300,
  yinThreshold:            0.15,
  yinFallbackThreshold:    0.40,
  confidenceThreshold:     0.40,
  medianWindowSize:        5,
  emaAlpha:                0.15,
  pitchResetThreshold:     0.08,
  stabilityHistorySize:    6,
  stabilityDeviationLimit: 0.02,
  debounceFrames:          4,
  noteLockCentsTolerance:  75,
};

/**
 * iOS preset.
 * iPhone microphones are high-quality but capture ambient noise more
 * aggressively than desktop mics. Higher gate, stricter confidence, longer
 * calibration and silence window.
 */
const IOS_CONFIG: AudioEngineConfig = {
  noiseGateBaseThreshold:  0.09,
  calibrationDurationMs:   800,
  calibrationMultiplier:   3.5,
  calibrationMinimum:      0.10,
  silenceTimeoutMs:        700,
  yinThreshold:            0.12,
  yinFallbackThreshold:    0.30,
  confidenceThreshold:     0.50,
  medianWindowSize:        7,
  emaAlpha:                0.10,
  pitchResetThreshold:     0.06,
  stabilityHistorySize:    6,
  stabilityDeviationLimit: 0.02,
  debounceFrames:          5,
  noteLockCentsTolerance:  75,
};

/**
 * Android preset.
 * Android microphone characteristics vary widely by OEM. Using the same
 * conservative values as iOS provides a safe baseline; individual devices
 * can be further tuned by adjusting this preset.
 */
const ANDROID_CONFIG: AudioEngineConfig = {
  noiseGateBaseThreshold:  0.09,
  calibrationDurationMs:   800,
  calibrationMultiplier:   3.5,
  calibrationMinimum:      0.10,
  silenceTimeoutMs:        700,
  yinThreshold:            0.12,
  yinFallbackThreshold:    0.30,
  confidenceThreshold:     0.50,
  medianWindowSize:        7,
  emaAlpha:                0.10,
  pitchResetThreshold:     0.06,
  stabilityHistorySize:    6,
  stabilityDeviationLimit: 0.02,
  debounceFrames:          5,
  noteLockCentsTolerance:  75,
};

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/**
 * Returns the audio engine configuration preset for the current platform.
 * Call once at module initialization — result is stable for the app lifetime.
 */
export function getAudioEngineConfig(): AudioEngineConfig {
  switch (Platform.OS) {
    case 'ios':
      return IOS_CONFIG;
    case 'android':
      return ANDROID_CONFIG;
    default:
      return WEB_CONFIG;
  }
}
