export class SignalValidator {
  private history: number[] = [];
  private maxHistory = 6;
  private stabilityThreshold = 0.02; // 2% deviation threshold

  private candidateNoteId: string | null = null;
  private candidateCount = 0;
  private requiredStableFrames = 4; // Number of stable frames needed to switch/lock notes

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
   * Tracks a rolling history of frequencies and determines if they are stable within 2% deviation.
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
   * Ensures that note transitions are debounced and only locks a new note once it has remained
   * stable for a minimum number of consecutive frames.
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
