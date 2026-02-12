/**
 * Audio Engine - Tone.js Sampler wrapper
 * Encapsulates all Tone.js interactions so it never leaks into the rest of the app
 * Uses real Salamander Grand Piano samples for authentic playback
 */

import * as Tone from "tone";

/** Salamander Grand Piano samples — ~25 files covering the full 88-key range.
 *  Each sample covers roughly 3 semitones; Tone.Sampler pitch-shifts to fill gaps.
 */
const PIANO_SAMPLES: Record<string, string> = {
  A0: "A0.mp3",
  C1: "C1.mp3",
  "D#1": "Ds1.mp3",
  "F#1": "Fs1.mp3",
  A1: "A1.mp3",
  C2: "C2.mp3",
  "D#2": "Ds2.mp3",
  "F#2": "Fs2.mp3",
  A2: "A2.mp3",
  C3: "C3.mp3",
  "D#3": "Ds3.mp3",
  "F#3": "Fs3.mp3",
  A3: "A3.mp3",
  C4: "C4.mp3",
  "D#4": "Ds4.mp3",
  "F#4": "Fs4.mp3",
  A4: "A4.mp3",
  C5: "C5.mp3",
  "D#5": "Ds5.mp3",
  "F#5": "Fs5.mp3",
  A5: "A5.mp3",
  C6: "C6.mp3",
  "D#6": "Ds6.mp3",
  "F#6": "Fs6.mp3",
  A6: "A6.mp3",
  C7: "C7.mp3",
  "D#7": "Ds7.mp3",
  "F#7": "Fs7.mp3",
  A7: "A7.mp3",
  C8: "C8.mp3",
};

const DEFAULT_BASE_URL = "https://tonejs.github.io/audio/salamander/";

export interface AudioEngineOptions {
  /** Base URL for piano sample files. Defaults to the Tone.js Salamander CDN. */
  baseUrl?: string;
}

export class AudioEngine {
  private sampler: Tone.Sampler | null = null;
  private ready = false;
  private loading = false;
  private readonly baseUrl: string;

  constructor(options?: AudioEngineOptions) {
    this.baseUrl = options?.baseUrl ?? DEFAULT_BASE_URL;
  }

  /**
   * Initialize the audio engine - must be called from a user gesture handler
   * Starts AudioContext and loads piano samples
   * @returns Promise that resolves when audio is ready to play
   */
  async init(): Promise<void> {
    if (this.ready || this.loading) {
      return;
    }

    this.loading = true;

    try {
      // Start Tone.js AudioContext (requires user gesture)
      await Tone.start();

      // Create sampler with Salamander Grand Piano samples
      this.sampler = new Tone.Sampler({
        urls: PIANO_SAMPLES,
        baseUrl: this.baseUrl,
        release: 1,
      }).toDestination();

      // Wait for all samples to load
      await Tone.loaded();

      this.ready = true;
    } finally {
      this.loading = false;
    }
  }

  /**
   * Check if the audio engine is ready to play sounds
   */
  isReady(): boolean {
    return this.ready;
  }

  /**
   * Check if samples are currently loading
   */
  isLoading(): boolean {
    return this.loading;
  }

  /**
   * Play a note
   * @param noteName - Note in pitch-octave format (e.g., "C4", "A#3")
   * @param velocity - Optional velocity (0-1), defaults to 0.8
   */
  noteOn(noteName: string, velocity: number = 0.8): void {
    if (!this.sampler || !this.ready) {
      console.warn("AudioEngine not initialized. Call init() first.");
      return;
    }

    try {
      const now = Tone.now();
      this.sampler.triggerAttack(noteName, now, velocity);
    } catch (error) {
      console.error(`Failed to play note ${noteName}:`, error);
    }
  }

  /**
   * Release a note
   * @param noteName - Note in pitch-octave format (e.g., "C4", "A#3")
   */
  noteOff(noteName: string): void {
    if (!this.sampler || !this.ready) {
      return;
    }

    try {
      const now = Tone.now();
      this.sampler.triggerRelease(noteName, now);
    } catch (error) {
      console.error(`Failed to release note ${noteName}:`, error);
    }
  }

  /**
   * Release all currently playing notes (panic button)
   */
  allNotesOff(): void {
    if (!this.sampler || !this.ready) {
      return;
    }

    try {
      this.sampler.releaseAll();
    } catch (error) {
      console.error("Failed to release all notes:", error);
    }
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    if (this.sampler) {
      this.sampler.dispose();
      this.sampler = null;
    }
    this.ready = false;
    this.loading = false;
  }
}
