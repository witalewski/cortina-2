"use client";

import { useCallback, useEffect, useRef, useMemo } from "react";
import { Lesson } from "@/lib/lessons/Lesson";
import { LessonEngine } from "@/lib/lessons/LessonEngine";
import { midiToNoteName, velocityToGain } from "@/lib/music/midi";

interface UseLessonProps {
  lesson: Lesson;
  onNoteOn: (noteName: string, velocity?: number) => void;
  onNoteOff: (noteName: string) => void;
}

/**
 * React hook for managing lesson state and audio integration
 * Bridges the pure LessonEngine with React components and audio
 */
export function useLesson({ lesson, onNoteOn, onNoteOff }: UseLessonProps) {
  const engineRef = useRef<LessonEngine>(new LessonEngine(lesson));
  const audioTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Get current engine state
  const engine = engineRef.current;
  const state = engine.getState();
  const currentTask = engine.getCurrentTask();
  const progress = engine.getProgress();

  // Memoized highlighted notes for the piano keyboard
  const highlightedNotes = useMemo(() => {
    return engine.getHighlightedNotes();
  }, [state.status, state.currentTaskIndex]);

  // Current instruction text for UI
  const instructionText = useMemo(() => {
    return engine.getInstructionText();
  }, [state.status, state.currentTaskIndex, state.lastResult]);

  // Play example chord with 2-second duration
  const playExampleChord = useCallback(() => {
    if (!currentTask) return;

    const notes = engine.playChord();
    const noteNames = notes.map(midiToNoteName);

    // Start all notes simultaneously
    noteNames.forEach(noteName => {
      onNoteOn(noteName, 0.8); // Medium velocity
    });

    // Clear any existing timeout
    if (audioTimeoutRef.current) {
      clearTimeout(audioTimeoutRef.current);
    }

    // Stop all notes after exactly 2 seconds
    audioTimeoutRef.current = setTimeout(() => {
      noteNames.forEach(noteName => {
        onNoteOff(noteName);
      });
    }, 2000);
  }, [currentTask, engine, onNoteOn, onNoteOff]);

  // Start the lesson
  const startLesson = useCallback(() => {
    engine.startLesson();
    // Auto-play the first example
    playExampleChord();
  }, [engine, playExampleChord]);

  // Start listening for user input
  const startListening = useCallback(() => {
    engine.startListening();
  }, [engine]);

  // Handle note on events from user input
  const handleNoteOn = useCallback(
    (note: number, velocity: number) => {
      // Convert MIDI to note name for audio feedback
      const noteName = midiToNoteName(note);
      onNoteOn(noteName, velocity);
      
      // Add note to lesson engine
      engine.addNote(note);
    },
    [engine, onNoteOn]
  );

  // Handle note off events from user input
  const handleNoteOff = useCallback(
    (note: number) => {
      // Convert MIDI to note name for audio feedback
      const noteName = midiToNoteName(note);
      onNoteOff(noteName);
      
      // Remove note from lesson engine
      engine.removeNote(note);
    },
    [engine, onNoteOff]
  );

  // Get evaluation result for current state
  const evaluationResult = useMemo(() => {
    return engine.getEvaluationResult();
  }, [state.status, state.lastResult]);

  // Handle evaluation result (advance or retry)
  const handleEvaluation = useCallback(() => {
    const result = evaluationResult;
    if (!result) return;

    if (result.shouldAdvance) {
      engine.nextTask();
      // Auto-play next example chord if lesson isn't complete
      if (engine.getState().status !== 'complete') {
        setTimeout(() => playExampleChord(), 1000);
      }
    } else {
      // Retry the same task
      engine.retryTask();
    }
  }, [evaluationResult, engine, playExampleChord]);

  // Reset the lesson
  const resetLesson = useCallback(() => {
    // Clear any pending audio timeout
    if (audioTimeoutRef.current) {
      clearTimeout(audioTimeoutRef.current);
      audioTimeoutRef.current = null;
    }
    
    engine.reset();
  }, [engine]);

  // Cleanup audio timeout on unmount
  useEffect(() => {
    return () => {
      if (audioTimeoutRef.current) {
        clearTimeout(audioTimeoutRef.current);
      }
    };
  }, []);

  return {
    // State
    state,
    currentTask,
    progress,
    
    // UI helpers
    highlightedNotes,
    instructionText,
    evaluationResult,
    
    // Actions
    startLesson,
    playExampleChord,
    startListening,
    handleNoteOn,
    handleNoteOff,
    handleEvaluation,
    resetLesson,
  };
}