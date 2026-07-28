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
  
  // YIN Pitch detector (threshold 0.15)
  const detector = useRef(new YinDetector(0.15));
  
  // Temporal pitch smoother (window size 5, alpha 0.20, auto-reset threshold 8%)
  const pitchFilter = useRef(new PitchFilter(5, 0.20, 0.08));

  // Signal processing filters & validator
  const filter = useRef(new InstrumentBandpassFilter());
  const validator = useRef(new SignalValidator());

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

    // 3. Noise Floor Calibration (First 500 ms)
    if (isCalibratingRef.current) {
      const elapsed = Date.now() - calibrationStart.current;
      calibrationSamples.current.push(filteredRms);

      if (elapsed >= 500) {
        // Finish calibration
        const sum = calibrationSamples.current.reduce((a, b) => a + b, 0);
        const avg = sum / Math.max(1, calibrationSamples.current.length);
        const noiseFloorVal = avg;
        // Calibrated threshold: double the noise floor, but at least 0.02
        const thresholdVal = Math.max(0.02, noiseFloorVal * 2.0);
        
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
        currentThreshold: 0.03,
        state: 'calibrating',
      });
      return;
    }

    // Read current threshold
    const currentThreshold = useTunerStore.getState().calibratedThreshold;
    const currentNoiseFloor = useTunerStore.getState().noiseFloor;

    // 4. Noise Gate: Reject if below threshold
    if (filteredRms < currentThreshold) {
      // If no valid signal, check if we exceed 300 ms silence timeout
      if (Date.now() - lastValidNoteTime.current > 300) {
        setCurrentPitch(null);
        lockedNoteRef.current = null;
        wasInTuneRef.current = false;
        validator.current.reset();
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

    // 5. Detect Pitch using YIN
    const yinResult = detector.current.detect(filteredBuffer, recorder.current.sampleRate);

    // 6. Check Confidence & Frequency bounds
    const inBounds = validator.current.isFrequencyInBounds(yinResult.frequency, activeInstrumentRef.current.id);
    const hasConfidence = yinResult.confidence >= 0.40; // 0.40 minimum confidence threshold

    if (!inBounds || !hasConfidence) {
      if (Date.now() - lastValidNoteTime.current > 300) {
        setCurrentPitch(null);
        lockedNoteRef.current = null;
        wasInTuneRef.current = false;
        validator.current.reset();
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

    // 7. Stability Check (consecutive frames within 2% deviation)
    const isStable = validator.current.validateStability(yinResult.frequency);
    if (!isStable) {
      if (Date.now() - lastValidNoteTime.current > 300) {
        setCurrentPitch(null);
        lockedNoteRef.current = null;
        wasInTuneRef.current = false;
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

    // 8. Smoothed Frequency Calculation
    const smoothedFreq = pitchFilter.current.filter(yinResult.frequency);

    // 9. Match with closest target note
    let closestNote = activeTuningRef.current.notes[0];
    let minDiff = Infinity;
    for (const note of activeTuningRef.current.notes) {
      const diff = Math.abs(smoothedFreq - note.frequency);
      if (diff < minDiff) {
        minDiff = diff;
        closestNote = note;
      }
    }

    // 10. Debounce note changes (require 4 stable consecutive frames of the target note)
    const isDebounced = validator.current.debounceNoteChange(closestNote.id);
    if (selectedNoteRef.current) {
      lockedNoteRef.current = selectedNoteRef.current;
    } else if (isDebounced || !lockedNoteRef.current) {
      lockedNoteRef.current = closestNote;
    }

    // 11. Lock validation to prevent target note jumping during decay
    if (closestNote.id === lockedNoteRef.current.id) {
      const pitchResult = PitchProcessor.process(
        smoothedFreq,
        yinResult.confidence,
        activeTuningRef.current.notes,
        lockedNoteRef.current,
        calibrationA4Ref.current,
        0.40
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
      // Out of band jump
      if (Date.now() - lastValidNoteTime.current > 300) {
        setCurrentPitch(null);
        lockedNoteRef.current = null;
        wasInTuneRef.current = false;
        validator.current.reset();
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
        // Trigger 500ms calibration
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
