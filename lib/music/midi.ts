/**
 * Music theory utilities for MIDI note handling
 * Pure functions with no dependencies - easily testable and reusable
 */

const NOTE_NAMES = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
];

/**
 * Converts a MIDI note number to a pitch-octave string (e.g., 60 → "C4")
 * Follows the convention: MIDI 60 = C4 (middle C)
 * @param midi - MIDI note number (0-127)
 * @returns Note name with octave (e.g., "C4", "A#3")
 */
export function midiToNoteName(midi: number): string {
  if (!isValidMidiNote(midi)) {
    throw new Error(
      `Invalid MIDI note number: ${midi}. Must be between 0 and 127.`,
    );
  }

  const noteName = NOTE_NAMES[midi % 12];
  const octave = Math.floor(midi / 12) - 1;

  return `${noteName}${octave}`;
}

/**
 * Normalizes MIDI velocity (0-127) to gain (0-1) for audio engines
 * @param velocity - MIDI velocity value (0-127)
 * @returns Normalized gain value (0-1)
 */
export function velocityToGain(velocity: number): number {
  if (velocity < 0 || velocity > 127) {
    throw new Error(
      `Invalid velocity: ${velocity}. Must be between 0 and 127.`,
    );
  }

  return velocity / 127;
}

/**
 * Checks if a number is a valid MIDI note (0-127)
 * @param note - Number to validate
 * @returns True if note is in valid MIDI range
 */
export function isValidMidiNote(note: number): boolean {
  return Number.isInteger(note) && note >= 0 && note <= 127;
}
