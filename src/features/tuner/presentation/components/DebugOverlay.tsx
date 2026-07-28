import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { useTunerStore } from '../state/useTunerStore';
import { useTheme } from '../hooks/useTheme';
import { Fonts } from '@/constants/theme';

export function DebugOverlay() {
  const theme = useTheme();
  const { showDebug, debugData } = useTunerStore();

  if (!showDebug) return null;

  const { rms, frequency, confidence, stableFrames, noiseFloor, currentThreshold, state } = debugData;

  const stateColors: Record<string, string> = {
    calibrating: '#FF9500', // Orange
    silence: '#8E8E93', // Gray
    lowconfidence: '#FF3B30', // Red
    outofbounds: '#FF3B30', // Red
    unstable: '#FFCC00', // Yellow
    accepted: '#34C759', // Green
  };

  const stateColor = stateColors[state] || theme.textSecondary;

  return (
    <View style={[styles.container, { backgroundColor: theme.isDark ? 'rgba(28, 28, 30, 0.92)' : 'rgba(255, 255, 255, 0.92)', borderColor: theme.border }]}>
      <Text style={[styles.title, { color: theme.text, fontFamily: Fonts.bold }]}>DSP Telemetry</Text>
      
      <View style={styles.row}>
        <Text style={[styles.label, { color: theme.textSecondary, fontFamily: Fonts.regular }]}>Signal RMS:</Text>
        <Text style={[styles.value, { color: theme.text, fontFamily: Fonts.mono }]}>{rms.toFixed(5)}</Text>
      </View>

      <View style={styles.row}>
        <Text style={[styles.label, { color: theme.textSecondary, fontFamily: Fonts.regular }]}>Frequency:</Text>
        <Text style={[styles.value, { color: theme.text, fontFamily: Fonts.mono }]}>{frequency > 0 ? `${frequency.toFixed(2)} Hz` : '--'}</Text>
      </View>

      <View style={styles.row}>
        <Text style={[styles.label, { color: theme.textSecondary, fontFamily: Fonts.regular }]}>Confidence:</Text>
        <Text style={[styles.value, { color: theme.text, fontFamily: Fonts.mono }]}>{confidence.toFixed(3)}</Text>
      </View>

      <View style={styles.row}>
        <Text style={[styles.label, { color: theme.textSecondary, fontFamily: Fonts.regular }]}>Stable Frames:</Text>
        <Text style={[styles.value, { color: theme.text, fontFamily: Fonts.mono }]}>{stableFrames}</Text>
      </View>

      <View style={styles.row}>
        <Text style={[styles.label, { color: theme.textSecondary, fontFamily: Fonts.regular }]}>Noise Floor:</Text>
        <Text style={[styles.value, { color: theme.text, fontFamily: Fonts.mono }]}>{noiseFloor.toFixed(5)}</Text>
      </View>

      <View style={styles.row}>
        <Text style={[styles.label, { color: theme.textSecondary, fontFamily: Fonts.regular }]}>Gate Threshold:</Text>
        <Text style={[styles.value, { color: theme.text, fontFamily: Fonts.mono }]}>{currentThreshold.toFixed(5)}</Text>
      </View>

      <View style={styles.row}>
        <Text style={[styles.label, { color: theme.textSecondary, fontFamily: Fonts.regular }]}>Pipeline State:</Text>
        <Text style={[styles.value, { color: stateColor, fontFamily: Fonts.bold, fontSize: 10 }]}>{state.toUpperCase()}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 76,
    right: 16,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    width: 200,
    zIndex: 999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  title: {
    fontSize: 11,
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 2.5,
    alignItems: 'center',
  },
  label: {
    fontSize: 9.5,
  },
  value: {
    fontSize: 9.5,
  },
});
