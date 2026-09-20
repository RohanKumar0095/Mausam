/**
 * MAUSAM Assistant - Contextual Weather Guidance Engine
 * 
 * Interprets normalized weather metrics and generates meaningful physical/outdoor
 * guidance without generic placeholders or false assertions about the user's schedule.
 */

export function generateContextualWeatherGuidance({ normalizedWeather = {}, upcomingActivities = [], language = 'en' }) {
  const isHindi = language === 'hi' || language === 'Hindi';
  const w = normalizedWeather;

  const temp = w.temperature;
  const humidity = w.humidity;
  const pop = w.precipitationProbability;
  const wind = w.windSpeed;
  const wbgt = w.wbgtValue;
  const cond = w.condition || 'Clear';

  const notableConditions = [];
  let physicalImpact = '';
  let outdoorGuidance = '';

  if (humidity != null && humidity >= 80) {
    notableConditions.push(isHindi ? 'उच्च आर्द्रता' : 'High Humidity');
  }
  if (temp != null && temp >= 32) {
    notableConditions.push(isHindi ? 'उच्च तापमान' : 'Elevated Temperature');
  }
  if (pop != null && pop >= 50) {
    notableConditions.push(isHindi ? 'वर्षा की संभावना' : 'Rain Risk');
  }
  if (wind != null && wind >= 25) {
    notableConditions.push(isHindi ? 'तेज हवा' : 'Breezy Winds');
  }

  // Interpret physical comfort & exertion load
  if (humidity != null && humidity >= 80 && temp != null && temp >= 28) {
    physicalImpact = isHindi
      ? `उच्च आर्द्रता (${humidity}%) पसीने के वाष्पीकरण को धीमा करती है, जिससे बाहरी शारीरिक प्रयास अधिक थकाऊ महसूस हो सकता है।`
      : `Conditions are warm and humid (${temp}°C with ${humidity}% humidity). High humidity impedes sweat evaporation, making outdoor exertion feel more strenuous.`;
    outdoorGuidance = isHindi
      ? `बाहरी आवागमन या व्यायाम के दौरान पानी का पर्याप्त सेवन करें और सीधी धूप से बचें।`
      : `Maintain regular hydration during outdoor movement and limit prolonged exposure during peak heat hours.`;
  } else if (pop != null && pop >= 60) {
    physicalImpact = isHindi
      ? `वर्षा की उच्च संभावना (${pop}%) के कारण सड़कें और मैदान गीले व फिसलन भरे हो सकते हैं।`
      : `High rain probability (${pop}%) is expected to create slick road and turf traction.`;
    outdoorGuidance = isHindi
      ? `यात्रा या आउटडोर गतिविधियों के लिए रेन गियर (छाता/रेनकोट) साथ रखें।`
      : `Keep rain protection accessible and exercise caution on wet surfaces.`;
  } else if (temp != null && temp <= 16) {
    physicalImpact = isHindi
      ? `ठंडी हवा और कम तापमान (${temp}°C) के कारण बाहर हल्की ठिठुरन महसूस होगी।`
      : `Cool temperatures (${temp}°C) create crisp outdoor conditions.`;
    outdoorGuidance = isHindi
      ? `बाहर जाने पर उपयुक्त गर्म कपड़े पहनें।`
      : `Wear suitable layered clothing for outdoor movement.`;
  } else {
    physicalImpact = isHindi
      ? `मौसम की स्थितियां स्थिर और सुखद बनी हुई हैं।`
      : `Weather conditions remain overall steady and comfortable at ${temp != null ? temp + '°C' : 'ambient levels'}.`;
    outdoorGuidance = isHindi
      ? `आप सामान्य आउटडोर आवागमन बिना किसी मौसम व्यवधान के कर सकते हैं।`
      : `Outdoor movement can proceed comfortably under current conditions.`;
  }

  // Optional contextual note for user's upcoming routine activity
  let activityNote = '';
  if (upcomingActivities && upcomingActivities.length > 0) {
    const nextAct = upcomingActivities[0];
    const actName = nextAct.label || nextAct.type || 'activity';
    activityNote = isHindi
      ? ` आपकी आगामी ${actName} गतिविधि के समय मौसम की जांच निर्धारित समय के निकट करना उपयोगी रहेगा।`
      : ` Your upcoming ${actName} session should be checked closer to its start time as conditions evolve.`;
  }

  return {
    summary: isHindi
      ? `${w.locationName} पर मौसम: तापमान ${temp != null ? temp + '°C' : '--'}, आर्द्रता ${humidity != null ? humidity + '%' : '--'}।`
      : `Conditions at ${w.locationName}: ${temp != null ? temp + '°C' : '--'} with ${humidity != null ? humidity + '%' : '--'} humidity.`,
    why: `${physicalImpact}${activityNote}`,
    action: outdoorGuidance,
    notableConditions,
    metrics: {
      temp: temp != null ? `${temp}°C` : '--',
      rainProb: pop != null ? `${pop}%` : '--',
      humidity: humidity != null ? `${humidity}%` : '--',
      wind: wind != null ? `${wind} km/h` : '--',
      wbgt: wbgt != null ? `${wbgt}°C` : '--',
      groundCondition: w.groundCondition || 'Firm & Dry'
    }
  };
}
