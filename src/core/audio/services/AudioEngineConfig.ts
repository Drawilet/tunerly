import { Platform } from 'react-native';

/**
 * AudioEngineConfig
 *
 * Central configuration object for all audio DSP pipeline parameters.
 * Every numeric constant that affects detection sensitivity, filtering, or
 * timing is declared here — never hardcoded inside pipeline classes.
 *
 * This allows per-platform tuning without touching business logic.
 */
export interface AudioEngineConfig {
  // ── Noise Floor Calibration ──────────────────────────────────────────────
  /**
   * Duration in milliseconds over which the noise floor is sampled on startup.
   * Longer calibration captures more variation in ambient noise.
   */
  calibrationDurationMs: number;

  /**
   * Multiplier applied to the measured noise floor average to set the
   * final gate threshold (thresholdVal = avgNoiseFloor * calibrationMultiplier).
   */
  calibrationMultiplier: number;

  /**
   * Safety margin added to the noise floor threshold calculation.
   * Helps avoid false-positives under completely silent conditions.
   */
  safetyMargin: number;

  // ── Silence Timeout ──────────────────────────────────────────────────────
  /**
   * Milliseconds to wait after the last valid pitch before clearing the
   * display and resetting internal state.
   */
  silenceTimeoutMs: number;

  // ── YIN Detector ─────────────────────────────────────────────────────────
  /**
   * YIN absolute threshold. Lower values require sharper periodicity for a
   * detection to be accepted.
   */
  yinThreshold: number;

  /**
   * YIN fallback global-minimum threshold.
   */
  yinFallbackThreshold: number;

  // ── Confidence Gate ──────────────────────────────────────────────────────
  /**
   * Minimum YIN confidence score (0–1) required before a frequency is
   * forwarded to the pitch processor.
   */
  confidenceThreshold: number;

  // ── Pitch Filter (Median + EMA) ───────────────────────────────────────────
  /**
   * Sliding window size for the median filter that eliminates outlier spikes.
   */
  medianWindowSize: number;

  /**
   * EMA smoothing factor. Lower alpha = smoother needle but more sluggish.
   */
  emaAlpha: number;

  /**
   * Percentage deviation (0–1) from the last smoothed frequency that triggers
   * a filter reset (assumed to be a new string pluck).
   */
  pitchResetThreshold: number;

  // ── Signal Validator ──────────────────────────────────────────────────────
  /**
   * Number of frames tracked in the stability rolling history.
   */
  stabilityHistorySize: number;

  /**
   * Maximum relative deviation (max - min) / min across the history window
   * for the signal to be considered stable.
   */
  stabilityDeviationLimit: number;

  /**
   * Number of consecutive frames the same chromatic note must appear
   * before being accepted as the locked note.
   */
  debounceFrames: number;

  // ── Note Lock ────────────────────────────────────────────────────────────
  /**
   * Maximum deviation in cents from the locked note's frequency that is
   * still considered "same note".
   */
  noteLockCentsTolerance: number;

  // ── Frequency Validation Bounds ───────────────────────────────────────────
  /**
   * Global lowest frequency (Hz) accepted by the tuner.
   */
  tunerMinFrequency: number;

  /**
   * Global highest frequency (Hz) accepted by the tuner.
   */
  tunerMaxFrequency: number;

  // ── Automatic Gain Control (AGC) ─────────────────────────────────────────
  /** Target normalized RMS level for the AGC output. */
  agcTargetLevel: number;
  /** Maximum gain factor allowed. */
  agcMaxGain: number;
  /** Smoothing factor for gain reduction (attack). */
  agcAttackAlpha: number;
  /** Smoothing factor for gain recovery (release). */
  agcReleaseAlpha: number;

  // ── Dynamic Noise Floor Tracking ─────────────────────────────────────────
  /** Rate at which the estimated noise floor adapts to environment changes during idle. */
  noiseFloorTrackingRate: number;
}

// ---------------------------------------------------------------------------
// Per-platform presets
// ---------------------------------------------------------------------------

const BASE_CONFIG: Omit<AudioEngineConfig, 'emaAlpha' | 'debounceFrames' | 'medianWindowSize' | 'silenceTimeoutMs'> = {
  calibrationDurationMs:   400,
  calibrationMultiplier:   3.0,
  safetyMargin:            0.005,
  confidenceThreshold:     0.45,
  noteLockCentsTolerance:  75,
  stabilityHistorySize:    6,
  stabilityDeviationLimit: 0.02,
  pitchResetThreshold:     0.08,
  yinThreshold:            0.15,
  yinFallbackThreshold:    0.40,
  tunerMinFrequency:       20,
  tunerMaxFrequency:       1500,
  agcTargetLevel:          0.20,
  agcMaxGain:              5.0,
  agcAttackAlpha:          0.80,
  agcReleaseAlpha:         0.02,
  noiseFloorTrackingRate:  0.02,
};

const WEB_CONFIG: AudioEngineConfig = {
  ...BASE_CONFIG,
  emaAlpha:                0.15,
  debounceFrames:          4,
  medianWindowSize:        5,
  silenceTimeoutMs:        300,
};

const IOS_CONFIG: AudioEngineConfig = {
  ...BASE_CONFIG,
  confidenceThreshold:     0.50,
  emaAlpha:                0.10,
  debounceFrames:          5,
  medianWindowSize:        7,
  silenceTimeoutMs:        700,
};

const ANDROID_CONFIG: AudioEngineConfig = {
  ...BASE_CONFIG,
  confidenceThreshold:     0.50,
  emaAlpha:                0.10,
  debounceFrames:          5,
  medianWindowSize:        7,
  silenceTimeoutMs:        700,
};

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export function getAudioEngineConfig(): AudioEngineConfig {
  switch (Platform.OS) {
    case 'ios':
      return IOS_CONFIG;
    case 'android':
      return ANDROID_CONFIG;
    default:
      return WEB_CONFIG;
  }
}
