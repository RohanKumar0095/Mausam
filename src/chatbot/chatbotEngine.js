import { detectIntent } from './intentDetector';

export function generateChatbotResponse(query, context) {
  const lang = context.user.language || 'en';
  const isHindi = lang === 'hi';
  const intent = detectIntent(query, lang);
  const weather = context.weather;
  const safety = context.safetyInfo;

  // 1. Critical Safety Override Check
  if (safety && safety.isSevere) {
    if (isHindi) {
      return {
        weather: `गंभीर मौसम चेतावनी (${safety.severityLevel}) सक्रिय है।`,
        impact: `तेज आंधी और भारी वर्षा की चेतावनी जारी की गई है।`,
        recommendation: `अनावश्यक बाहरी गतिविधियों से बचें और सुरक्षित पक्के आश्रय में रहें।`,
        safety: `⚠️ आधिकारिक IMD रेड अलर्ट सक्रिय है।`,
        disclaimer: `वर्तमान MAUSAM डेमो पूर्वानुमान के आधार पर।`
      };
    }
    return {
      weather: `Severe Weather Warning (${safety.severityLevel}) Active.`,
      impact: `High wind gusts and heavy downpours are forecast across the region.`,
      recommendation: `Avoid unnecessary outdoor travel and seek secure indoor shelter.`,
      safety: `⚠️ Official IMD Red Alert is currently in effect.`,
      disclaimer: `Based on current MAUSAM demo forecast.`
    };
  }

  // 2. Scenario A: Temporary Routine Change (e.g. "I need to leave my office at 6:15 PM")
  if (intent.isTemporaryRoutineQuery && (intent.activityType === 'commute' || query.includes('office') || query.includes('6:15') || query.includes('leave') || query.includes('शाम 6:15') || query.includes('निकल'))) {
    const reqTime = intent.requestedTime || '18:15';

    if (isHindi) {
      return {
        weather: `शाम ${reqTime} बजे बारिश की संभावना 78% और गरज-चमक की स्थिति अनुमानित है।`,
        impact: `आपकी सामान्य यात्रा शाम 4:30 बजे होती है, लेकिन आज की शाम ${reqTime} बजे की देर से यात्रा अधिक बारिश वाले समय से मेल खाती है।`,
        recommendation: `संभव हो तो बारिश तेज होने से पहले निकलें या मेट्रो / सुरक्षित बंद वाहन का उपयोग करें।`,
        safety: `सड़कों पर जलभराव और कम दृश्यता के प्रति सतर्क रहें।`,
        disclaimer: `वर्तमान MAUSAM डेमो पूर्वानुमान के आधार पर।`
      };
    }

    return {
      weather: `At ${reqTime}, rain probability increases to 78% with thunderstorm potential.`,
      impact: `Your usual commute is at 16:30, but today's ${reqTime} trip falls directly within the higher-risk rain window.`,
      recommendation: `Consider departing 25 minutes earlier or choosing metro / covered transit over two-wheelers.`,
      safety: `Waterlogging on lower arterial corridors may cause travel delays.`,
      disclaimer: `Based on current MAUSAM demo forecast.`
    };
  }

  // 3. Scenario B: Running / Fitness (e.g. "Can I run at 7 PM today?", "क्या मैं अभी दौड़ने जा सकता हूँ?")
  if (intent.activityType === 'fitness') {
    if (intent.requestedTime && (intent.requestedTime.startsWith('18') || intent.requestedTime.startsWith('19') || intent.requestedTime.startsWith('20'))) {
      if (isHindi) {
        return {
          weather: `शाम के समय तापमान 24.5°C और आर्द्रता 88% रहेगी। हल्की बूंदाबांदी की संभावना (65%) है।`,
          impact: `शाम के समय पार्क के ट्रैक गीले और फिसलन भरे हो सकते हैं।`,
          recommendation: `शाम के बजाय कल सुबह 6:00 से 7:30 बजे दौड़ना अधिक आरामदायक रहेगा जब मौसम सूखा और अनुकूल होगा।`,
          safety: `सड़क पर दौड़ते समय फिसलन रोधी जूतों का उपयोग करें।`,
          disclaimer: `वर्तमान MAUSAM डेमो पूर्वानुमान के आधार पर।`
        };
      }

      return {
        weather: `Evening forecast indicates 24.5°C with 88% humidity and 65% precipitation probability.`,
        impact: `Wet pavement and humid air will elevate respiratory exertion during intense cardio.`,
        recommendation: `Consider shifting your workout to tomorrow morning (6:00–7:30 AM) when conditions are dry and cooler.`,
        safety: `Wear reflective gear and slip-resistant footwear if running on damp roads.`,
        disclaimer: `Based on current MAUSAM demo forecast.`
      };
    }

    // Default Running (Now)
    if (isHindi) {
      return {
        weather: `वर्तमान तापमान ${weather.temp}°C और वायु गुणवत्ता (AQI ${weather.aqi}) संतोषजनक है।`,
        impact: `मौसम दौड़ने और शारीरिक कसरत के लिए अनुकूल है।`,
        recommendation: `सुबह का समय कसरत के लिए सर्वोत्तम है। धूप तेज होने से पहले 45 मिनट की दौड़ पूरी करें।`,
        safety: `पर्याप्त मात्रा में पानी पिएं।`,
        disclaimer: `वर्तमान MAUSAM डेमो पूर्वानुमान के आधार पर।`
      };
    }

    return {
      weather: `Current temperature is ${weather.temp}°C with Satisfactory Air Quality (AQI ${weather.aqi}).`,
      impact: `Optimal atmospheric conditions for outdoor aerobic endurance and jogging.`,
      recommendation: `Great window for a 45-minute outdoor run before solar radiation rises.`,
      safety: `Maintain hydration intervals.`,
      disclaimer: `Based on current MAUSAM demo forecast.`
    };
  }

  // 4. Scenario C: Agriculture / Spraying (e.g. "Is my farm suitable for spraying tomorrow morning?")
  if (intent.activityType === 'agriculture') {
    if (isHindi) {
      return {
        weather: `अगले 36 घंटों में बारिश की संभावना नगण्य (<15%) है और हवा की गति 7-9 km/h शांत रहेगी।`,
        impact: `कीटनाशक या उर्वरक के बह जाने (वॉशआउट) का जोखिम न्यूनतम है।`,
        recommendation: `कल सुबह 7:00 से 10:30 बजे के बीच पर्णीय छिड़काव (Foliar Spray) और यूरिया टॉप-ड्रेसिंग के लिए अत्यंत अनुकूल समय है।`,
        safety: `अनुमानित जोखिम संकेतक: उच्च आर्द्रता के कारण धान के निचले पत्तों पर ब्लास्ट रोग के लक्षणों की जांच करें।`,
        disclaimer: `वर्तमान MAUSAM डेमो कृषि मॉडल के आधार पर।`
      };
    }

    return {
      weather: `Rain probability is low (<15%) with steady, calm winds (7–9 km/h) over the next 36 hours.`,
      impact: `Zero washout risk for foliar spray and fertilizer top-dressing.`,
      recommendation: `Tomorrow morning (07:00–10:30 AM) provides an optimal window for field chemical spraying.`,
      safety: `Estimated Risk Indicator: High humidity encourages leaf blast; inspect lower stems during field scouting.`,
      disclaimer: `Based on current MAUSAM demo agromet model.`
    };
  }

  // 5. Scenario D: Commute / Rain query (e.g. "Will it rain during my commute?")
  if (intent.activityType === 'commute' || intent.activityType === 'rain') {
    if (isHindi) {
      return {
        weather: `शाम 4:30 से 6:30 बजे के बीच बारिश की संभावना 70% तक बढ़ जाएगी।`,
        impact: `शाम के व्यस्त समय में सड़कों पर यातायात धीमा हो सकता है और जलभराव की संभावना है।`,
        recommendation: `छाता या रेनकोट साथ रखें। यदि संभव हो तो यात्रा 20 मिनट पहले शुरू करें।`,
        safety: `दृश्यता 3.5 km तक घट सकती है, वाहन धीमी गति से चलाएं।`,
        disclaimer: `वर्तमान MAUSAM डेमो पूर्वानुमान के आधार पर।`
      };
    }

    return {
      weather: `Doppler forecast shows rain probability climbing to 70% between 16:30 and 18:30.`,
      impact: `Peak evening commute will experience localized road spray and slower traffic velocity.`,
      recommendation: `Carry waterproof protection and plan for an extra 15–20 minutes transit buffer.`,
      safety: `Transit visibility may reduce to 3.5 km; keep vehicle headlights on low beam.`,
      disclaimer: `Based on current MAUSAM demo forecast.`
    };
  }

  // 6. Scenario E: Outdoor Event (e.g. "Should I move my outdoor event indoors?")
  if (intent.activityType === 'event') {
    if (isHindi) {
      return {
        weather: `शाम 7:00 बजे तापमान 25°C रहेगा, लेकिन रात 8:00 बजे के आसपास हल्की बारिश की संभावना (65%) है।`,
        impact: `खुले मैदान में आयोजित कार्यक्रमों में शाम को हल्की बाधा आ सकती है।`,
        recommendation: `वाटरप्रूफ कैनोपी तैयार रखें या इनडोर हॉल को बैकअप के रूप में आरक्षित रखें।`,
        safety: `बिजली के उपकरणों को बारिश से सुरक्षित ढक कर रखें।`,
        disclaimer: `वर्तमान MAUSAM डेमो पूर्वानुमान के आधार पर।`
      };
    }

    return {
      weather: `Evening temperature will be 25°C, with scattered shower risk (65%) developing near 20:00.`,
      impact: `Open-air seating or lawn receptions may face brief precipitation disruptions.`,
      recommendation: `Keep a waterproof overhead canopy ready or place the banquet hall on active standby.`,
      safety: `Ensure electrical sound stages and outdoor wiring are weatherproofed.`,
      disclaimer: `Based on current MAUSAM demo forecast.`
    };
  }

  // 7. Scenario F: Travel / Specific Location query (e.g. "What's the weather at my Mumbai location tonight?")
  if (intent.targetLocation === 'mumbai' || query.includes('mumbai') || query.includes('मुंबई')) {
    if (isHindi) {
      return {
        weather: `मुंबई में वर्तमान तापमान 28.5°C और समुद्र से 14 km/h की नम हवाएं चल रही हैं।`,
        impact: `दोपहर बाद 15:45 बजे उच्च ज्वार (3.9m) दर्ज किया गया था। रात का मौसम तटीय टहलने के लिए सुहावना रहेगा।`,
        recommendation: `मरीन ड्राइव और तटीय इलाकों में शाम की यात्रा के लिए परिस्थितियाँ अच्छी हैं।`,
        safety: `ऊंची लहरों के समय चट्टानी किनारों से सुरक्षित दूरी बनाए रखें।`,
        disclaimer: `वर्तमान MAUSAM डेमो पूर्वानुमान के आधार पर।`
      };
    }

    return {
      weather: `Mumbai is at 28.5°C with an onshore coastal breeze of 14 km/h and 78% humidity.`,
      impact: `High tide occurred at 15:45 (3.9m). Evening coastal conditions remain pleasant and breezy.`,
      recommendation: `Great conditions for evening travel along Marine Drive and waterfront promenades.`,
      safety: `Maintain caution near exposed sea barriers during high swell periods.`,
      disclaimer: `Based on current MAUSAM demo forecast.`
    };
  }

  // 8. General / Fallback Weather Response
  if (isHindi) {
    return {
      weather: `वर्तमान में तापमान ${weather.temp}°C, आर्द्रता ${weather.humidity}% और मौसम ${weather.condition} है।`,
      impact: `आज की दिनचर्या के लिए सामान्य मौसम बना रहेगा।`,
      recommendation: `आप अपनी सामान्य दिनचर्या जारी रख सकते हैं। किसी विशेष व्यवधान की संभावना नहीं है।`,
      safety: `AQI ${weather.aqi} (${weather.aqiStatus}) — सुरक्षित स्तर पर है।`,
      disclaimer: `वर्तमान MAUSAM डेमो पूर्वानुमान के आधार पर।`
    };
  }

  return {
    weather: `Currently ${weather.temp}°C, ${weather.humidity}% humidity with ${weather.condition}.`,
    impact: `Normal seasonal conditions across your active locations.`,
    recommendation: `You can proceed with your scheduled routine without significant weather disruption.`,
    safety: `AQI is ${weather.aqi} (${weather.aqiStatus}) — within safe limits.`,
    disclaimer: `Based on current MAUSAM demo forecast.`
  };
}
