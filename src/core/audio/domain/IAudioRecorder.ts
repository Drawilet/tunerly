export interface AudioRecorderState {
  isRecording: boolean;
  hasPermission: boolean | null;
  error: string | null;
}

export interface IAudioRecorder {
  readonly sampleRate: number;

  /**
   * Request microphone permission.
   * Returns true if granted, false otherwise.
   */
  requestPermissions(): Promise<boolean>;

  /**
   * Start streaming audio data.
   * Calls the callback with raw PCM Float32Array chunks in real time.
   */
  start(onAudioData: (buffer: Float32Array) => void): Promise<void>;

  /**
   * Stop recording.
   */
  stop(): Promise<void>;

  /**
   * Get the current state of the recorder.
   */
  getState(): AudioRecorderState;

  /**
   * Subscribe to changes in the recorder state.
   * Returns an unsubscribe function.
   */
  subscribeToState(callback: (state: AudioRecorderState) => void): () => void;
}
