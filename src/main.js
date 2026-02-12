import { AudioEngine } from './audio/AudioEngine.js';
import { OscillatorModule } from './modules/OscillatorModule.js';
import { MixerModule } from './modules/MixerModule.js';
import { ReverbModule } from './modules/ReverbModule.js';
import { CompressorModule } from './modules/CompressorModule.js';
import { EQModule } from './modules/EQModule.js';
import { DelayModule } from './modules/DelayModule.js';
import { DistortionModule } from './modules/DistortionModule.js';
import { CryptoSonifierModule } from './modules/CryptoSonifierModule.js';
import { SatelliteSonifierModule } from './modules/SatelliteSonifierModule.js';
import { GraphUI } from './ui/GraphUI.js';
import { PatchSerializer } from './persistence/PatchSerializer.js';

const engine = new AudioEngine();
const modules = [];
const connections = [];
const moduleUiTimers = new Map();
let nextId = 0;
window.__ambeoConnections = connections;

const graph = new GraphUI({
  canvas: document.getElementById('graphCanvas'),
  createModule: null,
  onConnect: ({ from, to }) => {
    const source = modules.find((m) => m.id === from);
    const target = modules.find((m) => m.id === to);
    if (!source || !target) return;
    source.connectOutput('stereo', target.inputs.get('stereo'));
    connections.push({ from, to, kind: 'audio' });
    graph.updateCableRender(connections);
  },
});

const el = {
  sampleRate: document.getElementById('sampleRate'),
  bufferSize: document.getElementById('bufferSize'),
  meter: document.getElementById('masterMeter'),
  patchFile: document.getElementById('patchFileInput'),
  inputMenu: document.getElementById('inputMenu'),
  effectsMenu: document.getElementById('effectsMenu'),
  mixersMenu: document.getElementById('mixersMenu'),
};

function addModule(type, position = { x: 60 + modules.length * 30, y: 60 + modules.length * 20 }, controls = null, forcedId = null) {
  const id = forcedId ?? (nextId + 1);
  nextId = Math.max(nextId, id);
  const common = { id, position, audioContext: engine.context };
  const factory = {
    oscillator: () => new OscillatorModule(common),
    mixer: () => new MixerModule(common),
    reverb: () => new ReverbModule(common),
    compressor: () => new CompressorModule(common),
    eq: () => new EQModule(common),
    delay: () => new DelayModule(common),
    distortion: () => new DistortionModule(common),
    crypto: () => new CryptoSonifierModule(common),
    satellite: () => new SatelliteSonifierModule(common),
  };
  const mod = factory[type]?.();
  if (!mod) return null;

  if (controls) Object.assign(mod.controls, controls);
  applyControls(mod);
  if (type === 'crypto' || type === 'satellite') mod.start();

  modules.push(mod);
  renderModule(mod);
  return mod;
}

function applyControls(mod) {
  if (mod.type === 'oscillator') {
    mod.setWave(mod.controls.wave);
    mod.setFrequency(mod.controls.frequency);
    mod.setGain(mod.controls.gain);
  } else if (mod.type === 'mixer') {
    mod.setTrackCount(mod.controls.trackCount);
    mod.setPan(mod.controls.pan);
    mod.setMute(Boolean(mod.controls.mute));
    mod.setGain(mod.controls.gain);
  } else if (mod.type === 'reverb') mod.setMix(mod.controls.wet);
  else if (mod.apply) mod.apply();
}

function addStatusTicker(mod, statusEl) {
  const timer = setInterval(() => {
    statusEl.textContent = mod.controls.status;
    statusEl.className = mod.controls.source === 'live' ? 'status-good' : 'status-warn';
  }, 700);
  moduleUiTimers.set(mod.id, timer);
}

function renderModule(mod) {
  const rows = [];
  const mkRange = (min, max, step, value, onInput) => {
    const input = document.createElement('input');
    input.type = 'range';
    input.min = String(min);
    input.max = String(max);
    input.step = String(step);
    input.value = String(value);
    input.addEventListener('input', () => onInput(Number(input.value)));
    return input;
  };

  if (mod.type === 'oscillator') {
    const wave = document.createElement('select');
    ['sine', 'sawtooth', 'square'].forEach((w) => {
      const op = document.createElement('option'); op.value = w; op.textContent = w; wave.appendChild(op);
    });
    wave.value = mod.controls.wave;
    wave.addEventListener('input', () => mod.setWave(wave.value));
    rows.push(GraphUI.controlRow('Wave', wave));
    rows.push(GraphUI.controlRow('Freq', mkRange(70, 880, 1, mod.controls.frequency, (v) => mod.setFrequency(v))));
    rows.push(GraphUI.controlRow('Gain', mkRange(0, 1, 0.01, mod.controls.gain, (v) => mod.setGain(v))));
  }

  if (mod.type === 'mixer') {
    const tracks = document.createElement('select');
    [4, 8, 12].forEach((n) => {
      const op = document.createElement('option'); op.value = String(n); op.textContent = `${n} tracks`; tracks.appendChild(op);
    });
    tracks.value = String(mod.controls.trackCount);
    tracks.addEventListener('input', () => mod.setTrackCount(Number(tracks.value)));
    rows.push(GraphUI.controlRow('Channels', tracks));
    rows.push(GraphUI.controlRow('Gain', mkRange(0, 1.2, 0.01, mod.controls.gain, (v) => mod.setGain(v))));
    rows.push(GraphUI.controlRow('Pan', mkRange(-1, 1, 0.01, mod.controls.pan, (v) => mod.setPan(v))));
  }

  if (mod.type === 'reverb') rows.push(GraphUI.controlRow('Wet', mkRange(0, 1, 0.01, mod.controls.wet, (v) => { mod.controls.wet = v; mod.setMix(v); })));
  if (mod.type === 'compressor') {
    rows.push(GraphUI.controlRow('Threshold', mkRange(-48, -4, 1, mod.controls.threshold, (v) => { mod.controls.threshold = v; mod.apply(); })));
    rows.push(GraphUI.controlRow('Ratio', mkRange(1, 20, 0.5, mod.controls.ratio, (v) => { mod.controls.ratio = v; mod.apply(); })));
  }
  if (mod.type === 'eq') {
    rows.push(GraphUI.controlRow('Low', mkRange(-18, 18, 0.5, mod.controls.low, (v) => { mod.controls.low = v; mod.apply(); })));
    rows.push(GraphUI.controlRow('Mid', mkRange(-18, 18, 0.5, mod.controls.mid, (v) => { mod.controls.mid = v; mod.apply(); })));
    rows.push(GraphUI.controlRow('High', mkRange(-18, 18, 0.5, mod.controls.high, (v) => { mod.controls.high = v; mod.apply(); })));
  }
  if (mod.type === 'delay') {
    rows.push(GraphUI.controlRow('Time', mkRange(0.01, 1.5, 0.01, mod.controls.time, (v) => { mod.controls.time = v; mod.apply(); })));
    rows.push(GraphUI.controlRow('Feedback', mkRange(0, 0.92, 0.01, mod.controls.feedback, (v) => { mod.controls.feedback = v; mod.apply(); })));
  }
  if (mod.type === 'distortion') {
    rows.push(GraphUI.controlRow('Drive', mkRange(0, 700, 1, mod.controls.drive, (v) => { mod.controls.drive = v; mod.apply(); })));
    rows.push(GraphUI.controlRow('Level', mkRange(0, 1, 0.01, mod.controls.level, (v) => { mod.controls.level = v; mod.apply(); })));
  }

  if (mod.type === 'crypto' || mod.type === 'satellite') {
    if (mod.type === 'crypto') {
      const symbol = document.createElement('input');
      symbol.value = mod.controls.symbol;
      symbol.addEventListener('change', () => { mod.controls.symbol = symbol.value.toUpperCase(); mod.start(); });
      rows.push(GraphUI.controlRow('Symbol', symbol));
    }
    if (mod.type === 'satellite') {
      const norad = document.createElement('input');
      norad.type = 'number';
      norad.value = String(mod.controls.noradId);
      norad.addEventListener('change', () => { mod.controls.noradId = Number(norad.value || 25544); mod.start(); });
      rows.push(GraphUI.controlRow('NORAD', norad));
    }
    const status = document.createElement('span');
    status.className = 'status-warn';
    status.textContent = mod.controls.status;
    rows.push(GraphUI.controlRow('Feed', status));
    addStatusTicker(mod, status);
  }

  graph.addModuleCard(mod, rows);
  graph.updateCableRender(connections);
}

function connectToMaster(module) {
  module.connectOutput('stereo', engine.masterIn);
  connections.push({ from: module.id, to: 'master', kind: 'audio' });
}

function loadDemoPatch() {
  const osc = addModule('oscillator', { x: 300, y: 120 });
  const comp = addModule('compressor', { x: 580, y: 120 });
  const rev = addModule('reverb', { x: 860, y: 160 });
  const mix = addModule('mixer', { x: 1120, y: 220 });
  osc.connectOutput('stereo', comp.inputs.get('stereo'));
  comp.connectOutput('stereo', rev.inputs.get('stereo'));
  rev.connectOutput('stereo', mix.inputs.get('stereo'));
  connectToMaster(mix);
  connections.push({ from: osc.id, to: comp.id, kind: 'audio' });
  connections.push({ from: comp.id, to: rev.id, kind: 'audio' });
  connections.push({ from: rev.id, to: mix.id, kind: 'audio' });
  graph.updateCableRender(connections);
}

function clearPatch() {
  moduleUiTimers.forEach((t) => clearInterval(t));
  moduleUiTimers.clear();
  modules.forEach((m) => m.dispose());
  modules.splice(0);
  connections.splice(0);
  graph.clear();
}

document.getElementById('startAudio').addEventListener('click', async () => {
  if (!engine.context) {
    await engine.init();
    el.sampleRate.textContent = `Sample Rate: ${engine.context.sampleRate}`;
    el.bufferSize.textContent = `Buffer: ${engine.analyser.fftSize}`;
    loadDemoPatch();
  } else {
    await engine.context.resume();
  }
});

document.getElementById('addInput').addEventListener('click', () => addModule(el.inputMenu.value));
document.getElementById('addEffect').addEventListener('click', () => addModule(el.effectsMenu.value));
document.getElementById('addMixer').addEventListener('click', () => addModule(el.mixersMenu.value));

document.getElementById('savePatch').addEventListener('click', () => {
  const data = PatchSerializer.save(modules, connections.filter((c) => c.to !== 'master'));
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'ambeo-patch.json';
  a.click();
  URL.revokeObjectURL(url);
});

document.getElementById('loadPatch').addEventListener('click', () => el.patchFile.click());

el.patchFile.addEventListener('change', async () => {
  const file = el.patchFile.files?.[0];
  if (!file || !engine.context) return;
  const patch = PatchSerializer.parse(await file.text());
  clearPatch();
  patch.modules.forEach((m) => addModule(m.type, m.position, m.controls, m.id));
  patch.connections.forEach((c) => {
    const source = modules.find((m) => m.id === c.from);
    const target = modules.find((m) => m.id === c.to);
    if (source && target) {
      source.connectOutput('stereo', target.inputs.get('stereo'));
      connections.push(c);
    }
  });
  const mix = modules.find((m) => m.type === 'mixer');
  if (mix) connectToMaster(mix);
  graph.updateCableRender(connections);
});

setInterval(() => {
  if (!engine.context) return;
  el.meter.textContent = `Master: ${engine.getMeterDb().toFixed(1)} dB`;
}, 120);
