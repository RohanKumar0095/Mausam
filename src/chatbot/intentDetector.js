/**
 * Multi-lingual Intent & Context Extractor for MAUSAM Assistant (English & Hindi)
 * 
 * Classifies query intent into 3 distinct operational layers:
 * 1. INFORM (Pure weather facts) -> pure_info_query
 * 2. INTERPRET (General weather guidance) -> general_weather_guidance
 * 3. RECOMMEND (Activity-aware recommendation) -> activity_recommendation
 */

export function detectIntent(query = '', language = 'en') {
  const q = (query || '').toLowerCase().trim();

  // 1. General Greetings & Capabilities (Priority 1)
  const greetings = ['hello', 'hi', 'hey', 'namaste', 'good morning', 'good evening', 'who are you', 'what can you do', 'help', 'नमस्ते', 'हेल्प', 'क्या कर सकते हो', 'सहायता'];
  const isGreeting = greetings.some(g => q === g || q.startsWith(g + ' ') || q.endsWith(' ' + g));
  if (isGreeting) {
    return {
      rawQuery: query,
      type: 'general_greeting',
      targetSport: null,
      requestedTime: null,
      isIrregularQuery: false
    };
  }

  // 2. Pure Informational Queries (Type A - Pure Weather Fact Query)
  if (
    q === 'what is the temperature' || q === 'what is temperature' || q.includes('what is the temperature right now') ||
    q.includes('how humid is it') || q.includes('what is the humidity') || q.includes('what is wind speed') ||
    q.includes('is it raining right now') || q.includes('how warm is it') ||
    q.includes('तापमान कितना है') || q.includes('आर्द्रता कितनी है') || q.includes('हवा की गति कितनी है')
  ) {
    let metricType = 'temp';
    if (q.includes('humid') || q.includes('आर्द्रता')) metricType = 'humidity';
    if (q.includes('wind') || q.includes('हवा')) metricType = 'wind';
    if (q.includes('rain') || q.includes('बारिश')) metricType = 'rain';

    return {
      rawQuery: query,
      type: 'pure_info_query',
      metricType,
      targetSport: null,
      requestedTime: 'now',
      isIrregularQuery: false
    };
  }

  // 3. Activity-Specific Recommendation Queries (Type C - Activity Recommendation)
  // Must match explicit activity requests: running, travel, indoor study, sports, training, commute, hangout
  const isHangoutQuery = q.includes('hang out') || q.includes('hangout') || q.includes('outing') || q.includes('hang-out') || q.includes('घूमने') || q.includes('हैंगआउट');
  const isTravelQuery = q.includes('travel') || q.includes('commute') || q.includes('trip') || q.includes('drive') || q.includes('सफर') || q.includes('यात्रा');
  const isIndoorQuery = q.includes('indoor') || q.includes('study') || q.includes('work from home') || q.includes('पढ़ाई') || q.includes('इनडोर');
  const isRunningQuery = q.includes('run') || q.includes('jog') || q.includes('running') || q.includes('दौड़');
  const isSportQuery = q.includes('football') || q.includes('cricket') || q.includes('soccer') || q.includes('cycling') || q.includes('sports') || q.includes('train') || q.includes('practice') || q.includes('अभ्यास') || q.includes('खेल');

  if (
    q.includes('should i') || q.includes('can i') || q.includes('is it safe to') || q.includes('is the weather favorable') || q.includes('weather favorable') ||
    q.includes('train now') || q.includes('compare with my routine') || q.includes('routine') ||
    isHangoutQuery || isTravelQuery || isIndoorQuery || (isRunningQuery && (q.includes('should') || q.includes('can') || q.includes('today') || q.includes('tomorrow'))) ||
    (isSportQuery && (q.includes('should') || q.includes('can') || q.includes('today') || q.includes('tomorrow') || q.includes('at')))
  ) {
    let targetActivityType = 'sports';
    if (isHangoutQuery) targetActivityType = 'hangout';
    else if (isTravelQuery) targetActivityType = 'travel';
    else if (isIndoorQuery) targetActivityType = 'indoor';
    else if (isRunningQuery) targetActivityType = 'running';

    let targetSport = null;
    if (q.includes('football') || q.includes('soccer')) targetSport = 'football';
    else if (q.includes('cricket')) targetSport = 'cricket';
    else if (q.includes('cycling')) targetSport = 'cycling';
    else if (isRunningQuery) targetSport = 'running';

    return {
      rawQuery: query,
      type: 'activity_recommendation',
      targetActivityType,
      targetSport,
      requestedTime: q.includes('tomorrow') || q.includes('कल') ? '10:00' : (q.includes('evening') || q.includes('शाम') ? '18:00' : 'now'),
      isIrregularQuery: q.includes('train now') || q.includes('compare') || q.includes('now instead')
    };
  }

  // 4. General Weather Guidance Queries (Type B - Weather Summary + Guidance)
  if (
    q.includes('how is the weather') || q.includes('how is weather') || q.includes('current weather') ||
    q.includes('weather right now') || q.includes('weather today') || q.includes('tell me about today\'s weather') ||
    q.includes('today\'s weather') || q.includes('weather summary') ||
    q.includes('मौसम कैसा है') || q.includes('अभी का मौसम') || q.includes('आज का मौसम')
  ) {
    return {
      rawQuery: query,
      type: 'general_weather_guidance',
      targetSport: null,
      requestedTime: 'now',
      isIrregularQuery: false
    };
  }

  // 5. Forecast Info Queries
  if (
    q.includes('will it rain today') || q.includes('will it rain tomorrow') || q.includes('forecast') ||
    q.includes('weather tomorrow') || q.includes('weather at') ||
    q.includes('कल का मौसम') || q.includes('आज बारिश') || q.includes('कल बारिश')
  ) {
    return {
      rawQuery: query,
      type: 'forecast_info',
      targetSport: null,
      requestedTime: q.includes('tomorrow') || q.includes('कल') ? '10:00' : '17:00',
      isIrregularQuery: false
    };
  }

  // 6. Concept Explanations (WBGT, Humidity, Rain)
  if (
    q.includes('what is wbgt') || q.includes('how does wbgt work') || q.includes('explain wbgt') || q.includes('wbgt क्या है') ||
    q.includes('what is humidity') || q.includes('explain humidity') || q.includes('आर्द्रता क्या है') ||
    q.includes('tell me about rain') || q.includes('explain rain')
  ) {
    return {
      rawQuery: query,
      type: 'general_weather_explain',
      targetSport: null,
      requestedTime: null,
      isIrregularQuery: false
    };
  }

  // 7. Alerts & Warnings Query
  if (q.includes('alert') || q.includes('notification') || q.includes('warning') || q.includes('चेतावनी') || q.includes('अलर्ट')) {
    return {
      rawQuery: query,
      type: 'alert_explanation',
      targetSport: null,
      requestedTime: null,
      isIrregularQuery: false
    };
  }

  // Fallback: Default to general_weather_guidance for unclassified queries
  return {
    rawQuery: query,
    type: 'general_weather_guidance',
    targetSport: null,
    requestedTime: 'now',
    isIrregularQuery: false
  };
}
