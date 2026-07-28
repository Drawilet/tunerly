import { create } from 'zustand';
import {
  Instrument,
  Tuning,
  StringNote,
  SUPPORTED_INSTRUMENTS,
  GUITAR_STANDARD_TUNING,
} from '../../domain/models/TunerModels';
import { DetectedPitch } from '@/core/pitch/services/PitchProcessor';

interface TunerState {
  activeInstrument: Instrument;
  activeTuning: Tuning;
  selectedNote: StringNote | null; // null means auto-detect string
  currentPitch: DetectedPitch | null;
  lastValidNote: { noteName: string; octave: number } | null;
  isRecording: boolean;
  microphonePermission: boolean | null;
  calibrationA4: number;
  amplitudeThreshold: number; // RMS noise gate threshold

  setInstrument: (instrument: Instrument) => void;
  setTuning: (tuning: Tuning) => void;
  setSelectedNote: (note: StringNote | null) => void;
  setCurrentPitch: (pitch: DetectedPitch | null) => void;
  setRecording: (isRecording: boolean) => void;
  setPermission: (hasPermission: boolean | null) => void;
  setCalibration: (a4: number) => void;
  setAmplitudeThreshold: (threshold: number) => void;
  resetTuner: () => void;
}

export const useTunerStore = create<TunerState>((set) => ({
  activeInstrument: SUPPORTED_INSTRUMENTS[0],
  activeTuning: GUITAR_STANDARD_TUNING,
  selectedNote: null,
  currentPitch: null,
  lastValidNote: null,
  isRecording: false,
  microphonePermission: null,
  calibrationA4: 440,
  amplitudeThreshold: 0.03, // Noise gate threshold (RMS) set to 0.03 to filter low-SNR decay tails

  setInstrument: (activeInstrument) =>
    set({
      activeInstrument,
      activeTuning: activeInstrument.tunings[0],
      selectedNote: null,
      currentPitch: null,
      lastValidNote: null,
    }),
  setTuning: (activeTuning) =>
    set({
      activeTuning,
      selectedNote: null,
      currentPitch: null,
      lastValidNote: null,
    }),
  setSelectedNote: (selectedNote) =>
    set({
      selectedNote,
      // Clear current pitch to prevent needle jumping from previous note selection
      currentPitch: null,
    }),
  setCurrentPitch: (currentPitch) =>
    set((state) => {
      const updates: Partial<TunerState> = { currentPitch };
      if (currentPitch) {
        updates.lastValidNote = {
          noteName: currentPitch.noteName,
          octave: currentPitch.octave,
        };
      }
      return updates;
    }),
  setRecording: (isRecording) => set({ isRecording }),
  setPermission: (microphonePermission) => set({ microphonePermission }),
  setCalibration: (calibrationA4) => set({ calibrationA4 }),
  setAmplitudeThreshold: (amplitudeThreshold) => set({ amplitudeThreshold }),
  resetTuner: () =>
    set({
      selectedNote: null,
      currentPitch: null,
      lastValidNote: null,
      isRecording: false,
    }),
}));
