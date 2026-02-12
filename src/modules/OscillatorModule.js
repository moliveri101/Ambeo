import { BaseModule } from './BaseModule.js';

export class OscillatorModule extends BaseModule {
  constructor(args) {
    super({ ...args, type: 'oscillator', version: 1 });
    const ctx = this.audioContext;
    this.osc = ctx.createOscillator();
    this.amp = ctx.createGain();
    this.amp.gain.value = 0.2;
    this.osc.type = 'sawtooth';
    this.osc.frequency.value = 220;
    this.osc.connect(this.amp);
    this.osc.start();

    this.outputs.set('stereo', this.amp);
    this.controls = { wave: 'sawtooth', frequency: 220, gain: 0.2, attack: 0.01, release: 0.2 };
  }

  setWave(wave) {
    this.osc.type = wave;
    this.updateControl('wave', wave);
  }

  setFrequency(freq) {
    this.osc.frequency.setTargetAtTime(freq, this.audioContext.currentTime, 0.03);
    this.updateControl('frequency', freq);
  }

  setGain(g) {
    this.amp.gain.setTargetAtTime(g, this.audioContext.currentTime, 0.03);
    this.updateControl('gain', g);
  }
}
