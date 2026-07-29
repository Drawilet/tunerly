import { InstrumentBandpassFilter } from '../services/SignalFilter';
import { SignalValidator } from '../services/SignalValidator';

function testIIRFilters() {
  console.log('Testing BiquadFilter and InstrumentBandpassFilter...');
  
  const sampleRate = 44100;
  const filter = new InstrumentBandpassFilter();
  
  // Test configure Guitar: low 70Hz, high 1400Hz
  filter.configure('guitar', sampleRate);
  
  // Create an impulse or simple buffer
  const buffer = new Float32Array(100);
  buffer[0] = 1.0; // Impulse
  
  const filtered = filter.filter(buffer);
  
  // Verify it executes without throwing and output is processed
  let hasOutput = false;
  for (let i = 0; i < filtered.length; i++) {
    if (Math.abs(filtered[i]) > 0) {
      hasOutput = true;
      break;
    }
  }
  
  if (hasOutput) {
    console.log('[✅ PASSED] IIR Filter execution');
  } else {
    throw new Error('[❌ FAILED] IIR Filter produced all zeros');
  }

  // Test Bass filter configuration
  filter.configure('bass', sampleRate);
  console.log('[✅ PASSED] Dynamic instrument configuration');
}

function testSignalValidator() {
  console.log('Testing SignalValidator...');
  const validator = new SignalValidator();

  // 1. Test Frequency Bounds check
  const g1 = validator.isFrequencyInBounds(82.4, 'guitar'); // Guitar low E
  const g2 = validator.isFrequencyInBounds(2000, 'guitar'); // High out-of-bounds
  const b1 = validator.isFrequencyInBounds(30, 'bass'); // Bass low B/E
  const b2 = validator.isFrequencyInBounds(82.4, 'bass'); // Bass E (valid)
  
  if (g1 && !g2 && b1 && b2) {
    console.log('[✅ PASSED] Frequency Bounds check');
  } else {
    throw new Error('[❌ FAILED] Frequency Bounds check returned incorrect values');
  }

  // 2. Test Stability check (requires 6 frames with < 2% deviation)
  // Initially should not be stable (needs 6 frames)
  let stable = false;
  for (let i = 0; i < 5; i++) {
    stable = validator.validateStability(440);
  }
  if (!stable) {
    console.log('[✅ PASSED] Stability is false before buffer is full');
  } else {
    throw new Error('[❌ FAILED] Stability reported true before filling buffer');
  }

  // After 6th frame of identical freq, it should be stable
  stable = validator.validateStability(440);
  if (stable) {
    console.log('[✅ PASSED] Stability is true for stable identical frequency');
  } else {
    throw new Error('[❌ FAILED] Stability reported false for identical frequency');
  }

  // Adding a deviating frequency (e.g. 455Hz is ~3.4% higher than 440Hz)
  stable = validator.validateStability(455);
  if (!stable) {
    console.log('[✅ PASSED] Stability is false for unstable frequency deviation');
  } else {
    throw new Error('[❌ FAILED] Stability reported true for > 2% deviation');
  }

  // 3. Test Debouncing Note Changes (requires 4 stable consecutive frames of the same note)
  validator.reset();
  
  // Set candidate to 'E2'
  let debounced = validator.debounceNoteChange('E2');
  if (!debounced) {
    console.log('[✅ PASSED] Debouncing requires multiple frames');
  } else {
    throw new Error('[❌ FAILED] Debouncing resolved on first frame');
  }

  // Feed 2 more E2 frames
  validator.debounceNoteChange('E2');
  validator.debounceNoteChange('E2');
  
  // 4th frame should resolve as true
  debounced = validator.debounceNoteChange('E2');
  if (debounced) {
    console.log('[✅ PASSED] Debouncing accepts stable note after 4 frames');
  } else {
    throw new Error('[❌ FAILED] Debouncing failed to accept stable note after 4 frames');
  }

  // Changing candidate note should reset count
  debounced = validator.debounceNoteChange('A2');
  if (!debounced) {
    console.log('[✅ PASSED] Debouncing resets on note change');
  } else {
    throw new Error('[❌ FAILED] Debouncing allowed instant switch to new note');
  }
}

try {
  console.log('==================================================');
  console.log('     TUNERLY PIPELINE VERIFICATION SUITE          ');
  console.log('==================================================');
  testIIRFilters();
  console.log('--------------------------------------------------');
  testSignalValidator();
  console.log('==================================================');
  console.log('STATUS: ALL TESTS PASSED SUCCESSFULLY');
  console.log('==================================================');
  // @ts-ignore
  process.exit(0);
} catch (error: any) {
  console.error(error.message);
  // @ts-ignore
  process.exit(1);
}
