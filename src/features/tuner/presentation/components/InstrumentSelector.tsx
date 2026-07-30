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
  const { isCompact, isTablet, isDesktop } = useResponsive();

  // Use percentage width with a maxWidth cap instead of re-subtracting parent padding.
  // The parent already applies horizontal padding; this avoids double-subtraction.
  const containerMaxWidth = (isTablet || isDesktop) ? 600 : 380;
  const containerHeight = isDesktop ? 76 : (isTablet ? 70 : 64);
  const tabLabelFontSize = isCompact ? 10 : (isDesktop ? 14 : (isTablet ? 12 : 11));
  // tabWidth is computed dynamically inside render via onLayout; use '25%' flex instead.
  const tabFlex = 1;

  // Find active index
  const activeIndex = SUPPORTED_INSTRUMENTS.findIndex((inst) => inst.id === activeInstrument.id);

  // Animate the indicator using a percentage index (0–3) mapped to left: 0%, 25%, 50%, 75%.
  // This avoids a fixed pixel tabWidth that would be stale when flex layout changes.
  const indicatorIndex = useSharedValue(activeIndex);

  useEffect(() => {
    indicatorIndex.value = withSpring(activeIndex, Animation.Spring);
  }, [activeIndex, indicatorIndex]);

  const activeIndicatorStyle = useAnimatedStyle(() => {
    // Each tab occupies 25% of the container; translate by that amount per step.
    return {
      transform: [{ translateX: 0 }],
      left: `${indicatorIndex.value * 25}%`,
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
    const iconScale = isDesktop ? 1.35 : (isTablet ? 1.15 : 1.0);

    const getIcon = () => {
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
      <View style={{ transform: [{ scale: iconScale }] }}>
        {getIcon()}
      </View>
    );
  };

  return (
    <View
      style={[
        styles.container,
        {
          width: '100%',
          maxWidth: containerMaxWidth,
          height: containerHeight,
          backgroundColor: theme.isDark ? '#1C1C1E' : '#E5E5EA',
          borderColor: theme.border,
        },
      ]}
    >
      {/* Sliding Tab Pill Background — width is set to 25% to match the flex tabs */}
      <Animated.View
        style={[
          styles.activeIndicator,
          activeIndicatorStyle,
          {
            width: '25%',
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
            style={[styles.tabButton, { flex: tabFlex }]}
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
                  fontSize: tabLabelFontSize,
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
    alignSelf: 'center',
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
    flexShrink: 1,
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
