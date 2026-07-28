import React, { useEffect } from 'react';
import { View, StyleSheet, Text, Dimensions } from 'react-native';
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
import { Fonts } from '@/constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SCALE_WIDTH = Math.min(SCREEN_WIDTH - 48, 330);
const TICK_COUNT = 11; // -50 to +50 in steps of 10

export function TunerDisplay() {
  const theme = useTheme();
  const currentPitch = useTunerStore((s) => s.currentPitch);
  const lastValidNote = useTunerStore((s) => s.lastValidNote);
  const selectedNote = useTunerStore((s) => s.selectedNote);
  const activeInstrument = useTunerStore((s) => s.activeInstrument);

  const centsShared = useSharedValue(0);
  const inTuneOpacity = useSharedValue(0);

  // Update needle position and in-tune glow
  useEffect(() => {
    if (currentPitch) {
      // Spring needle animation
      centsShared.value = withSpring(currentPitch.cents, {
        damping: 18,
        stiffness: 100,
        mass: 0.8,
      });

      // Animate in-tune glow (threshold is 2 cents)
      inTuneOpacity.value = withTiming(currentPitch.isInTune ? 1 : 0, { duration: 150 });
    } else {
      // Settle back to center when no pitch is detected
      centsShared.value = withSpring(0, { damping: 20 });
      inTuneOpacity.value = withTiming(0, { duration: 150 });
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
      [theme.accent, theme.success]
    );

    const shadowOpacity = interpolate(inTuneOpacity.value, [0, 1], [0.15, 0.45]);

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
  const noteName = currentPitch?.noteName ?? lastValidNote?.noteName ?? selectedNote?.name ?? '-';
  const octave = currentPitch?.octave ?? lastValidNote?.octave ?? selectedNote?.octave ?? '';
  const frequencyText = currentPitch ? `${currentPitch.frequency.toFixed(1)} Hz` : '--.- Hz';

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
      <View style={styles.tuningRingWrapper}>
        <Animated.View
          style={[
            styles.tuningRing,
            ringAnimatedStyle,
            {
              backgroundColor: theme.card,
              shadowOffset: { width: 0, height: 4 },
              shadowRadius: 10,
              elevation: 4,
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
      <View style={styles.illustrationContainer}>
        <InstrumentIllustration instrumentId={activeInstrument.id} />
      </View>

      {/* Lower Area: Refreshed Gauge Scale (Apple-style rounded Card) */}
      <View
        style={[
          styles.scaleCard,
          {
            width: SCALE_WIDTH,
            backgroundColor: theme.card,
            borderColor: theme.border,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: theme.isDark ? 0 : 0.05,
            shadowRadius: 12,
            elevation: 3,
          },
        ]}
      >
        <View style={styles.scaleHeader}>
          <Text
            style={[
              styles.centsLabel,
              {
                color: currentPitch?.isInTune ? theme.success : theme.textSecondary,
                fontFamily: currentPitch?.isInTune ? Fonts.bold : Fonts.semiBold,
              },
            ]}
          >
            {centsText !== '--' ? `${centsText} cents` : 'play a note'}
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
                  fontFamily: currentPitch?.isInTune ? Fonts.bold : Fonts.regular,
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
    gap: 20,
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
    borderWidth: 3.5,
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
    width: 12,
    height: 12,
    borderRadius: 6,
    top: -7.5,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 5,
    elevation: 3,
  },
  noteContent: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: 2,
  },
  instrumentLabel: {
    fontSize: 10,
    fontFamily: Fonts.bold,
    letterSpacing: 1.5,
  },
  noteLabelWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  noteText: {
    fontSize: 56,
    fontFamily: Fonts.bold,
    lineHeight: 64,
  },
  octaveText: {
    fontSize: 18,
    fontFamily: Fonts.bold,
    marginTop: 6,
  },
  frequencyText: {
    fontSize: 13,
    fontFamily: Fonts.semiBold,
    letterSpacing: 0.3,
  },
  illustrationContainer: {
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scaleCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  scaleHeader: {
    alignItems: 'center',
  },
  centsLabel: {
    fontSize: 14,
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
    height: 6,
    bottom: 0,
  },
  majorTick: {
    height: 10,
  },
  centerTick: {
    width: 2.5,
    height: 14,
    borderRadius: 1,
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
    width: 2.5,
    height: 36,
    top: -14,
    left: '50%',
    marginLeft: -1.25,
    borderRadius: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
});
