import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useTunerStore } from '../state/useTunerStore';
import { useTuner } from '../hooks/useTuner';
import { StringNote } from '../../domain/models/TunerModels';
import { useTheme } from '../hooks/useTheme';
import { HapticsService } from '@/core/haptics/services/HapticsService';
import { Fonts, Spacing } from '@/constants/theme';
import { useResponsive } from '@/hooks/useResponsive';

export function StringSelector() {
  const theme = useTheme();
  const { activeInstrument, activeTuning, selectedNote, setSelectedNote, currentPitch, lastValidNote } = useTunerStore();
  const { triggerPluck } = useTuner();
  const { isCompact, isTablet } = useResponsive();

  const pegSize = isCompact ? 40 : (isTablet ? 60 : 52);
  const pegFontSize = isCompact ? 11 : (isTablet ? 16 : 14);
  const octaveFontSize = isCompact ? 7 : (isTablet ? 11 : 9);
  const pegBorderRadius = pegSize / 2;

  // The active note being tuned (either manually selected, auto-detected, or the last valid note)
  const activeNote = selectedNote ?? currentPitch?.targetNote ?? lastValidNote?.targetNote;

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

      <View style={[styles.selectorRow, { gap: isCompact ? 6 : (isTablet ? 12 : 10) }]}>
        {/* Auto Detection Toggle Peg */}
        <TouchableOpacity
          style={[
            styles.pegButton,
            {
              width: pegSize,
              height: pegSize,
              borderRadius: pegBorderRadius,
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
                fontFamily: !selectedNote ? Fonts.semiBold : Fonts.regular,
                fontSize: pegFontSize,
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
          let buttonBg: string = theme.card;
          let buttonBorder: string = theme.border;
          let textColor: string = theme.textSecondary;
          let octaveColor: string = theme.textTertiary;

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
                  width: pegSize,
                  height: pegSize,
                  borderRadius: pegBorderRadius,
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
                    fontFamily: isSelected || isActive ? Fonts.semiBold : Fonts.regular,
                    fontSize: pegFontSize,
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
                    fontSize: octaveFontSize,
                    fontFamily: Fonts.regular,
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
    gap: Spacing.sm,
    paddingVertical: 12,
  },
  header: {
    width: '100%',
    alignItems: 'center',
  },
  tuningLabel: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    letterSpacing: 0.5,
  },
  selectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
  },
  pegButton: {
    borderWidth: 0.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pegText: {
    textAlign: 'center',
  },
  octaveText: {
    marginTop: 0.5,
  },
});
