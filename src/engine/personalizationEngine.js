import { calculateWidgetScore } from './relevanceScoreCalculator.js';
import { interpretWeatherToAction } from './weatherToActionEngine.js';
import { getAllowedWidgetsForPersonas, isWidgetAllowedForPersonas } from './personaRegistry.js';

export const CANDIDATE_WIDGETS = [
  'wbgt_safety',
  'dew_factor',
  'training_window',
  'ground_condition',
  'lightning_storm_safety',
  'running_window',
  'exercise_comfort_index',
  'outdoor_exercise_aqi',
  'workout_recommendation',
  'agri_action_checklist',
  'crop_stage_risk',
  'multi_day_rainfall',
  'irrigation_nudge',
  'frost_heat_alert',
  'pest_disease_risk',
  'current_conditions',
  'today_forecast',
  'commute_weather',
  'morning_commute_conditions',
  'return_commute_conditions',
  'two_wheeler_risk',
  'visibility_fog',
  'aqi_health',
  'uv_heat_index',
  'humidity_health_impact',
  'relative_environmental_context',
  'school_transit',
  'school_pickup_weather',
  'family_weather_alerts',
  'advance_severe_warning',
  'child_safety_recommendations',
  'outdoor_event_suitability',
  'event_forecast_timeline',
  'event_comfort_index',
  'event_wind_conditions',
  'event_contingency_backup',
  'travel_conditions',
  'saved_destination_weather',
  'travel_disruption_alerts',
  'smart_packing_checklist',
  'coastal_tide',
  'rain_probability',
  'wind_gauge'
];


const PROHIBITED_CURRENT_WIDGET_KEYS = [
  'forecast_date',
  'activity_id',
  'recommendation_status',
  'activity_window'
];

export function validateTemporalContext(widget, expectedContext = 'current') {
  if (!widget || typeof widget !== 'object') return false;
  if (widget.temporal_context !== expectedContext) return false;

  if (expectedContext === 'current') {
    for (const key of PROHIBITED_CURRENT_WIDGET_KEYS) {
      if (key in widget) return false;
    }
  }

  return true;
}

export function getRankedWidgets({
  selectedPersonas = ['daily_life'],
  currentActivity = null,
  currentTime = '06:30',
  weatherData = {},
  routine = [],
  sharedIntelligence = null,
  locationPurpose = 'Home',
  severeWarningActive = false,
  selectedPlot = 'Plot A (Rice)',
  language = 'en'
}) {
  const activePersonas = (selectedPersonas && selectedPersonas.length > 0)
    ? selectedPersonas
    : ['daily_life'];

  const allowedWidgetIds = getAllowedWidgetsForPersonas(activePersonas);

  const scored = CANDIDATE_WIDGETS
    .filter(widgetId => allowedWidgetIds.includes(widgetId))
    .map(widgetId => {
      const { score, reasons, pointsBreakdown } = calculateWidgetScore({
        widgetId,
        selectedPersonas: activePersonas,
        currentActivity,
        currentTime,
        weatherData,
        locationPurpose,
        severeWarningActive
      });

      if (score <= 0) return null;

      const actionData = interpretWeatherToAction({
        widgetId,
        weatherData,
        currentActivity,
        currentTime,
        routine,
        sharedIntelligence,
        selectedPersonas: activePersonas,
        selectedPlot,
        language
      });

      const candidateWidget = {
        id: widgetId,
        score,
        reasons,
        pointsBreakdown,
        ...actionData
      };

      if (!validateTemporalContext(candidateWidget, 'current')) {
        return null;
      }

      return candidateWidget;
    })
    .filter(Boolean);

  scored.sort((a, b) => b.score - a.score);
  return scored;
}


