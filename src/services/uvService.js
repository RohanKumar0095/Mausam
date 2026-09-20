/**
 * MAUSAM UV API Service
 * Fetches real-time UV index and exposure levels for given latitude and longitude.
 * Supports OpenUV and compatible REST UV endpoints.
 * Never leaks or prints API keys.
 */

import { safeFetch } from './apiClient';
import { normalizeUVResponse } from './uvNormalizer';
import { cacheService } from './cacheService';

const UV_API_KEY = import.meta.env.VITE_UV_API_KEY || '';
const UV_API_BASE_URL = import.meta.env.VITE_UV_API_BASE_URL || 'https://api.openuv.io/api/v1';

export const uvService = {
  isConfigured() {
    return Boolean(UV_API_KEY && UV_API_KEY.trim().length > 0 && !UV_API_KEY.includes('your_'));
  },

  async getUVData(latitude, longitude, signal) {
    if (!latitude || !longitude) {
      return { success: false, error: 'MISSING_COORDINATES', message: 'Latitude and longitude are required.' };
    }

    // Check cache
    const cached = cacheService.get('uv', latitude, longitude);
    if (cached) {
      return { success: true, data: cached, fromCache: true };
    }

    if (!this.isConfigured()) {
      return {
        success: false,
        error: 'NOT_CONFIGURED',
        message: 'UV API key not configured in .env'
      };
    }

    try {
      const url = `${UV_API_BASE_URL}/uv?lat=${latitude}&lng=${longitude}`;
      const raw = await safeFetch(url, {
        headers: {
          'x-access-token': UV_API_KEY
        },
        signal
      });

      const normalized = normalizeUVResponse(raw, 'OpenUV');
      cacheService.set('uv', latitude, longitude, normalized);

      return {
        success: true,
        data: normalized
      };
    } catch (err) {
      return {
        success: false,
        error: err.errorType || 'FETCH_ERROR',
        message: 'UV data currently unavailable.'
      };
    }
  }
};
