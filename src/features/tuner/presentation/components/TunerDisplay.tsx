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

export function TunerDisplay() {
  const theme = useTheme();
  const currentPitch = useTunerStore((s) => s.currentPitch);
  const selectedNote = useTunerStore((s) => s.selectedNote);
  const activeInstrument = useTunerStore((s) => s.activeInstrument);
  const isCalibrating = useTunerStore((s) => s.isCalibrating);
  const lastValidNote = useTunerStore((s) => s.lastValidNote);

  const { isCompact, isTablet, spacing, width } = useResponsive();
  const SCALE_WIDTH = Math.min(width - spacing.md * 2, isTablet ? 400 : 330);

  const ringSize = isCompact ? 120 : (isTablet ? 185 : 160);
  const ringWrapperHeight = isCompact ? 130 : (isTablet ? 200 : 180);
  const noteFontSize = isCompact ? 40 : (isTablet ? 64 : 56);
  const octaveFontSize = isCompact ? 14 : (isTablet ? 22 : 18);
  const illustrationHeight = isCompact ? 100 : (isTablet ? 200 : 160);
  const dotSize = isCompact ? 8 : 10;
  const borderWidth = 1.5;

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
                : (theme.isDark ? '#3A3A3C' : '#D1D1D6'),
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
      <View style={[styles.tuningRingWrapper, { height: ringWrapperHeight }]}>
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
                  top: - (dotSize / 2 + borderWidth / 2),
                },
              ]}
            />
          </Animated.View>

          {/* Inner Content */}
          <View style={styles.noteContent}>
            <Text style={[styles.instrumentLabel, { color: theme.textTertiary }]}>
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

            <Text style={[styles.frequencyText, { color: theme.textSecondary }]}>
              {frequencyText}
            </Text>
          </View>
        </Animated.View>
      </View>

      {/* Middle Area: Dynamic Vector Instrument Headstock */}
      <View style={[styles.illustrationContainer, { height: illustrationHeight }]}>
        <View style={{ transform: [{ scale: isCompact ? 0.65 : (isTablet ? 1.15 : 1.0) }] }}>
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
            <Text style={[styles.scaleLabel, { color: theme.textTertiary }]}>♭</Text>
            <Text
              style={[
                styles.scaleLabel,
                {
                  color: currentPitch?.isInTune ? theme.success : theme.textTertiary,
                  fontFamily: currentPitch?.isInTune ? Fonts.semiBold : Fonts.regular,
                },
              ]}
            >
              0
            </Text>
            <Text style={[styles.scaleLabel, { color: theme.textTertiary }]}>♯</Text>
          </View>

          {/* The Animated Sweeping Needle */}
          <Animated.View style={[styles.needle, needleAnimatedStyle]} />
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
    height: 180,
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
