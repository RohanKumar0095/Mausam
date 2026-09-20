/**
 * MAUSAM React Hook for Live Weather Data Management
 * Handles asynchronous data fetching, loading, errors, cancellation, caching, and manual refresh.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { weatherService } from '../services/weatherService';
import { createSafeWeatherSkeleton } from '../services/weatherNormalizer';

export function useWeatherData(locationMeta) {
  const [weatherData, setWeatherData] = useState(() => createSafeWeatherSkeleton(locationMeta));
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [errorInfo, setErrorInfo] = useState(null);
  const [isUVLive, setIsUVLive] = useState(false);

  const abortControllerRef = useRef(null);

  const fetchWeather = useCallback(async (forceRefresh = false) => {
    if (!locationMeta) {
      setIsLoading(false);
      return;
    }

    // Abort previous in-flight request if user rapidly changed location
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoading(true);
    setIsError(false);
    setErrorInfo(null);

    try {
      const res = await weatherService.getWeatherData(locationMeta, {
        signal: controller.signal,
        forceRefresh
      });

      if (res.success && res.data) {
        setWeatherData(res.data);
        setIsUVLive(Boolean(res.isUVLive));
        setIsError(false);
        setErrorInfo(null);
      } else {
        setIsError(true);
        setErrorInfo({
          error: res.error,
          status: res.status,
          message: res.message
        });
        setWeatherData(prev => prev || createSafeWeatherSkeleton(locationMeta));
      }
    } catch (err) {
      if (err.name !== 'AbortError' && err.errorType !== 'TIMEOUT_OR_CANCEL') {
        setIsError(true);
        setErrorInfo({
          error: err.errorType || 'UNKNOWN_ERROR',
          status: err.status,
          message: err.message || 'Weather data is currently unavailable.'
        });
        setWeatherData(prev => prev || createSafeWeatherSkeleton(locationMeta));
      }
    } finally {
      setIsLoading(false);
    }
  }, [locationMeta?.id, locationMeta?.latitude, locationMeta?.longitude]);

  useEffect(() => {
    fetchWeather(false);

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchWeather]);

  const refresh = useCallback(() => {
    return fetchWeather(true);
  }, [fetchWeather]);

  return {
    weatherData,
    isLoading,
    isError,
    errorInfo,
    isUVLive,
    refresh
  };
}
