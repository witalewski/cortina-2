import { LessonEngine } from '../LessonEngine';
import { Lesson } from '../Lesson';
import { CHORDS } from '../../music/chords';

describe('LessonEngine', () => {
  let mockLesson: Lesson;
  let engine: LessonEngine;

  beforeEach(() => {
    mockLesson = {
      id: 'test-lesson',
      title: 'Test Lesson',
      description: 'Test description',
      tasks: [
        {
          id: 'task-1',
          instruction: 'Play C major',
          chord: CHORDS.C_MAJOR,
          onIncorrect: 'Try again'
        },
        {
          id: 'task-2',
          instruction: 'Play G major',
          chord: CHORDS.G_MAJOR,
          onIncorrect: 'Not quite'
        }
      ]
    };
    engine = new LessonEngine(mockLesson);
  });

  describe('initialization', () => {
    it('creates engine with correct initial state', () => {
      const state = engine.getState();
      expect(state.currentTaskIndex).toBe(0);
      expect(state.playedNotes).toEqual([]);
      expect(state.status).toBe('showing');
      expect(state.attempts).toBe(0);
      expect(state.lastResult).toBe(null);
      expect(state.hasStarted).toBe(false);
    });

    it('gets current task correctly', () => {
      const currentTask = engine.getCurrentTask();
      expect(currentTask).toEqual(mockLesson.tasks[0]);
    });

    it('returns null for current task when at end', () => {
      // Simulate completing all tasks by actually advancing through them
      engine.startLesson();
      engine.startListening();
      
      // Complete first task
      engine.addNote(60);
      engine.addNote(64);
      engine.addNote(67); // C major
      engine.nextTask();
      
      // Complete second task
      engine.startListening();
      engine.addNote(67);
      engine.addNote(71);
      engine.addNote(74); // G major
      engine.nextTask();
      
      expect(engine.getCurrentTask()).toBeNull();
    });
  });

  describe('lesson flow', () => {
    it('starts lesson correctly', () => {
      engine.startLesson();
      const state = engine.getState();
      expect(state.hasStarted).toBe(true);
      expect(state.status).toBe('showing');
    });

    it('plays chord and returns highlighted notes', () => {
      const highlightedNotes = engine.playChord();
      expect(highlightedNotes).toEqual(CHORDS.C_MAJOR.notes);
      
      const state = engine.getState();
      expect(state.status).toBe('showing');
    });

    it('starts listening and returns highlighted notes', () => {
      const highlightedNotes = engine.startListening();
      expect(highlightedNotes).toEqual(CHORDS.C_MAJOR.notes);
      
      const state = engine.getState();
      expect(state.status).toBe('listening');
      expect(state.playedNotes).toEqual([]);
      expect(state.lastResult).toBe(null);
    });
  });

  describe('note handling', () => {
    beforeEach(() => {
      engine.startListening();
    });

    it('adds notes correctly', () => {
      engine.addNote(60);
      engine.addNote(64);
      
      const state = engine.getState();
      expect(state.playedNotes).toEqual([60, 64]);
    });

    it('prevents duplicate notes', () => {
      engine.addNote(60);
      engine.addNote(60); // Duplicate
      
      const state = engine.getState();
      expect(state.playedNotes).toEqual([60]);
    });

    it('removes notes correctly', () => {
      engine.addNote(60);
      engine.addNote(64);
      engine.addNote(67);
      
      engine.removeNote(64);
      
      const state = engine.getState();
      expect(state.playedNotes).toEqual([60, 67]);
    });

    it('auto-evaluates when exactly 3 notes are played', () => {
      engine.addNote(60);
      engine.addNote(64);
      engine.addNote(67); // C major chord
      
      const state = engine.getState();
      expect(state.status).toBe('evaluating');
      expect(state.attempts).toBe(1);
    });

    it('does not auto-evaluate with wrong number of notes', () => {
      engine.addNote(60);
      engine.addNote(64); // Only 2 notes
      
      const state = engine.getState();
      expect(state.status).toBe('listening');
      expect(state.attempts).toBe(0);
    });

    it('reverts to listening when notes drop below 3 during evaluation', () => {
      // First play 3 correct notes to trigger evaluation
      engine.addNote(60);
      engine.addNote(64);
      engine.addNote(67);
      
      let state = engine.getState();
      expect(state.status).toBe('evaluating');
      
      // Now remove a note
      engine.removeNote(67);
      
      state = engine.getState();
      expect(state.status).toBe('listening');
    });
  });

  describe('evaluation', () => {
    beforeEach(() => {
      engine.startListening();
    });

    it('evaluates correct chord correctly', () => {
      engine.addNote(60);
      engine.addNote(64);
      engine.addNote(67); // C major
      
      const result = engine.getEvaluationResult();
      expect(result).not.toBeNull();
      expect(result!.isCorrect).toBe(true);
      expect(result!.shouldAdvance).toBe(true);
      
      const state = engine.getState();
      expect(state.lastResult).toBe('correct');
    });

    it('evaluates incorrect chord correctly', () => {
      engine.addNote(60);
      engine.addNote(62);
      engine.addNote(64); // Different chord
      
      const result = engine.getEvaluationResult();
      expect(result).not.toBeNull();
      expect(result!.isCorrect).toBe(false);
      expect(result!.shouldAdvance).toBe(false);
      expect(result!.message).toBe('Try again');
      
      const state = engine.getState();
      expect(state.lastResult).toBe('incorrect');
    });

    it('evaluates correct chord in different octave', () => {
      engine.addNote(72);
      engine.addNote(76);
      engine.addNote(79); // C major one octave higher
      
      const result = engine.getEvaluationResult();
      expect(result!.isCorrect).toBe(true);
    });

    it('returns null when not evaluating', () => {
      const result = engine.getEvaluationResult();
      expect(result).toBeNull();
    });
  });

  describe('progression', () => {
    beforeEach(() => {
      engine.startListening();
    });

    it('advances to next task after correct answer', () => {
      // Play correct chord
      engine.addNote(60);
      engine.addNote(64);
      engine.addNote(67);
      
      const advanced = engine.nextTask();
      expect(advanced).toBe(true);
      
      const state = engine.getState();
      expect(state.currentTaskIndex).toBe(1);
      expect(state.status).toBe('showing');
      expect(state.lastResult).toBe(null);
    });

    it('does not advance after incorrect answer', () => {
      // Play incorrect chord
      engine.addNote(60);
      engine.addNote(62);
      engine.addNote(64);
      
      const advanced = engine.nextTask();
      expect(advanced).toBe(false);
      
      const state = engine.getState();
      expect(state.currentTaskIndex).toBe(0);
    });

    it('marks lesson as complete after final task', () => {
      // Complete first task
      engine.addNote(60);
      engine.addNote(64);
      engine.addNote(67);
      engine.nextTask();
      
      // Complete second task
      engine.startListening();
      engine.addNote(67);
      engine.addNote(71);
      engine.addNote(74); // G major
      engine.nextTask();
      
      const state = engine.getState();
      expect(state.status).toBe('complete');
      expect(state.currentTaskIndex).toBe(2); // Beyond tasks length
      expect(engine.getCurrentTask()).toBeNull();
    });

    it('retries task correctly', () => {
      // Play incorrect chord first
      engine.addNote(60);
      engine.addNote(62);
      engine.addNote(64);
      
      engine.retryTask();
      
      const state = engine.getState();
      expect(state.status).toBe('listening');
      expect(state.playedNotes).toEqual([]);
      expect(state.lastResult).toBe(null);
    });
  });

  describe('utility methods', () => {
    it('gets progress correctly', () => {
      let progress = engine.getProgress();
      expect(progress.current).toBe(1); // currentTaskIndex + 1
      expect(progress.total).toBe(2);
      expect(progress.isComplete).toBe(false);
      
      // Actually complete all tasks
      engine.startLesson();
      engine.startListening();
      
      // Complete first task
      engine.addNote(60);
      engine.addNote(64);
      engine.addNote(67); // C major
      engine.nextTask();
      
      // Complete second task
      engine.startListening();
      engine.addNote(67);
      engine.addNote(71);
      engine.addNote(74); // G major
      engine.nextTask();
      
      progress = engine.getProgress();
      expect(progress.isComplete).toBe(true);
    });

    it('gets highlighted notes correctly', () => {
      // During showing
      let highlighted = engine.getHighlightedNotes();
      expect(highlighted).toEqual(CHORDS.C_MAJOR.notes);
      
      // During listening
      engine.startListening();
      highlighted = engine.getHighlightedNotes();
      expect(highlighted).toEqual(CHORDS.C_MAJOR.notes);
      
      // During evaluation
      engine.addNote(60);
      engine.addNote(64);
      engine.addNote(67);
      highlighted = engine.getHighlightedNotes();
      expect(highlighted).toEqual([]);
    });

it('gets instruction text correctly', () => {
      // Complete lesson fully
      engine.startLesson();
      engine.startListening();
      
      // Complete first task
      engine.addNote(60);
      engine.addNote(64);
      engine.addNote(67); // C major
      engine.nextTask();
      
      // Complete second task
      engine.startListening();
      engine.addNote(67);
      engine.addNote(71);
      engine.addNote(74); // G major
      engine.nextTask();
      
      const instruction = engine.getInstructionText();
      expect(instruction).toBe('Lesson complete!');
    });
  });

  describe('reset', () => {
    it('resets lesson to initial state', () => {
      // Do some activity
      engine.startLesson();
      engine.startListening();
      engine.addNote(60);
      engine.addNote(64);
      
      // Reset
      engine.reset();
      
      const state = engine.getState();
      expect(state.currentTaskIndex).toBe(0);
      expect(state.playedNotes).toEqual([]);
      expect(state.status).toBe('showing');
      expect(state.attempts).toBe(0);
      expect(state.lastResult).toBe(null);
      expect(state.hasStarted).toBe(false);
    });
  });
});