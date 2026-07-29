# Tunerly - Product Specification & Brand Guide

This document defines the product vision, brand philosophy, design system guidelines, target audience, and marketing strategy for **Tunerly**. It serves as the single source of truth for design, copywriting, search optimization (SEO/AEO), and product management.

---

## 1. Mission & Vision

### Mission Statement
To provide musicians with the simplest, most reliable, and elegant instrument tuner available, completely free of bloat, advertisements, and distractions.

### Vision Statement
To establish Tunerly as the benchmark for utility applications—proving that single-purpose tools can be premium, sustainable, and professional without evolving into user-engagement trap platforms.

---

## 2. Brand Philosophy & Core Values

Unlike competitors that start as simple utilities and expand into platforms filled with lessons, chord charts, games, social feeds, and subscription tiers, Tunerly is committed to remaining a pure utility.

### Core Values

* **Focus (One Thing Exceptionally Well):** Every feature must contribute directly to the act of tuning an instrument. If a feature does not help a user tune, it does not belong in Tunerly.
* **Respect (Zero Interruption):** We respect the user's time and cognitive load. Tunerly contains:
  - No ads or sponsor screens.
  - No signup screens or profile set-up.
  - No notifications, push alerts, or emails.
* **Aesthetic Excellence (Apple-Inspired Design):** The app should look and feel like a piece of high-end hardware. We prioritize generous whitespace, flat components, clean typography, and fluid micro-animations.
* **Longevity (Utility First):** We build Tunerly to be a tool that a musician can rely on for decades without fear of a corporate pivot or feature paywalls.

---

## 3. Target Audience & User Personas

Tunerly is designed for musicians who value their time and appreciate high-quality tools. Our target audience spans from intermediate hobbyists to active touring professionals.

### User Personas

#### Persona A: "The Touring Professional" (Marcus, 29)
* **Profile:** Touring bassist and guitarist in an active indie-rock band.
* **Needs:** A fast, highly accurate, dark-mode tuner to calibrate his instruments on a dark stage between soundcheck and the performance.
* **Frustrations:** Open-source tuners lack design refinement, while mainstream apps take too long to load, push notifications, and trigger pop-up advertisements.
* **Tunerly Value:** He opens the app, tunes his bass in 20 seconds under dark-mode stage conditions, and closes it. No clicks, no prompts.

#### Persona B: "The Passionate Bedroom Hobbyist" (Clara, 42)
* **Profile:** Plays acoustic guitar and ukulele at home for relaxation.
* **Needs:** A simple, reliable tuner that auto-detects strings and visually guides her to perfect pitch.
* **Frustrations:** Complex dashboards offering guitar tabs, metronomes, and premium course subscriptions when she just wants to make sure her G-string is in tune.
* **Tunerly Value:** The auto-string detection highlights the exact peg she is tuning. Simple, clean visual indicator.

---

## 4. Competitive Positioning

| Feature / Metric | Tunerly | GuitarTuna | Simply Guitar Tuner | Typical Open-Source Tuner |
| :--- | :--- | :--- | :--- | :--- |
| **Primary Goal** | Tune & Exit | Play, Learn, Subscribe | Sell Courses | Basic utility |
| **Advertisements** | None | High (Popups/Banners) | Medium | None / Low |
| **Login Required** | No | Yes (Often forced) | Yes | No |
| **Load Time** | < 1 second | 3 - 5 seconds | 4 - 6 seconds | 1 - 2 seconds |
| **Stage Usability**| High (Dark-first UI) | Low (Bright/Distracting) | Low | Medium |
| **Premium Model** | Pay-once (Custom themes)| Subscription | Subscription | Fully Free (basic UI) |

---

## 5. Design & Color Philosophy

Tunerly’s UI is dark-first, clean, and minimal. The interface balances high-contrast feedback with soft, premium hardware aesthetics.

### Color Palette

* **Background (`#0A0A0A`):** Deep near-black background to blend seamlessly into stage/studio environments, reduce battery consumption, and keep focus on the dial.
* **Card Surface (`#1C1C1E`):** Dark charcoal surfaces for selectors and scales, separating layers without harsh borders.
* **Text Primary (`#FFFFFF`):** Crisp white for note names and frequencies.
* **Text Secondary (`#E5E5EA`):** Warm white for secondary labels.
* **Text Tertiary (`#8E8E93`):** Subdued gray for inactive items and background ticks.
* **Accent Brand (`#0285FD`):** Premium electric blue for the needle and selected selectors.
* **Success Glow (`#10B981`):** Organic emerald green that lights up when the instrument is perfectly in tune.

### Typography
Consistent usage of **Inter** across all screens. We rely on font-weight and layout spacing rather than color variance to establish visual hierarchy.

---

## 6. Brand Voice & Writing Guidelines

Tunerly’s written communication is brief, direct, and professional. We write for adults. We never use exclamation points, gamified copy, or emojis in product text.

### Copywriting Comparison

* **❌ Incorrect (Platform Bloat Style):** 
  "Awesome job! Your E string is perfectly in tune! Let's play some songs!"
* **✅ Correct (Tunerly Style):** 
  "E2 • In Tune"

* **❌ Incorrect (Platform Bloat Style):** 
  "Unlock standard bass tunings, metronomes, and 100+ songs for only $4.99/mo!"
* **✅ Correct (Tunerly Style):** 
  "Standard Tuning Profile active."

---

## 7. Pricing Philosophy

Tunerly is committed to an ethical, sustainable monetization model.
* **Free Version:** The core tuner (Chromatic pitch detection, standard guitar/bass/ukulele/violin tunings, noise-gate, responsive display) is free forever.
* **No Subscriptions:** Tunerly will never charge a monthly fee.
* **Premium Ecosystem (Phase 5):** Paid upgrades will consist exclusively of visual customization (custom themes, vintage gauge designs) and advanced stage setups (multi-device output). Core tuning accuracy and functionality are never paywalled.

---

## 8. Frequently Asked Questions (FAQ)

### Does Tunerly gather my microphone data?
No. Audio data is processed entirely in real-time on the device's local CPU using standard audio streaming loops. No audio buffers are recorded, stored, or sent to external servers.

### Can I use Tunerly offline?
Yes. Tunerly operates 100% offline. It does not require internet, Wi-Fi, or cellular network access to perform tuning.

### Why doesn't Tunerly include a metronome?
Tunerly is designed to do one thing exceptionally well. A metronome is a separate tool with separate UX needs. To keep Tunerly fast and lightweight, we focus solely on tuning.
