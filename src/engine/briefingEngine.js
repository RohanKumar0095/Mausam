/**
 * CONTEXTUAL DAILY BRIEFING GENERATOR
 * Generates short, accurate, deterministic natural language summaries
 * tailored to active personas, time of day, and routine.
 */

export function generateDailyBriefing({
  currentTime = '06:30',
  currentActivity = null,
  weatherData = {},
  selectedPersonas = ['daily_life'],
  selectedPlot = 'Plot A (Rice)'
}) {
  const current = weatherData?.current || {};
  const temp = current.temp || 25.2;
  const aqi = current.aqi || 83;
  const aqiStatus = current.aqiStatus || 'Satisfactory';
  const rainProb = current.rainProbability || 20;

  const activePersonas = (selectedPersonas && selectedPersonas.length > 0)
    ? selectedPersonas
    : ['daily_life'];

  const isSport = activePersonas.includes('sportsperson');
  const isFitness = activePersonas.includes('fitness');
  const isAgri = activePersonas.includes('agriculture');
  const isDaily = activePersonas.includes('daily_life');
  const isCommute = activePersonas.includes('commute');
  const isHealth = activePersonas.includes('health');
  const isEvents = activePersonas.includes('events');
  const isTravel = activePersonas.includes('travel');

  const [currH] = currentTime.split(':').map(Number);

  // 1. Time greeting
  let greeting = 'Good morning';
  if (currH >= 12 && currH < 17) greeting = 'Good afternoon';
  if (currH >= 17 && currH < 22) greeting = 'Good evening';
  if (currH >= 22 || currH < 5) greeting = 'Night update';

  // 2. Persona-Specific Insights
  if (isSport && !isAgri) {
    if (rainProb >= 60) {
      return `${greeting}. Rain expected during your evening session — plan indoor drills or adjust workout timing.`;
    }
    return `${greeting}. Your 5 PM football training falls in a moderate WBGT zone today — extra water breaks recommended. No rain expected during your session.`;
  }

  if (isFitness && !isAgri && !isSport) {
    return `${greeting}. Best running window is 6–7:30 AM before humidity rises. AQI is ${aqiStatus.toLowerCase()} (${aqi}) — fine for moderate-intensity running.`;
  }

  if (isAgri) {
    const crop = (selectedPlot || 'Rice').split(' ')[0];
    if (rainProb >= 60) {
      return `${greeting}. Rain expected within 24 hours on ${crop} plot — postpone fertilizer top-dressing and foliar spray.`;
    }
    return `${greeting}. Your ${crop.toLowerCase()} crop is in a favorable stage. No rain expected for 3 days — good window for fertilizer application.`;
  }

  if (isCommute && currH >= 15 && currH <= 19) {
    if (rainProb >= 60) {
      return `${greeting}. Heavy rain overlaps with your 4:30 PM commute — consider leaving 20 minutes early.`;
    }
    return `${greeting}. Arterial roads and visibility remain clear for your evening commute.`;
  }

  if (isTravel || isEvents) {
    if (currH >= 17) {
      return `${greeting}. Pleasant evening conditions (25°C) with gentle breeze for your outdoor gathering.`;
    }
    return `${greeting}. Clear visibility and favorable coastal breeze for travel activities.`;
  }

  // Blended / Daily Life Fallback
  if (isHealth && isFitness) {
    return `${greeting}. Mild temperature (${temp}°C) and ${aqiStatus.toLowerCase()} air quality. Favorable for morning cardio.`;
  }

  return `${greeting}. Pleasant day ahead with mild temperatures (${temp}°C) and no rain expected. AQI is ${aqiStatus.toLowerCase()}.`;
}
