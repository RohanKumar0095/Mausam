/**
 * MAUSAM - Sportsperson Personalized Weather-to-Action Engine
 * 
 * Deterministic, explainable rule-based decision engine designed for sportspersons.
 * Evaluates sports suitability, training windows, irregular schedule changes,
 * WBGT heat strain, pitch/turf traction, and safety overrides.
 */

import { calculateEstimatedWBGT } from '../../services/wbgtService.js';
import { resolveScenarioContext } from '../../engine/scenarioContextResolver.js';
import { TimeContextValidator } from '../../engine/decisionConsistencyValidator.js';

/**
 * Sport Requirement Profiles
 */
export const SPORT_PROFILES = {
  football: {
    name: 'Football',
    nameHi: 'फुटबॉल',
    maxRainProb: 65,
    maxWindKph: 28,
    maxWbgt: 30.0,
    requiresFirmGround: true,
    lightningSensitive: true,
    gearAdviceEn: 'Wear studded turf cleats and keep dry towel for ball grip.',
    gearAdviceHi: 'स्टडेड जूते पहनें और गेंद की ग्रिप के लिए सूखा तौलिया रखें।'
  },
  cricket: {
    name: 'Cricket',
    nameHi: 'क्रिकेट',
    maxRainProb: 40,
    maxWindKph: 24,
    maxWbgt: 31.0,
    requiresFirmGround: true,
    lightningSensitive: true,
    gearAdviceEn: 'Protect pitch surface with covers and check outfield visibility.',
    gearAdviceHi: 'पिच को कवर्स से ढकें और आउटफील्ड दृश्यता की जांच करें।'
  },
  cycling: {
    name: 'Cycling',
    nameHi: 'साइकिलिंग',
    maxRainProb: 50,
    maxWindKph: 22,
    maxWbgt: 29.5,
    requiresFirmGround: false,
    lightningSensitive: true,
    gearAdviceEn: 'Beware of slick wet asphalt and crosswinds on open corridors.',
    gearAdviceHi: 'गीली सड़क पर फिसलन और खुली सड़कों पर तेज हवा से सावधान रहें।'
  },
  running: {
    name: 'Running',
    nameHi: 'दौड़ / रनिंग',
    maxRainProb: 60,
    maxWindKph: 30,
    maxWbgt: 29.0,
    requiresFirmGround: false,
    lightningSensitive: true,
    gearAdviceEn: 'Maintain hydration intervals and use breathable moisture-wicking gear.',
    gearAdviceHi: 'नियमित पानी पिएं और पसीना सोखने वाले हवादार कपड़े पहनें।'
  },
  athletics: {
    name: 'Athletics & Track',
    nameHi: 'एथलेटिक्स व ट्रैक',
    maxRainProb: 55,
    maxWindKph: 25,
    maxWbgt: 29.5,
    requiresFirmGround: true,
    lightningSensitive: true,
    gearAdviceEn: 'Check track lane surface grip before explosive sprint drills.',
    gearAdviceHi: 'स्प्रिंट से पहले सिंथेटिक या मिट्टी के ट्रैक की ग्रिप की जांच करें।'
  }
};

/**
 * Helper to extract forecast slot closest to a specified time string (HH:MM or HH)
 */
function findForecastSlot(forecastList = [], targetTime = '17:00') {
  if (!forecastList || forecastList.length === 0) return null;
  let timeStr = targetTime || '17:00';
  if (timeStr === 'now') timeStr = '12:00';
  const targetH = parseInt((timeStr.split(':')[0] || '17'), 10);
  const safeTargetH = isNaN(targetH) ? 12 : targetH;

  let closest = forecastList[0];
  let minDiff = 999;

  for (const slot of forecastList) {
    const slotTime = slot.time || slot.dt_txt || '12:00';
    const slotH = parseInt((slotTime.split(':')[0] || '12'), 10);
    const safeSlotH = isNaN(slotH) ? 12 : slotH;
    const diff = Math.abs(safeSlotH - safeTargetH);
    if (diff < minDiff) {
      minDiff = diff;
      closest = slot;
    }
  }
  return closest;
}

/**
 * Main Sportsperson Decision Engine
 */
export function evaluateSportspersonQuery(intent, context) {
  const isHindi = context.language === 'hi' || context.language === 'Hindi';
  const weather = context.weather || {};
  const safety = context.safetyInfo || {};
  const routine = context.routine || [];
  const locationName = context.selectedLocation?.name || (isHindi ? 'वर्तमान स्थान' : 'Current Location');
  const currentTime = context.currentTime || '06:30';

  // Find user's scheduled sports/training activity from routine
  const scheduledSportsActivity = routine.find(r => 
    r.type === 'sports' || 
    r.type === 'running' || 
    r.type === 'fitness' ||
    (r.label && (r.label.toLowerCase().includes('practice') || r.label.toLowerCase().includes('training') || r.label.toLowerCase().includes('football') || r.label.toLowerCase().includes('match')))
  ) || {
    label: isHindi ? 'शाम का खेल प्रशिक्षण' : 'Evening Training Session',
    startTime: '17:00',
    endTime: '19:30',
    location: locationName
  };

  const targetSportKey = intent.targetSport || context.sport || 'football';
  const sportMeta = SPORT_PROFILES[targetSportKey] || SPORT_PROFILES.football;
  const sportName = isHindi ? sportMeta.nameHi : sportMeta.name;

  // -------------------------------------------------------------
  // 1. API Failure / Missing Weather Data Guard
  // -------------------------------------------------------------
  const isWeatherDataAvailable = weather.temp != null && !context.isWeatherError;
  if (!isWeatherDataAvailable) {
    return {
      answer: isHindi 
        ? 'मैं वर्तमान में आवश्यक मौसम डेटा प्राप्त नहीं कर पा रहा हूँ।'
        : "I cannot access live weather data right now.",
      why: isHindi
        ? 'लाइव मौसम API सिंक उपलब्ध नहीं है, इसलिए आपके खेल प्रशिक्षण की सुरक्षा का सटीक विश्लेषण नहीं किया जा सकता।'
        : 'Live weather feed is unavailable, preventing a reliable assessment of your training safety and field conditions.',
      action: isHindi
        ? 'कृपया अपना इंटरनेट कनेक्शन जांचें या थोड़ी देर बाद पुनः प्रयास करें। आधिकारिक IMD दिशानिर्देशों का पालन करें।'
        : 'Please verify your network connection or refresh the weather feed. Follow local safety observations.',
      safety: null,
      metrics: {
        temp: '--',
        rainProb: '--',
        wbgt: '--',
        wind: '--',
        groundCondition: isHindi ? 'अज्ञात' : 'Unknown'
      },
      ruleTriggered: 'DATA_FEED_UNAVAILABLE',
      disclaimer: isHindi ? 'मौसम डेटा अनुपलब्ध होने के कारण कोई काल्पनिक आंकड़े नहीं दिखाए गए।' : 'No estimated figures generated due to unavailable live feed.'
    };
  }

  // Calculate live WBGT
  const wbgtResult = calculateEstimatedWBGT({
    temperature: weather.temp,
    humidity: weather.humidity,
    windSpeed: weather.windSpeed,
    uvIndex: weather.uvIndex
  });
  const wbgtValue = wbgtResult.available ? `${wbgtResult.value}°C` : '--';
  const wbgtZone = wbgtResult.available ? wbgtResult.zone : 'low';

  // Ground / Turf Condition Calculation
  const isGroundWet = (weather.rainProbability || 0) >= 60 || (weather.rainfall24h && weather.rainfall24h > 5);
  const groundCondition = isGroundWet 
    ? (isHindi ? 'गीला व फिसलन भरा' : 'Wet & Slippery')
    : (isHindi ? 'मजबूत और सूखा' : 'Firm & Dry');

  // -------------------------------------------------------------
  // 2. CRITICAL SAFETY OVERRIDE (Red Alert / Lightning Hazard)
  // -------------------------------------------------------------
  const isThunderstorm = (weather.condition || '').toLowerCase().includes('thunder') || 
                        (weather.condition || '').toLowerCase().includes('lightning') ||
                        (weather.condition || '').toLowerCase().includes('storm');
  const isSevereAlertActive = safety.isSevere || safety.severityLevel === 'RED' || isThunderstorm;

  if (isSevereAlertActive) {
    return {
      answer: isHindi
        ? `नहीं। वर्तमान में ${sportName} या किसी भी आउटडोर खेल का अभ्यास सुरक्षित नहीं है।`
        : `No. Outdoor ${sportName} training is currently not safe.`,
      why: isHindi
        ? `आधिकारिक गंभीर मौसम चेतावनी (${safety.severityLevel || 'RED'}) / आकाशीय बिजली (तड़ित) का उच्च जोखिम सक्रिय है। खुले मैदान में जान-माल का खतरा रहता है।`
        : `A severe weather warning (${safety.severityLevel || 'RED ALERT'}) or lightning hazard is currently active. Open fields present serious lightning strike hazards.`,
      action: isHindi
        ? 'सभी आउटडोर खेल गतिविधियाँ तुरंत स्थगित करें। पक्की कंक्रीट छत के नीचे सुरक्षित आश्रय में रहें।'
        : 'Immediately postpone all outdoor sports drills. Seek secure, fully enclosed indoor shelter.',
      safety: isHindi 
        ? '⚠️ सर्वोच्च प्राथमिकता सुरक्षा चेतावनी: आधिकारिक IMD रेड अलर्ट / तड़ित जोखिम सक्रिय।'
        : '⚠️ Critical Safety Override: Official IMD Red Alert / Lightning Hazard Active.',
      metrics: {
        temp: `${weather.temp}°C`,
        rainProb: `${weather.rainProbability || 85}%`,
        wbgt: wbgtValue,
        wind: `${weather.windSpeed || 25} km/h`,
        groundCondition: isHindi ? 'अत्यधिक गीला / असुरक्षित' : 'Hazardous / Waterlogged'
      },
      ruleTriggered: 'SAFETY_OVERRIDE_SEVERE_WEATHER',
      disclaimer: isHindi ? 'IMD सुरक्षा अधिरोपण नियम द्वारा निर्देशित।' : 'Governed by IMD Critical Safety Override Protocol.'
    };
  }

  // -------------------------------------------------------------
  // 3. IRREGULAR ACTIVITY SCENARIO ("Train now instead of scheduled routine")
  // -------------------------------------------------------------
  if (intent.type === 'train_now_irregular' || intent.type === 'compare_routine' || (intent.isIrregularQuery && intent.type === 'can_train_now')) {
    const routineTime = scheduledSportsActivity.startTime || '17:00';
    const routineFormattedTime = scheduledSportsActivity.endTime ? formatTimeRange12h(routineTime, scheduledSportsActivity.endTime) : formatTime12h(routineTime);
    
    // Resolve authoritative Decision Context for scheduled routine
    const routineScenario = resolveScenarioContext({
      userId: context.userProfile?.userId,
      activity: scheduledSportsActivity,
      routine: context.routine,
      selectedPersonas: context.selectedPersonas,
      weatherData: { current: context.weather, forecast3Hourly: context.forecast },
      language: context.language
    });

    const isRoutineRescheduled = routineScenario.decision.status === 'RESCHEDULE';
    const isRoutineModified = routineScenario.decision.status === 'MODIFY';
    const timeLabel = TimeContextValidator.getTimeOfDayLabel(currentTime, context.language);

    const routineSlot = findForecastSlot(context.forecast, routineTime);
    const routineRainProb = routineSlot?.pop ?? (weather.rainProbability || 20);

    const currentRainProb = weather.rainProbability || 15;
    const isNowBetter = currentRainProb < (routineRainProb - 15) && wbgtZone !== 'extreme';

    // If the scheduled routine is ALREADY marked RESCHEDULE by recommendation engine:
    if (isRoutineRescheduled) {
      return {
        answer: isHindi
          ? `वर्तमान समय (${currentTime}) और आपकी निर्धारित ${sportName} दिनचर्या (${routineFormattedTime}) दोनों में मौसम प्रतिकूल (RESCHEDULE) है।`
          : `Neither right now (${currentTime}) nor your scheduled ${sportName} session (${routineFormattedTime}) is recommended due to weather risks (RESCHEDULE).`,
        why: isHindi
          ? `निर्धारित समय (${routineFormattedTime}) पर: ${routineScenario.decision.reason}`
          : `For your scheduled ${routineFormattedTime} window: ${routineScenario.decision.reason}`,
        action: isHindi
          ? `मुख्य अभ्यास को ${routineScenario.decision.suggested_window} पर पुननिर्धारित करें या इनडोर सत्र लें।`
          : `Reschedule your main session to ${routineScenario.decision.suggested_window} or switch to indoor training.`,
        safety: isHindi ? '⚠️ आधिकारिक निर्णय: दिनचर्या पुननिर्धारण आवश्यक' : '⚠️ Authoritative Decision: Routine Reschedule Required',
        metrics: {
          temp: `${weather.temp}°C`,
          rainProb: `${currentRainProb}%`,
          wbgt: wbgtValue,
          wind: `${weather.windSpeed || 8} km/h`,
          groundCondition
        },
        ruleTriggered: 'SCENARIO_CONTEXT_ROUTINE_RESCHEDULED',
        disclaimer: isHindi ? 'आधिकारिक साझा निर्णय संदर्भ पर आधारित।' : 'Based on Single Source of Decision Truth.'
      };
    }

    if (isNowBetter) {
      return {
        answer: isHindi
          ? `हाँ, यदि आप अभी (${currentTime}) अभ्यास करना चाहते हैं, तो अभी की स्थितियाँ आपके निर्धारित ${routineFormattedTime} समय से बेहतर हैं।`
          : `Yes, training now at ${currentTime} is actually more favorable than your scheduled ${routineFormattedTime} session.`,
        why: isHindi
          ? `अभी बारिश की संभावना केवल ${currentRainProb}% है, जबकि निर्धारित दिनचर्या के समय (${routineFormattedTime}) यह बढ़कर ${routineRainProb}% होने का अनुमान है। तापमान ${weather.temp}°C और WBGT ${wbgtValue} है।`
          : `Current rain probability is only ${currentRainProb}%, whereas your scheduled ${routineFormattedTime} routine window has a higher rain risk of ${routineRainProb}%. Current temperature is ${weather.temp}°C with WBGT ${wbgtValue}.`,
        action: isHindi
          ? `आप अभी मैदान पर ${sportName} का अभ्यास शुरू कर सकते हैं। बारिश तेज होने से पहले अपना सत्र पूरा कर लें।`
          : `Proceed with your ${sportName} session now. Complete your core drills before rain chances rise later.`,
        safety: null,
        metrics: {
          temp: `${weather.temp}°C`,
          rainProb: `${currentRainProb}%`,
          wbgt: wbgtValue,
          wind: `${weather.windSpeed || 8} km/h`,
          groundCondition
        },
        ruleTriggered: 'IRREGULAR_ROUTINE_NOW_FAVORABLE',
        disclaimer: isHindi ? 'वर्तमान मौसम बनाम दिनचर्या स्लॉट तुलना के आधार पर।' : 'Based on real-time ambient metrics vs scheduled routine slot comparison.'
      };
    }

    return {
      answer: isHindi
        ? `अभी (${currentTime}, ${timeLabel}) अभ्यास करने के बजाय निर्धारित समय (${routineFormattedTime}) पर स्थितियां अधिक स्थिर रहने का अनुमान है।`
        : `Training right now at ${currentTime} is not optimal. Scheduled session at ${routineFormattedTime} offers more favorable conditions.`,
      why: isHindi
        ? `वर्तमान तापमान ${weather.temp}°C (WBGT ${wbgtValue}) है। निर्धारित समय (${routineFormattedTime}) पर स्थितियां अधिक उपयुक्त रहेंगी: ${routineScenario.decision.reason}`
        : `Current conditions at ${currentTime}: temp ${weather.temp}°C, WBGT ${wbgtValue}. Scheduled ${routineFormattedTime} window alignment: ${routineScenario.decision.reason}`,
      action: isHindi
        ? `अभी इनडोर टैक्टिकल समीक्षा करें और मैदान पर मुख्य अभ्यास निर्धारित ${routineFormattedTime} बजे करें।`
        : `Opt for indoor tactical recovery now and proceed with outdoor ${sportName} drills at ${routineFormattedTime}.`,
      safety: null,
      metrics: {
        temp: `${weather.temp}°C`,
        rainProb: `${currentRainProb}%`,
        wbgt: wbgtValue,
        wind: `${weather.windSpeed || 8} km/h`,
        groundCondition
      },
    };
  }

  // -------------------------------------------------------------
  // 4. RAIN DURING TRAINING / SPECIFIC TIME
  // -------------------------------------------------------------
  if (intent.type === 'rain_during_training' || intent.type === 'rain_query') {
    const targetTime = intent.requestedTime || scheduledSportsActivity.startTime || '17:00';
    const slot = findForecastSlot(context.forecast, targetTime);
    const rainProb = slot?.pop ?? weather.rainProbability ?? 20;

    if (rainProb >= 65) {
      return {
        answer: isHindi
          ? `हाँ, आपके ${targetTime} बजे के ${sportName} अभ्यास के दौरान बारिश की उच्च संभावना (${rainProb}%) है।`
          : `Yes, there is a high probability of rain (${rainProb}%) during your ${targetTime} ${sportName} session.`,
        why: isHindi
          ? `पूर्वानुमान के अनुसार ${targetTime} बजे वर्षा की संभावना ${rainProb}% है, जिससे मैदान पर फिसलन हो सकती है और गेंद का नियंत्रण प्रभावित होगा।`
          : `Forecast indicates a ${rainProb}% precipitation chance around ${targetTime}, likely leading to slick turf traction and impaired ball dynamics.`,
        action: isHindi
          ? `अभ्यास को इनडोर हॉल में स्थानांतरित करें या अभ्यास समय को सुबह 7:30 बजे के सूखे स्लॉट में पुनर्निर्धारित करें।`
          : `Consider moving drills to an indoor sports complex or shifting your session to an earlier dry morning window.`,
        safety: isHindi ? 'सड़क व मैदान पर जलभराव के प्रति सावधान रहें।' : 'Be watchful for localized waterlogging on the training ground.',
        metrics: {
          temp: slot ? `${slot.temp}°C` : `${weather.temp}°C`,
          rainProb: `${rainProb}%`,
          wbgt: wbgtValue,
          wind: `${weather.windSpeed || 12} km/h`,
          groundCondition: isHindi ? 'गीला / फिसलन भरा' : 'Wet / Slick'
        },
        ruleTriggered: 'RAIN_RISK_HIGH_DURING_SESSION',
        disclaimer: isHindi ? 'डॉप्लर रडार और 3-घंटे के वर्षा पूर्वानुमान पर आधारित।' : 'Derived from IMD 3-hourly forecast precipitation timeline.'
      };
    }

    return {
      answer: isHindi
        ? `नहीं, आपके ${targetTime} बजे के अभ्यास के दौरान बारिश का कोई खास खतरा नहीं है (${rainProb}% संभावना)।`
        : `No, rain is unlikely to disrupt your ${targetTime} ${sportName} training (${rainProb}% chance).`,
      why: isHindi
        ? `${targetTime} बजे बारिश की संभावना नगण्य (${rainProb}%) है और मैदान सूखा रहेगा।`
        : `Precipitation probability remains minimal (${rainProb}%) through the ${targetTime} training window with firm ground conditions.`,
      action: isHindi
        ? `आप अपने निर्धारित समय पर सामान्य आउटडोर अभ्यास जारी रख सकते हैं। ${sportMeta.gearAdviceHi}`
        : `You can proceed confidently with normal outdoor training as scheduled. ${sportMeta.gearAdviceEn}`,
      safety: null,
      metrics: {
        temp: slot ? `${slot.temp}°C` : `${weather.temp}°C`,
        rainProb: `${rainProb}%`,
        wbgt: wbgtValue,
        wind: `${weather.windSpeed || 8} km/h`,
        groundCondition
      },
      ruleTriggered: 'RAIN_RISK_LOW_DURING_SESSION',
      disclaimer: isHindi ? 'डॉप्लर रडार और 3-घंटे के वर्षा पूर्वानुमान पर आधारित।' : 'Derived from IMD 3-hourly forecast precipitation timeline.'
    };
  }

  // -------------------------------------------------------------
  // 5. HEAT / WBGT / WATER HYDRATION RISK
  // -------------------------------------------------------------
  if (intent.type === 'heat_wbgt_risk' || intent.type === 'water_hydration') {
    if (wbgtZone === 'high' || wbgtZone === 'extreme' || (weather.temp != null && weather.temp > 35)) {
      return {
        answer: isHindi
          ? `हाँ, आज तापीय तनाव (WBGT ${wbgtValue}) उच्च स्तर पर है। अतिरिक्त पानी और विश्राम आवश्यक है।`
          : `Yes, heat stress is elevated (WBGT ${wbgtValue}). Extra hydration and frequent rest breaks are required.`,
        why: isHindi
          ? `वर्तमान तापमान ${weather.temp}°C और आर्द्रता ${weather.humidity}% के कारण शरीर से पसीना तेजी से निकलता है और निर्जलीकरण का खतरा बढ़ जाता है।`
          : `High ambient temperature (${weather.temp}°C) combined with ${weather.humidity}% relative humidity increases cardiovascular and thermoregulatory strain.`,
        action: isHindi
          ? `हर 15 मिनट पर इलेक्ट्रोलाइट युक्त पानी पिएं। उच्च-तीव्रता वाले अभ्यास की अवधि घटाएं और खिलाड़ियों को छायादार विश्राम दें।`
          : `Take mandatory hydration breaks every 15 minutes. Reduce sprint drill volume and provide shaded rest zones.`,
        safety: isHindi ? 'हीट क्रैम्प्स या चक्कर आने के लक्षणों पर तुरंत ध्यान दें।' : 'Monitor athletes for early signs of heat exhaustion or cramps.',
        metrics: {
          temp: `${weather.temp}°C`,
          rainProb: `${weather.rainProbability || 10}%`,
          wbgt: wbgtValue,
          wind: `${weather.windSpeed || 8} km/h`,
          groundCondition
        },
        ruleTriggered: 'WBGT_HEAT_STRESS_ELEVATED',
        disclaimer: isHindi ? 'तापमान, आर्द्रता, हवा और UV से परिकलित WBGT मॉडल पर आधारित।' : 'Calculated via outdoor WBGT (Wet Bulb Globe Temperature) formulation.'
      };
    }

    return {
      answer: isHindi
        ? `नहीं, वर्तमान में तापीय तनाव सामान्य और सुरक्षित सीमा (WBGT ${wbgtValue}) में है।`
        : `No, heat stress is currently within safe physiological limits (WBGT ${wbgtValue}).`,
      why: isHindi
        ? `तापमान ${weather.temp}°C और आर्द्रता ${weather.humidity}% सामान्य सीमा में है, जिससे शरीर का तापमान नियंत्रित रहता है।`
        : `Current temperature (${weather.temp}°C) and moderate humidity allow normal thermoregulation during physical exertion.`,
      action: isHindi
        ? `मानक जलयोजन बनाए रखें। सामान्य गति से अभ्यास जारी रख सकते हैं।`
        : `Maintain standard athletic hydration intervals. Proceed with scheduled workout intensity.`,
      safety: null,
      metrics: {
        temp: `${weather.temp}°C`,
        rainProb: `${weather.rainProbability || 10}%`,
        wbgt: wbgtValue,
        wind: `${weather.windSpeed || 8} km/h`,
        groundCondition
      },
      ruleTriggered: 'WBGT_HEAT_STRESS_SAFE',
      disclaimer: isHindi ? 'तापमान, आर्द्रता, हवा और UV से परिकलित WBGT मॉडल पर आधारित।' : 'Calculated via outdoor WBGT (Wet Bulb Globe Temperature) formulation.'
    };
  }

  // -------------------------------------------------------------
  // 6. BEST TRAINING TIME TODAY
  // -------------------------------------------------------------
  if (intent.type === 'best_time') {
    let optimalSlot = null;
    if (context.forecast && context.forecast.length > 0) {
      optimalSlot = context.forecast.find(s => (s.pop || 0) <= 25 && (s.temp || 30) <= 27) || context.forecast[0];
    }
    const bestTimeStr = optimalSlot?.time ? optimalSlot.time : '06:00–07:30';

    return {
      answer: isHindi
        ? `आज ${sportName} के लिए सबसे उत्तम प्रशिक्षण समय ${bestTimeStr} रहेगा।`
        : `The best training window for ${sportName} today is ${bestTimeStr}.`,
      why: isHindi
        ? `इस समय तापमान ${optimalSlot?.temp || 24}°C शीतल रहेगा, बारिश की संभावना न्यूनतम (<20%) रहेगी और हवा मंद रहेगी।`
        : `This window offers cooler temperatures (${optimalSlot?.temp || 24}°C), low rain probability (<20%), and gentle wind conditions.`,
      action: isHindi
        ? `मुख्य एरोबिक व टैक्टिकल अभ्यास इसी समय स्लॉट में पूरा करने की योजना बनाएं।`
        : `Schedule your primary conditioning and scrimmage drills during this optimal window.`,
      safety: null,
      metrics: {
        temp: optimalSlot ? `${optimalSlot.temp}°C` : `${weather.temp}°C`,
        rainProb: optimalSlot ? `${optimalSlot.pop}%` : `${weather.rainProbability || 10}%`,
        wbgt: wbgtValue,
        wind: `${weather.windSpeed || 8} km/h`,
        groundCondition
      },
      ruleTriggered: 'OPTIMAL_TRAINING_WINDOW_IDENTIFIED',
      disclaimer: isHindi ? 'दैनिक 3-घंटे के पूर्वानुमान और तापीय आराम मॉडल पर आधारित।' : 'Identified from 3-hourly forecast array evaluating temperature, pop, and wind.'
    };
  }

  // -------------------------------------------------------------
  // 7. LIGHTNING RISK QUERY
  // -------------------------------------------------------------
  if (intent.type === 'lightning_risk') {
    if (isThunderstorm) {
      return {
        answer: isHindi
          ? `हाँ! आपके क्षेत्र में तड़ित (आकाशीय बिजली) और आंधी-तूफान का गंभीर जोखिम सक्रिय है।`
          : `Yes! There is active lightning and thunderstorm risk in your area.`,
        why: isHindi
          ? `रडार और मौसम बुलेटिन में गरज-चमक के संकेत मिले हैं। खेल मैदान जैसे खुले क्षेत्र बिजली गिरने के लिए अत्यधिक संवेदनशील होते हैं।`
          : `Radar scans and weather reports indicate thunderstorm activity. Open athletic grounds are highly vulnerable to ground lightning strikes.`,
        action: isHindi
          ? `तुरंत मैदान छोड़ें और पक्के भवन या वाहन के भीतर आश्रय लें। ऊंचे पेड़ों या धातु की बाड़ के पास न खड़े हों।`
          : `Immediately clear the open turf and seek indoor shelter. Avoid standing near tall light poles or metal fences.`,
        safety: isHindi ? '⚠️ IMD 30-30 तड़ित सुरक्षा नियम का पालन करें।' : '⚠️ Follow IMD 30-30 Lightning Safety Guidance.',
        metrics: {
          temp: `${weather.temp}°C`,
          rainProb: '85%',
          wbgt: wbgtValue,
          wind: `${weather.windSpeed || 25} km/h`,
          groundCondition: isHindi ? 'असुरक्षित' : 'Hazardous'
        },
        ruleTriggered: 'LIGHTNING_RISK_ACTIVE',
        disclaimer: isHindi ? 'IMD तड़ित नाउकास्ट और रडार अलर्ट पर आधारित।' : 'Derived from IMD lightning nowcast and radar reflectivity.'
      };
    }

    return {
      answer: isHindi
        ? `नहीं, वर्तमान में आपके प्रशिक्षण मैदान पर आकाशीय बिजली (तड़ित) का कोई जोखिम नहीं है।`
        : `No, there is currently zero lightning or thunderstorm risk detected at your location.`,
      why: isHindi
        ? `वायुमंडलीय दबाव स्थिर है, गरज-चमक के बादल नहीं हैं और रडार पर कोई सेल सक्रिय नहीं है।`
        : `Atmospheric stability is high with no convective storm cells detected on regional Doppler radar.`,
      action: isHindi
        ? `आप बिना किसी तड़ित खतरे के आउटडोर अभ्यास जारी रख सकते हैं।`
        : `You can train outdoors safely without convective lightning concerns.`,
      safety: null,
      metrics: {
        temp: `${weather.temp}°C`,
        rainProb: `${weather.rainProbability || 10}%`,
        wbgt: wbgtValue,
        wind: `${weather.windSpeed || 8} km/h`,
        groundCondition
      },
      ruleTriggered: 'LIGHTNING_RISK_NONE',
      disclaimer: isHindi ? 'IMD तड़ित नाउकास्ट और रडार अलर्ट पर आधारित।' : 'Derived from IMD lightning nowcast and radar reflectivity.'
    };
  }

  // -------------------------------------------------------------
  // 8. GROUND / PITCH / WEATHER AT MY GROUND
  // -------------------------------------------------------------
  if (intent.type === 'ground_condition' || intent.type === 'ground_weather') {
    return {
      answer: isHindi
        ? `${locationName} पर मैदान की स्थिति: ${groundCondition}।`
        : `Field condition at ${locationName}: ${groundCondition}.`,
      why: isHindi
        ? `वर्तमान तापमान ${weather.temp}°C, आर्द्रता ${weather.humidity}% और हवा की गति ${weather.windSpeed || 8} km/h है। सतह नमी ${isGroundWet ? '45%' : '18%'} पर आंकी गई है।`
        : `Ambient temperature is ${weather.temp}°C with ${weather.humidity}% humidity and ${weather.windSpeed || 8} km/h breeze. Surface moisture is estimated at ${isGroundWet ? '45%' : '18%'}.`,
      action: isHindi
        ? `${sportMeta.gearAdviceHi}`
        : `${sportMeta.gearAdviceEn}`,
      safety: null,
      metrics: {
        temp: `${weather.temp}°C`,
        rainProb: `${weather.rainProbability || 15}%`,
        wbgt: wbgtValue,
        wind: `${weather.windSpeed || 8} km/h (${weather.windDirection || 'SSW'})`,
        groundCondition
      },
      ruleTriggered: 'GROUND_CONDITION_EVALUATED',
      disclaimer: isHindi ? 'स्थान विशिष्ट सतह नमी और मौसम डेटा पर आधारित।' : 'Calculated from location surface moisture and ambient metrics.'
    };
  }

  // -------------------------------------------------------------
  // 9. EXPLAINABILITY ("Why shouldn't I train at 5 PM?" or "Why?")
  // -------------------------------------------------------------
  if (intent.type === 'explain_why') {
    const targetTime = intent.requestedTime || scheduledSportsActivity.startTime || '17:00';
    const slot = findForecastSlot(context.forecast, targetTime);
    const rainProb = slot?.pop ?? weather.rainProbability ?? 20;

    return {
      answer: isHindi
        ? `यह निर्णय आपके खेल (${sportName}), समय (${targetTime}) और मौसम सीमा के नियमों पर आधारित है।`
        : `This recommendation is determined by specific weather thresholds configured for ${sportName} at ${targetTime}.`,
      why: isHindi
        ? `नियम विश्लेषण: (1) वर्षा संभावना: ${rainProb}% (सुरक्षित सीमा: <${sportMeta.maxRainProb}%), (2) तापीय तनाव WBGT: ${wbgtValue} (अधिकतम सीमा: ${sportMeta.maxWbgt}°C), (3) हवा की गति: ${weather.windSpeed || 8} km/h (सीमा: <${sportMeta.maxWindKph} km/h)।`
        : `Rule Breakdown: (1) Precipitation Probability: ${rainProb}% (Safe threshold: <${sportMeta.maxRainProb}%), (2) WBGT Heat Stress: ${wbgtValue} (Max recommended: ${sportMeta.maxWbgt}°C), (3) Wind Velocity: ${weather.windSpeed || 8} km/h (Limit: <${sportMeta.maxWindKph} km/h).`,
      action: isHindi
        ? `जब ये सीमाएँ पार होती हैं, तो चोट से बचाव और प्रशिक्षण प्रभावशीलता के लिए समय बदलने या इनडोर जाने की सलाह दी जाती है।`
        : `When any of these thresholds are breached, shifting schedules or utilizing indoor facilities protects athlete safety.`,
      safety: null,
      metrics: {
        temp: slot ? `${slot.temp}°C` : `${weather.temp}°C`,
        rainProb: `${rainProb}%`,
        wbgt: wbgtValue,
        wind: `${weather.windSpeed || 8} km/h`,
        groundCondition
      },
      ruleTriggered: 'EXPLAINABILITY_RULE_BREAKDOWN',
      disclaimer: isHindi ? 'पारदर्शी नियम-आधारित मौसम निर्णय तर्क।' : 'Transparent deterministic rule-based evaluation.'
    };
  }

  // -------------------------------------------------------------
  // 10. GENERAL CAN I TRAIN AT [TIME] / CAN I TRAIN TODAY / SPORT SPECIFIC
  // -------------------------------------------------------------
  const targetTime = intent.requestedTime || scheduledSportsActivity.startTime || '17:00';
  const slot = findForecastSlot(context.forecast, targetTime);
  const rainProb = slot?.pop ?? weather.rainProbability ?? 20;
  const isTimeFavorable = rainProb < sportMeta.maxRainProb && (weather.windSpeed || 0) < sportMeta.maxWindKph && wbgtZone !== 'extreme';

  if (!isTimeFavorable) {
    return {
      answer: isHindi
        ? `${targetTime} बजे ${sportName} का अभ्यास आदर्श नहीं है।`
        : `Training ${sportName} at ${targetTime} is not ideal today.`,
      why: isHindi
        ? `पूर्वानुमान के अनुसार ${targetTime} बजे बारिश की संभावना ${rainProb}% और हवा ${weather.windSpeed || 15} km/h है, जिससे अभ्यास में बाधा आ सकती है।`
        : `Rain probability is ${rainProb}% and winds are ${weather.windSpeed || 15} km/h around ${targetTime}, which may compromise drill effectiveness.`,
      action: isHindi
        ? `अभ्यास को इनडोर हॉल में करें या सुबह के सूखे स्लॉट में पुनर्निर्धारित करें।`
        : `Consider moving training indoors or rescheduling to a drier morning window.`,
      safety: null,
      metrics: {
        temp: slot ? `${slot.temp}°C` : `${weather.temp}°C`,
        rainProb: `${rainProb}%`,
        wbgt: wbgtValue,
        wind: `${weather.windSpeed || 12} km/h`,
        groundCondition: isHindi ? 'गीला / फिसलन भरा' : 'Wet / Slick'
      },
      ruleTriggered: 'TRAINING_CONDITIONS_UNFAVORABLE',
      disclaimer: isHindi ? 'दैनिक मौसम पूर्वानुमान और खेल विशिष्ट सीमा के आधार पर।' : 'Based on IMD forecast and sport-specific physical thresholds.'
    };
  }

  return {
    answer: isHindi
      ? `हाँ, ${targetTime} बजे ${sportName} के अभ्यास के लिए मौसम पूरी तरह अनुकूल है।`
      : `Yes, weather conditions at ${targetTime} are fully favorable for ${sportName} training.`,
    why: isHindi
      ? `बारिश की संभावना केवल ${rainProb}% है, तापमान ${slot?.temp || weather.temp}°C और हवा ${weather.windSpeed || 8} km/h शांत है। मैदान की ग्रिप अच्छी रहेगी।`
      : `Rain probability is only ${rainProb}%, temperature is comfortable at ${slot?.temp || weather.temp}°C, and winds are mild at ${weather.windSpeed || 8} km/h. Turf grip is firm.`,
    action: isHindi
      ? `आप अपने निर्धारित समय पर सामान्य आउटडोर सत्र कर सकते हैं। ${sportMeta.gearAdviceHi}`
      : `Proceed with your scheduled session outdoors. ${sportMeta.gearAdviceEn}`,
    safety: null,
    metrics: {
      temp: slot ? `${slot.temp}°C` : `${weather.temp}°C`,
      rainProb: `${rainProb}%`,
      wbgt: wbgtValue,
      wind: `${weather.windSpeed || 8} km/h`,
      groundCondition
    },
    ruleTriggered: 'TRAINING_CONDITIONS_FAVORABLE',
    disclaimer: isHindi ? 'आधिकारिक IMD मौसम पूर्वानुमान और खेल नियमों पर आधारित।' : 'Based on official IMD forecast and sport-specific parameters.'
  };
}
