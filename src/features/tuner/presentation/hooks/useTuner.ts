import { useEffect, useRef, useCallback } from 'react';
import { useTunerStore } from '../state/useTunerStore';
import { AudioRecorderFactory } from '@/core/audio/infrastructure/AudioRecorderFactory';
import { YinDetector } from '@/core/pitch/algorithms/yin';
import { PitchProcessor } from '@/core/pitch/services/PitchProcessor';
import { PitchFilter } from '../../../../core/pitch/services/PitchFilter';
import { InstrumentBandpassFilter } from '@/core/pitch/services/SignalFilter';
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

  // Noise gate — base threshold from config (refined further after calibration)
  const noiseGate = useRef(new NoiseGate(ENGINE_CONFIG.noiseGateBaseThreshold));

  // Signal processing filters & validator — all tuning values from config
  const filter = useRef(new InstrumentBandpassFilter());
  const validator = useRef(
    new SignalValidator({
      stabilityHistorySize:    ENGINE_CONFIG.stabilityHistorySize,
      stabilityDeviationLimit: ENGINE_CONFIG.stabilityDeviationLimit,
      debounceFrames:          ENGINE_CONFIG.debounceFrames,
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
    // 1. Configure & Apply Bandpass IIR Filter matching the active instrument
    filter.current.configure(activeInstrumentRef.current.id, recorder.current.sampleRate);
    const filteredBuffer = filter.current.filter(buffer);
    const filteredRms = calculateRMS(filteredBuffer);

    // 2. Noise Floor Calibration (duration from config)
    if (isCalibratingRef.current) {
      const elapsed = Date.now() - calibrationStart.current;
      calibrationSamples.current.push(filteredRms);

      if (elapsed >= ENGINE_CONFIG.calibrationDurationMs) {
        // Finish calibration
        const sum = calibrationSamples.current.reduce((a, b) => a + b, 0);
        const avg = sum / Math.max(1, calibrationSamples.current.length);
        const noiseFloorVal = avg;

        // Calibrated threshold: configurable multiplier, configurable floor minimum
        const thresholdVal = Math.max(
          ENGINE_CONFIG.calibrationMinimum,
          noiseFloorVal * ENGINE_CONFIG.calibrationMultiplier
        );

        setNoiseFloor(noiseFloorVal, thresholdVal);
        setIsCalibrating(false);
        isCalibratingRef.current = false;
        console.log(`Calibrated Noise Floor: ${noiseFloorVal.toFixed(4)}, Threshold: ${thresholdVal.toFixed(4)}`);
      }

      setDebugData({
        rms: filteredRms,
        frequency: 0,
        confidence: 0,
        stableFrames: 0,
        noiseFloor: 0,
        currentThreshold: ENGINE_CONFIG.noiseGateBaseThreshold,
        state: 'calibrating',
      });
      return;
    }

    // Read current threshold
    const currentThreshold = useTunerStore.getState().calibratedThreshold;
    const currentNoiseFloor = useTunerStore.getState().noiseFloor;

    // Synchronize current threshold to noise gate
    noiseGate.current.setThreshold(currentThreshold);

    // 3. Noise Gate: Reject if below threshold
    if (!noiseGate.current.isOpen(filteredRms)) {
      // If no valid signal, check if we exceed the configured silence timeout
      if (Date.now() - lastValidNoteTime.current > ENGINE_CONFIG.silenceTimeoutMs) {
        setCurrentPitch(null);
        lockedNoteRef.current = null;
        wasInTuneRef.current = false;
        validator.current.reset();
        pitchFilter.current.reset();
      }

      setDebugData({
        rms: filteredRms,
        frequency: 0,
        confidence: 0,
        stableFrames: validator.current.getStableFrameCount(),
        noiseFloor: currentNoiseFloor,
        currentThreshold,
        state: 'silence',
      });
      return;
    }

    // 4. Detect Pitch using YIN
    const yinResult = detector.current.detect(filteredBuffer, recorder.current.sampleRate);

    // 5. Check Confidence & Frequency bounds (confidence threshold from config)
    const inBounds = validator.current.isFrequencyInBounds(yinResult.frequency, activeInstrumentRef.current.id);
    const hasConfidence = yinResult.confidence >= ENGINE_CONFIG.confidenceThreshold;

    if (!inBounds || !hasConfidence) {
      if (Date.now() - lastValidNoteTime.current > ENGINE_CONFIG.silenceTimeoutMs) {
        setCurrentPitch(null);
        lockedNoteRef.current = null;
        wasInTuneRef.current = false;
        validator.current.reset();
        pitchFilter.current.reset();
      }

      setDebugData({
        rms: filteredRms,
        frequency: yinResult.frequency,
        confidence: yinResult.confidence,
        stableFrames: validator.current.getStableFrameCount(),
        noiseFloor: currentNoiseFloor,
        currentThreshold,
        state: !inBounds ? 'outofbounds' : 'lowconfidence',
      });
      return;
    }

    // 6. Stability Check (consecutive frames within configured deviation limit)
    const isStable = validator.current.validateStability(yinResult.frequency);
    if (!isStable) {
      if (Date.now() - lastValidNoteTime.current > ENGINE_CONFIG.silenceTimeoutMs) {
        setCurrentPitch(null);
        lockedNoteRef.current = null;
        wasInTuneRef.current = false;
        pitchFilter.current.reset();
      }

      setDebugData({
        rms: filteredRms,
        frequency: yinResult.frequency,
        confidence: yinResult.confidence,
        stableFrames: validator.current.getStableFrameCount(),
        noiseFloor: currentNoiseFloor,
        currentThreshold,
        state: 'unstable',
      });
      return;
    }

    // 7. Smoothed Frequency Calculation
    const smoothedFreq = pitchFilter.current.filter(yinResult.frequency);

    // 8. Match with closest chromatic note for debouncing
    const playedMidi = PitchProcessor.frequencyToMidi(smoothedFreq, calibrationA4Ref.current);
    const closestMidi = Math.round(playedMidi);
    const midiId = `midi-${closestMidi}`;

    // Debounce note changes (require configured consecutive stable frames)
    const isDebounced = validator.current.debounceNoteChange(midiId);

    if (selectedNoteRef.current) {
      // Manual Mode: locked to the selected note
      lockedNoteRef.current = selectedNoteRef.current;
    } else if (isDebounced || !lockedNoteRef.current) {
      // Auto Mode: resolve the locked note from the active tuning list
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

    // 9. Note Lock verification (cents-based tolerance instead of exact MIDI integer equality)
    //    This prevents natural pitch wobble and minor mic noise from breaking the lock when
    //    the played frequency rounds to an adjacent semitone.
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
        ENGINE_CONFIG.confidenceThreshold
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
        rms: filteredRms,
        frequency: smoothedFreq,
        confidence: yinResult.confidence,
        stableFrames: validator.current.getStableFrameCount(),
        noiseFloor: currentNoiseFloor,
        currentThreshold,
        state: 'accepted',
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
        rms: filteredRms,
        frequency: smoothedFreq,
        confidence: yinResult.confidence,
        stableFrames: validator.current.getStableFrameCount(),
        noiseFloor: currentNoiseFloor,
        currentThreshold,
        state: 'unstable',
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
      isCalibratingRef.current = false;
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
