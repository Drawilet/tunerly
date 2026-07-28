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
    
    this.hp.reset();
    this.lp.reset();
  }

  public filter(buffer: Float32Array): Float32Array {
    const highPassed = this.hp.process(buffer);
    return this.lp.process(highPassed);
  }

  public reset(): void {
    this.hp.reset();
    this.lp.reset();
  }
}
