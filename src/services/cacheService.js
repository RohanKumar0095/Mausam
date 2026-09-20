/**
 * MAUSAM Client-Side In-Memory & Local Storage Cache
 * Caches normalized weather and UV responses by latitude and longitude.
 * Configurable TTL (default 10 minutes).
 */

const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

class CacheService {
  constructor() {
    this.memoryCache = new Map();
  }

  generateKey(prefix, lat, lon) {
    const latFixed = Number(lat).toFixed(3);
    const lonFixed = Number(lon).toFixed(3);
    return `${prefix}:${latFixed}:${lonFixed}`;
  }

  get(prefix, lat, lon) {
    if (!lat || !lon) return null;
    const key = this.generateKey(prefix, lat, lon);
    const entry = this.memoryCache.get(key);

    if (!entry) return null;

    if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
      this.memoryCache.delete(key);
      return null;
    }

    return entry.data;
  }

  set(prefix, lat, lon, data) {
    if (!lat || !lon || !data) return;
    const key = this.generateKey(prefix, lat, lon);
    this.memoryCache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  clear() {
    this.memoryCache.clear();
  }
}

export const cacheService = new CacheService();
