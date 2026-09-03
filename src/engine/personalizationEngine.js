import { calculateWidgetScore } from './relevanceScoreCalculator';
import { interpretWeatherToAction } from './weatherToActionEngine';

export const CANDIDATE_WIDGETS = [
  'wbgt_safety',
  'dew_factor',
  'training_window',
  'ground_condition',
  'running_window',
  'agri_action_checklist',
  'multi_day_rainfall',
  'irrigation_nudge',
  'frost_heat_alert',
  'pest_disease_risk',
  'current_conditions',
  'today_forecast',
  'commute_weather',
  'visibility_fog',
  'aqi_health',
  'uv_heat_index',
  'school_transit',
  'outdoor_event_suitability',
  'travel_conditions',
  'coastal_tide',
  'rain_probability',
  'wind_gauge'
];

export function getRankedWidgets({
  selectedPersonas = ['daily_life'],
  currentActivity = null,
  currentTime = '06:30',
  weatherData = {},
  locationPurpose = 'Home',
  severeWarningActive = false,
  selectedPlot = 'Plot A (Rice)',
  language = 'en'
}) {
  const scored = CANDIDATE_WIDGETS.map(widgetId => {
    const { score, reasons, pointsBreakdown } = calculateWidgetScore({
      widgetId,
      selectedPersonas,
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
      selectedPersonas,
      selectedPlot,
      language
    });

    return {
      id: widgetId,
      score,
      reasons,
      pointsBreakdown,
      ...actionData
    };
  }).filter(Boolean);

  scored.sort((a, b) => b.score - a.score);
  return scored;
}
