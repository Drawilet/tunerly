# State Management Architecture & Data Flow

This document defines Tunerly's state management architecture. It establishes guidelines for data ownership, rules for separating local/global state, and sets up patterns for future offline storage persistence and cloud synchronization.

---

## 1. State Classification & Tools

Tunerly partitions application state into three categories to optimize performance, prevent unnecessary rerenders, and maintain a clean separation of concerns.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          State Classification                           │
├──────────────────────┬──────────────────────────┬───────────────────────┤
│    Transient State   │    Global System State   │    Asymmetric State   │
├──────────────────────┼──────────────────────────┼───────────────────────┤
│ Real-time DSP Stream │ Active Instrument,       │ Custom calibrations,  │
│ Pitch/Cents/Needle   │ Tuning, Selected Note,   │ Custom tunings,       │
│                      │ Calibrations, Theme      │ User Favorites        │
├──────────────────────┼──────────────────────────┼───────────────────────┤
│ Reanimated Shared    │ Zustand Store            │ Zustand Persisted     │
│ Values (High Freq)   │ (Medium Frequency)       │ (via MMKV storage)    │
└──────────────────────┴──────────────────────────┴───────────────────────┘
```

---

## 2. State Drivers

### Real-Time Transient State (High Frequency)
* **Goal:** Process and display real-time signal changes (e.g. needle sweep position) at 60 FPS without triggering React component tree rerenders.
* **Driver:** **React Native Reanimated Shared Values** (`useSharedValue`).
* **Data Flow:** The microphone stream callback updates the Zustand store's `currentPitch` at ~10Hz (medium frequency) to update the note text. However, the needle's physical cent mapping is driven by a `useSharedValue` animated spring loop inside [TunerDisplay.tsx](file:///home/drawilet/projects/tunerly/src/features/tuner/presentation/components/TunerDisplay.tsx). This bypasses the React reconciler, avoiding frame drops.

### Global System State (Medium Frequency)
* **Goal:** Store configuration settings and session metadata shared across multiple UI components.
* **Driver:** **Zustand** (`useTunerStore`).
* **Data Flow:** Holds the active instrument, tuning profile, user-selected note lock, and microphone permissions. Zustand provides a simple hook-based selector API to let components listen only to properties they consume, minimizing component redraw cycles.

### Asymmetric Persisted State (Low Frequency)
* **Goal:** Persist user favorites, dark-mode selections, and calibration configurations across app launches.
* **Driver:** **Zustand + MMKV Storage**.
* **Data Flow:** Written to the device's local high-speed MMKV storage whenever a configuration changes. MMKV is accessed synchronously, eliminating startup loading delays and preventing flashes of fallback settings.

---

## 3. Data Ownership & Future Synchronization

* **Data Ownership:** The audio recording thread owns the input buffer stream, translating it through DSP services. The presentation store is a one-way consumer of the computed `DetectedPitch` calculations.
* **Future Cloud Synchronization (Phase 5):**
  - When cloud sync is introduced, sync logic must be encapsulated in a dedicated infrastructure service layer.
  - The Zustand store will remain the single source of truth for the UI, while the sync service subscribes to store changes, writing updates to a local database queue (using MMKV or SQLite) before syncing with a remote API.
  - The UI remains fully responsive and operational offline, with background synchronization running silently when connectivity is restored.
