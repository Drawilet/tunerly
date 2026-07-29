import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets, EdgeInsets } from 'react-native-safe-area-context';

/**
 * Breakpoint tier names (ordered smallest → largest).
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

export interface ResponsiveValues {
  // ── Breakpoint flags ──────────────────────────────────────────────────────
  breakpoint: Breakpoint;

  /** Convenience aliases (backward-compatible with existing consumers) */
  isCompact: boolean;   // compactMobile
  isRegular: boolean;   // regularMobile
  isTablet: boolean;    // tablet
  isLaptop: boolean;    // laptop
  isDesktop: boolean;   // desktop | largeDesktop
  isLargeDesktop: boolean; // largeDesktop

  /** True for any breakpoint that benefits from a centered max-width container */
  isWideLayout: boolean; // tablet | laptop | desktop | largeDesktop

  // ── Spacing ───────────────────────────────────────────────────────────────
  /**
   * Spacing dictionary that scales smoothly with viewport width rather than
   * snapping between discrete values.  Values are computed by linearly
   * interpolating between the mobile and desktop anchor points.
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
   * Continuous tuner scale factor (0.75 – 2.0).
   * Drives TunerDisplay sizing proportionally instead of discrete size jumps.
   * Reference point: 1.0 at 390 px (iPhone 14 width).
   */
  tunerScale: number;

  // ── Viewport & safe area ──────────────────────────────────────────────────
  insets: EdgeInsets;
  width: number;
  height: number;
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

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useResponsive(): ResponsiveValues {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const breakpoint = getBreakpoint(width);

  // Backward-compatible boolean flags
  const isCompact = breakpoint === 'compactMobile';
  const isRegular = breakpoint === 'regularMobile';
  const isTablet = breakpoint === 'tablet';
  const isLaptop = breakpoint === 'laptop';
  const isDesktop = breakpoint === 'desktop' || breakpoint === 'largeDesktop';
  const isLargeDesktop = breakpoint === 'largeDesktop';
  const isWideLayout = !isCompact && !isRegular;

  // ── Spacing ──────────────────────────────────────────────────────────────
  // Linearly interpolate from mobile anchors (390 px) to desktop anchors
  // (1440 px).  This ensures spacing grows continuously instead of snapping.
  const spacing = {
    xs: Math.round(lerp(width, 390, 1440, 4, 10)),
    sm: Math.round(lerp(width, 390, 1440, 8, 20)),
    md: Math.round(lerp(width, 390, 1440, 16, 32)),
    lg: Math.round(lerp(width, 390, 1440, 24, 48)),
    xl: Math.round(lerp(width, 390, 1440, 32, 64)),
    xxl: Math.round(lerp(width, 390, 1440, 48, 96)),
  };

  // ── Font scale ───────────────────────────────────────────────────────────
  // 1.0 at 390 px (mobile reference), 1.5 at 1536 px (large desktop cap)
  const fontScale = parseFloat(lerp(width, 390, 1536, 1.0, 1.5).toFixed(3));

  // ── Content max width ─────────────────────────────────────────────────────
  const contentMaxWidth =
    isLargeDesktop ? 1400 :
    isDesktop      ? 1200 :
    isLaptop       ? 1000 :
    isTablet       ? 800  :
    /* mobile */     600;

  // ── Tuner scale ───────────────────────────────────────────────────────────
  // Drives TunerDisplay proportionally.
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
    spacing,
    fontScale,
    contentMaxWidth,
    tunerScale,
    insets,
    width,
    height,
  };
}
