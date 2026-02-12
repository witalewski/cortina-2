"use client";

import { useCallback, useMemo, useState } from "react";
import { useMidi } from "@/hooks/useMidi";
import { useAudioEngineContext } from "@/app/providers/AudioEngineProvider";
import { useLesson } from "@/hooks/useLesson";
import { midiToNoteName, velocityToGain } from "@/lib/music/midi";
import { PianoKeyboard } from "@/app/components/PianoKeyboard";
import { LessonPane } from "@/app/components/LessonPane";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { CHORDS_101 } from "@/lib/lessons/Chords101";

const START_NOTE = 48; // C3
const END_NOTE = 72; // C5

interface LessonPageProps {
  lesson?: any; // Allow passing different lessons in future
}

export function LessonPage({ lesson = CHORDS_101 }: LessonPageProps) {
  const {
    isReady: audioReady,
    isLoading: audioLoading,
    initAudio,
    noteOn,
    noteOff,
  } = useAudioEngineContext();

  const [activeNotes, setActiveNotes] = useState<Set<number>>(() => new Set());

  const addActiveNote = useCallback((note: number) => {
    setActiveNotes((prev: Set<number>) => {
      if (prev.has(note)) return prev;
      const next = new Set(prev);
      next.add(note);
      return next;
    });
  }, []);

  const removeActiveNote = useCallback((note: number) => {
    setActiveNotes((prev: Set<number>) => {
      if (!prev.has(note)) return prev;
      const next = new Set(prev);
      next.delete(note);
      return next;
    });
  }, []);

  // Audio engine handlers that work with note names
  const audioNoteOn = useCallback((noteName: string, velocity?: number) => {
    noteOn(noteName, velocity);
  }, [noteOn]);

  const audioNoteOff = useCallback((noteName: string) => {
    noteOff(noteName);
  }, [noteOff]);

  // Lesson integration handlers that work with MIDI numbers
  const lessonNoteOn = useCallback(
    (note: number, velocity: number) => {
      addActiveNote(note);
      // Convert to note name for audio engine
      const noteName = midiToNoteName(note);
      noteOn(noteName, velocity);
    },
    [addActiveNote, noteOn],
  );

  const lessonNoteOff = useCallback(
    (note: number) => {
      removeActiveNote(note);
      // Convert to note name for audio engine
      const noteName = midiToNoteName(note);
      noteOff(noteName);
    },
    [removeActiveNote, noteOff],
  );

  const {
    state,
    progress,
    highlightedNotes,
    instructionText,
    evaluationResult,
    startLesson,
    playExampleChord,
    startListening,
    handleEvaluation,
  } = useLesson({ 
    lesson, 
    onNoteOn: audioNoteOn, 
    onNoteOff: audioNoteOff 
  });

  // MIDI integration for external keyboards
  const { status, devices } = useMidi({
    onNoteOn: lessonNoteOn,
    onNoteOff: lessonNoteOff,
  });

  // Piano keyboard labels
  const labels = useMemo(() => {
    const map: Record<number, string> = {};
    for (let note = START_NOTE; note <= END_NOTE; note += 1) {
      if (note % 12 === 0) {
        map[note] = midiToNoteName(note);
      }
    }
    return map;
  }, []);

  // Auto-start lesson when audio is ready
  const handleStartLesson = useCallback(() => {
    if (!audioReady) {
      initAudio().then(() => {
        startLesson();
      });
    } else {
      startLesson();
    }
  }, [audioReady, initAudio, startLesson]);

  // Handle evaluation advancement
  const handleEvaluationWithAudio = useCallback(() => {
    handleEvaluation();
  }, [handleEvaluation]);

  return (
    <div className="min-h-screen bg-linear-to-b from-background via-background to-muted/30">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-12">
        {/* Header */}
        <header className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="secondary">Cortina</Badge>
            <Badge variant={audioReady ? "default" : "outline"}>
              {audioReady ? "Audio ready" : "Audio locked"}
            </Badge>
            <Badge
              variant={status === "granted" ? "default" : "secondary"}
              className="uppercase"
            >
              MIDI {status}
            </Badge>
            <Badge
              variant={devices.length > 0 ? "default" : "secondary"}
              className="uppercase"
            >
              Devices {devices.length}
            </Badge>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Lesson Mode</h1>
              <p className="text-sm text-muted-foreground">
                Interactive chord training with real-time feedback.
              </p>
            </div>
            {!audioReady && (
              <Button onClick={initAudio} disabled={audioLoading}>
                {audioLoading ? "Loading piano samples..." : "Enable Audio"}
              </Button>
            )}
          </div>
        </header>

        {/* Lesson Content */}
        <div className="flex flex-1 flex-col gap-8">
          {/* Lesson Pane */}
          <LessonPane
            lessonTitle={lesson.title}
            instruction={instructionText}
            taskNumber={progress.current}
            totalTasks={progress.total}
            status={state.status}
            onPlayExample={playExampleChord}
            onStartListening={startListening}
            evaluationResult={evaluationResult}
          />

          {/* Piano Keyboard */}
          <div className="flex flex-1 items-center justify-center">
            <div className="w-full max-w-5xl rounded-2xl border border-border bg-card/70 p-6 shadow-sm">
              {/* Auto-start prompt if lesson hasn't started */}
              {!state.hasStarted && (
                <div className="mb-4 text-center">
                  <Button 
                    variant="default" 
                    size="lg"
                    onClick={handleStartLesson}
                    disabled={audioLoading}
                  >
                    {audioLoading ? "Loading..." : "Start Lesson"}
                  </Button>
                </div>
              )}
              
              <PianoKeyboard
                startNote={START_NOTE}
                endNote={END_NOTE}
                activeNotes={[...activeNotes]}
                highlightedNotes={highlightedNotes}
                labels={labels}
                disabled={!audioReady || !state.hasStarted}
                onKeyDown={(note) => {
                  // Handle mouse/touch input on virtual keyboard
                  if (audioReady && state.hasStarted) {
                    lessonNoteOn(note, 100);
                  }
                }}
                onKeyUp={(note) => {
                  if (audioReady && state.hasStarted) {
                    lessonNoteOff(note);
                  }
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}