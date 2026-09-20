/**
 * MAUSAM - Modular Persona Configuration & Feature Registry
 * 
 * Defines feature mappings, exclusive widget sets, primary decision targets,
 * and progressive setup requirements for each Weather Persona.
 */

export const PERSONA_REGISTRY = {
  health: {
    id: 'health',
    label: 'Health-Conscious',
    labelHi: 'स्वास्थ्य-सचेत',
    icon: 'HeartPulse',
    color: '#DC2626',
    lightColor: '#FEE2E2',
    primaryGoal: 'Manage allergy, asthma, and skin-sensitivity risks through daily environmental exposure.',
    level1Insight: 'aqi_health',
    allowedWidgets: [
      'aqi_health',
      'uv_heat_index',
      'humidity_health_impact',
      'relative_environmental_context'
    ],
    setupRequirements: []
  },
  fitness: {
    id: 'fitness',
    label: 'Fitness',
    labelHi: 'फिटनेस',
    icon: 'Activity',
    color: '#059669',
    lightColor: '#D1FAE5',
    primaryGoal: 'Optimize personal workout timing, exercise comfort, and exertion windows.',
    level1Insight: 'running_window',
    allowedWidgets: [
      'running_window',
      'exercise_comfort_index',
      'outdoor_exercise_aqi',
      'workout_recommendation'
    ],
    setupRequirements: []
  },
  sportsperson: {
    id: 'sportsperson',
    label: 'Sportsperson',
    labelHi: 'खिलाड़ी',
    icon: 'Trophy',
    color: '#D97706',
    lightColor: '#FEF3C7',
    primaryGoal: 'Provide safety and tactical weather intelligence for scheduled training or match sessions.',
    level1Insight: 'wbgt_safety',
    allowedWidgets: [
      'wbgt_safety',
      'dew_factor',
      'training_window',
      'ground_condition',
      'wind_gauge',
      'lightning_storm_safety'
    ],
    setupRequirements: []
  },
  agriculture: {
    id: 'agriculture',
    label: 'Agriculture',
    labelHi: 'कृषि',
    icon: 'Sprout',
    color: '#16A34A',
    lightColor: '#DCFCE7',
    primaryGoal: 'Weather intelligence linked to crop lifecycle, irrigation, and field actions.',
    level1Insight: 'agri_action_checklist',
    allowedWidgets: [
      'agri_action_checklist',
      'crop_stage_risk',
      'multi_day_rainfall',
      'irrigation_nudge',
      'frost_heat_alert',
      'pest_disease_risk'
    ],
    setupRequirements: ['selectedPlot']
  },
  events: {
    id: 'events',
    label: 'Event Planner',
    labelHi: 'कार्यक्रम योजनाकार',
    icon: 'CalendarDays',
    color: '#EA580C',
    lightColor: '#FFEDD5',
    primaryGoal: 'Manage weather risk, wind conditions, and rain contingency for scheduled outdoor events.',
    level1Insight: 'outdoor_event_suitability',
    allowedWidgets: [
      'outdoor_event_suitability',
      'event_forecast_timeline',
      'event_comfort_index',
      'event_wind_conditions',
      'event_contingency_backup'
    ],
    setupRequirements: ['eventSchedule']
  },
  commute: {
    id: 'commute',
    label: 'Commuter',
    labelHi: 'दैनिक यात्री',
    icon: 'Car',
    color: '#2563EB',
    lightColor: '#DBEAFE',
    primaryGoal: 'Provide safe, predictable morning departure and evening return conditions.',
    level1Insight: 'commute_weather',
    allowedWidgets: [
      'commute_weather',
      'morning_commute_conditions',
      'return_commute_conditions',
      'visibility_fog',
      'two_wheeler_risk'
    ],
    setupRequirements: []
  },
  travel: {
    id: 'travel',
    label: 'Traveler',
    labelHi: 'यात्री',
    icon: 'Compass',
    color: '#0891B2',
    lightColor: '#CFFAFE',
    primaryGoal: 'Manage weather across multiple destinations with packing and disruption guidance.',
    level1Insight: 'travel_conditions',
    allowedWidgets: [
      'travel_conditions',
      'saved_destination_weather',
      'travel_disruption_alerts',
      'smart_packing_checklist'
    ],
    setupRequirements: ['travelDestinations']
  },
  family: {
    id: 'family',
    label: 'Parent / Family',
    labelHi: 'परिवार / अभिभावक',
    icon: 'Users',
    color: '#9333EA',
    lightColor: '#F3E8FF',
    primaryGoal: 'Support family logistics, school drop-off/pickup, and child safety.',
    level1Insight: 'school_transit',
    allowedWidgets: [
      'school_transit',
      'school_pickup_weather',
      'family_weather_alerts',
      'advance_severe_warning',
      'child_safety_recommendations'
    ],
    setupRequirements: []
  },
  daily_life: {
    id: 'daily_life',
    label: 'Daily Life',
    labelHi: 'दैनिक जीवन',
    icon: 'Sun',
    color: '#0e4a7b',
    lightColor: '#EAF3FA',
    primaryGoal: 'Ambient weather overview, forecast strip, and basic daily comfort.',
    level1Insight: 'current_conditions',
    allowedWidgets: [
      'current_conditions',
      'today_forecast',
      'rain_probability'
    ],
    setupRequirements: []
  }
};

/**
 * Returns array of allowed widget IDs for a set of active personas.
 */
export function getAllowedWidgetsForPersonas(selectedPersonas = ['daily_life']) {
  const personas = selectedPersonas && selectedPersonas.length > 0 ? selectedPersonas : ['daily_life'];
  const allowedSet = new Set();

  personas.forEach(pId => {
    const config = PERSONA_REGISTRY[pId];
    if (config && config.allowedWidgets) {
      config.allowedWidgets.forEach(wId => allowedSet.add(wId));
    }
  });

  // Always include basic current condition baseline
  allowedSet.add('current_conditions');
  allowedSet.add('today_forecast');

  return Array.from(allowedSet);
}

/**
 * Checks if a widget belongs to the selected personas.
 */
export function isWidgetAllowedForPersonas(widgetId, selectedPersonas = ['daily_life']) {
  const allowedWidgets = getAllowedWidgetsForPersonas(selectedPersonas);
  return allowedWidgets.includes(widgetId);
}

/**
 * Finds which persona a widget belongs to.
 */
export function getPersonaForWidget(widgetId) {
  for (const [pId, config] of Object.entries(PERSONA_REGISTRY)) {
    if (config.allowedWidgets && config.allowedWidgets.includes(widgetId)) {
      return config;
    }
  }
  return PERSONA_REGISTRY.daily_life;
}

