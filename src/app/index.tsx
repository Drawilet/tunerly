import React, { useEffect } from 'react';
import { StyleSheet, View, Text, StatusBar, SafeAreaView, Platform } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useTuner } from '@/features/tuner/presentation/hooks/useTuner';
import { useTunerStore } from '@/features/tuner/presentation/state/useTunerStore';
import { TunerDisplay } from '@/features/tuner/presentation/components/TunerDisplay';
import { StringSelector } from '@/features/tuner/presentation/components/StringSelector';
import { PermissionGate } from '@/features/tuner/presentation/components/PermissionGate';

const queryClient = new QueryClient();

function TunerScreen() {
  const { startTuning, stopTuning } = useTuner();
  const microphonePermission = useTunerStore((s) => s.microphonePermission);

  // Auto-start listening on screen mount
  useEffect(() => {
    startTuning();
    return () => {
      stopTuning();
    };
  }, [startTuning, stopTuning]);

  // If permission is explicitly denied, show the permission request gate
  if (microphonePermission === false) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <PermissionGate onRequestPermission={startTuning} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      
      {/* Brand Header */}
      <View style={styles.header}>
        <Text style={styles.brandTitle}>TUNERLY</Text>
        <Text style={styles.brandSubtitle}>chromatic pitch tool</Text>
      </View>

      {/* Main Tuner Dial/Needle Area */}
      <View style={styles.tunerWrapper}>
        <TunerDisplay />
      </View>

      {/* String Selection / Action Panel */}
      <View style={styles.selectorWrapper}>
        <StringSelector />
      </View>
    </SafeAreaView>
  );
}

export default function HomeScreen() {
  return (
    <QueryClientProvider client={queryClient}>
      <View style={styles.container}>
        <TunerScreen />
      </View>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#000000',
    paddingTop: Platform.OS === 'android' ? 40 : 0,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    marginTop: 24,
    gap: 4,
  },
  brandTitle: {
    fontSize: 16,
    color: '#FFFFFF',
    letterSpacing: 8,
    fontFamily: 'Outfit-Bold',
  },
  brandSubtitle: {
    fontSize: 10,
    color: '#3E414C',
    letterSpacing: 2,
    textTransform: 'uppercase',
    fontFamily: 'Outfit-SemiBold',
  },
  tunerWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectorWrapper: {
    paddingBottom: 48,
  },
});
