import { useEffect, useRef, useCallback } from 'react';
import { useTunerStore } from '../state/useTunerStore';
import { AudioRecorderFactory } from '@/core/audio/infrastructure/AudioRecorderFactory';
import { YinDetector } from '@/core/pitch/algorithms/yin';
import { PitchProcessor } from '@/core/pitch/services/PitchProcessor';
import { PitchFilter } from '../../../../core/pitch/services/PitchFilter';
import { StringNote } from '../../domain/models/TunerModels';
import { HapticsService } from '@/core/haptics/services/HapticsService';

/**
 * Calculates the Root Mean Square (RMS) amplitude of a PCM audio buffer.
 */
function calculateRMS(buffer: Float32Array): number {
  let sum = 0;
  for (let i = 0; i < buffer.length; i++) {
    sum += buffer[i] * buffer[i];
  }
  return Math.sqrt(sum / buffer.length);
}

export function useTuner() {
  const {
    activeTuning,
    selectedNote,
    calibrationA4,
    amplitudeThreshold,
    isRecording,
    setRecording,
    setPermission,
    setCurrentPitch,
    setSelectedNote,
  } = useTunerStore();

  const recorder = useRef(AudioRecorderFactory.getRecorder());
  
  // YIN Pitch detector (threshold 0.15 matches standard guitar pluck tracking)
  const detector = useRef(new YinDetector(0.15));
  
  // Stateful temporal filter (window size 5, alpha 0.20, auto-reset threshold 8%)
  const pitchFilter = useRef(new PitchFilter(5, 0.20, 0.08));

  // Note Lock state to prevent note-drifting during decay/low-SNR phases
  const lockedNoteRef = useRef<StringNote | null>(null);
  const wasInTuneRef = useRef(false);

  // Refs to keep callbacks stable without resetting recording streams
  const activeTuningRef = useRef(activeTuning);
  const selectedNoteRef = useRef(selectedNote);
  const calibrationA4Ref = useRef(calibrationA4);
  const amplitudeThresholdRef = useRef(amplitudeThreshold);

  useEffect(() => {
    activeTuningRef.current = activeTuning;
  }, [activeTuning]);

  useEffect(() => {
    selectedNoteRef.current = selectedNote;
  }, [selectedNote]);

  useEffect(() => {
    calibrationA4Ref.current = calibrationA4;
  }, [calibrationA4]);

  useEffect(() => {
    amplitudeThresholdRef.current = amplitudeThreshold;
  }, [amplitudeThreshold]);

  const onAudioData = useCallback((buffer: Float32Array) => {
    // 1. Calculate RMS amplitude
    const rms = calculateRMS(buffer);

    // 2. Noise Gate: ignore input if it is below the threshold
    if (rms < amplitudeThresholdRef.current) {
      pitchFilter.current.reset();
      setCurrentPitch(null);
      lockedNoteRef.current = null; // Clear lock on silence
      wasInTuneRef.current = false;
      return;
    }

    // 3. Detect Pitch
    const yinResult = detector.current.detect(buffer, recorder.current.sampleRate);
    
    // 4. Check confidence and valid instrument frequency range [30Hz, 1000Hz]
    if (yinResult.frequency >= 30 && yinResult.frequency <= 1000 && yinResult.confidence >= 0.35) {
      // Apply rolling Median + EMA smoothing
      const smoothedFreq = pitchFilter.current.filter(yinResult.frequency);

      // Determine which note in the tuning is closest to this frequency
      let closestNote = activeTuningRef.current.notes[0];
      let minDiff = Infinity;
      for (const note of activeTuningRef.current.notes) {
        const diff = Math.abs(smoothedFreq - note.frequency);
        if (diff < minDiff) {
          minDiff = diff;
          closestNote = note;
        }
      }

      // Check if this is a strong new pluck (RMS >= 0.08)
      const isStrongPluck = rms >= 0.08;

      if (selectedNoteRef.current) {
        // Manual mode: locked to selected note
        lockedNoteRef.current = selectedNoteRef.current;
      } else if (isStrongPluck || !lockedNoteRef.current) {
        // Auto mode: lock onto closest note if strong pluck or no current lock
        lockedNoteRef.current = closestNote;
      }

      // Verify the detected note matches our locked target to prevent decay-drifting
      if (closestNote.id === lockedNoteRef.current.id) {
        const pitchResult = PitchProcessor.process(
          smoothedFreq,
          yinResult.confidence,
          activeTuningRef.current.notes,
          lockedNoteRef.current,
          calibrationA4Ref.current,
          0.35
        );
        
        setCurrentPitch(pitchResult);

        if (pitchResult && pitchResult.isInTune) {
          if (!wasInTuneRef.current) {
            HapticsService.notificationSuccess();
            wasInTuneRef.current = true;
          }
        } else {
          wasInTuneRef.current = false;
        }
      } else {
        // Out-of-band jump while signal is weak: treat as noise/decay tail
        pitchFilter.current.reset();
        setCurrentPitch(null);
        wasInTuneRef.current = false;
      }
    } else {
      // No clear frequency detected
      pitchFilter.current.reset();
      setCurrentPitch(null);
      wasInTuneRef.current = false;
    }
  }, [setCurrentPitch]);

  const startTuning = useCallback(async () => {
    try {
      const hasPermission = await recorder.current.requestPermissions();
      setPermission(hasPermission);

      if (hasPermission) {
        await recorder.current.start(onAudioData);
        setRecording(true);
      }
    } catch (error) {
      console.error('Failed to start tuner:', error);
      setRecording(false);
    }
  }, [onAudioData, setPermission, setRecording]);

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
