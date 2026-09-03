/**
 * Multi-lingual Intent & Context Extractor for MAUSAM Chatbot (English & Hindi)
 */

export function detectIntent(query = '', language = 'en') {
  const q = query.toLowerCase().trim();

  // 1. Extract requested time (e.g. "6:15 pm", "6 pm", "7 pm", "tonight", "tomorrow", "शाम 6:15", "आज रात", "कल")
  let requestedTime = null;
  const time12Regex = /(\d{1,2})(:(\d{2}))?\s*(am|pm|बजे)/i;
  const timeMatch = q.match(time12Regex);

  if (timeMatch) {
    let hour = parseInt(timeMatch[1], 10);
    const minute = timeMatch[3] ? timeMatch[3] : '00';
    const period = (timeMatch[4] || '').toLowerCase();

    if (period === 'pm' || q.includes('शाम') || q.includes('रात') || q.includes('evening') || q.includes('night')) {
      if (hour < 12) hour += 12;
    }
    requestedTime = `${String(hour).padStart(2, '0')}:${minute}`;
  } else if (q.includes('tonight') || q.includes('आज रात') || q.includes('night')) {
    requestedTime = '20:00';
  } else if (q.includes('tomorrow morning') || q.includes('कल सुबह')) {
    requestedTime = '07:00';
  } else if (q.includes('tomorrow') || q.includes('कल')) {
    requestedTime = '10:00';
  } else if (q.includes('now') || q.includes('अभी')) {
    requestedTime = 'now';
  }

  // 2. Extract requested location
  let targetLocation = null;
  if (q.includes('office') || q.includes('work') || q.includes('कार्यालय') || q.includes('दफ्तर')) {
    targetLocation = 'office';
  } else if (q.includes('home') || q.includes('घर')) {
    targetLocation = 'home';
  } else if (q.includes('farm') || q.includes('खेत') || q.includes('खेती')) {
    targetLocation = 'farm';
  } else if (q.includes('college') || q.includes('school') || q.includes('कॉलेज') || q.includes('स्कूल')) {
    targetLocation = 'college';
  } else if (q.includes('mumbai') || q.includes('मुंबई')) {
    targetLocation = 'mumbai';
  } else if (q.includes('park') || q.includes('पार्क')) {
    targetLocation = 'park';
  }

  // 3. Extract activity topic
  let activityType = 'general';
  if (q.includes('run') || q.includes('jog') || q.includes('walk') || q.includes('दौड़') || q.includes('टहल')) {
    activityType = 'fitness';
  } else if (q.includes('commute') || q.includes('leave') || q.includes('travel') || q.includes('यात्रा') || q.includes('निकल') || q.includes('सड़क')) {
    activityType = 'commute';
  } else if (q.includes('spray') || q.includes('crop') || q.includes('irrigation') || q.includes('फसल') || q.includes('छिड़काव') || q.includes('सिंचाई')) {
    activityType = 'agriculture';
  } else if (q.includes('event') || q.includes('party') || q.includes('function') || q.includes('कार्यक्रम') || q.includes('उत्सव')) {
    activityType = 'event';
  } else if (q.includes('sport') || q.includes('match') || q.includes('football') || q.includes('cricket') || q.includes('खेल') || q.includes('प्रशिक्षण')) {
    activityType = 'sports';
  } else if (q.includes('rain') || q.includes('बारिश') || q.includes('पानी')) {
    activityType = 'rain';
  }

  return {
    rawQuery: query,
    requestedTime,
    targetLocation,
    activityType,
    isTemporaryRoutineQuery: !!(requestedTime && requestedTime !== 'now')
  };
}
