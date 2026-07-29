import React, { useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useTunerStore } from '../state/useTunerStore';
import { SUPPORTED_INSTRUMENTS, Instrument } from '../../domain/models/TunerModels';
import { useTheme } from '../hooks/useTheme';
import { HapticsService } from '@/core/haptics/services/HapticsService';
import { Fonts, Animation, BorderRadius, Spacing } from '@/constants/theme';
import { useResponsive } from '@/hooks/useResponsive';

export function InstrumentSelector() {
  const theme = useTheme();
  const { activeInstrument, setInstrument } = useTunerStore();
  const { width: windowWidth, spacing } = useResponsive();

  // Define total control width based on screen width
  const containerWidth = Math.min(windowWidth - spacing.md * 2, 360);
  const tabWidth = (containerWidth - 6) / 4; // 4 items, 3px padding on each side

  // Find active index
  const activeIndex = SUPPORTED_INSTRUMENTS.findIndex((inst) => inst.id === activeInstrument.id);

  const translateX = useSharedValue(activeIndex * tabWidth);

  useEffect(() => {
    translateX.value = withSpring(activeIndex * tabWidth, Animation.Spring);
  }, [activeIndex, tabWidth, translateX]);

  const activeIndicatorStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  const handlePress = (instrument: Instrument) => {
    if (instrument.id !== activeInstrument.id) {
      setInstrument(instrument);
      HapticsService.selection();
    }
  };

  // Render a minimal geometric representation icon for each instrument type
  const renderInstrumentIcon = (id: string, isSelected: boolean) => {
    const iconColor = isSelected ? theme.accent : theme.textTertiary;

    switch (id) {
      case 'guitar':
        return (
          <View style={styles.iconContainer}>
            {/* Guitar Neck */}
            <View style={[styles.miniNeck, { backgroundColor: iconColor, height: 12, top: 4 }]} />
            {/* Guitar Body */}
            <View style={[styles.miniBody, { backgroundColor: iconColor, width: 10, height: 12, borderRadius: 3, top: 14 }]} />
          </View>
        );
      case 'bass':
        return (
          <View style={styles.iconContainer}>
            {/* Bass Neck (longer) */}
            <View style={[styles.miniNeck, { backgroundColor: iconColor, height: 16, top: 2 }]} />
            {/* Bass Body */}
            <View style={[styles.miniBody, { backgroundColor: iconColor, width: 11, height: 11, borderRadius: 2, top: 15 }]} />
          </View>
        );
      case 'ukulele':
        return (
          <View style={styles.iconContainer}>
            {/* Ukulele Neck */}
            <View style={[styles.miniNeck, { backgroundColor: iconColor, height: 8, top: 6 }]} />
            {/* Ukulele Body */}
            <View style={[styles.miniBody, { backgroundColor: iconColor, width: 8, height: 10, borderRadius: 4, top: 12 }]} />
          </View>
        );
      case 'violin':
        return (
          <View style={styles.iconContainer}>
            {/* Violin Scroll/Peg box */}
            <View style={[styles.miniNeck, { backgroundColor: iconColor, height: 10, top: 4 }]} />
            {/* Hourglass shape body using two connected shapes */}
            <View style={[styles.miniBody, { backgroundColor: iconColor, width: 9, height: 11, borderRadius: 4, top: 12 }]} />
            <View style={[styles.miniBody, { backgroundColor: iconColor, width: 7, height: 6, borderRadius: 3, top: 9 }]} />
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          width: containerWidth,
          backgroundColor: theme.isDark ? '#1C1C1E' : '#E5E5EA',
          borderColor: theme.border,
        },
      ]}
    >
      {/* Sliding Tab Pill Background */}
      <Animated.View
        style={[
          styles.activeIndicator,
          activeIndicatorStyle,
          {
            width: tabWidth,
            backgroundColor: theme.isDark ? '#2C2C2E' : '#FFFFFF',
          },
        ]}
      />

      {/* Tabs */}
      {SUPPORTED_INSTRUMENTS.map((inst) => {
        const isSelected = inst.id === activeInstrument.id;
        return (
          <TouchableOpacity
            key={inst.id}
            style={[styles.tabButton, { width: tabWidth }]}
            onPress={() => handlePress(inst)}
            activeOpacity={0.7}
          >
            {renderInstrumentIcon(inst.id, isSelected)}
            <Text
              style={[
                styles.tabLabel,
                {
                  color: isSelected ? theme.accent : theme.textTertiary,
                  fontFamily: isSelected ? Fonts.semiBold : Fonts.regular,
                },
              ]}
            >
              {inst.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 64,
    borderRadius: BorderRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 3,
    position: 'relative',
    borderWidth: 0.5,
  },
  activeIndicator: {
    height: '100%',
    borderRadius: BorderRadius.md,
    position: 'absolute',
    left: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  tabButton: {
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
    gap: Spacing.xs,
  },
  tabLabel: {
    fontSize: 11,
    letterSpacing: 0.3,
  },
  iconContainer: {
    width: 24,
    height: 26,
    position: 'relative',
    alignItems: 'center',
  },
  miniNeck: {
    position: 'absolute',
    width: 2,
    borderRadius: 1,
  },
  miniBody: {
    position: 'absolute',
  },
});
