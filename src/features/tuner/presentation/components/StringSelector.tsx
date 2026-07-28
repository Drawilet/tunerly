import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useTunerStore } from '../state/useTunerStore';
import { useTuner } from '../hooks/useTuner';
import { StringNote } from '../../domain/models/TunerModels';
import { useTheme } from '../hooks/useTheme';
import { HapticsService } from '@/core/haptics/services/HapticsService';
import { Fonts } from '@/constants/theme';

export function StringSelector() {
  const theme = useTheme();
  const { activeInstrument, activeTuning, selectedNote, setSelectedNote, currentPitch } = useTunerStore();
  const { triggerPluck } = useTuner();

  // The active note being tuned (either manually selected, or auto-detected)
  const activeNote = selectedNote ?? currentPitch?.targetNote;

  const handleNotePress = (note: StringNote) => {
    setSelectedNote(note);
    triggerPluck(note);
    HapticsService.selection();
  };

  const handleAutoPress = () => {
    setSelectedNote(null);
    HapticsService.selection();
  };

  // Build the list of note names for active tuning display string
  const tuningNotesList = activeTuning.notes.map((n) => n.name).join(' ');

  return (
    <View style={styles.container}>
      {/* Active Tuning Detail Label */}
      <View style={styles.header}>
        <Text style={[styles.tuningLabel, { color: theme.textSecondary }]}>
          {activeInstrument.name} • {activeTuning.name} ({tuningNotesList})
        </Text>
      </View>

      <View style={styles.selectorRow}>
        {/* Auto Detection Toggle Peg */}
        <TouchableOpacity
          style={[
            styles.pegButton,
            {
              backgroundColor: !selectedNote ? theme.accent : theme.card,
              borderColor: !selectedNote ? theme.accent : theme.border,
            },
          ]}
          onPress={handleAutoPress}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.pegText,
              {
                color: !selectedNote ? '#FFFFFF' : theme.textSecondary,
                fontFamily: !selectedNote ? Fonts.bold : Fonts.semiBold,
              },
            ]}
          >
            Auto
          </Text>
        </TouchableOpacity>

        {/* Individual Strings */}
        {activeTuning.notes.map((note) => {
          const isSelected = selectedNote?.id === note.id;
          const isActive = activeNote?.id === note.id;

          // Background styling for native iOS buttons
          let buttonBg = theme.card;
          let buttonBorder = theme.border;
          let textColor = theme.textSecondary;
          let octaveColor = theme.textTertiary;

          if (isSelected) {
            buttonBg = theme.accent;
            buttonBorder = theme.accent;
            textColor = '#FFFFFF';
            octaveColor = 'rgba(255, 255, 255, 0.7)';
          } else if (isActive) {
            buttonBg = theme.isDark ? '#2C2C2E' : '#E5E5EA';
            buttonBorder = theme.isDark ? '#3A3A3C' : '#D1D1D6';
            textColor = theme.text;
            octaveColor = theme.textSecondary;
          }

          return (
            <TouchableOpacity
              key={note.id}
              style={[
                styles.pegButton,
                {
                  backgroundColor: buttonBg,
                  borderColor: buttonBorder,
                },
              ]}
              onPress={() => handleNotePress(note)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.pegText,
                  {
                    color: textColor,
                    fontFamily: isSelected || isActive ? Fonts.bold : Fonts.semiBold,
                  },
                ]}
              >
                {note.name}
              </Text>
              <Text
                style={[
                  styles.octaveText,
                  {
                    color: octaveColor,
                  },
                ]}
              >
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
    paddingVertical: 12,
  },
  header: {
    width: '100%',
    alignItems: 'center',
  },
  tuningLabel: {
    fontSize: 13,
    fontFamily: Fonts.bold,
    letterSpacing: 0.5,
  },
  selectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    width: '100%',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
  },
  pegButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 2,
  },
  pegText: {
    fontSize: 14,
  },
  octaveText: {
    fontSize: 9,
    fontFamily: Fonts.bold,
    marginTop: 1,
  },
});
