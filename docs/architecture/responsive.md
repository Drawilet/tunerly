# Responsive Design System Architecture

This document defines Tunerly's responsive layout system. It outlines screen category classifications, typography scaling rules, safe area integrations, and implementation guidelines to ensure the application renders beautifully on compact devices, standard phones, large phones, and tablets.

---

## 1. Screen Classifications & Breakpoints

To prevent layout overflows or awkward empty spaces, Tunerly partitions device screens into three distinct responsive categories based on their physical dimensions:

| Category | Breakpoints | Target Devices | Layout Behavior |
| :--- | :--- | :--- | :--- |
| **Compact** | `height < 700` OR `width < 360` | iPhone SE, iPhone 12/13 Mini, older Android models | Scaled down components, reduced margins, single-row string selectors. |
| **Regular** | `width < 600` (and not Compact) | Standard smartphones (iPhone 14/15, standard Galaxy) | Default spacing, full visual components, 52px touch targets. |
| **Expanded (Tablet)**| `width >= 600` | iPads, Android tablets, folding devices in tablet mode | Horizontally centered content card, restricted layout width (800px), larger fonts. |

---

## 2. Dynamic Spacing System

Tunerly employs a scaling spacing system rather than hardcoding static margins or paddings. The spacing tokens adapt automatically to the screen classification:

```typescript
const spacing = {
  xs: isCompact ? 2 : (isTablet ? 6 : 4),
  sm: isCompact ? 6 : (isTablet ? 12 : 8),
  md: isCompact ? 12 : (isTablet ? 20 : 16),
  lg: isCompact ? 16 : (isTablet ? 32 : 24),
  xl: isCompact ? 24 : (isTablet ? 48 : 32),
  xxl: isCompact ? 32 : (isTablet ? 64 : 48),
};
```

* **Usage Rule:** Always reference these spacing tokens from the `useResponsive` hook when styling container margins, item gaps, or paddings:
  ```typescript
  const { spacing } = useResponsive();
  return <View style={{ padding: spacing.md }} />;
  ```

---

## 3. Typography & UI Element Scaling

### Typography Scaling
Text size scales dynamically to remain readable on compact screens and balanced on larger screens.
- **Font Scale Factor:**
  - *Compact:* `0.85`
  - *Regular:* `1.00`
  - *Tablet:* `1.15`
- **Application:** Use the `fontScale` modifier to compute font sizes dynamically in components where standard themed styles need overrides (e.g. large pitch numbers):
  ```typescript
  const { fontScale } = useResponsive();
  const noteFontSize = isCompact ? 40 : (isTablet ? 64 : 56);
  ```

### Vector & UI Scaling
Complex visual components (e.g. the headstock illustration or the gauge dial) scale proportionally:
- **Tuning Dial Diameter:** `120px` (Compact) | `160px` (Regular) | `185px` (Tablet).
- **Headstock Illustration Scale:** Apply a visual matrix scale transform on the container view to keep details sharp:
  `transform: [{ scale: isCompact ? 0.65 : (isTablet ? 1.15 : 1.0) }]`

---

## 4. Layout Principles & Safe Areas

* **Safe Area Insets:** Do not wrap screens in the standard `SafeAreaView` from React Native, which behaves inconsistently across Android and iOS tab bars. Instead, use custom `View` structures and read `insets` directly from the `useResponsive` hook (which wraps `useSafeAreaInsets`). Apply these as container padding to prevent notch and home indicator clipping.
* **Centered Tablet Layouts:** Tablets must never stretch content full-width. Restrict the inner wrapper container width to `contentMaxWidth` (800px) and center it horizontally using:
  `alignItems: 'center', justifyContent: 'center'`
* **Wrapping Preventions:** Peg buttons in the string selector should use responsive sizing (`40px` on compact screens) to guarantee they stay aligned in a single row without wrapping into multiple rows and pushing other controls off the screen.
