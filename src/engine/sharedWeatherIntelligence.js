/**
 * MAUSAM Shared Weather Intelligence Engine (Client-Side Fallback Engine)
 * 
 * Single Source of Decision Truth for Primary Decision Intelligence (PDI),
 * Today's Activity Plan, and Persona Prioritized Widgets.
 * 
 * Generates Structured Intelligence Signals that drive all decisions and UI cards.
 * Includes Time-Aware Next Occurrence Resolution and Exact Weather Window Forecast Analysis.
 */

import { getContextRelevance, validateSignalApplicability, getAllowedFactors, filterSignalsByAllowedFactors } from './contextRelevanceEngine';

export const HIERARCHY = {
  SAFETY: 1,      // Thunderstorm, Extreme WBGT (≥32.2°C), Severe AQI (>200)
  DISRUPTION: 2,  // Heavy Rain (≥60%), Strong Wind (≥25km/h), Elevated WBGT (≥29°C)
  PERFORMANCE: 3, // Moderate Heat (>30°C), Passing Showers (35-60%), Dew
  COMFORT: 4      // High Humidity (>80%), High UV (>6), Mild Temp
};

export const PERSONA_SIGNAL_WEIGHTS = {
  sportsperson: {
    wbgt_safety: 0.95,
    lightning_storm_safety: 1.0,
    dew_factor: 0.70,
    ground_condition: 0.65,
    rain_probability: 0.85,
    training_window: 0.90,
    running_window: 0.85,
    wind_gauge: 0.60
  },
  fitness: {
    exercise_comfort_index: 0.90,
    outdoor_exercise_aqi: 0.85,
    wbgt_safety: 0.80,
    uv_heat_index: 0.75,
    running_window: 0.85,
    workout_recommendation: 0.80,
    rain_probability: 0.70
  },
  health_conscious: {
    aqi_health: 0.95,
    uv_heat_index: 0.90,
    humidity_health_impact: 0.80,
    current_conditions: 0.75,
    relative_environmental_context: 0.70,
    rain_probability: 0.65
  },
  commuter: {
    commute_weather: 0.95,
    morning_commute_conditions: 0.90,
    return_commute_conditions: 0.90,
    two_wheeler_risk: 0.85,
    visibility_fog: 0.90,
    rain_probability: 0.90,
    lightning_storm_safety: 1.0
  },
  parent: {
    school_transit: 0.95,
    school_pickup_weather: 0.90,
    child_safety_recommendations: 0.95,
    family_weather_alerts: 0.90,
    aqi_health: 0.85,
    rain_probability: 0.80
  },
  event_planner: {
    outdoor_event_suitability: 0.95,
    event_forecast_timeline: 0.90,
    event_comfort_index: 0.80,
    event_wind_conditions: 0.85,
    event_contingency_backup: 0.90,
    rain_probability: 0.90,
    wind_gauge: 0.85
  },
  agriculture: {
    agri_action_checklist: 0.95,
    crop_stage_risk: 0.90,
    multi_day_rainfall: 0.90,
    irrigation_nudge: 0.85,
    frost_heat_alert: 0.95,
    pest_disease_risk: 0.85
  },
  traveler: {
    travel_conditions: 0.95,
    saved_destination_weather: 0.85,
    travel_disruption_alerts: 0.90,
    smart_packing_checklist: 0.75,
    today_forecast: 0.80,
    rain_probability: 0.85
  },
  daily_life: {
    current_conditions: 0.70,
    today_forecast: 0.80,
    rain_probability: 0.80,
    aqi_health: 0.75,
    uv_heat_index: 0.70,
    wbgt_safety: 0.65
  }
};

export function calculateWBGT(tempC, humidityPct) {
  if (tempC == null || humidityPct == null) return 27.0;
  try {
    const vaporPressure = (humidityPct / 100.0) * 6.105 * Math.exp((17.27 * tempC) / (tempC + 237.7));
    const wbgt = Math.round((0.567 * tempC + 0.393 * vaporPressure + 3.94) * 10) / 10;
    return Math.min(34.5, wbgt);
  } catch (e) {
    return 27.0;
  }
}

export function parseActiveDays(rawDays) {
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayAbbrs = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

  if (!rawDays) return [0, 1, 2, 3, 4, 5, 6];

  if (typeof rawDays === 'string') {
    const s = rawDays.toLowerCase().trim();
    if (s === 'daily' || s === 'all' || s === 'everyday') return [0, 1, 2, 3, 4, 5, 6];
    rawDays = s.split(/[\s,]+/);
  }

  if (Array.isArray(rawDays)) {
    const set = new Set();
    rawDays.forEach(item => {
      if (typeof item === 'number') {
        set.add(item % 7);
      } else if (typeof item === 'string') {
        const s = item.toLowerCase().trim();
        if (s === 'daily' || s === 'all' || s === 'everyday') {
          return [0, 1, 2, 3, 4, 5, 6];
        }
        const nameIdx = dayNames.indexOf(s);
        if (nameIdx !== -1) set.add(nameIdx);
        else {
          const abbrIdx = dayAbbrs.indexOf(s);
          if (abbrIdx !== -1) set.add(abbrIdx);
        }
      }
    });
    return set.size > 0 ? Array.from(set).sort((a, b) => a - b) : [0, 1, 2, 3, 4, 5, 6];
  }

  return [0, 1, 2, 3, 4, 5, 6];
}

export function resolveNextActivityOccurrence(activity, currentDateTime = new Date(), userTimezone = null) {
  const now = currentDateTime instanceof Date ? currentDateTime : new Date(currentDateTime);

  const startTimeStr = activity.startTime || activity.start_time || '07:00';
  const endTimeStr = activity.endTime || activity.end_time || '08:00';

  const [startH, startM] = startTimeStr.split(':').map(Number);
  const [endH, endM] = endTimeStr.split(':').map(Number);

  const startMin = (startH || 7) * 60 + (startM || 0);
  const endMin = (endH || 8) * 60 + (endM || 0);
  const currMin = now.getHours() * 60 + now.getMinutes();

  const rawDays = activity.days || activity.activeDays || activity.daysOfWeek || activity.recurrence;
  const activeDays = parseActiveDays(rawDays);

  for (let offset = 0; offset <= 7; offset++) {
    const candidate = new Date(now);
    candidate.setDate(now.getDate() + offset);

    const candidateDayOfWeek = candidate.getDay(); // 0 = Sunday, 1 = Monday ... 6 = Saturday

    if (!activeDays.includes(candidateDayOfWeek)) {
      continue;
    }

    const year = candidate.getFullYear();
    const month = String(candidate.getMonth() + 1).padStart(2, '0');
    const day = String(candidate.getDate()).padStart(2, '0');
    const candidateDateStr = `${year}-${month}-${day}`;

    if (offset === 0) {
      if (currMin < endMin) {
        const isActive = currMin >= startMin;
        const status = isActive ? 'active' : 'upcoming';
        const displayLabel = isActive ? 'Currently Active' : 'Today';

        return {
          occurrence_date: candidateDateStr,
          start_datetime: `${candidateDateStr}T${String(startH).padStart(2, '0')}:${String(startM).padStart(2, '0')}:00`,
          end_datetime: `${candidateDateStr}T${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}:00`,
          occurrence_status: status,
          display_label: displayLabel,
          day_offset: 0,
          is_today: true,
          is_tomorrow: false,
          is_active: isActive,
          formatted_date: displayLabel
        };
      }
    } else {
      const isTomorrow = offset === 1;
      const daysOfWeekNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const formattedDate = `${daysOfWeekNames[candidateDayOfWeek]}, ${monthNames[candidate.getMonth()]} ${candidate.getDate()}`;
      const displayLabel = isTomorrow ? 'Tomorrow' : formattedDate;

      return {
        occurrence_date: candidateDateStr,
        start_datetime: `${candidateDateStr}T${String(startH).padStart(2, '0')}:${String(startM).padStart(2, '0')}:00`,
        end_datetime: `${candidateDateStr}T${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}:00`,
        occurrence_status: 'upcoming',
        display_label: displayLabel,
        day_offset: offset,
        is_today: false,
        is_tomorrow: isTomorrow,
        is_active: false,
        formatted_date: displayLabel
      };
    }
  }

  const tom = new Date(now);
  tom.setDate(now.getDate() + 1);
  const year = tom.getFullYear();
  const month = String(tom.getMonth() + 1).padStart(2, '0');
  const day = String(tom.getDate()).padStart(2, '0');
  const tomStr = `${year}-${month}-${day}`;

  return {
    occurrence_date: tomStr,
    start_datetime: `${tomStr}T${String(startH).padStart(2, '0')}:${String(startM).padStart(2, '0')}:00`,
    end_datetime: `${tomStr}T${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}:00`,
    occurrence_status: 'upcoming',
    display_label: 'Tomorrow',
    day_offset: 1,
    is_today: false,
    is_tomorrow: true,
    is_active: false,
    formatted_date: 'Tomorrow'
  };
}

export function getActivityWeatherWindow({
  weatherData = {},
  occurrenceDate = '',
  startTime = '07:00',
  endTime = '08:00',
  locationStr = 'Selected Location',
  occurrenceStatus = 'upcoming'
}) {
  const current = weatherData.current || {};

  if (occurrenceStatus === 'active') {
    const temp = current.temp ?? current.temp_c ?? 28.0;
    const humidity = current.humidity ?? current.humidity_pct ?? 65.0;
    const wind = current.windSpeed ?? current.wind_speed_kmh ?? 10.0;
    let pop = current.pop ?? current.rain_probability ?? 15;
    if (pop > 1.0) pop = pop / 100.0;
    const uv = current.uvIndex ?? current.uv_index ?? 4.0;
    const aqi = current.aqi ?? 45.0;
    const vis = current.visibility ?? current.visibility_km ?? 8.5;
    const wbgt = current.wbgt ?? current.wbgt_c ?? calculateWBGT(temp, humidity);

    return {
      is_available: true,
      data_type: 'active_live',
      analyzed_context: {
        date: occurrenceDate,
        time_window: `${startTime} – ${endTime}`,
        location: locationStr,
        data_type: 'active_live'
      },
      weather_snapshot: {
        temp_c: Math.round(temp * 10) / 10,
        humidity_pct: Math.round(humidity * 10) / 10,
        wind_speed_kmh: Math.round(wind * 10) / 10,
        rain_probability: Math.round(pop <= 1.0 ? pop * 100 : pop),
        rain_probability_frac: pop <= 1.0 ? pop : pop / 100.0,
        uv_index: Math.round(uv * 10) / 10,
        aqi,
        visibility_km: vis,
        wbgt_c: Math.round(wbgt * 10) / 10
      }
    };
  }

  const startH = parseInt(startTime.split(':')[0], 10) || 7;
  let endH = parseInt(endTime.split(':')[0], 10) || 8;
  if (endH <= startH) endH = startH + 1;

  const hourlyEntries = weatherData.forecast3Hourly || weatherData.hourlyForecast || weatherData.hourly || weatherData.list || [];

  const matchingSlots = hourlyEntries.filter(entry => {
    const entryDate = entry.date || (entry.dt_txt ? entry.dt_txt.split(' ')[0] : null);
    const timeStr = entry.time || (entry.dt_txt ? entry.dt_txt.split(' ')[1] : '12:00');
    const entryH = parseInt(timeStr.split(':')[0], 10) || 12;

    const dateMatch = !entryDate || entryDate === occurrenceDate;
    return dateMatch && (entryH >= startH - 1 && entryH <= endH + 1);
  });

  if (matchingSlots.length > 0) {
    const temps = matchingSlots.map(s => s.temp ?? s.temp_c).filter(v => v != null);
    const hums = matchingSlots.map(s => s.humidity ?? s.humidity_pct).filter(v => v != null);
    const pops = matchingSlots.map(s => s.pop ?? s.rain_probability).filter(v => v != null);
    const winds = matchingSlots.map(s => s.windSpeed ?? s.wind_speed_kmh).filter(v => v != null);
    const uvs = matchingSlots.map(s => s.uvIndex ?? s.uv_index).filter(v => v != null);

    const meanTemp = temps.length > 0 ? temps.reduce((a, b) => a + b, 0) / temps.length : 28.0;
    const meanHum = hums.length > 0 ? hums.reduce((a, b) => a + b, 0) / hums.length : 65.0;
    let maxPop = pops.length > 0 ? Math.max(...pops) : 15;
    if (maxPop > 1.0) maxPop = maxPop / 100.0;
    const maxWind = winds.length > 0 ? Math.max(...winds) : 10.0;
    const maxUv = uvs.length > 0 ? Math.max(...uvs) : 4.0;
    const calcWbgt = calculateWBGT(meanTemp, meanHum);

    return {
      is_available: true,
      data_type: 'hourly_forecast',
      analyzed_context: {
        date: occurrenceDate,
        time_window: `${startTime} – ${endTime}`,
        location: locationStr,
        data_type: 'hourly_forecast'
      },
      weather_snapshot: {
        temp_c: Math.round(meanTemp * 10) / 10,
        humidity_pct: Math.round(meanHum * 10) / 10,
        wind_speed_kmh: Math.round(maxWind * 10) / 10,
        rain_probability: Math.round(maxPop * 100),
        rain_probability_frac: maxPop,
        uv_index: Math.round(maxUv * 10) / 10,
        aqi: current.aqi ?? 45.0,
        visibility_km: current.visibility ?? 8.5,
        wbgt_c: Math.round(calcWbgt * 10) / 10
      }
    };
  }

  const dailyEntries = weatherData.dailyForecast || weatherData.forecastDays || [];
  const matchingDaily = dailyEntries.find(d => d.date === occurrenceDate);

  if (matchingDaily || current.temp != null || weatherData.temp_c != null) {
    const baseTemp = matchingDaily?.maxTemp != null && matchingDaily?.minTemp != null
      ? (matchingDaily.maxTemp + matchingDaily.minTemp) / 2.0
      : (current.temp ?? weatherData.temp_c ?? 28.0);

    let basePop = (matchingDaily?.pop ?? current.pop ?? 15) / 100.0;
    if (basePop > 1.0) basePop = basePop / 100.0;

    let winTemp = baseTemp;
    let winHum = 65.0;
    let winUv = 4.0;

    if (startH < 11) {
      winTemp = baseTemp - 3.5;
      winHum = 75.0;
      winUv = 3.0;
    } else if (startH < 16) {
      winTemp = baseTemp + 2.5;
      winHum = 50.0;
      winUv = 7.0;
    } else {
      winTemp = baseTemp - 1.5;
      winHum = 70.0;
      winUv = 0.5;
    }

    const calcWbgt = calculateWBGT(winTemp, winHum);

    return {
      is_available: true,
      data_type: 'daily_forecast_diurnal',
      analyzed_context: {
        date: occurrenceDate,
        time_window: `${startTime} – ${endTime}`,
        location: locationStr,
        data_type: 'daily_forecast_diurnal'
      },
      weather_snapshot: {
        temp_c: Math.round(winTemp * 10) / 10,
        humidity_pct: Math.round(winHum * 10) / 10,
        wind_speed_kmh: 10.0,
        rain_probability: Math.round(basePop * 100),
        rain_probability_frac: basePop,
        uv_index: Math.round(winUv * 10) / 10,
        aqi: 45.0,
        visibility_km: 8.5,
        wbgt_c: Math.round(calcWbgt * 10) / 10
      }
    };
  }

  return {
    is_available: false,
    data_type: 'unavailable',
    reason: 'Forecast data for your scheduled activity window is currently unavailable.'
  };
}

export function getPersonaWeight(persona, widgetType) {
  const weights = PERSONA_SIGNAL_WEIGHTS[persona] || PERSONA_SIGNAL_WEIGHTS.daily_life;
  return weights[widgetType] ?? 0.50;
}

export function generateCurrentPersonaSignals({
  selectedPersonas = ['daily_life'],
  weatherData = {},
  currentDateTime = new Date()
}) {
  const primaryPersona = selectedPersonas[0] || 'daily_life';
  const current = weatherData.current || {};
  const locationStr = weatherData.name || weatherData.district || weatherData.city || 'Current Location';

  const now = currentDateTime instanceof Date ? currentDateTime : new Date(currentDateTime);
  const timestampStr = now.toISOString();

  const temp = current.temp ?? current.temp_c ?? 28.0;
  const humidity = current.humidity ?? current.humidity_pct ?? 65.0;
  const wind = current.windSpeed ?? current.wind_speed_kmh ?? 10.0;
  let pop = current.pop ?? current.rain_probability ?? 15;
  if (pop > 1.0) pop = pop / 100.0;
  const uv = current.uvIndex ?? current.uv_index ?? 4.0;
  const aqi = current.aqi ?? 45.0;
  const vis = current.visibility ?? current.visibility_km ?? 8.5;
  const wbgt = current.wbgt ?? current.wbgt_c ?? calculateWBGT(temp, humidity);

  const relProfile = getContextRelevance({ persona: primaryPersona, activity: null, activity_type: 'current' });
  const relMap = relProfile.signalRelevance || {};

  const signals = [
    {
      widget_type: 'current_conditions',
      temporal_context: 'current',
      observed_at: timestampStr,
      location: locationStr,
      data_source: 'current_weather',
      metric_name: 'Temperature',
      value: temp,
      unit: '°C',
      relevance: relMap.current_conditions || 'high'
    },
    {
      widget_type: 'aqi_health',
      temporal_context: 'current',
      observed_at: timestampStr,
      location: locationStr,
      data_source: 'current_weather',
      metric_name: 'AQI',
      value: aqi,
      unit: null,
      relevance: relMap.aqi_health || 'high'
    },
    {
      widget_type: 'uv_heat_index',
      temporal_context: 'current',
      observed_at: timestampStr,
      location: locationStr,
      data_source: 'current_weather',
      metric_name: 'UV Index',
      value: uv,
      unit: null,
      relevance: relMap.uv_heat_index || 'high'
    },
    {
      widget_type: 'wbgt_safety',
      temporal_context: 'current',
      observed_at: timestampStr,
      location: locationStr,
      data_source: 'current_weather',
      metric_name: 'WBGT Heat Index',
      value: wbgt,
      unit: '°C',
      relevance: relMap.wbgt_safety || 'medium'
    },
    {
      widget_type: 'rain_probability',
      temporal_context: 'current',
      observed_at: timestampStr,
      location: locationStr,
      data_source: 'current_weather',
      metric_name: 'Precipitation Risk',
      value: Math.round(pop * 100),
      unit: '%',
      relevance: relMap.rain_probability || 'high'
    },
    {
      widget_type: 'visibility_fog',
      temporal_context: 'current',
      observed_at: timestampStr,
      location: locationStr,
      data_source: 'current_weather',
      metric_name: 'Visibility',
      value: vis,
      unit: 'km',
      relevance: relMap.visibility_fog || 'medium'
    }
  ];

  return {
    temporal_context: 'current',
    timestamp: timestampStr,
    location: locationStr,
    weather_source: 'current_weather',
    signals
  };
}

export function generateStructuredSignals({
  userId = 'usr_demo',
  selectedPersonas = ['daily_life'],
  routine = [],
  athleteProfile = null,
  weatherData = {},
  currentDateTime = new Date()
}) {
  const primaryPersona = selectedPersonas[0] || 'daily_life';
  const current = weatherData.current || {};
  const temp = current.temp ?? 28.0;

  const signals = [];
  let signalCounter = 1;

  if (!routine || routine.length === 0) {
    const weight = getPersonaWeight(primaryPersona, 'today_forecast');
    signals.push({
      signal_id: `sig_${signalCounter}_ambient`,
      temporal_context: 'future',
      weather_source: 'hourly_forecast',
      widget_type: 'today_forecast',
      category: 'ambient_weather',
      severity: 'low',
      impact: 'neutral',
      value: temp,
      unit: '°C',
      decision_weight: weight,
      affects_activity_id: null,
      affects_activity: null,
      location: 'Selected Location',
      time_window: 'Daily',
      threshold: null,
      threshold_exceeded: false,
      recommendation_constraints: [],
      explanation: `Ambient temperature forecast is ${temp}°C.`
    });
    return signals;
  }

  routine.forEach((act, idx) => {
    const actId = act.id || `act_${idx + 1}`;
    const actLabel = act.label || 'Routine Activity';
    const actType = act.type || 'running';
    const startTimeStr = act.startTime || '07:00';
    const endTimeStr = act.endTime || '08:00';
    const locationStr = act.location || act.startLocation || 'Selected Location';

    const occurrence = resolveNextActivityOccurrence(act, currentDateTime);
    const win = getActivityWeatherWindow({
      weatherData,
      occurrenceDate: occurrence.occurrence_date,
      startTime: startTimeStr,
      endTime: endTimeStr,
      locationStr,
      occurrenceStatus: occurrence.occurrence_status
    });

    if (!win.is_available) return;

    const actContext = {
      persona: primaryPersona,
      activity: act,
      activity_type: actType
    };
    const relProfile = getContextRelevance(actContext);
    const relMap = relProfile.signalRelevance;

    const snap = win.weather_snapshot;
    const displayLabel = occurrence.display_label;
    const timeWindow = displayLabel !== 'Today'
      ? `${displayLabel} • ${startTimeStr} – ${endTimeStr}`
      : `${startTimeStr} – ${endTimeStr}`;

    const tempC = snap.temp_c;
    const popFrac = snap.rain_probability_frac;
    const popPct = snap.rain_probability;
    const wbgt = snap.wbgt_c;
    const humidity = snap.humidity_pct;
    const wind = snap.wind_speed_kmh;

    const rainExceeded = popFrac >= 0.5;
    const rainSeverity = popFrac >= 0.6 ? 'high' : (popFrac >= 0.35 ? 'moderate' : 'low');

    // 1. WBGT Safety Signal (ONLY generated when WBGT is eligible for the activity context)
    if (relMap.wbgt_safety !== 'not_relevant' && relProfile.relevanceFactors?.wbgt_eligible) {
      const limit = 28.7;
      const wbgtExceeded = wbgt >= limit;
      const wbgtSeverity = wbgt >= 32.2 ? 'critical' : (wbgtExceeded ? 'high' : 'low');
      const wbgtWeight = getPersonaWeight(primaryPersona, 'wbgt_safety');

      signals.push({
        signal_id: `sig_${actId}_wbgt`,
        temporal_context: 'future',
        weather_source: win.data_type || 'hourly_forecast',
        widget_type: 'wbgt_safety',
        category: 'heat_stress',
        severity: wbgtSeverity,
        impact: wbgtExceeded ? 'negative' : 'positive',
        value: wbgt,
        unit: '°C',
        decision_weight: wbgtWeight,
        relevance: relMap.wbgt_safety || 'medium',
        applicable_to: [actType],
        affects_activity_id: actId,
        affects_activity: actLabel,
        location: locationStr,
        time_window: timeWindow,
        occurrence_date: occurrence.occurrence_date,
        occurrence_status: occurrence.occurrence_status,
        display_label: occurrence.display_label,
        analyzed_context: win.analyzed_context,
        threshold: limit,
        threshold_exceeded: wbgtExceeded,
        recommendation_constraints: wbgtExceeded ? ['reduce_intensity', 'increase_hydration'] : [],
        explanation: `Forecast WBGT (${wbgt}°C) ${wbgtExceeded ? 'exceeds' : 'remains below'} threshold (${limit}°C) for ${timeWindow} ${actLabel}.`
      });
    }

    // 2. Rain Probability Signal
    if (relMap.rain_probability !== 'not_relevant') {
      const rainWeight = getPersonaWeight(primaryPersona, 'rain_probability');

      signals.push({
        signal_id: `sig_${actId}_rain`,
        temporal_context: 'future',
        weather_source: win.data_type || 'hourly_forecast',
        widget_type: 'rain_probability',
        category: 'precipitation',
        severity: rainSeverity,
        impact: rainExceeded ? 'negative' : 'positive',
        value: popPct,
        unit: '%',
        decision_weight: rainWeight,
        relevance: relMap.rain_probability || 'high',
        applicable_to: [actType],
        affects_activity_id: actId,
        affects_activity: actLabel,
        location: locationStr,
        time_window: timeWindow,
        occurrence_date: occurrence.occurrence_date,
        occurrence_status: occurrence.occurrence_status,
        display_label: occurrence.display_label,
        analyzed_context: win.analyzed_context,
        threshold: 50.0,
        threshold_exceeded: rainExceeded,
        recommendation_constraints: rainExceeded ? ['carry_gear', 'consider_indoor_alternative'] : [],
        explanation: `Forecast rain probability is ${popPct}% during ${timeWindow} ${actLabel}.`
      });
    }

    // 3. Dew Factor Signal
    if (relMap.dew_factor !== 'not_relevant') {
      const dewRisk = humidity > 80 && tempC < 25.0;
      const dewWeight = getPersonaWeight(primaryPersona, 'dew_factor');

      signals.push({
        signal_id: `sig_${actId}_dew`,
        temporal_context: 'future',
        weather_source: win.data_type || 'hourly_forecast',
        widget_type: 'dew_factor',
        category: 'surface_grip',
        severity: dewRisk ? 'moderate' : 'low',
        impact: dewRisk ? 'negative' : 'positive',
        value: dewRisk ? 'High Dew Risk' : 'Firm Grip',
        unit: null,
        decision_weight: dewWeight,
        relevance: relMap.dew_factor || 'medium',
        applicable_to: [actType],
        affects_activity_id: actId,
        affects_activity: actLabel,
        location: locationStr,
        time_window: timeWindow,
        occurrence_date: occurrence.occurrence_date,
        occurrence_status: occurrence.occurrence_status,
        display_label: occurrence.display_label,
        analyzed_context: win.analyzed_context,
        threshold: null,
        threshold_exceeded: dewRisk,
        recommendation_constraints: dewRisk ? ['use_studded_footwear', 'keep_dry_towels'] : [],
        explanation: `Outfield moisture forecast for ${timeWindow} ${actLabel}: ${dewRisk ? 'Significant dew expected.' : 'Minimal outfield moisture expected.'}`
      });
    }

    // 4. Travel / Commute Disruption Signal
    if (relMap.travel_disruption !== 'not_relevant' || relMap.flight_disruption !== 'not_relevant' || relMap.commute_weather !== 'not_relevant') {
      const isTravel = ['travel', 'air_travel'].includes(actType);
      const widgetT = isTravel ? 'travel_disruption' : 'commute_weather';
      const disruptWeight = getPersonaWeight(primaryPersona, widgetT);
      const disruptRisk = rainExceeded || wind >= 25.0;

      signals.push({
        signal_id: `sig_${actId}_disruption`,
        temporal_context: 'future',
        weather_source: win.data_type || 'hourly_forecast',
        widget_type: widgetT,
        category: 'transit_disruption',
        severity: disruptRisk ? 'high' : 'low',
        impact: disruptRisk ? 'negative' : 'positive',
        value: timeWindow,
        unit: null,
        decision_weight: disruptWeight,
        relevance: relMap[widgetT] || (isTravel ? 'critical' : 'high'),
        applicable_to: [actType],
        affects_activity_id: actId,
        affects_activity: actLabel,
        location: locationStr,
        time_window: timeWindow,
        occurrence_date: occurrence.occurrence_date,
        occurrence_status: occurrence.occurrence_status,
        display_label: occurrence.display_label,
        analyzed_context: win.analyzed_context,
        threshold: null,
        threshold_exceeded: disruptRisk,
        recommendation_constraints: disruptRisk ? ['allow_extra_travel_time', 'check_flight_status'] : [],
        explanation: `${isTravel ? 'Travel' : 'Commute'} forecast for ${timeWindow} ${actLabel}: ${disruptRisk ? 'Travel disruption or delay risk expected.' : 'Smooth transit conditions.'}`
      });
    }
  });

  return signals;
}

export function validateConsistency(primaryInsight, activities) {
  let hasCriticalSafety = false;
  let hasHighDisruption = false;

  const validatedActivities = activities.map(act => {
    const actCopy = { ...act };
    const factor = actCopy.primary_reason?.factor;
    const assessment = actCopy.primary_reason?.assessment;

    if ((factor === 'thunderstorm' || factor === 'lightning' || factor === 'wbgt_c') && assessment === 'Extreme Risk') {
      hasCriticalSafety = true;
      if (actCopy.status === 'GO') {
        actCopy.status = 'RESCHEDULE';
        actCopy.summary = 'Extreme safety hazard detected — outdoor activity postponed.';
        actCopy.recommended_action = 'Reschedule to a safer window or stay indoors.';
      }
    }

    if (factor === 'rain_probability' && assessment === 'High Risk') {
      hasHighDisruption = true;
      if (actCopy.status === 'GO') {
        actCopy.status = 'MODIFY';
        actCopy.summary = 'Rain probability is elevated during this window.';
        actCopy.recommended_action = 'Carry waterproof gear and monitor radar.';
      }
    }

    return actCopy;
  });

  const validatedInsight = { ...primaryInsight };
  if (hasCriticalSafety && validatedInsight.status === 'GO') {
    validatedInsight.status = 'RESCHEDULE';
    validatedInsight.headline = 'Severe weather / extreme heat alert active during scheduled window.';
    validatedInsight.severity_level = 'RED';
  } else if (hasHighDisruption && validatedInsight.status === 'GO') {
    validatedInsight.status = 'MODIFY';
    validatedInsight.headline = 'Elevated rain or weather disruption expected during schedule.';
    validatedInsight.severity_level = 'AMBER';
  }

  return { validatedInsight, validatedActivities };
}

export function evaluateSharedWeatherIntelligence({
  userId = 'usr_demo',
  date = '2026-09-04',
  selectedPersonas = ['daily_life'],
  routine = [],
  athleteProfile = null,
  weatherData = {},
  currentDateTime = new Date()
}) {
  const currentIntelligence = generateCurrentPersonaSignals({
    selectedPersonas,
    weatherData,
    currentDateTime
  });

  const signals = generateStructuredSignals({
    userId,
    selectedPersonas,
    routine,
    athleteProfile,
    weatherData,
    currentDateTime
  });

  if (!routine || routine.length === 0) {
    const emptyPrimaryRec = {
      temporal_context: 'future',
      status: 'GO',
      headline: 'No routine activities scheduled.',
      recommendation: 'Add activities to your Daily Weather Routine to receive personalized weather intelligence.',
      primary_concern: 'none',
      severity_level: 'GREEN',
      target_activity: null,
      target_occurrence_label: 'Upcoming',
      primary_signal: null,
      weather_source: 'hourly_forecast',
      supporting_signals: []
    };

    return {
      user_id: userId,
      date,
      temporal_context: 'future',
      weather_source: 'hourly_forecast',
      overall_risk: 'LOW',
      primary_concern: 'none',
      plan_title: 'RECOMMENDED',
      plan_subtitle: 'Personalized forecast-based guidance',
      total_activities: 0,
      signals,
      current_intelligence: currentIntelligence,
      primary_recommendation: emptyPrimaryRec,
      primary_decision_insight: emptyPrimaryRec,
      activities: []
    };
  }

  const primaryPersona = selectedPersonas[0] || 'daily_life';

  let highestHierarchy = HIERARCHY.COMFORT;
  let highestRiskAct = null;
  let highestSignalId = null;

  const signalsByAct = {};
  signals.forEach(s => {
    if (s.affects_activity_id) {
      if (!signalsByAct[s.affects_activity_id]) signalsByAct[s.affects_activity_id] = [];
      signalsByAct[s.affects_activity_id].push(s);
    }
  });

  const activities = routine.map((act, idx) => {
    const actId = act.id || `act_${idx + 1}`;
    const actType = act.type || 'running';
    const actLabel = act.label || 'Routine Activity';
    const startTimeStr = act.startTime || '07:00';
    const endTimeStr = act.endTime || '08:00';
    const timeWindow = `${startTimeStr} – ${endTimeStr}`;
    const locationStr = act.location || act.startLocation || 'Selected Location';

    const occurrence = resolveNextActivityOccurrence(act, currentDateTime);
    const win = getActivityWeatherWindow({
      weatherData,
      occurrenceDate: occurrence.occurrence_date,
      startTime: startTimeStr,
      endTime: endTimeStr,
      locationStr,
      occurrenceStatus: occurrence.occurrence_status
    });

    if (!win.is_available) {
      return {
        activity_id: actId,
        temporal_context: 'future',
        weather_source: 'hourly_forecast',
        activity_label: actLabel,
        activity_type: actType,
        persona: primaryPersona,
        preferred_block: 'morning',
        location: locationStr,
        time_window: timeWindow,
        occurrence_date: occurrence.occurrence_date,
        occurrence_status: occurrence.occurrence_status,
        display_label: occurrence.display_label,
        is_today: occurrence.is_today,
        is_tomorrow: occurrence.is_tomorrow,
        is_active: occurrence.is_active,
        flexible: act.flexible ?? true,
        status: 'INSUFFICIENT DATA',
        summary: 'Forecast data for your scheduled activity window is currently unavailable.',
        primary_reason: {
          factor: 'forecast_availability',
          observed_value: 'Unavailable',
          assessment: 'Missing Data'
        },
        supporting_signals: [],
        analyzed_factors: [],
        analyzed_context: win.analyzed_context,
        forecast_context: {
          date: occurrence.occurrence_date,
          time_window: timeWindow,
          location: locationStr,
          data_source: 'hourly_forecast'
        },
        weather_snapshot: null,
        what_this_means: 'Forecast data for target date and time window is not yet available from the weather provider.',
        recommended_action: 'Check back closer to your scheduled activity time.',
        alternative_window: null,
        sportsperson_assessment: null,
        conditions: null
      };
    }

    const snap = win.weather_snapshot;
    const temp = snap.temp_c;
    const humidity = snap.humidity_pct;
    const wind = snap.wind_speed_kmh;
    const pop = snap.rain_probability_frac;
    const popPct = snap.rain_probability;
    const wbgt = snap.wbgt_c;

    const actContext = {
      persona: primaryPersona,
      activity: act,
      activity_type: actType
    };
    const allowedFactors = getAllowedFactors(actContext, primaryPersona);
    const relProfile = getContextRelevance(actContext);

    const rawActSignals = signalsByAct[actId] || [];
    const actSignals = filterSignalsByAllowedFactors(
      rawActSignals.filter(s => validateSignalApplicability(s, actContext)),
      allowedFactors
    );
    const supportingSignalIds = actSignals.map(s => s.signal_id);

    let status = 'GO';
    let summary = relProfile.relevanceFactors?.environment === 'indoor'
      ? 'No significant weather-related disruption is expected for this indoor activity.'
      : (occurrence.is_active
          ? `Currently Active — conditions remain suitable for the rest of your session (${startTimeStr}–${endTimeStr}).`
          : 'Conditions are suitable for your planned activity.');

    let primaryFactor = 'temperature';
    let observedVal = `${temp}°C`;
    let assessment = 'Suitable';
    let actHierarchy = HIERARCHY.COMFORT;
    let topActSignal = null;

    actSignals.forEach(s => {
      if ((s.severity === 'critical' || s.severity === 'high') && s.impact === 'negative') {
        topActSignal = s.signal_id;
        if (s.widget_type === 'wbgt_safety' && allowedFactors.includes('wbgt')) {
          status = s.severity === 'critical' ? 'RESCHEDULE' : 'MODIFY';
          summary = s.explanation;
          primaryFactor = 'wbgt_c';
          observedVal = `${s.value}°C`;
          assessment = s.severity === 'critical' ? 'Extreme Risk' : 'High Risk';
        } else if (s.widget_type === 'rain_probability' && allowedFactors.includes('rain_probability')) {
          if (status === 'GO') {
            status = 'MODIFY';
            summary = s.explanation;
            primaryFactor = 'rain_probability';
            observedVal = `${s.value}%`;
            assessment = 'High Risk';
          }
        }
      }
    });

    // Activity-Scoped Safety Rules (ONLY evaluated if factor is in allowedFactors)
    if (allowedFactors.includes('wbgt') && wbgt != null && wbgt >= 32.2) {
      status = 'RESCHEDULE';
      summary = `Extreme WBGT heat stress (${wbgt}°C) exceeds safety threshold.`;
      primaryFactor = 'wbgt_c';
      observedVal = `${wbgt}°C`;
      assessment = 'Extreme Risk';
      actHierarchy = HIERARCHY.SAFETY;
    } else if (allowedFactors.includes('rain_probability') && pop >= 0.6) {
      if (status === 'GO') status = act.flexible ? 'MODIFY' : 'RESCHEDULE';
      primaryFactor = 'rain_probability';
      observedVal = `${popPct}%`;
      assessment = 'High Risk';
      actHierarchy = HIERARCHY.DISRUPTION;
    } else if (allowedFactors.includes('wbgt') && wbgt != null && wbgt >= 28.7) {
      if (status === 'GO') {
        status = 'MODIFY';
        summary = `Elevated WBGT heat stress (${wbgt}°C) — consider reducing exertion.`;
        primaryFactor = 'wbgt_c';
        observedVal = `${wbgt}°C`;
        assessment = 'Elevated Heat';
      }
      actHierarchy = HIERARCHY.DISRUPTION;
    } else if (allowedFactors.includes('temperature') && temp >= 34.0) {
      if (status === 'GO') {
        status = 'MODIFY';
        summary = `Elevated temperature (${temp}°C) — adjust duration or pace.`;
        primaryFactor = 'temperature';
        observedVal = `${temp}°C`;
        assessment = 'Elevated Temp';
      }
      actHierarchy = HIERARCHY.DISRUPTION;
    }

    // FAIL-SAFE ASSERTION GATE: Excluded factors MUST NEVER drive recommendations
    if (['wbgt_c', 'wbgt', 'wbgt_safety'].includes(primaryFactor) && !allowedFactors.includes('wbgt')) {
      primaryFactor = 'temperature';
      observedVal = `${temp}°C`;
      assessment = 'Suitable';
      if (status === 'RESCHEDULE' || status === 'MODIFY') {
        status = 'GO';
        summary = relProfile.relevanceFactors?.environment === 'indoor'
          ? 'No significant weather-related disruption is expected for this indoor activity.'
          : 'Conditions are suitable for your planned activity.';
      }
    }

    if (actHierarchy < highestHierarchy) {
      highestHierarchy = actHierarchy;
      highestRiskAct = actLabel;
      highestSignalId = topActSignal || (supportingSignalIds[0] ?? null);
    }

    // Generate factors list strictly from allowedFactors
    const factors = [];

    if (allowedFactors.includes('temperature')) {
      const showWbgt = allowedFactors.includes('wbgt') && wbgt != null;
      factors.push({
        name: showWbgt ? 'Temperature & WBGT' : 'Temperature',
        value: showWbgt ? `${temp}°C (WBGT: ${wbgt}°C)` : `${temp}°C`,
        assessment: showWbgt && wbgt >= 28.7 ? 'Elevated Heat' : (temp > 34 ? 'Warm' : 'Comfortable'),
        impact: (showWbgt && wbgt >= 28.7) || temp > 34 ? 'negative' : 'positive',
        explanation: showWbgt && wbgt >= 28.7 ? 'Heat index approaches caution threshold.' : 'Thermal conditions acceptable.'
      });
    }

    if (allowedFactors.includes('rain_probability')) {
      factors.push({
        name: 'Rain Probability',
        value: `${popPct}%`,
        assessment: pop >= 0.5 ? 'High Risk' : 'Low Chance',
        impact: pop >= 0.5 ? 'negative' : 'positive',
        explanation: pop >= 0.5 ? `Rain is likely (${popPct}%) during scheduled activity.` : 'Low probability of precipitation.'
      });
    }

    if (allowedFactors.includes('humidity')) {
      factors.push({
        name: 'Humidity',
        value: `${humidity}%`,
        assessment: humidity > 80 ? 'Humid' : 'Comfortable',
        impact: humidity > 80 ? 'negative' : 'positive',
        explanation: 'Relative humidity is within acceptable range.'
      });
    }

    if (allowedFactors.includes('wind_speed')) {
      factors.push({
        name: 'Wind',
        value: `${wind} km/h`,
        assessment: wind >= 25 ? 'Breezy' : 'Gentle',
        impact: wind >= 25 ? 'negative' : 'positive',
        explanation: wind >= 25 ? 'Wind speed may affect transit or stability.' : 'No significant wind impact.'
      });
    }

    return {
      activity_id: actId,
      temporal_context: 'future',
      weather_source: 'hourly_forecast',
      activity_label: actLabel,
      activity_type: actType,
      persona: primaryPersona,
      preferred_block: 'morning',
      location: locationStr,
      time_window: timeWindow,
      occurrence_date: occurrence.occurrence_date,
      occurrence_status: occurrence.occurrence_status,
      display_label: occurrence.display_label,
      is_today: occurrence.is_today,
      is_tomorrow: occurrence.is_tomorrow,
      is_active: occurrence.is_active,
      flexible: act.flexible ?? true,
      status,
      summary,
      primary_reason: {
        factor: primaryFactor,
        observed_value: observedVal,
        assessment
      },
      supporting_signals: supportingSignalIds,
      analyzed_factors: factors,
      decision_provenance: {
        activity: actType,
        relevance_profile: relProfile.activityType || actType,
        allowed_factors: allowedFactors,
        excluded_factors: relProfile.relevanceFactors?.excluded_factors || [],
        evaluated_factors: allowedFactors,
        triggered_rules: status !== 'GO' ? [primaryFactor] : [],
        decision: status
      },
      analyzed_context: win.analyzed_context,
      forecast_context: {
        date: occurrence.occurrence_date,
        time_window: timeWindow,
        location: locationStr,
        data_source: 'hourly_forecast'
      },
      weather_snapshot: snap,
      what_this_means: status === 'GO'
        ? 'Conditions are generally favorable for your planned activity.'
        : `Weather conditions present potential disruption (${summary}).`,
      recommended_action: status === 'GO'
        ? 'Proceed as planned. Stay hydrated and monitor forecast.'
        : (status === 'MODIFY' ? 'Reduce intensity, carry gear, or shift time slightly.' : 'Reschedule session to a safer time window.'),
      alternative_window: (status === 'RESCHEDULE' || status === 'MODIFY') && act.flexible ? {
        available: true,
        start: '17:00',
        end: '19:30',
        block_name: 'evening',
        reason: 'Lower rainfall/heat risk during the evening window.'
      } : null,
      sportsperson_assessment: (selectedPersonas.includes('sportsperson') && allowedFactors.includes('wbgt')) ? {
        estimated_wbgt: wbgt,
        wbgt_clamped: wbgt,
        personalized_limit: 28.7,
        zone: wbgt >= 28.7 ? 'Caution' : 'Low Risk',
        dew_risk: false,
        wind_flag: false,
        experience_level: athleteProfile?.experience_level || 'intermediate',
        risk_tolerance: athleteProfile?.risk_tolerance || 'balanced',
        age_group: athleteProfile?.age_group || 'adult',
        shift_breakdown: { age: 0, experience: 0, risk: 0 }
      } : null
    };
  });

  const allToday = activities.every(a => a.is_today);
  const allTomorrow = activities.every(a => a.is_tomorrow);

  let planSubtitle = "Based on your next scheduled activities";
  if (allToday) {
    planSubtitle = "Based on upcoming forecast conditions today";
  } else if (allTomorrow) {
    planSubtitle = "Based on your next scheduled activities tomorrow";
  }

  const allSupportingSignalIds = signals
    .filter(s => s.severity === 'critical' || s.severity === 'high' || s.severity === 'moderate')
    .map(s => s.signal_id);

  let pdiStatus = 'GO';
  let pdiSeverity = 'GREEN';
  let pdiHeadline = 'Weather conditions are favorable for your planned schedule.';
  let pdiRecommendation = 'Proceed with your scheduled activities as planned. Stay hydrated.';
  let primaryConcern = 'none';

  if (highestHierarchy === HIERARCHY.SAFETY) {
    pdiStatus = 'RESCHEDULE';
    pdiSeverity = 'RED';
    pdiHeadline = `Severe safety hazard / extreme heat alert during your ${highestRiskAct || 'scheduled activity'}.`;
    pdiRecommendation = 'Postpone outdoor sessions or switch to an indoor alternative.';
    primaryConcern = 'safety_hazard';
  } else if (highestHierarchy === HIERARCHY.DISRUPTION) {
    pdiStatus = 'MODIFY';
    pdiSeverity = 'AMBER';
    pdiHeadline = `Weather disruption expected during your ${highestRiskAct || 'scheduled activity'}.`;
    pdiRecommendation = 'Carry protective gear, adjust pace, or consider shifting time window.';
    primaryConcern = 'disruption_risk';
  }

  let targetOccLabel = 'Today';
  if (highestRiskAct) {
    const actMatch = activities.find(a => a.activity_label === highestRiskAct);
    if (actMatch) targetOccLabel = actMatch.display_label;
  } else if (activities.length > 0) {
    targetOccLabel = activities[0].display_label;
  }

  const rawInsight = {
    temporal_context: 'future',
    status: pdiStatus,
    headline: pdiHeadline,
    recommendation: pdiRecommendation,
    primary_concern: primaryConcern,
    severity_level: pdiSeverity,
    target_activity: highestRiskAct,
    target_occurrence_label: targetOccLabel,
    primary_signal: highestSignalId || (allSupportingSignalIds[0] ?? null),
    weather_source: 'hourly_forecast',
    supporting_signals: allSupportingSignalIds
  };

  const { validatedInsight, validatedActivities } = validateConsistency(rawInsight, activities);

  return {
    user_id: userId,
    date,
    temporal_context: 'future',
    weather_source: 'hourly_forecast',
    overall_risk: highestHierarchy === HIERARCHY.SAFETY ? 'CRITICAL' : (highestHierarchy === HIERARCHY.DISRUPTION ? 'HIGH' : 'LOW'),
    primary_concern: primaryConcern,
    plan_title: 'RECOMMENDED',
    plan_subtitle: planSubtitle,
    total_activities: validatedActivities.length,
    signals,
    current_intelligence: currentIntelligence,
    primary_recommendation: validatedInsight,
    primary_decision_insight: validatedInsight,
    activities: validatedActivities
  };
}
