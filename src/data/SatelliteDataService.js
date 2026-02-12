export class SatelliteDataService {
  async fetchTelemetry(noradId = 25544) {
    const endpoint = `https://api.wheretheiss.at/v1/satellites/${encodeURIComponent(noradId)}`;
    try {
      const response = await fetch(endpoint, { cache: 'no-store' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const json = await response.json();
      return {
        noradId,
        name: json.name || 'Satellite',
        altitudeKm: Number(json.altitude),
        speedKmh: Number(json.velocity),
        azimuth: Number(json.longitude || 0),
        source: 'live',
      };
    } catch {
      const t = Date.now() / 1000;
      return {
        noradId,
        name: 'MockSat',
        altitudeKm: 420 + Math.sin(t / 20) * 35,
        speedKmh: 27000 + Math.cos(t / 18) * 500,
        azimuth: Math.sin(t / 9) * 180,
        source: 'mock',
      };
    }
  }
}
