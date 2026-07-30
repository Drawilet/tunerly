export class DcBlocker {
  private x1 = 0;
  private y1 = 0;
  private readonly R = 0.995;

  public process(input: Float32Array): Float32Array {
    const len = input.length;
    const output = new Float32Array(len);
    let x1 = this.x1;
    let y1 = this.y1;
    const R = this.R;

    for (let i = 0; i < len; i++) {
      const x = input[i];
      const y = x - x1 + R * y1;
      output[i] = y;
      x1 = x;
      y1 = y;
    }

    this.x1 = x1;
    this.y1 = y1;
    return output;
  }

  public reset(): void {
    this.x1 = 0;
    this.y1 = 0;
  }
}

export class BiquadFilter {
  private b0 = 1;
  private b1 = 0;
  private b2 = 0;
  private a1 = 0;
  private a2 = 0;

  private x1 = 0;
  private x2 = 0;
  private y1 = 0;
  private y2 = 0;

  public setLowPass(cutoffFreq: number, sampleRate: number, q = 0.707): void {
    const w0 = (2 * Math.PI * cutoffFreq) / sampleRate;
    const alpha = Math.sin(w0) / (2 * q);
    const cosW0 = Math.cos(w0);
    const a0 = 1 + alpha;
    
    this.b0 = (1 - cosW0) / 2 / a0;
    this.b1 = (1 - cosW0) / a0;
    this.b2 = (1 - cosW0) / 2 / a0;
    this.a1 = (-2 * cosW0) / a0;
    this.a2 = (1 - alpha) / a0;
  }

  public setHighPass(cutoffFreq: number, sampleRate: number, q = 0.707): void {
    const w0 = (2 * Math.PI * cutoffFreq) / sampleRate;
    const alpha = Math.sin(w0) / (2 * q);
    const cosW0 = Math.cos(w0);
    const a0 = 1 + alpha;
    
    this.b0 = (1 + cosW0) / 2 / a0;
    this.b1 = -(1 + cosW0) / a0;
    this.b2 = (1 + cosW0) / 2 / a0;
    this.a1 = (-2 * cosW0) / a0;
    this.a2 = (1 - alpha) / a0;
  }

  public process(input: Float32Array): Float32Array {
    const len = input.length;
    const output = new Float32Array(len);
    for (let i = 0; i < len; i++) {
      const x = input[i];
      const y = this.b0 * x + this.b1 * this.x1 + this.b2 * this.x2 - this.a1 * this.y1 - this.a2 * this.y2;
      
      this.x2 = this.x1;
      this.x1 = x;
      this.y2 = this.y1;
      this.y1 = y;
      
      output[i] = y;
    }
    return output;
  }

  public reset(): void {
    this.x1 = 0;
    this.x2 = 0;
    this.y1 = 0;
    this.y2 = 0;
  }
}

export class InstrumentBandpassFilter {
  private dc = new DcBlocker();
  private hp = new BiquadFilter();
  private lp = new BiquadFilter();
  private lastInstrumentId: string | null = null;

  public configure(instrumentId: string, sampleRate: number): void {
    if (this.lastInstrumentId === instrumentId) return;
    this.lastInstrumentId = instrumentId;

    let lowCut = 70;
    let highCut = 1400;

    switch (instrumentId) {
      case 'bass':
        lowCut = 25;
        highCut = 350;
        break;
      case 'ukulele':
        lowCut = 180;
        highCut = 1000;
        break;
      case 'violin':
        lowCut = 170;
        highCut = 1300;
        break;
      case 'guitar':
      default:
        lowCut = 70;
        highCut = 1400;
        break;
    }

    this.hp.setHighPass(lowCut, sampleRate);
    this.lp.setLowPass(highCut, sampleRate);
    
    this.dc.reset();
    this.hp.reset();
    this.lp.reset();
  }

  public filter(buffer: Float32Array): Float32Array {
    const dcBlocked = this.dc.process(buffer);
    const highPassed = this.hp.process(dcBlocked);
    return this.lp.process(highPassed);
  }

  public reset(): void {
    this.dc.reset();
    this.hp.reset();
    this.lp.reset();
  }
}

export class AutomaticGainControl {
  private gain = 1.0;
  private currentEnvelope = 0.0;

  // Configuration options
  private targetLevel = 0.2;
  private maxGain = 5.0;
  private attackAlpha = 0.8;
  private releaseAlpha = 0.02;

  constructor(config: { targetLevel?: number; maxGain?: number; attackAlpha?: number; releaseAlpha?: number } = {}) {
    if (config.targetLevel !== undefined) this.targetLevel = config.targetLevel;
    if (config.maxGain !== undefined) this.maxGain = config.maxGain;
    if (config.attackAlpha !== undefined) this.attackAlpha = config.attackAlpha;
    if (config.releaseAlpha !== undefined) this.releaseAlpha = config.releaseAlpha;
  }

  public setParams(targetLevel: number, maxGain: number, attackAlpha: number, releaseAlpha: number): void {
    this.targetLevel = targetLevel;
    this.maxGain = maxGain;
    this.attackAlpha = attackAlpha;
    this.releaseAlpha = releaseAlpha;
  }

  public process(input: Float32Array, noiseFloor: number): Float32Array {
    const len = input.length;
    const output = new Float32Array(len);

    // 1. Calculate envelope (RMS of current frame)
    let sum = 0;
    for (let i = 0; i < len; i++) {
      sum += input[i] * input[i];
    }
    const rms = Math.sqrt(sum / Math.max(1, len));

    // 2. Smooth the envelope
    const envAlpha = 0.1;
    this.currentEnvelope = (1 - envAlpha) * this.currentEnvelope + envAlpha * rms;

    // 3. Determine target gain
    let targetGain = 1.0;
    
    // Silence/noise floor gate — if envelope is too low, don't expand gain (slowly decay to 1.0)
    const isSilence = this.currentEnvelope < noiseFloor * 1.5;

    if (!isSilence && this.currentEnvelope > 0) {
      targetGain = this.targetLevel / this.currentEnvelope;
      if (targetGain > this.maxGain) {
        targetGain = this.maxGain;
      }
      if (targetGain < 0.1) {
        targetGain = 0.1;
      }
    } else {
      targetGain = 1.0;
    }

    // 4. Adapt gain smoothly using attack/release coefficients
    if (targetGain < this.gain) {
      // Attack: fast reduction to prevent clipping
      this.gain = this.attackAlpha * this.gain + (1 - this.attackAlpha) * targetGain;
    } else {
      // Release: slow increase to hold note levels
      this.gain = this.releaseAlpha * this.gain + (1 - this.releaseAlpha) * targetGain;
    }

    // 5. Apply gain
    for (let i = 0; i < len; i++) {
      output[i] = input[i] * this.gain;
    }

    return output;
  }

  public getGain(): number {
    return this.gain;
  }

  public reset(): void {
    this.gain = 1.0;
    this.currentEnvelope = 0.0;
  }
}
