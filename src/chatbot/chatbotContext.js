/**
 * MAUSAM Assistant Context Builder
 * 
 * Aggregates existing normalized weather state, user profiles, location coordinates,
 * daily routine, WBGT thermal metrics, and safety hierarchy into a structured, unified
 * assistant context.
 */

import { calculateEstimatedWBGT } from '../services/wbgtService.js';
import { timeContextService } from '../services/timeContextService.js';

export function buildChatbotContext({
  user = {},
  language = 'en',
  selectedPersonas = ['daily_life'],
  currentLocation = {},
  currentTime = null,
  currentActivity = null,
  routine = [],
  savedLocations = [],
  weatherData = {},
  safetyInfo = {},
  activeAlerts = [],
  isWeatherError = false
}) {
  const current = weatherData?.current || {};
  const isLive = Boolean(weatherData?.metadata?.isLive);

  // Authoritative real device time context
  const liveTimeCtx = timeContextService.getCurrentContext();
  const activeCurrentTime = currentTime || liveTimeCtx.time12h;

  // Derive sport type from routine, location, or personas
  let detectedSport = 'football';
  const hasCricket = routine.some(r => (r.label || '').toLowerCase().includes('cricket')) || (currentLocation?.name || '').toLowerCase().includes('cricket');
  const hasCycling = routine.some(r => (r.label || '').toLowerCase().includes('cycling')) || (currentLocation?.name || '').toLowerCase().includes('cycling');
  const hasRunning = routine.some(r => (r.label || '').toLowerCase().includes('running') || (r.type === 'running'));
  
  if (hasCricket) detectedSport = 'cricket';
  else if (hasCycling) detectedSport = 'cycling';
  else if (hasRunning) detectedSport = 'running';

  // Calculate WBGT
  const wbgt = calculateEstimatedWBGT({
    temperature: current.temp,
    humidity: current.humidity,
    windSpeed: current.windSpeed,
    uvIndex: current.uvIndex
  });

  return {
    userProfile: {
      userId: user?.userId || 'guest_user',
      contact: user?.emailOrPhone || '',
      language
    },
    language,
    selectedPersonas,
    isSportsperson: selectedPersonas.includes('sportsperson'),
    sport: detectedSport,
    
    // Geographical & Location Context
    selectedLocation: {
      id: currentLocation?.id || weatherData?.id || 'loc-default',
      name: currentLocation?.name || weatherData?.name || 'Selected Ground',
      district: currentLocation?.district || weatherData?.district || 'District',
      state: currentLocation?.state || weatherData?.state || 'India',
      latitude: currentLocation?.latitude ?? weatherData?.latitude ?? 24.7955,
      longitude: currentLocation?.longitude ?? weatherData?.longitude ?? 85.0002,
      purpose: currentLocation?.purpose || weatherData?.purpose || 'Sports Ground',
      purposes: currentLocation?.purposes || weatherData?.purposes || ['Sports']
    },

    // Temporal & Routine Context
    currentTime: activeCurrentTime,
    currentDate: liveTimeCtx.formattedDate,
    isoTimestamp: liveTimeCtx.iso,
    timezone: liveTimeCtx.timezone,
    currentActivity: currentActivity || {
      id: 'act-current',
      label: 'Evening Training Session',
      type: 'sports',
      startTime: '17:00',
      endTime: '19:30',
      location: currentLocation?.name || 'Main Stadium Turf'
    },
    routine: routine && routine.length > 0 ? routine : [],
    savedLocations,

    // Normalized Weather Context
    weather: {
      isLive,
      isError: isWeatherError,
      temp: current.temp ?? null,
      feelsLike: current.feelsLike ?? current.temp ?? null,
      humidity: current.humidity ?? null,
      windSpeed: current.windSpeed ?? null,
      windDirection: current.windDirection || 'SSW',
      windDegree: current.windDegree ?? null,
      rainProbability: current.rainProbability ?? null,
      rainfall24h: current.rainfall24h ?? null,
      condition: current.condition || 'Clear',
      conditionCode: current.conditionCode || 'clear',
      uvIndex: current.uvIndex ?? null,
      aqi: current.aqi ?? null,
      aqiStatus: current.aqiStatus || 'Satisfactory',
      visibility: current.visibility ?? null,
      wbgt
    },

    // Forecast Arrays
    forecast: weatherData?.forecast3Hourly || [],
    dailyForecast: weatherData?.dailyForecast || [],

    // Alerts & Safety Override Context
    activeAlerts: activeAlerts || [],
    alerts: weatherData?.warning || { level: 'GREEN', headline: 'NORMAL CONDITIONS' },
    safetyInfo: {
      isSevere: Boolean(safetyInfo?.isSevere),
      severityLevel: safetyInfo?.severityLevel || weatherData?.warning?.level || 'GREEN',
      headline: safetyInfo?.headline || weatherData?.warning?.headline || 'NORMAL CONDITIONS',
      description: safetyInfo?.description || weatherData?.warning?.description || '',
      actionAdvice: safetyInfo?.actionAdvice || ''
    }
  };
}
