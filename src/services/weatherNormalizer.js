/**
 * MAUSAM Weather Normalizer
 * Transforms external Weather API responses into the Common MAUSAM Weather Data Model.
 * Protects downstream personalization engines, widgets, and briefings from provider-specific formats.
 */

function getAQIInfo(rawAqi) {
  if (!rawAqi) {
    return { aqi: null, aqiStatus: 'Unavailable', aqiStatusHi: 'अनुपलब्ध', aqiColor: '#94A3B8' };
  }

  let aqi = null;
  if (typeof rawAqi === 'number') {
    aqi = rawAqi;
  } else if (typeof rawAqi['pm2_5'] === 'number') {
    // US EPA standard estimation from PM2.5
    aqi = Math.round(rawAqi['pm2_5'] * 2.1);
  } else if (rawAqi['us-epa-index']) {
    const epa = rawAqi['us-epa-index'];
    const map = { 1: 35, 2: 70, 3: 110, 4: 160, 5: 220, 6: 350 };
    aqi = map[epa] || null;
  }

  if (aqi == null) {
    return { aqi: null, aqiStatus: 'Unavailable', aqiStatusHi: 'अनुपलब्ध', aqiColor: '#94A3B8' };
  }

  if (aqi <= 50) return { aqi, aqiStatus: 'Good', aqiStatusHi: 'अच्छा', aqiColor: '#0F6E56' };
  if (aqi <= 100) return { aqi, aqiStatus: 'Satisfactory', aqiStatusHi: 'संतोषजनक', aqiColor: '#639922' };
  if (aqi <= 200) return { aqi, aqiStatus: 'Moderate', aqiStatusHi: 'मध्यम', aqiColor: '#BA7517' };
  if (aqi <= 300) return { aqi, aqiStatus: 'Poor', aqiStatusHi: 'खराब', aqiColor: '#D85A38' };
  if (aqi <= 400) return { aqi, aqiStatus: 'Very Poor', aqiStatusHi: 'बहुत खराब', aqiColor: '#A32D2D' };
  return { aqi, aqiStatus: 'Severe', aqiStatusHi: 'गंभीर', aqiColor: '#791A88' };
}

function getConditionCode(text = '', isRain = false) {
  const lower = text.toLowerCase();
  if (lower.includes('thunder') || lower.includes('lightning') || lower.includes('storm')) return 'thunderstorm';
  if (lower.includes('heavy rain') || lower.includes('torrential') || lower.includes('downpour')) return 'heavy_rain';
  if (lower.includes('rain') || lower.includes('shower') || lower.includes('drizzle') || isRain) return 'rain';
  if (lower.includes('cloud') || lower.includes('overcast')) return 'cloudy';
  if (lower.includes('mist') || lower.includes('fog') || lower.includes('haze')) return 'haze';
  return 'clear';
}

function getIconType(conditionCode) {
  switch (conditionCode) {
    case 'thunderstorm': return 'rain-storm';
    case 'heavy_rain':
    case 'rain': return 'rain';
    case 'cloudy': return 'cloud';
    case 'haze': return 'haze';
    default: return 'sun';
  }
}

export function createSafeWeatherSkeleton(locationMeta = {}) {
  const locId = locationMeta.id || (locationMeta.latitude ? `loc-${Math.round(locationMeta.latitude * 100)}` : 'loc-default');
  return {
    id: locId,
    name: locationMeta.name || 'Selected Location',
    district: locationMeta.district || 'Local Area',
    state: locationMeta.state || 'India',
    latitude: locationMeta.latitude ?? 24.7955,
    longitude: locationMeta.longitude ?? 85.0002,
    purpose: locationMeta.purpose || 'General',
    purposes: locationMeta.purposes || [locationMeta.purpose || 'General'],
    personaDefault: locationMeta.personaDefault || ['daily_life'],
    custom: locationMeta.custom || false,
    current: {
      temp: null,
      updatedAt: null,
      feelsLike: null,
      maxTemp: null,
      minTemp: null,
      humidity: null,
      windSpeed: null,
      windDirection: '--',
      windDegree: null,
      pressure: null,
      visibility: null,
      uvIndex: null,
      aqi: null,
      aqiStatus: 'Unavailable',
      aqiStatusHi: 'अनुपलब्ध',
      aqiColor: '#94A3B8',
      condition: 'Weather Data Unavailable',
      conditionHi: 'मौसम डेटा अनुपलब्ध',
      conditionCode: 'unavailable',
      rainfall24h: null,
      rainProbability: null
    },
    uv: {
      index: null,
      category: 'Unavailable',
      isLive: false
    },
    forecast3Hourly: [],
    dailyForecast: [],
    astronomy: {
      sunrise: '--',
      sunset: '--',
      moonrise: '--',
      moonset: '--',
      moonPhase: '--'
    },
    warning: {
      level: 'GREEN',
      code: 'no_warning',
      headline: 'NORMAL CONDITIONS',
      description: 'No severe weather alerts active for this region.',
      validUntil: 'Standby'
    },
    metadata: {
      source: 'No Live Data',
      isLive: false,
      fetchedAt: null
    }
  };
}

export function normalizeWeatherResponse(raw, locationMeta = {}, uvData = null) {
  if (!raw || (!raw.current && !raw.main)) {
    return createSafeWeatherSkeleton(locationMeta);
  }

  const currentRaw = raw.current || {};
  const forecastDays = raw.forecast?.forecastday || [];
  const todayForecast = forecastDays[0] || {};
  const dayStats = todayForecast.day || {};
  const astroStats = todayForecast.astro || {};

  // Temperature & metrics (WeatherAPI or OpenWeatherMap format)
  const rawTemp = currentRaw.temp_c ?? currentRaw.temp ?? raw.main?.temp;
  const temp = rawTemp != null ? Math.round(rawTemp * 10) / 10 : null;

  const rawFeels = currentRaw.feelslike_c ?? currentRaw.feels_like ?? raw.main?.feels_like;
  const feelsLike = rawFeels != null ? Math.round(rawFeels * 10) / 10 : temp;

  const rawMax = dayStats.maxtemp_c ?? raw.main?.temp_max;
  const maxTemp = rawMax != null ? Math.round(rawMax * 10) / 10 : temp;

  const rawMin = dayStats.mintemp_c ?? raw.main?.temp_min;
  const minTemp = rawMin != null ? Math.round(rawMin * 10) / 10 : temp;

  const humidity = currentRaw.humidity ?? raw.main?.humidity ?? null;

  const rawWind = currentRaw.wind_kph ?? (raw.wind?.speed != null ? raw.wind.speed * 3.6 : null);
  const windSpeed = rawWind != null ? Math.round(rawWind) : 0;

  const windDirection = currentRaw.wind_dir || (raw.wind?.deg != null ? (
    raw.wind.deg > 337.5 || raw.wind.deg <= 22.5 ? 'N' :
    raw.wind.deg <= 67.5 ? 'NE' :
    raw.wind.deg <= 112.5 ? 'E' :
    raw.wind.deg <= 157.5 ? 'SE' :
    raw.wind.deg <= 202.5 ? 'S' :
    raw.wind.deg <= 247.5 ? 'SW' :
    raw.wind.deg <= 292.5 ? 'W' : 'NW'
  ) : '--');

  const windDegree = currentRaw.wind_degree ?? raw.wind?.deg ?? null;
  const pressure = Math.round(currentRaw.pressure_mb ?? raw.main?.pressure ?? 0) || null;
  const rawVis = currentRaw.vis_km ?? (raw.visibility != null ? raw.visibility / 1000 : null);
  const visibility = rawVis != null ? Math.round(rawVis * 10) / 10 : null;
  const rainfall24h = Math.round((dayStats.totalprecip_mm ?? currentRaw.precip_mm ?? raw.rain?.['1h'] ?? raw.rain?.['3h'] ?? 0) * 10) / 10;
  const rainProbability = dayStats.daily_chance_of_rain ?? (rainfall24h > 0 ? 70 : 15);
  const conditionText = currentRaw.condition?.text || (currentRaw.weather?.[0]?.description) || raw.weather?.[0]?.description || raw.weather?.[0]?.main || 'Clear';
  const conditionCode = getConditionCode(conditionText, rainProbability > 60);

  // AQI (WeatherAPI air_quality or OpenWeatherMap air_pollution / EPA index)
  let rawAqi = currentRaw.air_quality || raw.air_quality || raw.aqi;
  if (!rawAqi && raw.air_pollution?.list?.[0]) {
    const owmAqiItem = raw.air_pollution.list[0];
    rawAqi = {
      'us-epa-index': owmAqiItem.main?.aqi,
      'pm2_5': owmAqiItem.components?.pm2_5
    };
  }
  const aqiInfo = getAQIInfo(rawAqi);

  // UV - use UV service if provided, otherwise fallback to weather API UV
  const uvIndex = uvData?.index ?? currentRaw.uv ?? dayStats.uv ?? null;

  // 3-Hourly Forecast slots (WeatherAPI hour[] or OpenWeatherMap list[])
  let forecast3Hourly = [];
  const owmForecastList = raw.forecast?.list || raw.list || [];

  if (todayForecast.hour && todayForecast.hour.length > 0) {
    const hours = todayForecast.hour;
    forecast3Hourly = hours
      .filter((_, idx) => idx % 3 === 0)
      .map(h => {
        const hTime = h.time ? h.time.split(' ')[1] : '12:00';
        const hCode = getConditionCode(h.condition?.text || '', h.chance_of_rain > 50);
        return {
          time: hTime,
          temp: Math.round(h.temp_c * 10) / 10,
          humidity: h.humidity,
          pop: h.chance_of_rain || (h.precip_mm > 0 ? 60 : 10),
          rainMm: `${(h.precip_mm || 0).toFixed(1)} mm`,
          label: h.condition?.text || 'Clear',
          condition: h.condition?.text || 'Clear',
          icon: getIconType(hCode)
        };
      });
  } else if (owmForecastList.length > 0) {
    forecast3Hourly = owmForecastList.slice(0, 8).map(item => {
      const timeStr = item.dt_txt ? item.dt_txt.split(' ')[1]?.slice(0, 5) : new Date(item.dt * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const desc = item.weather?.[0]?.description || item.weather?.[0]?.main || 'Clear';
      const popVal = Math.round((item.pop || 0) * 100);
      const rainMmVal = item.rain?.['3h'] || item.rain?.['1h'] || 0;
      const hCode = getConditionCode(desc, popVal > 50);

      return {
        time: timeStr,
        temp: Math.round((item.main?.temp || temp || 0) * 10) / 10,
        humidity: item.main?.humidity || humidity,
        pop: popVal,
        rainMm: `${rainMmVal.toFixed(1)} mm`,
        label: desc,
        condition: desc,
        icon: getIconType(hCode)
      };
    });
  }

  // 7-Day / Multi-Day Daily Forecast (WeatherAPI forecastday[] or OpenWeatherMap list[] aggregated)
  let dailyForecast = [];
  if (forecastDays.length > 1) {
    dailyForecast = forecastDays.map((fDay, idx) => {
      const d = new Date(fDay.date);
      const dayName = idx === 0 ? 'Today' : d.toLocaleDateString('en-US', { weekday: 'short' });
      const fCode = getConditionCode(fDay.day?.condition?.text || '', (fDay.day?.daily_chance_of_rain || 0) > 50);
      return {
        date: fDay.date,
        day: dayName,
        minTemp: Math.round(fDay.day?.mintemp_c || minTemp),
        maxTemp: Math.round(fDay.day?.maxtemp_c || maxTemp),
        pop: fDay.day?.daily_chance_of_rain || 20,
        condition: fDay.day?.condition?.text || conditionText,
        icon: getIconType(fCode)
      };
    });
  } else if (owmForecastList.length > 0) {
    // Group OWM 3-hourly entries by day
    const dayGroups = {};
    for (const item of owmForecastList) {
      const dayKey = item.dt_txt ? item.dt_txt.split(' ')[0] : new Date(item.dt * 1000).toISOString().split('T')[0];
      if (!dayGroups[dayKey]) {
        dayGroups[dayKey] = {
          date: dayKey,
          temps: [],
          pops: [],
          descriptions: []
        };
      }
      dayGroups[dayKey].temps.push(item.main?.temp);
      dayGroups[dayKey].pops.push(item.pop || 0);
      if (item.weather?.[0]?.description) dayGroups[dayKey].descriptions.push(item.weather[0].description);
    }

    const dayKeys = Object.keys(dayGroups).slice(0, 5);
    dailyForecast = dayKeys.map((k, idx) => {
      const grp = dayGroups[k];
      const d = new Date(grp.date);
      const dayName = idx === 0 ? 'Today' : d.toLocaleDateString('en-US', { weekday: 'short' });
      const minT = Math.round(Math.min(...grp.temps.filter(t => t != null)));
      const maxT = Math.round(Math.max(...grp.temps.filter(t => t != null)));
      const maxPop = Math.round(Math.max(...grp.pops) * 100);
      const mainDesc = grp.descriptions[Math.floor(grp.descriptions.length / 2)] || conditionText;
      const fCode = getConditionCode(mainDesc, maxPop > 50);

      return {
        date: grp.date,
        day: dayName,
        minTemp: minT,
        maxTemp: maxT,
        pop: maxPop,
        condition: mainDesc,
        icon: getIconType(fCode)
      };
    });
  }

  // Astronomy (WeatherAPI astro or OpenWeatherMap sys sunrise/sunset)
  let sunriseStr = astroStats.sunrise || '--';
  let sunsetStr = astroStats.sunset || '--';

  if (raw.sys?.sunrise) {
    sunriseStr = new Date(raw.sys.sunrise * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  if (raw.sys?.sunset) {
    sunsetStr = new Date(raw.sys.sunset * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  const astronomy = {
    sunrise: sunriseStr,
    sunset: sunsetStr,
    moonrise: astroStats.moonrise || '--',
    moonset: astroStats.moonset || '--',
    moonPhase: astroStats.moon_phase || '--'
  };

  // Weather Warning / Alerts from API provider
  let warning = {
    level: 'GREEN',
    code: 'no_warning',
    headline: 'NORMAL CONDITIONS',
    description: 'No severe weather alerts active for this region.',
    validUntil: 'Live Feed Active'
  };

  if (raw.alerts?.alert && raw.alerts.alert.length > 0) {
    const topAlert = raw.alerts.alert[0];
    const severity = (topAlert.severity || '').toLowerCase();
    let level = 'AMBER';
    if (severity.includes('severe') || severity.includes('extreme')) level = 'RED';
    else if (severity.includes('moderate')) level = 'AMBER';
    else level = 'YELLOW';

    warning = {
      level,
      code: 'live_provider_alert',
      headline: topAlert.headline || topAlert.event || 'WEATHER ADVISORY',
      description: topAlert.desc || topAlert.instruction || 'Advisory issued by weather service.',
      validUntil: topAlert.expires || 'Active'
    };
  }

  const locId = locationMeta.id || (locationMeta.latitude ? `loc-${Math.round(locationMeta.latitude * 100)}` : 'loc-default');

  return {
    id: locId,
    name: locationMeta.name || raw.location?.name || 'Selected Location',
    district: locationMeta.district || raw.location?.name || 'Local District',
    state: locationMeta.state || raw.location?.region || 'India',
    latitude: locationMeta.latitude,
    longitude: locationMeta.longitude,
    purpose: locationMeta.purpose || 'General',
    purposes: locationMeta.purposes || [locationMeta.purpose || 'General'],
    personaDefault: locationMeta.personaDefault || ['daily_life'],
    custom: locationMeta.custom || false,
    current: {
      temp,
      updatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      feelsLike,
      maxTemp,
      minTemp,
      humidity,
      windSpeed,
      windDirection,
      windDegree,
      pressure,
      visibility,
      uvIndex,
      aqi: aqiInfo.aqi,
      aqiStatus: aqiInfo.aqiStatus,
      aqiStatusHi: aqiInfo.aqiStatusHi,
      aqiColor: aqiInfo.aqiColor,
      condition: conditionText,
      conditionCode,
      rainfall24h,
      rainProbability
    },
    uv: uvData || {
      index: uvIndex,
      category: uvIndex >= 8 ? 'Very High' : uvIndex >= 6 ? 'High' : uvIndex >= 3 ? 'Moderate' : 'Low',
      isLive: true
    },
    forecast3Hourly,
    dailyForecast,
    astronomy,
    warning,
    metadata: {
      source: 'Live Weather API',
      isLive: true,
      fetchedAt: Date.now()
    }
  };
}
