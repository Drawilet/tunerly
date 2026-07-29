import { StringNote } from '../../../features/tuner/domain/models/TunerModels';

export interface DetectedPitch {
  frequency: number;
  confidence: number;
  noteName: string;        // E.g. "A", "C#"
  octave: number;          // E.g. 2, 3
  cents: number;           // Deviation in cents relative to the targetNote
  targetNote: StringNote;  // The guitar string note we are tuning against
  isTargetNote: boolean;   // True if the played note matches the targetNote (ignoring deviation)
  isClose: boolean;        // Within +/- 5 cents
  isInTune: boolean;       // Within +/- 2 cents (standard performance requirement)
}

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export class PitchProcessor {
  /**
   * Convert frequency to fractional MIDI note number (standard A4 = 440Hz).
   */
  static frequencyToMidi(frequency: number, calibrationA4 = 440): number {
    return 12 * Math.log2(frequency / calibrationA4) + 69;
  }

  /**
   * Convert MIDI note number to frequency.
   */
  static midiToFrequency(midi: number, calibrationA4 = 440): number {
    return calibrationA4 * Math.pow(2, (midi - 69) / 12);
  }

  /**
   * Convert integer MIDI note to note name and octave.
   */
  static midiToNoteDetails(midi: number): { noteName: string; octave: number } {
    const noteIndex = Math.round(midi);
    const noteName = NOTE_NAMES[((noteIndex % 12) + 12) % 12];
    const octave = Math.floor(noteIndex / 12) - 1;
    return { noteName, octave };
  }

  /**
   * Process raw frequency input and match it with standard tuning.
   */
  static process(
    frequency: number,
    confidence: number,
    tuningNotes: StringNote[],
    selectedNote: StringNote | null,
    calibrationA4 = 440,
    confidenceThreshold = 0.5
  ): DetectedPitch | null {
    // 20Hz is flat E0/A0, 1500Hz is high F#6 with plenty of headroom.
    if (
      frequency < 20 ||
      frequency > 1500 ||
      confidence < confidenceThreshold ||
      isNaN(frequency)
    ) {
      return null;
    }

    // 1. Calculate played chromatic note details
    const playedMidi = this.frequencyToMidi(frequency, calibrationA4);
    const closestMidi = Math.round(playedMidi);
    const { noteName, octave } = this.midiToNoteDetails(closestMidi);
    const chromaticFrequency = this.midiToFrequency(closestMidi, calibrationA4);

    // 2. Select the target note
    let targetNote: StringNote;

    if (selectedNote) {
      // Manual Mode: locked to the selected note
      targetNote = selectedNote;
    } else {
      // Auto Mode: automatically detect the closest string from the tuning list
      // BUT for chromatic behavior, the actual cents calculation is done relative to the closest chromatic note!
      // If the closest chromatic note matches one of the tuning strings, we use that tuning string as the target note.
      // If it doesn't match any tuning string, we create a temporary StringNote representing the chromatic note.
      
      const matchedTuningNote = tuningNotes.find((note) => {
        const noteMidi = this.frequencyToMidi(note.frequency, calibrationA4);
        return Math.round(noteMidi) === closestMidi;
      });

      if (matchedTuningNote) {
        targetNote = matchedTuningNote;
      } else {
        targetNote = {
          id: `chromatic-${closestMidi}`,
          name: noteName,
          octave: octave,
          frequency: chromaticFrequency,
        };
      }
    }

    // 3. Calculate deviation in cents relative to the target note's exact frequency
    const cents = 1200 * Math.log2(frequency / targetNote.frequency);

    // 4. Calculate statuses
    // Is the played chromatic note one of the active tuning strings?
    const isTargetNote = selectedNote
      ? closestMidi === Math.round(this.frequencyToMidi(selectedNote.frequency, calibrationA4))
      : tuningNotes.some((note) => Math.round(this.frequencyToMidi(note.frequency, calibrationA4)) === closestMidi);

    // In-tune definitions
    const absCents = Math.abs(cents);
    const isClose = absCents <= 5;
    const isInTune = absCents <= 2;

    return {
      frequency,
      confidence,
      noteName,
      octave,
      cents,
      targetNote,
      isTargetNote,
      isClose,
      isInTune,
    };
  }
}
