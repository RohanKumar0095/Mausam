/**
 * CONTEXTUAL NUDGE ENGINE
 * Only fires when a specific actionable condition is met.
 */

export function generateContextualNudge({
  currentTime = '06:30',
  currentActivity = null,
  weatherData = {},
  selectedPersonas = ['daily_life'],
  selectedPlot = 'Plot A (Rice)'
}) {
  const current = weatherData?.current || {};
  const temp = current.temp || 25.2;
  const rainProb = current.rainProbability || 20;
  const aqi = current.aqi || 83;
  const [currH] = currentTime.split(':').map(Number);

  const activePersonas = (selectedPersonas && selectedPersonas.length > 0)
    ? selectedPersonas
    : ['daily_life'];

  const isSport = activePersonas.includes('sportsperson');
  const isFitness = activePersonas.includes('fitness');
  const isAgri = activePersonas.includes('agriculture');
  const isCommute = activePersonas.includes('commute');
  const isEvents = activePersonas.includes('events');

  // 1. Sportsperson Nudge
  if (isSport && rainProb >= 60 && currH >= 15) {
    return {
      id: 'nudge-sport-rain',
      type: 'warning',
      title: 'Practice Rain Shift',
      message: 'Rain expected during your 6 PM practice — move indoors or reschedule to 8 AM.',
      actionText: 'View Radar',
      actionTab: 'radar'
    };
  }

  // 2. Fitness Nudge
  if (isFitness && rainProb >= 50 && currH >= 16) {
    return {
      id: 'nudge-fitness-rain',
      type: 'info',
      title: 'Workout Schedule Suggestion',
      message: 'Rain expected around 5:30 PM — shift your evening run to tomorrow 7 AM.',
      actionText: 'View Forecast',
      actionTab: 'forecast'
    };
  }

  // 3. Agriculture Nudge
  if (isAgri) {
    if (temp <= 12) {
      return {
        id: 'nudge-agri-frost',
        type: 'warning',
        title: 'Frost Risk tonight',
        message: 'Frost risk tonight — cover sensitive seedlings before 8 PM.',
        actionText: 'View Agromet',
        actionTab: 'forecast'
      };
    }
    if (rainProb < 20) {
      return {
        id: 'nudge-agri-spray',
        type: 'success',
        title: 'Optimal Spraying Window',
        message: 'No rain and gentle wind (<8 km/h) for next 36 hours. Ideal for fertilizer top-dressing.',
        actionText: 'Check Checklist',
        actionTab: 'home'
      };
    }
  }

  // 4. Commute Nudge
  if (isCommute && currH >= 15 && currH <= 18 && rainProb >= 60) {
    return {
      id: 'nudge-commute-rain',
      type: 'warning',
      title: 'Commute Rain Overlap',
      message: 'Heavy rain overlaps with your usual 4:30 PM commute — consider leaving 25 mins early.',
      actionText: 'Check Route Cast',
      actionTab: 'forecast'
    };
  }

  // 5. Events Nudge
  if (isEvents && currH >= 16 && rainProb >= 65) {
    return {
      id: 'nudge-event-rain',
      type: 'warning',
      title: 'Outdoor Event Alert',
      message: 'Passing shower likely between 7:30–8:30 PM. Keep waterproof canopy on standby.',
      actionText: 'View Rain Alert',
      actionTab: 'alerts'
    };
  }

  return null;
}
