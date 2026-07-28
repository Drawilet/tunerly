import { create } from 'zustand';
import {
  Instrument,
  Tuning,
  StringNote,
  SUPPORTED_INSTRUMENTS,
  GUITAR_STANDARD_TUNING,
} from '../../domain/models/TunerModels';
import { DetectedPitch } from '@/core/pitch/services/PitchProcessor';

export interface DebugData {
  rms: number;
  frequency: number;
  confidence: number;
  stableFrames: number;
  noiseFloor: number;
  currentThreshold: number;
  state: 'calibrating' | 'silence' | 'lowconfidence' | 'outofbounds' | 'unstable' | 'accepted';
}

interface TunerState {
  activeInstrument: Instrument;
  activeTuning: Tuning;
  selectedNote: StringNote | null; // null means auto-detect string
  currentPitch: DetectedPitch | null;
  lastValidNote: { noteName: string; octave: number } | null;
  isRecording: boolean;
  microphonePermission: boolean | null;
  calibrationA4: number;
  amplitudeThreshold: number; // base dynamic fallback threshold
  
  // Calibration states
  isCalibrating: boolean;
  noiseFloor: number;
  calibratedThreshold: number;

  // Debug overlay states
  showDebug: boolean;
  debugData: DebugData;

  setInstrument: (instrument: Instrument) => void;
  setTuning: (tuning: Tuning) => void;
  setSelectedNote: (note: StringNote | null) => void;
  setCurrentPitch: (pitch: DetectedPitch | null) => void;
  setRecording: (isRecording: boolean) => void;
  setPermission: (hasPermission: boolean | null) => void;
  setCalibration: (a4: number) => void;
  setAmplitudeThreshold: (threshold: number) => void;
  setIsCalibrating: (isCalibrating: boolean) => void;
  setNoiseFloor: (floor: number, threshold: number) => void;
  setShowDebug: (show: boolean) => void;
  setDebugData: (data: Partial<DebugData>) => void;
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
  amplitudeThreshold: 0.03, // Base fallback threshold (RMS)
  
  isCalibrating: false,
  noiseFloor: 0.0,
  calibratedThreshold: 0.03,

  showDebug: false,
  debugData: {
    rms: 0,
    frequency: 0,
    confidence: 0,
    stableFrames: 0,
    noiseFloor: 0,
    currentThreshold: 0.03,
    state: 'silence',
  },

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
  setIsCalibrating: (isCalibrating) => set({ isCalibrating }),
  setNoiseFloor: (noiseFloor, calibratedThreshold) => set({ noiseFloor, calibratedThreshold }),
  setShowDebug: (showDebug) => set({ showDebug }),
  setDebugData: (data) =>
    set((state) => ({
      debugData: { ...state.debugData, ...data },
    })),
  resetTuner: () =>
    set({
      selectedNote: null,
      currentPitch: null,
      lastValidNote: null,
      isRecording: false,
      isCalibrating: false,
      noiseFloor: 0,
      calibratedThreshold: 0.03,
    }),
}));
