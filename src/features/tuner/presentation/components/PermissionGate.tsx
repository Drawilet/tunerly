import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';

interface PermissionGateProps {
  onRequestPermission: () => Promise<void>;
  error?: string | null;
}

export function PermissionGate({ onRequestPermission, error }: PermissionGateProps) {
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>🎙️</Text>
      </View>
      
      <Text style={styles.title}>Microphone Access Required</Text>
      
      <Text style={styles.description}>
        Tunerly needs access to your microphone to listen to your instrument&apos;s frequency and help you tune it accurately.
      </Text>

      {error && (
        <Text style={styles.errorText}>
          {error}
        </Text>
      )}

      <TouchableOpacity 
        style={styles.button} 
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
    backgroundColor: '#000000',
    gap: 24,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#16171D',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#1F2026',
  },
  icon: {
    fontSize: 32,
  },
  title: {
    fontSize: 22,
    color: '#FFFFFF',
    textAlign: 'center',
    fontFamily: 'Outfit-Bold',
  },
  description: {
    fontSize: 14,
    color: '#8E919A',
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 280,
    fontFamily: 'Outfit-Regular',
  },
  errorText: {
    fontSize: 12,
    color: '#FF453A',
    textAlign: 'center',
    fontFamily: 'Outfit-Regular',
  },
  button: {
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    marginTop: 12,
  },
  buttonText: {
    color: '#000000',
    fontSize: 15,
    fontFamily: 'Outfit-SemiBold',
  },
});
