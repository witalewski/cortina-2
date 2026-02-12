"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { AudioEngine } from "@/lib/audio/AudioEngine";

interface UseAudioEngineReturn {
  isReady: boolean;
  isLoading: boolean;
  initAudio: () => Promise<void>;
  noteOn: (noteName: string, velocity?: number) => void;
  noteOff: (noteName: string) => void;
  allNotesOff: () => void;
}

/**
 * React hook for managing the audio engine
 * Provides a singleton AudioEngine instance and methods to control it
 */
export function useAudioEngine(): UseAudioEngineReturn {
  const engineRef = useRef<AudioEngine | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize engine reference
  if (!engineRef.current) {
    engineRef.current = new AudioEngine();
  }

  const initAudio = useCallback(async () => {
    if (!engineRef.current) return;

    try {
      setIsLoading(true);
      await engineRef.current.init();
      setIsReady(true);
    } catch (error) {
      console.error("Failed to initialize audio:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const noteOn = useCallback((noteName: string, velocity?: number) => {
    engineRef.current?.noteOn(noteName, velocity);
  }, []);

  const noteOff = useCallback((noteName: string) => {
    engineRef.current?.noteOff(noteName);
  }, []);

  const allNotesOff = useCallback(() => {
    engineRef.current?.allNotesOff();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      engineRef.current?.dispose();
      engineRef.current = null;
    };
  }, []);

  return {
    isReady,
    isLoading,
    initAudio,
    noteOn,
    noteOff,
    allNotesOff,
  };
}
