/**
 * MAUSAM Assistant - Weather Context Normalization Layer
 * 
 * Normalizes live weather, hourly forecast, and location data into a clean,
 * null-safe data structure consumed by all chatbot response routes.
 * 
 * Prevents TypeError/NullPointer crashes when optional weather metrics (AQI, WBGT, UV)
 * or nested properties are missing.
 */

export function normalizeWeatherContext(context = {}, intent = {}) {
  const current = context.weather || {};
  const forecast = context.forecast || [];
  const location = context.selectedLocation || context.currentLocation || {};

  let source = 'LIVE';
  let targetSlot = null;

  // If query is a forecast query or requests a specific non-live hour, select nearest hourly forecast slot
  if (intent.type === 'forecast_weather' || (intent.requestedTime && intent.requestedTime !== 'now')) {
    source = 'HOURLY_FORECAST';
    if (forecast && forecast.length > 0) {
      const targetTimeStr = intent.requestedTime === 'now' ? (context.currentTime || '12:00') : (intent.requestedTime || '12:00');
      const targetH = parseInt((targetTimeStr.split(':')[0] || '12'), 10);
      const safeTargetH = isNaN(targetH) ? 12 : targetH;

      let minDiff = 999;
      for (const slot of forecast) {
        const slotTime = slot.time || slot.dt_txt || '12:00';
        const slotH = parseInt((slotTime.split(':')[0] || '12'), 10);
        const safeSlotH = isNaN(slotH) ? 12 : slotH;
        const diff = Math.abs(safeSlotH - safeTargetH);
        if (diff < minDiff) {
          minDiff = diff;
          targetSlot = slot;
        }
      }
    }
  }

  const activeData = (source === 'HOURLY_FORECAST' && targetSlot) ? targetSlot : current;

  // Safe Metric Extraction
  const temp = activeData.temp ?? current.temp ?? null;
  const feelsLike = activeData.feelsLike ?? current.feelsLike ?? temp;
  const humidity = activeData.humidity ?? current.humidity ?? null;
  const windSpeed = activeData.windSpeed ?? current.windSpeed ?? null;
  const windDirection = activeData.windDirection || current.windDirection || 'SSW';
  
  const pop = activeData.pop ?? activeData.rainProbability ?? current.rainProbability ?? null;
  const rainfall = activeData.rainfall24h ?? current.rainfall24h ?? null;
  
  const uvIndex = activeData.uvIndex ?? current.uvIndex ?? null;
  const aqi = activeData.aqi ?? current.aqi ?? null;
  const aqiStatus = activeData.aqiStatus || current.aqiStatus || null;
  
  const condition = activeData.condition || current.condition || 'Clear';
  const conditionCode = activeData.conditionCode || current.conditionCode || 'clear';
  
  const wbgtVal = activeData.wbgt?.available ? activeData.wbgt.value : (current.wbgt?.available ? current.wbgt.value : null);
  const wbgtZone = activeData.wbgt?.zone || current.wbgt?.zone || 'low';

  const isGroundWet = (pop != null && pop >= 60) || (rainfall != null && rainfall > 5);

  return {
    timestamp: context.currentTime || 'Now',
    date: context.currentDate || new Date().toISOString().split('T')[0],
    locationName: location.name || context.weatherData?.name || 'Current Location',
    district: location.district || 'District',
    state: location.state || 'India',
    timezone: context.timezone || 'Asia/Kolkata',
    source,
    
    // Normalized Metrics
    temperature: temp != null && !isNaN(temp) ? Math.round(temp) : null,
    feelsLike: feelsLike != null && !isNaN(feelsLike) ? Math.round(feelsLike) : null,
    humidity: humidity != null && !isNaN(humidity) ? Math.round(humidity) : null,
    windSpeed: windSpeed != null && !isNaN(windSpeed) ? Math.round(windSpeed) : null,
    windDirection,
    precipitationProbability: pop != null && !isNaN(pop) ? Math.round(pop) : null,
    rainfall24h: rainfall != null && !isNaN(rainfall) ? Math.round(rainfall) : null,
    uvIndex: uvIndex != null && !isNaN(uvIndex) ? uvIndex : null,
    aqi: aqi != null && !isNaN(aqi) ? aqi : null,
    aqiStatus,
    condition,
    conditionCode,
    wbgtValue: wbgtVal != null && !isNaN(wbgtVal) ? wbgtVal : null,
    wbgtZone,
    groundCondition: isGroundWet ? 'Wet & Slippery' : 'Firm & Dry'
  };
}
