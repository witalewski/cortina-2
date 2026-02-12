"use client";

import { createContext, useContext, ReactNode } from "react";
import { useAudioEngine } from "@/hooks/useAudioEngine";

type AudioEngineContextValue = ReturnType<typeof useAudioEngine>;

const AudioEngineContext = createContext<AudioEngineContextValue | null>(null);

interface AudioEngineProviderProps {
  children: ReactNode;
}

/**
 * Provider component that wraps the app with AudioEngine context.
 * This ensures a singleton AudioEngine instance that persists across page navigation.
 * Only this component should call useAudioEngine() directly.
 */
export function AudioEngineProvider({ children }: AudioEngineProviderProps) {
  const audioEngineValue = useAudioEngine();

  return (
    <AudioEngineContext.Provider value={audioEngineValue}>
      {children}
    </AudioEngineContext.Provider>
  );
}

/**
 * Hook to access AudioEngine context.
 * Use this instead of useAudioEngine() in components.
 */
export function useAudioEngineContext(): AudioEngineContextValue {
  const context = useContext(AudioEngineContext);

  if (!context) {
    throw new Error(
      "useAudioEngineContext must be used within an AudioEngineProvider",
    );
  }

  return context;
}
