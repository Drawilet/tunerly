import React, { useEffect } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  Extrapolation,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated';
import { useTunerStore } from '../state/useTunerStore';
import { useTheme } from '../hooks/useTheme';
import { InstrumentIllustration } from './InstrumentIllustration';
import { Fonts, Animation, Spacing, BorderRadius } from '@/constants/theme';
import { useResponsive } from '@/hooks/useResponsive';

const TICK_COUNT = 11; // -50 to +50 in steps of 10

// ---------------------------------------------------------------------------
// Scale helpers
// ---------------------------------------------------------------------------

/**
 * Compute a dimension proportional to the continuous tunerScale, anchored at
 * a reference value (the size at 1.0 scale / standard 390 px mobile width).
 * Applies an independent min/max cap per-dimension so critical controls
 * (e.g. the ring) never shrink below usability or grow beyond aesthetics.
 */
function scaleDim(
  ref: number,
  tunerScale: number,
  min: number,
  max: number
): number {
  return Math.min(max, Math.max(min, Math.round(ref * tunerScale)));
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function TunerDisplay() {
  const theme = useTheme();
  const currentPitch = useTunerStore((s) => s.currentPitch);
  const selectedNote = useTunerStore((s) => s.selectedNote);
  const activeInstrument = useTunerStore((s) => s.activeInstrument);
  const isCalibrating = useTunerStore((s) => s.isCalibrating);
  const lastValidNote = useTunerStore((s) => s.lastValidNote);

  const { tunerScale, vSpacing, width, isWideLayout, isCompactHeight, isRegularHeight } = useResponsive();

  // ── Width-based proportional dimensions ──────────────────────────────────
  // These all track tunerScale (width-only) so the ring/note/gauge maintain
  // their visual weight regardless of screen height.
  const ringSize         = scaleDim(160, tunerScale, 100, 280);
  const ringWrapperH     = scaleDim(180, tunerScale, 120, 310);
  const noteFontSize     = scaleDim(56,  tunerScale, 36,  100);
  const octaveFontSize   = scaleDim(18,  tunerScale, 12,  32);
  const instrumentFontSz = scaleDim(9,   tunerScale, 7,   16);
  const frequencyFontSz  = scaleDim(12,  tunerScale, 9,   20);
  const centsFontSz      = scaleDim(13,  tunerScale, 10,  22);
  const scaleLabelFontSz = scaleDim(11,  tunerScale, 9,   18);
  const dotSize          = scaleDim(10,  tunerScale, 6,   18);
  const borderWidth      = tunerScale > 1.4 ? 2.5 : 1.5;
  const needleW          = tunerScale > 1.4 ? 2.5 : 1.5;
  const needleH          = scaleDim(32,  tunerScale, 20,  56);
  const needleTop        = scaleDim(-12, tunerScale, -8,  -20);

  // ── Height-based illustration sizing ─────────────────────────────────────
  // The instrument headstock illustration is the FIRST element to sacrifice
  // vertical space on short screens.  Ring, gauge, and controls are untouched.
  //
  //  compact  (<700 px usable) → illustration hidden entirely
  //  regular  (700-799 px)     → reduced to 60 px
  //  expanded (≥800 px)        → full size driven by tunerScale
  const illustrationH = isCompactHeight
    ? 0
    : isRegularHeight
      ? 60
      : scaleDim(160, tunerScale, 80, 280);
  const showIllustration = illustrationH > 0;

  /**
   * SCALE_WIDTH: the gauge card width.
   *
   * Previously computed as: Math.min(width - spacing.md * 2, capByBreakpoint)
   * This double-subtracted padding (the parent already applies horizontal
   * padding, so `width` already represents available content width).
   *
   * New approach: take a percentage of the available width, capped per
   * breakpoint.  The percentage-based value avoids re-subtracting padding.
   */
  const gaugeMaxWidth = isWideLayout ? 600 : 360;
  const SCALE_WIDTH = Math.min(width * 0.88, gaugeMaxWidth);

  const illustrationScale = tunerScale;

  const centsShared = useSharedValue(0);
  const inTuneOpacity = useSharedValue(0);

  // Update needle position and in-tune glow
  useEffect(() => {
    if (currentPitch) {
      // Spring needle animation using unified HIG spring
      centsShared.value = withSpring(currentPitch.cents, Animation.Spring);

      // Animate in-tune glow (threshold is 2 cents)
      inTuneOpacity.value = withTiming(currentPitch.isInTune ? 1 : 0, { duration: Animation.Duration.fast });
    } else {
      // Settle back to center when no pitch is detected
      centsShared.value = withSpring(0, Animation.Spring);
      inTuneOpacity.value = withTiming(0, { duration: Animation.Duration.fast });
    }
  }, [currentPitch, centsShared, inTuneOpacity]);

  // Animated style for the needle (movement + color change)
  const needleAnimatedStyle = useAnimatedStyle(() => {
    const translateX = interpolate(
      centsShared.value,
      [-50, 50],
      [-SCALE_WIDTH / 2 + 10, SCALE_WIDTH / 2 - 10],
      Extrapolation.CLAMP
    );

    const backgroundColor = interpolateColor(
      inTuneOpacity.value,
      [0, 1],
      [theme.accent, theme.success]
    );

    return {
      transform: [{ translateX }],
      backgroundColor,
    };
  });

  // Animated styles for the circular tuning ring wrapper
  const ringAnimatedStyle = useAnimatedStyle(() => {
    const borderColor = interpolateColor(
      inTuneOpacity.value,
      [0, 1],
      [theme.border, theme.success]
    );

    const shadowOpacity = interpolate(inTuneOpacity.value, [0, 1], [0.03, 0.2]);

    return {
      borderColor,
      shadowColor: borderColor,
      shadowOpacity,
    };
  });

  // Animated style for the rotating indicator dot on the circular ring
  const indicatorRotationStyle = useAnimatedStyle(() => {
    const rotation = interpolate(
      centsShared.value,
      [-50, 50],
      [-90, 90], // -90 deg (flat) to +90 deg (sharp)
      Extrapolation.CLAMP
    );

    return {
      transform: [{ rotate: `${rotation}deg` }],
    };
  });

  // Dynamic note name and frequency display
  const noteName = isCalibrating
    ? 'CAL'
    : (currentPitch
        ? currentPitch.noteName
        : (lastValidNote
            ? lastValidNote.noteName
            : (selectedNote ? selectedNote.name : '-')));

  const octave = isCalibrating
    ? ''
    : (currentPitch
        ? currentPitch.octave.toString()
        : (lastValidNote
            ? lastValidNote.octave.toString()
            : (selectedNote ? selectedNote.octave.toString() : '')));

  const frequencyText = isCalibrating
    ? 'estimating noise...'
    : (currentPitch ? `${currentPitch.frequency.toFixed(1)} Hz` : '--.- Hz');

  // Dynamic cents difference text
  let centsText = '';
  if (currentPitch) {
    const centsValue = Math.round(currentPitch.cents);
    if (centsValue > 0) {
      centsText = `+${centsValue}`;
    } else if (centsValue < 0) {
      centsText = `${centsValue}`;
    } else {
      centsText = '0';
    }
  } else {
    centsText = '--';
  }

  // Render horizontal tick marks for Apple-like gauge
  const renderTicks = () => {
    const ticks = [];
    for (let i = 0; i < TICK_COUNT; i++) {
      const centValue = -50 + i * 10;
      const isCenter = centValue === 0;
      const isMajor = centValue % 20 === 0 || isCenter;

      const leftPosition = (i / (TICK_COUNT - 1)) * (SCALE_WIDTH - 20) + 10;

      ticks.push(
        <View
          key={centValue}
          style={[
            styles.tick,
            {
              left: leftPosition,
              backgroundColor: isCenter
                ? (currentPitch?.isInTune ? theme.success : theme.accent)
                : theme.border,
            },
            isCenter && styles.centerTick,
            isMajor && !isCenter && styles.majorTick,
          ]}
        />
      );
    }
    return ticks;
  };

  return (
    <View style={[styles.container, { gap: vSpacing.sm }]}>
      {/* Upper Area: Circular Tuning Ring & Note Hero */}
      <View style={[styles.tuningRingWrapper, { height: ringWrapperH }]}>
        <Animated.View
          style={[
            styles.tuningRing,
            ringAnimatedStyle,
            {
              width: ringSize,
              height: ringSize,
              borderRadius: ringSize / 2,
              borderWidth: borderWidth,
              backgroundColor: theme.card,
              shadowOffset: { width: 0, height: 2 },
              shadowRadius: 8,
              elevation: 2,
            },
          ]}
        >
          {/* Rotating Indicator Dot Container */}
          <Animated.View style={[styles.indicatorWrapper, indicatorRotationStyle]}>
            <View
              style={[
                styles.indicatorDot,
                {
                  backgroundColor: currentPitch?.isInTune ? theme.success : theme.accent,
                  shadowColor: currentPitch?.isInTune ? theme.success : theme.accent,
                  width: dotSize,
                  height: dotSize,
                  borderRadius: dotSize / 2,
                  top: -(dotSize / 2 + borderWidth / 2),
                },
              ]}
            />
          </Animated.View>

          {/* Inner Content */}
          <View style={styles.noteContent}>
            <Text style={[styles.instrumentLabel, { color: theme.textTertiary, fontSize: instrumentFontSz }]}>
              {activeInstrument.name.toUpperCase()}
            </Text>

            <View style={styles.noteLabelWrapper}>
              <Text
                style={[
                  styles.noteText,
                  {
                    color: currentPitch?.isInTune ? theme.success : theme.text,
                    fontSize: noteFontSize,
                    lineHeight: noteFontSize + 8,
                  },
                ]}
              >
                {noteName}
              </Text>
              {octave !== '' && (
                <Text
                  style={[
                    styles.octaveText,
                    {
                      color: currentPitch?.isInTune ? theme.success : theme.textTertiary,
                      fontSize: octaveFontSize,
                    },
                  ]}
                >
                  {octave}
                </Text>
              )}
            </View>

            <Text style={[styles.frequencyText, { color: theme.textSecondary, fontSize: frequencyFontSz }]}>
              {frequencyText}
            </Text>
          </View>
        </Animated.View>
      </View>

      {/* Middle Area: Dynamic Vector Instrument Headstock */}
      {/* Hidden on compact-height screens to free vertical space for tuner */}
      {showIllustration && (
        <View style={[styles.illustrationContainer, { height: illustrationH }]}>
          <View style={{ transform: [{ scale: illustrationScale }] }}>
            <InstrumentIllustration instrumentId={activeInstrument.id} />
          </View>
        </View>
      )}

      {/* Lower Area: Refreshed Gauge Scale (Apple-style rounded Card) */}
      <View
        style={[
          styles.scaleCard,
          {
            width: SCALE_WIDTH,
            backgroundColor: theme.card,
            borderColor: theme.border,
            borderWidth: 0.5,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: theme.isDark ? 0 : 0.03,
            shadowRadius: 10,
            elevation: 1,
          },
        ]}
      >
        <View style={styles.scaleHeader}>
          <Text
            style={[
              styles.centsLabel,
              {
                color: isCalibrating
                  ? theme.warning
                  : (currentPitch?.isInTune ? theme.success : theme.textSecondary),
                fontFamily: isCalibrating || currentPitch?.isInTune ? Fonts.semiBold : Fonts.regular,
                fontSize: centsFontSz,
              },
            ]}
          >
            {isCalibrating
              ? 'calibrating noise floor...'
              : (currentPitch ? `${centsText} cents` : 'play a note')}
          </Text>
        </View>

        {/* The Gauge Board */}
        <View style={styles.scaleBoard}>
          {/* Ticks */}
          <View style={styles.ticksWrapper}>{renderTicks()}</View>

          {/* Labels (-50, 0, +50) */}
          <View style={styles.labelsWrapper}>
            <Text style={[styles.scaleLabel, { color: theme.textTertiary, fontSize: scaleLabelFontSz }]}>♭</Text>
            <Text
              style={[
                styles.scaleLabel,
                {
                  color: currentPitch?.isInTune ? theme.success : theme.textTertiary,
                  fontFamily: currentPitch?.isInTune ? Fonts.semiBold : Fonts.regular,
                  fontSize: scaleLabelFontSz,
                },
              ]}
            >
              0
            </Text>
            <Text style={[styles.scaleLabel, { color: theme.textTertiary, fontSize: scaleLabelFontSz }]}>♯</Text>
          </View>

          {/* The Animated Sweeping Needle */}
          <Animated.View
            style={[
              styles.needle,
              needleAnimatedStyle,
              {
                width: needleW,
                height: needleH,
                top: needleTop,
                marginLeft: -(needleW / 2),
              },
            ]}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    // NOTE: gap is now set inline via vSpacing.sm so it responds to height.
    width: '100%',
  },
  tuningRingWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    height: 180,
  },
  tuningRing: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  indicatorWrapper: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  indicatorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    top: -5,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  noteContent: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: 2,
  },
  instrumentLabel: {
    fontSize: 9,
    fontFamily: Fonts.semiBold,
    letterSpacing: 2,
  },
  noteLabelWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  noteText: {
    fontSize: 56,
    fontFamily: Fonts.semiBold,
    lineHeight: 64,
  },
  octaveText: {
    fontSize: 18,
    fontFamily: Fonts.regular,
    marginTop: 4,
  },
  frequencyText: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    letterSpacing: 0.3,
  },
  illustrationContainer: {
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scaleCard: {
    borderRadius: BorderRadius.xl,
    borderWidth: 0.5,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  scaleHeader: {
    alignItems: 'center',
  },
  centsLabel: {
    fontSize: 13,
    textTransform: 'lowercase',
  },
  scaleBoard: {
    height: 52,
    position: 'relative',
    justifyContent: 'center',
  },
  ticksWrapper: {
    height: 16,
    position: 'relative',
    width: '100%',
  },
  tick: {
    position: 'absolute',
    width: 1,
    height: 4,
    bottom: 0,
  },
  majorTick: {
    height: 8,
  },
  centerTick: {
    width: 1.5,
    height: 12,
    borderRadius: 0.75,
  },
  labelsWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
    paddingHorizontal: 10,
  },
  scaleLabel: {
    fontSize: 11,
  },
  needle: {
    position: 'absolute',
    width: 1.5,
    height: 32,
    top: -12,
    left: '50%',
    marginLeft: -0.75,
    borderRadius: 0.75,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
  },
});
