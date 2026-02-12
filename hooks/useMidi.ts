"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { MidiAccess } from "@/lib/midi/MidiAccess";
import type {
  MidiStatus,
  MidiDeviceInfo,
  NoteOnCallback,
  NoteOffCallback,
} from "@/lib/midi/types";

interface LastNote {
  note: number;
  velocity: number;
}

interface UseMidiProps {
  onNoteOn?: NoteOnCallback;
  onNoteOff?: NoteOffCallback;
}

interface UseMidiReturn {
  status: MidiStatus;
  devices: MidiDeviceInfo[];
  lastNote: LastNote | null;
  error: string | null;
}

/**
 * React hook for managing MIDI input
 * Automatically requests MIDI access on mount and cleans up on unmount
 */
export function useMidi({
  onNoteOn,
  onNoteOff,
}: UseMidiProps = {}): UseMidiReturn {
  const midiRef = useRef<MidiAccess | null>(null);
  const [status, setStatus] = useState<MidiStatus>("prompt");
  const [devices, setDevices] = useState<MidiDeviceInfo[]>([]);
  const [lastNote, setLastNote] = useState<LastNote | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Handle note-on events
  const handleNoteOn = useCallback(
    (note: number, velocity: number, channel: number) => {
      setLastNote({ note, velocity });
      onNoteOn?.(note, velocity, channel);
    },
    [onNoteOn],
  );

  // Handle note-off events
  const handleNoteOff = useCallback(
    (note: number, channel: number) => {
      onNoteOff?.(note, channel);
    },
    [onNoteOff],
  );

  // Handle device changes
  const handleDeviceChange = useCallback((newDevices: MidiDeviceInfo[]) => {
    setDevices(newDevices);
  }, []);

  // Request MIDI access on mount
  useEffect(() => {
    async function requestMidi() {
      // Check if supported
      if (!navigator.requestMIDIAccess) {
        setStatus("unsupported");
        return;
      }

      try {
        const midi = await MidiAccess.request();
        midiRef.current = midi;

        setStatus("granted");
        setDevices(midi.getInputs());

        // Register callbacks
        midi.onNoteOn(handleNoteOn);
        midi.onNoteOff(handleNoteOff);
        midi.onDeviceChange(handleDeviceChange);
      } catch (err) {
        setStatus("denied");
        setError(err instanceof Error ? err.message : "Unknown error");
        console.error("MIDI access error:", err);
      }
    }

    requestMidi();

    // Cleanup on unmount
    return () => {
      midiRef.current?.destroy();
      midiRef.current = null;
    };
  }, [handleNoteOn, handleNoteOff, handleDeviceChange]);

  return {
    status,
    devices,
    lastNote,
    error,
  };
}
