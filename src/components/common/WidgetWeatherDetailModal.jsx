import React, { useState, useMemo } from 'react';
import { 
  X, 
  Sparkles, 
  Clock, 
  Info, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle2, 
  ChevronRight, 
  ChevronDown, 
  ChevronUp,
  Thermometer, 
  Droplets, 
  Wind, 
  Sun, 
  Flame, 
  Eye, 
  Activity, 
  ShieldAlert,
  Zap,
  CloudRain,
  Gauge
} from 'lucide-react';
import { useI18n } from '../../i18n/i18nContext';
import { calculateWBGT } from '../../engine/sharedWeatherIntelligence';

const METRIC_ICON_MAP = {
  wbgt_safety: Flame,
  wbgt_tracker: Flame,
  rain_probability: CloudRain,
  rain_radar: CloudRain,
  wind_gauge: Wind,
  event_wind_conditions: Wind,
  uv_heat_index: Sun,
  uv_forecast: Sun,
  aqi_health: Activity,
  outdoor_exercise_aqi: Activity,
  dew_factor: Droplets,
  ground_condition: Gauge,
  lightning_storm_safety: Zap,
  current_conditions: Thermometer,
  today_forecast: Thermometer
};

/**
 * Builds 24-hour hourly weather data points for Today using weatherData forecast slots.
 */
function build24HourTimeline(weatherData = {}) {
  const current = weatherData.current || {};
  const forecastSlots = weatherData.forecast3Hourly || weatherData.hourlyForecast || weatherData.hourly || weatherData.list || [];

  const todayStr = new Date().toISOString().split('T')[0];
  const currentHour = new Date().getHours();

  const timeline = [];

  for (let h = 0; h < 24; h += 2) {
    const timeLabel = h === 0 ? '12 AM' : (h === 12 ? '12 PM' : (h > 12 ? `${h - 12} PM` : `${h} AM`));
    
    // Find closest forecast slot
    const slot = forecastSlots.find(s => {
      if (!s.time && !s.dt_txt) return false;
      const sDate = s.date || (s.dt_txt ? s.dt_txt.split(' ')[0] : null);
      if (sDate && sDate !== todayStr) return false;
      const sTimeStr = s.time || (s.dt_txt ? s.dt_txt.split(' ')[1] : '12:00');
      const sH = parseInt(sTimeStr.split(':')[0], 10);
      return Math.abs(sH - h) <= 1;
    });

    const baseTemp = slot?.temp ?? slot?.temp_c ?? current.temp ?? 28.0;
    const baseHum = slot?.humidity ?? slot?.humidity_pct ?? current.humidity ?? 65.0;
    const basePop = slot?.pop ?? slot?.rain_probability ?? (current.pop ? current.pop / 100 : 0.15);
    const popFrac = basePop > 1.0 ? basePop / 100.0 : basePop;
    const popPct = Math.round(popFrac * 100);
    const baseWind = slot?.windSpeed ?? slot?.wind_speed_kmh ?? current.windSpeed ?? 10.0;
    const baseWindGust = slot?.windGust ?? (baseWind * 1.3);

    // Diurnal UV Curve
    let uvVal = 0;
    if (h >= 7 && h <= 17) {
      const peakDist = Math.abs(13 - h);
      const maxUv = current.uvIndex ?? 6.0;
      uvVal = Math.max(0, Math.round((maxUv * (1 - peakDist / 6)) * 10) / 10);
    }

    const calculatedWbgt = calculateWBGT(baseTemp, baseHum);

    timeline.push({
      hour: h,
      displayTime: timeLabel,
      isCurrent: Math.abs(currentHour - h) < 2,
      isPast: h < currentHour - 1,
      temp_c: Math.round(baseTemp * 10) / 10,
      humidity_pct: Math.round(baseHum),
      pop_pct: popPct,
      pop_frac: popFrac,
      wind_speed_kmh: Math.round(baseWind * 10) / 10,
      wind_gust_kmh: Math.round(baseWindGust * 10) / 10,
      uv_index: uvVal,
      aqi: current.aqi ?? 45,
      wbgt_c: Math.round(calculatedWbgt * 10) / 10
    });
  }

  return timeline;
}

/**
 * Reusable Weather Window Analyzer
 */
function analyzeWeatherWindows(timeline = [], metricKey = 'wbgt_c', riskThresholdHigh = 30.0, riskThresholdLow = 26.0) {
  if (!timeline || timeline.length === 0) {
    return { bestWindow: 'Morning hours', cautionWindow: 'Afternoon hours', peakTime: '1:00 PM', peakVal: '--' };
  }

  let peakPt = timeline[0];
  let lowestPt = timeline[0];

  timeline.forEach(pt => {
    const val = pt[metricKey] ?? 0;
    if (val > (peakPt[metricKey] ?? 0)) peakPt = pt;
    if (val < (lowestPt[metricKey] ?? Infinity)) lowestPt = pt;
  });

  const lowHrs = timeline.filter(pt => (pt[metricKey] ?? 0) <= riskThresholdLow);
  const highHrs = timeline.filter(pt => (pt[metricKey] ?? 0) >= riskThresholdHigh);

  const fmtWindow = (hrs) => {
    if (!hrs || hrs.length === 0) return null;
    return `${hrs[0].displayTime} – ${hrs[hrs.length - 1].displayTime}`;
  };

  return {
    bestWindow: fmtWindow(lowHrs) || `${lowestPt.displayTime} (${lowestPt[metricKey]})`,
    cautionWindow: fmtWindow(highHrs) || `${peakPt.displayTime} (Peak)`,
    peakTime: peakPt.displayTime,
    peakVal: peakPt[metricKey],
    lowestTime: lowestPt.displayTime,
    lowestVal: lowestPt[metricKey]
  };
}

export default function WidgetWeatherDetailModal({
  widget = null,
  isOpen = false,
  onClose,
  weatherData = {},
  selectedPersonas = ['daily_life']
}) {
  const { language } = useI18n();
  const isHindi = language === 'hi' || language === 'Hindi';
  const [showFormulaDetails, setShowFormulaDetails] = useState(false);

  const timeline = useMemo(() => build24HourTimeline(weatherData), [weatherData]);
  const current = weatherData.current || {};
  const locationName = weatherData?.name || weatherData?.location || weatherData?.city || weatherData?.district || 'Selected Location';

  if (!isOpen || !widget) return null;

  const widgetId = (widget.widget_id || widget.id || widget.type || 'current_conditions').toLowerCase();
  const IconComponent = METRIC_ICON_MAP[widgetId] || METRIC_ICON_MAP[widget.category] || Thermometer;
  const personaName = (selectedPersonas[0] || 'daily_life').toUpperCase().replace('_', ' ');

  // Metric-Specific Configuration Resolution
  let metricTitle = widget.label || 'Weather Intelligence';
  let metricValue = '--';
  let metricUnit = '';
  let statusBadge = 'Normal';
  let statusBadgeColor = 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30';
  let metricKey = 'temp_c';
  let currentDesc = '';
  let insightText = '';
  let bestWindowLabel = 'Best Window';
  let cautionWindowLabel = 'Peak / Caution Window';
  let riskThresholdHigh = 32.0;
  let riskThresholdLow = 25.0;

  if (widgetId.includes('wbgt')) {
    metricTitle = 'WBGT Heat Stress Safety';
    metricKey = 'wbgt_c';
    const wbgtVal = current.wbgt ?? current.wbgt_c ?? calculateWBGT(current.temp ?? 28, current.humidity ?? 65);
    metricValue = `${Math.round(wbgtVal * 10) / 10}`;
    metricUnit = '°C WBGT';
    riskThresholdHigh = 30.0;
    riskThresholdLow = 26.0;

    if (wbgtVal >= 32.2) {
      statusBadge = 'Extreme Heat Hazard';
      statusBadgeColor = 'bg-rose-500/20 text-rose-300 border-rose-400/30';
      currentDesc = 'Extreme exertion heat stress. Prolonged physical outdoor activity is unsafe.';
    } else if (wbgtVal >= 28.7) {
      statusBadge = 'Moderate Heat Stress';
      statusBadgeColor = 'bg-amber-500/20 text-amber-300 border-amber-400/30';
      currentDesc = 'Elevated heat strain expected during outdoor exertion. Hydrate frequently.';
    } else {
      statusBadge = 'Low Heat Stress';
      statusBadgeColor = 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30';
      currentDesc = 'Thermal comfort conditions are favorable for physical exertion.';
    }

    insightText = `Thermal heat stress rises through mid-day. Early morning and evening hours offer lower physical heat strain.`;
    bestWindowLabel = 'Lower Heat Exposure';
    cautionWindowLabel = 'Peak Heat Exposure';

  } else if (widgetId.includes('rain') || widgetId.includes('precip')) {
    metricTitle = 'Rainfall & Precipitation Risk';
    metricKey = 'pop_pct';
    const popVal = current.pop ? (current.pop > 1 ? current.pop : current.pop * 100) : 15;
    metricValue = `${Math.round(popVal)}`;
    metricUnit = '% Rain Chance';
    riskThresholdHigh = 50.0;
    riskThresholdLow = 20.0;

    if (popVal >= 60) {
      statusBadge = 'High Rain Probability';
      statusBadgeColor = 'bg-rose-500/20 text-rose-300 border-rose-400/30';
      currentDesc = 'Rain or passing showers likely during current window.';
    } else if (popVal >= 30) {
      statusBadge = 'Moderate Rain Risk';
      statusBadgeColor = 'bg-amber-500/20 text-amber-300 border-amber-400/30';
      currentDesc = 'Passing showers possible. Carry waterproof gear.';
    } else {
      statusBadge = 'Low Precipitation Risk';
      statusBadgeColor = 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30';
      currentDesc = 'Minimal rainfall expected for your area today.';
    }

    insightText = `Precipitation probability peaks during afternoon hours. Morning window remains dry.`;
    bestWindowLabel = 'Dry Window';
    cautionWindowLabel = 'Elevated Rain Window';

  } else if (widgetId.includes('wind')) {
    metricTitle = 'Wind Velocity & Gust Advisory';
    metricKey = 'wind_speed_kmh';
    const windVal = current.windSpeed ?? current.wind_speed_kmh ?? 12;
    metricValue = `${Math.round(windVal)}`;
    metricUnit = 'km/h Wind';
    riskThresholdHigh = 22.0;
    riskThresholdLow = 12.0;

    if (windVal >= 25) {
      statusBadge = 'Strong Wind Gusts';
      statusBadgeColor = 'bg-amber-500/20 text-amber-300 border-amber-400/30';
      currentDesc = 'Elevated wind velocity may affect stability and outdoor gear.';
    } else {
      statusBadge = 'Gentle Breeze';
      statusBadgeColor = 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30';
      currentDesc = 'Wind speed is light to moderate with minimal transit impact.';
    }

    insightText = `Wind gusts remain moderate throughout today with gentle breezes in the morning.`;
    bestWindowLabel = 'Calm Wind Window';
    cautionWindowLabel = 'Peak Gust Window';

  } else if (widgetId.includes('uv')) {
    metricTitle = 'UV Exposure & Sun Protection';
    metricKey = 'uv_index';
    const uvVal = current.uvIndex ?? current.uv_index ?? 5;
    metricValue = `${Math.round(uvVal * 10) / 10}`;
    metricUnit = 'UV Index';
    riskThresholdHigh = 6.0;
    riskThresholdLow = 3.0;

    if (uvVal >= 8) {
      statusBadge = 'Very High UV Risk';
      statusBadgeColor = 'bg-rose-500/20 text-rose-300 border-rose-400/30';
      currentDesc = 'Unprotected sun exposure will cause rapid skin damage. Seek shade.';
    } else if (uvVal >= 6) {
      statusBadge = 'High UV Exposure';
      statusBadgeColor = 'bg-amber-500/20 text-amber-300 border-amber-400/30';
      currentDesc = 'Sun protection required during midday exposure.';
    } else {
      statusBadge = 'Moderate UV';
      statusBadgeColor = 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30';
      currentDesc = 'Low to moderate solar radiation levels.';
    }

    insightText = `UV Index peaks around 12 PM – 2 PM. Apply sun protection if outdoors.`;
    bestWindowLabel = 'Low Exposure Window';
    cautionWindowLabel = 'Peak UV Window';

  } else if (widgetId.includes('aqi')) {
    metricTitle = 'Air Quality & Respiratory Risk';
    metricKey = 'aqi';
    const aqiVal = current.aqi ?? 45;
    metricValue = `${aqiVal}`;
    metricUnit = 'AQI Index';
    riskThresholdHigh = 100.0;
    riskThresholdLow = 50.0;

    if (aqiVal >= 150) {
      statusBadge = 'Unhealthy Air Quality';
      statusBadgeColor = 'bg-rose-500/20 text-rose-300 border-rose-400/30';
      currentDesc = 'Air pollution levels elevated. Sensitive groups should limit outdoor exertion.';
    } else if (aqiVal >= 100) {
      statusBadge = 'Moderate Pollution';
      statusBadgeColor = 'bg-amber-500/20 text-amber-300 border-amber-400/30';
      currentDesc = 'Air quality is acceptable for most outdoor activities.';
    } else {
      statusBadge = 'Good Air Quality';
      statusBadgeColor = 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30';
      currentDesc = 'Clean air conditions favorable for all outdoor activities.';
    }

    insightText = `Air quality remains acceptable today with slightly cleaner conditions in the early morning.`;
    bestWindowLabel = 'Clean Air Window';
    cautionWindowLabel = 'Poorer AQI Window';

  } else {
    // Current Ambient Weather Fallback
    metricTitle = widget.label || 'Current Ambient Weather';
    metricKey = 'temp_c';
    const tempVal = current.temp ?? current.temp_c ?? 28;
    metricValue = `${Math.round(tempVal * 10) / 10}`;
    metricUnit = '°C Temperature';

    statusBadge = 'Fair Conditions';
    statusBadgeColor = 'bg-sky-500/20 text-sky-300 border-sky-400/30';
    currentDesc = `Current temperature in ${locationName} is ${tempVal}°C.`;
    insightText = `Favorable ambient weather conditions expected throughout today.`;
    bestWindowLabel = 'Cooler Window';
    cautionWindowLabel = 'Warmest Window';
  }

  const windows = analyzeWeatherWindows(timeline, metricKey, riskThresholdHigh, riskThresholdLow);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#0B132B] text-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-700/60 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-sky-500/15 border border-sky-400/30 text-sky-300">
              <IconComponent className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white leading-tight">
                {metricTitle}
              </h3>
              <span className="text-[10px] font-mono font-semibold tracking-wider text-sky-400 uppercase block mt-0.5">
                {personaName} INTELLIGENCE • {locationName}
              </span>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1 text-xs">

          {/* Current Live Snapshot Card */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 relative overflow-hidden">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-medium text-slate-400 block uppercase tracking-wider">
                  Current Status
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl font-extrabold text-white tracking-tight font-mono">
                    {metricValue}
                  </span>
                  <span className="text-xs font-semibold text-sky-300 font-mono">
                    {metricUnit}
                  </span>
                </div>
              </div>

              <span className={`px-3 py-1 rounded-full text-[11px] font-semibold border ${statusBadgeColor}`}>
                {statusBadge}
              </span>
            </div>

            <p className="text-[11.5px] text-slate-300 mt-3 leading-relaxed">
              {currentDesc}
            </p>

            <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[10.5px] text-slate-400">
              <span>Live Weather Feed</span>
              <span>Updated just now</span>
            </div>
          </div>

          {/* Today's 24-Hour Hourly Trend */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-sky-400" />
                Today's Hourly Trend
              </span>
              <span className="text-[10.5px] text-slate-400">24-Hour Forecast</span>
            </div>

            {/* Horizontal Hourly Timeline */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-700">
              {timeline.map((pt, idx) => {
                const val = pt[metricKey];
                const isHi = val >= riskThresholdHigh;

                return (
                  <div 
                    key={idx}
                    className={`flex-shrink-0 w-16 p-2.5 rounded-xl border text-center transition-all ${
                      pt.isCurrent 
                        ? 'bg-sky-500/20 border-sky-400 text-white ring-1 ring-sky-400/50' 
                        : (pt.isPast ? 'bg-slate-900/40 border-slate-800/60 opacity-60' : 'bg-slate-900/90 border-slate-800')
                    }`}
                  >
                    <span className="text-[10px] font-medium text-slate-400 block">
                      {pt.displayTime}
                    </span>

                    <span className={`text-xs font-bold block my-1.5 font-mono ${isHi ? 'text-amber-400' : 'text-white'}`}>
                      {val != null ? `${val}` : '--'}
                    </span>

                    <span className="text-[9px] text-slate-400 block font-mono">
                      {metricKey === 'wbgt_c' ? `${pt.temp_c}°C` : `${pt.pop_pct}%`}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Key Time Windows */}
          <div className="space-y-2.5">
            <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Key Weather Windows Today
            </span>

            <div className="grid grid-cols-2 gap-3">
              {/* Best Window */}
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                <div className="flex items-center gap-1.5 text-emerald-400 text-[11px] font-semibold mb-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{bestWindowLabel}</span>
                </div>
                <span className="text-xs font-bold text-white font-mono block">
                  {windows.bestWindow}
                </span>
                <span className="text-[10px] text-emerald-300/80 block mt-0.5 leading-tight">
                  Lowest risk period
                </span>
              </div>

              {/* Caution Window */}
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30">
                <div className="flex items-center gap-1.5 text-amber-400 text-[11px] font-semibold mb-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>{cautionWindowLabel}</span>
                </div>
                <span className="text-xs font-bold text-white font-mono block">
                  {windows.cautionWindow}
                </span>
                <span className="text-[10px] text-amber-300/80 block mt-0.5 leading-tight">
                  Peak metric window
                </span>
              </div>
            </div>
          </div>

          {/* Today's Weather Insight */}
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
            <span className="text-[11px] font-bold text-sky-300 uppercase tracking-wider block">
              Today's Weather Insight
            </span>
            <p className="text-[11.5px] text-slate-300 leading-relaxed">
              {insightText}
            </p>
          </div>

          {/* Optional Transparency Note */}
          <div className="border-t border-slate-800/80 pt-3">
            <button
              onClick={() => setShowFormulaDetails(!showFormulaDetails)}
              className="text-[11px] text-slate-400 hover:text-sky-300 flex items-center justify-between w-full py-1 transition-colors"
            >
              <span>Why is this widget shown for {personaName.toLowerCase()}?</span>
              {showFormulaDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {showFormulaDetails && (
              <div className="mt-2 p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 text-[10.5px] text-slate-400 space-y-1 animate-fadeIn">
                <p>
                  This weather intelligence widget is prioritized because current {metricTitle.toLowerCase()} conditions match your active <strong className="text-slate-200">{personaName}</strong> profile preferences and weather sensitivities.
                </p>
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-slate-900/90 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold rounded-xl text-xs transition-colors shadow-sm"
          >
            Close Weather Detail
          </button>
        </div>

      </div>
    </div>
  );
}
