# Directory & Folder Structure Specification

This document defines Tunerly's project layout. It establishes directory boundaries, outlines file placement rules, and highlights structural constraints to maintain Clean Architecture separation.

---

## 1. Directory Tree Overview

```
tunerly/
├── assets/                  # Raw global assets (fonts, native icons, splash graphics)
│   ├── fonts/               # Preloaded typography files (Inter, Outfit)
│   └── images/              # Custom image files, logos, and illustrations
├── src/                     # Application source code
│   ├── app/                 # Expo Router file-based screens and navigation layouts
│   ├── components/          # Reusable presentation UI elements (themed fields, buttons)
│   │   └── ui/              # Atom-level widgets (dropdowns, checkmarks, sliders)
│   ├── constants/           # Styling theme files and constant metadata configurations
│   ├── core/                # System core domain layers
│   │   ├── audio/           # Sound capture and recorder abstractions/drivers
│   │   ├── haptics/         # Native device vibration haptic feedback drivers
│   │   └── pitch/           # DSP algorithms, filters, and pitch calculation logics
│   ├── hooks/               # Globally shared custom React hooks (useResponsive, useTheme)
│   └── features/            # Feature-sliced application domains
│       └── tuner/           # Tuner screen slice
│           ├── domain/      # Domain entities (StringNote, Tuning, Instrument models)
│           └── presentation/# Feature UI views, state hooks, and selectors
```

---

## 2. Directory Breakdown & Rules

### Global Assets (`/assets/`)
* **Purpose:** Stores raw assets consumed by the native mobile shells and asset packagers.
* **Contains:** Font files (`.ttf`), adaptive app icons, native splash screen images, and logo PNGs.
* **File Rules:** Image assets must live in `assets/images/`, and fonts must live in `assets/fonts/`. Never store raw files directly in the root of `/assets/`.

### Application Router (`/src/app/`)
* **Purpose:** Defines the routing table, navigation flows, and layout definitions using Expo Router.
* **Contains:** Entrypoints (`index.tsx`), layouts (`_layout.tsx`), and tab controllers.
* **Rules:** Keep files in this folder extremely lightweight. They should only import feature screens and wrap them in providers. Never write business logic, DSP logic, or custom styling directly inside router files.

### Global Components (`/src/components/`)
* **Purpose:** Hosts globally reusable visual presentation widgets.
* **Contains:** Standardized typography wrappers (`themed-text.tsx`), loaders, and atom-level interface components (`src/components/ui/SelectionDropdown.tsx`).
* **Rules:** Components must remain strictly visual. They must receive state and callbacks via props. Never couple global components directly to Zustands or feature-level domain stores.

### Core System (`/src/core/`)
* **Purpose:** Holds core DSP math, signal processing algorithms, and abstract infrastructure interfaces.
* **Contains:** Autocorrelation logic (`yin.ts`), biquad filtering math (`SignalFilter.ts`), and abstract interfaces (`IAudioRecorder.ts`).
* **Rules:** This directory must be **framework-agnostic**. Core logic should be pure TypeScript. It must never import React, React Native components, or presentation state selectors.

### Feature Slices (`/src/features/`)
* **Purpose:** Encapsulates cohesive product features (e.g. `tuner`).
* **Structure:**
  - **`domain/`:** Contains interfaces and models representing the feature logic.
  - **`presentation/`:** Contains components, custom hooks, and stores that compile the feature screen.
* **Rules:** Feature slices must be self-contained. Features can import global helpers from `src/core/` or `src/components/`, but feature slices must never import components or models from other feature slices directly.
