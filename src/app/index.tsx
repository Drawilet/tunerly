import React, { useEffect } from 'react';
import { StyleSheet, View, Text, StatusBar, SafeAreaView, Platform } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useTuner } from '@/features/tuner/presentation/hooks/useTuner';
import { useTunerStore } from '@/features/tuner/presentation/state/useTunerStore';
import { TunerDisplay } from '@/features/tuner/presentation/components/TunerDisplay';
import { StringSelector } from '@/features/tuner/presentation/components/StringSelector';
import { InstrumentSelector } from '@/features/tuner/presentation/components/InstrumentSelector';
import { TuningSelector } from '@/features/tuner/presentation/components/TuningSelector';
import { PermissionGate } from '@/features/tuner/presentation/components/PermissionGate';
import { useTheme } from '@/features/tuner/presentation/hooks/useTheme';
import { Fonts } from '@/constants/theme';

const queryClient = new QueryClient();

function TunerScreen() {
  const theme = useTheme();
  const { startTuning, stopTuning } = useTuner();
  const microphonePermission = useTunerStore((s) => s.microphonePermission);

  // Auto-start listening on screen mount
  useEffect(() => {
    startTuning();
    return () => {
      stopTuning();
    };
  }, [startTuning, stopTuning]);

  // If permission is explicitly denied, show the permission request gate
  if (microphonePermission === false) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
        <PermissionGate onRequestPermission={startTuning} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <StatusBar
        barStyle={theme.isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.background}
      />
      
      {/* Brand Header */}
      <View style={styles.header}>
        <Text style={[styles.brandTitle, { color: theme.text }]}>TUNERLY</Text>
        <Text style={[styles.brandSubtitle, { color: theme.textTertiary }]}>chromatic tuner</Text>
      </View>

      {/* Selectors Panel (Instrument + Tuning) */}
      <View style={styles.selectorsPanel}>
        <InstrumentSelector />
        <TuningSelector />
      </View>

      {/* Main Tuner Illustration & Gauge Dial */}
      <View style={styles.tunerWrapper}>
        <TunerDisplay />
      </View>

      {/* String Selection / Action Panel */}
      <View style={styles.selectorWrapper}>
        <StringSelector />
      </View>
    </SafeAreaView>
  );
}

export default function HomeScreen() {
  const theme = useTheme();

  return (
    <QueryClientProvider client={queryClient}>
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <TunerScreen />
      </View>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? 40 : 0,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginTop: 16,
    gap: 2,
  },
  brandTitle: {
    fontSize: 15,
    letterSpacing: 6,
    fontFamily: Fonts.bold,
  },
  brandSubtitle: {
    fontSize: 9,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    fontFamily: Fonts.semiBold,
  },
  selectorsPanel: {
    width: '100%',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  tunerWrapper: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectorWrapper: {
    width: '100%',
    paddingBottom: Platform.OS === 'ios' ? 8 : 24,
  },
});
