# Product Roadmap & Phased Release Plan

This document outlines Tunerly's development phases. It describes the scope, architectural additions, and goals for each phase, ensuring that short-term milestones preserve long-term maintainability.

---

## Phased Overview

```
Phase 1 (MVP) ──► Phase 2 (Tunings) ──► Phase 3 (Instruments) ──► Phase 4 (Pro Features) ──► Phase 5 (Ecosystem)
  (Standard E)      (Drop D, Open D)      (Bass, Ukulele)         (A4 Calibration)         (Watch App, Sync)
```

---

## 1. Phased Scope

### Phase 1: MVP (Active Baseline)
* **Goal:** Launch a premium standard guitar tuner focusing on stability and responsiveness.
* **Scope:**
  - Standard guitar tuning profile (E2 A2 D3 G3 B3 E4).
  - High-precision YIN pitch estimation.
  - Core DSP filters (IIR bandpass filter, RMS noise gate, and median + EMA smoothing).
  - Stateful centered needle gauge dial and responsive layout.
  - Basic haptic vibration triggers on target locks.
* **Architecture:** Establish Clean Architecture guidelines and state separation patterns.

### Phase 2: Alternative Tunings
* **Goal:** Expand tuning capabilities to support different musical styles.
* **Scope:**
  - Introduce alternative guitar tuning profiles (Drop D, Half-Step Down, Open G, Open D, DADGAD).
  - Implement a reusable [SelectionDropdown](file:///home/drawilet/projects/tunerly/src/components/ui/SelectionDropdown.tsx) to switch active tuning profiles.
  - Support automatic peg selection updates matching the active profile.
* **Architecture:** Add configuration schemas to enable adding alternative tunings without writing new code.

### Phase 3: Multi-Instrument Profiles
* **Goal:** Support additional stringed instruments.
* **Scope:**
  - Add profiles for Bass (4-string, 5-string), Ukulele, Violin, Viola, Cello, Mandolin, and Banjo.
  - Implement an instrument selector tab pill component.
  - Dynamically configure biquad bandpass filter limits based on the frequency boundaries of the selected instrument.
* **Architecture:** Separate instrument presets into static JSON metadata files. Keep DSP logic agnostic to the instrument being tuned.

### Phase 4: Advanced Tuning Features
* **Goal:** Cater to professional setups.
* **Scope:**
  - Reference frequency calibration: Adjust base pitch calibration $A_4$ from 432Hz to 446Hz (default 440Hz).
  - Custom calibration presets.
  - Custom user tunings: Pro users can define custom target pitches and save them as presets.
  - Visual stage optimizations: High-contrast stage modes.
* **Architecture:** Extract pitch mapper calibration configurations out of hardcoded constants, binding them to dynamic Zustand state values.

### Phase 5: Premium Customization & Ecosystem
* **Goal:** Establish a sustainable monetization model and device ecosystem.
* **Scope:**
  - Visual themes: Premium dark and vintage hardware skins.
  - Apple Watch & Wear OS independent companion apps.
  - Cloud-synchronized user profiles and favorites across multiple devices.
  - Home screen widgets displaying active tuning reference profiles.
* **Architecture:** Implement local database caching and background synchronization queues.
