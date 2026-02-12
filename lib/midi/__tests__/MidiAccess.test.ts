import { MidiAccess } from "../MidiAccess";
import type { MidiDeviceInfo } from "../types";

// Mock Web MIDI API
class MockMIDIInput {
  id = "input-1";
  name = "Test MIDI Device";
  manufacturer = "Test Manufacturer";
  state = "connected";
  onmidimessage: ((event: any) => void) | null = null;

  // Helper to simulate MIDI message
  simulateMessage(data: number[]) {
    if (this.onmidimessage) {
      this.onmidimessage({ data: new Uint8Array(data) });
    }
  }
}

class MockMIDIAccess {
  inputs = new Map<string, MockMIDIInput>();
  outputs = new Map();
  onstatechange: ((event: any) => void) | null = null;

  constructor() {
    const input = new MockMIDIInput();
    this.inputs.set(input.id, input);
  }

  getInput(): MockMIDIInput {
    return Array.from(this.inputs.values())[0];
  }
}

describe("MidiAccess", () => {
  let mockMidiAccess: MockMIDIAccess;

  beforeEach(() => {
    mockMidiAccess = new MockMIDIAccess();

    // Mock navigator.requestMIDIAccess
    global.navigator.requestMIDIAccess = jest
      .fn()
      .mockResolvedValue(mockMidiAccess);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("request", () => {
    it("successfully requests MIDI access", async () => {
      const midi = await MidiAccess.request();
      expect(midi).toBeInstanceOf(MidiAccess);
      expect(navigator.requestMIDIAccess).toHaveBeenCalled();
    });

    it("throws error when Web MIDI API is not supported", async () => {
      // @ts-expect-error - testing unsupported browser
      global.navigator.requestMIDIAccess = undefined;

      await expect(MidiAccess.request()).rejects.toThrow(
        "Web MIDI API not supported",
      );
    });

    it("throws error when MIDI access is denied", async () => {
      global.navigator.requestMIDIAccess = jest
        .fn()
        .mockRejectedValue(new Error("Permission denied"));

      await expect(MidiAccess.request()).rejects.toThrow("MIDI access denied");
    });
  });

  describe("getStatus", () => {
    it('returns "unsupported" when Web MIDI API is not available', () => {
      // @ts-expect-error - testing unsupported browser
      global.navigator.requestMIDIAccess = undefined;
      const midi = new MidiAccess();

      expect(midi.getStatus()).toBe("unsupported");
    });

    it('returns "prompt" before access is granted', () => {
      const midi = new MidiAccess();
      expect(midi.getStatus()).toBe("prompt");
    });

    it('returns "granted" after successful access', async () => {
      const midi = await MidiAccess.request();
      expect(midi.getStatus()).toBe("granted");
    });
  });

  describe("getInputs", () => {
    it("returns empty array before access is granted", () => {
      const midi = new MidiAccess();
      expect(midi.getInputs()).toEqual([]);
    });

    it("returns list of connected devices after access", async () => {
      const midi = await MidiAccess.request();
      const inputs = midi.getInputs();

      expect(inputs).toHaveLength(1);
      expect(inputs[0]).toEqual({
        id: "input-1",
        name: "Test MIDI Device",
        manufacturer: "Test Manufacturer",
        state: "connected",
      });
    });
  });

  describe("note event handling", () => {
    it("calls onNoteOn callback when note-on message received", async () => {
      const midi = await MidiAccess.request();
      const onNoteOn = jest.fn();
      midi.onNoteOn(onNoteOn);

      // Simulate MIDI note-on message: status 0x90 (note on, channel 0), note 60, velocity 100
      mockMidiAccess.getInput().simulateMessage([0x90, 60, 100]);

      expect(onNoteOn).toHaveBeenCalledWith(60, 100, 0);
    });

    it("calls onNoteOff callback when note-off message received", async () => {
      const midi = await MidiAccess.request();
      const onNoteOff = jest.fn();
      midi.onNoteOff(onNoteOff);

      // Simulate MIDI note-off message: status 0x80 (note off, channel 0), note 60
      mockMidiAccess.getInput().simulateMessage([0x80, 60, 0]);

      expect(onNoteOff).toHaveBeenCalledWith(60, 0);
    });

    it("treats note-on with velocity 0 as note-off", async () => {
      const midi = await MidiAccess.request();
      const onNoteOff = jest.fn();
      midi.onNoteOff(onNoteOff);

      // Simulate note-on with velocity 0 (acts as note-off)
      mockMidiAccess.getInput().simulateMessage([0x90, 60, 0]);

      expect(onNoteOff).toHaveBeenCalledWith(60, 0);
    });

    it("extracts correct channel from status byte", async () => {
      const midi = await MidiAccess.request();
      const onNoteOn = jest.fn();
      midi.onNoteOn(onNoteOn);

      // Note-on on channel 5: 0x90 + 5 = 0x95
      mockMidiAccess.getInput().simulateMessage([0x95, 64, 80]);

      expect(onNoteOn).toHaveBeenCalledWith(64, 80, 5);
    });

    it("supports multiple callbacks", async () => {
      const midi = await MidiAccess.request();
      const callback1 = jest.fn();
      const callback2 = jest.fn();

      midi.onNoteOn(callback1);
      midi.onNoteOn(callback2);

      mockMidiAccess.getInput().simulateMessage([0x90, 60, 100]);

      expect(callback1).toHaveBeenCalledWith(60, 100, 0);
      expect(callback2).toHaveBeenCalledWith(60, 100, 0);
    });
  });

  describe("callback removal", () => {
    it("removes specific note-on callback", async () => {
      const midi = await MidiAccess.request();
      const callback1 = jest.fn();
      const callback2 = jest.fn();

      midi.onNoteOn(callback1);
      midi.onNoteOn(callback2);
      midi.removeNoteOnCallback(callback1);

      mockMidiAccess.getInput().simulateMessage([0x90, 60, 100]);

      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).toHaveBeenCalledWith(60, 100, 0);
    });
  });

  describe("device change handling", () => {
    it("calls device change callback when state changes", async () => {
      const midi = await MidiAccess.request();
      const onDeviceChange = jest.fn();
      midi.onDeviceChange(onDeviceChange);

      // Simulate state change
      if (mockMidiAccess.onstatechange) {
        mockMidiAccess.onstatechange({ port: mockMidiAccess.getInput() });
      }

      expect(onDeviceChange).toHaveBeenCalled();
      expect(onDeviceChange).toHaveBeenCalledWith(expect.any(Array));
    });
  });

  describe("destroy", () => {
    it("cleans up all callbacks and listeners", async () => {
      const midi = await MidiAccess.request();
      const onNoteOn = jest.fn();
      midi.onNoteOn(onNoteOn);

      midi.destroy();

      // Simulate message after destroy
      mockMidiAccess.getInput().simulateMessage([0x90, 60, 100]);

      expect(onNoteOn).not.toHaveBeenCalled();
      expect(midi.getStatus()).toBe("prompt"); // Back to initial state
      expect(midi.getInputs()).toEqual([]);
    });
  });
});
