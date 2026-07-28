export class PitchFilter {
  private history: number[] = [];
  private windowSize: number;
  private alpha: number;
  private lastSmoothedFrequency: number | null = null;
  private resetThreshold: number;
  private deviationCount = 0;

  constructor(windowSize = 5, alpha = 0.20, resetThreshold = 0.08) {
    this.windowSize = windowSize;
    this.alpha = alpha;
    this.resetThreshold = resetThreshold;
  }

  /**
   * Filters the detected raw frequency.
   * Resets and snaps instantly if the difference from the current estimate is too large (e.g. string change)
   * and persists for at least 2 consecutive frames.
   */
  public filter(frequency: number): number {
    if (frequency <= 0 || isNaN(frequency)) {
      return 0;
    }

    // 1. Reset filter if the frequency jump is too large and persists
    if (this.lastSmoothedFrequency !== null) {
      const diffPercent = Math.abs(frequency - this.lastSmoothedFrequency) / this.lastSmoothedFrequency;
      if (diffPercent > this.resetThreshold) {
        this.deviationCount++;
        if (this.deviationCount >= 2) {
          this.reset();
        }
      } else {
        this.deviationCount = 0;
      }
    }

    // 2. Add to rolling window history
    this.history.push(frequency);
    if (this.history.length > this.windowSize) {
      this.history.shift();
    }

    // 3. Calculate Median of the history window to eliminate outliers/spikes
    const sorted = [...this.history].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];

    // 4. Apply Exponential Moving Average (EMA) for physical-feeling needle stability
    if (this.lastSmoothedFrequency === null) {
      this.lastSmoothedFrequency = median;
    } else {
      this.lastSmoothedFrequency = this.alpha * median + (1 - this.alpha) * this.lastSmoothedFrequency;
    }

    return this.lastSmoothedFrequency;
  }

  /**
   * Resets the filter's history.
   */
  public reset(): void {
    this.history = [];
    this.lastSmoothedFrequency = null;
    this.deviationCount = 0;
  }
}
