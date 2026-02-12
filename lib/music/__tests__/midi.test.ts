import { midiToNoteName, velocityToGain, isValidMidiNote } from "../midi";

describe("midiToNoteName", () => {
  it("converts middle C (60) to C4", () => {
    expect(midiToNoteName(60)).toBe("C4");
  });

  it("converts A4 (69) correctly", () => {
    expect(midiToNoteName(69)).toBe("A4");
  });

  it("handles lowest MIDI note (0)", () => {
    expect(midiToNoteName(0)).toBe("C-1");
  });

  it("handles highest MIDI note (127)", () => {
    expect(midiToNoteName(127)).toBe("G9");
  });

  it("handles sharps correctly", () => {
    expect(midiToNoteName(61)).toBe("C#4");
    expect(midiToNoteName(66)).toBe("F#4");
  });

  it("throws error for notes below 0", () => {
    expect(() => midiToNoteName(-1)).toThrow("Invalid MIDI note number");
  });

  it("throws error for notes above 127", () => {
    expect(() => midiToNoteName(128)).toThrow("Invalid MIDI note number");
  });

  it("throws error for non-integer values", () => {
    expect(() => midiToNoteName(60.5)).toThrow("Invalid MIDI note number");
  });
});

describe("velocityToGain", () => {
  it("converts max velocity (127) to 1.0", () => {
    expect(velocityToGain(127)).toBe(1);
  });

  it("converts min velocity (0) to 0.0", () => {
    expect(velocityToGain(0)).toBe(0);
  });

  it("converts mid velocity (64) to approximately 0.5", () => {
    expect(velocityToGain(64)).toBeCloseTo(0.5, 2);
  });

  it("converts velocity 100 correctly", () => {
    expect(velocityToGain(100)).toBeCloseTo(0.787, 3);
  });

  it("throws error for negative velocity", () => {
    expect(() => velocityToGain(-1)).toThrow("Invalid velocity");
  });

  it("throws error for velocity above 127", () => {
    expect(() => velocityToGain(128)).toThrow("Invalid velocity");
  });
});

describe("isValidMidiNote", () => {
  it("returns true for valid MIDI notes", () => {
    expect(isValidMidiNote(0)).toBe(true);
    expect(isValidMidiNote(60)).toBe(true);
    expect(isValidMidiNote(127)).toBe(true);
  });

  it("returns false for notes below 0", () => {
    expect(isValidMidiNote(-1)).toBe(false);
  });

  it("returns false for notes above 127", () => {
    expect(isValidMidiNote(128)).toBe(false);
  });

  it("returns false for non-integer values", () => {
    expect(isValidMidiNote(60.5)).toBe(false);
    expect(isValidMidiNote(NaN)).toBe(false);
  });
});
