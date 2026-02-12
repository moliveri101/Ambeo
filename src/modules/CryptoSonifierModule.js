import { BaseModule } from './BaseModule.js';
import { CryptoDataService } from '../data/CryptoDataService.js';

const MAJOR = [0, 2, 4, 5, 7, 9, 11];

function quantizeToMajor(freq) {
  const midi = 69 + 12 * Math.log2(freq / 440);
  const octave = Math.floor(midi / 12);
  const note = ((Math.round(midi) % 12) + 12) % 12;
  const closest = MAJOR.reduce((a, b) => Math.abs(b - note) < Math.abs(a - note) ? b : a, MAJOR[0]);
  return 440 * Math.pow(2, ((octave * 12 + closest) - 69) / 12);
}

export class CryptoSonifierModule extends BaseModule {
  constructor(args) {
    super({ ...args, type: 'crypto', version: 1 });
    const ctx = this.audioContext;
    this.service = new CryptoDataService();
    this.osc = ctx.createOscillator();
    this.gain = ctx.createGain();
    this.pulse = ctx.createGain();
    this.pulse.gain.value = 0;
    this.osc.type = 'sine';
    this.osc.frequency.value = 220;
    this.gain.gain.value = 0.18;
    this.osc.connect(this.gain);
    this.gain.connect(this.pulse);
    this.osc.start();

    this.outputs.set('stereo', this.pulse);
    this.controls = {
      symbol: 'BTCUSDT',
      pollSeconds: 2,
      basePitch: 220,
      scale: 0.007,
      smoothing: 0.15,
      minHz: 90,
      maxHz: 1200,
      quantize: true,
      volumeScale: 0.0005,
      threshold: 1.2,
      status: 'idle',
      source: 'mock',
    };

    this.lastPrice = null;
    this.timer = null;
  }

  start() {
    if (this.timer) clearInterval(this.timer);
    const tick = async () => {
      const data = await this.service.fetchTicker(this.controls.symbol);
      const priceDelta = this.lastPrice === null ? 0 : data.price - this.lastPrice;
      this.lastPrice = data.price;

      let nextHz = this.controls.basePitch + priceDelta * this.controls.scale;
      nextHz = Math.max(this.controls.minHz, Math.min(this.controls.maxHz, nextHz));
      if (this.controls.quantize) nextHz = quantizeToMajor(nextHz);
      this.osc.frequency.setTargetAtTime(nextHz, this.audioContext.currentTime, this.controls.smoothing);

      const amp = Math.max(0.03, Math.min(0.8, data.volume * this.controls.volumeScale));
      this.gain.gain.setTargetAtTime(amp, this.audioContext.currentTime, 0.2);
      this.pulse.gain.value = Math.abs(priceDelta) > this.controls.threshold ? amp : amp * 0.75;

      this.updateControl('status', data.source === 'live' ? 'live feed' : 'mock fallback');
      this.updateControl('source', data.source);
    };

    tick();
    this.timer = setInterval(tick, this.controls.pollSeconds * 1000);
  }

  stop() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  dispose() {
    this.stop();
    super.dispose();
  }
}
