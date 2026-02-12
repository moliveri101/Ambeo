import { BaseModule } from './BaseModule.js';

export class DelayModule extends BaseModule {
  constructor(args) {
    super({ ...args, type: 'delay', version: 1 });
    const ctx = this.audioContext;
    this.input = ctx.createGain();
    this.delay = ctx.createDelay(2.0);
    this.feedback = ctx.createGain();
    this.mix = ctx.createGain();
    this.dry = ctx.createGain();
    this.output = ctx.createGain();

    this.input.connect(this.dry);
    this.input.connect(this.delay);
    this.delay.connect(this.feedback);
    this.feedback.connect(this.delay);
    this.delay.connect(this.mix);
    this.dry.connect(this.output);
    this.mix.connect(this.output);

    this.inputs.set('stereo', this.input);
    this.outputs.set('stereo', this.output);

    this.controls = { time: 0.25, feedback: 0.3, wet: 0.35 };
    this.apply();
  }

  apply() {
    this.delay.delayTime.value = this.controls.time;
    this.feedback.gain.value = this.controls.feedback;
    this.mix.gain.value = this.controls.wet;
    this.dry.gain.value = 1 - this.controls.wet;
  }
}
