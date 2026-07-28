import React, { useEffect } from 'react';
import { DarkTheme, DefaultTheme, ThemeProvider, Slot } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';
import { useFonts } from 'expo-font';

import { AnimatedSplashOverlay } from '@/components/animated-icon';

// Keep the splash screen visible until we explicitly hide it after fonts load
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const colorScheme = useColorScheme();

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

  // The application should never render until the fonts are fully loaded
  if (!fontsLoaded) {
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      <Slot />
    </ThemeProvider>
  );
}
