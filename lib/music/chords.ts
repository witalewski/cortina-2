/**
 * Music theory utilities for chord handling
 * Pure functions with no dependencies - easily testable and reusable
 */

export type ChordType = 'major' | 'minor' | 'diminished' | 'augmented';

export interface Chord {
  name: string;
  notes: number[]; // MIDI note numbers
  type: ChordType;
}

/**
 * Predefined chords near middle of 25-key keyboard (C4-G4 range)
 * These are positioned to be comfortable for users while staying visible
 */
export const CHORDS: Record<string, Chord> = {
  C_MAJOR: { 
    name: 'C major', 
    notes: [60, 64, 67], // C4-E4-G4
    type: 'major' 
  },
  G_MAJOR: { 
    name: 'G major', 
    notes: [67, 71, 74], // G4-B4-D5
    type: 'major' 
  },
  A_MINOR: { 
    name: 'A minor', 
    notes: [69, 72, 76], // A4-C5-E5
    type: 'minor' 
  },
  F_MAJOR: { 
    name: 'F major', 
    notes: [65, 69, 72], // F4-A4-C5
    type: 'major' 
  },
};

/**
 * Get chord by key identifier
 */
export function getChord(key: string): Chord | undefined {
  return CHORDS[key];
}

/**
 * Check if a MIDI note number is valid
 */
export function isValidMidiNote(note: number): boolean {
  return Number.isInteger(note) && note >= 0 && note <= 127;
}

/**
 * Validate a chord structure
 */
export function validateChord(chord: Chord): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!chord.name || chord.name.trim().length === 0) {
    errors.push('Chord name is required');
  }
  
  if (!Array.isArray(chord.notes) || chord.notes.length !== 3) {
    errors.push('Chord must have exactly 3 notes');
  } else {
    chord.notes.forEach((note, index) => {
      if (!isValidMidiNote(note)) {
        errors.push(`Note ${index + 1} (${note}) is not a valid MIDI note`);
      }
    });
  }
  
  const validTypes: ChordType[] = ['major', 'minor', 'diminished', 'augmented'];
  if (!validTypes.includes(chord.type)) {
    errors.push(`Invalid chord type: ${chord.type}`);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}