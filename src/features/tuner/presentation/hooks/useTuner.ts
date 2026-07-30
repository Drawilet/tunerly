import { useEffect, useRef, useCallback } from 'react';
import { useTunerStore } from '../state/useTunerStore';
import { AudioRecorderFactory } from '@/core/audio/infrastructure/AudioRecorderFactory';
import { YinDetector } from '@/core/pitch/algorithms/yin';
import { PitchProcessor } from '@/core/pitch/services/PitchProcessor';
import { PitchFilter } from '../../../../core/pitch/services/PitchFilter';
import { InstrumentBandpassFilter, AutomaticGainControl } from '@/core/pitch/services/SignalFilter';
import { SignalValidator } from '@/core/pitch/services/SignalValidator';
import { StringNote } from '../../domain/models/TunerModels';
import { HapticsService } from '@/core/haptics/services/HapticsService';
import { NoiseGate } from '@/core/audio/services/NoiseGate';
import { getAudioEngineConfig } from '@/core/audio/services/AudioEngineConfig';

/**
 * Load the platform-specific audio engine configuration once at module init.
 * All pipeline parameters are sourced from this object — no magic numbers
 * are permitted in the hook body.
 */
const ENGINE_CONFIG = getAudioEngineConfig();

/**
 * Calculates the Root Mean Square (RMS) amplitude of a PCM audio buffer.
 */
function calculateRMS(buffer: Float32Array): number {
  let sum = 0;
  const len = buffer.length;
  for (let i = 0; i < len; i++) {
    sum += buffer[i] * buffer[i];
  }
  return Math.sqrt(sum / Math.max(1, len));
}

export function useTuner() {
  const {
    activeInstrument,
    activeTuning,
    selectedNote,
    calibrationA4,
    isRecording,
    setRecording,
    setPermission,
    setCurrentPitch,
    setSelectedNote,
    setIsCalibrating,
    setNoiseFloor,
    setDebugData,
  } = useTunerStore();

  const recorder = useRef(AudioRecorderFactory.getRecorder());

  // YIN Pitch detector — threshold and fallback from platform config
  const detector = useRef(
    new YinDetector(ENGINE_CONFIG.yinThreshold, 4096, ENGINE_CONFIG.yinFallbackThreshold)
  );

  // Temporal pitch smoother — median window, EMA alpha, and reset threshold from config
  const pitchFilter = useRef(
    new PitchFilter(ENGINE_CONFIG.medianWindowSize, ENGINE_CONFIG.emaAlpha, ENGINE_CONFIG.pitchResetThreshold)
  );

  // Noise gate — safety margin as base threshold (refined further after calibration)
  const noiseGate = useRef(new NoiseGate(ENGINE_CONFIG.safetyMargin));

  // Automatic Gain Control (AGC) — configured from settings
  const agc = useRef(
    new AutomaticGainControl({
      targetLevel:  ENGINE_CONFIG.agcTargetLevel,
      maxGain:      ENGINE_CONFIG.agcMaxGain,
      attackAlpha:  ENGINE_CONFIG.agcAttackAlpha,
      releaseAlpha: ENGINE_CONFIG.agcReleaseAlpha,
    })
  );

  // Signal processing filters & validator — all tuning values from config
  const filter = useRef(new InstrumentBandpassFilter());
  const validator = useRef(
    new SignalValidator({
      stabilityHistorySize:    ENGINE_CONFIG.stabilityHistorySize,
      stabilityDeviationLimit: ENGINE_CONFIG.stabilityDeviationLimit,
      debounceFrames:          ENGINE_CONFIG.debounceFrames,
      minFrequency:            ENGINE_CONFIG.tunerMinFrequency,
      maxFrequency:            ENGINE_CONFIG.tunerMaxFrequency,
    })
  );

  // Calibration state tracking
  const calibrationSamples = useRef<number[]>([]);
  const isCalibratingRef = useRef(false);
  const calibrationStart = useRef<number>(0);
  const lastValidNoteTime = useRef<number>(0);

  // Note Lock state to prevent note-drifting during decay/low-SNR phases
  const lockedNoteRef = useRef<StringNote | null>(null);
  const wasInTuneRef = useRef(false);

  // Refs to keep callbacks stable without resetting recording streams
  const activeInstrumentRef = useRef(activeInstrument);

  // Dynamic noise floor and gate telemetry tracking refs
  const lastActiveSignalTimeRef = useRef<number>(0);
  const continuousUpwardFramesRef = useRef<number>(0);
  const reachedMaxTimeRef = useRef<number>(0);
  const framesAboveThresholdRef = useRef<number>(0);
  const framesBelowThresholdRef = useRef<number>(0);
  const activeTuningRef = useRef(activeTuning);
  const selectedNoteRef = useRef(selectedNote);
  const calibrationA4Ref = useRef(calibrationA4);

  useEffect(() => {
    activeInstrumentRef.current = activeInstrument;
  }, [activeInstrument]);

  useEffect(() => {
    activeTuningRef.current = activeTuning;
  }, [activeTuning]);

  useEffect(() => {
    selectedNoteRef.current = selectedNote;
  }, [selectedNote]);

  useEffect(() => {
    calibrationA4Ref.current = calibrationA4;
  }, [calibrationA4]);

  const onAudioData = useCallback((buffer: Float32Array) => {
    // 1. Configure & Apply DC Block and Bandpass IIR Filter matching the active instrument
    filter.current.configure(activeInstrumentRef.current.id, recorder.current.sampleRate);
    const filteredBuffer = filter.current.filter(buffer);

    // 2. Read current noise floor
    const currentNoiseFloor = useTunerStore.getState().noiseFloor;
    const currentThreshold = useTunerStore.getState().calibratedThreshold;

    // 3. Apply Automatic Gain Control (AGC) using post-filtered signal
    const agcBuffer = agc.current.process(filteredBuffer, currentNoiseFloor);
    const agcRms = calculateRMS(agcBuffer);

    // Synchronize current threshold to noise gate
    noiseGate.current.setThreshold(currentThreshold);

    // Track consecutive frames above/below gate threshold
    if (agcRms >= currentThreshold) {
      framesAboveThresholdRef.current++;
      framesBelowThresholdRef.current = 0;
    } else {
      framesBelowThresholdRef.current++;
      framesAboveThresholdRef.current = 0;
    }

    const currentGain = agc.current.getGain();
    let agcState = 'nominal';
    if (currentGain > 1.05) agcState = 'boosting';
    else if (currentGain < 0.95) agcState = 'attenuating';

    // 4. Noise Floor Calibration (duration from config)
    if (isCalibratingRef.current) {
      const elapsed = Date.now() - calibrationStart.current;
      calibrationSamples.current.push(agcRms);

      if (elapsed >= ENGINE_CONFIG.calibrationDurationMs) {
        // Finish calibration
        const sum = calibrationSamples.current.reduce((a, b) => a + b, 0);
        const avg = sum / Math.max(1, calibrationSamples.current.length);
        
        // Clamp calibrated noise floor to safe operational range
        const noiseFloorVal = Math.max(0.001, Math.min(0.03, avg));

        // Calibrated threshold: noiseFloor * multiplier + safetyMargin
        const thresholdVal = noiseFloorVal * ENGINE_CONFIG.calibrationMultiplier + ENGINE_CONFIG.safetyMargin;

        setNoiseFloor(noiseFloorVal, thresholdVal);
        setIsCalibrating(false);
        isCalibratingRef.current = false;
        console.log(`Calibrated Noise Floor: ${noiseFloorVal.toFixed(4)}, Threshold: ${thresholdVal.toFixed(4)}`);
      }

      setDebugData({
        rms: agcRms,
        frequency: 0,
        confidence: 0,
        stableFrames: 0,
        noiseFloor: 0,
        currentThreshold: ENGINE_CONFIG.safetyMargin,
        state: 'calibrating',
        currentGain,
        agcState,
        candidateFrequency: 0,
        candidateNote: '--',
        framesAboveThreshold: framesAboveThresholdRef.current,
        framesBelowThreshold: framesBelowThresholdRef.current,
      });
      return;
    }

    // Dynamic Noise Floor Tracking logic
    const updateNoiseFloor = (rmsVal: number, currentFloor: number) => {
      // Freeze noise floor if active signal was present recently (stabilization period)
      const elapsedSinceActive = Date.now() - lastActiveSignalTimeRef.current;
      const STABILIZATION_PERIOD_MS = 1500;
      if (elapsedSinceActive <= STABILIZATION_PERIOD_MS) {
        return;
      }

      // Only use low-energy frames
      const MAX_NOISE_FLOOR = 0.03;
      if (rmsVal >= MAX_NOISE_FLOOR) {
        return;
      }

      // Update the noise floor slowly (long moving average)
      const trackingRate = 0.005; // 0.5% weight per frame
      let newNoiseFloor = (1 - trackingRate) * currentFloor + trackingRate * rmsVal;

      // Safety limits (clamping)
      const MIN_NOISE_FLOOR = 0.001;
      newNoiseFloor = Math.max(MIN_NOISE_FLOOR, Math.min(MAX_NOISE_FLOOR, newNoiseFloor));

      // Bug recovery: detect continuous upward drift or stuck at max
      if (newNoiseFloor > currentFloor) {
        continuousUpwardFramesRef.current++;
        if (newNoiseFloor >= MAX_NOISE_FLOOR) {
          if (reachedMaxTimeRef.current === 0) {
            reachedMaxTimeRef.current = Date.now();
          } else if (Date.now() - reachedMaxTimeRef.current > 3000) {
            // Stuck at max for 3 seconds -> Reset to recover
            newNoiseFloor = MIN_NOISE_FLOOR;
            continuousUpwardFramesRef.current = 0;
            reachedMaxTimeRef.current = 0;
          }
        }
      } else {
        continuousUpwardFramesRef.current = 0;
        reachedMaxTimeRef.current = 0;
      }

      if (continuousUpwardFramesRef.current > 150) {
        // Continuous upward drift for 150 frames (~3s) -> Reset to recover
        newNoiseFloor = MIN_NOISE_FLOOR;
        continuousUpwardFramesRef.current = 0;
        reachedMaxTimeRef.current = 0;
      }

      const newThreshold = newNoiseFloor * ENGINE_CONFIG.calibrationMultiplier + ENGINE_CONFIG.safetyMargin;
      setNoiseFloor(newNoiseFloor, newThreshold);
    };

    // 5a. Pre-gate Check: Reject absolute silence early
    const preGateThreshold = Math.max(0.002, currentNoiseFloor * 1.15);
    const passesPreGate = agcRms >= preGateThreshold;

    if (!passesPreGate) {
      // If no valid signal, check if we exceed the configured silence timeout
      const isIdle = Date.now() - lastValidNoteTime.current > ENGINE_CONFIG.silenceTimeoutMs;
      if (isIdle) {
        setCurrentPitch(null);
        lockedNoteRef.current = null;
        wasInTuneRef.current = false;
        validator.current.reset();
        pitchFilter.current.reset();

        updateNoiseFloor(agcRms, currentNoiseFloor);
      }

      setDebugData({
        rms: agcRms,
        frequency: 0,
        confidence: 0,
        stableFrames: validator.current.getStableFrameCount(),
        noiseFloor: currentNoiseFloor,
        currentThreshold,
        state: 'silence',
        currentGain,
        agcState,
        candidateFrequency: 0,
        candidateNote: '--',
        framesAboveThreshold: framesAboveThresholdRef.current,
        framesBelowThreshold: framesBelowThresholdRef.current,
      });
      return;
    }

    // 6. Detect Pitch using YIN on the normalized/AGC buffer
    const yinResult = detector.current.detect(agcBuffer, recorder.current.sampleRate);
    const inBounds = validator.current.isFrequencyInBounds(yinResult.frequency);
    const hasConfidence = yinResult.confidence >= ENGINE_CONFIG.confidenceThreshold;
    const isStable = validator.current.validateStability(yinResult.frequency);

    // Active detection tracking: freeze noise floor if possible musical signal is present
    const isSignalPresent = agcRms > currentNoiseFloor * 1.5 || (yinResult.confidence > 0.40 && inBounds);
    if (isSignalPresent) {
      lastActiveSignalTimeRef.current = Date.now();
    }

    // 5b. Redesigned Gate Check (Multi-conditional Gate)
    const isStrongSignal = agcRms >= currentThreshold;
    const isWeakStableSignal = agcRms >= currentNoiseFloor * 1.3 && yinResult.confidence >= 0.70 && isStable && inBounds;
    const isPersistentSignal = (Date.now() - lastValidNoteTime.current <= ENGINE_CONFIG.silenceTimeoutMs) && agcRms >= currentNoiseFloor * 1.15;

    const isGateOpen = isStrongSignal || isWeakStableSignal || isPersistentSignal;

    // Calculate candidate note details for telemetry
    const candidateFreq = yinResult.frequency;
    let candidateNote = '--';
    if (candidateFreq > 0) {
      const midi = PitchProcessor.frequencyToMidi(candidateFreq, calibrationA4Ref.current);
      const { noteName, octave } = PitchProcessor.midiToNoteDetails(Math.round(midi));
      candidateNote = `${noteName}${octave}`;
    }

    if (!isGateOpen) {
      const isIdle = Date.now() - lastValidNoteTime.current > ENGINE_CONFIG.silenceTimeoutMs;
      if (isIdle) {
        setCurrentPitch(null);
        lockedNoteRef.current = null;
        wasInTuneRef.current = false;
        validator.current.reset();
        pitchFilter.current.reset();

        updateNoiseFloor(agcRms, currentNoiseFloor);
      }

      setDebugData({
        rms: agcRms,
        frequency: 0,
        confidence: yinResult.confidence,
        stableFrames: validator.current.getStableFrameCount(),
        noiseFloor: currentNoiseFloor,
        currentThreshold,
        state: 'silence',
        currentGain,
        agcState,
        candidateFrequency: candidateFreq,
        candidateNote,
        framesAboveThreshold: framesAboveThresholdRef.current,
        framesBelowThreshold: framesBelowThresholdRef.current,
      });
      return;
    }

    // 7. Check Confidence & Frequency bounds
    if (!inBounds || !hasConfidence) {
      const isIdle = Date.now() - lastValidNoteTime.current > ENGINE_CONFIG.silenceTimeoutMs;
      if (isIdle) {
        setCurrentPitch(null);
        lockedNoteRef.current = null;
        wasInTuneRef.current = false;
        validator.current.reset();
        pitchFilter.current.reset();

        updateNoiseFloor(agcRms, currentNoiseFloor);
      }

      setDebugData({
        rms: agcRms,
        frequency: yinResult.frequency,
        confidence: yinResult.confidence,
        stableFrames: validator.current.getStableFrameCount(),
        noiseFloor: currentNoiseFloor,
        currentThreshold,
        state: !inBounds ? 'outofbounds' : 'lowconfidence',
        currentGain,
        agcState,
        candidateFrequency: candidateFreq,
        candidateNote,
        framesAboveThreshold: framesAboveThresholdRef.current,
        framesBelowThreshold: framesBelowThresholdRef.current,
      });
      return;
    }

    // 8. Stability Check
    if (!isStable) {
      if (Date.now() - lastValidNoteTime.current > ENGINE_CONFIG.silenceTimeoutMs) {
        setCurrentPitch(null);
        lockedNoteRef.current = null;
        wasInTuneRef.current = false;
        pitchFilter.current.reset();
      }

      setDebugData({
        rms: agcRms,
        frequency: yinResult.frequency,
        confidence: yinResult.confidence,
        stableFrames: validator.current.getStableFrameCount(),
        noiseFloor: currentNoiseFloor,
        currentThreshold,
        state: 'unstable',
        currentGain,
        agcState,
        candidateFrequency: candidateFreq,
        candidateNote,
        framesAboveThreshold: framesAboveThresholdRef.current,
        framesBelowThreshold: framesBelowThresholdRef.current,
      });
      return;
    }

    // 9. Smoothed Frequency Calculation
    const smoothedFreq = pitchFilter.current.filter(yinResult.frequency);

    // 10. Match with closest chromatic note for debouncing
    const playedMidi = PitchProcessor.frequencyToMidi(smoothedFreq, calibrationA4Ref.current);
    const closestMidi = Math.round(playedMidi);
    const midiId = `midi-${closestMidi}`;

    // Debounce note changes
    const isDebounced = validator.current.debounceNoteChange(midiId);

    if (selectedNoteRef.current) {
      lockedNoteRef.current = selectedNoteRef.current;
    } else if (isDebounced || !lockedNoteRef.current) {
      const matchedTuningNote = activeTuningRef.current.notes.find((note) => {
        const noteMidi = PitchProcessor.frequencyToMidi(note.frequency, calibrationA4Ref.current);
        return Math.round(noteMidi) === closestMidi;
      });

      if (matchedTuningNote) {
        lockedNoteRef.current = matchedTuningNote;
      } else {
        const { noteName, octave } = PitchProcessor.midiToNoteDetails(closestMidi);
        lockedNoteRef.current = {
          id: midiId,
          name: noteName,
          octave: octave,
          frequency: PitchProcessor.midiToFrequency(closestMidi, calibrationA4Ref.current),
        };
      }
    }

    // 11. Note Lock verification
    const lockHolds = validator.current.validateNoteLock(
      smoothedFreq,
      lockedNoteRef.current.frequency,
      ENGINE_CONFIG.noteLockCentsTolerance
    );

    if (lockHolds) {
      const pitchResult = PitchProcessor.process(
        smoothedFreq,
        yinResult.confidence,
        activeTuningRef.current.notes,
        selectedNoteRef.current ?? lockedNoteRef.current,
        calibrationA4Ref.current,
        ENGINE_CONFIG.confidenceThreshold,
        ENGINE_CONFIG.tunerMinFrequency,
        ENGINE_CONFIG.tunerMaxFrequency
      );

      if (pitchResult) {
        setCurrentPitch(pitchResult);
        lastValidNoteTime.current = Date.now(); // update valid signal timestamp

        // Haptic feedback pulse on in-tune trigger
        if (pitchResult.isInTune) {
          if (!wasInTuneRef.current) {
            HapticsService.notificationSuccess();
            wasInTuneRef.current = true;
          }
        } else {
          wasInTuneRef.current = false;
        }
      }

      setDebugData({
        rms: agcRms,
        frequency: smoothedFreq,
        confidence: yinResult.confidence,
        stableFrames: validator.current.getStableFrameCount(),
        noiseFloor: currentNoiseFloor,
        currentThreshold,
        state: 'accepted',
        currentGain,
        agcState,
        candidateFrequency: candidateFreq,
        candidateNote,
        framesAboveThreshold: framesAboveThresholdRef.current,
        framesBelowThreshold: framesBelowThresholdRef.current,
      });
    } else {
      // Frequency jumped outside the lock tolerance — treat as note change
      if (Date.now() - lastValidNoteTime.current > ENGINE_CONFIG.silenceTimeoutMs) {
        setCurrentPitch(null);
        lockedNoteRef.current = null;
        wasInTuneRef.current = false;
        validator.current.reset();
        pitchFilter.current.reset();
      }

      setDebugData({
        rms: agcRms,
        frequency: smoothedFreq,
        confidence: yinResult.confidence,
        stableFrames: validator.current.getStableFrameCount(),
        noiseFloor: currentNoiseFloor,
        currentThreshold,
        state: 'unstable',
        currentGain,
        agcState,
        candidateFrequency: candidateFreq,
        candidateNote,
        framesAboveThreshold: framesAboveThresholdRef.current,
        framesBelowThreshold: framesBelowThresholdRef.current,
      });
    }
  }, [setCurrentPitch, setNoiseFloor, setIsCalibrating, setDebugData]);

  const startTuning = useCallback(async () => {
    try {
      const hasPermission = await recorder.current.requestPermissions();
      setPermission(hasPermission);

      if (hasPermission) {
        // Trigger calibration (duration from config)
        setIsCalibrating(true);
        isCalibratingRef.current = true;
        calibrationSamples.current = [];
        calibrationStart.current = Date.now();
        lastValidNoteTime.current = Date.now();

        filter.current.reset();
        validator.current.reset();
        agc.current.reset();

        await recorder.current.start(onAudioData);
        setRecording(true);
      }
    } catch (error) {
      console.error('Failed to start tuner:', error);
      setRecording(false);
    }
  }, [onAudioData, setPermission, setRecording, setIsCalibrating]);

  const stopTuning = useCallback(async () => {
    try {
      await recorder.current.stop();
    } catch (error) {
      console.error('Failed to stop tuner:', error);
    } finally {
      setRecording(false);
      setCurrentPitch(null);
      lockedNoteRef.current = null;
      pitchFilter.current.reset();
      filter.current.reset();
      validator.current.reset();
      agc.current.reset();
      isCalibratingRef.current = false;
      lastActiveSignalTimeRef.current = 0;
      continuousUpwardFramesRef.current = 0;
      reachedMaxTimeRef.current = 0;
      framesAboveThresholdRef.current = 0;
      framesBelowThresholdRef.current = 0;
    }
  }, [setCurrentPitch, setRecording]);

  /**
   * Helper to trigger a pluck in simulated mode (e.g. on simulators or during testing).
   */
  const triggerPluck = useCallback((note: StringNote) => {
    const recInstance = recorder.current;
    if (recInstance && 'pluck' in recInstance) {
      (recInstance as any).pluck(note.frequency);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    const currentRecorder = recorder.current;
    return () => {
      currentRecorder.stop().catch((err) => console.error('Cleanup stop failed:', err));
    };
  }, []);

  return {
    isRecording,
    startTuning,
    stopTuning,
    triggerPluck,
    selectedNote,
    setSelectedNote,
    activeTuning,
  };
}
