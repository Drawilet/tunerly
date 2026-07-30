import React, { useCallback, useEffect, useRef } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Animated, Easing } from 'react-native';
import { useTunerStore } from '../state/useTunerStore';
import { useTuner } from '../hooks/useTuner';
import { StringNote } from '../../domain/models/TunerModels';
import { useTheme } from '../hooks/useTheme';
import { HapticsService } from '@/core/haptics/services/HapticsService';
import { Fonts, Spacing } from '@/constants/theme';
import { useResponsive } from '@/hooks/useResponsive';

// ── Per-peg animated state ─────────────────────────────────────────────────

interface PegAnimState {
  scale: Animated.Value;
  checkOpacity: Animated.Value;
  checkTranslate: Animated.Value;
  borderColor: Animated.Value; // 0 = default, 1 = success
  completed: boolean;
}

function createPegAnimState(): PegAnimState {
  return {
    scale: new Animated.Value(1),
    checkOpacity: new Animated.Value(0),
    checkTranslate: new Animated.Value(6),
    borderColor: new Animated.Value(0),
    completed: false,
  };
}

// ── Individual animated peg ────────────────────────────────────────────────

interface PegButtonProps {
  note: StringNote;
  isSelected: boolean;
  isActive: boolean;
  isCompleted: boolean;
  pegSize: number;
  pegFontSize: number;
  octaveFontSize: number;
  onPress: (note: StringNote) => void;
  animState: PegAnimState;
  theme: ReturnType<typeof import('../hooks/useTheme').useTheme>;
}

function PegButton({
  note,
  isSelected,
  isActive,
  isCompleted,
  pegSize,
  pegFontSize,
  octaveFontSize,
  onPress,
  animState,
  theme,
}: PegButtonProps) {
  const pegBorderRadius = pegSize / 2;

  // Resolved colors
  let buttonBg: string = theme.card;
  let buttonBorder: string = theme.border;
  let textColor: string = theme.textSecondary;
  let octaveColor: string = theme.textTertiary;

  if (isCompleted) {
    // Completed: soft green background tint
    buttonBg = theme.isDark ? 'rgba(48, 209, 88, 0.15)' : 'rgba(48, 209, 88, 0.12)';
    buttonBorder = '#30D158';
    textColor = '#30D158';
    octaveColor = 'rgba(48, 209, 88, 0.7)';
  } else if (isSelected) {
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

  const checkmarkSize = Math.max(12, Math.round(pegSize * 0.26));

  return (
    <View style={styles.pegWrapper}>
      <Animated.View style={{ transform: [{ scale: animState.scale }] }}>
        <TouchableOpacity
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
          onPress={() => onPress(note)}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.pegText,
              {
                color: textColor,
                fontFamily:
                  isSelected || isActive || isCompleted
                    ? Fonts.semiBold
                    : Fonts.regular,
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
      </Animated.View>

      {/* Animated checkmark badge */}
      <Animated.View
        style={[
          styles.checkmark,
          {
            opacity: animState.checkOpacity,
            transform: [{ translateY: animState.checkTranslate }],
            top: -checkmarkSize * 0.4,
            right: -checkmarkSize * 0.4,
            width: checkmarkSize,
            height: checkmarkSize,
            borderRadius: checkmarkSize / 2,
            backgroundColor: '#30D158',
          },
        ]}
        pointerEvents="none"
      >
        <Text style={[styles.checkmarkText, { fontSize: checkmarkSize * 0.55 }]}>✓</Text>
      </Animated.View>
    </View>
  );
}

// ── Main StringSelector ────────────────────────────────────────────────────

interface StringSelectorProps {
  /**
   * Set of confirmed tuning position indices (0-based) — keyed by position,
   * not note ID, to correctly handle tunings with repeated note names.
   * Provided by useTuningProgress.
   */
  completedPositions?: Set<number>;
  onStringAnimationStarted?: (position: number) => void;
}

export function StringSelector({
  completedPositions = new Set(),
  onStringAnimationStarted,
}: StringSelectorProps) {
  const theme = useTheme();
  const { activeInstrument, activeTuning, selectedNote, setSelectedNote, currentPitch, lastValidNote } =
    useTunerStore();
  const { triggerPluck } = useTuner();
  const { isCompact, isTablet, isDesktop } = useResponsive();

  const pegSize        = isCompact ? 40 : isDesktop ? 72 : isTablet ? 60 : 52;
  const pegFontSize    = isCompact ? 11 : isDesktop ? 18 : isTablet ? 16 : 14;
  const octaveFontSize = isCompact ? 7  : isDesktop ? 12 : isTablet ? 11 : 9;

  // One animated state object per string position in the active tuning.
  // Keyed by position index (not note.id) so tunings with repeated note
  // names (e.g. Open G: D2, D3, D4) each get their own independent state.
  const animStates = React.useMemo<Map<number, PegAnimState>>(() => {
    const map = new Map<number, PegAnimState>();
    activeTuning.notes.forEach((_note, idx) => {
      map.set(idx, createPegAnimState());
    });
    return map;
  // Recreate only when tuning changes, not on every render.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTuning.id]);

  // ── Completion animation trigger ─────────────────────────────────────
  const triggerPegCompletion = useCallback((position: number) => {
    const anim = animStates.get(position);
    if (!anim || anim.completed) return;
    anim.completed = true;

    onStringAnimationStarted?.(position);

    // Scale bounce: 0.95 → 1.05 → 1.0
    Animated.sequence([
      Animated.timing(anim.scale, {
        toValue: 0.95,
        duration: 60,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(anim.scale, {
        toValue: 1.05,
        duration: 130,
        easing: Easing.out(Easing.back(1.5)),
        useNativeDriver: true,
      }),
      Animated.timing(anim.scale, {
        toValue: 1.0,
        duration: 100,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();

    // Checkmark fade-in with upward slide
    Animated.parallel([
      Animated.timing(anim.checkOpacity, {
        toValue: 1,
        duration: 250,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(anim.checkTranslate, {
        toValue: 0,
        duration: 250,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [animStates, onStringAnimationStarted]);


  // ── Interaction handlers ──────────────────────────────────────────────
  const activeNote = selectedNote ?? currentPitch?.targetNote ?? lastValidNote?.targetNote;
  const tuningNotesList = activeTuning.notes.map((n) => n.name).join(' ');

  const handleNotePress = (note: StringNote) => {
    setSelectedNote(note);
    triggerPluck(note);
    HapticsService.selection();
  };

  const handleAutoPress = () => {
    setSelectedNote(null);
    HapticsService.selection();
  };

  // ── Expose triggerPegCompletion via reactive effect ────────────────────
  // Diffs the incoming completedPositions set against the previous frame to
  // fire the one-shot peg animation exactly once per newly confirmed position.
  const prevCompletedRef = useRef<Set<number>>(new Set());
  useEffect(() => {
    completedPositions.forEach((position) => {
      if (!prevCompletedRef.current.has(position)) {
        triggerPegCompletion(position);
      }
    });
    prevCompletedRef.current = new Set(completedPositions);
  }, [completedPositions, triggerPegCompletion]);

  return (
    <View style={styles.container}>
      {/* Active Tuning Detail Label */}
      <View style={styles.header}>
        <Text
          style={[
            styles.tuningLabel,
            {
              color: theme.textSecondary,
              fontSize: isCompact ? 10 : isDesktop ? 18 : isTablet ? 15 : 12,
            },
          ]}
        >
          {activeInstrument.name} • {activeTuning.name} ({tuningNotesList})
        </Text>
      </View>

      <View
        style={[
          styles.selectorRow,
          { gap: isCompact ? 6 : isDesktop ? 18 : isTablet ? 12 : 10 },
        ]}
      >
        {/* Auto Detection Toggle Peg */}
        <TouchableOpacity
          style={[
            styles.pegButton,
            {
              width: pegSize,
              height: pegSize,
              borderRadius: pegSize / 2,
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

        {/* Individual String Pegs */}
        {activeTuning.notes.map((note, idx) => {
          const isSelected  = selectedNote?.id === note.id;
          const isActive    = activeNote?.id === note.id;
          const isCompleted = completedPositions.has(idx);
          const animState   = animStates.get(idx) ?? createPegAnimState();

          return (
            <PegButton
              key={note.id}
              note={note}
              isSelected={isSelected}
              isActive={isActive}
              isCompleted={isCompleted}
              pegSize={pegSize}
              pegFontSize={pegFontSize}
              octaveFontSize={octaveFontSize}
              onPress={handleNotePress}
              animState={animState}
              theme={theme}
            />
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
  pegWrapper: {
    position: 'relative',
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
  checkmark: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#30D158',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.4,
    shadowRadius: 3,
    elevation: 3,
  },
  checkmarkText: {
    color: '#FFFFFF',
    fontFamily: Fonts.semiBold,
    lineHeight: undefined,
  },
});
