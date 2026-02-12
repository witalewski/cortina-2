/**
 * Lesson system types and interfaces
 * Pure types for the lesson engine and lesson definitions
 */

import { Chord } from '../music/chords';

export type LessonStatus = 'showing' | 'listening' | 'evaluating' | 'complete';
export type AttemptResult = 'correct' | 'incorrect' | null;

export interface LessonTask {
  id: string;
  instruction: string;
  chord: Chord;
  onIncorrect: string; // Message for incorrect attempts
}

export interface Lesson {
  id: string;
  title: string;
  description: string;
  tasks: LessonTask[];
}

export interface LessonState {
  currentTaskIndex: number;
  playedNotes: number[];
  status: LessonStatus;
  attempts: number;
  lastResult: AttemptResult;
  hasStarted: boolean;
}

export interface EvaluationResult {
  isCorrect: boolean;
  message: string;
  shouldAdvance: boolean;
}