import { IAudioRecorder, AudioRecorderState, AudioDiagnostics } from '../domain/IAudioRecorder';

export class WebAudioRecorder implements IAudioRecorder {
  get sampleRate(): number {
    return this.audioContext?.sampleRate ?? 44100;
  }

  private state: AudioRecorderState = {
    isRecording: false,
    hasPermission: null,
    error: null,
  };

  private stream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private animationFrameId: number | null = null;
  private listeners: Set<(state: AudioRecorderState) => void> = new Set();

  // Pluck simulation for browser-testing and visual checks without mic input
  private isPluckSimulating = false;
  private currentFrequency = 0;
  private targetFrequency = 0;
  private amplitude = 0;
  private pluckTime = 0;
  private driftPhase = 0;
  private sampleCount = 0;

  pluck(frequency: number) {
    this.targetFrequency = frequency;
    this.currentFrequency = frequency * 1.015;
    this.amplitude = 0.8;
    this.pluckTime = Date.now();
    this.driftPhase = Math.random() * 100;
    this.isPluckSimulating = true;
  }

  async requestPermissions(): Promise<boolean> {
    try {
      if (typeof window === 'undefined' || !navigator.mediaDevices) {
        this.updateState({ hasPermission: false, error: 'Web mediaDevices not available' });
        return false;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Release the stream immediately since we just want to check permission
      stream.getTracks().forEach((track) => track.stop());

      this.updateState({ hasPermission: true, error: null });
      return true;
    } catch (err: any) {
      console.warn('Microphone permission denied:', err);
      this.updateState({ hasPermission: false, error: err.message || 'Permission denied' });
      return false;
    }
  }

  async start(onAudioData: (buffer: Float32Array) => void): Promise<void> {
    if (this.state.isRecording) return;

    try {
      const hasPerm = this.state.hasPermission ?? (await this.requestPermissions());
      if (!hasPerm) {
        throw new Error('Microphone permission not granted');
      }

      // Set iOS Safari Audio Session category to play-and-record
      if (typeof navigator !== 'undefined' && 'audioSession' in navigator) {
        try {
          (navigator as any).audioSession.type = 'play-and-record';
        } catch (e) {
          console.warn('Failed to set audio session type:', e);
        }
      }

      // Initialize AudioContext
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioContextClass({
        latencyHint: 'interactive',
        sampleRate: 44100, // Explicitly request full 44.1 kHz sample rate
      });

      // Get audio stream without speech communication optimizations
      const constraints: any = {
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          sampleRate: 44100,
          channelCount: 1,
          // Android Chrome / WebRTC legacy parameters to disable voice processing
          googEchoCancellation: false,
          googAutoGainControl: false,
          googNoiseSuppression: false,
          googHighpassFilter: false,
          googEchoCancellation2: false,
          googAutoGainControl2: false,
          googNoiseSuppression2: false,
        }
      };

      this.stream = await navigator.mediaDevices.getUserMedia(constraints);

      const source = this.audioContext.createMediaStreamSource(this.stream);
      this.analyser = this.audioContext.createAnalyser();
      // Use 4096 samples to support low frequencies down to 30Hz (Bass)
      this.analyser.fftSize = 4096;

      source.connect(this.analyser);

      const bufferLength = this.analyser.fftSize;
      const dataArray = new Float32Array(bufferLength);

      this.updateState({ isRecording: true, error: null });

      const tick = () => {
        if (!this.state.isRecording || !this.analyser) return;

        if (this.isPluckSimulating) {
          const elapsed = (Date.now() - this.pluckTime) / 1000;
          if (this.amplitude > 0.01) {
            this.amplitude = 0.8 * Math.exp(-elapsed * 0.4);
          } else {
            this.amplitude = 0;
            this.isPluckSimulating = false;
          }

          if (this.currentFrequency !== this.targetFrequency && this.amplitude > 0) {
            const convergenceFactor = Math.min(1, elapsed / 1.5);
            const sharpness = (this.targetFrequency * 0.015) * (1 - convergenceFactor);
            const drift = Math.sin(elapsed * 8 + this.driftPhase) * 0.15;
            this.currentFrequency = this.targetFrequency + sharpness + drift;
          }

          if (this.amplitude > 0.001) {
            const sRate = this.sampleRate;
            for (let i = 0; i < bufferLength; i++) {
              const t = (this.sampleCount + i) / sRate;
              let sample = Math.sin(2 * Math.PI * this.currentFrequency * t);
              sample += 0.15 * Math.sin(4 * Math.PI * this.currentFrequency * t);
              sample += 0.05 * Math.sin(6 * Math.PI * this.currentFrequency * t);
              const noise = (Math.random() - 0.5) * 0.02;
              dataArray[i] = (sample / 1.2) * this.amplitude + noise;
            }
          } else {
            for (let i = 0; i < bufferLength; i++) {
              dataArray[i] = (Math.random() - 0.5) * 0.005;
            }
          }
          this.sampleCount += bufferLength;
        } else {
          this.analyser.getFloatTimeDomainData(dataArray);
        }

        // Pass a copy or the buffer directly (Float32Array is view-based, copy is safer)
        onAudioData(new Float32Array(dataArray));

        this.animationFrameId = requestAnimationFrame(tick);
      };

      this.animationFrameId = requestAnimationFrame(tick);
    } catch (err: any) {
      this.updateState({ isRecording: false, error: err.message || 'Failed to start recording' });
      throw err;
    }
  }

  async stop(): Promise<void> {
    if (!this.state.isRecording) return;

    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }

    if (this.audioContext && this.audioContext.state !== 'closed') {
      await this.audioContext.close();
      this.audioContext = null;
    }

    if (typeof navigator !== 'undefined' && 'audioSession' in navigator) {
      try {
        (navigator as any).audioSession.type = 'playback';
      } catch (e) {
        console.warn('Failed to restore audio session type:', e);
      }
    }

    this.analyser = null;
    this.updateState({ isRecording: false });
  }

  getDiagnostics(): AudioDiagnostics {
    const track = this.stream?.getAudioTracks()[0];
    const settings = track?.getSettings() || {};
    
    // Inferred information
    const isIOS = typeof navigator !== 'undefined' && (/iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));
    const isAndroid = typeof navigator !== 'undefined' && /Android/.test(navigator.userAgent);

    let audioSessionCategory = 'N/A';
    let audioSessionMode = 'N/A';
    if (isIOS) {
      audioSessionCategory = (typeof navigator !== 'undefined' && 'audioSession' in navigator) ? ((navigator as any).audioSession.type || 'play-and-record') : 'play-and-record (default)';
      audioSessionMode = 'default';
    }

    let audioSource = 'N/A';
    if (isAndroid) {
      audioSource = 'default/microphone';
    }

    const isVoiceProcessingActive =
      settings.echoCancellation === true ||
      settings.noiseSuppression === true ||
      settings.autoGainControl === true;

    return {
      activeAudioSessionMode: isIOS ? audioSessionMode : 'N/A',
      activeSampleRate: this.sampleRate,
      bufferSize: this.analyser?.fftSize ?? 4096,
      inputChannelCount: settings.channelCount ?? 1,
      audioSource: isAndroid ? audioSource : 'N/A',
      audioSessionCategoryMode: isIOS ? `${audioSessionCategory} / ${audioSessionMode}` : 'N/A',
      systemVoiceProcessingActive: isVoiceProcessingActive ? 'active' : 'inactive',
    };
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
