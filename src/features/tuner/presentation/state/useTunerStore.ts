import { useState, useEffect } from 'react';
import { DetectedPitch } from '@/core/pitch/services/PitchProcessor';
import { Platform } from 'react-native';
import { create } from 'zustand';
import { createJSONStorage, persist, StateStorage } from 'zustand/middleware';
import {
  GUITAR_STANDARD_TUNING,
  Instrument,
  StringNote,
  SUPPORTED_INSTRUMENTS,
  Tuning,
} from '../../domain/models/TunerModels';

export interface DebugData {
  rms: number;
  frequency: number;
  confidence: number;
  stableFrames: number;
  noiseFloor: number;
  currentThreshold: number;
  state: 'calibrating' | 'silence' | 'lowconfidence' | 'outofbounds' | 'unstable' | 'accepted';
  currentGain: number;
  agcState: string;
  candidateFrequency: number;
  candidateNote: string;
  framesAboveThreshold: number;
  framesBelowThreshold: number;
  activeAudioSessionMode: string;
  activeSampleRate: number;
  bufferSize: number;
  inputChannelCount: number;
  audioSource: string;
  audioSessionCategoryMode: string;
  systemVoiceProcessingActive: string;
}

interface TunerState {
  activeInstrument: Instrument;
  activeTuning: Tuning;
  selectedNote: StringNote | null; // null means auto-detect string
  currentPitch: DetectedPitch | null;
  lastValidNote: { noteName: string; octave: number; targetNote: StringNote } | null;
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

  // Theme Mode Settings — persisted as single source of truth
  themeMode: 'system' | 'light' | 'dark';
  setThemeMode: (mode: 'system' | 'light' | 'dark') => void;

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

/**
 * In-memory fallback storage for native (no AsyncStorage dependency required).
 * On native, the process lifetime matches the app session, so there is no
 * "page refresh" scenario that would reset the theme. This keeps the store
 * functionally correct without an additional native dependency.
 */
const memoryStorage: StateStorage = (() => {
  const map = new Map<string, string>();
  return {
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => { map.set(key, value); },
    removeItem: (key: string) => { map.delete(key); },
  };
})();

/**
 * Storage adapter: localStorage on web (survives refresh), in-memory on native
 * (process-scoped, survives navigation but not app restart — acceptable since
 * native apps retrieve preferences from the OS app storage on boot via other paths).
 * Only `themeMode` is persisted — all runtime/audio state remains ephemeral.
 */
const storage = Platform.OS === 'web'
  ? createJSONStorage(() => localStorage)
  : createJSONStorage(() => memoryStorage);

export const useTunerStore = create<TunerState>()(
  persist(
    (set) => ({
      activeInstrument: SUPPORTED_INSTRUMENTS[0],
      activeTuning: GUITAR_STANDARD_TUNING,
      selectedNote: null,
      currentPitch: null,
      lastValidNote: null,
      isRecording: false,
      microphonePermission: null,
      calibrationA4: 440,
      amplitudeThreshold: 0.06, // Base fallback threshold (RMS)

      isCalibrating: false,
      noiseFloor: 0.0,
      calibratedThreshold: 0.06,

      themeMode: 'system',
      setThemeMode: (themeMode) => set({ themeMode }),

      showDebug: false,
      debugData: {
        rms: 0,
        frequency: 0,
        confidence: 0,
        stableFrames: 0,
        noiseFloor: 0,
        currentThreshold: 0.06,
        state: 'silence',
        currentGain: 1.0,
        agcState: 'nominal',
        candidateFrequency: 0,
        candidateNote: '--',
        framesAboveThreshold: 0,
        framesBelowThreshold: 0,
        activeAudioSessionMode: '--',
        activeSampleRate: 0,
        bufferSize: 0,
        inputChannelCount: 0,
        audioSource: '--',
        audioSessionCategoryMode: '--',
        systemVoiceProcessingActive: '--',
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
              targetNote: currentPitch.targetNote,
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
          calibratedThreshold: 0.06,
          themeMode: 'system',
        }),
    }),
    {
      name: 'tunerly-preferences',
      storage,
      // Only persist the user preference — all runtime/audio state is ephemeral
      partialize: (state) => ({ themeMode: state.themeMode }),
    }
  )
);

/**
 * useStoreHydrated
 *
 * Returns `true` once Zustand's persist middleware has finished reading the
 * persisted store state from storage (localStorage on web, in-memory on native).
 *
 * Use this to block rendering until the correct `themeMode` is available,
 * preventing the race condition where components render before the persisted
 * preference is applied.
 *
 * Implementation uses Zustand's official `onFinishHydration` API which fires
 * synchronously after the storage `getItem` resolves.
 */
export function useStoreHydrated(): boolean {
  // On native the in-memory storage is synchronous — the store is always
  // hydrated before any component mounts. Start as `true` on native.
  const [hydrated, setHydrated] = useState<boolean>(
    Platform.OS !== 'web' || useTunerStore.persist.hasHydrated()
  );

  useEffect(() => {
    // If already hydrated (e.g. native or fast synchronous storage) do nothing.
    if (hydrated) return;

    // Subscribe to the finish-hydration event.
    // setState is called inside a Zustand event-listener callback, not directly
    // in the effect body — this is the correct pattern for external subscriptions.
    const unsub = useTunerStore.persist.onFinishHydration(() => {
       
      setHydrated(true);
    });

    // Re-check in case hydration completed between the useState init and this
    // effect running (micro-task race on web).
    if (useTunerStore.persist.hasHydrated()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setHydrated(true);
    }

    return unsub;
  // Only run once on mount — hydration is a one-shot event.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return hydrated;
}
