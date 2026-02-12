/**
 * Type definitions for MIDI functionality
 */

export type MidiStatus =
  | "unsupported"
  | "prompt"
  | "granted"
  | "denied"
  | "error";

export interface MidiDeviceInfo {
  id: string;
  name: string;
  manufacturer: string;
  state: string;
}

export interface MidiNoteEvent {
  note: number;
  velocity: number;
  channel: number;
}

export type NoteOnCallback = (
  note: number,
  velocity: number,
  channel: number,
) => void;
export type NoteOffCallback = (note: number, channel: number) => void;
export type DeviceChangeCallback = (devices: MidiDeviceInfo[]) => void;
