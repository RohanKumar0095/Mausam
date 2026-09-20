/**
 * MAUSAM - Scientifically Validated Outdoor WBGT (Wet-Bulb Globe Temperature) Engine
 * 
 * Implements a tiered calculation architecture:
 * - Tier 1: Comprehensive Outdoor Solar WBGT (when T, RH, Wind, and Solar/UV are all present)
 * - Tier 2: Australian Bureau of Meteorology (BOM) / ACSM Psychrometric WBGT Model (when T and RH are present)
 * 
 * Classifies heat stress according to ACSM / NATA Sports Medicine Standards.
 * Evaluates session-specific heat risk across scheduled activity time windows.
 */

// ACSM / NATA WBGT Thresholds for Athletic Activity (°C)
const WBGT_THRESHOLDS = {
  LOW: 25.6,        // < 25.6°C: Low Heat Risk
  MODERATE: 27.7,   // 25.6°C - 27.7°C: Moderate Heat Stress
  HIGH: 29.4        // 27.8°C - 29.4°C: High Heat Stress Risk
                    // >= 29.5°C: Extreme Heat Danger
};

/**
 * Normalizes and validates temperature input into Celsius.
 */
function normalizeTemperature(temp) {
  if (temp == null) return null;
  const num = Number(temp);
  if (!Number.isFinite(num)) return null;
  if (num < -50 || num > 60) return null; // Physically valid atmospheric range
  return num;
}

/**
 * Normalizes and validates relative humidity input into percentage (0 - 100%).
 */
function normalizeHumidity(rh) {
  if (rh == null) return null;
  let num = Number(rh);
  if (!Number.isFinite(num)) return null;
  if (num > 0 && num <= 1.0) num = num * 100; // Handle decimal fraction representation
  if (num < 0 || num > 100) return null;
  return num;
}

/**
 * Normalizes wind speed into km/h.
 */
function normalizeWindSpeed(wind) {
  if (wind == null) return 5; // Default ambient wind speed fallback (5 km/h)
  const num = Number(wind);
  if (!Number.isFinite(num) || num < 0) return 5;
  return num;
}

/**
 * Normalizes UV Index into non-negative number.
 */
function normalizeUVIndex(uv) {
  if (uv == null) return null;
  const num = Number(uv);
  if (!Number.isFinite(num) || num < 0) return null;
  return num;
}

/**
 * Stull (2011) approximation for Natural Wet-Bulb Temperature (°C).
 */
function calculateStullWetBulb(T, RH) {
  const t = Math.min(Math.max(T, -20), 50);
  const rh = Math.min(Math.max(RH, 1), 99);

  return (
    t * Math.atan(0.151977 * Math.sqrt(rh + 8.313659)) +
    Math.atan(t + rh) -
    Math.atan(rh - 1.676331) +
    0.00391838 * Math.pow(rh, 1.5) * Math.atan(0.023101 * rh) -
    4.686035
  );
}

/**
 * Tier 2: BOM / ACSM Psychrometric Outdoor WBGT Approximation (°C)
 * WBGT = 0.567 * T + 0.393 * e + 3.94
 * e = (RH / 100) * 6.105 * exp((17.27 * T) / (237.7 + T))
 */
function calculateBOMApproximateWBGT(T, RH) {
  const e = (RH / 100) * 6.105 * Math.exp((17.27 * T) / (237.7 + T));
  const wbgt = 0.567 * T + 0.393 * e + 3.94;
  return Math.round(wbgt * 10) / 10;
}

/**
 * Tier 1: Solar Globe Temperature Estimation for Outdoor Exposure (°C)
 */
function calculateEstimatedGlobeTemp(T, windKph, uvIndex) {
  const solarLoad = uvIndex == null ? 3.0 : (uvIndex < 3 ? 0.5 : uvIndex < 6 ? 2.5 : uvIndex < 8 ? 5.0 : uvIndex < 11 ? 7.5 : 9.5);
  const windFactor = 1 / (1 + windKph * 0.08);
  return T + solarLoad * windFactor;
}

/**
 * Classifies heat stress according to ACSM / NATA Sports Guidelines.
 */
export function getWBGTHeatRiskZone(wbgt, isHindi = false) {
  if (wbgt < WBGT_THRESHOLDS.LOW) {
    return {
      id: 'low',
      label: isHindi ? 'कम तापीय जोखिम' : 'Safe Session Window',
      color: '#0F6E56',
      recommendation: isHindi
        ? 'सामान्य प्रशिक्षण जारी रखा जा सकता है। नियमित जलयोजन बनाए रखें।'
        : 'Recommendation: Normal training can proceed safely. Maintain regular hydration breaks.'
    };
  }

  if (wbgt <= WBGT_THRESHOLDS.MODERATE) {
    return {
      id: 'moderate',
      label: isHindi ? 'मध्यम तापीय तनाव' : 'Moderate Heat Stress',
      color: '#854F0B',
      recommendation: isHindi
        ? 'प्रत्येक 20 मिनट में अनिवार्य जलयोजन ब्रेक दें। खिलाड़ियों में थकान के लक्षणों पर नजर रखें।'
        : 'Recommendation: Enforce mandatory hydration breaks every 20 mins. Monitor athletes for heat fatigue.'
    };
  }

  if (wbgt <= WBGT_THRESHOLDS.HIGH) {
    return {
      id: 'high',
      label: isHindi ? 'उच्च तापीय जोखिम' : 'High Heat Stress Risk',
      color: '#9A3412',
      recommendation: isHindi
        ? 'प्रशिक्षण की तीव्रता और अवधि कम करें। अधिक छायादार विश्राम और जलयोजन ब्रेक दें।'
        : 'Recommendation: Reduce high-intensity training duration and schedule shaded rest breaks.'
    };
  }

  return {
    id: 'extreme',
    label: isHindi ? 'अत्यधिक तापीय खतरा' : 'Extreme Heat Danger',
    color: '#791F1F',
    recommendation: isHindi
      ? 'कठिन आउटडोर अभ्यास से बचें। प्रशिक्षण को इनडोर स्थान पर स्थानांतरित करें या समय बदलें।'
      : 'Recommendation: Avoid strenuous outdoor practice. Move drills to indoor venue or reschedule.'
  };
}

/**
 * Calculates WBGT for a single set of environmental observations.
 */
export function calculateEstimatedWBGT({
  temperature,
  humidity,
  windSpeed,
  uvIndex,
  language = 'en'
}) {
  const isHindi = language === 'hi' || language === 'Hindi';

  // 1. Validate & Normalize Core Parameters
  const T = normalizeTemperature(temperature);
  const RH = normalizeHumidity(humidity);

  if (T == null || RH == null) {
    return {
      available: false,
      reason: isHindi ? 'तापमान और आर्द्रता का मान्य मान आवश्यक है।' : 'Valid temperature and humidity required.'
    };
  }

  const wind = normalizeWindSpeed(windSpeed);
  const uv = normalizeUVIndex(uvIndex);

  let wbgtVal = null;
  let modelTier = 'ACSM Psychrometric Model';

  // 2. Select Model Tier
  if (uv != null) {
    // Tier 1: Solar Outdoor WBGT Model
    const wetBulb = calculateStullWetBulb(T, RH);
    const globeTemp = calculateEstimatedGlobeTemp(T, wind, uv);
    wbgtVal = 0.7 * wetBulb + 0.2 * globeTemp + 0.1 * T;
    wbgtVal = Math.round(wbgtVal * 10) / 10;
    modelTier = isHindi ? 'सौर आउटडोर WBGT मॉडल' : 'Solar Outdoor WBGT Model';
  } else {
    // Tier 2: BOM / ACSM Psychrometric WBGT Model
    wbgtVal = calculateBOMApproximateWBGT(T, RH);
    modelTier = isHindi ? 'BOM साइक्रोमेट्रिक मॉडल' : 'BOM Psychrometric Model';
  }

  // Sanity check output bounds
  if (!Number.isFinite(wbgtVal) || wbgtVal < -10 || wbgtVal > 60) {
    return {
      available: false,
      reason: isHindi ? 'अमान्य गणना मान' : 'Non-finite calculation result.'
    };
  }

  const zone = getWBGTHeatRiskZone(wbgtVal, isHindi);

  return {
    available: true,
    value: wbgtVal,
    unit: '°C',
    zone: zone.id,
    zoneLabel: zone.label,
    zoneColor: zone.color,
    recommendation: zone.recommendation,
    modelTier,
    dryBulbTemp: T,
    humidity: RH,
    windSpeed: wind,
    uvIndex: uv
  };
}

/**
 * Calculates Session-Specific WBGT across scheduled activity time windows.
 */
export function calculateSessionWBGT({
  weatherData,
  currentActivity,
  currentTime = '17:00',
  language = 'en'
}) {
  const isHindi = language === 'hi' || language === 'Hindi';
  const current = weatherData?.current || {};

  // If live weather is unavailable, return clean fallback status
  if (!weatherData?.metadata?.isLive && current.temp == null) {
    return {
      available: false,
      reason: isHindi ? 'लाइव मौसम डेटा उपलब्ध नहीं' : 'Awaiting live weather feed.'
    };
  }

  // 1. Determine Session Time Range
  let startHour = 17;
  let endHour = 19;

  if (currentActivity && currentActivity.startTime && currentActivity.endTime) {
    const [sH] = currentActivity.startTime.split(':').map(Number);
    const [eH] = currentActivity.endTime.split(':').map(Number);
    if (!isNaN(sH)) startHour = sH;
    if (!isNaN(eH)) endHour = Math.max(eH, startHour + 1);
  } else if (currentTime) {
    const [cH] = currentTime.split(':').map(Number);
    if (!isNaN(cH)) {
      startHour = cH;
      endHour = Math.min(23, startHour + 2);
    }
  }

  // 2. Evaluate Forecast Intervals During Session Window
  const forecastList = weatherData?.forecast3Hourly || [];
  let peakWbgt = null;
  let peakHourStr = '';
  let peakCalculatedObj = null;

  if (forecastList.length > 0) {
    forecastList.forEach(slot => {
      const slotHour = parseInt(slot.time, 10);
      if (!isNaN(slotHour) && slotHour >= startHour && slotHour <= endHour) {
        const slotCalc = calculateEstimatedWBGT({
          temperature: slot.temp ?? current.temp,
          humidity: slot.humidity ?? current.humidity,
          windSpeed: current.windSpeed,
          uvIndex: current.uvIndex,
          language
        });

        if (slotCalc.available && (peakWbgt == null || slotCalc.value > peakWbgt)) {
          peakWbgt = slotCalc.value;
          peakHourStr = slot.time;
          peakCalculatedObj = slotCalc;
        }
      }
    });
  }

  // 3. Fallback to Current Conditions if Forecast Interval Evaluation produced null
  if (!peakCalculatedObj) {
    peakCalculatedObj = calculateEstimatedWBGT({
      temperature: current.temp,
      humidity: current.humidity,
      windSpeed: current.windSpeed,
      uvIndex: current.uvIndex,
      language
    });
  }

  if (!peakCalculatedObj || !peakCalculatedObj.available) {
    return {
      available: false,
      reason: isHindi ? 'पर्याप्त तापीय डेटा उपलब्ध नहीं' : 'Insufficient atmospheric data.'
    };
  }

  return {
    ...peakCalculatedObj,
    sessionText: peakHourStr
      ? (isHindi ? `पीक गर्मी ${peakHourStr} बजे` : `Peak WBGT at ${peakHourStr}`)
      : (isHindi ? 'सत्र तापीय सिंक' : 'Session Window Synced')
  };
}


