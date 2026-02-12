import { 
  midiToNoteClass, 
  compareChord, 
  hasThreeNotes, 
  hasMinimumNotes, 
  hasUniqueNoteClasses,
  findBestMatch 
} from '../noteComparison';
import { CHORDS } from '../chords';

describe('noteComparison', () => {
  describe('midiToNoteClass', () => {
    it('converts MIDI notes to note classes correctly', () => {
      expect(midiToNoteClass(60)).toBe(0); // C
      expect(midiToNoteClass(61)).toBe(1); // C#
      expect(midiToNoteClass(62)).toBe(2); // D
      expect(midiToNoteClass(72)).toBe(0); // C (octave higher)
      expect(midiToNoteClass(48)).toBe(0); // C (octave lower)
    });
  });

  describe('hasThreeNotes', () => {
    it('returns true for exactly 3 notes', () => {
      expect(hasThreeNotes([60, 64, 67])).toBe(true);
    });

    it('returns false for other numbers of notes', () => {
      expect(hasThreeNotes([])).toBe(false);
      expect(hasThreeNotes([60])).toBe(false);
      expect(hasThreeNotes([60, 64])).toBe(false);
      expect(hasThreeNotes([60, 64, 67, 71])).toBe(false);
    });
  });

  describe('hasMinimumNotes', () => {
    it('returns true for 3 or more notes', () => {
      expect(hasMinimumNotes([60, 64, 67])).toBe(true);
      expect(hasMinimumNotes([60, 64, 67, 71])).toBe(true);
    });

    it('returns false for fewer than 3 notes', () => {
      expect(hasMinimumNotes([])).toBe(false);
      expect(hasMinimumNotes([60])).toBe(false);
      expect(hasMinimumNotes([60, 64])).toBe(false);
    });
  });

  describe('hasUniqueNoteClasses', () => {
    it('returns true for unique note classes', () => {
      expect(hasUniqueNoteClasses([60, 64, 67])).toBe(true); // C E G
      expect(hasUniqueNoteClasses([72, 64, 67])).toBe(true); // C E G (different octaves)
    });

    it('returns false for duplicate note classes', () => {
      expect(hasUniqueNoteClasses([60, 72, 64])).toBe(false); // C C E
      expect(hasUniqueNoteClasses([60, 60, 64])).toBe(false); // C C E (same octave)
    });
  });

  describe('compareChord', () => {
    it('matches exact chord in same octave', () => {
      const result = compareChord([60, 64, 67], CHORDS.C_MAJOR);
      expect(result.isCorrect).toBe(true);
      expect(result.missingNotes).toEqual([]);
      expect(result.extraNotes).toEqual([]);
    });

    it('matches chord in different octaves', () => {
      // C major played in different octaves
      const result = compareChord([72, 76, 79], CHORDS.C_MAJOR); // C5 E5 G5
      expect(result.isCorrect).toBe(true);
      expect(result.missingNotes).toEqual([]);
      expect(result.extraNotes).toEqual([]);
    });

    it('matches chord with mixed octaves', () => {
      const result = compareChord([60, 76, 67], CHORDS.C_MAJOR); // C4 E5 G4
      expect(result.isCorrect).toBe(true);
      expect(result.missingNotes).toEqual([]);
      expect(result.extraNotes).toEqual([]);
    });

    it('detects missing notes', () => {
      const result = compareChord([60, 64], CHORDS.C_MAJOR); // Missing G
      expect(result.isCorrect).toBe(false);
      expect(result.missingNotes).toContain(67); // G4
      expect(result.extraNotes).toEqual([]);
    });

    it('detects extra notes', () => {
      const result = compareChord([60, 64, 67, 71], CHORDS.C_MAJOR); // Extra B
      expect(result.isCorrect).toBe(false);
      expect(result.missingNotes).toEqual([]);
      expect(result.extraNotes).toContain(71); // B4
    });

    it('detects both missing and extra notes', () => {
      const result = compareChord([60, 64, 71], CHORDS.C_MAJOR); // C E B instead of C E G
      expect(result.isCorrect).toBe(false);
      expect(result.missingNotes).toContain(67); // G4
      expect(result.extraNotes).toContain(71); // B4
    });

    it('handles completely wrong chord', () => {
      const result = compareChord([62, 65, 69], CHORDS.C_MAJOR); // D F A
      expect(result.isCorrect).toBe(false);
      expect(result.missingNotes).toHaveLength(3);
      expect(result.extraNotes).toHaveLength(3);
    });
  });

  describe('findBestMatch', () => {
    const candidates = Object.values(CHORDS);

    it('finds exact match', () => {
      const result = findBestMatch([60, 64, 67], candidates);
      expect(result.chord).toBe(CHORDS.C_MAJOR);
      expect(result.confidence).toBe(1.0);
    });

    it('finds best partial match', () => {
      const result = findBestMatch([60, 64, 65], candidates); // C E F (2/3 of C major)
      expect(result.chord).toBe(CHORDS.C_MAJOR);
      expect(result.confidence).toBeCloseTo(0.67, 2);
    });

    it('returns null for no matches', () => {
      const result = findBestMatch([], candidates);
      expect(result.chord).toBeNull();
      expect(result.confidence).toBe(0);
    });
  });
});