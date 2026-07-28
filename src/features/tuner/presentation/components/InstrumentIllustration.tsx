import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

interface Props {
  instrumentId: string;
}

export function InstrumentIllustration({ instrumentId }: Props) {

  // Animation values for each instrument illustration
  const guitarScale = useSharedValue(instrumentId === 'guitar' ? 1 : 0.85);
  const guitarOpacity = useSharedValue(instrumentId === 'guitar' ? 1 : 0);

  const bassScale = useSharedValue(instrumentId === 'bass' ? 1 : 0.85);
  const bassOpacity = useSharedValue(instrumentId === 'bass' ? 1 : 0);

  const ukuleleScale = useSharedValue(instrumentId === 'ukulele' ? 1 : 0.85);
  const ukuleleOpacity = useSharedValue(instrumentId === 'ukulele' ? 1 : 0);

  const violinScale = useSharedValue(instrumentId === 'violin' ? 1 : 0.85);
  const violinOpacity = useSharedValue(instrumentId === 'violin' ? 1 : 0);

  useEffect(() => {
    const configSpring = { damping: 15, stiffness: 100 };
    const configTiming = { duration: 250 };

    guitarScale.value = withSpring(instrumentId === 'guitar' ? 1 : 0.85, configSpring);
    guitarOpacity.value = withTiming(instrumentId === 'guitar' ? 1 : 0, configTiming);

    bassScale.value = withSpring(instrumentId === 'bass' ? 1 : 0.85, configSpring);
    bassOpacity.value = withTiming(instrumentId === 'bass' ? 1 : 0, configTiming);

    ukuleleScale.value = withSpring(instrumentId === 'ukulele' ? 1 : 0.85, configSpring);
    ukuleleOpacity.value = withTiming(instrumentId === 'ukulele' ? 1 : 0, configTiming);

    violinScale.value = withSpring(instrumentId === 'violin' ? 1 : 0.85, configSpring);
    violinOpacity.value = withTiming(instrumentId === 'violin' ? 1 : 0, configTiming);
  }, [instrumentId, guitarScale, guitarOpacity, bassScale, bassOpacity, ukuleleScale, ukuleleOpacity, violinScale, violinOpacity]);

  const guitarStyle = useAnimatedStyle(() => ({
    opacity: guitarOpacity.value,
    transform: [{ scale: guitarScale.value }],
  }));

  const bassStyle = useAnimatedStyle(() => ({
    opacity: bassOpacity.value,
    transform: [{ scale: bassScale.value }],
  }));

  const ukuleleStyle = useAnimatedStyle(() => ({
    opacity: ukuleleOpacity.value,
    transform: [{ scale: ukuleleScale.value }],
  }));

  const violinStyle = useAnimatedStyle(() => ({
    opacity: violinOpacity.value,
    transform: [{ scale: violinScale.value }],
  }));

  const renderGuitar = () => {
    return (
      <Animated.View style={[styles.illustrationWrapper, guitarStyle]}>
        {/* Neck */}
        <View style={[styles.neck, { backgroundColor: '#8A6D55', width: 34, height: 60 }]} />
        {/* Headstock body */}
        <View style={[styles.headstockBody, { backgroundColor: '#4A3423', width: 66, height: 120, borderRadius: 12 }]}>
          {/* Center accent plate */}
          <View style={{ backgroundColor: '#2B1C10', width: 22, height: 90, borderRadius: 4, marginTop: 15 }} />
        </View>
        {/* 6 Pegs */}
        {/* Left Side */}
        <View style={[styles.pegLeft, { top: 32 }]} />
        <View style={[styles.pegLeft, { top: 62 }]} />
        <View style={[styles.pegLeft, { top: 92 }]} />
        {/* Right Side */}
        <View style={[styles.pegRight, { top: 32 }]} />
        <View style={[styles.pegRight, { top: 62 }]} />
        <View style={[styles.pegRight, { top: 92 }]} />
      </Animated.View>
    );
  };

  const renderBass = () => {
    return (
      <Animated.View style={[styles.illustrationWrapper, bassStyle]}>
        {/* Neck */}
        <View style={[styles.neck, { backgroundColor: '#5A5E65', width: 38, height: 60 }]} />
        {/* Headstock body */}
        <View style={[styles.headstockBody, { backgroundColor: '#1C1D21', width: 72, height: 130, borderTopLeftRadius: 18, borderTopRightRadius: 8, borderBottomLeftRadius: 10, borderBottomRightRadius: 10 }]}>
          {/* Asymmetrical carve line */}
          <View style={{ backgroundColor: '#31353D', width: 6, height: 100, borderRadius: 3, position: 'absolute', right: 10, top: 15 }} />
        </View>
        {/* 4 large pegs (clover/heavy style) */}
        {/* Left Side */}
        <View style={[styles.pegLeft, { top: 36, width: 22, height: 10, borderRadius: 5 }]} />
        <View style={[styles.pegLeft, { top: 76, width: 22, height: 10, borderRadius: 5 }]} />
        {/* Right Side */}
        <View style={[styles.pegRight, { top: 36, width: 22, height: 10, borderRadius: 5 }]} />
        <View style={[styles.pegRight, { top: 76, width: 22, height: 10, borderRadius: 5 }]} />
      </Animated.View>
    );
  };

  const renderUkulele = () => {
    return (
      <Animated.View style={[styles.illustrationWrapper, ukuleleStyle]}>
        {/* Neck */}
        <View style={[styles.neck, { backgroundColor: '#CBA17E', width: 24, height: 50 }]} />
        {/* Headstock body */}
        <View style={[styles.headstockBody, { backgroundColor: '#9E7451', width: 50, height: 90, borderRadius: 10 }]}>
          {/* Visual slot carve */}
          <View style={{ backgroundColor: '#6E4E33', width: 14, height: 60, borderRadius: 3, marginTop: 15 }} />
        </View>
        {/* 4 Pegs */}
        <View style={[styles.pegLeft, { top: 24, width: 16, height: 6 }]} />
        <View style={[styles.pegLeft, { top: 56, width: 16, height: 6 }]} />
        <View style={[styles.pegRight, { top: 24, width: 16, height: 6 }]} />
        <View style={[styles.pegRight, { top: 56, width: 16, height: 6 }]} />
      </Animated.View>
    );
  };

  const renderViolin = () => {
    return (
      <Animated.View style={[styles.illustrationWrapper, violinStyle]}>
        {/* Neck */}
        <View style={[styles.neck, { backgroundColor: '#B87242', width: 20, height: 60 }]} />
        {/* Scroll Box */}
        <View style={[styles.headstockBody, { backgroundColor: '#703A16', width: 38, height: 100, borderRadius: 6 }]}>
          {/* Scroll spiral top */}
          <View style={{ backgroundColor: '#4C240A', width: 24, height: 24, borderRadius: 12, position: 'absolute', top: -14 }} />
          {/* Peg box empty slot */}
          <View style={{ backgroundColor: '#2E1505', width: 12, height: 70, borderRadius: 3, marginTop: 18 }} />
        </View>
        {/* Sideways Tuning Pegs */}
        <View style={[styles.pegLeft, { top: 28, width: 24, height: 6, backgroundColor: '#1A1A1A' }]} />
        <View style={[styles.pegLeft, { top: 60, width: 24, height: 6, backgroundColor: '#1A1A1A' }]} />
        <View style={[styles.pegRight, { top: 44, width: 24, height: 6, backgroundColor: '#1A1A1A' }]} />
        <View style={[styles.pegRight, { top: 76, width: 24, height: 6, backgroundColor: '#1A1A1A' }]} />
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      {renderGuitar()}
      {renderBass()}
      {renderUkulele()}
      {renderViolin()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 140,
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  illustrationWrapper: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
  neck: {
    position: 'absolute',
    bottom: 0,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
  },
  headstockBody: {
    position: 'absolute',
    bottom: 50,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  pegLeft: {
    position: 'absolute',
    left: 14,
    width: 20,
    height: 8,
    borderRadius: 3,
    backgroundColor: '#C0C0C0',
    borderWidth: 1,
    borderColor: '#A0A0A0',
  },
  pegRight: {
    position: 'absolute',
    right: 14,
    width: 20,
    height: 8,
    borderRadius: 3,
    backgroundColor: '#C0C0C0',
    borderWidth: 1,
    borderColor: '#A0A0A0',
  },
});
