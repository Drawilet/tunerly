import { IAudioRecorder, AudioRecorderState } from '../domain/IAudioRecorder';

export class SimulatedAudioRecorder implements IAudioRecorder {
  private state: AudioRecorderState = {
    isRecording: false,
    hasPermission: null,
    error: null,
  };

  private listeners: Set<(state: AudioRecorderState) => void> = new Set();
  private intervalId: any = null;
  private sampleCount = 0;
  public readonly sampleRate = 44100;
  private onAudioDataCallback: ((buffer: Float32Array) => void) | null = null;

  // Simulation parameters
  private currentFrequency = 0;
  private targetFrequency = 0;
  private amplitude = 0;
  private pluckTime = 0;
  private driftPhase = 0;

  async requestPermissions(): Promise<boolean> {
    this.updateState({ hasPermission: true });
    return true;
  }

  /**
   * Triggers a simulated instrument string pluck at the given frequency.
   * Sharpens the pitch initially and decays over time, mimicking physical dynamics.
   */
  pluck(frequency: number) {
    this.targetFrequency = frequency;
    // Start slightly sharp (typical for real string plucks due to high initial tension)
    this.currentFrequency = frequency * 1.015; 
    this.amplitude = 0.8;
    this.pluckTime = Date.now();
    this.driftPhase = Math.random() * 100;
  }

  async start(onAudioData: (buffer: Float32Array) => void): Promise<void> {
    if (this.state.isRecording) return;

    this.onAudioDataCallback = onAudioData;
    this.updateState({ isRecording: true });
    this.sampleCount = 0;

    // Start with a silent background or a default E2 pluck
    this.pluck(196.0); // G3 default

    const bufferSize = 2048;
    const intervalMs = (bufferSize / this.sampleRate) * 1000; // ~46.4ms

    this.intervalId = setInterval(() => {
      if (!this.state.isRecording || !this.onAudioDataCallback) return;

      const elapsed = (Date.now() - this.pluckTime) / 1000; // seconds

      // 1. Decay the amplitude exponentially
      if (this.amplitude > 0.01) {
        this.amplitude = 0.8 * Math.exp(-elapsed * 0.4); // decays over ~8-10 seconds
      } else {
        this.amplitude = 0;
      }

      // 2. Converge frequency to the target (string settles as tension evens out)
      if (this.currentFrequency !== this.targetFrequency && this.amplitude > 0) {
        // Converges within the first 1.5 seconds
        const convergenceFactor = Math.min(1, elapsed / 1.5);
        const sharpness = (this.targetFrequency * 0.015) * (1 - convergenceFactor);
        
        // Add physical micro-fluctuations (frequency wobble/drift)
        const drift = Math.sin(elapsed * 8 + this.driftPhase) * 0.15;
        this.currentFrequency = this.targetFrequency + sharpness + drift;
      }

      // 3. Generate PCM buffer
      const buffer = new Float32Array(bufferSize);
      
      if (this.amplitude > 0.001) {
        for (let i = 0; i < bufferSize; i++) {
          const t = (this.sampleCount + i) / this.sampleRate;
          
          // Generate fundamental sine wave
          let sample = Math.sin(2 * Math.PI * this.currentFrequency * t);
          
          // Add some light second and third harmonics for realism
          sample += 0.15 * Math.sin(4 * Math.PI * this.currentFrequency * t);
          sample += 0.05 * Math.sin(6 * Math.PI * this.currentFrequency * t);
          
          // Add light white noise
          const noise = (Math.random() - 0.5) * 0.02;
          
          buffer[i] = (sample / 1.2) * this.amplitude + noise;
        }
      } else {
        // Just ambient room noise when string is quiet
        for (let i = 0; i < bufferSize; i++) {
          buffer[i] = (Math.random() - 0.5) * 0.005;
        }
      }

      this.sampleCount += bufferSize;
      this.onAudioDataCallback(buffer);
    }, intervalMs);
  }

  async stop(): Promise<void> {
    if (!this.state.isRecording) return;

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.onAudioDataCallback = null;
    this.updateState({ isRecording: false });
  }

  getState(): AudioRecorderState {
    return { ...this.state };
  }

  subscribeToState(callback: (state: AudioRecorderState) => void): () => void {
    this.listeners.add(callback);
    callback(this.getState());
    return () => {
      this.listeners.delete(callback);
    };
  }

  private updateState(newState: Partial<AudioRecorderState>) {
    this.state = { ...this.state, ...newState };
    this.listeners.forEach((listener) => listener(this.getState()));
  }
}
