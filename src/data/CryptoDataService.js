const SYMBOL_MAP = {
  BTCUSDT: 'bitcoin',
  ETHUSDT: 'ethereum',
  SOLUSDT: 'solana',
  ADAUSDT: 'cardano',
};

export class CryptoDataService {
  async fetchTicker(symbol = 'BTCUSDT') {
    const normalized = symbol.toUpperCase();
    const coinId = SYMBOL_MAP[normalized] || 'bitcoin';
    const endpoint = `https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(coinId)}&vs_currencies=usd&include_24hr_vol=true`;

    try {
      const response = await fetch(endpoint, { cache: 'no-store' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const json = await response.json();
      const payload = json[coinId];
      if (!payload) throw new Error('Invalid payload');
      return {
        symbol: normalized,
        price: Number(payload.usd),
        volume: Number(payload.usd_24h_vol || 0),
        source: 'live',
      };
    } catch {
      const t = Date.now() / 1000;
      return {
        symbol: normalized,
        price: 30000 + Math.sin(t / 4) * 1200 + Math.sin(t / 17) * 350,
        volume: 2_000_000 + Math.abs(Math.cos(t / 6) * 3_000_000),
        source: 'mock',
      };
    }
  }
}
