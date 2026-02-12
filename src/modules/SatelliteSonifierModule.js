import { BaseModule } from './BaseModule.js';
import { SatelliteDataService } from '../data/SatelliteDataService.js';

export class SatelliteSonifierModule extends BaseModule {
  constructor(args) {
    super({ ...args, type: 'satellite', version: 1 });
    const ctx = this.audioContext;
    this.service = new SatelliteDataService();
    this.osc = ctx.createOscillator();
    this.pulse = ctx.createOscillator();
    this.pulseGain = ctx.createGain();
    this.mainGain = ctx.createGain();
    this.panner = ctx.createStereoPanner();
    this.out = ctx.createGain();

    this.osc.type = 'triangle';
    this.pulse.type = 'square';
    this.pulse.frequency.value = 2;
    this.mainGain.gain.value = 0.16;
    this.pulseGain.gain.value = 0.05;

    this.osc.connect(this.mainGain);
    this.pulse.connect(this.pulseGain);
    this.mainGain.connect(this.panner);
    this.pulseGain.connect(this.panner);
    this.panner.connect(this.out);

    this.osc.start();
    this.pulse.start();

    this.outputs.set('stereo', this.out);
    this.controls = {
      noradId: 25544,
      pollSeconds: 3,
      minHz: 120,
      maxHz: 920,
      reversePitch: false,
      smoothing: 0.18,
      mode: 'tone+pulse',
      panByAzimuth: true,
      status: 'idle',
      source: 'mock',
    };

    this.timer = null;
  }

  start() {
    if (this.timer) clearInterval(this.timer);
    const tick = async () => {
      const t = await this.service.fetchTelemetry(this.controls.noradId);
      const altNorm = Math.max(0, Math.min(1, (t.altitudeKm - 150) / 900));
      const pitchNorm = this.controls.reversePitch ? 1 - altNorm : altNorm;
      const hz = this.controls.minHz + pitchNorm * (this.controls.maxHz - this.controls.minHz);
      this.osc.frequency.setTargetAtTime(hz, this.audioContext.currentTime, this.controls.smoothing);

      const speedNorm = Math.max(0, Math.min(1, (t.speedKmh - 5000) / 30000));
      const pulseHz = 0.4 + speedNorm * 8.0;
      this.pulse.frequency.setTargetAtTime(pulseHz, this.audioContext.currentTime, 0.2);

      if (this.controls.mode === 'pulse-only') {
        this.mainGain.gain.value = 0;
        this.pulseGain.gain.value = 0.11;
      } else {
        this.mainGain.gain.value = 0.15;
        this.pulseGain.gain.value = 0.06;
      }

      this.panner.pan.value = this.controls.panByAzimuth ? Math.max(-1, Math.min(1, t.azimuth / 180)) : 0;
      this.updateControl('status', t.source === 'live' ? `${t.name} live` : 'mock fallback');
      this.updateControl('source', t.source);
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
