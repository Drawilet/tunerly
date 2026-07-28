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
  tunings: Tuning[];
}

// -------------------------------------------------------------
// Initial MVP Configuration (Scalable database for future expansion)
// -------------------------------------------------------------

export const GUITAR_STANDARD_TUNING: Tuning = {
  id: 'guitar-standard',
  name: 'Standard',
  notes: [
    { id: 'E2', name: 'E', octave: 2, frequency: 82.41 },
    { id: 'A2', name: 'A', octave: 2, frequency: 110.0 },
    { id: 'D3', name: 'D', octave: 3, frequency: 146.83 },
    { id: 'G3', name: 'G', octave: 3, frequency: 196.0 },
    { id: 'B3', name: 'B', octave: 3, frequency: 246.94 },
    { id: 'E4', name: 'E', octave: 4, frequency: 329.63 },
  ],
};

export const SUPPORTED_INSTRUMENTS: Instrument[] = [
  {
    id: 'guitar',
    name: 'Guitar',
    tunings: [GUITAR_STANDARD_TUNING],
  },
  // Future expansions can be dropped in cleanly:
  /*
  {
    id: 'bass',
    name: 'Bass',
    tunings: [
      {
        id: 'bass-standard',
        name: 'Standard',
        notes: [
          { id: 'E1', name: 'E', octave: 1, frequency: 41.20 },
          { id: 'A1', name: 'A', octave: 1, frequency: 55.00 },
          { id: 'D2', name: 'D', octave: 2, frequency: 73.42 },
          { id: 'G2', name: 'G', octave: 2, frequency: 98.00 }
        ]
      }
    ]
  }
  */
];
