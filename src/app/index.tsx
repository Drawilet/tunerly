import React, { useEffect, useRef, useState, useCallback } from 'react';
import { StyleSheet, View, StatusBar, TouchableOpacity } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useTuner } from '@/features/tuner/presentation/hooks/useTuner';
import { useTunerStore } from '@/features/tuner/presentation/state/useTunerStore';
import { TunerDisplay } from '@/features/tuner/presentation/components/TunerDisplay';
import { StringSelector } from '@/features/tuner/presentation/components/StringSelector';
import { InstrumentSelector } from '@/features/tuner/presentation/components/InstrumentSelector';
import { TuningSelector } from '@/features/tuner/presentation/components/TuningSelector';
import { PermissionGate } from '@/features/tuner/presentation/components/PermissionGate';
import { CompletionOverlay } from '@/features/tuner/presentation/components/CompletionOverlay';
import { useTheme } from '@/features/tuner/presentation/hooks/useTheme';
import { useTuningProgress } from '@/features/tuner/presentation/hooks/useTuningProgress';
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
  const {
    insets,
    isTablet,
    isDesktop,
    contentMaxWidth,
    spacing,
    width,
  } = useResponsive();

  // ── Completion progress ────────────────────────────────────────────────
  const { completedNoteIds, allComplete, onStringCompleteRef, onAllCompleteRef } =
    useTuningProgress();

  // Track whether the confetti overlay is currently visible
  const [showCompletion, setShowCompletion] = useState(false);

  // Ref to the TunerDisplay ripple trigger (registered via prop callback)
  const rippleTriggerRef = useRef<(() => void) | null>(null);

  const handleRegisterRipple = useCallback((fn: () => void) => {
    rippleTriggerRef.current = fn;
  }, []);

  // Wire the per-string callback: fire ripple on the TunerDisplay ring
  useEffect(() => {
    onStringCompleteRef.current = (_noteId: string) => {
      rippleTriggerRef.current?.();
    };
  }, [onStringCompleteRef]);

  // Wire the all-complete callback: show the celebration overlay
  useEffect(() => {
    onAllCompleteRef.current = () => {
      setShowCompletion(true);
    };
  }, [onAllCompleteRef]);

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

  /**
   * The root container is ALWAYS mounted, regardless of permission state.
   *
   * This is critical for web layout stability: if we swap to a completely
   * different component tree when permission is denied and then back again
   * when it is granted, useWindowDimensions() and useSafeAreaInsets() are
   * re-evaluated on a freshly-mounted DOM subtree. The browser may report
   * slightly different viewport dimensions at that moment (e.g. because the
   * previous tree altered scroll/overflow or the safe-area context had not
   * yet settled), causing the zoomed/compressed layout regression.
   *
   * Solution: render the permission gate as an OVERLAY (StyleSheet.absoluteFill)
   * on top of the already-mounted tuner tree. The tuner tree remains in the DOM
   * throughout the permission flow, so its responsive measurements are always
   * taken in the final, stable layout context.
   */
  const showPermissionGate = microphonePermission === false;

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
          maxWidth: (isTablet || isDesktop) ? contentMaxWidth : '100%',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        {/* Brand Header */}
        <View style={styles.header}>
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

        {/* Selectors Panel (Instrument + Tuning) */}
        <View style={styles.selectorsPanel}>
          <InstrumentSelector />
          <TuningSelector />
        </View>

        {/* Main Tuner Display — grows to fill available space */}
        <View style={styles.tunerWrapper}>
          <TunerDisplay
            allComplete={allComplete}
            onRegisterRippleTrigger={handleRegisterRipple}
          />
        </View>

        {/* String Selection Panel */}
        <View style={styles.selectorWrapper}>
          <StringSelector completedNoteIds={completedNoteIds} />
        </View>
      </View>

      {/* Completion overlay — confetti + success message when all strings tuned */}
      <CompletionOverlay
        visible={showCompletion}
        screenWidth={width}
        onDismiss={() => setShowCompletion(false)}
      />

      {/*
        Permission gate renders as a full-screen overlay on top of the already-
        mounted tuner layout.  This preserves the root container and all its
        responsive measurements across the permission state transition, so
        useWindowDimensions() is never re-evaluated in a different DOM context.
      */}
      {showPermissionGate && (
        <View
          style={[
            StyleSheet.absoluteFill,
            styles.permissionOverlay,
            { backgroundColor: theme.background },
          ]}
        >
          <PermissionGate onRequestPermission={startTuning} />
        </View>
      )}

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
  permissionOverlay: {
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
});
