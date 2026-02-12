"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { midiToNoteName } from "@/lib/music/midi";

const BLACK_NOTE_INDICES = new Set([1, 3, 6, 8, 10]);

interface PianoKeyboardProps {
  startNote?: number;
  endNote?: number;
  activeNotes?: number[];
  highlightedNotes?: number[];
  labels?: Record<number, string>;
  disabled?: boolean;
  className?: string;
  onKeyDown?: (note: number) => void;
  onKeyUp?: (note: number) => void;
}

interface PianoKeyInfo {
  midi: number;
  isBlack: boolean;
  whiteIndex: number;
  positionIndex: number;
  label?: string;
}

export function PianoKeyboard({
  startNote = 48,
  endNote = 72,
  activeNotes = [],
  highlightedNotes = [],
  labels = {},
  disabled = false,
  className,
  onKeyDown,
  onKeyUp,
}: PianoKeyboardProps) {
  const { whiteKeys, blackKeys, whiteKeyCount, blackKeyWidth } = useMemo(() => {
    const keys: PianoKeyInfo[] = [];
    let whiteIndex = -1;

    for (let midi = startNote; midi <= endNote; midi += 1) {
      const isBlack = BLACK_NOTE_INDICES.has(midi % 12);
      if (!isBlack) {
        whiteIndex += 1;
        keys.push({
          midi,
          isBlack,
          whiteIndex,
          positionIndex: whiteIndex,
          label: labels[midi],
        });
      } else {
        const positionIndex = whiteIndex >= 0 ? whiteIndex + 1 : 0.5;
        keys.push({
          midi,
          isBlack,
          whiteIndex,
          positionIndex,
          label: labels[midi],
        });
      }
    }

    const whiteKeys = keys.filter((key) => !key.isBlack);
    const blackKeys = keys.filter((key) => key.isBlack);
    const whiteKeyCount = whiteKeys.length;
    const blackKeyWidth = whiteKeyCount > 0 ? (100 / whiteKeyCount) * 0.6 : 0;

    return { whiteKeys, blackKeys, whiteKeyCount, blackKeyWidth };
  }, [startNote, endNote, labels]);

  const activeSet = useMemo(() => new Set(activeNotes), [activeNotes]);
  const highlightedSet = useMemo(
    () => new Set(highlightedNotes),
    [highlightedNotes],
  );

  const handlePointerDown = (note: number) => {
    if (disabled) return;
    onKeyDown?.(note);
  };

  const handlePointerUp = (note: number) => {
    if (disabled) return;
    onKeyUp?.(note);
  };

  return (
    <div
      className={cn(
        "relative w-full select-none",
        disabled && "opacity-60",
        className,
      )}
      role="group"
      aria-label="Piano keyboard"
      aria-disabled={disabled}
      data-disabled={disabled ? "true" : "false"}
    >
      <div className="flex w-full">
        {whiteKeys.map((key) => {
          const isActive = activeSet.has(key.midi);
          const isHighlighted = highlightedSet.has(key.midi);
          const keyStateClass = isActive
            ? "bg-primary/15 text-foreground border-primary/60"
            : isHighlighted
              ? "bg-amber-200/70 text-amber-900 border-amber-400/70"
              : "bg-card text-muted-foreground";

          return (
            <button
              key={key.midi}
              type="button"
              className={cn(
                "relative flex h-40 flex-1 items-end justify-center border border-border text-[11px] font-semibold uppercase shadow-sm transition-colors sm:h-44 md:h-48",
                "first:rounded-l-md last:rounded-r-md",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                "disabled:cursor-not-allowed disabled:opacity-70",
                keyStateClass,
              )}
              aria-label={midiToNoteName(key.midi)}
              data-midi={key.midi}
              data-active={isActive ? "true" : "false"}
              data-highlighted={isHighlighted ? "true" : "false"}
              disabled={disabled}
              onPointerDown={(event) => {
                event.preventDefault();
                handlePointerDown(key.midi);
              }}
              onPointerUp={() => handlePointerUp(key.midi)}
              onPointerLeave={() => handlePointerUp(key.midi)}
              onPointerCancel={() => handlePointerUp(key.midi)}
            >
              {key.label && (
                <span className="mb-2 text-xs font-semibold text-muted-foreground">
                  {key.label}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {whiteKeyCount > 0 &&
        blackKeys.map((key) => {
          const isActive = activeSet.has(key.midi);
          const isHighlighted = highlightedSet.has(key.midi);
          const keyStateClass = isActive
            ? "bg-stone-500 text-stone-950"
            : isHighlighted
              ? "bg-stone-600 text-stone-100"
              : "bg-foreground text-background";
          const leftPosition = (key.positionIndex / whiteKeyCount) * 100;

          return (
            <button
              key={key.midi}
              type="button"
              className={cn(
                "absolute top-0 z-10 flex h-24 items-end justify-center rounded-b-md border border-border text-[10px] font-semibold shadow-md transition-colors sm:h-28 md:h-32",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                "disabled:cursor-not-allowed disabled:opacity-70",
                isActive && "ring-2 ring-primary/70",
                !isActive && isHighlighted && "ring-2 ring-amber-300/90",
                keyStateClass,
              )}
              style={{
                left: `${leftPosition}%`,
                width: `${blackKeyWidth}%`,
                transform: "translateX(-50%)",
              }}
              aria-label={midiToNoteName(key.midi)}
              data-midi={key.midi}
              data-active={isActive ? "true" : "false"}
              data-highlighted={isHighlighted ? "true" : "false"}
              disabled={disabled}
              onPointerDown={(event) => {
                event.preventDefault();
                handlePointerDown(key.midi);
              }}
              onPointerUp={() => handlePointerUp(key.midi)}
              onPointerLeave={() => handlePointerUp(key.midi)}
              onPointerCancel={() => handlePointerUp(key.midi)}
            >
              {key.label && <span className="mb-2">{key.label}</span>}
            </button>
          );
        })}
    </div>
  );
}
