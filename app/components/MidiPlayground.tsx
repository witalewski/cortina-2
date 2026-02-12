"use client";

import { useCallback } from "react";
import { useMidi } from "@/hooks/useMidi";
import { useAudioEngine } from "@/hooks/useAudioEngine";
import { midiToNoteName, velocityToGain } from "@/lib/music/midi";

export function MidiPlayground() {
  const {
    isReady: audioReady,
    isLoading: audioLoading,
    initAudio,
    noteOn,
    noteOff,
  } = useAudioEngine();

  // Wire MIDI events to audio engine
  const handleNoteOn = useCallback(
    (note: number, velocity: number) => {
      if (audioReady) {
        const noteName = midiToNoteName(note);
        const gain = velocityToGain(velocity);
        noteOn(noteName, gain);
      }
    },
    [audioReady, noteOn],
  );

  const handleNoteOff = useCallback(
    (note: number) => {
      if (audioReady) {
        const noteName = midiToNoteName(note);
        noteOff(noteName);
      }
    },
    [audioReady, noteOff],
  );

  const { status, devices, lastNote, error } = useMidi({
    onNoteOn: handleNoteOn,
    onNoteOff: handleNoteOff,
  });

  const handleEnableAudio = async () => {
    await initAudio();
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="max-w-2xl w-full space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold">Cortina</h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Musical Training with MIDI
          </p>
        </div>

        {/* Audio Initialization */}
        {!audioReady && (
          <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-6 space-y-4">
            <div className="space-y-2">
              <h2 className="text-xl font-semibold">Welcome</h2>
              <p className="text-gray-700 dark:text-gray-300">
                Connect a MIDI keyboard and play along, or use this as a virtual
                piano. Click the button below to enable audio.
              </p>
            </div>
            <button
              onClick={handleEnableAudio}
              disabled={audioLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              {audioLoading ? "Loading piano samples..." : "Enable Audio"}
            </button>
          </div>
        )}

        {/* MIDI Status */}
        {audioReady && (
          <div className="space-y-6">
            {/* MIDI Connection Status */}
            {status === "unsupported" && (
              <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
                <h3 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-2">
                  MIDI Not Supported
                </h3>
                <p className="text-yellow-800 dark:text-yellow-200">
                  Your browser doesn&apos;t support the Web MIDI API. Try using
                  Chrome, Edge, or Opera.
                </p>
              </div>
            )}

            {status === "denied" && (
              <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-6">
                <h3 className="font-semibold text-red-900 dark:text-red-100 mb-2">
                  MIDI Permission Denied
                </h3>
                <p className="text-red-800 dark:text-red-200">
                  {error || "Please grant MIDI access to use your keyboard."}
                </p>
              </div>
            )}

            {status === "prompt" && (
              <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6">
                <p className="text-gray-700 dark:text-gray-300">
                  Requesting MIDI access...
                </p>
              </div>
            )}

            {status === "granted" && devices.length === 0 && (
              <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6">
                <h3 className="font-semibold mb-2">
                  No MIDI Devices Connected
                </h3>
                <p className="text-gray-700 dark:text-gray-300">
                  Connect a MIDI keyboard to get started. It should be detected
                  automatically.
                </p>
              </div>
            )}

            {status === "granted" && devices.length > 0 && (
              <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-6 space-y-4">
                <div>
                  <h3 className="font-semibold text-green-900 dark:text-green-100 mb-2">
                    ✓ MIDI Connected
                  </h3>
                  <div className="space-y-1">
                    {devices.map((device) => (
                      <p
                        key={device.id}
                        className="text-sm text-green-800 dark:text-green-200"
                      >
                        {device.name}{" "}
                        {device.manufacturer && `(${device.manufacturer})`}
                      </p>
                    ))}
                  </div>
                </div>

                {/* Last Note Display */}
                {lastNote && (
                  <div className="pt-4 border-t border-green-200 dark:border-green-800">
                    <p className="text-sm text-green-800 dark:text-green-200 mb-1">
                      Last Note:
                    </p>
                    <div className="flex items-center gap-4">
                      <span className="text-3xl font-bold text-green-900 dark:text-green-100">
                        {midiToNoteName(lastNote.note)}
                      </span>
                      <span className="text-sm text-green-700 dark:text-green-300">
                        velocity: {lastNote.velocity}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Instructions */}
            <div className="text-center text-sm text-gray-600 dark:text-gray-400">
              Audio is enabled. Play your MIDI keyboard to hear sounds.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
