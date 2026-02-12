import { BaseModule } from './BaseModule.js';

function makeCurve(amount = 300) {
  const k = typeof amount === 'number' ? amount : 50;
  const n = 44100;
  const curve = new Float32Array(n);
  const deg = Math.PI / 180;
  for (let i = 0; i < n; i += 1) {
    const x = (i * 2) / n - 1;
    curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
  }
  return curve;
}

export class DistortionModule extends BaseModule {
  constructor(args) {
    super({ ...args, type: 'distortion', version: 1 });
    const ctx = this.audioContext;
    this.input = ctx.createGain();
    this.shaper = ctx.createWaveShaper();
    this.output = ctx.createGain();

    this.input.connect(this.shaper);
    this.shaper.connect(this.output);

    this.inputs.set('stereo', this.input);
    this.outputs.set('stereo', this.output);

    this.controls = { drive: 220, level: 0.7 };
    this.apply();
  }

  apply() {
    this.shaper.curve = makeCurve(this.controls.drive);
    this.shaper.oversample = '4x';
    this.output.gain.value = this.controls.level;
  }
}
