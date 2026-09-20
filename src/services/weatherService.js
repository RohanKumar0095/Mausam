/**
 * MAUSAM Weather API Service
 * Fetches current weather, 3-hourly forecast, 7-day outlook, and air quality
 * for given latitude and longitude.
 * Supports WeatherAPI.com, OpenWeatherMap, or standard REST weather endpoints.
 * Never leaks or prints API keys.
 */

import { safeFetch } from './apiClient';
import { normalizeWeatherResponse } from './weatherNormalizer';
import { uvService } from './uvService';
import { cacheService } from './cacheService';

const WEATHER_API_KEY = import.meta.env.VITE_WEATHER_API_KEY || '';
const WEATHER_API_BASE_URL = import.meta.env.VITE_WEATHER_API_BASE_URL || 'https://api.openweathermap.org/data/2.5';

export const weatherService = {
  isConfigured() {
    return Boolean(WEATHER_API_KEY && WEATHER_API_KEY.trim().length > 0 && !WEATHER_API_KEY.includes('your_'));
  },

  async getWeatherData(locationMeta = {}, options = {}) {
    const { latitude, longitude } = locationMeta;
    const { signal, forceRefresh = false } = options;

    if (latitude == null || longitude == null) {
      return {
        success: false,
        error: 'MISSING_COORDINATES',
        message: 'Coordinates are required for live weather data. Please provide a location with latitude and longitude.'
      };
    }

    // Check Cache unless forceRefresh is true
    if (!forceRefresh) {
      const cached = cacheService.get('weather', latitude, longitude);
      if (cached) {
        return {
          success: true,
          data: { ...cached, id: locationMeta.id || cached.id, name: locationMeta.name || cached.name, purpose: locationMeta.purpose || cached.purpose },
          fromCache: true
        };
      }
    }

    if (!this.isConfigured()) {
      return {
        success: false,
        error: 'NOT_CONFIGURED',
        message: 'Weather API is not configured. Please add VITE_WEATHER_API_KEY in .env.'
      };
    }

    try {
      const isWeatherApiCom = WEATHER_API_BASE_URL.includes('weatherapi.com');
      let combinedPayload = null;
      let uvData = null;

      if (isWeatherApiCom) {
        // WeatherAPI.com format
        const url = `${WEATHER_API_BASE_URL}/forecast.json?key=${encodeURIComponent(WEATHER_API_KEY)}&q=${latitude},${longitude}&days=7&aqi=yes&alerts=yes`;
        const [weatherRes, uvRes] = await Promise.allSettled([
          safeFetch(url, { signal }),
          uvService.getUVData(latitude, longitude, signal)
        ]);

        if (weatherRes.status === 'rejected') {
          throw weatherRes.reason;
        }

        combinedPayload = weatherRes.value;
        uvData = uvRes.status === 'fulfilled' && uvRes.value?.success ? uvRes.value.data : null;
      } else {
        // OpenWeatherMap format (default standard REST)
        const weatherUrl = `${WEATHER_API_BASE_URL}/weather?lat=${latitude}&lon=${longitude}&appid=${encodeURIComponent(WEATHER_API_KEY)}&units=metric`;
        const forecastUrl = `${WEATHER_API_BASE_URL}/forecast?lat=${latitude}&lon=${longitude}&appid=${encodeURIComponent(WEATHER_API_KEY)}&units=metric`;
        const aqiUrl = `${WEATHER_API_BASE_URL}/air_pollution?lat=${latitude}&lon=${longitude}&appid=${encodeURIComponent(WEATHER_API_KEY)}`;

        const [weatherRes, forecastRes, aqiRes, uvRes] = await Promise.allSettled([
          safeFetch(weatherUrl, { signal }),
          safeFetch(forecastUrl, { signal }),
          safeFetch(aqiUrl, { signal }),
          uvService.getUVData(latitude, longitude, signal)
        ]);

        if (weatherRes.status === 'rejected') {
          throw weatherRes.reason;
        }

        const currentWeather = weatherRes.value || {};
        const forecastData = forecastRes.status === 'fulfilled' ? forecastRes.value : null;
        const aqiData = aqiRes.status === 'fulfilled' ? aqiRes.value : null;
        uvData = uvRes.status === 'fulfilled' && uvRes.value?.success ? uvRes.value.data : null;

        combinedPayload = {
          ...currentWeather,
          forecast: forecastData,
          air_pollution: aqiData
        };
      }

      // Normalize into standard MAUSAM weather model
      const normalized = normalizeWeatherResponse(combinedPayload, locationMeta, uvData);

      // Cache normalized result
      cacheService.set('weather', latitude, longitude, normalized);

      return {
        success: true,
        data: normalized,
        isUVLive: Boolean(uvData)
      };
    } catch (err) {
      return {
        success: false,
        error: err.errorType || 'FETCH_ERROR',
        status: err.status,
        message: err.message || 'Weather data is currently unavailable.'
      };
    }
  }
};
