import { useEffect, useRef, useState, useCallback } from 'react';
import { useTunerStore } from '../state/useTunerStore';
import { HapticsService } from '@/core/haptics/services/HapticsService';

/**
 * Dwell duration (ms) a pitch must remain in-tune before a string is
 * considered confirmed. 350 ms balances responsiveness with false-positive
 * immunity from short pitch wobble.
 */
const DWELL_THRESHOLD_MS = 350;

export interface TuningProgressResult {
  /**
   * Set of confirmed string *position indices* (0-based) within the active
   * tuning's `notes` array.
   *
   * Using position indices (not note IDs) is critical for correctness:
   *   - Tunings with repeated notes (e.g. Open G: D2, G2, D3, G3, B3, D4)
   *     would collapse to fewer Set entries if keyed by note ID.
   *   - The pitch processor's `targetNote.id` in Auto mode always resolves to
   *     the *first* matching note in the array, so three D-string positions
   *     would all produce the same ID — completing one would "complete" all.
   *
   * Position indices are unique per string, instrument, and tuning.
   */
  completedPositions: Set<number>;
  /**
   * Convenience set of the note IDs for confirmed positions — used by
   * StringSelector to style individual pegs. Derived from completedPositions.
   */
  completedNoteIds: Set<string>;
  /** True only when every string position in the active tuning has been confirmed. */
  allComplete: boolean;
  /** Callback fired exactly once per completed position — receives the position index. */
  onStringCompleteRef: React.MutableRefObject<((position: number) => void) | null>;
  /** Callback fired exactly once when all positions are confirmed. */
  onAllCompleteRef: React.MutableRefObject<(() => void) | null>;
  /** Reset all progress (called on tuning/instrument change). */
  reset: () => void;
}

/**
 * useTuningProgress
 *
 * Derives per-string tuning completion from the live pitch stream.
 *
 * ## Correctness guarantee
 *
 * Completion is tracked by **tuning position index** (0 … N-1), not by
 * `targetNote.id`. This is essential because:
 *
 * 1. Instruments like Guitar Open G have repeated note names at different
 *    octaves (D2, D3, D4). The pitch processor's Auto mode resolves the
 *    detected frequency to the *first* `tuningNotes.find()` match, so all
 *    three D positions produce `targetNote.id = "guitar-open-g-D2"`.
 *    Keying on that ID means `completedNoteIds.size` can never exceed the
 *    number of *unique* IDs — far fewer than the total string count.
 *
 * 2. A `Set` of IDs deduplicates, so completing string 6 (E4 on guitar)
 *    would be silently ignored if string 1 (also E, but E2) was already
 *    in the set — even though E2 ≠ E4.
 *
 * ## How position matching works
 *
 * On every pitch frame we find the tuning position whose `note.frequency`
 * most closely matches the detected frequency. The closest position wins,
 * **independently of which string the pitch processor already resolved to**.
 * This ensures that even in Auto mode, each physical string is tracked
 * individually.
 *
 * In Manual mode (user has selected a string), we lock directly to that
 * string's position index — exactly one position can be active at a time.
 */
export function useTuningProgress(): TuningProgressResult {
  const currentPitch  = useTunerStore((s) => s.currentPitch);
  const activeTuning  = useTunerStore((s) => s.activeTuning);
  const selectedNote  = useTunerStore((s) => s.selectedNote);

  // ── Dwell timer map: position index → timer handle ─────────────────────
  const dwellTimers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  // ── Confirmed position indices ──────────────────────────────────────────
  const [completedPositions, setCompletedPositions] = useState<Set<number>>(new Set());
  const completedRef = useRef<Set<number>>(new Set()); // shadow ref for sync callbacks

  // ── Animation callbacks ─────────────────────────────────────────────────
  const onStringCompleteRef = useRef<((position: number) => void) | null>(null);
  const onAllCompleteRef    = useRef<(() => void) | null>(null);

  // Track whether the all-complete callback has already fired this session
  const allCompleteFiredRef = useRef(false);

  const totalStrings = activeTuning.notes.length;

  // ── Reset when tuning changes ───────────────────────────────────────────
  const reset = useCallback(() => {
    dwellTimers.current.forEach((timer) => clearTimeout(timer));
    dwellTimers.current.clear();
    completedRef.current = new Set();
    allCompleteFiredRef.current = false;
  }, []);

  const tuningId = activeTuning.id;
  useEffect(() => {
    dwellTimers.current.forEach((timer) => clearTimeout(timer));
    dwellTimers.current.clear();
    completedRef.current = new Set();
    allCompleteFiredRef.current = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCompletedPositions(new Set());
  }, [tuningId]);

  // ── Pitch stream handler ────────────────────────────────────────────────
  useEffect(() => {
    if (!currentPitch) {
      // No pitch signal — cancel all pending timers; do not un-complete strings
      dwellTimers.current.forEach((timer) => clearTimeout(timer));
      dwellTimers.current.clear();
      return;
    }

    // ── Resolve the tuning position that best matches the detected frequency ──
    //
    // We do NOT rely on `currentPitch.targetNote.id` here. In Auto mode the
    // pitch processor resolves targetNote via `tuningNotes.find()`, which
    // always returns the *first* note in the array whose MIDI value matches —
    // meaning multiple string positions with the same pitch class/octave map
    // to a single ID. Instead we find the *closest frequency position* directly.
    let matchedPosition: number = -1;

    if (selectedNote) {
      // Manual mode: the user has locked to a specific string. Find its index.
      matchedPosition = activeTuning.notes.findIndex((n) => n.id === selectedNote.id);
    } else {
      // Auto mode: find the position whose target frequency is nearest to the
      // detected frequency. This ensures each physical string is tracked
      // independently even when multiple strings share the same note name.
      const detectedFreq = currentPitch.frequency;
      let minCentDiff = Infinity;

      activeTuning.notes.forEach((note, idx) => {
        // Use cents distance to compare on a logarithmic scale (perceptually uniform)
        const centDiff = Math.abs(1200 * Math.log2(detectedFreq / note.frequency));
        if (centDiff < minCentDiff) {
          minCentDiff = centDiff;
          matchedPosition = idx;
        }
      });
    }

    if (matchedPosition === -1) return;

    if (currentPitch.isInTune) {
      // Already confirmed for this position — skip
      if (completedRef.current.has(matchedPosition)) return;

      // Timer already running for this position — skip
      if (dwellTimers.current.has(matchedPosition)) return;

      // Start dwell timer
      const timer = setTimeout(() => {
        dwellTimers.current.delete(matchedPosition);

        // Double-check in case it was completed between scheduling and firing
        if (completedRef.current.has(matchedPosition)) return;

        // Mark position as confirmed
        completedRef.current = new Set(completedRef.current).add(matchedPosition);
        setCompletedPositions(new Set(completedRef.current));

        // Fire per-string animation callback (receives position index)
        onStringCompleteRef.current?.(matchedPosition);

        // Haptic: soft tap for individual string
        HapticsService.impactSoft();

        // All strings confirmed?
        if (
          !allCompleteFiredRef.current &&
          completedRef.current.size >= totalStrings
        ) {
          allCompleteFiredRef.current = true;
          // Slight delay so the last peg animation has started first
          setTimeout(() => {
            onAllCompleteRef.current?.();
            HapticsService.notificationSuccess();
          }, 200);
        }
      }, DWELL_THRESHOLD_MS);

      dwellTimers.current.set(matchedPosition, timer);
    } else {
      // Pitch moved out of tune — cancel the dwell timer for this position
      const existingTimer = dwellTimers.current.get(matchedPosition);
      if (existingTimer) {
        clearTimeout(existingTimer);
        dwellTimers.current.delete(matchedPosition);
      }
    }
  }, [currentPitch, totalStrings, activeTuning.notes, selectedNote]);

  // Cleanup on unmount
  useEffect(() => {
    const timers = dwellTimers.current;
    return () => {
      timers.forEach((t) => clearTimeout(t));
    };
  }, []);

  // ── Derive completedNoteIds for UI styling ──────────────────────────────
  // StringSelector highlights pegs by note ID, so we map confirmed positions
  // back to their note IDs. Each position maps to exactly one note in the
  // tuning, so there is no ambiguity here.
  const completedNoteIds = new Set<string>(
    Array.from(completedPositions).map((idx) => activeTuning.notes[idx]?.id).filter(Boolean) as string[]
  );

  const allComplete = totalStrings > 0 && completedPositions.size >= totalStrings;

  return {
    completedPositions,
    completedNoteIds,
    allComplete,
    onStringCompleteRef,
    onAllCompleteRef,
    reset,
  };
}
