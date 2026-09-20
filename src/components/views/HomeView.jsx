import React, { useState, useMemo } from 'react';
import PersonaChipRow from '../common/PersonaChipRow';
import ActivityTimeline from '../routine/ActivityTimeline';
import WidgetCard from '../common/WidgetCard';
import SevereAlertBanner from '../common/SevereAlertBanner';
import InAppAlertBanner from '../alerts/InAppAlertBanner';
import NudgeBanner from '../common/NudgeBanner';
import DailyPlanCard from '../recommendations/DailyPlanCard';
import { useI18n } from '../../i18n/i18nContext';
import { PERSONA_REGISTRY } from '../../engine/personaRegistry';
import { evaluateSharedWeatherIntelligence } from '../../engine/sharedWeatherIntelligence';
import { 
  CloudSun, 
  Wind, 
  Droplets, 
  Eye, 
  Thermometer, 
  Compass, 
  Clock, 
  CalendarDays,
  ShieldAlert,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Sparkles,
  RotateCw,
  Info,
  Radio,
  SlidersHorizontal,
  CheckCircle2,
  XCircle
} from 'lucide-react';

export default function HomeView({
  weatherData,
  rankedWidgets = [],
  selectedPersonas = ['daily_life'],
  onTogglePersona,
  routine = [],
  currentTime = '06:30',
  safetyInfo,
  alerts = [],
  onSelectAlert,
  onOpenAlertCenter,
  nudge,
  isWeatherLoading = false,
  isWeatherError = false,
  weatherErrorInfo = null,
  isUVLive = false,
  onRefresh,
  onExplainWidget,
  onEditRoutine,
  onSelectRoutine,
  onOpenAlerts,
  onOpenRadar,
  onNudgeAction,
  selectedPlot = 'Plot A (Rice)',
  onSelectPlot,
  userProfile = {}
}) {
  const { language, t } = useI18n();
  const isHindi = language === 'hi';
  const [showAllWidgets, setShowAllWidgets] = useState(false);

  const current = weatherData?.current || {};

  // Single Source of Truth for Primary Decision Intelligence & Daily Plan
  const sharedIntelligence = useMemo(() => {
    return evaluateSharedWeatherIntelligence({
      userId: userProfile?.id || 'usr_demo',
      date: new Date().toISOString().split('T')[0],
      selectedPersonas,
      routine,
      athleteProfile: userProfile,
      weatherData
    });
  }, [weatherData, routine, selectedPersonas, userProfile]);

  const pdi = sharedIntelligence.primary_decision_insight;

  const visibleWidgets = showAllWidgets ? rankedWidgets : rankedWidgets.slice(0, 6);

  return (
    <div className="space-y-3.5 pb-24 text-white">
      {/* 0. API CONFIGURATION / NETWORK STATUS BANNER (If not configured or error) */}
      {isWeatherError && (
        <div className="mx-4 p-3 rounded-mausam bg-amber-500/20 border border-amber-400/40 text-amber-100 flex items-start gap-2.5 text-xs backdrop-blur-md">
          <Info className="w-4 h-4 text-amber-300 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <span className="font-semibold block text-white text-[12px]">
              {isHindi ? 'लाइव मौसम डेटा स्थिति' : 'Live Weather API Status'}
            </span>
            <p className="text-[11px] text-amber-200 mt-0.5 leading-snug">
              {weatherErrorInfo?.error === 'NOT_CONFIGURED'
                ? (isHindi 
                    ? 'मौसम API की (Key) .env में कॉन्फ़िगर नहीं है। कृपया .env फ़ाइल में VITE_WEATHER_API_KEY जोड़ें।' 
                    : 'Weather API key is not configured. Add VITE_WEATHER_API_KEY in your .env file to enable live feed.')
                : (isHindi
                    ? 'मौसम की जानकारी फिलहाल उपलब्ध नहीं है। कृपया अपना इंटरनेट कनेक्शन जांचें।'
                    : (weatherErrorInfo?.message || 'Weather data is currently unavailable. Please check network connection.'))}
            </p>
          </div>
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="px-2 py-1 rounded bg-amber-500/30 hover:bg-amber-500/50 text-white text-[10.5px] font-medium border border-amber-300/40 flex items-center gap-1 transition-colors"
            >
              <RotateCw className="w-3 h-3" />
              <span>{isHindi ? 'पुनः प्रयास' : 'Retry'}</span>
            </button>
          )}
        </div>
      )}

      {/* 1. SEVERE ALERT BANNER (If Red/Amber active) */}
      <SevereAlertBanner 
        safetyInfo={safetyInfo} 
        onViewDetails={onOpenAlerts} 
      />

      {/* 1.5 CONTEXT-AWARE IN-APP ALERT BANNER */}
      <InAppAlertBanner
        alerts={alerts}
        onSelectAlert={onSelectAlert}
        onOpenAlertCenter={onOpenAlertCenter}
      />

      {/* 2. CONTEXTUAL NUDGE BANNER */}
      {nudge && (
        <NudgeBanner 
          nudge={nudge} 
          onAction={() => onNudgeAction(nudge.actionTab)} 
        />
      )}

      {/* 3. ACTIVE PROFILES HORIZONTAL ROW */}
      <PersonaChipRow
        selectedPersonas={selectedPersonas}
        onTogglePersona={onTogglePersona}
      />

      {/* 4. LAYER 2: UNIFIED RECOMMENDED SECTION (Merges Primary Recommendation + Activity Forecast Plan) */}
      <DailyPlanCard
        userId="usr_demo"
        weatherData={weatherData}
        routine={routine}
        selectedPersonas={selectedPersonas}
        onEditRoutine={onEditRoutine}
      />




      {/* 6. DAILY WEATHER ROUTINE HORIZONTAL TIMELINE */}
      <ActivityTimeline
        routine={routine}
        currentTime={currentTime}
        onEditRoutine={onEditRoutine}
        onSelectRoutine={onSelectRoutine}
      />

      {/* 7. HERO WEATHER CARD WITH AUTHENTIC API STATUS */}
      <div className="mx-4 p-4 rounded-mausam bg-white/15 backdrop-blur-md border border-white/20 shadow-md">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-mono uppercase tracking-wider text-sky-200">
                {weatherData?.name || weatherData?.district || weatherData?.city || 'My Location'}{weatherData?.state ? `, ${weatherData.state}` : ''}
              </span>
              <span className={`px-1.5 py-0.2 rounded text-[9.5px] font-medium border flex items-center gap-1 ${
                isWeatherLoading
                  ? 'bg-sky-400/20 text-sky-200 border-sky-300/30'
                  : weatherData?.metadata?.isLive
                    ? 'bg-emerald-500/20 text-emerald-200 border-emerald-400/40'
                    : 'bg-amber-500/20 text-amber-200 border-amber-400/40'
              }`}>
                <Radio className={`w-2.5 h-2.5 ${
                  isWeatherLoading
                    ? 'animate-spin text-amber-300'
                    : weatherData?.metadata?.isLive
                      ? 'text-emerald-300'
                      : 'text-amber-300'
                }`} />
                <span>
                  {isWeatherLoading
                    ? (isHindi ? 'लाइव मौसम अपडेट हो रहा है...' : 'Connecting to weather service...')
                    : weatherData?.metadata?.isLive
                      ? (isHindi ? 'लाइव मौसम API' : 'Live Weather API')
                      : weatherErrorInfo?.error === 'NOT_CONFIGURED'
                        ? (isHindi ? 'मौसम API कॉन्फ़िगर नहीं है' : 'Weather API not configured')
                        : weatherErrorInfo?.error === 'AUTH_ERROR'
                          ? (isHindi ? 'अमान्य API की (Key)' : 'Invalid API key')
                          : (isHindi ? 'मौसम डेटा अनुपलब्ध' : 'Weather API unavailable')}
                </span>
              </span>
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-4xl font-light text-white tracking-tight">
                {weatherData?.metadata?.isLive && current.temp != null ? `${current.temp}°C` : '--°C'}
              </span>
              <span className="text-xs text-sky-200 font-normal">
                {weatherData?.metadata?.isLive && current.humidity != null
                  ? `${t('hero_humidity')} ${current.humidity}%`
                  : (isHindi ? 'आर्द्रता: --%' : 'Humidity: --%')}
              </span>
            </div>
            <p className="text-xs text-sky-100 mt-1 font-normal">
              {current.condition || (isHindi ? 'मौसम पूर्वानुमान' : 'Weather Forecast')}
            </p>
          </div>
          <div className="text-right flex flex-col items-end">
            <span className="text-2xl font-light text-amber-300 font-mono">
              {current.wbgt != null ? `${current.wbgt}°C` : '--'}
            </span>
            <span className="text-[10px] text-sky-200 uppercase tracking-wider font-mono">
              {t('hero_wbgt_heat_index') || 'WBGT Heat Index'}
            </span>
            {isUVLive && (
              <span className="mt-1 px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-200 text-[9.5px] border border-amber-300/30">
                ☀️ UV {current.uvIndex ?? '--'}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 8. PERSONA-PRIORITIZED WIDGET GRID */}
      <div className="mx-4 space-y-2">
        <div className="flex items-center justify-between text-xs text-sky-200 font-medium">
          <div className="flex items-center gap-1">
            <SlidersHorizontal className="w-3.5 h-3.5 text-amber-300" />
            <span className="text-white">{t('home_persona_prioritized_widgets') || 'Persona-Prioritized Widgets'}</span>
            <span className="text-[10px] font-mono text-sky-200/80">({visibleWidgets.length})</span>
          </div>
          <button
            onClick={() => setShowAllWidgets(!showAllWidgets)}
            className="text-sky-300 hover:text-white flex items-center gap-0.5 text-[11px] transition-colors"
          >
            <span>{showAllWidgets ? (isHindi ? 'कम दिखाएं' : 'Show Top 6') : (isHindi ? 'सभी दिखाएं' : 'View All')}</span>
            {showAllWidgets ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {visibleWidgets.map(widget => (
            <WidgetCard
              key={widget.id}
              widget={widget}
              weatherData={weatherData}
              onExplain={onExplainWidget}
              onOpenRadar={onOpenRadar}
              selectedPlot={selectedPlot}
              onSelectPlot={onSelectPlot}
            />
          ))}
        </div>
      </div>

    </div>
  );
}
