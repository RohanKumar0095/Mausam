import { useState, useEffect, useRef, useCallback } from 'react';
import { locationService } from '../services/locationService';

/**
 * Custom React hook for debounced location autocomplete search and GPS position detection.
 */
export function useLocationSearch(debounceMs = 300) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isDetectingGps, setIsDetectingGps] = useState(false);
  const [error, setError] = useState(null);
  const [noResults, setNoResults] = useState(false);

  const abortControllerRef = useRef(null);
  const debounceTimerRef = useRef(null);

  // Debounced search trigger
  useEffect(() => {
    // Clear previous timer & pending requests
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    if (!query || query.trim().length < 2) {
      setSuggestions([]);
      setIsSearching(false);
      setNoResults(false);
      setError(null);
      return;
    }

    setIsSearching(true);
    setError(null);
    setNoResults(false);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    debounceTimerRef.current = setTimeout(async () => {
      const res = await locationService.searchLocations(query, controller.signal);
      
      if (res.isCancelled) return;

      setIsSearching(false);

      if (res.success) {
        setSuggestions(res.suggestions || []);
        if (res.suggestions && res.suggestions.length === 0) {
          setNoResults(true);
        } else {
          setNoResults(false);
        }
      } else {
        setError(res.message);
        setSuggestions([]);
      }
    }, debounceMs);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [query, debounceMs]);

  // GPS Current Location Detector
  const detectGPS = useCallback(async () => {
    setIsDetectingGps(true);
    setError(null);

    const res = await locationService.getCurrentPosition();
    setIsDetectingGps(false);

    if (res.success) {
      return {
        success: true,
        hierarchy: res.hierarchy,
        latitude: res.latitude,
        longitude: res.longitude
      };
    } else {
      setError(res.message);
      return {
        success: false,
        error: res.error,
        message: res.message,
        messageHi: res.messageHi
      };
    }
  }, []);

  const clearSearch = useCallback(() => {
    setQuery('');
    setSuggestions([]);
    setIsSearching(false);
    setNoResults(false);
    setError(null);
  }, []);

  return {
    query,
    setQuery,
    suggestions,
    isSearching,
    isDetectingGps,
    error,
    noResults,
    detectGPS,
    clearSearch
  };
}
