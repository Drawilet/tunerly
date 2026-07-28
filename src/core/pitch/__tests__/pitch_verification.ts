import { YinDetector } from '../algorithms/yin';
import { PitchProcessor } from '../services/PitchProcessor';
import { PitchFilter } from '../services/PitchFilter';
import { GUITAR_STANDARD_TUNING } from '../../../features/tuner/domain/models/TunerModels';

interface TestResult {
  name: string;
  expectedFreq: number;
  detectedFreq: number;
  expectedNote: string;
  detectedNote: string;
  expectedCents: number;
  detectedCents: number;
  passed: boolean;
  message?: string;
}

function runVerification() {
  console.log('==================================================');
  console.log('         TUNERLY DSP VERIFICATION SUITE           ');
  console.log('==================================================');

  const sampleRate = 44100;
  const bufferSize = 4096;
  const detector = new YinDetector(0.15);
  const tuningNotes = GUITAR_STANDARD_TUNING.notes;

  const testCases = [
    // Standard In-Tune Strings
    { name: 'E2 In-Tune', frequency: 82.41, expectedNote: 'E', expectedOctave: 2, expectedCents: 0 },
    { name: 'A2 In-Tune', frequency: 110.00, expectedNote: 'A', expectedOctave: 2, expectedCents: 0 },
    { name: 'D3 In-Tune', frequency: 146.83, expectedNote: 'D', expectedOctave: 3, expectedCents: 0 },
    { name: 'G3 In-Tune', frequency: 196.00, expectedNote: 'G', expectedOctave: 3, expectedCents: 0 },
    { name: 'B3 In-Tune', frequency: 246.94, expectedNote: 'B', expectedOctave: 3, expectedCents: 0 },
    { name: 'E4 In-Tune', frequency: 329.63, expectedNote: 'E', expectedOctave: 4, expectedCents: 0 },

    // Flat / Sharp Strings
    {
      name: 'A2 Flat (-15 Cents)',
      // f = 110 * 2^(-15/1200) = 109.05 Hz
      frequency: 110.00 * Math.pow(2, -15 / 1200),
      expectedNote: 'A',
      expectedOctave: 2,
      expectedCents: -15,
    },
    {
      name: 'G3 Sharp (+25 Cents)',
      // f = 196 * 2^(25/1200) = 198.85 Hz
      frequency: 196.00 * Math.pow(2, 25 / 1200),
      expectedNote: 'G',
      expectedOctave: 3,
      expectedCents: 25,
    },
  ];

  const results: TestResult[] = [];
  let passedCount = 0;

  for (const tc of testCases) {
    // 1. Generate pure sine wave buffer
    const buffer = new Float32Array(bufferSize);
    for (let i = 0; i < bufferSize; i++) {
      const t = i / sampleRate;
      buffer[i] = Math.sin(2 * Math.PI * tc.frequency * t);
    }

    // 2. Detect pitch
    const yinResult = detector.detect(buffer, sampleRate);

    if (yinResult.frequency === 0) {
      results.push({
        name: tc.name,
        expectedFreq: tc.frequency,
        detectedFreq: 0,
        expectedNote: tc.expectedNote,
        detectedNote: 'None',
        expectedCents: tc.expectedCents,
        detectedCents: 0,
        passed: false,
        message: 'No pitch detected by YIN algorithm.',
      });
      continue;
    }

    // 3. Process pitch details (Auto Mode)
    const pitchDetails = PitchProcessor.process(
      yinResult.frequency,
      yinResult.confidence,
      tuningNotes,
      null, // Auto detect
      440,
      0.4
    );

    if (!pitchDetails) {
      results.push({
        name: tc.name,
        expectedFreq: tc.frequency,
        detectedFreq: yinResult.frequency,
        expectedNote: tc.expectedNote,
        detectedNote: 'None',
        expectedCents: tc.expectedCents,
        detectedCents: 0,
        passed: false,
        message: 'Pitch details returned null (confidence too low).',
      });
      continue;
    }

    // 4. Verify results
    const freqMatch = Math.abs(yinResult.frequency - tc.frequency) < 0.5; // Within 0.5 Hz
    const noteMatch = pitchDetails.noteName === tc.expectedNote && pitchDetails.octave === tc.expectedOctave;
    const centsMatch = Math.abs(pitchDetails.cents - tc.expectedCents) < 2.0; // Within 2 cents tolerance

    const passed = freqMatch && noteMatch && centsMatch;
    if (passed) passedCount++;

    let message = '';
    if (!freqMatch) message += `Freq mismatch (Expected: ${tc.frequency.toFixed(2)}Hz, Got: ${yinResult.frequency.toFixed(2)}Hz). `;
    if (!noteMatch) message += `Note mismatch (Expected: ${tc.expectedNote}${tc.expectedOctave}, Got: ${pitchDetails.noteName}${pitchDetails.octave}). `;
    if (!centsMatch) message += `Cents mismatch (Expected: ${tc.expectedCents}, Got: ${pitchDetails.cents.toFixed(1)}). `;

    results.push({
      name: tc.name,
      expectedFreq: tc.frequency,
      detectedFreq: yinResult.frequency,
      expectedNote: `${tc.expectedNote}${tc.expectedOctave}`,
      detectedNote: `${pitchDetails.noteName}${pitchDetails.octave}`,
      expectedCents: tc.expectedCents,
      detectedCents: Math.round(pitchDetails.cents),
      passed,
      message: message || 'All metrics passed perfectly.',
    });
  }

  // Print YIN + Processor results
  for (const r of results) {
    const statusSymbol = r.passed ? '✅ PASSED' : '❌ FAILED';
    console.log(`[${statusSymbol}] ${r.name}`);
    console.log(`  - Freq: Expected ${r.expectedFreq.toFixed(2)} Hz, Got ${r.detectedFreq.toFixed(2)} Hz`);
    console.log(`  - Note: Expected ${r.expectedNote}, Got ${r.detectedNote}`);
    console.log(`  - Cents: Expected ${r.expectedCents}, Got ${r.detectedCents}`);
    if (!r.passed) {
      console.log(`  - Details: ${r.message}`);
    }
    console.log('--------------------------------------------------');
  }

  // PitchFilter Verification
  console.log('\n--- VERIFYING PITCH FILTER STATEFUL DSP ---');
  let filterPassed = true;

  // Test Case A: Outlier / Octave Jump rejection
  const filterA = new PitchFilter(5, 0.20, 0.08);
  // Feed normal 110Hz input
  filterA.filter(110);
  filterA.filter(110);
  filterA.filter(110);
  // Feed a giant tracking glitch (e.g. octave jump to 220Hz)
  const outputGlitch = filterA.filter(220);
  // Because it is a median filter of size 5, the median of [110, 110, 110, 220] is 110.
  // The EMA output should remain near 110, completely ignoring the 220 outlier!
  const glitchPassed = Math.abs(outputGlitch - 110) < 1.0;
  console.log(`[${glitchPassed ? '✅ PASSED' : '❌ FAILED'}] Glitch Rejection (Outlier: 220Hz, Filter Output: ${outputGlitch.toFixed(2)}Hz)`);
  if (!glitchPassed) filterPassed = false;

  // Test Case B: Auto-reset on string change
  const filterB = new PitchFilter(5, 0.20, 0.08);
  // Settle at 110Hz
  filterB.filter(110);
  filterB.filter(110);
  filterB.filter(110);
  filterB.filter(110);
  filterB.filter(110);
  // Pluck a different string (e.g. E4 at 329.63Hz, which is > 8% jump)
  filterB.filter(329.63); // 1st frame: marks deviation but doesn't reset yet
  const outputReset = filterB.filter(329.63); // 2nd frame: triggers reset and snaps
  // The filter should detect the jump, trigger reset(), and immediately snap to 329.63
  const resetPassed = Math.abs(outputReset - 329.63) < 0.01;
  console.log(`[${resetPassed ? '✅ PASSED' : '❌ FAILED'}] Auto-Reset on String Change (Target: 329.63Hz, Filter Output: ${outputReset.toFixed(2)}Hz)`);
  if (!resetPassed) filterPassed = false;

  console.log('--------------------------------------------------');

  const overallPassed = (passedCount === testCases.length) && filterPassed;
  console.log(`VERIFICATION SUMMARY: YIN ${passedCount}/${testCases.length} Passed, Filter: ${filterPassed ? 'PASS' : 'FAIL'}`);
  console.log(`Overall Status: ${overallPassed ? 'SUCCESS' : 'FAILURE'}`);
  console.log('==================================================');

  // Exit with error if any tests failed
  process.exit(overallPassed ? 0 : 1);
}

runVerification();
