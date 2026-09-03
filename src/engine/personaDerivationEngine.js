/**
 * AUTOMATIC PERSONA GENERATION ENGINE
 * Analyzes answers from 5 multi-select questions and derives
 * active user personas (Sportsperson, Fitness, Agriculture, Daily Life, Health, Commute, Events, Beach & Travel, Family).
 */

export function derivePersonasFromPreferences(preferences = {}) {
  const {
    usualDay = [],
    weatherFactors = [],
    outdoorActivities = [],
    decisionGoals = [],
    alertTypes = []
  } = preferences;

  const personaScores = {
    sportsperson: 0,
    fitness: 0,
    agriculture: 0,
    daily_life: 0,
    health: 0,
    commute: 0,
    family: 0,
    events: 0,
    travel: 0
  };

  // 1. Evaluate Usual Day
  usualDay.forEach(item => {
    if (item.includes('Sports') || item.includes('Tournament')) personaScores.sportsperson += 4;
    if (item.includes('Exercise') || item.includes('Running')) personaScores.fitness += 3;
    if (item.includes('Cycling')) { personaScores.fitness += 2; personaScores.commute += 1; }
    if (item.includes('Office') || item.includes('Work')) personaScores.commute += 2;
    if (item.includes('School') || item.includes('College')) personaScores.commute += 2;
    if (item.includes('Commute') || item.includes('Transit')) personaScores.commute += 3;
    if (item.includes('Farming') || item.includes('Agriculture')) personaScores.agriculture += 4;
    if (item.includes('Outdoor Events') || item.includes('Functions')) personaScores.events += 3;
    if (item.includes('Travelling')) personaScores.travel += 3;
    if (item.includes('Beach') || item.includes('Leisure')) personaScores.travel += 3;
    if (item.includes('Family') || item.includes('Children')) personaScores.family += 3;
    if (item.includes('Home') || item.includes('Indoor')) personaScores.daily_life += 2;
  });

  // 2. Evaluate Weather Factors
  weatherFactors.forEach(factor => {
    if (factor.includes('Air Quality')) personaScores.health += 3;
    if (factor.includes('UV') || factor.includes('Sun')) { personaScores.health += 2; personaScores.fitness += 1; }
    if (factor.includes('Temperature & Heat')) { personaScores.health += 2; personaScores.sportsperson += 1; }
    if (factor.includes('Visibility') || factor.includes('Fog')) personaScores.commute += 3;
    if (factor.includes('Road') || factor.includes('Travel')) personaScores.commute += 3;
    if (factor.includes('Rain & Thunderstorms')) { personaScores.commute += 1; personaScores.events += 1; personaScores.agriculture += 1; personaScores.sportsperson += 1; }
    if (factor.includes('Coastal') || factor.includes('Tide')) personaScores.travel += 3;
    if (factor.includes('Agriculture') || factor.includes('Soil')) personaScores.agriculture += 3;
    if (factor.includes('Sunrise / Sunset')) personaScores.daily_life += 2;
  });

  // 3. Evaluate Outdoor Activities
  outdoorActivities.forEach(act => {
    if (act.includes('Sports')) personaScores.sportsperson += 4;
    if (act.includes('Running')) personaScores.fitness += 3;
    if (act.includes('Walking')) { personaScores.fitness += 2; personaScores.daily_life += 1; }
    if (act.includes('Cycling')) { personaScores.fitness += 2; personaScores.commute += 1; }
    if (act.includes('Farm Work')) personaScores.agriculture += 3;
    if (act.includes('Commuting')) personaScores.commute += 2;
    if (act.includes('Events')) personaScores.events += 3;
    if (act.includes('Beach Activities')) personaScores.travel += 3;
    if (act.includes('Travel')) personaScores.travel += 2;
    if (act.includes('None')) personaScores.daily_life += 3;
  });

  // 4. Evaluate Decision Goals
  decisionGoals.forEach(goal => {
    if (goal.includes('exercise')) personaScores.fitness += 3;
    if (goal.includes('travel or commute')) personaScores.commute += 3;
    if (goal.includes('farm work')) personaScores.agriculture += 3;
    if (goal.includes('outdoor event')) personaScores.events += 3;
    if (goal.includes('family')) personaScores.family += 3;
    if (goal.includes('travel')) personaScores.travel += 3;
    if (goal.includes('plan my day')) personaScores.daily_life += 2;
  });

  // 5. Evaluate Alert Types
  alertTypes.forEach(alert => {
    if (alert.includes('Poor Air Quality') || alert.includes('Extreme Heat')) personaScores.health += 2;
    if (alert.includes('Travel') || alert.includes('Road')) personaScores.commute += 2;
    if (alert.includes('Agriculture')) personaScores.agriculture += 3;
    if (alert.includes('Coastal')) personaScores.travel += 3;
    if (alert.includes('Lightning') || alert.includes('Winds')) personaScores.sportsperson += 2;
  });

  // Threshold filter
  const derived = Object.keys(personaScores).filter(k => personaScores[k] >= 2);

  if (derived.length === 0) {
    return ['daily_life'];
  }

  return derived;
}
