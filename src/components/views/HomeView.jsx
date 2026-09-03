import React, { useState } from 'react';
import PersonaChipRow from '../common/PersonaChipRow';
import ActivityTimeline from '../routine/ActivityTimeline';
import WidgetCard from '../common/WidgetCard';
import SevereAlertBanner from '../common/SevereAlertBanner';
import NudgeBanner from '../common/NudgeBanner';
import { useI18n } from '../../i18n/i18nContext';
import { 
  CloudSun, 
  Wind, 
  Droplets, 
  Eye, 
  Thermometer, 
  Compass, 
  Clock, 
  CalendarDays,
  Radio,
  ShieldAlert,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Sparkles
} from 'lucide-react';

export default function HomeView({
  weatherData,
  rankedWidgets = [],
  selectedPersonas = ['daily_life'],
  onTogglePersona,
  routine = [],
  currentTime = '06:30',
  safetyInfo,
  nudge,
  onExplainWidget,
  onEditRoutine,
  onOpenAlerts,
  onOpenRadar,
  onNudgeAction,
  selectedPlot = 'Plot A (Rice)',
  onSelectPlot
}) {
  const { language, t } = useI18n();
  const isHindi = language === 'hi';
  const [showAllWidgets, setShowAllWidgets] = useState(false);

  const current = weatherData?.current || {};
  const isAgriculture = selectedPersonas.includes('agriculture');
  const visibleWidgets = showAllWidgets ? rankedWidgets : rankedWidgets.slice(0, 6);

  return (
    <div className="space-y-3 pb-24 text-white">
      {/* 1. SEVERE ALERT BANNER (If Red/Amber active) */}
      <SevereAlertBanner 
        safetyInfo={safetyInfo} 
        onViewDetails={onOpenAlerts} 
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

      {/* 4. DAILY WEATHER ROUTINE HORIZONTAL TIMELINE */}
      <ActivityTimeline
        routine={routine}
        currentTime={currentTime}
        onEditRoutine={onEditRoutine}
      />

      {/* 5. ORIGINAL IMD HERO WEATHER CARD */}
      <div className="mx-4 p-4 rounded-mausam bg-white/15 backdrop-blur-md border border-white/20 shadow-md">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-mono uppercase tracking-wider text-sky-200">
                {weatherData?.district || 'Gaya'}, {weatherData?.state || 'Bihar'}
              </span>
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-4xl font-light text-white tracking-tight">
                {current.temp || 25.2}°C
              </span>
              <span className="text-xs text-sky-200 font-normal">
                {t('hero_humidity')} {current.humidity || 84}%
              </span>
            </div>
            <p className="text-xs text-sky-100 mt-1 font-normal">
              {current.condition || 'Partly Cloudy'}
            </p>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-sky-200/80 block font-mono">
              {t('hero_updated_at')} {current.updatedAt || '11:30 AM'}
            </span>
            <div className="mt-2 flex flex-col items-end gap-1">
              <span className="px-2 py-0.5 rounded bg-emerald-500/30 text-emerald-200 text-[10.5px] font-medium border border-emerald-400/30">
                AQI {current.aqi || 83} • {t('hero_aqi_satisfactory')}
              </span>
              <span className="text-[10.5px] text-sky-200 font-mono">
                {t('hero_24h_rain')} {current.rainfall24h || 3.5} mm
              </span>
            </div>
          </div>
        </div>

        {/* Micro Weather Barometer Row */}
        <div className="mt-3 pt-3 border-t border-white/15 grid grid-cols-4 gap-1 text-center text-[10.5px]">
          <div>
            <span className="text-sky-200 block text-[9.5px]">{t('hero_min_max')}</span>
            <span className="font-semibold text-white">{current.minTemp || 21}°/{current.maxTemp || 27}°</span>
          </div>
          <div>
            <span className="text-sky-200 block text-[9.5px]">{isHindi ? 'हवा' : 'Wind'}</span>
            <span className="font-semibold text-white">{current.windSpeed || 7} km/h</span>
          </div>
          <div>
            <span className="text-sky-200 block text-[9.5px]">{isHindi ? 'दिशा' : 'Direction'}</span>
            <span className="font-semibold text-white">{current.windDirection || 'NNE'}</span>
          </div>
          <div>
            <span className="text-sky-200 block text-[9.5px]">UV</span>
            <span className="font-semibold text-white">{current.uvIndex || 4}</span>
          </div>
        </div>
      </div>

      {/* 6. AGRICULTURE FARM PLOT SELECTOR (Only shown if Agriculture is selected) */}
      {isAgriculture && (
        <div className="mx-4 p-2.5 rounded-mausam bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5 text-emerald-200">
            <span className="font-medium text-emerald-300">{t('home_field_plot')}</span>
          </div>
          <div className="flex items-center gap-1">
            {['Plot A (Rice)', 'Plot B (Maize)', 'Plot C (Vegetables)'].map(plot => {
              const isSelected = selectedPlot === plot;
              return (
                <button
                  key={plot}
                  onClick={() => onSelectPlot && onSelectPlot(plot)}
                  className={`px-2 py-1 rounded text-[10.5px] font-medium transition-all ${
                    isSelected
                      ? 'bg-emerald-500 text-slate-950 font-bold shadow-xs'
                      : 'bg-white/10 text-emerald-100 hover:bg-white/20'
                  }`}
                >
                  {plot}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 7. DYNAMIC PERSONALIZED RANKED WIDGETS SECTION */}
      <div className="px-4 pt-1">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-sky-300" />
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider">
              {t('home_personalized_priorities')}
            </h4>
          </div>
          <span className="text-[10px] text-sky-200/80 font-mono">
            {t('home_synced_for')} {currentTime}
          </span>
        </div>

        {/* 2-Column Responsive Card Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {visibleWidgets.map(widget => (
            <WidgetCard
              key={widget.id}
              widget={widget}
              onExplain={() => onExplainWidget(widget)}
            />
          ))}
        </div>

        {/* Expand / Collapse Button */}
        {rankedWidgets.length > 6 && (
          <div className="mt-3 text-center">
            <button
              onClick={() => setShowAllWidgets(!showAllWidgets)}
              className="px-4 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-sky-200 text-xs font-medium transition-colors border border-white/15 inline-flex items-center gap-1 shadow-xs"
            >
              <span>{showAllWidgets ? t('home_show_less') : t('home_show_more')}</span>
              {showAllWidgets ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          </div>
        )}
      </div>

      {/* 8. 3-HOURLY FORECAST STRIP */}
      <div className="px-4 pt-2">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-sky-100">
            {t('hero_hourly_forecast')}
          </span>
          <span className="text-[10px] text-sky-200/80 font-mono">
            {t('hero_next_24_hours')}
          </span>
        </div>

        <div className="flex items-stretch gap-2 overflow-x-auto no-scrollbar scrollbar-hide py-1">
          {(weatherData?.forecast3Hourly || []).slice(0, 7).map((h, i) => (
            <div
              key={i}
              className="flex-shrink-0 w-20 rounded-mausam bg-white/10 backdrop-blur-md p-2 text-center border border-white/15"
            >
              <span className="text-[10px] text-sky-200 block font-mono">{h.time}</span>
              <span className="text-sm block my-1">🌤️</span>
              <span className="text-xs font-bold block">{h.temp}°C</span>
              <span className="text-[9px] text-sky-300 block">{h.pop}% 💧</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
