export class BaseModule {
  constructor({ id, type, version = 1, position = { x: 40, y: 40 }, audioContext }) {
    this.id = id;
    this.type = type;
    this.version = version;
    this.position = position;
    this.audioContext = audioContext;
    this.inputs = new Map();
    this.outputs = new Map();
    this.controls = {};
  }

  connectOutput(name, destination) {
    const output = this.outputs.get(name);
    if (!output) return;
    output.connect(destination);
  }

  disconnectOutput(name) {
    const output = this.outputs.get(name);
    if (!output) return;
    output.disconnect();
  }

  serialize() {
    return {
      id: this.id,
      type: this.type,
      version: this.version,
      position: this.position,
      controls: this.controls,
    };
  }

  updateControl(name, value) {
    this.controls[name] = value;
  }

  dispose() {
    this.outputs.forEach((node) => node.disconnect());
    this.inputs.clear();
    this.outputs.clear();
  }
}

export const MODULE_SCHEMAS = {
  oscillator: { currentVersion: 1, backwardCompatible: [1] },
  mixer: { currentVersion: 1, backwardCompatible: [1] },
  reverb: { currentVersion: 1, backwardCompatible: [1] },
  crypto: { currentVersion: 1, backwardCompatible: [1] },
  satellite: { currentVersion: 1, backwardCompatible: [1] },
  compressor: { currentVersion: 1, backwardCompatible: [1] },
  delay: { currentVersion: 1, backwardCompatible: [1] },
  distortion: { currentVersion: 1, backwardCompatible: [1] },
  eq: { currentVersion: 1, backwardCompatible: [1] },
};
