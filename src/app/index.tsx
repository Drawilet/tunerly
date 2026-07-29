import React, { useEffect } from 'react';
import { StyleSheet, View, Text, StatusBar, TouchableOpacity } from 'react-native';
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
import { DebugOverlay } from '@/features/tuner/presentation/components/DebugOverlay';
import { useResponsive } from '@/hooks/useResponsive';

const queryClient = new QueryClient();

function TunerScreen() {
  const theme = useTheme();
  const { startTuning, stopTuning } = useTuner();
  const microphonePermission = useTunerStore((s) => s.microphonePermission);
  const showDebug = useTunerStore((s) => s.showDebug);
  const setShowDebug = useTunerStore((s) => s.setShowDebug);
  const { insets, isTablet, contentMaxWidth, spacing } = useResponsive();

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
      <View
        style={[
          styles.container,
          {
            backgroundColor: theme.background,
            paddingTop: insets.top + spacing.md,
            paddingBottom: insets.bottom + spacing.md,
            paddingLeft: insets.left + spacing.md,
            paddingRight: insets.right + spacing.md,
            justifyContent: 'center',
            alignItems: 'center',
          },
        ]}
      >
        <PermissionGate onRequestPermission={startTuning} />
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.background,
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
          paddingLeft: insets.left + spacing.md,
          paddingRight: insets.right + spacing.md,
          alignItems: 'center',
          justifyContent: 'center',
        },
      ]}
    >
      <StatusBar
        barStyle={theme.isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.background}
      />
      
      <View
        style={{
          flex: 1,
          width: '100%',
          maxWidth: isTablet ? contentMaxWidth : '100%',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        {/* Brand Header */}
        <View style={styles.header}>
          <Text style={[styles.brandTitle, { color: theme.text }]}>TUNERLY</Text>
          <Text style={[styles.brandSubtitle, { color: theme.textTertiary }]}>chromatic tuner</Text>
          
          <TouchableOpacity
            style={[styles.debugToggle, { borderColor: theme.border }]}
            onPress={() => setShowDebug(!showDebug)}
            activeOpacity={0.7}
          >
            <Text style={[styles.debugToggleText, { color: showDebug ? theme.accent : theme.textTertiary }]}>
              DEBUG
            </Text>
          </TouchableOpacity>
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
      </View>

      <DebugOverlay />
    </View>
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
  header: {
    alignItems: 'center',
    marginTop: 8,
    gap: 2,
    width: '100%',
    position: 'relative',
    justifyContent: 'center',
  },
  debugToggle: {
    position: 'absolute',
    right: 20,
    top: 6,
    borderWidth: 0.5,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  debugToggleText: {
    fontSize: 9,
    fontFamily: Fonts.bold,
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
    marginTop: 4,
  },
  tunerWrapper: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectorWrapper: {
    width: '100%',
    paddingBottom: 8,
  },
});
