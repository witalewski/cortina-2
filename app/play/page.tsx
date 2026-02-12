"use client";

import { useCallback, useMemo, useState } from "react";
import { useMidi } from "@/hooks/useMidi";
import { useAudioEngineContext } from "@/app/providers/AudioEngineProvider";
import { midiToNoteName, velocityToGain } from "@/lib/music/midi";
import { PianoKeyboard } from "@/app/components/PianoKeyboard";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";

const START_NOTE = 48; // C3
const END_NOTE = 72; // C5

export default function PlayPage() {
  const {
    isReady: audioReady,
    isLoading: audioLoading,
    initAudio,
    noteOn,
    noteOff,
  } = useAudioEngineContext();

  const [activeNotes, setActiveNotes] = useState<Set<number>>(() => new Set());
  const [lastPressedNote, setLastPressedNote] = useState<number | null>(null);

  const addActiveNote = useCallback((note: number) => {
    setActiveNotes((prev) => {
      if (prev.has(note)) return prev;
      const next = new Set(prev);
      next.add(note);
      return next;
    });
  }, []);

  const removeActiveNote = useCallback((note: number) => {
    setActiveNotes((prev) => {
      if (!prev.has(note)) return prev;
      const next = new Set(prev);
      next.delete(note);
      return next;
    });
  }, []);

  const handleNoteOn = useCallback(
    (note: number, velocity: number) => {
      addActiveNote(note);

      if (!audioReady) return;
      const noteName = midiToNoteName(note);
      const gain = velocityToGain(velocity);
      noteOn(noteName, gain);
    },
    [addActiveNote, audioReady, noteOn],
  );

  const handleNoteOff = useCallback(
    (note: number) => {
      removeActiveNote(note);

      if (!audioReady) return;
      const noteName = midiToNoteName(note);
      noteOff(noteName);
    },
    [audioReady, noteOff, removeActiveNote],
  );

  const { status, devices } = useMidi({
    onNoteOn: handleNoteOn,
    onNoteOff: handleNoteOff,
  });

  const labels = useMemo(() => {
    const map: Record<number, string> = {};
    for (let note = START_NOTE; note <= END_NOTE; note += 1) {
      if (note % 12 === 0) {
        map[note] = midiToNoteName(note);
      }
    }
    return map;
  }, []);

  const handleKeyDown = useCallback(
    (note: number) => {
      setLastPressedNote(note);
      addActiveNote(note);

      if (!audioReady) return;
      const noteName = midiToNoteName(note);
      noteOn(noteName);
    },
    [addActiveNote, audioReady, noteOn],
  );

  const handleKeyUp = useCallback(
    (note: number) => {
      if (lastPressedNote === note) {
        setLastPressedNote(null);
      }
      removeActiveNote(note);

      if (!audioReady) return;
      const noteName = midiToNoteName(note);
      noteOff(noteName);
    },
    [audioReady, lastPressedNote, noteOff, removeActiveNote],
  );

  const handleKeyEnter = useCallback(
    (note: number) => {
      if (lastPressedNote === null || lastPressedNote === note) return;

      const prevNote = lastPressedNote;
      setLastPressedNote(note);

      removeActiveNote(prevNote);
      addActiveNote(note);

      if (!audioReady) return;
      const prevNoteName = midiToNoteName(prevNote);
      const newNoteName = midiToNoteName(note);

      noteOff(prevNoteName);
      noteOn(newNoteName);
    },
    [
      addActiveNote,
      audioReady,
      lastPressedNote,
      noteOff,
      noteOn,
      removeActiveNote,
    ],
  );

  return (
    <div className="min-h-screen bg-linear-to-b from-background via-background to-muted/30">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-12">
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
              <h1 className="text-2xl font-semibold tracking-tight">Play</h1>
              <p className="text-sm text-muted-foreground">
                Ready when you are. Unlock the audio engine to start playing.
              </p>
            </div>
            {!audioReady && (
              <Button onClick={initAudio} disabled={audioLoading}>
                {audioLoading ? "Loading piano samples..." : "Enable Audio"}
              </Button>
            )}
          </div>
        </header>

        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-5xl rounded-2xl border border-border bg-card/70 p-6 shadow-sm">
            <PianoKeyboard
              startNote={START_NOTE}
              endNote={END_NOTE}
              activeNotes={[...activeNotes]}
              labels={labels}
              disabled={!audioReady}
              onKeyDown={handleKeyDown}
              onKeyUp={handleKeyUp}
              onKeyEnter={handleKeyEnter}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
