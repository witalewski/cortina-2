# Cortina — Musical Training with MIDI

A web-based musical training app that connects to MIDI keyboards via the Web MIDI API and plays real piano sounds using Tone.js. Built to help musicians practice intervals, chords, scales, and more — with instant audio feedback from their own MIDI hardware.

> **Status:** Core MIDI and audio are done, with a basic playground UI in place. Training exercises are next.

## Getting Started

```bash
npm install
npm run dev        # Start dev server at http://localhost:3000
npm test           # Run all tests
npm run test:watch # Run tests in watch mode
npm run build      # Production build
npm run lint       # ESLint
```

**Live demo:** https://witalewski.github.io/cortina-2/

**Requirements:** A browser that supports the [Web MIDI API](https://developer.mozilla.org/en-US/docs/Web/API/Web_MIDI_API) (Chrome, Edge, Opera). Safari is not supported. Must be served over HTTPS or localhost.

## Project Goals

Cortina is a musical training tool with these guiding principles:

1. **Progressive enhancement** — the app should gracefully handle browsers without MIDI support, denied permissions, and no connected devices.
2. **Real instrument sounds** — we use Salamander Grand Piano samples (via Tone.js Sampler).
