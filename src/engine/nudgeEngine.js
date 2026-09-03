/**
 * CONTEXTUAL NUDGE ENGINE
 * Supports natural English and Hindi contextual advisories.
 */

export function generateContextualNudge({
  currentTime = '06:30',
  currentActivity = null,
  weatherData = {},
  selectedPersonas = ['daily_life'],
  selectedPlot = 'Plot A (Rice)',
  language = 'en'
}) {
  const isHindi = language === 'hi' || language === 'Hindi';
  const current = weatherData?.current || {};
  const temp = current.temp || 25.2;
  const rainProb = current.rainProbability || 20;
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
      title: isHindi ? 'अभ्यास समय में बारिश का संकेत' : 'Practice Rain Shift',
      message: isHindi 
        ? 'शाम 6:00 बजे अभ्यास के दौरान बारिश की संभावना है — अभ्यास इनडोर हॉल में स्थानांतरित करें या सुबह 8:00 बजे करें।'
        : 'Rain expected during your 6 PM practice — move indoors or reschedule to 8 AM.',
      actionText: isHindi ? 'रडार देखें' : 'View Radar',
      actionTab: 'radar'
    };
  }

  // 2. Fitness Nudge
  if (isFitness && rainProb >= 50 && currH >= 16) {
    return {
      id: 'nudge-fitness-rain',
      type: 'info',
      title: isHindi ? 'कसरत समय सुझाव' : 'Workout Schedule Suggestion',
      message: isHindi
        ? 'शाम 5:30 बजे बारिश की संभावना है — अपनी शाम की दौड़ को कल सुबह 7:00 बजे पर पुनर्निर्धारित करें।'
        : 'Rain expected around 5:30 PM — shift your evening run to tomorrow 7 AM.',
      actionText: isHindi ? 'पूर्वानुमान देखें' : 'View Forecast',
      actionTab: 'forecast'
    };
  }

  // 3. Agriculture Nudge
  if (isAgri) {
    if (temp <= 12) {
      return {
        id: 'nudge-agri-frost',
        type: 'warning',
        title: isHindi ? 'आज रात पाला पड़ने का जोखिम' : 'Frost Risk tonight',
        message: isHindi
          ? 'आज रात पाला (पाला जोखिम) पड़ने की संभावना है — संवेदनशील पौधों को रात 8 बजे से पहले ढक दें।'
          : 'Frost risk tonight — cover sensitive seedlings before 8 PM.',
        actionText: isHindi ? 'कृषि सलाह' : 'View Agromet',
        actionTab: 'forecast'
      };
    }
    if (rainProb < 20) {
      return {
        id: 'nudge-agri-spray',
        type: 'success',
        title: isHindi ? 'छिड़काव के लिए आदर्श समय' : 'Optimal Spraying Window',
        message: isHindi
          ? 'अगले 36 घंटों में बारिश नहीं होगी और हवा शांत (<8 km/h) रहेगी। उर्वरक छिड़काव के लिए उपयुक्त समय है।'
          : 'No rain and gentle wind (<8 km/h) for next 36 hours. Ideal for fertilizer top-dressing.',
        actionText: isHindi ? 'चेकलिस्ट देखें' : 'Check Checklist',
        actionTab: 'home'
      };
    }
  }

  // 4. Commute Nudge
  if (isCommute && currH >= 15 && currH <= 18 && rainProb >= 60) {
    return {
      id: 'nudge-commute-rain',
      type: 'warning',
      title: isHindi ? 'यात्रा और बारिश का समय' : 'Commute Rain Overlap',
      message: isHindi
        ? 'शाम 4:30 बजे आपकी सामान्य यात्रा के समय भारी बारिश हो सकती है — 25 मिनट पहले निकलने पर विचार करें।'
        : 'Heavy rain overlaps with your usual 4:30 PM commute — consider leaving 25 mins early.',
      actionText: isHindi ? 'मार्ग नाउकास्ट' : 'Check Route Cast',
      actionTab: 'forecast'
    };
  }

  // 5. Events Nudge
  if (isEvents && currH >= 16 && rainProb >= 65) {
    return {
      id: 'nudge-event-rain',
      type: 'warning',
      title: isHindi ? 'खुले कार्यक्रम के लिए चेतावनी' : 'Outdoor Event Alert',
      message: isHindi
        ? 'शाम 7:30 से 8:30 बजे के बीच हल्की बारिश की संभावना है। वाटरप्रूफ शामियाना तैयार रखें।'
        : 'Passing shower likely between 7:30–8:30 PM. Keep waterproof canopy on standby.',
      actionText: isHindi ? 'अलर्ट देखें' : 'View Rain Alert',
      actionTab: 'alerts'
    };
  }

  return null;
}
