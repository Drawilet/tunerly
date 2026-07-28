export interface StringNote {
  id: string;        // E.g., "E2", "A2"
  name: string;      // E.g., "E", "A"
  octave: number;    // E.g., 2, 3
  frequency: number; // Target frequency in Hz (A4 = 440Hz standard calibration)
}

export interface Tuning {
  id: string;
  name: string;      // E.g., "Standard", "Drop D"
  notes: StringNote[];
}

export interface Instrument {
  id: string;
  name: string;      // E.g., "Guitar", "Bass"
  icon: string;      // Key for icon drawing
  illustration: string; // Key for headstock illustration
  tunings: Tuning[];
}

// -------------------------------------------------------------
// Guitar Tunings
// -------------------------------------------------------------
export const GUITAR_STANDARD_TUNING: Tuning = {
  id: 'guitar-standard',
  name: 'Standard',
  notes: [
    { id: 'guitar-standard-E2', name: 'E', octave: 2, frequency: 82.41 },
    { id: 'guitar-standard-A2', name: 'A', octave: 2, frequency: 110.0 },
    { id: 'guitar-standard-D3', name: 'D', octave: 3, frequency: 146.83 },
    { id: 'guitar-standard-G3', name: 'G', octave: 3, frequency: 196.0 },
    { id: 'guitar-standard-B3', name: 'B', octave: 3, frequency: 246.94 },
    { id: 'guitar-standard-E4', name: 'E', octave: 4, frequency: 329.63 },
  ],
};

export const GUITAR_DROP_D_TUNING: Tuning = {
  id: 'guitar-drop-d',
  name: 'Drop D',
  notes: [
    { id: 'guitar-drop-d-D2', name: 'D', octave: 2, frequency: 73.42 },
    { id: 'guitar-drop-d-A2', name: 'A', octave: 2, frequency: 110.0 },
    { id: 'guitar-drop-d-D3', name: 'D', octave: 3, frequency: 146.83 },
    { id: 'guitar-drop-d-G3', name: 'G', octave: 3, frequency: 196.0 },
    { id: 'guitar-drop-d-B3', name: 'B', octave: 3, frequency: 246.94 },
    { id: 'guitar-drop-d-E4', name: 'E', octave: 4, frequency: 329.63 },
  ],
};

export const GUITAR_OPEN_G_TUNING: Tuning = {
  id: 'guitar-open-g',
  name: 'Open G',
  notes: [
    { id: 'guitar-open-g-D2', name: 'D', octave: 2, frequency: 73.42 },
    { id: 'guitar-open-g-G2', name: 'G', octave: 2, frequency: 98.0 },
    { id: 'guitar-open-g-D3', name: 'D', octave: 3, frequency: 146.83 },
    { id: 'guitar-open-g-G3', name: 'G', octave: 3, frequency: 196.0 },
    { id: 'guitar-open-g-B3', name: 'B', octave: 3, frequency: 246.94 },
    { id: 'guitar-open-g-D4', name: 'D', octave: 4, frequency: 293.66 },
  ],
};

export const GUITAR_OPEN_D_TUNING: Tuning = {
  id: 'guitar-open-d',
  name: 'Open D',
  notes: [
    { id: 'guitar-open-d-D2', name: 'D', octave: 2, frequency: 73.42 },
    { id: 'guitar-open-d-A2', name: 'A', octave: 2, frequency: 110.0 },
    { id: 'guitar-open-d-D3', name: 'D', octave: 3, frequency: 146.83 },
    { id: 'guitar-open-d-F#3', name: 'F#', octave: 3, frequency: 185.0 },
    { id: 'guitar-open-d-A3', name: 'A', octave: 3, frequency: 220.0 },
    { id: 'guitar-open-d-D4', name: 'D', octave: 4, frequency: 293.66 },
  ],
};

export const GUITAR_DADGAD_TUNING: Tuning = {
  id: 'guitar-dadgad',
  name: 'DADGAD',
  notes: [
    { id: 'guitar-dadgad-D2', name: 'D', octave: 2, frequency: 73.42 },
    { id: 'guitar-dadgad-A2', name: 'A', octave: 2, frequency: 110.0 },
    { id: 'guitar-dadgad-D3', name: 'D', octave: 3, frequency: 146.83 },
    { id: 'guitar-dadgad-G3', name: 'G', octave: 3, frequency: 196.0 },
    { id: 'guitar-dadgad-A3', name: 'A', octave: 3, frequency: 220.0 },
    { id: 'guitar-dadgad-D4', name: 'D', octave: 4, frequency: 293.66 },
  ],
};

// -------------------------------------------------------------
// Bass Tunings
// -------------------------------------------------------------
export const BASS_STANDARD_TUNING: Tuning = {
  id: 'bass-standard',
  name: 'Standard',
  notes: [
    { id: 'bass-standard-E1', name: 'E', octave: 1, frequency: 41.20 },
    { id: 'bass-standard-A1', name: 'A', octave: 1, frequency: 55.00 },
    { id: 'bass-standard-D2', name: 'D', octave: 2, frequency: 73.42 },
    { id: 'bass-standard-G2', name: 'G', octave: 2, frequency: 98.00 },
  ],
};

export const BASS_DROP_D_TUNING: Tuning = {
  id: 'bass-drop-d',
  name: 'Drop D',
  notes: [
    { id: 'bass-drop-d-D1', name: 'D', octave: 1, frequency: 36.71 },
    { id: 'bass-drop-d-A1', name: 'A', octave: 1, frequency: 55.00 },
    { id: 'bass-drop-d-D2', name: 'D', octave: 2, frequency: 73.42 },
    { id: 'bass-drop-d-G2', name: 'G', octave: 2, frequency: 98.00 },
  ],
};

// -------------------------------------------------------------
// Ukulele Tunings
// -------------------------------------------------------------
export const UKULELE_STANDARD_TUNING: Tuning = {
  id: 'ukulele-standard',
  name: 'Standard',
  notes: [
    { id: 'ukulele-standard-G4', name: 'G', octave: 4, frequency: 392.00 },
    { id: 'ukulele-standard-C4', name: 'C', octave: 4, frequency: 261.63 },
    { id: 'ukulele-standard-E4', name: 'E', octave: 4, frequency: 329.63 },
    { id: 'ukulele-standard-A4', name: 'A', octave: 4, frequency: 440.00 },
  ],
};

export const UKULELE_LOW_G_TUNING: Tuning = {
  id: 'ukulele-low-g',
  name: 'Low G',
  notes: [
    { id: 'ukulele-low-g-G3', name: 'G', octave: 3, frequency: 196.00 },
    { id: 'ukulele-low-g-C4', name: 'C', octave: 4, frequency: 261.63 },
    { id: 'ukulele-low-g-E4', name: 'E', octave: 4, frequency: 329.63 },
    { id: 'ukulele-low-g-A4', name: 'A', octave: 4, frequency: 440.00 },
  ],
};

// -------------------------------------------------------------
// Violin Tunings
// -------------------------------------------------------------
export const VIOLIN_STANDARD_TUNING: Tuning = {
  id: 'violin-standard',
  name: 'Standard',
  notes: [
    { id: 'violin-standard-G3', name: 'G', octave: 3, frequency: 196.00 },
    { id: 'violin-standard-D4', name: 'D', octave: 4, frequency: 293.66 },
    { id: 'violin-standard-A4', name: 'A', octave: 4, frequency: 440.00 },
    { id: 'violin-standard-E5', name: 'E', octave: 5, frequency: 659.25 },
  ],
};

// -------------------------------------------------------------
// Supported Instruments Configuration
// -------------------------------------------------------------
export const SUPPORTED_INSTRUMENTS: Instrument[] = [
  {
    id: 'guitar',
    name: 'Guitar',
    icon: 'guitar',
    illustration: 'guitar',
    tunings: [
      GUITAR_STANDARD_TUNING,
      GUITAR_DROP_D_TUNING,
      GUITAR_OPEN_G_TUNING,
      GUITAR_OPEN_D_TUNING,
      GUITAR_DADGAD_TUNING,
    ],
  },
  {
    id: 'bass',
    name: 'Bass',
    icon: 'bass',
    illustration: 'bass',
    tunings: [
      BASS_STANDARD_TUNING,
      BASS_DROP_D_TUNING,
    ],
  },
  {
    id: 'ukulele',
    name: 'Ukulele',
    icon: 'ukulele',
    illustration: 'ukulele',
    tunings: [
      UKULELE_STANDARD_TUNING,
      UKULELE_LOW_G_TUNING,
    ],
  },
  {
    id: 'violin',
    name: 'Violin',
    icon: 'violin',
    illustration: 'violin',
    tunings: [
      VIOLIN_STANDARD_TUNING,
    ],
  },
];
