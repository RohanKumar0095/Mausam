/**
 * SAFETY OVERRIDE SYSTEM (IMD Official Protocol)
 * Safety ALWAYS overrides personalization.
 */

export function evaluateSafetyOverride({
  weatherData = {},
  simulatedSeverity = null,
  currentActivity = null,
  selectedPersonas = []
}) {
  const officialWarning = weatherData.warning || {
    level: 'GREEN',
    headline: 'NO WARNING (NO ACTION)',
    description: 'No severe weather alert active for selected district.',
    validUntil: '04 Sept 2026'
  };

  const level = simulatedSeverity || officialWarning.level || 'GREEN';

  const isSevere = level === 'RED';
  const isCaution = level === 'AMBER';
  const isSafe = level === 'GREEN';

  let headline = officialWarning.headline;
  let description = officialWarning.description;
  let impactAdvice = null;

  if (level === 'RED') {
    headline = '🔴 SEVERE WEATHER WARNING — IMMEDIATE ACTION REQUIRED';
    description = 'Very severe thunderstorm with intense squall winds (60–75 km/h), heavy downpours and active cloud-to-ground lightning.';
    impactAdvice = 'IMD Protocol: Suspend all non-essential outdoor travel and field activities immediately. Seek sturdy shelter.';
  } else if (level === 'AMBER') {
    headline = '🟠 WEATHER CAUTION — BE PREPARED';
    description = officialWarning.description || 'Moderate thunderstorm with gusty winds (35–45 km/h) and localized waterlogging.';
    impactAdvice = currentActivity ? `Caution during "${currentActivity.label}": Carry umbrella and avoid open grounds.` : 'Take precautions while commuting.';
  } else {
    headline = '🟢 NO WARNING (NO ACTION)';
    description = 'Normal seasonal weather parameters. Safe for daily scheduled routines.';
    impactAdvice = 'All planned activities are safe under current atmospheric conditions.';
  }

  return {
    level,
    isSevere,
    isCaution,
    isSafe,
    headline,
    description,
    impactAdvice,
    validUntil: officialWarning.validUntil || '03 Sept 2026 23:59 IST',
    source: 'India Meteorological Department (IMD)'
  };
}
