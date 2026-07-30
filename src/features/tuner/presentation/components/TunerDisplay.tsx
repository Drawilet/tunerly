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
// Component
// ---------------------------------------------------------------------------

export function TunerDisplay() {
  const theme = useTheme();
  const currentPitch = useTunerStore((s) => s.currentPitch);
  const selectedNote = useTunerStore((s) => s.selectedNote);
  const activeInstrument = useTunerStore((s) => s.activeInstrument);
  const isCalibrating = useTunerStore((s) => s.isCalibrating);
  const lastValidNote = useTunerStore((s) => s.lastValidNote);

  const { isCompact, isTablet, isDesktop, width, spacing, insets } = useResponsive();

  // ── Proportionally-scaled dimensions ─────────────────────────────────────
  // Each dimension has its own min/max so components adapt independently.
  const ringSize         = isCompact ? 120 : (isDesktop ? 220 : (isTablet ? 185 : 160));
  const ringWrapperH     = isCompact ? 130 : (isDesktop ? 240 : (isTablet ? 200 : 180));
  const noteFontSize     = isCompact ? 40 : (isDesktop ? 80 : (isTablet ? 64 : 56));
  const octaveFontSize   = isCompact ? 14 : (isDesktop ? 26 : (isTablet ? 22 : 18));
  const instrumentFontSz = isCompact ? 8 : (isDesktop ? 13 : (isTablet ? 11 : 9));
  const frequencyFontSz  = isCompact ? 10 : (isDesktop ? 16 : 12);
  const centsFontSz      = isCompact ? 11 : (isDesktop ? 18 : (isTablet ? 15 : 13));
  const scaleLabelFontSz = isCompact ? 9 : (isDesktop ? 15 : (isTablet ? 13 : 11));
  const illustrationH    = isCompact ? 100 : (isDesktop ? 240 : (isTablet ? 200 : 160));
  const dotSize          = isCompact ? 8 : (isDesktop ? 14 : 10);
  const borderWidth      = isDesktop ? 2.5 : 1.5;
  const needleW          = isDesktop ? 2.5 : 1.5;
  const needleH          = isDesktop ? 44 : 32;
  const needleTop        = isDesktop ? -18 : -12;

  const SCALE_WIDTH = Math.min(width - spacing.md * 2 - insets.left - insets.right, isDesktop ? 600 : (isTablet ? 450 : 360));

  const illustrationScale = isCompact ? 0.65 : (isDesktop ? 1.4 : (isTablet ? 1.15 : 1.0));

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
    <View style={styles.container}>
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
      <View style={[styles.illustrationContainer, { height: illustrationH }]}>
        <View style={{ transform: [{ scale: illustrationScale }] }}>
          <InstrumentIllustration instrumentId={activeInstrument.id} />
        </View>
      </View>

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
    justifyContent: 'center',
    gap: Spacing.md,
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
