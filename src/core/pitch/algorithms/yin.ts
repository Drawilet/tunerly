export interface YinResult {
  frequency: number;
  confidence: number;
}

export class YinDetector {
  private threshold: number;
  private fallbackThreshold: number;
  private yinBuffer: Float32Array;

  /**
   * @param threshold        YIN absolute threshold (lower = stricter periodicity requirement).
   * @param maxBufferSize    Maximum PCM buffer size to allocate for internal working memory.
   * @param fallbackThreshold If no clear local minimum is found below `threshold`, accept the
   *                         global minimum only if its value is below this fallback. Tighten on
   *                         mobile to reject ambiguous low-SNR frames (e.g. 0.30 vs 0.40).
   */
  constructor(threshold = 0.15, maxBufferSize = 4096, fallbackThreshold = 0.40) {
    this.threshold = threshold;
    this.fallbackThreshold = fallbackThreshold;
    this.yinBuffer = new Float32Array(maxBufferSize);
  }

  /**
   * Run the YIN algorithm on a Float32Array of audio samples.
   * @param buffer PCM buffer of audio samples.
   * @param sampleRate Sampling rate in Hz (e.g. 44100).
   * @returns object containing detected frequency in Hz (0 if undetected) and a confidence score (0 to 1).
   */
  detect(buffer: Float32Array, sampleRate: number): YinResult {
    const bufferSize = buffer.length;
    
    // Bounds for instrument frequencies (25Hz to 1600Hz)
    const minFreq = 25;
    const maxFreq = 1600;
    const minPeriod = Math.floor(sampleRate / maxFreq);
    const maxPeriod = Math.ceil(sampleRate / minFreq);

    if (bufferSize < maxPeriod * 2) {
      // Buffer must be at least twice as large as the longest period
      return { frequency: 0, confidence: 0 };
    }

    // Step 1: Calculate the difference function d_t(tau)
    this.difference(buffer, maxPeriod);

    // Step 2: Calculate cumulative mean normalized difference d'_t(tau)
    this.cumulativeMeanNormalizedDifference(maxPeriod);

    // Step 3: Absolute thresholding
    const tau = this.absoluteThreshold(minPeriod, maxPeriod);

    if (tau !== -1) {
      // Step 4: Parabolic interpolation for sub-sample accuracy
      const refinedTau = this.parabolicInterpolation(tau, maxPeriod);
      const frequency = sampleRate / refinedTau;

      // Confidence = 1 - difference (smaller difference means higher periodicity)
      const confidence = Math.max(0, 1 - this.yinBuffer[tau]);

      return { frequency, confidence };
    }

    return { frequency: 0, confidence: 0 };
  }

  /**
   * Step 1: Difference function d_t(tau)
   */
  private difference(buffer: Float32Array, maxPeriod: number): void {
    const bufferSize = buffer.length;
    // Integration window size is half of buffer minus maxPeriod
    const windowSize = bufferSize - maxPeriod;

    for (let tau = 0; tau < maxPeriod; tau++) {
      let sum = 0;
      for (let i = 0; i < windowSize; i++) {
        const delta = buffer[i] - buffer[i + tau];
        sum += delta * delta;
      }
      this.yinBuffer[tau] = sum;
    }
  }

  /**
   * Step 2: Cumulative mean normalized difference d'_t(tau)
   */
  private cumulativeMeanNormalizedDifference(maxPeriod: number): void {
    this.yinBuffer[0] = 1;
    let runningSum = 0;

    for (let tau = 1; tau < maxPeriod; tau++) {
      runningSum += this.yinBuffer[tau];
      if (runningSum > 0) {
        this.yinBuffer[tau] = this.yinBuffer[tau] / (runningSum / tau);
      } else {
        this.yinBuffer[tau] = 1;
      }
    }
  }

  /**
   * Step 3: Find smallest tau where difference is below threshold, or return global minimum.
   */
  private absoluteThreshold(minPeriod: number, maxPeriod: number): number {
    let globalMinTau = -1;
    let globalMinVal = Infinity;

    for (let tau = minPeriod; tau < maxPeriod; tau++) {
      // Find the first local minimum below the threshold
      if (this.yinBuffer[tau] < this.threshold) {
        // Confirm it's a local minimum
        if (
          tau + 1 < maxPeriod &&
          this.yinBuffer[tau] < this.yinBuffer[tau - 1] &&
          this.yinBuffer[tau] < this.yinBuffer[tau + 1]
        ) {
          return tau;
        }
      }

      // Track global minimum as a fallback
      if (this.yinBuffer[tau] < globalMinVal) {
        globalMinVal = this.yinBuffer[tau];
        globalMinTau = tau;
      }
    }

    // Fallback to global minimum if it is reasonably periodic
    if (globalMinTau !== -1 && globalMinVal < this.fallbackThreshold) {
      return globalMinTau;
    }

    return -1;
  }

  /**
   * Step 4: Parabolic interpolation
   */
  private parabolicInterpolation(tau: number, maxPeriod: number): number {
    if (tau < 1 || tau >= maxPeriod - 1) {
      return tau;
    }

    const alpha = this.yinBuffer[tau - 1];
    const beta = this.yinBuffer[tau];
    const gamma = this.yinBuffer[tau + 1];

    const denominator = 2 * (alpha - 2 * beta + gamma);
    if (Math.abs(denominator) < 1e-5) {
      return tau;
    }

    const offset = (alpha - gamma) / denominator;
    return tau + offset;
  }
}
