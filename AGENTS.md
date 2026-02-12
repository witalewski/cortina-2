# AGENTS.md — Instructions for AI Coding Agents

## Project Context

Cortina is a musical training web app. Users connect a MIDI keyboard and practice with real piano feedback. See README.md for full architecture and decisions.

## Hard Rules

1. **Never import `tone` outside `lib/audio/`** — AudioEngine is the sole consumer of Tone.js.
2. **Never import Web MIDI API types or access `navigator.requestMIDIAccess` outside `lib/midi/`** — MidiAccess is the sole MIDI gateway.
3. **Every new module must have tests** — colocated in a `__tests__/` directory next to the source file.
4. **Pure logic goes in `lib/`, React bridges in `hooks/`, UI in `app/components/`** — don't mix concerns.
5. **TypeScript strict mode** — no `any` unless unavoidable (test mocks are an exception).

## Module Boundaries

```
lib/music/   → Pure functions only. No side effects, no imports from other project modules.
lib/midi/    → Web MIDI API wrapper. No audio, no React.
lib/audio/   → Tone.js wrapper. No MIDI, no React.
hooks/       → Thin React state bridges. Delegate all logic to lib/.
app/components/ → UI composition from hooks. No direct API access.
```

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

## Common Pitfalls

- **Tone.js ESM in Jest:** Tone.js is an ES module. The global mock in `jest.setup.ts` sidesteps this. If you add a new Tone.js feature, extend the mock there.
- **AudioContext requires user gesture:** `AudioEngine.init()` must be called from a click/tap handler. The UI handles this with the "Enable Audio" button.
- **Web MIDI requires secure context:** Only works on HTTPS or localhost. Safari is not supported.
- **MIDI velocity 0 = note off:** This is a common MIDI convention. `MidiAccess` already handles it.

## When Adding Features

1. Start with the pure logic in `lib/` and its tests
2. Add a React hook in `hooks/` if React state management is needed
3. Wire into UI in `app/components/`
4. Verify: `npm test` (all pass) and `npm run build` (clean)
