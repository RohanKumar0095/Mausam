/**
 * MAUSAM Activity-Aware Weather Factor Relevance Engine (Client-Side JS Mirror)
 *
 * Implements explicit ActivityWeatherRelevanceMatrix and two-stage filtering system.
 * Determines relevant weather factors BEFORE recommendation scoring based on:
 * Activity Type + Activity Context + Route Type + Indoor/Outdoor Exposure + Physical Intensity + Persona + Time Window.
 */

export const CONTROLLED_WEATHER_FACTORS = new Set([
  'TEMPERATURE',
  'FEELS_LIKE',
  'HUMIDITY',
  'RAIN_PROBABILITY',
  'RAIN_INTENSITY',
  'THUNDERSTORM',
  'LIGHTNING',
  'WIND_SPEED',
  'WIND_GUSTS',
  'WIND_DIRECTION',
  'VISIBILITY',
  'FOG',
  'AQI',
  'UV_INDEX',
  'WBGT',
  'SURFACE_CONDITION',
  'DEW_POINT',
  'HEAT_INDEX',
  'COLD_STRESS',
  'FLOOD_RISK',
  'SEVERE_WEATHER_ALERT',
  'RAIN_ACCUMULATION',
  'ROAD_CONDITION',
  'AIR_PRESSURE',
  'MULTI_DAY_RAIN_TREND',
  'FLIGHT_DISRUPTION',
  'COMMUTE_WEATHER'
]);

export const FACTOR_TO_WIDGET_MAP = {
  WBGT: 'wbgt_safety',
  RAIN_PROBABILITY: 'rain_probability',
  RAIN_INTENSITY: 'rain_probability',
  THUNDERSTORM: 'lightning_storm_safety',
  LIGHTNING: 'lightning_storm_safety',
  SEVERE_WEATHER_ALERT: 'lightning_storm_safety',
  TEMPERATURE: 'current_conditions',
  FEELS_LIKE: 'current_conditions',
  HUMIDITY: 'humidity_health_impact',
  WIND_SPEED: 'wind_gauge',
  WIND_GUSTS: 'wind_gauge',
  VISIBILITY: 'visibility_fog',
  FOG: 'visibility_fog',
  AQI: 'aqi_health',
  UV_INDEX: 'uv_heat_index',
  DEW_POINT: 'dew_factor',
  SURFACE_CONDITION: 'ground_condition',
  ROAD_CONDITION: 'ground_condition',
  FLOOD_RISK: 'travel_disruption',
  TRAVEL_DISRUPTION: 'travel_disruption',
  FLIGHT_DISRUPTION: 'flight_disruption',
  COMMUTE_WEATHER: 'commute_weather'
};

export const ACTIVITY_RELEVANCE_MATRIX = {
  running: {
    activity_type: 'running',
    mobility_type: 'route_based',
    environment: 'outdoor',
    physical_intensity: 'high',
    exposure_duration: 'moderate',
    primary_factors: ['WBGT', 'TEMPERATURE', 'FEELS_LIKE', 'RAIN_PROBABILITY', 'RAIN_INTENSITY', 'AQI', 'THUNDERSTORM', 'LIGHTNING'],
    secondary_factors: ['HUMIDITY', 'WIND_SPEED', 'WIND_GUSTS', 'SURFACE_CONDITION', 'UV_INDEX'],
    safety_critical_factors: ['WBGT', 'LIGHTNING', 'THUNDERSTORM', 'SEVERE_WEATHER_ALERT', 'AQI', 'RAIN_INTENSITY'],
    contextual_factors: [],
    excluded_factors: ['DEW_POINT', 'AIR_PRESSURE', 'ROAD_CONDITION', 'FLOOD_RISK', 'MULTI_DAY_RAIN_TREND'],
    wbgt_eligible: true
  },
  walking: {
    activity_type: 'walking',
    mobility_type: 'route_based',
    environment: 'outdoor',
    physical_intensity: 'low',
    exposure_duration: 'brief',
    primary_factors: ['RAIN_PROBABILITY', 'RAIN_INTENSITY', 'TEMPERATURE', 'FEELS_LIKE', 'THUNDERSTORM', 'LIGHTNING', 'AQI'],
    secondary_factors: ['WIND_SPEED', 'HUMIDITY', 'UV_INDEX', 'SURFACE_CONDITION', 'VISIBILITY'],
    safety_critical_factors: ['LIGHTNING', 'THUNDERSTORM', 'RAIN_INTENSITY', 'AQI'],
    contextual_factors: ['WBGT', 'HEAT_INDEX'],
    excluded_factors: ['DEW_POINT', 'AIR_PRESSURE', 'ROAD_CONDITION'],
    wbgt_eligible: false
  },
  cycling: {
    activity_type: 'cycling',
    mobility_type: 'route_based',
    environment: 'outdoor',
    physical_intensity: 'high',
    exposure_duration: 'moderate',
    primary_factors: ['WBGT', 'WIND_SPEED', 'WIND_GUSTS', 'RAIN_INTENSITY', 'THUNDERSTORM', 'LIGHTNING', 'AQI', 'TEMPERATURE'],
    secondary_factors: ['VISIBILITY', 'SURFACE_CONDITION', 'HUMIDITY', 'UV_INDEX', 'FEELS_LIKE'],
    safety_critical_factors: ['LIGHTNING', 'WIND_SPEED', 'ROAD_CONDITION', 'RAIN_INTENSITY', 'WBGT'],
    contextual_factors: [],
    excluded_factors: ['DEW_POINT', 'AIR_PRESSURE'],
    wbgt_eligible: true
  },
  college: {
    activity_type: 'college',
    mobility_type: 'stationary',
    environment: 'mixed',
    physical_intensity: 'low',
    exposure_duration: 'brief',
    primary_factors: ['RAIN_PROBABILITY', 'RAIN_INTENSITY', 'THUNDERSTORM', 'LIGHTNING', 'TEMPERATURE', 'SEVERE_WEATHER_ALERT'],
    secondary_factors: ['AQI', 'VISIBILITY', 'WIND_SPEED', 'UV_INDEX'],
    safety_critical_factors: ['THUNDERSTORM', 'LIGHTNING', 'SEVERE_WEATHER_ALERT', 'FLOOD_RISK'],
    contextual_factors: [],
    excluded_factors: ['WBGT', 'DEW_POINT', 'SURFACE_CONDITION', 'ROAD_CONDITION'],
    wbgt_eligible: false
  },
  school: {
    activity_type: 'school',
    mobility_type: 'stationary',
    environment: 'mixed',
    physical_intensity: 'low',
    exposure_duration: 'brief',
    primary_factors: ['RAIN_PROBABILITY', 'RAIN_INTENSITY', 'THUNDERSTORM', 'LIGHTNING', 'SEVERE_WEATHER_ALERT', 'TEMPERATURE'],
    secondary_factors: ['AQI', 'UV_INDEX', 'VISIBILITY', 'WIND_SPEED'],
    safety_critical_factors: ['SEVERE_WEATHER_ALERT', 'LIGHTNING', 'RAIN_INTENSITY'],
    contextual_factors: [],
    excluded_factors: ['WBGT', 'DEW_POINT', 'SURFACE_CONDITION'],
    wbgt_eligible: false
  },
  office: {
    activity_type: 'office',
    mobility_type: 'stationary',
    environment: 'mixed',
    physical_intensity: 'low',
    exposure_duration: 'brief',
    primary_factors: ['RAIN_PROBABILITY', 'RAIN_INTENSITY', 'THUNDERSTORM', 'SEVERE_WEATHER_ALERT', 'VISIBILITY'],
    secondary_factors: ['TEMPERATURE', 'AQI', 'WIND_SPEED'],
    safety_critical_factors: ['SEVERE_WEATHER_ALERT', 'FLOOD_RISK', 'THUNDERSTORM'],
    contextual_factors: [],
    excluded_factors: ['WBGT', 'DEW_POINT', 'SURFACE_CONDITION', 'HEAT_INDEX'],
    wbgt_eligible: false
  },
  commute: {
    activity_type: 'commute',
    mobility_type: 'route_based',
    environment: 'variable',
    physical_intensity: 'low',
    exposure_duration: 'brief',
    primary_factors: ['RAIN_INTENSITY', 'RAIN_PROBABILITY', 'VISIBILITY', 'FOG', 'THUNDERSTORM', 'LIGHTNING', 'WIND_SPEED', 'WIND_GUSTS', 'ROAD_CONDITION', 'COMMUTE_WEATHER'],
    secondary_factors: ['TEMPERATURE', 'AQI', 'FLOOD_RISK'],
    safety_critical_factors: ['RAIN_INTENSITY', 'FLOOD_RISK', 'FOG', 'VISIBILITY', 'THUNDERSTORM', 'WIND_SPEED', 'COMMUTE_WEATHER'],
    contextual_factors: [],
    excluded_factors: ['WBGT', 'DEW_POINT', 'HEAT_INDEX'],
    wbgt_eligible: false
  },
  travel: {
    activity_type: 'travel',
    mobility_type: 'route_based',
    environment: 'variable',
    physical_intensity: 'low',
    exposure_duration: 'prolonged',
    primary_factors: ['SEVERE_WEATHER_ALERT', 'RAIN_INTENSITY', 'THUNDERSTORM', 'LIGHTNING', 'WIND_SPEED', 'VISIBILITY', 'FOG', 'FLOOD_RISK'],
    secondary_factors: ['TEMPERATURE', 'MULTI_DAY_RAIN_TREND'],
    safety_critical_factors: ['THUNDERSTORM', 'FLOOD_RISK', 'SEVERE_WEATHER_ALERT'],
    contextual_factors: ['AQI', 'COLD_STRESS'],
    excluded_factors: ['WBGT', 'DEW_POINT', 'SURFACE_CONDITION'],
    wbgt_eligible: false
  },
  outdoor_event: {
    activity_type: 'outdoor_event',
    mobility_type: 'route_based',
    environment: 'outdoor',
    physical_intensity: 'low',
    exposure_duration: 'prolonged',
    primary_factors: ['RAIN_PROBABILITY', 'RAIN_INTENSITY', 'THUNDERSTORM', 'LIGHTNING', 'WIND_SPEED', 'WIND_GUSTS', 'TEMPERATURE', 'SEVERE_WEATHER_ALERT'],
    secondary_factors: ['HUMIDITY', 'UV_INDEX', 'SURFACE_CONDITION'],
    safety_critical_factors: ['LIGHTNING', 'THUNDERSTORM', 'SEVERE_WEATHER_ALERT', 'WIND_GUSTS'],
    contextual_factors: ['HEAT_INDEX', 'WBGT'],
    excluded_factors: ['DEW_POINT'],
    wbgt_eligible: false
  },
  farm_work: {
    activity_type: 'farm_work',
    mobility_type: 'stationary',
    environment: 'outdoor',
    physical_intensity: 'moderate',
    exposure_duration: 'prolonged',
    primary_factors: ['RAIN_PROBABILITY', 'RAIN_INTENSITY', 'RAIN_ACCUMULATION', 'WIND_SPEED', 'HUMIDITY', 'TEMPERATURE', 'MULTI_DAY_RAIN_TREND'],
    secondary_factors: ['SEVERE_WEATHER_ALERT', 'UV_INDEX', 'DEW_POINT'],
    safety_critical_factors: ['SEVERE_WEATHER_ALERT', 'LIGHTNING', 'FLOOD_RISK'],
    contextual_factors: ['FLOOD_RISK', 'FOG', 'WBGT'],
    excluded_factors: ['HEAT_INDEX'],
    wbgt_eligible: false
  },
  beach_activity: {
    activity_type: 'beach_activity',
    mobility_type: 'stationary',
    environment: 'outdoor',
    physical_intensity: 'low',
    exposure_duration: 'prolonged',
    primary_factors: ['UV_INDEX', 'TEMPERATURE', 'FEELS_LIKE', 'RAIN_PROBABILITY', 'THUNDERSTORM', 'LIGHTNING', 'WIND_SPEED'],
    secondary_factors: ['HUMIDITY', 'AQI'],
    safety_critical_factors: ['LIGHTNING', 'THUNDERSTORM', 'SEVERE_WEATHER_ALERT'],
    contextual_factors: ['HEAT_INDEX', 'WBGT'],
    excluded_factors: ['DEW_POINT', 'ROAD_CONDITION'],
    wbgt_eligible: false
  },
  sports: {
    activity_type: 'sports',
    mobility_type: 'stationary',
    environment: 'outdoor',
    physical_intensity: 'high',
    exposure_duration: 'moderate',
    primary_factors: ['WBGT', 'RAIN_INTENSITY', 'THUNDERSTORM', 'LIGHTNING', 'WIND_SPEED', 'SURFACE_CONDITION'],
    secondary_factors: ['TEMPERATURE', 'HUMIDITY', 'UV_INDEX', 'AQI'],
    safety_critical_factors: ['LIGHTNING', 'THUNDERSTORM', 'WBGT', 'SEVERE_WEATHER_ALERT'],
    contextual_factors: ['DEW_POINT'],
    excluded_factors: ['AIR_PRESSURE', 'MULTI_DAY_RAIN_TREND'],
    wbgt_eligible: true
  },
  indoor: {
    activity_type: 'indoor',
    mobility_type: 'stationary',
    environment: 'indoor',
    physical_intensity: 'low',
    exposure_duration: 'brief',
    primary_factors: ['SEVERE_WEATHER_ALERT', 'TEMPERATURE'],
    secondary_factors: ['RAIN_PROBABILITY', 'THUNDERSTORM', 'AQI'],
    safety_critical_factors: ['SEVERE_WEATHER_ALERT'],
    contextual_factors: [],
    excluded_factors: ['WBGT', 'DEW_POINT', 'SURFACE_CONDITION', 'WIND_GUSTS', 'UV_INDEX', 'ROAD_CONDITION'],
    wbgt_eligible: false
  },
  other: {
    activity_type: 'other',
    mobility_type: 'stationary',
    environment: 'mixed',
    physical_intensity: 'low',
    exposure_duration: 'brief',
    primary_factors: ['SEVERE_WEATHER_ALERT', 'RAIN_PROBABILITY', 'THUNDERSTORM', 'TEMPERATURE'],
    secondary_factors: ['AQI', 'WIND_SPEED'],
    safety_critical_factors: ['SEVERE_WEATHER_ALERT', 'LIGHTNING'],
    contextual_factors: [],
    excluded_factors: ['WBGT', 'DEW_POINT', 'SURFACE_CONDITION'],
    wbgt_eligible: false
  }
};

export const ACTIVITY_ALIAS_MAP = {
  running: 'running',
  run: 'running',
  morning_run: 'running',
  jogging: 'running',
  marathon: 'running',
  cycling: 'cycling',
  cycle: 'cycling',
  biking: 'cycling',
  bike_ride: 'cycling',
  walking: 'walking',
  walk: 'walking',
  morning_walk: 'walking',
  sports: 'sports',
  cricket: 'sports',
  football: 'sports',
  soccer: 'sports',
  tennis: 'sports',
  athletics: 'sports',
  training: 'sports',
  college: 'college',
  class: 'college',
  university: 'college',
  school: 'school',
  kids: 'school',
  school_pickup: 'school',
  office: 'office',
  work: 'office',
  commute: 'commute',
  two_wheeler_commute: 'commute',
  car_commute: 'commute',
  transit: 'commute',
  travel: 'travel',
  air_travel: 'travel',
  outstation: 'travel',
  flight: 'travel',
  outdoor_event: 'outdoor_event',
  event: 'outdoor_event',
  festival: 'outdoor_event',
  farm_work: 'farm_work',
  agriculture: 'farm_work',
  farming: 'farm_work',
  irrigation_check: 'farm_work',
  beach_activity: 'beach_activity',
  beach: 'beach_activity',
  swimming: 'beach_activity',
  indoor: 'indoor',
  indoor_work: 'indoor',
  study: 'indoor',
  reading: 'indoor',
  gym_indoor: 'indoor'
};

export function normalizeActivityType(rawType) {
  if (!rawType) return 'other';
  const s = String(rawType).toLowerCase().trim().replace(/\s+/g, '_');
  return ACTIVITY_ALIAS_MAP[s] || 'other';
}

export function isWBGTRelevant(activityContext = {}) {
  let ctx = {};
  if (typeof activityContext === 'string') {
    ctx = { activity_type: normalizeActivityType(activityContext) };
  } else {
    ctx = activityContext || {};
  }

  const actRaw = ctx.activity_type || ctx.type || ctx.id || ctx.activity;
  const actKey = normalizeActivityType(typeof actRaw === 'object' ? (actRaw.type || actRaw.activity_type || actRaw.id) : actRaw);
  const profile = ACTIVITY_RELEVANCE_MATRIX[actKey] || ACTIVITY_RELEVANCE_MATRIX.other;

  const env = ctx.environment || profile.environment || 'mixed';
  if (env === 'indoor') return false;

  const intensity = ctx.physical_intensity || profile.physical_intensity || 'low';
  const exposure = ctx.exposure_duration || profile.exposure_duration || 'brief';

  if (profile.wbgt_eligible && intensity === 'high') return true;
  if (['moderate', 'high'].includes(intensity) && exposure === 'prolonged' && env === 'outdoor') return true;

  const temp = ctx.temp_c || ctx.temperature;
  if (temp && temp >= 38.0 && env === 'outdoor' && exposure === 'prolonged') return true;

  return false;
}

export function getRelevantWeatherFactors({
  activityType = null,
  activityContext = {},
  persona = 'daily_life',
  environment = null,
  intensity = null,
  mobilityType = null
} = {}) {
  const ctx = { ...activityContext };
  if (activityType) ctx.activity_type = activityType;

  const actRaw = ctx.activity_type || ctx.type || ctx.id || ctx.activity;
  const actKey = normalizeActivityType(typeof actRaw === 'object' ? (actRaw.type || actRaw.activity_type || actRaw.id) : actRaw);
  const profile = ACTIVITY_RELEVANCE_MATRIX[actKey] || ACTIVITY_RELEVANCE_MATRIX.other;

  const env = environment || ctx.environment || profile.environment;
  const physInt = intensity || ctx.physical_intensity || profile.physical_intensity;
  const mobType = mobilityType || ctx.mobility_type || profile.mobility_type;

  const primary = [...profile.primary_factors];
  const secondary = [...profile.secondary_factors];
  const safety = [...profile.safety_critical_factors];
  const contextual = [...profile.contextual_factors];
  const excluded = [...profile.excluded_factors];

  const wbgtActive = isWBGTRelevant(ctx);
  if (!wbgtActive) {
    ['primary', 'secondary', 'safety', 'contextual'].forEach(cat => {
      const arr = cat === 'primary' ? primary : (cat === 'secondary' ? secondary : (cat === 'safety' ? safety : contextual));
      const idx = arr.indexOf('WBGT');
      if (idx !== -1) arr.splice(idx, 1);
    });
    if (!excluded.includes('WBGT')) excluded.push('WBGT');
  } else {
    const exclIdx = excluded.indexOf('WBGT');
    if (exclIdx !== -1) excluded.splice(exclIdx, 1);
    if (!primary.includes('WBGT') && !secondary.includes('WBGT')) primary.push('WBGT');
  }

  const evaluatedSet = new Set([...primary, ...secondary, ...safety, ...contextual]);
  const allExcluded = new Set([...excluded, ...Array.from(CONTROLLED_WEATHER_FACTORS).filter(f => !evaluatedSet.has(f))]);

  return {
    activity_type: actKey,
    persona,
    environment: env,
    physical_intensity: physInt,
    mobility_type: mobType,
    wbgt_eligible: wbgtActive,
    primary_factors: primary,
    secondary_factors: secondary,
    safety_critical_factors: safety,
    contextual_factors: contextual,
    excluded_factors: Array.from(allExcluded).sort(),
    evaluated_factors: Array.from(evaluatedSet).sort()
  };
}

export function getContextRelevance(context = {}) {
  const persona = (context.persona || (context.selectedPersonas && context.selectedPersonas[0]) || 'daily_life').toLowerCase();
  const factors = getRelevantWeatherFactors({ activityContext: context, persona });

  const signalRelevance = {};
  CONTROLLED_WEATHER_FACTORS.forEach(factor => {
    const widgetId = FACTOR_TO_WIDGET_MAP[factor];
    if (!widgetId) return;

    if (factors.excluded_factors.includes(factor)) {
      const otherEval = factors.evaluated_factors.some(f => FACTOR_TO_WIDGET_MAP[f] === widgetId);
      if (!otherEval) signalRelevance[widgetId] = 'not_relevant';
    } else if (factors.safety_critical_factors.includes(factor)) {
      signalRelevance[widgetId] = 'critical';
    } else if (factors.primary_factors.includes(factor)) {
      signalRelevance[widgetId] = 'high';
    } else if (factors.secondary_factors.includes(factor)) {
      if (!['critical', 'high'].includes(signalRelevance[widgetId])) {
        signalRelevance[widgetId] = 'medium';
      }
    }
  });

  const applicableWidgets = new Set(
    Object.keys(signalRelevance).filter(w => signalRelevance[w] !== 'not_relevant')
  );

  return {
    activityType: factors.activity_type,
    persona,
    hasActivityContext: true,
    signalRelevance,
    applicableWidgets,
    relevanceFactors: factors
  };
}

export function getAllowedFactors(activityContext = {}, persona = 'daily_life') {
  const rel = getRelevantWeatherFactors({ activityContext, persona });
  let allowed = rel.evaluated_factors.map(f => f.toLowerCase());
  if (!rel.wbgt_eligible) {
    allowed = allowed.filter(f => f !== 'wbgt');
  }
  return Array.from(new Set(allowed)).sort();
}

export function filterSignalsByAllowedFactors(signals = [], allowedFactors = []) {
  const allowedSet = new Set(allowedFactors.map(f => f.toLowerCase()));
  return signals.filter(sig => {
    const wType = (sig.widget_type || sig.widgetType || '').toLowerCase();
    const cat = (sig.category || '').toLowerCase();
    if ((wType === 'wbgt_safety' || cat === 'heat_stress') && !allowedSet.has('wbgt')) {
      return false;
    }
    if ((wType === 'dew_factor' || cat === 'surface_grip') && !allowedSet.has('dew_point') && !allowedSet.has('surface_condition')) {
      return false;
    }
    if (['travel_disruption', 'flight_disruption'].includes(wType) && !allowedSet.has('travel_disruption') && !allowedSet.has('flight_disruption') && !allowedSet.has('flood_risk') && !allowedSet.has('severe_weather_alert')) {
      return false;
    }
    return true;
  });
}

export function validateSignalApplicability(signal = {}, context = {}) {
  const widgetType = signal.widget_type || signal.widgetType;
  if (!widgetType) return true;

  const profile = getContextRelevance(context);
  const relevance = profile.signalRelevance[widgetType];

  if (relevance === 'not_relevant') return false;
  if (widgetType === 'wbgt_safety' && !profile.relevanceFactors.wbgt_eligible) return false;

  return true;
}

