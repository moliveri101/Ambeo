import { BaseModule } from './BaseModule.js';

export class CompressorModule extends BaseModule {
  constructor(args) {
    super({ ...args, type: 'compressor', version: 1 });
    const ctx = this.audioContext;
    this.input = ctx.createGain();
    this.comp = ctx.createDynamicsCompressor();
    this.output = ctx.createGain();

    this.input.connect(this.comp);
    this.comp.connect(this.output);

    this.inputs.set('stereo', this.input);
    this.outputs.set('stereo', this.output);

    this.controls = { threshold: -22, ratio: 4, attack: 0.01, release: 0.18, makeup: 1.0 };
    this.apply();
  }

  apply() {
    this.comp.threshold.value = this.controls.threshold;
    this.comp.ratio.value = this.controls.ratio;
    this.comp.attack.value = this.controls.attack;
    this.comp.release.value = this.controls.release;
    this.output.gain.value = this.controls.makeup;
  }
}
