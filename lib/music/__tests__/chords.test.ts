import { CHORDS, getChord, validateChord, isValidMidiNote } from '../chords';

describe('chords', () => {
  describe('CHORDS', () => {
    it('defines C major chord correctly', () => {
      const cMajor = CHORDS.C_MAJOR;
      expect(cMajor.name).toBe('C major');
      expect(cMajor.notes).toEqual([60, 64, 67]); // C4-E4-G4
      expect(cMajor.type).toBe('major');
    });

    it('defines G major chord correctly', () => {
      const gMajor = CHORDS.G_MAJOR;
      expect(gMajor.name).toBe('G major');
      expect(gMajor.notes).toEqual([67, 71, 74]); // G4-B4-D5
      expect(gMajor.type).toBe('major');
    });

    it('defines A minor chord correctly', () => {
      const aMinor = CHORDS.A_MINOR;
      expect(aMinor.name).toBe('A minor');
      expect(aMinor.notes).toEqual([69, 72, 76]); // A4-C5-E5
      expect(aMinor.type).toBe('minor');
    });

    it('defines F major chord correctly', () => {
      const fMajor = CHORDS.F_MAJOR;
      expect(fMajor.name).toBe('F major');
      expect(fMajor.notes).toEqual([65, 69, 72]); // F4-A4-C5
      expect(fMajor.type).toBe('major');
    });

    it('all chords have exactly 3 notes', () => {
      Object.values(CHORDS).forEach(chord => {
        expect(chord.notes).toHaveLength(3);
        chord.notes.forEach(note => {
          expect(isValidMidiNote(note)).toBe(true);
        });
      });
    });
  });

  describe('getChord', () => {
    it('returns the correct chord for valid keys', () => {
      const cMajor = getChord('C_MAJOR');
      expect(cMajor).toEqual(CHORDS.C_MAJOR);
    });

    it('returns undefined for invalid keys', () => {
      const invalid = getChord('INVALID_CHORD');
      expect(invalid).toBeUndefined();
    });
  });

  describe('validateChord', () => {
    it('validates correct chord', () => {
      const result = validateChord(CHORDS.C_MAJOR);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('detects invalid chord name', () => {
      const invalidChord = {
        name: '',
        notes: [60, 64, 67],
        type: 'major' as const
      };
      const result = validateChord(invalidChord);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Chord name is required');
    });

    it('detects wrong number of notes', () => {
      const invalidChord = {
        name: 'Test chord',
        notes: [60, 64], // Only 2 notes
        type: 'major' as const
      };
      const result = validateChord(invalidChord);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Chord must have exactly 3 notes');
    });

    it('detects invalid MIDI notes', () => {
      const invalidChord = {
        name: 'Test chord',
        notes: [60, -1, 67], // Invalid MIDI note
        type: 'major' as const
      };
      const result = validateChord(invalidChord);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Note 2 (-1) is not a valid MIDI note');
    });

    it('detects invalid chord type', () => {
      const invalidChord = {
        name: 'Test chord',
        notes: [60, 64, 67],
        type: 'invalid' as any
      };
      const result = validateChord(invalidChord);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid chord type: invalid');
    });
  });

  describe('isValidMidiNote', () => {
    it('returns true for valid MIDI notes', () => {
      expect(isValidMidiNote(0)).toBe(true);
      expect(isValidMidiNote(60)).toBe(true);
      expect(isValidMidiNote(127)).toBe(true);
    });

    it('returns false for invalid MIDI notes', () => {
      expect(isValidMidiNote(-1)).toBe(false);
      expect(isValidMidiNote(128)).toBe(false);
      expect(isValidMidiNote(60.5)).toBe(false);
    });
  });
});