export class NoiseGate {
  private threshold: number;

  constructor(initialThreshold = 0.03) {
    this.threshold = initialThreshold;
  }

  /**
   * Updates the gate threshold.
   */
  public setThreshold(threshold: number): void {
    this.threshold = threshold;
  }

  /**
   * Retrieves the current gate threshold.
   */
  public getThreshold(): number {
    return this.threshold;
  }

  /**
   * Returns true if the RMS amplitude is above the threshold (gate is open),
   * meaning the signal is strong enough to process.
   */
  public isOpen(rms: number): boolean {
    return rms >= this.threshold;
  }
}
