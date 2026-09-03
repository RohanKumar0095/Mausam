/**
 * CONTEXTUAL DAILY BRIEFING GENERATOR
 * Generates natural language summaries in English and Hindi
 * tailored to active personas, time of day, and routine.
 */

export function generateDailyBriefing({
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
  const aqi = current.aqi || 83;
  const aqiStatus = current.aqiStatus || (isHindi ? 'संतोषजनक' : 'Satisfactory');
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

  // Time Greeting
  let greeting = isHindi ? 'सुप्रभात' : 'Good morning';
  if (currH >= 12 && currH < 17) greeting = isHindi ? 'नमस्कार' : 'Good afternoon';
  if (currH >= 17 && currH < 22) greeting = isHindi ? 'शुभ संध्या' : 'Good evening';
  if (currH >= 22 || currH < 5) greeting = isHindi ? 'रात्रि अपडेट' : 'Night update';

  // 1. Sportsperson
  if (isSport && !isAgri) {
    if (rainProb >= 60) {
      return isHindi
        ? `${greeting}। शाम के प्रशिक्षण के समय बारिश की संभावना है — इनडोर अभ्यास या समय समायोजन की सलाह है।`
        : `${greeting}. Rain expected during your evening session — plan indoor drills or adjust workout timing.`;
    }
    return isHindi
      ? `${greeting}। आज शाम 5 बजे आपका फुटबॉल प्रशिक्षण मध्यम WBGT स्तर में है — अतिरिक्त पानी पीने और बीच-बीच में विश्राम करने की सलाह है। प्रशिक्षण के समय बारिश की संभावना नहीं है।`
      : `${greeting}. Your 5 PM football training falls in a moderate WBGT zone today — extra water breaks recommended. No rain expected during your session.`;
  }

  // 2. Fitness
  if (isFitness && !isAgri && !isSport) {
    return isHindi
      ? `${greeting}। आर्द्रता बढ़ने से पहले सुबह 6–7:30 बजे दौड़ने के लिए सबसे अच्छा समय है। वायु गुणवत्ता (AQI ${aqi}) संतोषजनक है — सामान्य गति से दौड़ने के लिए परिस्थितियाँ उपयुक्त हैं।`
      : `${greeting}. Best running window is 6–7:30 AM before humidity rises. AQI is ${aqiStatus.toLowerCase()} (${aqi}) — fine for moderate-intensity running.`;
  }

  // 3. Agriculture
  if (isAgri) {
    const crop = (selectedPlot || 'Rice').split(' ')[0];
    const cropHindi = crop === 'Rice' ? 'धान' : (crop === 'Maize' ? 'मक्का' : 'सब्जियों');

    if (rainProb >= 60) {
      return isHindi
        ? `${greeting}। ${cropHindi} के खेत में अगले 24 घंटों में बारिश की संभावना है — उर्वरक और कीटनाशक छिड़काव अभी टाल दें।`
        : `${greeting}. Rain expected within 24 hours on ${crop} plot — postpone fertilizer top-dressing and foliar spray.`;
    }
    return isHindi
      ? `${greeting}। आपकी ${cropHindi} की फसल कल्ले निकलने (टिलरिंग) की अनुकूल अवस्था में है। अगले 3 दिनों में बारिश की संभावना नहीं है — उर्वरक डालने के लिए उपयुक्त समय है।`
      : `${greeting}. Your ${crop.toLowerCase()} crop is in a favorable stage. No rain expected for 3 days — good window for fertilizer application.`;
  }

  // 4. Commute
  if (isCommute && currH >= 15 && currH <= 19) {
    if (rainProb >= 60) {
      return isHindi
        ? `${greeting}। भारी बारिश आपकी शाम 4:30 बजे की नियमित यात्रा के समय हो सकती है — 20 मिनट पहले निकलने पर विचार करें।`
        : `${greeting}. Heavy rain overlaps with your 4:30 PM commute — consider leaving 20 minutes early.`;
    }
    return isHindi
      ? `${greeting}। शाम की यात्रा के लिए मुख्य सड़कें और दृश्यता पूरी तरह स्पष्ट हैं।`
      : `${greeting}. Arterial roads and visibility remain clear for your evening commute.`;
  }

  // 5. Travel / Events
  if (isTravel || isEvents) {
    if (currH >= 17) {
      return isHindi
        ? `${greeting}। बाहरी कार्यक्रम के लिए शाम का मौसम सुखद (25°C) और हल्की हवा वाला रहेगा।`
        : `${greeting}. Pleasant evening conditions (25°C) with gentle breeze for your outdoor gathering.`;
    }
    return isHindi
      ? `${greeting}। यात्रा और तटीय गतिविधियों के लिए दृश्यता और मौसमी परिस्थितियाँ अनुकूल हैं।`
      : `${greeting}. Clear visibility and favorable coastal breeze for travel activities.`;
  }

  // 6. Blended Health + Fitness
  if (isHealth && isFitness) {
    return isHindi
      ? `${greeting}। हल्का तापमान (${temp}°C) और स्वच्छ वायु गुणवत्ता। सुबह की कसरत के लिए मौसम अनुकूल है।`
      : `${greeting}. Mild temperature (${temp}°C) and ${aqiStatus.toLowerCase()} air quality. Favorable for morning cardio.`;
  }

  // 7. Daily Life Fallback
  return isHindi
    ? `${greeting}। आज मौसम सुहावना रहेगा, तापमान ${temp}°C के करीब और बारिश की संभावना नहीं है। वायु गुणवत्ता संतोषजनक है।`
    : `${greeting}. Pleasant day ahead with mild temperatures (${temp}°C) and no rain expected. AQI is ${aqiStatus.toLowerCase()}.`;
}
