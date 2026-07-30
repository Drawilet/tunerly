import React, { useEffect } from 'react';
import { DarkTheme, DefaultTheme, ThemeProvider, Slot } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { useStoreHydrated } from '@/features/tuner/presentation/state/useTunerStore';
import { useActiveColorScheme } from '@/features/tuner/presentation/hooks/useTheme';

// Keep the splash screen visible until we explicitly hide it after fonts load
SplashScreen.preventAutoHideAsync().catch(() => {});

/**
 * RootLayout
 *
 * Initialization order (enforced by render guards):
 *  1. Fonts load (useFonts).
 *  2. Zustand store hydrates from localStorage (useStoreHydrated).
 *     — This resolves the persisted `themeMode` before any UI renders.
 *  3. Active color scheme is derived from the store (useActiveColorScheme).
 *     — Same derivation path used by every useTheme() call in the app.
 *  4. <ThemeProvider> is initialized with the resolved scheme.
 *  5. <Slot> renders the application.
 *
 * Returning `null` while fonts or store are loading keeps the native splash
 * screen visible (SplashScreen.preventAutoHideAsync is called above).
 * This guarantees the app never renders with a mixed or incorrect theme.
 */
export default function RootLayout() {
  const storeHydrated = useStoreHydrated();

  const [fontsLoaded, fontError] = useFonts({
    'Inter-Regular': require('../../assets/fonts/Inter-Regular.ttf'),
    'Inter-SemiBold': require('../../assets/fonts/Inter-SemiBold.ttf'),
    'Inter-Bold': require('../../assets/fonts/Inter-Bold.ttf'),
  });

  useEffect(() => {
    if (fontsLoaded) {
      console.log('Successfully loaded custom font families: Inter-Regular, Inter-SemiBold, Inter-Bold');
    }
    if (fontError) {
      console.error('Failed to load custom fonts:', fontError);
    }
  }, [fontsLoaded, fontError]);

  // Derive the active scheme from the same source as all useTheme() consumers.
  // This must be called unconditionally (Rules of Hooks), but the ThemeProvider
  // below is only rendered once both guards pass — so the Slot never sees a
  // mismatched theme on first paint.
  const activeColorScheme = useActiveColorScheme();

  // Block rendering until fonts are ready AND the store has been hydrated.
  // This prevents the race condition where themeMode reads the in-code default
  // ('system') before the persisted value ('light' | 'dark') is loaded.
  if ((!fontsLoaded && !fontError) || !storeHydrated) {
    return null;
  }

  return (
    <ThemeProvider value={activeColorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      <Slot />
    </ThemeProvider>
  );
}
