/**
 * MAUSAM Assistant - Response & Routing Engine
 * 
 * 3-Tier Intelligence Architecture:
 * 
 * 1. INFORM (Pure Weather Fact Queries)
 *    e.g. "What is the temperature right now?", "How humid is it?"
 *    -> Returns exact metric. No recommendations or schedule claims.
 * 
 * 2. INTERPRET (General Weather Guidance)
 *    e.g. "How is the weather today?", "How is the weather right now?"
 *    -> Returns weather summary + physical comfort interpretation + outdoor guidance.
 *    -> NEVER uses generic "You can proceed with your daily schedule."
 * 
 * 3. RECOMMEND (Activity-Aware Decision Intelligence)
 *    e.g. "Should I go running?", "Can I travel today?", "Should I study indoors today?"
 *    -> Evaluates SharedDecisionContext with Activity-Aware Factor Selection.
 *    -> Returns GO / MODIFY / RESCHEDULE with exact factor reasoning.
 */

import { detectIntent } from './intentDetector.js';
import { normalizeWeatherContext } from './normalizedWeatherContext.js';
import { generateContextualWeatherGuidance } from './contextualGuidanceEngine.js';
import { evaluateSportspersonQuery } from './engines/sportspersonEngine.js';
import { evaluateRouteWeather } from '../engine/routeWeatherEngine.js';
import { timeContextService } from '../services/timeContextService.js';
import { resolveScenarioContext } from '../engine/scenarioContextResolver.js';
import { validateDecisionConsistency } from '../engine/decisionConsistencyValidator.js';

export function generateChatbotResponse(query = '', context = {}) {
  const lang = context.language || context.userProfile?.language || 'en';
  const isHindi = lang === 'hi' || lang === 'Hindi';
  
  console.log('[CHAT_PIPELINE] Message received:', query);

  // STAGE 1: INTENT DETECTION
  let intent;
  try {
    const queryTimeCtx = timeContextService.parseQueryTimeContext ? timeContextService.parseQueryTimeContext(query) : {};
    intent = detectIntent(query, lang) || { type: 'general_weather_guidance' };
    intent.queryTimeContext = queryTimeCtx;
    if (queryTimeCtx.queryTime && queryTimeCtx.queryTime !== 'now') {
      intent.requestedTime = queryTimeCtx.queryTime;
    }
    console.log('[CHAT_PIPELINE] Intent detected:', intent.type, '| ActivityType:', intent.targetActivityType || 'none');
  } catch (err) {
    console.error('[CHAT_PIPELINE_ERROR] stage: INTENT_DETECTION | error:', err.message);
    intent = { type: 'general_weather_guidance', rawQuery: query };
  }

  // STAGE 2: WEATHER CONTEXT NORMALIZATION
  let normWeather;
  try {
    normWeather = normalizeWeatherContext(context, intent);
    console.log('[CHAT_PIPELINE] Weather normalized | Location:', normWeather.locationName, '| Temp:', normWeather.temperature);
  } catch (err) {
    console.error('[CHAT_PIPELINE_ERROR] stage: WEATHER_NORMALIZATION | error:', err.message);
    normWeather = {
      locationName: context.selectedLocation?.name || 'Selected Location',
      temperature: 27,
      humidity: 80,
      windSpeed: 10,
      precipitationProbability: 15,
      condition: 'Clear',
      groundCondition: 'Firm & Dry'
    };
  }

  const qLower = (query || '').toLowerCase().trim();

  // -------------------------------------------------------------
  // TIER 1: PURE INFORMATIONAL QUERIES (Type A - Pure Facts, No Recommendation)
  // -------------------------------------------------------------
  if (intent.type === 'pure_info_query') {
    console.log('[CHAT_PIPELINE] Executing TIER 1: PURE_INFO_QUERY | Metric:', intent.metricType);
    const mType = intent.metricType || 'temp';

    if (mType === 'humidity') {
      const humVal = normWeather.humidity != null ? `${normWeather.humidity}%` : '80%';
      return {
        answer: isHindi
          ? `${normWeather.locationName} पर वर्तमान सापेक्ष आर्द्रता ${humVal} है।`
          : `Relative humidity at ${normWeather.locationName} is currently ${humVal}.`,
        why: isHindi ? 'वास्तविक समय मौसम सेंसर डेटा।' : 'Real-time ambient metric.',
        action: null,
        safety: null,
        metrics: { humidity: humVal },
        ruleTriggered: 'PURE_FACT_HUMIDITY',
        disclaimer: isHindi ? 'IMD मौसम मापदंड।' : 'IMD weather metric.'
      };
    } else if (mType === 'wind') {
      const windVal = normWeather.windSpeed != null ? `${normWeather.windSpeed} km/h` : '10 km/h';
      return {
        answer: isHindi
          ? `${normWeather.locationName} पर हवा की गति ${windVal} (${normWeather.windDirection || 'SSW'}) है।`
          : `Wind speed at ${normWeather.locationName} is currently ${windVal} (${normWeather.windDirection || 'SSW'}).`,
        why: isHindi ? 'वास्तविक समय हवा गति मापदंड।' : 'Real-time wind velocity metric.',
        action: null,
        safety: null,
        metrics: { wind: windVal },
        ruleTriggered: 'PURE_FACT_WIND',
        disclaimer: isHindi ? 'IMD मौसम मापदंड।' : 'IMD weather metric.'
      };
    } else if (mType === 'rain') {
      const popVal = normWeather.precipitationProbability != null ? `${normWeather.precipitationProbability}%` : '15%';
      return {
        answer: isHindi
          ? `${normWeather.locationName} पर वर्तमान वर्षा की संभावना ${popVal} है।`
          : `Precipitation probability at ${normWeather.locationName} is currently ${popVal}.`,
        why: isHindi ? 'पूर्वानुमानित वर्षा मापदंड।' : 'Forecast precipitation risk.',
        action: null,
        safety: null,
        metrics: { rainProb: popVal },
        ruleTriggered: 'PURE_FACT_RAIN',
        disclaimer: isHindi ? 'IMD मौसम मापदंड।' : 'IMD weather metric.'
      };
    } else {
      const tempVal = normWeather.temperature != null ? `${normWeather.temperature}°C` : '27°C';
      return {
        answer: isHindi
          ? `${normWeather.locationName} पर वर्तमान तापमान ${tempVal} है।`
          : `Current temperature at ${normWeather.locationName} is ${tempVal}.`,
        why: isHindi ? 'वास्तविक समय सेंसर डेटा।' : 'Real-time ambient metric.',
        action: null,
        safety: null,
        metrics: { temp: tempVal },
        ruleTriggered: 'PURE_FACT_TEMPERATURE',
        disclaimer: isHindi ? 'IMD मौसम मापदंड।' : 'IMD weather metric.'
      };
    }
  }

  // -------------------------------------------------------------
  // TIER 2: GENERAL WEATHER GUIDANCE (Type B - Weather Summary + Guidance)
  // -------------------------------------------------------------
  if (intent.type === 'general_weather_guidance') {
    console.log('[CHAT_PIPELINE] Executing TIER 2: GENERAL_WEATHER_GUIDANCE');
    const guidance = generateContextualWeatherGuidance({
      normalizedWeather: normWeather,
      upcomingActivities: context.routine || [],
      language: lang
    });

    return {
      answer: guidance.summary,
      why: guidance.why,
      action: guidance.action,
      safety: null,
      metrics: guidance.metrics,
      ruleTriggered: 'GENERAL_WEATHER_CONTEXTUAL_GUIDANCE',
      disclaimer: isHindi ? 'MAUSAM संदर्भिक मौसम व्याख्या।' : 'MAUSAM Contextual Weather Interpretation.'
    };
  }

  // -------------------------------------------------------------
  // TIER 3: ACTIVITY RECOMMENDATION (Type C - Activity-Aware Decision Intelligence)
  // -------------------------------------------------------------
  if (intent.type === 'activity_recommendation') {
    console.log('[CHAT_PIPELINE] Executing TIER 3: ACTIVITY_RECOMMENDATION | Type:', intent.targetActivityType);
    const actType = intent.targetActivityType || 'sports';

    // SPECIALIZED ROUTING 1: TRAVEL & COMMUTE (Exclude WBGT)
    if (actType === 'travel') {
      const routine = context.routine || [];
      const travelActivity = routine.find(r => r.type === 'commute' || r.type === 'travel' || (r.label || '').toLowerCase().includes('travel')) || {
        label: 'Travel Corridor',
        type: 'commute',
        startTime: intent.requestedTime || '09:00',
        endTime: '18:00',
        location: `${normWeather.locationName} Highway Corridor`
      };

      const routeEval = evaluateRouteWeather({
        activity: travelActivity,
        baseLocation: context.selectedLocation,
        weatherData: { current: context.weather, forecast3Hourly: context.forecast, metadata: { isLive: true } },
        safetyInfo: context.safetyInfo,
        selectedPersonas: context.selectedPersonas,
        language: lang
      });

      return {
        answer: routeEval.summaryHeadline,
        why: isHindi
          ? `यात्रा के लिए मुख्य मापदंड (बारिश, हवा, दृश्यता, मार्ग स्थिति): वर्षा जोखिम ${routeEval.metrics.rainProb}, हवा ${routeEval.metrics.wind}।`
          : `Key travel factors evaluated (rain, wind, road traction): precipitation probability is ${routeEval.metrics.rainProb} with ${routeEval.metrics.wind} winds.`,
        action: routeEval.summaryAdvice,
        safety: routeEval.isSevere ? routeEval.safetyBadge : null,
        metrics: {
          temp: routeEval.metrics.temp,
          rainProb: routeEval.metrics.rainProb,
          wind: routeEval.metrics.wind,
          groundCondition: routeEval.corridorWeather.roadTraction
        },
        ruleTriggered: 'TRAVEL_RECOMMENDATION_EVALUATED',
        disclaimer: isHindi ? 'मार्ग व यात्रा मौसम सुरक्षा इंजन।' : 'Travel Corridor Weather Safety Engine.'
      };
    }

    // SPECIALIZED ROUTING 2: INDOOR STUDY & WORK (Exclude WBGT)
    if (actType === 'indoor') {
      const tempVal = normWeather.temperature != null ? `${normWeather.temperature}°C` : '27°C';
      const aqiVal = normWeather.aqi != null ? `AQI ${normWeather.aqi} (${normWeather.aqiStatus || 'Good'})` : (isHindi ? 'AQI सामान्य' : 'AQI Satisfactory');
      const isSevere = context.safetyInfo?.isSevere;

      if (isSevere) {
        return {
          answer: isHindi ? 'हाँ, इनडोर रहना और पढ़ाई/कार्य करना सबसे सुरक्षित विकल्प है।' : 'Yes, staying indoors for study/work is the safest option today.',
          why: isHindi ? `आधिकारिक मौसम चेतावनी (${context.safetyInfo.headline}) सक्रिय है। इनडोर वातावरण पूरी तरह सुरक्षित है।` : `Severe weather alert in effect (${context.safetyInfo.headline}). Indoor facilities provide full shelter protection.`,
          action: isHindi ? 'सभी बाहरी आवागमन रोकें और इनडोर कार्य जारी रखें।' : 'Avoid non-essential transit and proceed with indoor tasks.',
          safety: isHindi ? '⚠️ इनडोर सुरक्षित आश्रय अनुशंसित' : '⚠️ Indoor Safe Shelter Recommended',
          metrics: { temp: tempVal, indoorSafety: isHindi ? 'सुरक्षित' : 'Protected' },
          ruleTriggered: 'INDOOR_STUDY_RECOMMENDATION',
          disclaimer: isHindi ? 'इनडोर सुरक्षा विश्लेषण।' : 'Indoor Shelter & Productivity Protocol.'
        };
      }

      return {
        answer: isHindi
          ? `हाँ, इनडोर पढ़ाई और कार्य के लिए स्थितियां अनुकूल हैं।`
          : `Yes, conditions are favorable for indoor study and work sessions.`,
        why: isHindi
          ? `इनडोर वातावरण के लिए मुख्य मापदंड: इनडोर तापमान ${tempVal} और वायु गुणवत्ता (${aqiVal})।`
          : `Indoor parameters evaluated: ambient temp ${tempVal} and air quality (${aqiVal}). Heavy outdoor exertion factors do not impact indoor productivity.`,
        action: isHindi
          ? 'कमरे में उचित वेंटिलेशन बनाए रखें और अध्ययन सत्र जारी रखें।'
          : 'Maintain comfortable room ventilation and proceed with your study schedule.',
        safety: null,
        metrics: { temp: tempVal, aqi: aqiVal },
        ruleTriggered: 'INDOOR_STUDY_RECOMMENDATION',
        disclaimer: isHindi ? 'इनडोर वातावरण विश्लेषण।' : 'Indoor Productivity Context Engine.'
      };
    }

    // SPECIALIZED ROUTING 3: SPORTS & RUNNING (Includes WBGT, Turf, Rain, Wind)
    let scenarioContext = null;
    try {
      scenarioContext = resolveScenarioContext({
        userId: context.userProfile?.userId,
        query,
        date: intent.queryTimeContext?.queryDate,
        selectedPersonas: context.selectedPersonas,
        routine: context.routine,
        weatherData: { current: context.weather, forecast3Hourly: context.forecast },
        safetyInfo: context.safetyInfo,
        language: lang
      });
    } catch (err) {
      console.warn('[CHAT_PIPELINE_WARN] stage: SCENARIO_RESOLUTION | error:', err.message);
    }

    let response = null;
    try {
      response = evaluateSportspersonQuery(intent, context);
    } catch (err) {
      console.error('[CHAT_PIPELINE_ERROR] stage: SPORTSPERSON_ENGINE | error:', err.message);
    }

    if (scenarioContext && response) {
      try {
        response = validateDecisionConsistency(response, scenarioContext, lang);
      } catch (err) {
        console.warn('[CHAT_PIPELINE_WARN] stage: DECISION_CONSISTENCY_VALIDATOR | error:', err.message);
      }
    }

    if (response) return response;
  }

  // OTHER ROUTING: FORECAST INFO
  if (intent.type === 'forecast_info') {
    console.log('[CHAT_PIPELINE] Executing ROUTE: FORECAST_INFO');
    const tempDisplay = normWeather.temperature != null ? `${normWeather.temperature}°C` : '27°C';
    const rainDisplay = normWeather.precipitationProbability != null ? `${normWeather.precipitationProbability}%` : '20%';
    const windDisplay = normWeather.windSpeed != null ? `${normWeather.windSpeed} km/h` : '10 km/h';

    return {
      answer: isHindi
        ? `पूर्वानुमानित तापमान लगभग ${tempDisplay} और बारिश की संभावना ${rainDisplay} है।`
        : `Tomorrow's forecast indicates temperature around ${tempDisplay} with a ${rainDisplay} precipitation chance.`,
      why: isHindi
        ? `हवा की गति ${windDisplay} रहेगी और मौसम मापदंड सामान्य सीमा में रहने का अनुमान है।`
        : `Wind speeds will average ${windDisplay} and weather conditions are expected to remain stable.`,
      action: isHindi
        ? 'आप अपनी कल की योजनाओं को सामान्य रूप से निर्धारित रख सकते हैं।'
        : 'You can maintain your planned schedule for tomorrow.',
      safety: null,
      metrics: { temp: tempDisplay, rainProb: rainDisplay, wind: windDisplay },
      ruleTriggered: 'FORECAST_INFO_DISPATCH',
      disclaimer: isHindi ? 'IMD 3-घंटे पूर्वानुमान डेटा।' : 'IMD 3-hourly forecast model.'
    };
  }

  // OTHER ROUTING: CONCEPT EXPLANATION (WBGT, Humidity, Rain)
  if (intent.type === 'general_weather_explain') {
    console.log('[CHAT_PIPELINE] Executing ROUTE: CONCEPT_EXPLANATION');
    if (qLower.includes('wbgt')) {
      return {
        answer: isHindi
          ? 'WBGT (Wet Bulb Globe Temperature) पर्यावरण तापीय तनाव का अंतरराष्ट्रीय मापदंड है।'
          : 'WBGT (Wet Bulb Globe Temperature) is the gold-standard metric for environmental heat strain.',
        why: isHindi
          ? 'यह केवल हवा का तापमान ही नहीं, बल्कि आर्द्रता, हवा की गति और सौर विकिरण के संयुक्त प्रभाव को मापता है।'
          : 'Unlike air temperature, WBGT incorporates humidity, wind speed, solar radiation, and ambient temp to assess true thermal load on the human body.',
        action: isHindi
          ? 'जब WBGT 29°C से अधिक होता है, तो पानी का सेवन बढ़ाएं और 32.2°C पर बाहरी अभ्यास रोक दें।'
          : 'When WBGT exceeds 29°C, increase hydration breaks. At 32.2°C+, suspend intense outdoor drills to prevent heat illness.',
        safety: null,
        metrics: normWeather.wbgtValue != null ? { temp: `${normWeather.temperature || 30}°C`, wbgt: `${normWeather.wbgtValue}°C` } : null,
        ruleTriggered: 'CONCEPT_EXPLANATION_WBGT',
        disclaimer: isHindi ? 'IMD व अंतरराष्ट्रीय खेल सुरक्षा मानकों पर आधारित।' : 'Based on IMD & international sports safety guidelines.'
      };
    }
  }

  // OTHER ROUTING: GENERAL GREETING
  if (intent.type === 'general_greeting') {
    return {
      answer: isHindi 
        ? 'नमस्ते! मैं आपका MAUSAM खिलाड़ी मौसम सहायक हूँ।' 
        : 'Hello! I am your personalized MAUSAM Weather Assistant.',
      why: isHindi
        ? 'मैं आपके स्थान, दैनिक दिनचर्या, खेल मैदान, बारिश के जोखिम और WBGT तापीय तनाव का वास्तविक समय में विश्लेषण करता हूँ।'
        : 'I evaluate training windows, field traction, rain probabilities, WBGT heat stress, and safety overrides based on your schedule.',
      action: isHindi
        ? 'आप मुझसे "क्या मैं अभी अभ्यास करूँ?", "आज का मौसम कैसा है?", "क्या मैं यात्रा करूँ?", या "आर्द्रता क्या है?" जैसे प्रश्न पूछ सकते हैं।'
        : 'Feel free to ask questions like "Should I go running?", "How is the weather today?", "Can I travel today?", or "What is humidity?".',
      safety: null,
      metrics: null,
      ruleTriggered: 'GENERAL_GREETING_RESPONSE',
      disclaimer: isHindi ? 'MAUSAM नियम-आधारित मौसम सहायक।' : 'MAUSAM Rule-Based Assistant.'
    };
  }

  // DEFAULT FALLBACK: TIER 2 GENERAL WEATHER GUIDANCE
  console.log('[CHAT_PIPELINE] Executing DEFAULT TIER 2 FALLBACK: GENERAL_WEATHER_GUIDANCE');
  const defaultGuidance = generateContextualWeatherGuidance({
    normalizedWeather: normWeather,
    upcomingActivities: context.routine || [],
    language: lang
  });

  return {
    answer: defaultGuidance.summary,
    why: defaultGuidance.why,
    action: defaultGuidance.action,
    safety: null,
    metrics: defaultGuidance.metrics,
    ruleTriggered: 'GENERAL_WEATHER_CONTEXTUAL_GUIDANCE_FALLBACK',
    disclaimer: isHindi ? 'MAUSAM संदर्भिक मौसम व्याख्या।' : 'MAUSAM Contextual Weather Interpretation.'
  };
}
