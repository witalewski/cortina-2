/**
 * Web MIDI API wrapper
 * Encapsulates MIDI input handling, device management, and message parsing
 */

import type {
  MidiStatus,
  MidiDeviceInfo,
  NoteOnCallback,
  NoteOffCallback,
  DeviceChangeCallback,
} from "./types";

const NOTE_ON = 0x90;
const NOTE_OFF = 0x80;

export class MidiAccess {
  private midiAccess: MIDIAccess | null = null;
  private noteOnCallbacks: Set<NoteOnCallback> = new Set();
  private noteOffCallbacks: Set<NoteOffCallback> = new Set();
  private deviceChangeCallbacks: Set<DeviceChangeCallback> = new Set();

  /**
   * Request MIDI access from the browser
   * @returns Promise resolving to a MidiAccess instance
   */
  static async request(): Promise<MidiAccess> {
    const instance = new MidiAccess();

    // Check if Web MIDI API is supported
    if (!navigator.requestMIDIAccess) {
      throw new Error("Web MIDI API not supported in this browser");
    }

    try {
      instance.midiAccess = await navigator.requestMIDIAccess();
      instance.setupInputListeners();
      instance.setupStateChangeListener();
    } catch (error) {
      throw new Error(`MIDI access denied: ${error}`);
    }

    return instance;
  }

  /**
   * Get current MIDI status
   */
  getStatus(): MidiStatus {
    if (!navigator.requestMIDIAccess) {
      return "unsupported";
    }
    if (!this.midiAccess) {
      return "prompt";
    }
    return "granted";
  }

  /**
   * Get list of available MIDI input devices
   */
  getInputs(): MidiDeviceInfo[] {
    if (!this.midiAccess) {
      return [];
    }

    const devices: MidiDeviceInfo[] = [];
    this.midiAccess.inputs.forEach((input) => {
      devices.push({
        id: input.id,
        name: input.name || "Unknown Device",
        manufacturer: input.manufacturer || "Unknown",
        state: input.state,
      });
    });

    return devices;
  }

  /**
   * Register a callback for note-on events
   */
  onNoteOn(callback: NoteOnCallback): void {
    this.noteOnCallbacks.add(callback);
  }

  /**
   * Register a callback for note-off events
   */
  onNoteOff(callback: NoteOffCallback): void {
    this.noteOffCallbacks.add(callback);
  }

  /**
   * Register a callback for device connection changes
   */
  onDeviceChange(callback: DeviceChangeCallback): void {
    this.deviceChangeCallbacks.add(callback);
  }

  /**
   * Remove a specific callback
   */
  removeNoteOnCallback(callback: NoteOnCallback): void {
    this.noteOnCallbacks.delete(callback);
  }

  removeNoteOffCallback(callback: NoteOffCallback): void {
    this.noteOffCallbacks.delete(callback);
  }

  removeDeviceChangeCallback(callback: DeviceChangeCallback): void {
    this.deviceChangeCallbacks.delete(callback);
  }

  /**
   * Clean up all listeners and resources
   */
  destroy(): void {
    if (this.midiAccess) {
      this.midiAccess.inputs.forEach((input) => {
        input.onmidimessage = null;
      });
      this.midiAccess.onstatechange = null;
    }

    this.noteOnCallbacks.clear();
    this.noteOffCallbacks.clear();
    this.deviceChangeCallbacks.clear();
    this.midiAccess = null;
  }

  /**
   * Set up listeners for all MIDI inputs
   */
  private setupInputListeners(): void {
    if (!this.midiAccess) return;

    this.midiAccess.inputs.forEach((input) => {
      input.onmidimessage = this.handleMidiMessage.bind(this);
    });
  }

  /**
   * Set up listener for device connection/disconnection
   */
  private setupStateChangeListener(): void {
    if (!this.midiAccess) return;

    this.midiAccess.onstatechange = (event) => {
      // Re-setup listeners when devices change
      this.setupInputListeners();

      // Notify device change callbacks
      const devices = this.getInputs();
      this.deviceChangeCallbacks.forEach((callback) => callback(devices));
    };
  }

  /**
   * Parse and handle incoming MIDI messages
   */
  private handleMidiMessage(event: MIDIMessageEvent): void {
    if (!event.data || event.data.length < 3) return;

    const [status, note, velocity] = event.data;
    const command = status & 0xf0; // Upper nibble
    const channel = status & 0x0f; // Lower nibble

    if (command === NOTE_ON && velocity > 0) {
      // Note On
      this.noteOnCallbacks.forEach((callback) =>
        callback(note, velocity, channel),
      );
    } else if (
      command === NOTE_OFF ||
      (command === NOTE_ON && velocity === 0)
    ) {
      // Note Off (also treat Note On with velocity 0 as Note Off)
      this.noteOffCallbacks.forEach((callback) => callback(note, channel));
    }
  }
}
