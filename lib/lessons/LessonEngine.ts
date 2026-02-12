/**
 * Lesson Engine - Core lesson logic and state management
 * Pure functions with no React dependencies - easily testable
 */

import { Lesson, LessonTask, LessonState, LessonStatus, EvaluationResult } from './Lesson';
import { compareChord, hasThreeNotes } from '../music/noteComparison';

export class LessonEngine {
  private lesson: Lesson;
  private state: LessonState;

  constructor(lesson: Lesson) {
    this.lesson = lesson;
    this.state = this.createInitialState();
  }

  /**
   * Get the initial lesson state
   */
  private createInitialState(): LessonState {
    return {
      currentTaskIndex: 0,
      playedNotes: [],
      status: 'showing',
      attempts: 0,
      lastResult: null,
      hasStarted: false
    };
  }

  /**
   * Get the current lesson state (immutable copy)
   */
  getState(): LessonState {
    return { ...this.state };
  }

  /**
   * Get the current task, or null if lesson is complete
   */
  getCurrentTask(): LessonTask | null {
    if (this.state.currentTaskIndex >= this.lesson.tasks.length) {
      return null;
    }
    return this.lesson.tasks[this.state.currentTaskIndex];
  }

  /**
   * Get the current lesson
   */
  getLesson(): Lesson {
    return this.lesson;
  }

  /**
   * Start the lesson
   */
  startLesson(): void {
    if (this.state.hasStarted) return;
    
    this.state = {
      ...this.state,
      hasStarted: true,
      status: 'showing'
    };
  }

  /**
   * Show the example chord for the current task
   * Returns the chord notes to be highlighted
   */
  playChord(): number[] {
    if (this.state.status !== 'showing') {
      this.state = {
        ...this.state,
        status: 'showing'
      };
    }
    
    const currentTask = this.getCurrentTask();
    return currentTask ? currentTask.chord.notes : [];
  }

  /**
   * Start listening for user input
   * Returns the chord notes to be highlighted
   */
  startListening(): number[] {
    this.state = {
      ...this.state,
      status: 'listening',
      playedNotes: [],
      lastResult: null
    };
    
    const currentTask = this.getCurrentTask();
    return currentTask ? currentTask.chord.notes : [];
  }

  /**
   * Add a note to the currently played notes
   */
  addNote(note: number): void {
    if (this.state.status !== 'listening') return;
    
    // Avoid duplicate notes
    if (this.state.playedNotes.includes(note)) return;
    
    const updatedNotes = [...this.state.playedNotes, note];
    
    this.state = {
      ...this.state,
      playedNotes: updatedNotes
    };
    
    // Auto-evaluate when exactly 3 notes are played
    if (updatedNotes.length === 3) {
      this.evaluateAttempt();
    }
  }

  /**
   * Remove a note from the currently played notes
   */
  removeNote(note: number): void {
    if (this.state.status !== 'listening' && this.state.status !== 'evaluating') return;
    
    const updatedNotes = this.state.playedNotes.filter(n => n !== note);
    
    this.state = {
      ...this.state,
      playedNotes: updatedNotes,
      // If we drop below 3 notes while evaluating, go back to listening
      status: updatedNotes.length < 3 && this.state.status === 'evaluating' 
        ? 'listening' 
        : this.state.status
    };
  }

  /**
   * Evaluate the current attempt
   */
  private evaluateAttempt(): EvaluationResult {
    const currentTask = this.getCurrentTask();
    if (!currentTask) {
      return {
        isCorrect: false,
        message: 'No current task',
        shouldAdvance: false
      };
    }

    // Only evaluate if we have exactly 3 notes
    if (!hasThreeNotes(this.state.playedNotes)) {
      return {
        isCorrect: false,
        message: 'Please play exactly 3 notes',
        shouldAdvance: false
      };
    }

    this.state = {
      ...this.state,
      status: 'evaluating',
      attempts: this.state.attempts + 1
    };

    const comparison = compareChord(this.state.playedNotes, currentTask.chord);
    
    if (comparison.isCorrect) {
      this.state = {
        ...this.state,
        lastResult: 'correct'
      };
      
      return {
        isCorrect: true,
        message: 'Excellent! You got it right.',
        shouldAdvance: true
      };
    } else {
      this.state = {
        ...this.state,
        lastResult: 'incorrect'
      };
      
      return {
        isCorrect: false,
        message: currentTask.onIncorrect,
        shouldAdvance: false
      };
    }
  }

  /**
   * Get the evaluation result for the current state
   */
  getEvaluationResult(): EvaluationResult | null {
    if (this.state.status !== 'evaluating' || this.state.lastResult === null) {
      return null;
    }

    const currentTask = this.getCurrentTask();
    if (!currentTask) return null;

    if (this.state.lastResult === 'correct') {
      return {
        isCorrect: true,
        message: 'Excellent! You got it right.',
        shouldAdvance: true
      };
    } else {
      return {
        isCorrect: false,
        message: currentTask.onIncorrect,
        shouldAdvance: false
      };
    }
  }

  /**
   * Move to the next task
   */
  nextTask(): boolean {
    if (this.state.lastResult !== 'correct') return false;
    
    const nextIndex = this.state.currentTaskIndex + 1;
    
    if (nextIndex >= this.lesson.tasks.length) {
      // Lesson complete
      this.state = {
        ...this.state,
        status: 'complete',
        currentTaskIndex: nextIndex
      };
      return true;
    }
    
    // Move to next task
    this.state = {
      ...this.state,
      currentTaskIndex: nextIndex,
      playedNotes: [],
      status: 'showing',
      lastResult: null
    };
    
    return true;
  }

  /**
   * Retry the current task (after incorrect attempt)
   */
  retryTask(): void {
    this.state = {
      ...this.state,
      playedNotes: [],
      status: 'listening',
      lastResult: null
    };
  }

  /**
   * Reset the entire lesson
   */
  reset(): void {
    this.state = this.createInitialState();
  }

  /**
   * Get progress information
   */
  getProgress(): { current: number; total: number; isComplete: boolean } {
    return {
      current: Math.min(this.state.currentTaskIndex + 1, this.lesson.tasks.length),
      total: this.lesson.tasks.length,
      isComplete: this.state.status === 'complete'
    };
  }

  /**
   * Get the highlighted notes for the current state
   */
  getHighlightedNotes(): number[] {
    const currentTask = this.getCurrentTask();
    if (!currentTask) return [];
    
    // Highlight during both 'showing' and 'listening' phases
    if (this.state.status === 'showing' || this.state.status === 'listening') {
      return currentTask.chord.notes;
    }
    
    return [];
  }

  /**
   * Get the instruction text for the current state
   */
  getInstructionText(): string {
    const currentTask = this.getCurrentTask();
    if (!currentTask) {
      return this.state.status === 'complete' ? 'Lesson complete!' : '';
    }
    
    const evaluationResult = this.getEvaluationResult();
    if (evaluationResult) {
      return evaluationResult.message;
    }
    
    return currentTask.instruction;
  }
}