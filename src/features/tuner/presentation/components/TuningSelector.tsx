import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTunerStore } from '../state/useTunerStore';
import { HapticsService } from '@/core/haptics/services/HapticsService';
import { SelectionDropdown, DropdownOption } from '@/components/ui/SelectionDropdown';
import { Tuning } from '../../domain/models/TunerModels';

export function TuningSelector() {
  const { activeInstrument, activeTuning, setTuning } = useTunerStore();

  const handleSelect = (option: DropdownOption<Tuning>) => {
    const tuning = option.value;
    if (tuning.id !== activeTuning.id) {
      setTuning(tuning);
      HapticsService.selection();
    }
  };

  const dropdownOptions: DropdownOption<Tuning>[] = activeInstrument.tunings.map((tuning) => ({
    id: tuning.id,
    label: tuning.name,
    value: tuning,
  }));

  return (
    <View style={styles.outerContainer}>
      <SelectionDropdown
        options={dropdownOptions}
        selectedOptionId={activeTuning.id}
        onSelect={handleSelect}
        title="Select Tuning"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 4,
  },
});
