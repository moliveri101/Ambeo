import { BaseModule } from './BaseModule.js';

function buildImpulse(ctx, seconds = 1.8, decay = 2.2) {
  const len = ctx.sampleRate * seconds;
  const impulse = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch += 1) {
    const data = impulse.getChannelData(ch);
    for (let i = 0; i < len; i += 1) {
      const n = (Math.random() * 2 - 1);
      data[i] = n * Math.pow(1 - i / len, decay);
    }
  }
  return impulse;
}

export class ReverbModule extends BaseModule {
  constructor(args) {
    super({ ...args, type: 'reverb', version: 1 });
    const ctx = this.audioContext;
    this.input = ctx.createGain();
    this.convolver = ctx.createConvolver();
    this.dry = ctx.createGain();
    this.wet = ctx.createGain();
    this.output = ctx.createGain();

    this.convolver.buffer = buildImpulse(ctx);
    this.dry.gain.value = 0.65;
    this.wet.gain.value = 0.35;

    this.input.connect(this.dry);
    this.input.connect(this.convolver);
    this.convolver.connect(this.wet);
    this.dry.connect(this.output);
    this.wet.connect(this.output);

    this.inputs.set('stereo', this.input);
    this.outputs.set('stereo', this.output);
    this.controls = { dry: 0.65, wet: 0.35 };
  }

  setMix(wetValue) {
    const wet = Math.max(0, Math.min(1, wetValue));
    this.wet.gain.value = wet;
    this.dry.gain.value = 1 - wet;
    this.updateControl('wet', wet);
    this.updateControl('dry', 1 - wet);
  }
}
