import { calculateWidgetScore } from './relevanceScoreCalculator.js';
import { interpretWeatherToAction } from './weatherToActionEngine.js';

export const ALL_CANDIDATE_WIDGETS = [
  { id: 'wbgt_safety', label: 'WBGT Training Safety' },
  { id: 'dew_factor', label: 'Dew Factor & Ball Grip' },
  { id: 'training_window', label: 'Training / Match Window' },
  { id: 'ground_condition', label: 'Ground & Pitch Condition' },
  { id: 'running_window', label: 'Best Running / Workout Hours' },
  { id: 'agri_action_checklist', label: 'Crop Action Checklist' },
  { id: 'multi_day_rainfall', label: 'Multi-Day Rainfall Trend' },
  { id: 'irrigation_nudge', label: 'Irrigation Nudge' },
  { id: 'frost_heat_alert', label: 'Frost / Heat Alert' },
  { id: 'pest_disease_risk', label: 'Disease / Pest Risk Flag' },
  { id: 'current_conditions', label: 'Current Ambient Weather' },
  { id: 'today_forecast', label: "Today's Forecast" },
  { id: 'commute_weather', label: 'Commute Conditions' },
  { id: 'visibility_fog', label: 'Transit Visibility' },
  { id: 'aqi_health', label: 'Air Quality (AQI)' },
  { id: 'uv_heat_index', label: 'UV & Heat Index' },
  { id: 'school_transit', label: 'School & Transit Safety' },
  { id: 'outdoor_event_suitability', label: 'Outdoor Event Feasibility' },
  { id: 'travel_conditions', label: 'Destination Weather' },
  { id: 'coastal_tide', label: 'High Tide & Coastal Conditions' },
  { id: 'rain_probability', label: 'Precipitation Timeline' },
  { id: 'wind_gauge', label: 'Surface Wind Gauge' },
];

export function getRankedWidgets({
  selectedPersonas = ['daily_life'],
  currentActivity = null,
  currentTime = '06:30',
  weatherData = {},
  locationPurpose = 'Home',
  severeWarningActive = false,
  selectedPlot = 'Plot A (Rice)'
}) {
  const scored = [];

  for (const widget of ALL_CANDIDATE_WIDGETS) {
    const scoreResult = calculateWidgetScore({
      widgetId: widget.id,
      selectedPersonas,
      currentActivity,
      currentTime,
      weatherData,
      locationPurpose,
      severeWarningActive,
      selectedPlot
    });

    if (scoreResult.score > 0) {
      const interpretation = interpretWeatherToAction({
        widgetId: widget.id,
        weatherData,
        currentActivity,
        currentTime,
        selectedPersonas,
        selectedPlot
      });

      scored.push({
        id: widget.id,
        label: widget.label,
        score: scoreResult.score,
        breakdown: scoreResult.breakdown,
        ...interpretation
      });
    }
  }

  scored.sort((a, b) => b.score - a.score);
  return scored;
}
