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
  /** Set of note IDs that have been confirmed tuned this session. */
  completedNoteIds: Set<string>;
  /** True only when every string in the active tuning has been confirmed. */
  allComplete: boolean;
  /** Callback fired exactly once per completed string — use to trigger per-peg animations. */
  onStringCompleteRef: React.MutableRefObject<((noteId: string) => void) | null>;
  /** Callback fired exactly once when all strings are confirmed — use to trigger confetti. */
  onAllCompleteRef: React.MutableRefObject<(() => void) | null>;
  /** Reset all progress (called on tuning/instrument change). */
  reset: () => void;
}

/**
 * useTuningProgress
 *
 * Derives per-string tuning completion from the live pitch stream.
 *
 * Design:
 * - Watches `currentPitch` from the store (no new store state added).
 * - For each frame where `currentPitch.isInTune` is true and the target note
 *   matches a known tuning string, starts a dwell timer via `setTimeout`.
 * - If the pitch moves away before DWELL_THRESHOLD_MS, the timer is cancelled.
 * - Once the dwell threshold is met the string is permanently marked complete
 *   for this session. Re-entering tune on the same string does not re-trigger
 *   the animation.
 * - When `activeTuning` changes all state resets automatically.
 *
 * Callers register animation callbacks via the exposed refs:
 *   onStringCompleteRef.current = (noteId) => { ... animate peg ... }
 *   onAllCompleteRef.current = () => { ... show confetti ... }
 */
export function useTuningProgress(): TuningProgressResult {
  const currentPitch = useTunerStore((s) => s.currentPitch);
  const activeTuning = useTunerStore((s) => s.activeTuning);

  // ── Dwell timer map: noteId → timer handle ─────────────────────────────
  const dwellTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  // ── Which notes have been confirmed tuned this session ─────────────────
  const [completedNoteIds, setCompletedNoteIds] = useState<Set<string>>(new Set());
  const completedRef = useRef<Set<string>>(new Set()); // shadow ref for callbacks

  // ── Animation callbacks registered by consumers ────────────────────────
  const onStringCompleteRef = useRef<((noteId: string) => void) | null>(null);
  const onAllCompleteRef = useRef<(() => void) | null>(null);

  // Track whether the all-complete callback has already fired this session
  const allCompleteFiredRef = useRef(false);

  // Total strings in the current tuning
  const totalStrings = activeTuning.notes.length;

  // ── Reset when tuning changes ──────────────────────────────────────────
  // Exposed so consumers can also trigger a manual reset (e.g. instrument change).
  const reset = useCallback(() => {
    dwellTimers.current.forEach((timer) => clearTimeout(timer));
    dwellTimers.current.clear();
    completedRef.current = new Set();
    allCompleteFiredRef.current = false;
  }, []);

  // Auto-reset on tuning/instrument change.
  // State update is done via a functional setter so React batches it correctly.
  const tuningId = activeTuning.id;
  useEffect(() => {
    dwellTimers.current.forEach((timer) => clearTimeout(timer));
    dwellTimers.current.clear();
    completedRef.current = new Set();
    allCompleteFiredRef.current = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCompletedNoteIds(new Set());
  }, [tuningId]);

  // ── Pitch stream handler ───────────────────────────────────────────────
  useEffect(() => {
    if (!currentPitch) {
      // No pitch signal — cancel all pending timers but do not un-complete strings
      dwellTimers.current.forEach((timer) => clearTimeout(timer));
      dwellTimers.current.clear();
      return;
    }

    const targetNoteId = currentPitch.targetNote?.id;

    if (!targetNoteId) return;

    if (currentPitch.isInTune) {
      // Already confirmed — skip
      if (completedRef.current.has(targetNoteId)) return;

      // Timer already running — skip
      if (dwellTimers.current.has(targetNoteId)) return;

      // Start dwell timer
      const timer = setTimeout(() => {
        dwellTimers.current.delete(targetNoteId);

        // Double-check it hasn't been completed between scheduling and firing
        if (completedRef.current.has(targetNoteId)) return;

        // Mark as confirmed
        completedRef.current = new Set(completedRef.current).add(targetNoteId);
        setCompletedNoteIds(new Set(completedRef.current));

        // Fire per-string animation callback
        onStringCompleteRef.current?.(targetNoteId);

        // Haptic: soft tap for individual string
        HapticsService.impactSoft();

        // Check for all-complete
        if (
          !allCompleteFiredRef.current &&
          completedRef.current.size >= totalStrings
        ) {
          allCompleteFiredRef.current = true;
          // Slight delay so the last peg animation starts first
          setTimeout(() => {
            onAllCompleteRef.current?.();
            HapticsService.notificationSuccess();
          }, 200);
        }
      }, DWELL_THRESHOLD_MS);

      dwellTimers.current.set(targetNoteId, timer);
    } else {
      // Pitch moved out of tune — cancel the dwell timer for this note
      const existingTimer = dwellTimers.current.get(targetNoteId);
      if (existingTimer) {
        clearTimeout(existingTimer);
        dwellTimers.current.delete(targetNoteId);
      }
    }
  }, [currentPitch, totalStrings]);

  // Cleanup on unmount
  useEffect(() => {
    const timers = dwellTimers.current;
    return () => {
      timers.forEach((t) => clearTimeout(t));
    };
  }, []);

  const allComplete =
    totalStrings > 0 && completedNoteIds.size >= totalStrings;

  return {
    completedNoteIds,
    allComplete,
    onStringCompleteRef,
    onAllCompleteRef,
    reset,
  };
}
