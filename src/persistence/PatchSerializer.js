import { MODULE_SCHEMAS } from '../modules/BaseModule.js';

export class PatchSerializer {
  static save(modules, connections) {
    return JSON.stringify({
      appVersion: 1,
      modules: modules.map((m) => m.serialize()),
      connections,
      savedAt: new Date().toISOString(),
    }, null, 2);
  }

  static validateModule(modulePatch) {
    const schema = MODULE_SCHEMAS[modulePatch.type];
    if (!schema) return false;
    return schema.backwardCompatible.includes(modulePatch.version ?? 1);
  }

  static parse(text) {
    const json = JSON.parse(text);
    if (!Array.isArray(json.modules) || !Array.isArray(json.connections)) {
      throw new Error('Invalid patch file');
    }
    json.modules = json.modules.filter(PatchSerializer.validateModule);
    return json;
  }
}
