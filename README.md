<p align="center">
  <img src="./assets/images/favicon.png" alt="Tunerly Logo" width="160" height="160" />
</p>

<h1 align="center">Tunerly</h1>

<p align="center">
  <strong>The simplest complete instrument tuner. Minimal, elegant, and professional.</strong>
</p>

<p align="center">
  <a href="#about-tunerly">About</a> •
  <a href="#philosophy">Philosophy</a> •
  <a href="#features">Features</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#getting-started">Getting Started</a> •
  <a href="#documentation">Documentation</a> •
  <a href="#roadmap">Roadmap</a> •
  <a href="#contributing">Contributing</a>
</p>

---

## About Tunerly

Tunerly is a premium-quality instrument tuner focused on doing one thing exceptionally well. 

Unlike existing tuner apps that have evolved into platforms full of lessons, songs, subscriptions, ads, and unnecessary features, Tunerly is built around simplicity. The experience is designed to feel closer to Apple's aesthetics than a cluttered utility.

## Philosophy

> **Open the app → Tune your instrument → Close the app.**

We believe every utility should be focused, fast, and free of distractions. Tunerly has:
* **No ads** or promotional banners.
* **No onboarding** or tutorial screens.
* **No account creation** or mandatory logins.
* **No cloud dependencies** for core tuning.
* **No feature lockouts** behind subscription walls.

---

## Features

- **Automatic String Detection:** Instantly maps played frequency to the closest instrument string.
- **Real-Time Pitch Detection:** Employs the high-accuracy YIN fundamental frequency estimator.
- **Ambient Noise Gate:** Integrated audio threshold filter that suppresses room noise and prevents display flickering.
- **Stateful Needle Gauge:** An Apple-inspired physical-feeling gauge dial that dampens jitter using Exponential Moving Averages (EMA).
- **Responsive Adaptive Interface:** Seamlessly scales layout, tap targets, and gauge dials across compact, regular, and tablet form factors.
- **Dark Mode First:** Designed with a premium near-black aesthetic optimized for stage and studio usage.

---

## Tech Stack

Tunerly is built with modern, type-safe mobile technologies:
* **Framework:** React Native + Expo (SDK 57)
* **Language:** TypeScript (Strictly typed, 0% JS)
* **Routing:** Expo Router (File-based navigation)
* **State Management:** Zustand (Global State) + React Query (Asynchronous Queries)
* **Animation:** React Native Reanimated (60 FPS fluid transitions)
* **Haptics:** Expo Haptics (Physical feedback triggers)
* **Storage:** MMKV (High-speed key-value store)

---

## Getting Started

### Prerequisites

Ensure you have Node.js (v18+) and npm installed on your development machine.

### Installation

1. Clone the repository and navigate to the project directory.
2. Install dependencies:
   ```bash
   npm install
   ```

### Running the Project

Start the local Expo development server:
```bash
# Start server
npm run start

# Run on iOS simulator
npm run ios

# Run on Android emulator
npm run android

# Run on Web
npm run web
```

---

## Folder Structure

Tunerly is organized around **Clean Architecture** principles to separate business logic, UI, and infrastructure:

```
├── assets/             # Raw static assets (fonts, images)
├── src/
│   ├── app/            # Expo Router file-based screens
│   ├── components/     # Globally reusable generic UI components
│   ├── constants/      # Global constants and style design system tokens
│   ├── core/           # Pure application core logic
│   │   ├── audio/      # Audio recording services and infrastructure
│   │   ├── pitch/      # DSP pitch extraction algorithms and filters
│   │   └── haptics/    # Native physical feedback wrappers
│   └── features/       # Feature-sliced domain directories
│       └── tuner/      # Tuner screen domain, state, and UI views
```

---

## Documentation

The project includes a comprehensive documentation structure to align developers, designers, and AI coding assistants:

* [**Product Guide (`docs/PRODUCT.md`)**](docs/PRODUCT.md) — Mission, target personas, positioning, copy guidelines, design guidelines, and color theory.
* [**Technical Specification (`docs/TECHNICAL.md`)**](docs/TECHNICAL.md) — Technical guidelines, architecture layout, coding rules, and conventions.
* [**AI Assistant Guide (`docs/AGENTS.md`)**](docs/AGENTS.md) — Execution rules, instructions, and constraints for AI agents.
* [**Architecture Deep Dives (`docs/architecture/`):**](docs/architecture/)
  - [Audio Processing & DSP Engine](docs/architecture/audio-engine.md)
  - [Responsive Design System Layout](docs/architecture/responsive.md)
  - [Folder & Domain Structure Guidelines](docs/architecture/folder-structure.md)
  - [State Ownership & Flow](docs/architecture/state-management.md)
  - [Phased Release Roadmap](docs/architecture/roadmap.md)
* [**Architecture Decision Records (`docs/decisions/`):**](docs/decisions/)
  - [ADR-001: Clean Architecture](docs/decisions/ADR-001-clean-architecture.md)
  - [ADR-002: Zustand + React Query](docs/decisions/ADR-002-state-management.md)
  - [ADR-003: Isolated Audio DSP Engine](docs/decisions/ADR-003-audio-engine.md)
  - [ADR-004: Custom Responsive System](docs/decisions/ADR-004-responsive-system.md)

---

## Roadmap

* **Phase 1 (Current):** Guitar Standard Tuning MVP with YIN pitch extraction, noise gate filtering, dynamic gauge, and basic haptics.
* **Phase 2 (Immediate):** Custom and alternative guitar tunings (Drop D, Open G, Open D, DADGAD, etc.).
* **Phase 3:** Additional instrument profiles (Bass, Ukulele, Violin, Cello, Mandolin, Banjo).
* **Phase 4:** Custom frequency calibration (432Hz to 442Hz) and custom offset configurations.
* **Phase 5:** System widgets, Apple Watch / Wear OS applications, and cloud-synced preferences.

---

## Contributing

We welcome contributions from the community! Please read our [TECHNICAL.md](docs/TECHNICAL.md) and [AGENTS.md](docs/AGENTS.md) guidelines before proposing pull requests. Ensure all code compiles cleanly (`npx tsc --noEmit`) and passes the style checks (`npm run lint`).

---

<p align="center">
  Made with ♥ by the Tunerly Team.
</p>
