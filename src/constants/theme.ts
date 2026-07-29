/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';
import { Platform } from 'react-native';

// -------------------------------------------------------------
// Color System (Apple Semantic Palette)
// -------------------------------------------------------------
export const Colors = {
  light: {
    primary: '#0A84FF',         // Apple System Blue (accent)
    background: '#F2F2F7',      // System Background
    surface: '#FFFFFF',         // Secondary System Background / Cards
    separator: '#E5E5EA',       // Separator lines / System Gray 4
    textPrimary: '#000000',     // Primary label text
    textSecondary: '#3A3A3C',   // Secondary label text / System Gray 6
    textTertiary: '#8E8E93',    // Subdued gray caption / System Gray
    success: '#30D158',         // Apple System Green (in-tune indicator)
    warning: '#FF9F0A',         // Apple System Orange
    error: '#FF453A',           // Apple System Red
  },
  dark: {
    primary: '#0A84FF',         // Apple System Blue (accent)
    background: '#000000',      // System Background (true black)
    surface: '#1C1C1E',         // Secondary System Background / Cards
    separator: '#2C2C2E',       // Separator lines / System Gray 4
    textPrimary: '#FFFFFF',     // Primary label text
    textSecondary: '#E5E5EA',   // Secondary label text
    textTertiary: '#8E8E93',    // Subdued gray caption / System Gray
    success: '#30D158',         // Apple System Green (in-tune indicator)
    warning: '#FF9F0A',         // Apple System Orange
    error: '#FF453A',           // Apple System Red
  },
} as const;

export type ThemeColors = typeof Colors.light;
export type ThemeColorKey = keyof ThemeColors;

// -------------------------------------------------------------
// Typography Stack (Apple HIG hierarchy)
// -------------------------------------------------------------
export const Fonts = {
  regular: 'Inter-Regular',
  semiBold: 'Inter-SemiBold',
  bold: 'Inter-Bold',
  mono: Platform.select({
    ios: 'ui-monospace',
    default: 'monospace',
  }) as string,
};

export const Typography = {
  largeTitle: {
    fontSize: 34,
    lineHeight: 41,
    fontFamily: Fonts.regular,
  },
  title1: {
    fontSize: 28,
    lineHeight: 34,
    fontFamily: Fonts.regular,
  },
  title2: {
    fontSize: 22,
    lineHeight: 28,
    fontFamily: Fonts.regular,
  },
  title3: {
    fontSize: 20,
    lineHeight: 25,
    fontFamily: Fonts.regular,
  },
  headline: {
    fontSize: 17,
    lineHeight: 22,
    fontFamily: Fonts.semiBold,
  },
  body: {
    fontSize: 17,
    lineHeight: 22,
    fontFamily: Fonts.regular,
  },
  callout: {
    fontSize: 16,
    lineHeight: 21,
    fontFamily: Fonts.regular,
  },
  footnote: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: Fonts.regular,
  },
  caption: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: Fonts.regular,
  },
};

export type TypographyKey = keyof typeof Typography;

// -------------------------------------------------------------
// Spacing, Border Radius & Elevation (Apple guidelines)
// -------------------------------------------------------------
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  round: 9999,
} as const;

export const Opacity = {
  disabled: 0.3,
  secondary: 0.6,
  primary: 1.0,
} as const;

// -------------------------------------------------------------
// Animations (Natural easing & Apple-like spring parameters)
// -------------------------------------------------------------
export const Animation = {
  Duration: {
    fast: 150,
    normal: 250,
    slow: 400,
  },
  // Apple HIG-like spring config
  Spring: {
    damping: 20,
    stiffness: 120,
    mass: 0.8,
  },
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
