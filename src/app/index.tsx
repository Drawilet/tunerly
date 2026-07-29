import React, { useEffect } from 'react';
import { StyleSheet, View, StatusBar, TouchableOpacity } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useTuner } from '@/features/tuner/presentation/hooks/useTuner';
import { useTunerStore } from '@/features/tuner/presentation/state/useTunerStore';
import { TunerDisplay } from '@/features/tuner/presentation/components/TunerDisplay';
import { StringSelector } from '@/features/tuner/presentation/components/StringSelector';
import { InstrumentSelector } from '@/features/tuner/presentation/components/InstrumentSelector';
import { TuningSelector } from '@/features/tuner/presentation/components/TuningSelector';
import { PermissionGate } from '@/features/tuner/presentation/components/PermissionGate';
import { useTheme } from '@/features/tuner/presentation/hooks/useTheme';
import { Fonts, BorderRadius, Spacing } from '@/constants/theme';
import { DebugOverlay } from '@/features/tuner/presentation/components/DebugOverlay';
import { useResponsive } from '@/hooks/useResponsive';
import { ThemedText } from '@/components/themed-text';

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
          <ThemedText style={styles.brandTitle}>TUNERLY</ThemedText>
          <ThemedText themeColor="textTertiary" style={styles.brandSubtitle}>chromatic tuner</ThemedText>
          
          <TouchableOpacity
            style={[styles.debugToggle, { borderColor: theme.border, backgroundColor: theme.card }]}
            onPress={() => setShowDebug(!showDebug)}
            activeOpacity={0.7}
          >
            <ThemedText
              themeColor={showDebug ? 'primary' : 'textTertiary'}
              style={styles.debugToggleText}
            >
              DEBUG
            </ThemedText>
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
    marginTop: Spacing.sm,
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
    borderRadius: BorderRadius.sm,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  debugToggleText: {
    fontSize: 9,
    letterSpacing: 0.5,
    fontFamily: Fonts.semiBold,
  },
  brandTitle: {
    fontSize: 14,
    letterSpacing: 5,
    fontFamily: Fonts.semiBold,
    textTransform: 'uppercase',
  },
  brandSubtitle: {
    fontSize: 9,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    fontFamily: Fonts.regular,
  },
  selectorsPanel: {
    width: '100%',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  tunerWrapper: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectorWrapper: {
    width: '100%',
    paddingBottom: Spacing.sm,
  },
});
