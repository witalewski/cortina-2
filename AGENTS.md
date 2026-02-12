# AGENTS.md — Instructions for AI Coding Agents

## Project Context

Cortina is a musical training web app. Users connect a MIDI keyboard and practice with real piano feedback. See README.md for full architecture and decisions.

## Hard Rules

1. **Never import `tone` outside `lib/audio/`** — AudioEngine is the sole consumer of Tone.js.
2. **Never import Web MIDI API types or access `navigator.requestMIDIAccess` outside `lib/midi/`** — MidiAccess is the sole MIDI gateway.
3. **Every new module must have tests** — colocated in a `__tests__/` directory next to the source file.
4. **Pure logic goes in `lib/`, React bridges in `hooks/`, UI in `app/components/`** — don't mix concerns.
5. **TypeScript strict mode** — no `any` unless unavoidable (test mocks are an exception).

## Architecture

### Audio Engine Context Pattern

Cortina uses a React Context pattern to ensure a singleton AudioEngine instance that persists across page navigation:

- **`AudioEngineProvider`** (`app/providers/AudioEngineProvider.tsx`) - Wraps the entire app and calls `useAudioEngine()` once
- **`useAudioEngineContext()`** - Hook for components to access the shared AudioEngine
- **When to use which:**
  - Use `useAudioEngine()` **only** in `AudioEngineProvider`
  - Use `useAudioEngineContext()` everywhere else (components, pages, hooks)

This prevents re-initializing the Tone.js AudioEngine when users navigate between pages, ensuring continuous audio playback and preserving loaded samples.

## Module Boundaries

```
lib/music/   → Pure functions only. No side effects, no imports from other project modules.
lib/midi/    → Web MIDI API wrapper. No audio, no React.
lib/audio/   → Tone.js wrapper. No MIDI, no React.
hooks/       → Thin React state bridges. Delegate all logic to lib/.
app/components/ → UI composition from hooks + shadcn components. No direct API access.
app/components/ui/ → shadcn/ui primitives only. No business logic.
```

## Tech Stack

| Technology            | Version | Purpose                                                         |
| --------------------- | ------- | --------------------------------------------------------------- |
| Next.js               | 16.1.6  | App Router, React framework                                     |
| React                 | 19.2.3  | UI library                                                      |
| TypeScript            | 5.x     | Type safety, strict mode                                        |
| Tone.js               | 15.1.22 | Audio synthesis and sampling                                    |
| Tailwind CSS          | 4.x     | Utility-first styling (CSS-based config + `tailwind.config.ts`) |
| shadcn/ui             | —       | Component library (Button, Card, Alert, Badge, etc.)            |
| Radix UI              | —       | Unstyled primitives (used by shadcn components)                 |
| Jest                  | 30.2.0  | Test runner                                                     |
| React Testing Library | 16.3.2  | Component testing                                               |
| `next/jest`           | —       | SWC transforms for Jest                                         |

## Testing

- **Framework:** Jest 30 + React Testing Library
- **Tone.js is globally mocked** in `jest.setup.ts`. Never import Tone.js directly in tests.
- **Web MIDI** is mocked per-test with `MockMIDIInput`/`MockMIDIAccess` classes.
- **Hooks:** Use `renderHook` + `waitFor`. Wrap async state updates in `act()`.
- **Components:** Mock hooks entirely (`jest.mock("@/hooks/useMidi")`), test UI rendering and event wiring only.
- Run `npm test` to verify. All tests must pass before completing work.
- Run `npm run build` to verify TypeScript compilation.

## Code Style

- Prettier with default settings (the formatter runs automatically)
- Trailing commas in function parameters (Prettier enforces this)
- `@/*` path aliases for imports (maps to project root)
- `"use client"` directive required on hooks and components that use browser APIs or React state
- **Prefer shadcn/ui components** (Button, Card, Alert, Badge, etc.) over custom inline elements or hand-written components

## Common Pitfalls

- **Tone.js ESM in Jest:** Tone.js is an ES module. The global mock in `jest.setup.ts` sidesteps this. If you add a new Tone.js feature, extend the mock there.
- **AudioContext requires user gesture:** `AudioEngine.init()` must be called from a click/tap handler. The UI handles this with the "Enable Audio" button.
- **Web MIDI requires secure context:** Only works on HTTPS or localhost. Safari is not supported.
- **MIDI velocity 0 = note off:** This is a common MIDI convention. `MidiAccess` already handles it.

## When Adding Features

1. Start with the pure logic in `lib/` and its tests
2. Add a React hook in `hooks/` if React state management is needed
3. Wire into UI in `app/components/` using shadcn primitives
4. Verify: `npm test` (all pass) and `npm run build` (clean)

## shadcn/ui Components

We use **[shadcn/ui](https://ui.shadcn.com/)** for UI components. Components live in `app/components/ui/` and are built on Radix UI primitives with Tailwind styling.

**Guidelines:**

- Use shadcn components (Button, Card, Alert, Badge, Separator, etc.) instead of custom inline elements
- Add new shadcn components with `npx shadcn@latest add <component>` or copy from docs
- Every UI component must have a smoke test in `app/components/ui/__tests__/`
- Use `cn()` from `lib/utils.ts` for conditional class merging
- shadcn components are presentational — keep all business logic in hooks or lib/

**Config:**

- `components.json` defines paths and aliases
- CSS variables in `app/globals.css` define the `stone` theme (light + dark via `prefers-color-scheme`)
- `tailwind.config.ts` maps CSS vars to Tailwind utilities

## Key Decisions

### Audio: Tone.js Sampler with Salamander Grand Piano

We started with `Tone.PolySynth` but switched to `Tone.Sampler` with **Salamander Grand Piano** samples for realistic sound. Samples are loaded from `https://tonejs.github.io/audio/salamander/` by default. The `AudioEngine` constructor accepts a `baseUrl` option for self-hosting samples.

~25 sample files cover the full 88-key range (every ~3 semitones); Tone.Sampler pitch-shifts to fill gaps.

### Web MIDI Types: Native TypeScript

We initially created custom type definitions in `types/webmidi.d.ts` but discovered TypeScript's built-in `lib.dom.d.ts` already includes complete Web MIDI API types. The custom file was removed — no `@types/*` package needed.

### MIDI Message Parsing

- Status byte upper nibble = command (0x90 = Note On, 0x80 = Note Off)
- Status byte lower nibble = channel (0-15)
- Note On with velocity 0 is treated as Note Off (common MIDI convention)
- Messages with fewer than 3 bytes are ignored
