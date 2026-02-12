/**
 * Music theory utilities for comparing played notes with target chords
 * Pure functions with no dependencies - easily testable and reusable
 */

import { Chord } from './chords';

/**
 * Compare played notes with target chord, accepting any octave
 * Uses note classes (mod 12) to match notes regardless of octave
 */
export interface ChordComparisonResult {
  isCorrect: boolean;
  missingNotes: number[]; // MIDI note numbers that were missing
  extraNotes: number[]; // MIDI note numbers that were extra
}

/**
 * Convert MIDI note to note class (0-11 representing C-B)
 * This allows octave-agnostic comparison
 */
export function midiToNoteClass(midi: number): number {
  return midi % 12;
}

/**
 * Compare two arrays of note classes for exact match
 */
function arraysEqual(a: number[], b: number[]): boolean {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  return sortedA.every((val, index) => val === sortedB[index]);
}

/**
 * Compare played notes with target chord
 * Accepts any octave by comparing note classes (mod 12)
 */
export function compareChord(playedNotes: number[], targetChord: Chord): ChordComparisonResult {
  // Convert to note classes for octave-agnostic comparison
  const playedClasses = playedNotes.map(midiToNoteClass);
  const targetClasses = targetChord.notes.map(midiToNoteClass);
  
  // Check for exact match
  const isCorrect = arraysEqual(playedClasses, targetClasses);
  
  if (isCorrect) {
    return {
      isCorrect: true,
      missingNotes: [],
      extraNotes: []
    };
  }
  
  // Find missing and extra notes
  const missingNoteClasses = targetClasses.filter(cls => !playedClasses.includes(cls));
  const extraNoteClasses = playedClasses.filter(cls => !targetClasses.includes(cls));
  
  // Convert back to MIDI note numbers (using the original chord notes as reference)
  const missingNotes = missingNoteClasses.map(cls => 
    targetChord.notes.find(note => midiToNoteClass(note) === cls) || -1
  ).filter(note => note !== -1);
  
  // For extra notes, we can't easily map back to specific MIDI numbers
  // since they could be from any octave, so we'll return the original played notes
  const extraNotes = extraNoteClasses.map(cls => 
    playedNotes.find(note => midiToNoteClass(note) === cls) || -1
  ).filter(note => note !== -1);
  
  return {
    isCorrect: false,
    missingNotes,
    extraNotes
  };
}

/**
 * Check if the user has played exactly 3 notes
 */
export function hasThreeNotes(notes: number[]): boolean {
  return notes.length === 3;
}

/**
 * Check if the user has played enough notes to evaluate (>= 3)
 */
export function hasMinimumNotes(notes: number[]): boolean {
  return notes.length >= 3;
}

/**
 * Check if the played notes form a valid chord (no duplicate note classes)
 */
export function hasUniqueNoteClasses(notes: number[]): boolean {
  const noteClasses = notes.map(midiToNoteClass);
  const uniqueClasses = new Set(noteClasses);
  return uniqueClasses.size === notes.length;
}

/**
 * Get the most likely chord match from a list of candidates
 * Useful for future features like chord recognition
 */
export function findBestMatch(playedNotes: number[], candidates: Chord[]): {
  chord: Chord | null;
  confidence: number;
} {
  let bestMatch: Chord | null = null;
  let bestScore = 0;
  
  for (const candidate of candidates) {
    const comparison = compareChord(playedNotes, candidate);
    if (comparison.isCorrect) {
      return { chord: candidate, confidence: 1.0 };
    }
    
    // Calculate partial match score
    const playedClasses = playedNotes.map(midiToNoteClass);
    const targetClasses = candidate.notes.map(midiToNoteClass);
    const matches = playedClasses.filter(cls => targetClasses.includes(cls)).length;
    const score = matches / Math.max(playedClasses.length, targetClasses.length);
    
    if (score > bestScore) {
      bestScore = score;
      bestMatch = candidate;
    }
  }
  
  return { chord: bestMatch, confidence: bestScore };
}