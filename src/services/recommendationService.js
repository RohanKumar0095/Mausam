/**
 * MAUSAM Recommendation API Service
 * 
 * Interacts with Python FastAPI Recommendation Service endpoints:
 * - GET /api/recommendations/widgets
 * - POST /api/recommendations/daily-plan
 * 
 * Consumes the user's actual Daily Weather Routine as the SINGLE SOURCE OF TRUTH.
 * Provides graceful fallback to local evaluation if backend API is offline.
 */

import { safeFetch } from './apiClient';
import { evaluateSharedWeatherIntelligence } from '../engine/sharedWeatherIntelligence';

const BACKEND_BASE_URL = import.meta.env.VITE_RECOMMENDATION_API_URL || 'http://localhost:8000';

/**
 * Fetch ranked widget grid from ML Widget Ranker backend service.
 */
export async function fetchWidgetRecommendations({
  userId = 'usr_demo',
  persona = 'sportsperson',
  location = 'Gaya',
  timeOfDay = 'morning',
  weatherData = {}
}) {
  const current = weatherData.current || {};
  const query = new URLSearchParams({
    user_id: userId,
    persona,
    location,
    time_of_day: timeOfDay,
    temp_c: (current.temp ?? 28.5).toString(),
    humidity_pct: (current.humidity ?? 65.0).toString(),
    wind_speed_kmh: (current.windSpeed ?? 10.0).toString(),
    uv_index: (current.uvIndex ?? 5.0).toString(),
    aqi: (current.aqi ?? 45.0).toString(),
    rain_probability: ((current.pop ?? 15) / 100).toString(),
    wbgt_c: (current.wbgt ?? 27.0).toString()
  });

  const url = `${BACKEND_BASE_URL}/api/recommendations/widgets?${query.toString()}`;

  try {
    const data = await safeFetch(url, { timeout: 4000 });
    return data;
  } catch (err) {
    // Fallback default ordering
    return {
      user_id: userId,
      persona,
      is_fallback: true,
      ranked_widgets: [
        { widget_id: 'wbgt_tracker', score: 0.95, reason: 'Persona default priority for thermal stress' },
        { widget_id: 'hydration_guide', score: 0.88, reason: 'Persona default priority for hydration' },
        { widget_id: 'uv_forecast', score: 0.81, reason: 'Persona default priority for UV forecast' },
        { widget_id: 'rain_radar', score: 0.74, reason: 'Persona default priority for precipitation' },
        { widget_id: 'aqi_health', score: 0.67, reason: 'Persona default priority for air quality' }
      ]
    };
  }
}

/**
 * Evaluates the user's ACTUAL Daily Weather Routine activities against live weather data.
 * Consumes SHARED WEATHER INTELLIGENCE to ensure Single Source of Decision Truth.
 */
export async function fetchDailyPlanRecommendations({
  userId = 'usr_demo',
  date = '2026-09-04',
  selectedPersonas = ['daily_life'],
  routine = [],
  athleteProfile = null,
  weatherData = {}
}) {
  // If user has 0 activities in Daily Weather Routine, return empty list immediately
  if (!routine || routine.length === 0) {
    return evaluateSharedWeatherIntelligence({
      userId,
      date,
      selectedPersonas,
      routine: [],
      athleteProfile,
      weatherData
    });
  }

  const current = weatherData.current || {};
  const payload = {
    user_id: userId,
    date,
    selected_personas: selectedPersonas,
    routine_activities: routine,
    athlete_profile: athleteProfile || {
      athlete_id: userId,
      age_group: 'adult',
      experience_level: 'intermediate',
      risk_tolerance: 'balanced',
      sport: routine[0]?.type || 'running'
    },
    weather_data: {
      temp_c: current.temp ?? 28.0,
      humidity_pct: current.humidity ?? 65.0,
      wind_speed_kmh: current.windSpeed ?? 10.0,
      uv_index: current.uvIndex ?? 5.0,
      aqi: current.aqi ?? 45.0,
      rain_probability: (current.pop ?? 15) / 100.0,
      wbgt_c: current.wbgt ?? 27.0,
      visibility_km: current.visibility ?? 8.5,
      condition: current.condition || 'Partly Cloudy'
    }
  };

  const url = `${BACKEND_BASE_URL}/api/recommendations/daily-plan`;

  try {
    const data = await safeFetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      timeout: 4000
    });
    return data;
  } catch (err) {
    // Client-side Fallback Shared Weather Intelligence Engine
    return evaluateSharedWeatherIntelligence({
      userId,
      date,
      selectedPersonas,
      routine,
      athleteProfile,
      weatherData
    });
  }
}

