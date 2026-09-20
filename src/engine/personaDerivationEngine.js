/**
 * AUTOMATIC PERSONA GENERATION ENGINE
 * Analyzes answers from multi-select preference questions and custom user decisions,
 * dynamically deriving active user personas:
 * (Sportsperson, Fitness, Agriculture, Daily Life, Health, Commute, Events, Beach & Travel, Family).
 */

/**
 * Resolves the Weather Persona(s) explicitly selected by the user in Step 1 of the personalization flow.
 * Serves as the SINGLE SOURCE OF TRUTH for both "Derived Weather Personas" and "Active Profiles".
 */
export function getStep1Personas(preferences = null) {
  const pref = preferences || (typeof localStorage !== 'undefined' ? JSON.parse(localStorage.getItem('mausam_preferences') || 'null') : null);
  const usualDay = pref?.usualDay || [];

  if (!Array.isArray(usualDay) || usualDay.length === 0) {
    try {
      const savedPersonas = typeof localStorage !== 'undefined' ? JSON.parse(localStorage.getItem('mausam_personas') || 'null') : null;
      if (Array.isArray(savedPersonas) && savedPersonas.length > 0) {
        return savedPersonas;
      }
    } catch (e) {}

    return ['daily_life'];
  }

  const selectedPersonas = [];

  usualDay.forEach(choice => {
    const text = (choice || '').toLowerCase();
    
    if ((text.includes('sport') || text.includes('खिलाड़ी')) && !selectedPersonas.includes('sportsperson')) {
      selectedPersonas.push('sportsperson');
    }
    if ((text.includes('health') || text.includes('स्वास्थ्य') || text.includes('conscioius')) && !selectedPersonas.includes('health')) {
      selectedPersonas.push('health');
    }
    if ((text.includes('agri') || text.includes('farm') || text.includes('कृषि')) && !selectedPersonas.includes('agriculture')) {
      selectedPersonas.push('agriculture');
    }
    if ((text.includes('event') || text.includes('आयोजक') || text.includes('planner')) && !selectedPersonas.includes('events')) {
      selectedPersonas.push('events');
    }
    if ((text.includes('commut') || text.includes('जाने वाला')) && !selectedPersonas.includes('commute')) {
      selectedPersonas.push('commute');
    }
    if ((text.includes('travel') || text.includes('सफ़र')) && !selectedPersonas.includes('travel')) {
      selectedPersonas.push('travel');
    }
    if ((text.includes('parent') || text.includes('माता-पिता') || text.includes('family')) && !selectedPersonas.includes('family')) {
      selectedPersonas.push('family');
    }
    if ((text.includes('fitness') || text.includes('running') || text.includes('cycling') || text.includes('व्यायाम') || text.includes('दौड़')) && !selectedPersonas.includes('fitness')) {
      selectedPersonas.push('fitness');
    }
    if ((text.includes('daily') || text.includes('home') || text.includes('घर')) && !selectedPersonas.includes('daily_life')) {
      selectedPersonas.push('daily_life');
    }
  });

  return selectedPersonas.length > 0 ? selectedPersonas : ['daily_life'];
}

export function derivePersonasFromPreferences(preferences = {}) {
  // If Step 1 preferences exist, prioritize Step 1 selections
  const step1 = getStep1Personas(preferences);
  if (step1 && step1.length > 0) {
    return step1;
  }

  const {
    usualDay = [],
    weatherFactors = [],
    decisionGoals = [],
    customDecisions = [],
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
    const text = (item || '').toLowerCase();
    if (text.includes('sports') || text.includes('tournament') || text.includes('खेलकूद')) personaScores.sportsperson += 4;
    if (text.includes('exercise') || text.includes('running') || text.includes('व्यायाम') || text.includes('दौड़')) personaScores.fitness += 3;
    if (text.includes('cycling') || text.includes('साइकिल')) { personaScores.fitness += 2; personaScores.commute += 1; }
    if (text.includes('office') || text.includes('work') || text.includes('कार्यालय') || text.includes('नौकरी')) personaScores.commute += 2;
    if (text.includes('school') || text.includes('college') || text.includes('स्कूल') || text.includes('कॉलेज')) personaScores.commute += 2;
    if (text.includes('commute') || text.includes('transit') || text.includes('दैनिक यात्रा')) personaScores.commute += 3;
    if (text.includes('farming') || text.includes('agriculture') || text.includes('खेती') || text.includes('कृषि')) personaScores.agriculture += 4;
    if (text.includes('events') || text.includes('functions') || text.includes('कार्यक्रम') || text.includes('उत्सव')) personaScores.events += 3;
    if (text.includes('travelling') || text.includes('travel') || text.includes('लंबी यात्रा') || text.includes('भ्रमण')) personaScores.travel += 3;
    if (text.includes('beach') || text.includes('leisure') || text.includes('समुद्र तट')) personaScores.travel += 3;
    if (text.includes('family') || text.includes('children') || text.includes('परिवार') || text.includes('बच्चों')) personaScores.family += 3;
    if (text.includes('home') || text.includes('indoor') || text.includes('घर पर') || text.includes('इनडोर')) personaScores.daily_life += 2;
  });

  // Threshold filter: personas with score >= 2 are considered active
  const derived = Object.keys(personaScores).filter(k => personaScores[k] >= 2);

  if (derived.length === 0) {
    return ['daily_life'];
  }

  return derived;
}

