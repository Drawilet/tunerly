export interface SignalValidatorConfig {
  /** Number of frames tracked in the rolling frequency history for stability checks. */
  stabilityHistorySize: number;
  /** Maximum relative deviation (max - min) / min allowed across the history window. */
  stabilityDeviationLimit: number;
  /** Consecutive frames the same chromatic note must appear to be accepted as locked. */
  debounceFrames: number;
}

const DEFAULT_CONFIG: SignalValidatorConfig = {
  stabilityHistorySize:    6,
  stabilityDeviationLimit: 0.02,
  debounceFrames:          4,
};

export class SignalValidator {
  private history: number[] = [];
  private readonly maxHistory: number;
  private readonly stabilityThreshold: number;
  private readonly requiredStableFrames: number;

  private candidateNoteId: string | null = null;
  private candidateCount = 0;

  constructor(config: Partial<SignalValidatorConfig> = {}) {
    const cfg = { ...DEFAULT_CONFIG, ...config };
    this.maxHistory = cfg.stabilityHistorySize;
    this.stabilityThreshold = cfg.stabilityDeviationLimit;
    this.requiredStableFrames = cfg.debounceFrames;
  }

  /**
   * Checks if the detected frequency is within the absolute boundaries of the selected instrument.
   */
  public isFrequencyInBounds(frequency: number, instrumentId: string): boolean {
    switch (instrumentId) {
      case 'bass':
        return frequency >= 20 && frequency <= 450;
      case 'ukulele':
        return frequency >= 150 && frequency <= 1200;
      case 'violin':
        return frequency >= 150 && frequency <= 1500;
      case 'guitar':
      default:
        return frequency >= 50 && frequency <= 1500;
    }
  }

  /**
   * Tracks a rolling history of frequencies and determines if they are stable
   * within the configured deviation limit.
   */
  public validateStability(frequency: number): boolean {
    if (frequency <= 0) {
      this.history = [];
      return false;
    }

    this.history.push(frequency);
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }

    if (this.history.length < this.maxHistory) {
      return false;
    }

    const min = Math.min(...this.history);
    const max = Math.max(...this.history);
    const deviation = (max - min) / min;

    return deviation <= this.stabilityThreshold;
  }

  /**
   * Ensures that note transitions are debounced and only locks a new note once
   * it has remained stable for the configured number of consecutive frames.
   */
  public debounceNoteChange(targetNoteId: string): boolean {
    if (this.candidateNoteId === targetNoteId) {
      this.candidateCount++;
    } else {
      this.candidateNoteId = targetNoteId;
      this.candidateCount = 1;
    }
    return this.candidateCount >= this.requiredStableFrames;
  }

  /**
   * Validates that a played frequency remains within an acceptable cents range
   * of the currently locked note's frequency.
   *
   * Uses a cents-based tolerance instead of MIDI-integer equality to handle
   * natural pitch wobble, microphone noise, and fine-grained frequency estimation
   * without falsely breaking the note lock.
   *
   * @param playedFrequency   The current smoothed/detected frequency (Hz).
   * @param lockedFrequency   The locked note's exact reference frequency (Hz).
   * @param centsTolerance    Maximum deviation in cents to still consider "same note".
   *                          100 cents = 1 semitone. Recommended: 75 cents.
   * @returns true if the played frequency is within tolerance of the locked note.
   */
  public validateNoteLock(
    playedFrequency: number,
    lockedFrequency: number,
    centsTolerance: number
  ): boolean {
    if (playedFrequency <= 0 || lockedFrequency <= 0) return false;
    const cents = Math.abs(1200 * Math.log2(playedFrequency / lockedFrequency));
    return cents <= centsTolerance;
  }

  /**
   * Resets all validation histories.
   */
  public reset(): void {
    this.history = [];
    this.candidateNoteId = null;
    this.candidateCount = 0;
  }

  public getStableFrameCount(): number {
    return this.history.length;
  }
}
