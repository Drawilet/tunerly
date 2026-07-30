import React, { useEffect, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Easing,
  Platform,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { Fonts } from '@/constants/theme';

// ── Confetti configuration ─────────────────────────────────────────────────

const PARTICLE_COUNT = 25;
const CONFETTI_COLORS = ['#0A84FF', '#FFFFFF', '#30D158'];
const CONFETTI_DURATION_MS = 850;

interface ParticleConfig {
  id: number;
  color: string;
  width: number;
  height: number;
  borderRadius: number;
  startX: number; // % of screen width (0–1)
  startY: number; // starting offset from top (negative = above screen)
  rotation: number; // initial rotation deg
  rotationDelta: number; // delta rotation during fall
}

function generateParticles(): ParticleConfig[] {
  return Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
    id: i,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    width: 4 + Math.random() * 5,       // 4–9 px
    height: 8 + Math.random() * 7,      // 8–15 px
    borderRadius: Math.random() > 0.4 ? 4 : 2,
    startX: 0.05 + Math.random() * 0.9, // 5%–95% of width
    startY: -20 - Math.random() * 40,   // spawn above viewport
    rotation: Math.random() * 360,
    rotationDelta: (Math.random() - 0.5) * 180,
  }));
}

// ── Particle component ─────────────────────────────────────────────────────

interface ParticleProps {
  config: ParticleConfig;
  screenWidth: number;
  delay: number;
  reducedMotion: boolean;
}

function ConfettiParticle({ config, screenWidth, delay, reducedMotion }: ParticleProps) {
  const translateY = useMemo(() => new Animated.Value(0),              []);
  const opacity    = useMemo(() => new Animated.Value(1),              []);
  const rotate     = useMemo(() => new Animated.Value(config.rotation), [config.rotation]);

  useEffect(() => {
    if (reducedMotion) {
      opacity.setValue(0);
      return;
    }

    const animation = Animated.parallel([
      Animated.timing(translateY, {
        toValue: 150 + Math.random() * 80,
        duration: CONFETTI_DURATION_MS,
        delay,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: CONFETTI_DURATION_MS,
        delay,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(rotate, {
        toValue: config.rotation + config.rotationDelta,
        duration: CONFETTI_DURATION_MS,
        delay,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ]);

    animation.start();
    return () => animation.stop();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const rotateInterpolated = rotate.interpolate({
    inputRange: [0, 360],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: config.startX * screenWidth,
          top: config.startY,
          width: config.width,
          height: config.height,
          borderRadius: config.borderRadius,
          backgroundColor: config.color,
          opacity,
          transform: [
            { translateY },
            { rotate: rotateInterpolated },
          ],
        },
      ]}
    />
  );
}

// ── Main overlay ───────────────────────────────────────────────────────────

interface CompletionOverlayProps {
  visible: boolean;
  screenWidth: number;
  onDismiss: () => void;
}

/**
 * CompletionOverlay
 *
 * Renders above the tuner content (pointer-events: none so touches pass through).
 * When `visible` becomes true:
 *  1. 25 confetti particles fall from the top and fade out (~850 ms).
 *  2. A centered "Perfectly Tuned / Ready to play." message fades in then out.
 *  3. After ~1.2 s the `onDismiss` callback fires to return to normal state.
 *
 * Reduced motion: confetti is completely disabled; message still fades.
 */
export function CompletionOverlay({ visible, screenWidth, onDismiss }: CompletionOverlayProps) {
  const theme = useTheme();

  // Detect reduced-motion preference via lazy initializer — runs once on mount,
  // reads matchMedia synchronously so no setState-in-effect is needed.
  const [reducedMotion] = React.useState<boolean>(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
    return false;
  });

  const particles = useMemo(() => generateParticles(), []);

  // ── Message animation values ──────────────────────────────────────────
  // useMemo (not useRef) so Animated.Values are plain variables during render,
  // avoiding the react-hooks/refs lint violation.
  const msgOpacity   = useMemo(() => new Animated.Value(0),    []);
  const msgTranslate = useMemo(() => new Animated.Value(12),   []);
  const msgScale     = useMemo(() => new Animated.Value(0.96), []);

  useEffect(() => {
    if (!visible) {
      // Reset for next time
      msgOpacity.setValue(0);
      msgTranslate.setValue(12);
      msgScale.setValue(0.96);
      return;
    }

    // Fade-in
    Animated.parallel([
      Animated.timing(msgOpacity, {
        toValue: 1,
        duration: 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(msgTranslate, {
        toValue: 0,
        duration: 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(msgScale, {
        toValue: reducedMotion ? 1 : 1.0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto-dismiss after 1.2 s
    const dismiss = setTimeout(() => {
      Animated.timing(msgOpacity, {
        toValue: 0,
        duration: 250,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }).start(() => onDismiss());
    }, 1200);

    return () => clearTimeout(dismiss);
  }, [visible, msgOpacity, msgTranslate, msgScale, reducedMotion, onDismiss]);

  if (!visible) return null;

  return (
    <View
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
    >
      {/* ── Confetti particles ──────────────────────────────────────── */}
      {!reducedMotion &&
        particles.map((p, idx) => (
          <ConfettiParticle
            key={p.id}
            config={p}
            screenWidth={screenWidth}
            delay={idx * 18}
            reducedMotion={reducedMotion}
          />
        ))}

      {/* ── Success message ─────────────────────────────────────────── */}
      <View style={styles.messageWrapper} pointerEvents="none">
        <Animated.View
          style={[
            styles.messagePill,
            {
              backgroundColor: theme.isDark
                ? 'rgba(30, 30, 30, 0.92)'
                : 'rgba(255, 255, 255, 0.92)',
              borderColor: theme.isDark
                ? 'rgba(255, 255, 255, 0.08)'
                : 'rgba(0, 0, 0, 0.06)',
              opacity: msgOpacity,
              transform: [
                { translateY: msgTranslate },
                { scale: msgScale },
              ],
            },
          ]}
        >
          {/* Soft green dot */}
          <View style={[styles.successDot, { backgroundColor: '#30D158' }]} />

          <View style={styles.messageText}>
            <Animated.Text
              style={[styles.titleText, { color: theme.text }]}
            >
              Perfectly Tuned
            </Animated.Text>
            <Animated.Text
              style={[styles.subtitleText, { color: theme.textSecondary }]}
            >
              Ready to play.
            </Animated.Text>
          </View>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  messageWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messagePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 20,
    borderWidth: 0.5,
    // Glassmorphism shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  successDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  messageText: {
    gap: 2,
  },
  titleText: {
    fontSize: 17,
    fontFamily: Fonts.semiBold,
    letterSpacing: -0.3,
  },
  subtitleText: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    letterSpacing: 0.1,
  },
});
