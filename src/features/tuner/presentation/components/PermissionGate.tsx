import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { Fonts } from '@/constants/theme';

interface PermissionGateProps {
  onRequestPermission: () => Promise<void>;
  error?: string | null;
}

export function PermissionGate({ onRequestPermission, error }: PermissionGateProps) {
  const theme = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.iconContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Text style={styles.icon}>🎙️</Text>
      </View>
      
      <Text style={[styles.title, { color: theme.text }]}>Microphone Access Required</Text>
      
      <Text style={[styles.description, { color: theme.textTertiary }]}>
        Tunerly needs access to your microphone to listen to your instrument&apos;s frequency and help you tune it accurately.
      </Text>

      {error && (
        <Text style={styles.errorText}>
          {error}
        </Text>
      )}

      <TouchableOpacity 
        style={[styles.button, { backgroundColor: theme.accent }]} 
        onPress={onRequestPermission}
        activeOpacity={0.8}
      >
        <Text style={styles.buttonText}>Enable Microphone</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 20,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  icon: {
    fontSize: 32,
  },
  title: {
    fontSize: 22,
    textAlign: 'center',
    fontFamily: Fonts.bold,
  },
  description: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 280,
    fontFamily: Fonts.regular,
  },
  errorText: {
    fontSize: 12,
    color: '#FF453A',
    textAlign: 'center',
    fontFamily: Fonts.regular,
  },
  button: {
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    marginTop: 12,
    shadowColor: '#0285FD',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: Fonts.bold,
  },
});
