import React, { useEffect } from 'react';
import { StyleSheet, View, StatusBar, TouchableOpacity, Platform } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useTuner } from '@/features/tuner/presentation/hooks/useTuner';
import { useTunerStore } from '@/features/tuner/presentation/state/useTunerStore';
import { TunerDisplay } from '@/features/tuner/presentation/components/TunerDisplay';
import { StringSelector } from '@/features/tuner/presentation/components/StringSelector';
import { InstrumentSelector } from '@/features/tuner/presentation/components/InstrumentSelector';
import { TuningSelector } from '@/features/tuner/presentation/components/TuningSelector';
import { PermissionGate } from '@/features/tuner/presentation/components/PermissionGate';
import { useTheme } from '@/features/tuner/presentation/hooks/useTheme';
import { Fonts, BorderRadius } from '@/constants/theme';
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
  const {
    insets,
    isWideLayout,
    contentMaxWidth,
    spacing,
    vSpacing,
    isCompactHeight,
    height,
    tunerScale,
  } = useResponsive();

  // Auto-start listening on screen mount
  useEffect(() => {
    startTuning();
    return () => {
      stopTuning();
    };
  }, [startTuning, stopTuning]);

  const themeMode = useTunerStore((s) => s.themeMode);
  const setThemeMode = useTunerStore((s) => s.setThemeMode);

  const toggleTheme = () => {
    if (themeMode === 'system') {
      setThemeMode('light');
    } else if (themeMode === 'light') {
      setThemeMode('dark');
    } else {
      setThemeMode('system');
    }
  };

  const getThemeText = () => {
    switch (themeMode) {
      case 'light': return 'LIGHT';
      case 'dark': return 'DARK';
      case 'system':
      default:
        return 'AUTO';
    }
  };

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

  /**
   * Tuner wrapper height budget (web only):
   * Cap the tuner area so the illustration and gauge do not become
   * comically large on tall laptop/desktop displays.
   */
  const tunerMaxHeight = Platform.OS === 'web'
    ? Math.min(height * 0.65, 480 * tunerScale)
    : undefined;

  /**
   * Flex spacer between sections.
   * On compact-height screens we give less flex to the spacers so the
   * tuner area (which has flex: 1) wins the extra budget.
   * On regular/expanded screens spacers grow comfortably.
   */
  const spacerFlex = isCompactHeight ? 0.3 : 0.5;

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
        },
      ]}
    >
      <StatusBar
        barStyle={theme.isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.background}
      />

      {/*
        Inner content column — uses flexible spacers rather than uniform gap.

        Layout order (top → bottom):
          [Header]
          [Spacer — compresses first]
          [Selectors Panel]
          [Spacer — compresses first]
          [Tuner Display — flex: 1, grows into available space]
          [String Selector]
          [Bottom padding — safe area]

        The tuner wrapper has flex: 1 so it absorbs all remaining vertical
        space after the header, selectors, and string row have been laid out.
        Spacers have a small flex value so they yield to the tuner area on
        short screens but provide breathing room on tall screens.
      */}
      <View
        style={{
          flex: 1,
          width: '100%',
          maxWidth: isWideLayout ? contentMaxWidth : '100%',
          alignSelf: 'center',
          alignItems: 'center',
          paddingTop: vSpacing.sm,
          paddingBottom: vSpacing.sm,
        }}
      >
        {/* ── Brand Header ─────────────────────────────────────────────── */}
        <View style={[styles.header, { paddingHorizontal: spacing.sm }]}>
          <TouchableOpacity
            style={[styles.themeToggle, { borderColor: theme.border, backgroundColor: theme.card }]}
            onPress={toggleTheme}
            activeOpacity={0.7}
          >
            <ThemedText
              themeColor={themeMode !== 'system' ? 'primary' : 'textTertiary'}
              style={styles.themeToggleText}
            >
              {getThemeText()}
            </ThemedText>
          </TouchableOpacity>

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

        {/* ── Spacer (breathes before selectors) ───────────────────────── */}
        <View style={{ flex: spacerFlex, minHeight: vSpacing.xs, maxHeight: 24 }} />

        {/* ── Selectors Panel (Instrument + Tuning) ────────────────────── */}
        <View style={[styles.selectorsPanel, { gap: vSpacing.xs }]}>
          <InstrumentSelector />
          <TuningSelector />
        </View>

        {/* ── Spacer (breathes before tuner) ───────────────────────────── */}
        <View style={{ flex: spacerFlex, minHeight: vSpacing.xs, maxHeight: 24 }} />

        {/* ── Main Tuner Display — grows to fill available space ────────── */}
        <View style={[styles.tunerWrapper, tunerMaxHeight ? { maxHeight: tunerMaxHeight } : {}]}>
          <TunerDisplay />
        </View>

        {/* ── Small spacer above string selector ───────────────────────── */}
        <View style={{ height: vSpacing.sm }} />

        {/* ── String Selection Panel ────────────────────────────────────── */}
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
  themeToggle: {
    position: 'absolute',
    left: 20,
    top: 6,
    borderWidth: 0.5,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  themeToggleText: {
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
  },
  tunerWrapper: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectorWrapper: {
    width: '100%',
  },
});
