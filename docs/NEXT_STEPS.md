# Next steps roadmap

## 1) Drum machine
- Add `DrumMachineModule` with 16-step sequencer lanes (kick/snare/hihat/clap).
- Implement per-lane sample slots and velocity.
- Clock-sync to transport module BPM.

## 2) Sequencer
- Add `SequencerModule` emitting note/gate control streams.
- Support pattern length, swing, ratchets, and probability.
- Route into synth/sampler modules through control ports.

## 3) Sampler
- Add `SamplerModule` for WAV/AIFF decode via `AudioBuffer`.
- Multi-zone key mapping and ADSR envelope.
- Voice stealing and polyphony controls.

## Platform hardening
- Wrap in Electron for packaged macOS desktop app.
- Move heavy DSP modules into AudioWorklet processors.
- Add module unit tests and patch compatibility migration tests.
