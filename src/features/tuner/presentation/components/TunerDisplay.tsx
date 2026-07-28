import React, { useEffect } from 'react';
import { View, StyleSheet, Text, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  Extrapolation,
  withTiming,
} from 'react-native-reanimated';
import { useTunerStore } from '../state/useTunerStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SCALE_WIDTH = Math.min(SCREEN_WIDTH - 64, 320);
const TICK_COUNT = 11; // -50 to +50 in steps of 10

export function TunerDisplay() {
  const currentPitch = useTunerStore((s) => s.currentPitch);
  const lastValidNote = useTunerStore((s) => s.lastValidNote);
  const selectedNote = useTunerStore((s) => s.selectedNote);

  const centsShared = useSharedValue(0);
  const inTuneOpacity = useSharedValue(0);

  // Update needle position and in-tune glow
  useEffect(() => {
    if (currentPitch) {
      // Spring needle animation
      centsShared.value = withSpring(currentPitch.cents, {
        damping: 16,
        stiffness: 90,
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

  // Animated styles for the needle
  const needleAnimatedStyle = useAnimatedStyle(() => {
    const translateX = interpolate(
      centsShared.value,
      [-50, 50],
      [-SCALE_WIDTH / 2, SCALE_WIDTH / 2],
      Extrapolation.CLAMP
    );

    return {
      transform: [{ translateX }],
    };
  });

  // Animated style for the in-tune green glow effect
  const glowAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: inTuneOpacity.value,
      transform: [
        {
          scale: interpolate(inTuneOpacity.value, [0, 1], [0.95, 1.02]),
        },
      ],
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

  // Render horizontal tick marks
  const renderTicks = () => {
    const ticks = [];
    for (let i = 0; i < TICK_COUNT; i++) {
      const centValue = -50 + i * 10;
      const isCenter = centValue === 0;
      const isMajor = centValue % 20 === 0 || isCenter;
      
      const leftPosition = (i / (TICK_COUNT - 1)) * SCALE_WIDTH;

      ticks.push(
        <View
          key={centValue}
          style={[
            styles.tick,
            { left: leftPosition },
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
      {/* Target/Current Note Display with In-Tune Glow Background */}
      <View style={styles.noteContainer}>
        <Animated.View style={[styles.glowBackground, glowAnimatedStyle]} />
        <View style={styles.noteLabelWrapper}>
          <Text style={[styles.noteText, currentPitch?.isInTune && styles.noteTextInTune]}>
            {noteName}
          </Text>
          {octave !== '' && (
            <Text style={[styles.octaveText, currentPitch?.isInTune && styles.noteTextInTune]}>
              {octave}
            </Text>
          )}
        </View>
      </View>

      {/* Cents and Frequency Indicators */}
      <View style={styles.infoContainer}>
        <Text style={[styles.centsText, currentPitch?.isInTune && styles.centsTextInTune]}>
          {centsText !== '--' ? `${centsText} cents` : 'play a note'}
        </Text>
        <Text style={styles.frequencyText}>{frequencyText}</Text>
      </View>

      {/* Needle Scale Board */}
      <View style={[styles.scaleContainer, { width: SCALE_WIDTH }]}>
        {/* Tick Marks */}
        <View style={styles.ticksWrapper}>{renderTicks()}</View>

        {/* Labels (-50, 0, +50) */}
        <View style={styles.labelsWrapper}>
          <Text style={styles.scaleLabel}>♭</Text>
          <Text style={[styles.scaleLabel, currentPitch?.isInTune && styles.scaleLabelInTune]}>
            0
          </Text>
          <Text style={styles.scaleLabel}>♯</Text>
        </View>

        {/* The Animated Needle */}
        <Animated.View
          style={[
            styles.needle,
            currentPitch?.isInTune ? styles.needleInTune : styles.needleDefault,
            needleAnimatedStyle,
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 32,
  },
  noteContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0D0E11',
    borderWidth: 1,
    borderColor: '#1F2026',
    position: 'relative',
    overflow: 'hidden',
  },
  glowBackground: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderRadius: 80,
    borderColor: '#10B981',
    borderWidth: 2,
  },
  noteLabelWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  noteText: {
    fontSize: 76,
    color: '#FFFFFF',
    fontFamily: 'Outfit-Bold',
  },
  noteTextInTune: {
    color: '#10B981',
    textShadowColor: 'rgba(16, 185, 129, 0.5)',
    textShadowRadius: 10,
  },
  octaveText: {
    fontSize: 24,
    color: '#8E919A',
    marginTop: 12,
    fontFamily: 'Outfit-SemiBold',
  },
  infoContainer: {
    alignItems: 'center',
    gap: 4,
  },
  centsText: {
    fontSize: 18,
    color: '#8E919A',
    textTransform: 'lowercase',
    fontFamily: 'Outfit-SemiBold',
  },
  centsTextInTune: {
    color: '#10B981',
  },
  frequencyText: {
    fontSize: 14,
    fontFamily: 'Outfit-Regular',
    color: '#555861',
  },
  scaleContainer: {
    height: 60,
    justifyContent: 'center',
    position: 'relative',
    marginTop: 20,
  },
  ticksWrapper: {
    height: 20,
    position: 'relative',
    width: '100%',
  },
  tick: {
    position: 'absolute',
    width: 1,
    height: 8,
    backgroundColor: '#2E313A',
    bottom: 0,
  },
  majorTick: {
    height: 12,
    backgroundColor: '#555861',
  },
  centerTick: {
    width: 2,
    height: 18,
    backgroundColor: '#8E919A',
  },
  labelsWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingHorizontal: 4,
  },
  scaleLabel: {
    fontSize: 12,
    color: '#555861',
    fontFamily: 'Outfit-Regular',
  },
  scaleLabelInTune: {
    color: '#10B981',
  },
  needle: {
    position: 'absolute',
    width: 2,
    height: 40,
    top: -10,
    left: '50%',
    marginLeft: -1,
  },
  needleDefault: {
    backgroundColor: '#007AFF', // Premium blue for normal state
  },
  needleInTune: {
    backgroundColor: '#10B981', // Emerald green when in tune
    shadowColor: '#10B981',
    shadowRadius: 4,
    shadowOpacity: 0.8,
  },
});
