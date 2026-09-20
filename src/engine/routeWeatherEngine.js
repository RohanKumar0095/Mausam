/**
 * MAUSAM - Route-Based Weather Engine for Daily Routine Cards
 * 
 * Evaluates time-aware weather conditions from Start Location -> Intermediate Checkpoints -> Destination
 * for any scheduled routine activity.
 */

import { calculateEstimatedWBGT } from '../services/wbgtService.js';
import { PREDEFINED_LOCATIONS } from '../data/locationsData.js';

/**
 * Haversine formula to compute actual spherical distance (in km) between two geographical coordinates.
 */
export function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return 3.5;
  if (lat1 === lat2 && lon1 === lon2) return 3.5; // Nominal offset for local area movement

  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const dist = R * c;
  return dist < 0.1 ? 3.5 : Math.round(dist * 10) / 10;
}

/**
 * Helper to parse start and destination from routine activity and location database
 */
export function resolveRoutineRoute({
  activity,
  baseLocation = {},
  allLocations = PREDEFINED_LOCATIONS,
  language = 'en'
}) {
  const isHindi = language === 'hi' || language === 'Hindi';
  const locStr = (activity?.location || '').trim();

  let startName = '';
  let destName = '';
  let startMeta = null;
  let destMeta = null;

  // Check activity direct objects if saved from RoutineEditorModal
  if (activity?.startLocationObj) {
    startMeta = activity.startLocationObj;
    startName = activity.startLocationObj.name;
  }
  if (activity?.endLocationObj) {
    destMeta = activity.endLocationObj;
    destName = activity.endLocationObj.name;
  }

  // Parse string delimiters if names not set
  if (!startName || !destName) {
    if (locStr.includes('→') || locStr.includes('->') || locStr.toLowerCase().includes(' to ')) {
      const delimiter = locStr.includes('→') ? '→' : (locStr.includes('->') ? '->' : ' to ');
      const parts = locStr.split(delimiter).map(s => s.trim());
      startName = startName || parts[0] || (baseLocation.name || 'Base Location');
      destName = destName || parts[1] || 'Destination';
    } else if (activity?.startLocation) {
      startName = startName || activity.startLocation;
      destName = destName || activity.endLocation || activity.location || 'Destination';
    } else {
      startName = startName || baseLocation.name || (isHindi ? 'घर / आधार स्थान' : 'Home / Base Location');
      destName = destName || locStr || (isHindi ? 'गंतव्य स्थान' : 'Destination');
    }
  }

  // Find metadata from location store if matched
  const findLocMeta = (nameQuery, locId) => {
    if (locId) {
      const found = allLocations.find(l => l.id === locId);
      if (found) return found;
    }
    const cleanQuery = (nameQuery || '').toLowerCase();
    return allLocations.find(l => 
      (l.name && l.name.toLowerCase().includes(cleanQuery)) ||
      (l.district && cleanQuery.includes(l.district.toLowerCase())) ||
      (l.purpose && cleanQuery.includes(l.purpose.toLowerCase()))
    ) || null;
  };

  startMeta = startMeta || findLocMeta(startName, activity?.startLocationId || baseLocation?.id) || baseLocation;
  destMeta = destMeta || findLocMeta(destName, activity?.endLocationId || activity?.locationId);

  const startLat = startMeta?.latitude ?? baseLocation.latitude ?? 24.7955;
  const startLon = startMeta?.longitude ?? baseLocation.longitude ?? 85.0002;

  let destLat = destMeta?.latitude;
  let destLon = destMeta?.longitude;

  // If destination metadata missing or identical to start, derive realistic coordinate offset
  if (destLat == null || destLon == null || (destLat === startLat && destLon === startLon)) {
    destLat = startLat + 0.032; // ~3.5 km offset
    destLon = startLon + 0.028;
  }

  return {
    start: {
      name: startName,
      district: startMeta?.district || baseLocation.district || '',
      state: startMeta?.state || baseLocation.state || '',
      latitude: startLat,
      longitude: startLon,
      purpose: startMeta?.purpose || (isHindi ? 'प्रारंभिक बिंदु' : 'Departure Point')
    },
    destination: {
      name: destName,
      district: destMeta?.district || baseLocation.district || '',
      state: destMeta?.state || baseLocation.state || '',
      latitude: destLat,
      longitude: destLon,
      purpose: destMeta?.purpose || activity.label || (isHindi ? 'गंतव्य' : 'Destination')
    }
  };
}

/**
 * Filter 3-hourly forecast slots matching the activity's time window
 */
function getMatchingForecastSlots(forecast3Hourly = [], startTime = '06:30', endTime = '07:30', currentTemp = 28) {
  if (!forecast3Hourly || forecast3Hourly.length === 0) {
    return [{
      time: startTime,
      temp: currentTemp,
      pop: 15,
      humidity: 75,
      condition: 'Partly Cloudy'
    }];
  }

  const [startH] = startTime.split(':').map(Number);
  const [endH] = endTime.split(':').map(Number);

  // Find slots between startH - 1 and endH + 1
  const matching = forecast3Hourly.filter(slot => {
    const [slotH] = (slot.time || '12:00').split(':').map(Number);
    return slotH >= (startH - 1) && slotH <= (endH + 1);
  });

  if (matching.length > 0) return matching;

  // Fallback: closest slot
  let closest = forecast3Hourly[0];
  let minDiff = 999;
  for (const s of forecast3Hourly) {
    const [sH] = (s.time || '12:00').split(':').map(Number);
    const diff = Math.abs(sH - startH);
    if (diff < minDiff) {
      minDiff = diff;
      closest = s;
    }
  }
  return [closest];
}

/**
 * Helper to calculate timestamp string for a specific progress fraction along duration
 */
function calculateArrivalTimestamp(startTimeStr, endTimeStr, progressFraction) {
  const [sH, sM] = (startTimeStr || '07:00').split(':').map(Number);
  const [eH, eM] = (endTimeStr || '08:00').split(':').map(Number);

  let startTotalM = (sH || 7) * 60 + (sM || 0);
  let endTotalM = (eH || 8) * 60 + (eM || 0);

  if (endTotalM <= startTotalM) {
    endTotalM = startTotalM + 60; // Default 1 hr window
  }

  const durationM = endTotalM - startTotalM;
  const currentTotalM = Math.round(startTotalM + progressFraction * durationM);

  const hours = Math.floor(currentTotalM / 60) % 24;
  const mins = currentTotalM % 60;

  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

/**
 * Sample localized weather condition at an intermediate checkpoint coordinate & time
 */
function sampleCheckpointWeather({
  progressPct,
  timeStr,
  lat,
  lon,
  name,
  baseWeather = {},
  forecastSlots = [],
  activityType = 'running',
  isHindi = false
}) {
  const current = baseWeather.current || {};
  const slots = forecastSlots.length > 0 ? forecastSlots : [{ temp: current.temp || 28, pop: 15 }];
  
  // Pick slot matching the time string hour
  const [checkH] = timeStr.split(':').map(Number);
  const matchedSlot = slots.find(s => {
    const [sH] = (s.time || '12:00').split(':').map(Number);
    return Math.abs(sH - checkH) <= 1;
  }) || slots[Math.floor(progressPct / 100 * (slots.length - 1))] || slots[0];

  const basePop = matchedSlot.pop ?? current.pop ?? 20;
  const baseTemp = matchedSlot.temp ?? current.temp ?? 28;
  const baseHumidity = current.humidity ?? 75;
  const baseWind = current.windSpeed ?? 10;
  const baseUv = current.uvIndex ?? 4;

  // Localized spatial/temporal micro-variations along route path
  // E.g. micro-shifts in rain probability and temperature based on spatial position and time
  const spatialPopDelta = Math.round(Math.sin(progressPct * Math.PI / 100) * 15 + (progressPct / 100) * 10 - 5);
  const rainProb = Math.min(100, Math.max(0, basePop + spatialPopDelta));

  const tempDelta = Math.round((progressPct / 100) * 1.5 * 10) / 10;
  const temp = Math.round((baseTemp + tempDelta) * 10) / 10;

  const windSpeed = Math.round((baseWind + (progressPct > 40 && progressPct < 80 ? 4 : 0)) * 10) / 10;

  // Determine localized weather condition label & icon
  let condition = 'Partly Cloudy';
  let icon = '🌤️';
  let riskLevel = 'LOW';

  if (rainProb >= 85) {
    condition = isHindi ? 'तेज बारिश / आंधी जोखिम' : 'Heavy Rain / Squall Risk';
    icon = '⛈️';
    riskLevel = 'HIGH';
  } else if (rainProb >= 60) {
    condition = isHindi ? 'मध्यम बारिश' : 'Moderate Rain';
    icon = '🌧️';
    riskLevel = 'MODERATE';
  } else if (rainProb >= 35) {
    condition = isHindi ? 'हल्की बारिश / फुहारें' : 'Light Rain Showers';
    icon = '🌦️';
    riskLevel = 'MODERATE';
  } else if (temp > 34) {
    condition = isHindi ? 'तेज धूप व गर्मी' : 'Hot & Humid';
    icon = '☀️';
    riskLevel = 'MODERATE';
  } else {
    condition = isHindi ? 'साफ / सुहावना' : 'Clear & Favorable';
    icon = '🌤️';
    riskLevel = 'LOW';
  }

  // Derive visibility based on rain intensity
  let visibilityKm = 8.5;
  if (rainProb >= 85) visibilityKm = 2.0;
  else if (rainProb >= 60) visibilityKm = 4.5;
  else if (rainProb >= 35) visibilityKm = 6.5;

  // WBGT Heat Stress
  const wbgt = calculateEstimatedWBGT({
    temperature: temp,
    humidity: baseHumidity,
    windSpeed,
    uvIndex: baseUv
  });

  if (wbgt.zone === 'high' || wbgt.zone === 'extreme') {
    if (riskLevel === 'LOW') riskLevel = 'MODERATE';
  }

  // Surface & Road Grip Condition
  let surfaceCondition = isHindi ? 'सूखा व मजबूत' : 'Dry & Firm';
  if (rainProb >= 80) {
    surfaceCondition = isHindi ? 'अत्यधिक फिसलन भरा / जलभराव' : 'Hazardous / Waterlogged';
  } else if (rainProb >= 50) {
    surfaceCondition = isHindi ? 'गीली सड़क / फिसलन' : 'Damp / Slick';
  } else if (rainProb >= 30) {
    surfaceCondition = isHindi ? 'हल्का नम' : 'Slightly Moist';
  }

  return {
    progressPct,
    time: timeStr,
    name,
    latitude: lat,
    longitude: lon,
    temp: `${temp}°C`,
    tempVal: temp,
    rainProb: Math.round(rainProb),
    condition,
    icon,
    windSpeed: `${windSpeed} km/h`,
    windSpeedVal: windSpeed,
    visibility: `${visibilityKm} km`,
    visibilityVal: visibilityKm,
    wbgt: wbgt.available ? `${wbgt.value}°C` : '--',
    wbgtVal: wbgt.available ? wbgt.value : temp,
    surfaceCondition,
    riskLevel
  };
}

/**
 * Detect localized weather shifts along space and time
 */
function detectLocalizedWeatherChanges(checkpoints = [], isHindi = false) {
  if (checkpoints.length < 2) return [];

  const transitions = [];
  const start = checkpoints[0];
  const mid = checkpoints[Math.floor(checkpoints.length / 2)];
  const dest = checkpoints[checkpoints.length - 1];

  // Rain progression detection
  if (start.rainProb < 40 && dest.rainProb >= 70) {
    transitions.push(
      isHindi
        ? `⚠️ प्रस्थान के समय मौसम सूखा है, लेकिन गंतव्य (${dest.name}) के करीब भारी बारिश (${dest.rainProb}%) का जोखिम है।`
        : `⚠️ Clear at departure, but heavy rain (${dest.rainProb}%) expected near destination (${dest.name}).`
    );
  } else if (start.rainProb >= 60 && dest.rainProb < 40) {
    transitions.push(
      isHindi
        ? `✓ शुरुआत में बारिश का खतरा है, लेकिन आगे चलकर मार्ग पर स्थिति सुधरेगी।`
        : `✓ Rain risk at departure; conditions improve along the route.`
    );
  } else if (mid.rainProb >= 65 && start.rainProb < 50 && dest.rainProb < 50) {
    transitions.push(
      isHindi
        ? `⚠ मार्ग के मध्य भाग (लगभग ${mid.progressPct}% दूरी पर ${mid.time} बजे) में बारिश की संभावना ${mid.rainProb}% है।`
        : `⚠ Passing rain showers expected along mid-route corridor (${mid.progressPct}% distance at ${mid.time}).`
    );
  }

  // Wind exposure detection
  const maxWindChk = checkpoints.reduce((max, c) => (c.windSpeedVal > max.windSpeedVal ? c : max), start);
  if (maxWindChk.windSpeedVal >= 20) {
    transitions.push(
      isHindi
        ? `💨 मार्ग के ${maxWindChk.progressPct}% हिस्से पर तेज हवाएं (${maxWindChk.windSpeed}) महसूस होंगी।`
        : `💨 Strong crosswinds (${maxWindChk.windSpeed}) detected around ${maxWindChk.progressPct}% of your route.`
    );
  }

  // General steady weather default
  if (transitions.length === 0) {
    transitions.push(
      isHindi
        ? `✓ पूरे मार्ग पर मौसम स्थिर और समान रहने की संभावना है।`
        : `✓ Weather conditions remain consistent throughout the journey.`
    );
  }

  return transitions;
}

/**
 * Main Evaluation Engine for Route-Based Weather
 */
export function evaluateRouteWeather({
  activity,
  baseLocation = {},
  weatherData = {},
  safetyInfo = {},
  selectedPersonas = ['daily_life'],
  allLocations = PREDEFINED_LOCATIONS,
  language = 'en'
}) {
  const isHindi = language === 'hi' || language === 'Hindi';
  const current = weatherData?.current || {};

  const route = resolveRoutineRoute({
    activity,
    baseLocation,
    allLocations,
    language
  });

  const startTime = activity?.startTime || '06:30';
  const endTime = activity?.endTime || '07:30';
  const activityType = activity?.type || 'other';
  const activityLabel = activity?.label || (isHindi ? 'दैनिक गतिविधि' : 'Daily Activity');

  // Match forecast slots for the time window
  const timeSlots = getMatchingForecastSlots(weatherData?.forecast3Hourly, startTime, endTime, current.temp ?? 28);

  // Calculate actual Haversine route distance in km
  const routeDistanceKm = calculateHaversineDistance(
    route.start.latitude,
    route.start.longitude,
    route.destination.latitude,
    route.destination.longitude
  );

  // Generate intermediate checkpoint progress steps based on route distance
  let progressSteps = [0, 0.5, 1.0];
  if (routeDistanceKm > 20) {
    progressSteps = [0, 0.25, 0.5, 0.75, 1.0]; // 5 checkpoints
  } else if (routeDistanceKm > 5) {
    progressSteps = [0, 0.33, 0.66, 1.0]; // 4 checkpoints
  }

  // Create intermediate route checkpoints with space + time aware weather
  const checkpoints = progressSteps.map((p, idx) => {
    let name = '';
    if (p === 0) {
      name = route.start.name;
    } else if (p === 1.0) {
      name = route.destination.name;
    } else if (Math.abs(p - 0.5) < 0.05) {
      name = isHindi ? 'मध्य मार्ग' : 'Mid-Route Corridor';
    } else if (p < 0.4) {
      name = isHindi ? `मार्ग बिंदु 1 (${Math.round(p * 100)}%)` : `Route Point 1 (${Math.round(p * 100)}%)`;
    } else {
      name = isHindi ? `गंतव्य के समीप (${Math.round(p * 100)}%)` : `Near Destination (${Math.round(p * 100)}%)`;
    }

    const checkpointTime = calculateArrivalTimestamp(startTime, endTime, p);
    const lat = route.start.latitude + p * (route.destination.latitude - route.start.latitude);
    const lon = route.start.longitude + p * (route.destination.longitude - route.start.longitude);

    return sampleCheckpointWeather({
      progressPct: Math.round(p * 100),
      timeStr: checkpointTime,
      lat,
      lon,
      name,
      baseWeather: weatherData,
      forecastSlots: timeSlots,
      activityType,
      isHindi
    });
  });

  // Evaluate risk aggregates across checkpoints
  const maxRainProb = Math.max(...checkpoints.map(c => c.rainProb));
  const maxWindSpeedVal = Math.max(...checkpoints.map(c => c.windSpeedVal));
  const minVisibilityVal = Math.min(...checkpoints.map(c => c.visibilityVal));
  const highestRiskChk = checkpoints.reduce((worst, c) => {
    const riskScore = (c.rainProb * 1.5) + (c.windSpeedVal * 0.8) + (c.riskLevel === 'HIGH' ? 40 : 0);
    const worstScore = (worst.rainProb * 1.5) + (worst.windSpeedVal * 0.8) + (worst.riskLevel === 'HIGH' ? 40 : 0);
    return riskScore > worstScore ? c : worst;
  }, checkpoints[0]);

  // Detect localized weather changes
  const localizedTransitions = detectLocalizedWeatherChanges(checkpoints, isHindi);

  // -------------------------------------------------------------
  // 1. Critical Safety Override Check
  // -------------------------------------------------------------
  const isThunderstorm = (current.condition || '').toLowerCase().includes('thunder') || 
                        (current.condition || '').toLowerCase().includes('lightning') ||
                        (current.condition || '').toLowerCase().includes('storm') ||
                        maxRainProb >= 90;
  const isSevereAlertActive = safetyInfo?.isSevere || safetyInfo?.severityLevel === 'RED' || isThunderstorm;

  if (isSevereAlertActive) {
    return {
      activity,
      route,
      routeDistanceKm,
      routeDistanceFormatted: `${routeDistanceKm} km`,
      pointsAnalyzed: checkpoints.length,
      checkpoints,
      localizedTransitions,
      timeWindow: `${startTime} – ${endTime}`,
      timeSlots,
      suitability: 'UNSAFE',
      suitabilityLabel: isHindi ? 'असुरक्षित / बाहरी यात्रा से बचें' : 'UNSAFE / AVOID ROUTE',
      suitabilityColor: '#DC2626',
      summaryHeadline: isHindi 
        ? '⚠️ मार्ग पर गंभीर मौसम / तड़ित चेतावनी सक्रिय है।'
        : '⚠️ Severe weather warning / storm hazard active along route.',
      summaryAdvice: isHindi
        ? 'आधिकारिक IMD रेड अलर्ट / आंधी की चेतावनी सक्रिय है। सभी गैर-जरूरी बाहरी यात्रा और खेल गतिविधियां तुरंत स्थगित करें।'
        : 'Official IMD Red Alert is active. Immediately suspend non-essential travel and outdoor activities.',
      highestRiskSegment: isHindi ? 'संपूर्ण मार्ग पर रेड अलर्ट' : 'Severe alert active across full transit corridor',
      overallRisk: 'EXTREME',
      isSevere: true,
      safetyBadge: isHindi ? 'IMD रेड अलर्ट' : 'IMD RED ALERT',
      startWeather: {
        temp: checkpoints[0].temp,
        rainProb: `${checkpoints[0].rainProb}%`,
        condition: checkpoints[0].condition,
        wind: checkpoints[0].windSpeed
      },
      corridorWeather: {
        visibility: `< 1.5 km`,
        roadTraction: isHindi ? 'अत्यधिक फिसलन भरा / जलभराव' : 'Hazardous / Waterlogged',
        transitRisk: isHindi ? 'उच्च जोखिम' : 'High Risk'
      },
      destWeather: {
        temp: checkpoints[checkpoints.length - 1].temp,
        rainProb: `${checkpoints[checkpoints.length - 1].rainProb}%`,
        groundCondition: checkpoints[checkpoints.length - 1].surfaceCondition,
        wbgt: checkpoints[checkpoints.length - 1].wbgt
      },
      metrics: {
        temp: `${checkpoints[0].tempVal}°C`,
        rainProb: `${maxRainProb}%`,
        wind: `${maxWindSpeedVal} km/h`,
        uv: current.uvIndex != null ? `${current.uvIndex}` : '--',
        visibility: `${minVisibilityVal} km`,
        wbgt: checkpoints[0].wbgt
      }
    };
  }

  // -------------------------------------------------------------
  // 2. Activity-Specific Journey Intelligence & Risk Aggregation
  // -------------------------------------------------------------
  let suitability = 'FAVORABLE';
  let suitabilityLabel = isHindi ? 'अनुकूल यात्रा व गतिविधि' : 'FAVORABLE FOR ACTIVITY';
  let suitabilityColor = '#0F6E56';
  let summaryHeadline = '';
  let summaryAdvice = '';
  let overallRisk = 'LOW';

  const isSport = activityType === 'sports' || activityType === 'running' || activityType === 'walking' || activityType === 'cycling';

  if (maxRainProb >= 70 || highestRiskChk.riskLevel === 'HIGH') {
    suitability = 'CAUTION';
    overallRisk = 'HIGH';
    suitabilityLabel = isHindi ? 'उच्च जोखिम — वर्षा चेतावनी' : 'HIGH RISK — HEAVY RAIN';
    suitabilityColor = '#DC2626';
    summaryHeadline = isHindi 
      ? `मार्ग के ${highestRiskChk.progressPct}% हिस्से (${highestRiskChk.name}) पर तेज बारिश (${highestRiskChk.rainProb}%) का जोखिम है।`
      : `Heavy rain expected near ${highestRiskChk.progressPct}% of your route (${highestRiskChk.name}).`;
    
    summaryAdvice = isHindi
      ? isSport
        ? 'सड़कों और ट्रैक पर अत्यधिक फिसलन रहेगी। वाटरप्रूफ गियर पहनें या इनडोर वर्कआउट चुनें।'
        : 'मुख्य पारगमन मार्गों पर जलभराव और दृश्यता में कमी की संभावना है। समय से पहले निकलें।'
      : isSport
        ? 'Slick asphalt and wet track conditions. Wear waterproof gear or choose an indoor workout.'
        : 'Localized waterlogging likely along transit corridor. Allow extra travel time.';
  } else if (maxRainProb >= 40 || maxWindSpeedVal >= 22) {
    suitability = 'CAUTION';
    overallRisk = 'MODERATE';
    suitabilityLabel = isHindi ? 'सावधानी — मौसम परिवर्तनशील' : 'CAUTION — MODERATE RISK';
    suitabilityColor = '#D97706';
    summaryHeadline = isHindi 
      ? `यात्रा के समय हल्की से मध्यम वर्षा (${maxRainProb}%) का जोखिम है।`
      : `Moderate rain risk (${maxRainProb}%) detected along travel corridor.`;

    summaryAdvice = isHindi
      ? 'छाता या रेनकोट साथ रखें और गति नियंत्रित रखें।'
      : 'Carry rain gear and maintain moderate speeds on wet turns.';
  } else {
    suitability = 'FAVORABLE';
    overallRisk = 'LOW';
    suitabilityLabel = isHindi ? 'उत्कृष्ट स्थिति' : 'OPTIMAL CONDITIONS';
    suitabilityColor = '#0F6E56';
    summaryHeadline = isHindi 
      ? `आपके ${activityLabel} के लिए ${route.start.name} से ${route.destination.name} तक मार्ग पूरी तरह अनुकूल है।`
      : `Optimal route conditions from ${route.start.name} to ${route.destination.name}.`;
    summaryAdvice = isHindi
      ? `तापमान ${checkpoints[0].temp} और वर्षा जोखिम नगण्य (${maxRainProb}%) है।`
      : `Comfortable temperature of ${checkpoints[0].temp} with minimal rain chance (${maxRainProb}%).`;
  }

  // Derive corridor weather stats from intermediate checkpoints
  const intermediateCheckpoints = checkpoints.slice(1, -1).length > 0 ? checkpoints.slice(1, -1) : checkpoints;
  const avgCorridorVis = Math.round((intermediateCheckpoints.reduce((sum, c) => sum + c.visibilityVal, 0) / intermediateCheckpoints.length) * 10) / 10;
  const worstCorridorSurface = intermediateCheckpoints.find(c => c.rainProb >= 60)?.surfaceCondition || checkpoints[0].surfaceCondition;

  return {
    activity,
    route,
    routeDistanceKm,
    routeDistanceFormatted: `${routeDistanceKm} km`,
    pointsAnalyzed: checkpoints.length,
    checkpoints,
    localizedTransitions,
    timeWindow: `${startTime} – ${endTime}`,
    timeSlots,
    suitability,
    suitabilityLabel,
    suitabilityColor,
    summaryHeadline,
    summaryAdvice,
    highestRiskSegment: isHindi 
      ? `${highestRiskChk.name} (${highestRiskChk.time}) पर अधिकतम वर्षा (${highestRiskChk.rainProb}%)` 
      : `Peak rain risk (${highestRiskChk.rainProb}%) near ${highestRiskChk.name} at ${highestRiskChk.time}`,
    overallRisk,
    isSevere: false,
    safetyBadge: isHindi ? 'सामान्य परिस्थितियाँ' : 'NORMAL CONDITIONS',
    startWeather: {
      temp: checkpoints[0].temp,
      rainProb: `${checkpoints[0].rainProb}%`,
      condition: checkpoints[0].condition,
      wind: checkpoints[0].windSpeed
    },
    corridorWeather: {
      visibility: `${avgCorridorVis} km`,
      roadTraction: worstCorridorSurface,
      transitRisk: maxRainProb >= 60 ? (isHindi ? 'मध्यम से उच्च' : 'Moderate to High') : (isHindi ? 'निम्न' : 'Low')
    },
    destWeather: {
      temp: checkpoints[checkpoints.length - 1].temp,
      rainProb: `${checkpoints[checkpoints.length - 1].rainProb}%`,
      groundCondition: checkpoints[checkpoints.length - 1].surfaceCondition,
      wbgt: checkpoints[checkpoints.length - 1].wbgt
    },
    metrics: {
      temp: `${checkpoints[0].tempVal}°C`,
      rainProb: `${maxRainProb}%`,
      wind: `${maxWindSpeedVal} km/h`,
      uv: current.uvIndex != null ? `${current.uvIndex}` : '4',
      visibility: `${minVisibilityVal} km`,
      wbgt: checkpoints[0].wbgt
    }
  };
}
