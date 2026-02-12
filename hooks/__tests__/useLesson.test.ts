import { renderHook, act, waitFor } from '@testing-library/react';
import { useLesson } from '../useLesson';
import { Lesson } from '@/lib/lessons/Lesson';
import { CHORDS } from '@/lib/music/chords';

// Mock the audio callbacks
const mockOnNoteOn = jest.fn();
const mockOnNoteOff = jest.fn();

// Mock timers for chord playback
jest.useFakeTimers();

describe('useLesson', () => {
  let mockLesson: Lesson;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
    
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
        }
      ]
    };
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('initializes with correct state', () => {
    const { result } = renderHook(() => 
      useLesson({ lesson: mockLesson, onNoteOn: mockOnNoteOn, onNoteOff: mockOnNoteOff })
    );

    expect(result.current.state.status).toBe('showing');
    expect(result.current.state.hasStarted).toBe(false);
    expect(result.current.highlightedNotes).toEqual([]);
    expect(result.current.instructionText).toBe('Play C major');
    expect(result.current.progress.current).toBe(1);
    expect(result.current.progress.total).toBe(1);
  });

  it('starts lesson and plays example chord', () => {
    const { result } = renderHook(() => 
      useLesson({ lesson: mockLesson, onNoteOn: mockOnNoteOn, onNoteOff: mockOnNoteOff })
    );

    act(() => {
      result.current.startLesson();
    });

    expect(result.current.state.hasStarted).toBe(true);
    expect(result.current.state.status).toBe('showing');
    expect(result.current.highlightedNotes).toEqual(CHORDS.C_MAJOR.notes);
    
    // Should have started playing chord notes
    expect(mockOnNoteOn).toHaveBeenCalledTimes(3);
    expect(mockOnNoteOff).toHaveBeenCalledTimes(0);
    
    // Advance timers to trigger note off
    act(() => {
      jest.advanceTimersByTime(2000);
    });
    
    expect(mockOnNoteOff).toHaveBeenCalledTimes(3);
  });

  it('starts listening phase', () => {
    const { result } = renderHook(() => 
      useLesson({ lesson: mockLesson, onNoteOn: mockOnNoteOn, onNoteOff: mockOnNoteOff })
    );

    act(() => {
      result.current.startLesson();
      result.current.startListening();
    });

    expect(result.current.state.status).toBe('listening');
    expect(result.current.state.playedNotes).toEqual([]);
    expect(result.current.highlightedNotes).toEqual(CHORDS.C_MAJOR.notes);
  });

  it('handles note on events correctly', () => {
    const { result } = renderHook(() => 
      useLesson({ lesson: mockLesson, onNoteOn: mockOnNoteOn, onNoteOff: mockOnNoteOff })
    );

    act(() => {
      result.current.startLesson();
      result.current.startListening();
    });

    // Simulate playing a note
    act(() => {
      result.current.handleNoteOn(60, 100);
    });

    expect(mockOnNoteOn).toHaveBeenCalledWith('C4', 100);
    expect(result.current.state.playedNotes).toContain(60);
  });

  it('handles note off events correctly', () => {
    const { result } = renderHook(() => 
      useLesson({ lesson: mockLesson, onNoteOn: mockOnNoteOn, onNoteOff: mockOnNoteOff })
    );

    act(() => {
      result.current.startLesson();
      result.current.startListening();
      result.current.handleNoteOn(60, 100);
    });

    // Simulate releasing the note
    act(() => {
      result.current.handleNoteOff(60);
    });

    expect(mockOnNoteOff).toHaveBeenCalledWith('C4');
    expect(result.current.state.playedNotes).not.toContain(60);
  });

  it('auto-evaluates when 3 notes are played', async () => {
    const { result } = renderHook(() => 
      useLesson({ lesson: mockLesson, onNoteOn: mockOnNoteOn, onNoteOff: mockOnNoteOff })
    );

    act(() => {
      result.current.startLesson();
      result.current.startListening();
    });

    // Play the correct chord
    act(() => {
      result.current.handleNoteOn(60, 100); // C4
      result.current.handleNoteOn(64, 100); // E4
      result.current.handleNoteOn(67, 100); // G4
    });

    await waitFor(() => {
      expect(result.current.state.status).toBe('evaluating');
    });

    expect(result.current.evaluationResult).not.toBeNull();
    expect(result.current.evaluationResult!.isCorrect).toBe(true);
  });

  it('handles incorrect chord evaluation', async () => {
    const { result } = renderHook(() => 
      useLesson({ lesson: mockLesson, onNoteOn: mockOnNoteOn, onNoteOff: mockOnNoteOff })
    );

    act(() => {
      result.current.startLesson();
      result.current.startListening();
    });

    // Play an incorrect chord
    act(() => {
      result.current.handleNoteOn(60, 100); // C4
      result.current.handleNoteOn(62, 100); // D4
      result.current.handleNoteOn(64, 100); // E4
    });

    await waitFor(() => {
      expect(result.current.state.status).toBe('evaluating');
    });

    expect(result.current.evaluationResult).not.toBeNull();
    expect(result.current.evaluationResult!.isCorrect).toBe(false);
    expect(result.current.evaluationResult!.message).toBe('Try again');
  });

  it('advances to next task after correct answer', async () => {
    // Create a lesson with multiple tasks
    const multiTaskLesson: Lesson = {
      ...mockLesson,
      tasks: [
        mockLesson.tasks[0],
        {
          id: 'task-2',
          instruction: 'Play G major',
          chord: CHORDS.G_MAJOR,
          onIncorrect: 'Try G major again'
        }
      ]
    };

    const { result } = renderHook(() => 
      useLesson({ lesson: multiTaskLesson, onNoteOn: mockOnNoteOn, onNoteOff: mockOnNoteOff })
    );

    act(() => {
      result.current.startLesson();
      result.current.startListening();
    });

    // Play the correct chord
    act(() => {
      result.current.handleNoteOn(60, 100);
      result.current.handleNoteOn(64, 100);
      result.current.handleNoteOn(67, 100);
    });

    await waitFor(() => {
      expect(result.current.evaluationResult?.isCorrect).toBe(true);
    });

    // Handle evaluation (should advance)
    act(() => {
      result.current.handleEvaluation();
    });

    expect(result.current.state.currentTaskIndex).toBe(1);
    expect(result.current.state.status).toBe('showing');
  });

  it('retries task after incorrect answer', async () => {
    const { result } = renderHook(() => 
      useLesson({ lesson: mockLesson, onNoteOn: mockOnNoteOn, onNoteOff: mockOnNoteOff })
    );

    act(() => {
      result.current.startLesson();
      result.current.startListening();
    });

    // Play an incorrect chord
    act(() => {
      result.current.handleNoteOn(60, 100);
      result.current.handleNoteOn(62, 100);
      result.current.handleNoteOn(64, 100);
    });

    await waitFor(() => {
      expect(result.current.evaluationResult?.isCorrect).toBe(false);
    });

    // Handle evaluation (should retry)
    act(() => {
      result.current.handleEvaluation();
    });

    expect(result.current.state.currentTaskIndex).toBe(0);
    expect(result.current.state.status).toBe('listening');
    expect(result.current.state.playedNotes).toEqual([]);
  });

  it('resets lesson correctly', () => {
    const { result } = renderHook(() => 
      useLesson({ lesson: mockLesson, onNoteOn: mockOnNoteOn, onNoteOff: mockOnNoteOff })
    );

    // Do some activity
    act(() => {
      result.current.startLesson();
      result.current.startListening();
      result.current.handleNoteOn(60, 100);
    });

    // Reset
    act(() => {
      result.current.resetLesson();
    });

    expect(result.current.state.hasStarted).toBe(false);
    expect(result.current.state.currentTaskIndex).toBe(0);
    expect(result.current.state.playedNotes).toEqual([]);
    expect(result.current.state.status).toBe('showing');
  });

  it('cleans up audio timeout on reset', () => {
    const { result } = renderHook(() => 
      useLesson({ lesson: mockLesson, onNoteOn: mockOnNoteOn, onNoteOff: mockOnNoteOff })
    );

    act(() => {
      result.current.playExampleChord();
    });

    expect(mockOnNoteOn).toHaveBeenCalledTimes(3);

    // Reset before timer completes
    act(() => {
      result.current.resetLesson();
    });

    // Timer should not trigger note off after reset
    act(() => {
      jest.advanceTimersByTime(2000);
    });

    expect(mockOnNoteOff).toHaveBeenCalledTimes(0);
  });
});