# Ambeo Studio MVP

Ambeo Studio is a local-first modular patch-cable audio studio inspired by Max/MSP + n8n.

## Tech stack choice

This MVP uses **Option A (Electron-style architecture) with a browser-first implementation**:
- **UI**: HTML/CSS/Vanilla JS node graph (React-ready boundaries in `src/ui`)
- **Audio engine**: Web Audio API (`AudioContext`) with low-latency defaults
- **Persistence**: JSON patch schema with versioned modules
- **Data modules**: Fetch-based crypto tracker with deterministic mock fallback

Why this choice:
- Runs immediately on macOS without native build complexity.
- Same graph/data/module contracts can be moved into Electron wrapper for desktop packaging.
- DSP and module boundaries (`BaseModule`) isolate engine from UI and persistence.

## Run

```bash
python3 -m http.server 8080
```
Then open: <http://localhost:8080>

## MVP features implemented

- Node graph UI with draggable modules, cable wiring, and grid background
- Stereo master bus with meter + hard limiter
- Global sample rate/buffer status display
- BaseModule template and versioned schema registry
- Working modules:
  - Inputs: Oscillator synth, Crypto Tracker Sonifier, Satellite Tracker Sonifier
  - Effects: Reverb, Compressor, EQ, Delay, Distortion/Saturation
  - Mixers: Stereo mixer with 4/8/12 channel mode
- Save/load patch JSON with positions + wiring
- Safe defaults with first-run demo patch that makes sound
- Graceful network/API failure status in module UI

## Repository structure

- `index.html` – app shell
- `src/main.js` – bootstrap and demo patch
- `src/audio/AudioEngine.js` – realtime engine, master output, limiter, meter
- `src/modules/BaseModule.js` – stable base module contract + schema metadata
- `src/modules/*.js` – module implementations
- `src/ui/GraphUI.js` – node graph, patch cable rendering, module controls
- `src/persistence/PatchSerializer.js` – versioned JSON save/load
- `src/data/CryptoDataService.js` – API polling + mock fallback
- `src/data/SatelliteDataService.js` – satellite telemetry + mock fallback
- `src/modules/SatelliteSonifierModule.js` – altitude/speed/azimuth sonification
- `src/modules/CompressorModule.js`, `EQModule.js`, `DelayModule.js`, `DistortionModule.js` – effect processors
- `docs/NEXT_STEPS.md` – roadmap for drum machine/sequencer/sampler

## HTML link

<a href="http://localhost:8080" target="_blank" rel="noopener noreferrer">Launch Ambeo Studio MVP</a>
