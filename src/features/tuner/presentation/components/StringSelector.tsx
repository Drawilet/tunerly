import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useTunerStore } from '../state/useTunerStore';
import { useTuner } from '../hooks/useTuner';
import { StringNote } from '../../domain/models/TunerModels';

export function StringSelector() {
  const { activeTuning, selectedNote, setSelectedNote, currentPitch } = useTunerStore();
  const { triggerPluck } = useTuner();

  // The active note being tuned (either manually selected, or auto-detected)
  const activeNote = selectedNote ?? currentPitch?.targetNote;

  const handleNotePress = (note: StringNote) => {
    setSelectedNote(note);
    // Pluck the note immediately in simulation for testing
    triggerPluck(note);
  };

  const handleAutoPress = () => {
    setSelectedNote(null);
  };

  return (
    <View style={styles.container}>
      {/* Auto/Manual Mode Selector */}
      <View style={styles.header}>
        <Text style={styles.tuningTitle}>{activeTuning.name} Guitar Tuning</Text>
      </View>

      <View style={styles.selectorRow}>
        {/* Auto Detection Toggle Peg */}
        <TouchableOpacity
          style={[styles.pegButton, !selectedNote && styles.pegButtonActive]}
          onPress={handleAutoPress}
          activeOpacity={0.8}
        >
          <Text style={[styles.pegText, !selectedNote && styles.pegTextActive]}>
            Auto
          </Text>
        </TouchableOpacity>

        {/* Individual Strings */}
        {activeTuning.notes.map((note) => {
          const isSelected = selectedNote?.id === note.id;
          const isActive = activeNote?.id === note.id;

          return (
            <TouchableOpacity
              key={note.id}
              style={[
                styles.pegButton,
                isSelected && styles.pegButtonSelected,
                !isSelected && isActive && styles.pegButtonActive,
              ]}
              onPress={() => handleNotePress(note)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.pegText,
                  isActive && styles.pegTextActive,
                  isSelected && styles.pegTextSelected,
                ]}
              >
                {note.name}
              </Text>
              <Text style={[styles.octaveText, isActive && styles.octaveTextActive]}>
                {note.octave}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 10,
  },
  header: {
    width: '100%',
    alignItems: 'center',
  },
  tuningTitle: {
    fontSize: 14,
    color: '#555861',
    fontFamily: 'Outfit-Bold',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  selectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    width: '100%',
    flexWrap: 'wrap',
  },
  pegButton: {
    width: 48,
    height: 64,
    borderRadius: 24,
    backgroundColor: '#0D0E11',
    borderWidth: 1,
    borderColor: '#1F2026',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  pegButtonActive: {
    borderColor: '#3E414C',
    backgroundColor: '#16171D',
  },
  pegButtonSelected: {
    borderColor: '#007AFF',
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
  },
  pegText: {
    fontSize: 16,
    color: '#555861',
    fontFamily: 'Outfit-Bold',
  },
  pegTextActive: {
    color: '#FFFFFF',
  },
  pegTextSelected: {
    color: '#007AFF',
  },
  octaveText: {
    fontSize: 10,
    color: '#3E414C',
    fontFamily: 'Outfit-SemiBold',
    marginTop: 2,
  },
  octaveTextActive: {
    color: '#8E919A',
  },
});
