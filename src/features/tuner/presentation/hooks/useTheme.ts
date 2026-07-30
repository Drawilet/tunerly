import { useColorScheme } from '@/hooks/use-color-scheme';
import { Platform } from 'react-native';
import { Colors } from '@/constants/theme';
import { useTunerStore } from '../state/useTunerStore';
import { useEffect } from 'react';

/**
 * useTheme — single source of truth for the active color scheme.
 *
 * Resolution order:
 *   1. Read `themeMode` from the Zustand store (persisted user preference).
 *   2. If `themeMode === 'system'`, delegate to the OS via `useColorScheme()`.
 *   3. Return a stable theme object from the resolved scheme.
 *
 * This hook is the *only* place where the OS color scheme and the user
 * preference are combined. All components that need theme values should call
 * this hook rather than calling `useColorScheme()` directly.
 *
 * The root layout's `<ThemeProvider>` also derives its value from this hook
 * (via the exported `useActiveColorScheme` helper) so there is guaranteed to
 * be exactly one resolution path across the entire component tree.
 */
export function useTheme() {
  const systemScheme = useColorScheme();
  const themeMode = useTunerStore((s) => s.themeMode);

  const scheme = themeMode === 'system'
    ? (systemScheme === 'light' ? 'light' : 'dark')
    : themeMode;

  const themeColors = Colors[scheme];

  // Synchronize the document body on web so the scroll area and OS chrome
  // match the in-app theme (avoids a white flash outside the #root element).
  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.body.style.backgroundColor = themeColors.background;
      document.body.style.color = themeColors.textPrimary;
      document.body.style.transition = 'background-color 0.3s ease, color 0.3s ease';
    }
  }, [scheme, themeColors]);

  return {
    background: themeColors.background,
    card: themeColors.surface,
    text: themeColors.textPrimary,
    textSecondary: themeColors.textSecondary,
    textTertiary: themeColors.textTertiary,
    border: themeColors.separator,
    accent: themeColors.primary,
    success: themeColors.success,
    warning: themeColors.warning,
    error: themeColors.error,
    tunerCircle: themeColors.surface,
    tunerInnerCircle: themeColors.background,
    isDark: scheme === 'dark',
    themeMode,
    scheme,
  };
}

/**
 * useActiveColorScheme
 *
 * Thin hook that returns only the resolved 'light' | 'dark' scheme string.
 * Used by the root layout to drive `<ThemeProvider>` from the same source
 * of truth as all component-level `useTheme()` calls.
 */
export function useActiveColorScheme(): 'light' | 'dark' {
  const systemScheme = useColorScheme();
  const themeMode = useTunerStore((s) => s.themeMode);
  return themeMode === 'system'
    ? (systemScheme === 'light' ? 'light' : 'dark')
    : themeMode;
}
