import { BaseModule } from './BaseModule.js';

export class EQModule extends BaseModule {
  constructor(args) {
    super({ ...args, type: 'eq', version: 1 });
    const ctx = this.audioContext;
    this.input = ctx.createGain();
    this.low = ctx.createBiquadFilter();
    this.mid = ctx.createBiquadFilter();
    this.high = ctx.createBiquadFilter();
    this.output = ctx.createGain();

    this.low.type = 'lowshelf';
    this.low.frequency.value = 200;
    this.mid.type = 'peaking';
    this.mid.frequency.value = 1200;
    this.mid.Q.value = 0.9;
    this.high.type = 'highshelf';
    this.high.frequency.value = 4500;

    this.input.connect(this.low);
    this.low.connect(this.mid);
    this.mid.connect(this.high);
    this.high.connect(this.output);

    this.inputs.set('stereo', this.input);
    this.outputs.set('stereo', this.output);

    this.controls = { low: 0, mid: 0, high: 0 };
    this.apply();
  }

  apply() {
    this.low.gain.value = this.controls.low;
    this.mid.gain.value = this.controls.mid;
    this.high.gain.value = this.controls.high;
  }
}
