"use client";

import { useCallback } from "react";
import Link from "next/link";
import { useMidi } from "@/hooks/useMidi";
import { useAudioEngineContext } from "@/app/providers/AudioEngineProvider";
import { midiToNoteName, velocityToGain } from "@/lib/music/midi";
import { Alert, AlertDescription, AlertTitle } from "@/app/components/ui/alert";
import { Badge } from "@/app/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { Button, buttonVariants } from "@/app/components/ui/button";
import { Separator } from "@/app/components/ui/separator";

export function MidiPlayground() {
  const {
    isReady: audioReady,
    isLoading: audioLoading,
    initAudio,
    noteOn,
    noteOff,
  } = useAudioEngineContext();

  // Wire MIDI events to audio engine
  const onNoteOn = useCallback(
    (note: number, velocity: number) => {
      if (audioReady) {
        const noteName = midiToNoteName(note);
        const gain = velocityToGain(velocity);
        noteOn(noteName, gain);
      }
    },
    [audioReady, noteOn],
  );

  const onNoteOff = useCallback(
    (note: number) => {
      if (audioReady) {
        const noteName = midiToNoteName(note);
        noteOff(noteName);
      }
    },
    [audioReady, noteOff],
  );

  const { status, devices, lastNote, error } = useMidi({
    onNoteOn,
    onNoteOff,
  });

  const onEnableAudio = async () => {
    await initAudio();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-6 py-16">
        <header className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="secondary">Cortina</Badge>
            <Badge variant={audioReady ? "default" : "outline"}>
              {audioReady ? "Audio ready" : "Audio locked"}
            </Badge>
            <Badge
              variant={status === "granted" ? "default" : "secondary"}
              className="uppercase"
            >
              MIDI {status}
            </Badge>
          </div>
          <div className="space-y-2">
            <h1 className="text-4xl font-semibold tracking-tight">
              Studio for Real-Time MIDI Practice
            </h1>
            <p className="text-base text-muted-foreground">
              Connect a keyboard, unlock the audio engine, and hear full piano
              samples with every note you play.
            </p>
            <div className="pt-2">
              <Link
                href="/play"
                className={buttonVariants({ variant: "secondary" })}
              >
                Open Play Mode
              </Link>
            </div>
          </div>
        </header>

        {!audioReady && (
          <Card>
            <CardHeader>
              <CardTitle>Enable the Audio Engine</CardTitle>
              <CardDescription>
                Audio playback requires a user gesture. Load the piano samples
                to begin a session.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm text-muted-foreground">
                  You can still connect MIDI now. Sound will start after the
                  engine is ready.
                </div>
                <Button onClick={onEnableAudio} disabled={audioLoading}>
                  {audioLoading ? "Loading piano samples..." : "Enable Audio"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {audioReady && (
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Session Status</CardTitle>
                  <CardDescription>
                    Live checks for MIDI access, devices, and permissions.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {status === "unsupported" && (
                    <Alert className="border-destructive/40">
                      <AlertTitle>MIDI not supported</AlertTitle>
                      <AlertDescription>
                        This browser does not expose the Web MIDI API. Try
                        Chrome, Edge, or Opera.
                      </AlertDescription>
                    </Alert>
                  )}

                  {status === "denied" && (
                    <Alert className="border-destructive/40">
                      <AlertTitle>MIDI permission denied</AlertTitle>
                      <AlertDescription>
                        {error ||
                          "Grant MIDI access in the browser to use your keyboard."}
                      </AlertDescription>
                    </Alert>
                  )}

                  {status === "prompt" && (
                    <Alert>
                      <AlertTitle>Waiting for MIDI permission</AlertTitle>
                      <AlertDescription>
                        Approve the permission prompt to detect your keyboard.
                      </AlertDescription>
                    </Alert>
                  )}

                  {status === "granted" && devices.length === 0 && (
                    <Alert>
                      <AlertTitle>No MIDI devices detected</AlertTitle>
                      <AlertDescription>
                        Plug in a MIDI keyboard or launch a virtual device and
                        it will appear automatically.
                      </AlertDescription>
                    </Alert>
                  )}

                  {status === "granted" && devices.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Badge>Connected</Badge>
                        <span className="text-sm text-muted-foreground">
                          {devices.length} device
                          {devices.length === 1 ? "" : "s"} ready
                        </span>
                      </div>
                      <div className="rounded-lg border border-border bg-muted/40 p-4">
                        <div className="space-y-2">
                          {devices.map((device) => (
                            <div key={device.id} className="text-sm">
                              <span className="font-medium">{device.name}</span>
                              {device.manufacturer && (
                                <span className="text-muted-foreground">
                                  {" "}
                                  ({device.manufacturer})
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="text-sm text-muted-foreground">
                  Audio is enabled. Play your MIDI keyboard to hear sounds.
                </CardFooter>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Last Note</CardTitle>
                  <CardDescription>
                    The most recent MIDI note captured by the session.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {lastNote ? (
                    <div className="flex flex-wrap items-center gap-4">
                      <div className="text-4xl font-semibold">
                        {midiToNoteName(lastNote.note)}
                      </div>
                      <Separator orientation="vertical" className="h-8" />
                      <div className="text-sm text-muted-foreground">
                        Velocity {lastNote.velocity}
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      Play any note to populate the live readout.
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Session Checklist</CardTitle>
                  <CardDescription>
                    Quick steps to get the best playback experience.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <div className="flex items-center justify-between">
                    <span>Audio engine</span>
                    <Badge variant={audioReady ? "default" : "outline"}>
                      {audioReady ? "Ready" : "Locked"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>MIDI permission</span>
                    <Badge
                      variant={status === "granted" ? "default" : "secondary"}
                    >
                      {status === "granted" ? "Granted" : "Pending"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Devices detected</span>
                    <Badge
                      variant={devices.length > 0 ? "default" : "secondary"}
                    >
                      {devices.length > 0 ? devices.length : "None"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Practice Focus</CardTitle>
                  <CardDescription>
                    Pick a starting goal for your next session.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  <div>
                    Intervals: play two notes and identify the distance.
                  </div>
                  <div>Chords: stack triads and listen for color.</div>
                  <div>Scales: keep tempo steady and even.</div>
                </CardContent>
                <CardFooter>
                  <Button variant="secondary" className="w-full">
                    Launch Training (coming soon)
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
