export class AudioEngine {
  constructor() {
    this.context = null;
    this.masterIn = null;
    this.masterOut = null;
    this.analyser = null;
    this.limiter = null;
  }

  async init() {
    this.context = new AudioContext({ latencyHint: 'interactive' });
    this.masterIn = this.context.createGain();
    this.masterOut = this.context.createGain();
    this.analyser = this.context.createAnalyser();
    this.limiter = this.context.createDynamicsCompressor();

    this.limiter.threshold.value = -2;
    this.limiter.knee.value = 2;
    this.limiter.ratio.value = 18;
    this.limiter.attack.value = 0.003;
    this.limiter.release.value = 0.12;

    this.masterIn.connect(this.limiter);
    this.limiter.connect(this.masterOut);
    this.masterOut.connect(this.analyser);
    this.analyser.connect(this.context.destination);

    return this.context;
  }

  getMeterDb() {
    if (!this.analyser) return -Infinity;
    const data = new Uint8Array(this.analyser.fftSize);
    this.analyser.getByteTimeDomainData(data);
    let sum = 0;
    for (let i = 0; i < data.length; i += 1) {
      const centered = (data[i] - 128) / 128;
      sum += centered * centered;
    }
    const rms = Math.sqrt(sum / data.length);
    return 20 * Math.log10(Math.max(rms, 0.00001));
  }
}
