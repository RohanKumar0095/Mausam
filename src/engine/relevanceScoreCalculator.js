/**
 * RELEVANCE SCORING ENGINE (Rule-Based, Context-Aware)
 * 
 * Formula:
 * Relevance Score = Persona Match (0-30)
 *                 + Activity Context Alignment (0-30)
 *                 + Time Proximity Factor (0-20)
 *                 + Weather Threshold Sensitivity (0-15)
 *                 + Location Purpose Modifier (0-5)
 */

export function calculateWidgetScore({
  widgetId,
  selectedPersonas = [],
  currentActivity = null,
  currentTime = '06:30',
  weatherData = {},
  locationPurpose = 'Home',
  severeWarningActive = false,
  selectedPlot = 'Plot A (Rice)'
}) {
  let personaPoints = 0;
  let activityPoints = 0;
  let timePoints = 0;
  let weatherPoints = 0;
  let locationPoints = 0;
  const breakdownReasons = [];

  // Default to Daily Life if empty
  const activePersonas = (selectedPersonas && selectedPersonas.length > 0)
    ? selectedPersonas
    : ['daily_life'];

  const isSport = activePersonas.includes('sportsperson');
  const isFitness = activePersonas.includes('fitness');
  const isAgri = activePersonas.includes('agriculture');
  const isDaily = activePersonas.includes('daily_life');
  const isHealth = activePersonas.includes('health');
  const isCommute = activePersonas.includes('commute');
  const isFamily = activePersonas.includes('family');
  const isEvents = activePersonas.includes('events');
  const isTravel = activePersonas.includes('travel');

  const timeMinutes = parseTimeToMinutes(currentTime);

  // 1. Persona Alignment Points
  switch (widgetId) {
    case 'wbgt_safety':
      if (isSport) { personaPoints += 30; breakdownReasons.push('Sportsperson preference active (+30)'); }
      break;
    case 'dew_factor':
      if (isSport) { personaPoints += 26; breakdownReasons.push('Sportsperson pitch & dew monitoring (+26)'); }
      break;
    case 'training_window':
      if (isSport) { personaPoints += 28; breakdownReasons.push('Sportsperson training schedule (+28)'); }
      if (isFitness) { personaPoints += 10; breakdownReasons.push('Fitness session overlap (+10)'); }
      break;
    case 'ground_condition':
      if (isSport) { personaPoints += 26; breakdownReasons.push('Sportsperson turf traction index (+26)'); }
      if (isEvents) { personaPoints += 10; breakdownReasons.push('Outdoor venue surface check (+10)'); }
      break;
    case 'lightning_storm_safety':
      if (isSport) { personaPoints += 30; breakdownReasons.push('Sportsperson storm safety alert (+30)'); }
      if (isEvents) { personaPoints += 15; breakdownReasons.push('Outdoor event lightning check (+15)'); }
      break;

    case 'running_window':
      if (isFitness) { personaPoints += 30; breakdownReasons.push('Fitness workout preference (+30)'); }
      if (isSport) { personaPoints += 12; breakdownReasons.push('Conditioning hours check (+12)'); }
      if (isHealth) { personaPoints += 10; breakdownReasons.push('Outdoor aerobic exercise (+10)'); }
      break;
    case 'exercise_comfort_index':
      if (isFitness) { personaPoints += 28; breakdownReasons.push('Exercise comfort rating (+28)'); }
      if (isHealth) { personaPoints += 14; breakdownReasons.push('Health exertion safety (+14)'); }
      break;
    case 'outdoor_exercise_aqi':
      if (isFitness) { personaPoints += 26; breakdownReasons.push('AQI exertion guidance (+26)'); }
      if (isHealth) { personaPoints += 20; breakdownReasons.push('Respiratory outdoor risk (+20)'); }
      break;
    case 'workout_recommendation':
      if (isFitness) { personaPoints += 28; breakdownReasons.push('Workout recommendation (+28)'); }
      break;

    case 'agri_action_checklist':
      if (isAgri) { personaPoints += 30; breakdownReasons.push('Agriculture crop management (+30)'); }
      break;
    case 'crop_stage_risk':
      if (isAgri) { personaPoints += 28; breakdownReasons.push('Crop growth stage vulnerability (+28)'); }
      break;
    case 'multi_day_rainfall':
      if (isAgri) { personaPoints += 28; breakdownReasons.push('Agriculture multi-day rainfall trend (+28)'); }
      if (isTravel) { personaPoints += 12; breakdownReasons.push('Trip planning rain outlook (+12)'); }
      if (isDaily) { personaPoints += 10; breakdownReasons.push('Weekly rain schedule (+10)'); }
      break;
    case 'irrigation_nudge':
      if (isAgri) { personaPoints += 28; breakdownReasons.push('Soil moisture & canal irrigation (+28)'); }
      break;
    case 'frost_heat_alert':
      if (isAgri) { personaPoints += 26; breakdownReasons.push('Vegetative frost/heat strain (+26)'); }
      if (isHealth) { personaPoints += 12; breakdownReasons.push('Ambient heat strain warning (+12)'); }
      break;
    case 'pest_disease_risk':
      if (isAgri) { personaPoints += 26; breakdownReasons.push('Fungal/pest humidity heuristic (+26)'); }
      break;

    case 'current_conditions':
      if (isDaily) { personaPoints += 30; breakdownReasons.push('Daily Life default overview (+30)'); }
      else { personaPoints += 10; breakdownReasons.push('General ambient baseline (+10)'); }
      break;
    case 'today_forecast':
      if (isDaily) { personaPoints += 28; breakdownReasons.push('Daily Life today forecast (+28)'); }
      else { personaPoints += 12; breakdownReasons.push('Day-to-day outlook (+12)'); }
      break;

    case 'commute_weather':
      if (isCommute) { personaPoints += 30; breakdownReasons.push('Commuter transit route active (+30)'); }
      if (isFamily) { personaPoints += 10; breakdownReasons.push('Family transit protection (+10)'); }
      if (isDaily) { personaPoints += 8; breakdownReasons.push('Daily travel advisory (+8)'); }
      break;
    case 'morning_commute_conditions':
      if (isCommute) { personaPoints += 28; breakdownReasons.push('Morning commute window (+28)'); }
      break;
    case 'return_commute_conditions':
      if (isCommute) { personaPoints += 28; breakdownReasons.push('Return commute window (+28)'); }
      break;
    case 'visibility_fog':
      if (isCommute) { personaPoints += 25; breakdownReasons.push('Highway & transit visibility (+25)'); }
      if (isTravel) { personaPoints += 15; breakdownReasons.push('Flight & intercity visibility (+15)'); }
      break;
    case 'two_wheeler_risk':
      if (isCommute) { personaPoints += 28; breakdownReasons.push('Two-wheeler weather exposure (+28)'); }
      break;

    case 'aqi_health':
      if (isHealth) { personaPoints += 30; breakdownReasons.push('Health respiratory monitoring (+30)'); }
      if (isFitness) { personaPoints += 18; breakdownReasons.push('Cardio inhalation safety (+18)'); }
      if (isFamily) { personaPoints += 12; breakdownReasons.push('Child & elder protection (+12)'); }
      if (isDaily) { personaPoints += 15; breakdownReasons.push('Ambient air status (+15)'); }
      break;
    case 'uv_heat_index':
      if (isHealth) { personaPoints += 22; breakdownReasons.push('Solar radiation & heat stress (+22)'); }
      if (isFitness) { personaPoints += 18; breakdownReasons.push('Workout UV safety (+18)'); }
      if (isSport) { personaPoints += 16; breakdownReasons.push('Matchday sun exposure (+16)'); }
      if (isAgri) { personaPoints += 14; breakdownReasons.push('Field worker sun protection (+14)'); }
      break;
    case 'humidity_health_impact':
      if (isHealth) { personaPoints += 28; breakdownReasons.push('Humidity health impact (+28)'); }
      if (isFitness) { personaPoints += 14; breakdownReasons.push('Humidity discomfort (+14)'); }
      break;
    case 'relative_environmental_context':
      if (isHealth) { personaPoints += 26; breakdownReasons.push('Relative environmental context (+26)'); }
      if (isDaily) { personaPoints += 10; breakdownReasons.push('Comparative weather trend (+10)'); }
      break;

    case 'school_transit':
      if (isFamily) { personaPoints += 30; breakdownReasons.push('Family school drop-off shield (+30)'); }
      if (isCommute) { personaPoints += 10; breakdownReasons.push('Morning rush-hour coordination (+10)'); }
      break;
    case 'school_pickup_weather':
      if (isFamily) { personaPoints += 28; breakdownReasons.push('School pickup window (+28)'); }
      break;
    case 'family_weather_alerts':
      if (isFamily) { personaPoints += 30; breakdownReasons.push('Family weather alerts (+30)'); }
      break;
    case 'advance_severe_warning':
      if (isFamily) { personaPoints += 28; breakdownReasons.push('Advance severe weather warning (+28)'); }
      if (isCommute) { personaPoints += 12; breakdownReasons.push('Transit advance warning (+12)'); }
      break;
    case 'child_safety_recommendations':
      if (isFamily) { personaPoints += 28; breakdownReasons.push('Child safety recommendations (+28)'); }
      break;

    case 'outdoor_event_suitability':
      if (isEvents) { personaPoints += 30; breakdownReasons.push('Outdoor event feasibility (+30)'); }
      if (isFamily) { personaPoints += 10; breakdownReasons.push('Weekend family outing (+10)'); }
      break;
    case 'event_forecast_timeline':
      if (isEvents) { personaPoints += 28; breakdownReasons.push('Event extended forecast timeline (+28)'); }
      break;
    case 'event_comfort_index':
      if (isEvents) { personaPoints += 26; breakdownReasons.push('Event-time comfort index (+26)'); }
      break;
    case 'event_wind_conditions':
      if (isEvents) { personaPoints += 26; breakdownReasons.push('Event wind exposure check (+26)'); }
      if (isSport) { personaPoints += 12; breakdownReasons.push('Crosswind check (+12)'); }
      break;
    case 'event_contingency_backup':
      if (isEvents) { personaPoints += 30; breakdownReasons.push('Event rain contingency backup (+30)'); }
      break;

    case 'travel_conditions':
      if (isTravel) { personaPoints += 30; breakdownReasons.push('Travel destination conditions (+30)'); }
      break;
    case 'saved_destination_weather':
      if (isTravel) { personaPoints += 28; breakdownReasons.push('Saved multi-destination weather (+28)'); }
      break;
    case 'travel_disruption_alerts':
      if (isTravel) { personaPoints += 30; breakdownReasons.push('Travel disruption alerts (+30)'); }
      break;
    case 'smart_packing_checklist':
      if (isTravel) { personaPoints += 26; breakdownReasons.push('Smart packing checklist (+26)'); }
      break;
    case 'coastal_tide':
      if (isTravel) { personaPoints += 28; breakdownReasons.push('Coastal tide & sea breeze (+28)'); }
      break;

    case 'temperature_feels':
      if (isFitness || isDaily || isHealth) { personaPoints += 18; breakdownReasons.push('Thermal comfort index (+18)'); }
      else { personaPoints += 10; }
      break;
    case 'rain_probability':
      if (isCommute || isEvents || isAgri || isDaily) { personaPoints += 20; breakdownReasons.push('Rain probability timeline (+20)'); }
      else { personaPoints += 10; }
      break;
    case 'wind_gauge':
      if (isSport || isFitness || isAgri || isEvents) { personaPoints += 18; breakdownReasons.push('Wind speed & direction gauge (+18)'); }
      else { personaPoints += 8; }
      break;

    default:
      personaPoints = 10;
  }


  // Filter out specialized widgets if 0 persona points
  const isSpecialized = [
    'wbgt_safety', 'dew_factor', 'ground_condition',
    'agri_action_checklist', 'irrigation_nudge', 'frost_heat_alert', 'pest_disease_risk',
    'school_transit', 'coastal_tide', 'travel_conditions'
  ].includes(widgetId);

  if (isSpecialized && personaPoints === 0) {
    return { score: 0, breakdown: { personaPoints: 0, activityPoints: 0, timePoints: 0, weatherPoints: 0, locationPoints: 0, reasons: [] } };
  }

  // 2. Activity Context Alignment (0 - 30)
  if (currentActivity) {
    const actType = currentActivity.type;

    if (actType === 'sports') {
      if (widgetId === 'wbgt_safety' || widgetId === 'dew_factor' || widgetId === 'training_window' || widgetId === 'ground_condition') {
        activityPoints += 30;
        breakdownReasons.push(`Active session is "${currentActivity.label}" (+30)`);
      }
    } else if (actType === 'running' || actType === 'walking' || actType === 'cycling') {
      if (widgetId === 'running_window' || widgetId === 'temperature_feels') {
        activityPoints += 30;
        breakdownReasons.push(`Active routine is "${currentActivity.label}" (+30)`);
      }
    } else if (actType === 'farm_work') {
      if (widgetId === 'agri_action_checklist' || widgetId === 'irrigation_nudge' || widgetId === 'frost_heat_alert') {
        activityPoints += 30;
        breakdownReasons.push(`Active farm operation "${currentActivity.label}" (+30)`);
      }
    } else if (actType === 'commute' || actType === 'college' || actType === 'office') {
      if (widgetId === 'commute_weather' || widgetId === 'visibility_fog') {
        activityPoints += 30;
        breakdownReasons.push(`Active transit is "${currentActivity.label}" (+30)`);
      }
    } else if (actType === 'outdoor_event') {
      if (widgetId === 'outdoor_event_suitability' || widgetId === 'rain_probability') {
        activityPoints += 30;
        breakdownReasons.push(`Active gathering is "${currentActivity.label}" (+30)`);
      }
    } else if (actType === 'beach' || actType === 'travel') {
      if (widgetId === 'coastal_tide' || widgetId === 'travel_conditions') {
        activityPoints += 30;
        breakdownReasons.push(`Active travel is "${currentActivity.label}" (+30)`);
      }
    }
  }

  // 3. Time Proximity Factor (0 - 20)
  if (timeMinutes >= 330 && timeMinutes <= 540) { // 05:30 - 09:00 Morning
    if (widgetId === 'running_window' || widgetId === 'wbgt_safety') { timePoints += 20; breakdownReasons.push('Prime morning workout / training window (+20)'); }
    if (widgetId === 'agri_action_checklist') { timePoints += 18; breakdownReasons.push('Morning farm inspection window (+18)'); }
    if (widgetId === 'school_transit') { timePoints += 18; breakdownReasons.push('Morning school departure (+18)'); }
    if (widgetId === 'current_conditions') { timePoints += 15; breakdownReasons.push('Morning daily overview (+15)'); }
  } else if (timeMinutes > 540 && timeMinutes < 960) { // 09:00 - 16:00 Midday
    if (widgetId === 'uv_heat_index' || widgetId === 'frost_heat_alert') { timePoints += 20; breakdownReasons.push('Peak solar heat radiation (+20)'); }
    if (widgetId === 'aqi_health') { timePoints += 16; breakdownReasons.push('Midday ambient exposure (+16)'); }
    if (widgetId === 'today_forecast') { timePoints += 14; breakdownReasons.push('Afternoon progress track (+14)'); }
  } else if (timeMinutes >= 960 && timeMinutes <= 1110) { // 16:00 - 18:30 Evening
    if (widgetId === 'commute_weather' || widgetId === 'visibility_fog') { timePoints += 20; breakdownReasons.push('Peak evening rush hour transit (+20)'); }
    if (widgetId === 'wbgt_safety' || widgetId === 'training_window' || widgetId === 'dew_factor') { timePoints += 20; breakdownReasons.push('Evening sports practice overlap (+20)'); }
    if (widgetId === 'rain_probability') { timePoints += 16; breakdownReasons.push('Evening precipitation risk (+16)'); }
  } else if (timeMinutes > 1110 && timeMinutes <= 1380) { // 18:30 - 23:00 Night
    if (widgetId === 'outdoor_event_suitability') { timePoints += 20; breakdownReasons.push('Evening event hours (+20)'); }
    if (widgetId === 'dew_factor') { timePoints += 18; breakdownReasons.push('Night dew point onset (+18)'); }
    if (widgetId === 'multi_day_rainfall') { timePoints += 14; breakdownReasons.push('Next-day preparation (+14)'); }
  }

  // 4. Weather Threshold Sensitivity (0 - 15)
  const currentRainPop = weatherData.current?.rainProbability || 20;
  const currentTemp = weatherData.current?.temp || 26;
  const currentUv = weatherData.current?.uvIndex || 4;
  const currentAqi = weatherData.current?.aqi || 80;

  if (widgetId === 'wbgt_safety' && currentTemp >= 28) {
    weatherPoints += 15;
    breakdownReasons.push(`Elevated ambient heat (${currentTemp}°C) triggers thermal safety alert (+15)`);
  } else if (widgetId === 'rain_probability' && currentRainPop >= 60) {
    weatherPoints += 15;
    breakdownReasons.push(`High rain risk (${currentRainPop}%) demands priority (+15)`);
  } else if (widgetId === 'commute_weather' && currentRainPop >= 50) {
    weatherPoints += 15;
    breakdownReasons.push('Rain during transit window (+15)');
  } else if (widgetId === 'aqi_health' && currentAqi > 100) {
    weatherPoints += 15;
    breakdownReasons.push(`Elevated AQI (${currentAqi}) demands respiratory alert (+15)`);
  } else if (widgetId === 'uv_heat_index' && currentUv >= 7) {
    weatherPoints += 15;
    breakdownReasons.push(`High UV (${currentUv}) requires sun protection alert (+15)`);
  } else {
    weatherPoints += 6;
  }

  // 5. Location Purpose Modifier (0 - 5)
  const lp = (locationPurpose || '').toLowerCase();
  if (lp.includes('farm') || lp.includes('agri')) {
    if (widgetId.startsWith('agri') || widgetId === 'irrigation_nudge' || widgetId === 'frost_heat_alert' || widgetId === 'pest_disease_risk') {
      locationPoints += 5;
      breakdownReasons.push('Registered as Farm location (+5)');
    }
  } else if (lp.includes('office') || lp.includes('transit')) {
    if (widgetId === 'commute_weather' || widgetId === 'visibility_fog') {
      locationPoints += 5;
      breakdownReasons.push('Registered as Office / Transit location (+5)');
    }
  } else if (lp.includes('sports') || lp.includes('academic') || lp.includes('tech')) {
    if (widgetId === 'wbgt_safety' || widgetId === 'training_window' || widgetId === 'ground_condition') {
      locationPoints += 5;
      breakdownReasons.push('Registered Sports / Complex location (+5)');
    }
  } else if (lp.includes('travel') || lp.includes('beach')) {
    if (widgetId === 'travel_conditions' || widgetId === 'coastal_tide') {
      locationPoints += 5;
      breakdownReasons.push('Registered as Coastal / Travel destination (+5)');
    }
  }

  const totalScore = Math.min(100, Math.max(5, personaPoints + activityPoints + timePoints + weatherPoints + locationPoints));

  return {
    score: totalScore,
    breakdown: {
      personaPoints,
      activityPoints,
      timePoints,
      weatherPoints,
      locationPoints,
      reasons: breakdownReasons
    }
  };
}

function parseTimeToMinutes(timeStr) {
  if (!timeStr) return 390;
  const [h, m] = timeStr.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}
