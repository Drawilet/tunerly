import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets, EdgeInsets } from 'react-native-safe-area-context';

/**
 * Width breakpoint tier names (ordered smallest → largest).
 *
 * Thresholds are based on CSS device-independent pixels (same unit that
 * useWindowDimensions reports on web):
 *
 * compactMobile  < 360
 * regularMobile  360–599
 * tablet         600–1023
 * laptop         1024–1279
 * desktop        1280–1535
 * largeDesktop   ≥ 1536
 */
export type Breakpoint =
  | 'compactMobile'
  | 'regularMobile'
  | 'tablet'
  | 'laptop'
  | 'desktop'
  | 'largeDesktop';

/**
 * Height class derived from usable screen height (after safe-area insets).
 *
 * compact   < 700 px  – iPhone SE, very short screens
 * regular   700–799   – iPhone 11 / 13 / 15 (standard phones)
 * expanded  ≥ 800 px  – large phones, tablets, desktops
 */
export type HeightClass = 'compact' | 'regular' | 'expanded';

export interface ResponsiveValues {
  // ── Width breakpoint flags ─────────────────────────────────────────────────
  breakpoint: Breakpoint;

  /** Convenience aliases (backward-compatible with existing consumers) */
  isCompact: boolean;       // compactMobile
  isRegular: boolean;       // regularMobile
  isTablet: boolean;        // tablet
  isLaptop: boolean;        // laptop
  isDesktop: boolean;       // desktop | largeDesktop
  isLargeDesktop: boolean;  // largeDesktop

  /** True for any breakpoint that benefits from a centered max-width container */
  isWideLayout: boolean;    // tablet | laptop | desktop | largeDesktop

  // ── Height class flags ────────────────────────────────────────────────────
  /**
   * Screen height category based on usable height (viewport minus safe-area
   * insets).  Used to adapt vertical spacing and optionally hide decorative
   * elements on short devices without shrinking critical controls.
   */
  heightClass: HeightClass;
  isCompactHeight: boolean;   // < 700 px usable
  isRegularHeight: boolean;   // 700–799 px usable
  isExpandedHeight: boolean;  // >= 800 px usable

  /**
   * Continuous vertical scale multiplier (0.85–1.0–1.2).
   * Reference: 1.0 at 750 px usable height.
   * Used to adapt vertical spacing / illustration size independently of
   * the horizontal tunerScale.
   */
  verticalScale: number;

  /**
   * Vertical spacing dictionary that scales with verticalScale instead of
   * screen width, ensuring top/bottom breathing room adapts to height.
   */
  vSpacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };

  // ── Horizontal Spacing ────────────────────────────────────────────────────
  /**
   * Spacing dictionary that scales smoothly with viewport width rather than
   * snapping between discrete values.
   */
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
  };

  // ── Typography ────────────────────────────────────────────────────────────
  /** Continuous font-scale multiplier (1.0 at 390 px, 1.5 at 1536 px). */
  fontScale: number;

  // ── Layout constraints ────────────────────────────────────────────────────
  /** Maximum content width appropriate for the current breakpoint. */
  contentMaxWidth: number;

  /**
   * Continuous tuner scale factor (0.75–2.0).
   * Drives TunerDisplay sizing proportionally instead of discrete size jumps.
   * Reference point: 1.0 at 390 px (iPhone 14 width).
   * NOTE: This is WIDTH-only. Use verticalScale for height-sensitive sizing.
   */
  tunerScale: number;

  // ── Viewport & safe area ──────────────────────────────────────────────────
  insets: EdgeInsets;
  width: number;
  height: number;
  /** Height after subtracting safe-area insets (the usable layout height). */
  usableHeight: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Linear interpolation clamped to [min, max]. */
function lerp(value: number, inMin: number, inMax: number, outMin: number, outMax: number): number {
  const t = Math.min(1, Math.max(0, (value - inMin) / (inMax - inMin)));
  return outMin + t * (outMax - outMin);
}

function getBreakpoint(width: number): Breakpoint {
  if (width < 360) return 'compactMobile';
  if (width < 600) return 'regularMobile';
  if (width < 1024) return 'tablet';
  if (width < 1280) return 'laptop';
  if (width < 1536) return 'desktop';
  return 'largeDesktop';
}

function getHeightClass(usableHeight: number): HeightClass {
  if (usableHeight < 700) return 'compact';
  if (usableHeight < 800) return 'regular';
  return 'expanded';
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useResponsive(): ResponsiveValues {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  // ── Width breakpoint ──────────────────────────────────────────────────────
  const breakpoint = getBreakpoint(width);

  const isCompact = breakpoint === 'compactMobile';
  const isRegular = breakpoint === 'regularMobile';
  const isTablet = breakpoint === 'tablet';
  const isLaptop = breakpoint === 'laptop';
  const isDesktop = breakpoint === 'desktop' || breakpoint === 'largeDesktop';
  const isLargeDesktop = breakpoint === 'largeDesktop';
  const isWideLayout = !isCompact && !isRegular;

  // ── Usable height & height class ─────────────────────────────────────────
  // Usable height excludes safe-area top/bottom so the height class reflects
  // how much vertical space the layout can actually use.
  const usableHeight = height - insets.top - insets.bottom;
  const heightClass = getHeightClass(usableHeight);

  const isCompactHeight  = heightClass === 'compact';
  const isRegularHeight  = heightClass === 'regular';
  const isExpandedHeight = heightClass === 'expanded';

  // Continuous vertical scale: 0.85 at 600px usable, 1.0 at 750px, 1.2 at 900px.
  const verticalScale = parseFloat(
    Math.min(1.3, lerp(usableHeight, 600, 900, 0.85, 1.2)).toFixed(3)
  );

  // ── Vertical spacing ──────────────────────────────────────────────────────
  // These values scale with verticalScale (not width) for height-sensitive gaps.
  const vSpacing = {
    xs: Math.round(lerp(verticalScale, 0.85, 1.2, 2,  6)),
    sm: Math.round(lerp(verticalScale, 0.85, 1.2, 4,  12)),
    md: Math.round(lerp(verticalScale, 0.85, 1.2, 8,  20)),
    lg: Math.round(lerp(verticalScale, 0.85, 1.2, 14, 32)),
    xl: Math.round(lerp(verticalScale, 0.85, 1.2, 20, 48)),
  };

  // ── Horizontal spacing ────────────────────────────────────────────────────
  const spacing = {
    xs:  Math.round(lerp(width, 390, 1440, 4,  10)),
    sm:  Math.round(lerp(width, 390, 1440, 8,  20)),
    md:  Math.round(lerp(width, 390, 1440, 16, 32)),
    lg:  Math.round(lerp(width, 390, 1440, 24, 48)),
    xl:  Math.round(lerp(width, 390, 1440, 32, 64)),
    xxl: Math.round(lerp(width, 390, 1440, 48, 96)),
  };

  // ── Font scale ────────────────────────────────────────────────────────────
  const fontScale = parseFloat(lerp(width, 390, 1536, 1.0, 1.5).toFixed(3));

  // ── Content max width ─────────────────────────────────────────────────────
  const contentMaxWidth =
    isLargeDesktop ? 1400 :
    isDesktop      ? 1200 :
    isLaptop       ? 1000 :
    isTablet       ?  800 :
    /* mobile */      600;

  // ── Tuner scale (width-only) ──────────────────────────────────────────────
  // 0.85 at 320 px (compact mobile), 1.0 at 390 px, 1.8 at 1536 px, capped at 2.0.
  const tunerScale = parseFloat(
    Math.min(2.0, lerp(width, 320, 1536, 0.85, 1.8)).toFixed(3)
  );

  return {
    breakpoint,
    isCompact,
    isRegular,
    isTablet,
    isLaptop,
    isDesktop,
    isLargeDesktop,
    isWideLayout,
    heightClass,
    isCompactHeight,
    isRegularHeight,
    isExpandedHeight,
    verticalScale,
    vSpacing,
    spacing,
    fontScale,
    contentMaxWidth,
    tunerScale,
    insets,
    width,
    height,
    usableHeight,
  };
}
