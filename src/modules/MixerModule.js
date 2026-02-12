import { BaseModule } from './BaseModule.js';

export class MixerModule extends BaseModule {
  constructor(args) {
    super({ ...args, type: 'mixer', version: 1 });
    const ctx = this.audioContext;
    this.trackCount = 4;
    this.inputBus = ctx.createGain();
    this.gainNode = ctx.createGain();
    this.panNode = ctx.createStereoPanner();
    this.output = ctx.createGain();
    this.mute = false;
    this.solo = false;

    this.inputBus.connect(this.gainNode);
    this.gainNode.connect(this.panNode);
    this.panNode.connect(this.output);

    this.inputs.set('stereo', this.inputBus);
    this.outputs.set('stereo', this.output);

    this.controls = {
      trackCount: 4,
      gain: 0.9,
      pan: 0,
      mute: false,
      solo: false,
      sends: [{ enabled: true, amount: 0.2 }],
    };
  }

  setTrackCount(count) {
    this.trackCount = count;
    this.updateControl('trackCount', count);
  }

  setGain(v) {
    this.gainNode.gain.value = this.controls.mute ? 0 : v;
    this.updateControl('gain', v);
  }

  setPan(v) {
    this.panNode.pan.value = v;
    this.updateControl('pan', v);
  }

  setMute(m) {
    this.updateControl('mute', m);
    this.gainNode.gain.value = m ? 0 : this.controls.gain;
  }
}
