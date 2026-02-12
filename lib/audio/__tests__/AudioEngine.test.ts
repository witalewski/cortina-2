import { AudioEngine } from "../AudioEngine";
import * as Tone from "tone";

describe("AudioEngine", () => {
  let engine: AudioEngine;

  beforeEach(() => {
    engine = new AudioEngine();
    jest.clearAllMocks();
  });

  afterEach(() => {
    engine.dispose();
  });

  describe("init", () => {
    it("initializes Tone.js and creates Sampler with piano samples", async () => {
      await engine.init();

      expect(Tone.start).toHaveBeenCalled();
      expect(Tone.Sampler).toHaveBeenCalledWith(
        expect.objectContaining({
          urls: expect.objectContaining({ C4: "C4.mp3", A4: "A4.mp3" }),
          baseUrl: "https://tonejs.github.io/audio/salamander/",
          release: 1,
        }),
      );
      expect(Tone.loaded).toHaveBeenCalled();
      expect(engine.isReady()).toBe(true);
      expect(engine.isLoading()).toBe(false);
    });

    it("does not re-initialize if already ready", async () => {
      await engine.init();
      await engine.init();

      expect(Tone.start).toHaveBeenCalledTimes(1);
    });

    it("accepts a custom baseUrl", async () => {
      const customEngine = new AudioEngine({ baseUrl: "/samples/piano/" });
      await customEngine.init();

      expect(Tone.Sampler).toHaveBeenCalledWith(
        expect.objectContaining({
          baseUrl: "/samples/piano/",
        }),
      );

      customEngine.dispose();
    });

    it("resets loading state if init fails", async () => {
      (Tone.start as jest.Mock).mockRejectedValueOnce(new Error("Failed"));

      await expect(engine.init()).rejects.toThrow("Failed");
      expect(engine.isLoading()).toBe(false);
      expect(engine.isReady()).toBe(false);
    });
  });

  describe("isReady", () => {
    it("returns false before initialization", () => {
      expect(engine.isReady()).toBe(false);
    });

    it("returns true after initialization", async () => {
      await engine.init();
      expect(engine.isReady()).toBe(true);
    });
  });

  describe("isLoading", () => {
    it("returns false before initialization", () => {
      expect(engine.isLoading()).toBe(false);
    });
  });

  describe("noteOn", () => {
    it("triggers attack on the sampler with correct parameters", async () => {
      await engine.init();
      const mockSampler = (Tone.Sampler as unknown as jest.Mock).mock.results[0]
        .value;

      engine.noteOn("C4", 0.8);

      expect(mockSampler.triggerAttack).toHaveBeenCalledWith("C4", 0, 0.8);
    });

    it("uses default velocity of 0.8 if not provided", async () => {
      await engine.init();
      const mockSampler = (Tone.Sampler as unknown as jest.Mock).mock.results[0]
        .value;

      engine.noteOn("A4");

      expect(mockSampler.triggerAttack).toHaveBeenCalledWith("A4", 0, 0.8);
    });

    it("does nothing if not initialized", () => {
      const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation();

      engine.noteOn("C4");

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        "AudioEngine not initialized. Call init() first.",
      );
      consoleWarnSpy.mockRestore();
    });

    it("handles errors gracefully", async () => {
      await engine.init();
      const mockSampler = (Tone.Sampler as unknown as jest.Mock).mock.results[0]
        .value;
      mockSampler.triggerAttack.mockImplementationOnce(() => {
        throw new Error("Test error");
      });

      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

      engine.noteOn("C4");

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Failed to play note C4:",
        expect.any(Error),
      );
      consoleErrorSpy.mockRestore();
    });
  });

  describe("noteOff", () => {
    it("triggers release on the sampler", async () => {
      await engine.init();
      const mockSampler = (Tone.Sampler as unknown as jest.Mock).mock.results[0]
        .value;

      engine.noteOff("C4");

      expect(mockSampler.triggerRelease).toHaveBeenCalledWith("C4", 0);
    });

    it("does nothing if not initialized", () => {
      engine.noteOff("C4");

      // Should not throw and not call anything
      expect(Tone.Sampler).not.toHaveBeenCalled();
    });

    it("handles errors gracefully", async () => {
      await engine.init();
      const mockSampler = (Tone.Sampler as unknown as jest.Mock).mock.results[0]
        .value;
      mockSampler.triggerRelease.mockImplementationOnce(() => {
        throw new Error("Test error");
      });

      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

      engine.noteOff("C4");

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Failed to release note C4:",
        expect.any(Error),
      );
      consoleErrorSpy.mockRestore();
    });
  });

  describe("allNotesOff", () => {
    it("releases all notes on the sampler", async () => {
      await engine.init();
      const mockSampler = (Tone.Sampler as unknown as jest.Mock).mock.results[0]
        .value;

      engine.allNotesOff();

      expect(mockSampler.releaseAll).toHaveBeenCalled();
    });

    it("does nothing if not initialized", () => {
      engine.allNotesOff();

      // Should not throw
      expect(Tone.Sampler).not.toHaveBeenCalled();
    });
  });

  describe("dispose", () => {
    it("cleans up sampler and resets ready state", async () => {
      await engine.init();
      const mockSampler = (Tone.Sampler as unknown as jest.Mock).mock.results[0]
        .value;

      engine.dispose();

      expect(mockSampler.dispose).toHaveBeenCalled();
      expect(engine.isReady()).toBe(false);
      expect(engine.isLoading()).toBe(false);
    });

    it("handles disposal when not initialized", () => {
      engine.dispose();

      expect(engine.isReady()).toBe(false);
    });
  });
});
