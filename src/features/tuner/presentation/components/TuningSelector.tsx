import React from 'react';
import { StyleSheet, Text, TouchableOpacity, ScrollView, View } from 'react-native';
import { useTunerStore } from '../state/useTunerStore';
import { Tuning } from '../../domain/models/TunerModels';
import { useTheme } from '../hooks/useTheme';
import { HapticsService } from '@/core/haptics/services/HapticsService';
import { Fonts } from '@/constants/theme';

export function TuningSelector() {
  const theme = useTheme();
  const { activeInstrument, activeTuning, setTuning } = useTunerStore();

  const handlePress = (tuning: Tuning) => {
    if (tuning.id !== activeTuning.id) {
      setTuning(tuning);
      HapticsService.selection();
    }
  };

  return (
    <View style={styles.outerContainer}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {activeInstrument.tunings.map((tuning) => {
          const isSelected = tuning.id === activeTuning.id;
          return (
            <TouchableOpacity
              key={tuning.id}
              style={[
                styles.chipButton,
                {
                  borderColor: isSelected ? theme.accent : theme.border,
                  backgroundColor: isSelected ? theme.accent : theme.card,
                },
              ]}
              onPress={() => handlePress(tuning)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.chipLabel,
                  {
                    color: isSelected ? '#FFFFFF' : theme.textSecondary,
                    fontFamily: isSelected ? Fonts.bold : Fonts.semiBold,
                  },
                ]}
              >
                {tuning.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    width: '100%',
    height: 38,
    marginVertical: 4,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 8,
    alignItems: 'center',
  },
  chipButton: {
    paddingHorizontal: 16,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  chipLabel: {
    fontSize: 13,
  },
});
