import React, { useState } from 'react';
import { 
  Compass, 
  Droplets, 
  ChevronRight, 
  Sun, 
  Moon, 
  Map, 
  Sprout, 
  Users, 
  Wind, 
  CloudRain,
  Sparkles,
  Info
} from 'lucide-react';
import WidgetCard from '../common/WidgetCard';
import SevereAlertBanner from '../common/SevereAlertBanner';
import NudgeBanner from '../common/NudgeBanner';
import ActivityTimeline from '../routine/ActivityTimeline';
import PersonaChipRow from '../common/PersonaChipRow';

export default function HomeView({
  weatherData,
  rankedWidgets = [],
  selectedPersonas = [],
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
  const current = weatherData?.current || {};
  const forecast3h = weatherData?.forecast3Hourly || [];
  const daily = weatherData?.dailyForecast || [];
  const astronomy = weatherData?.astronomy || {};

  const topPersonalizedWidgets = rankedWidgets.slice(0, 6);
  const secondaryWidgets = rankedWidgets.slice(6);
  const [showAllWidgets, setShowAllWidgets] = useState(false);

  return (
    <div className="space-y-3 pb-20">
      <PersonaChipRow
        selectedPersonas={selectedPersonas}
        onTogglePersona={onTogglePersona}
      />

      <ActivityTimeline
        routine={routine}
        currentTime={currentTime}
        onEditRoutine={onEditRoutine}
      />

      <SevereAlertBanner
        safetyInfo={safetyInfo}
        onOpenAlerts={onOpenAlerts}
      />

      {nudge && (
        <NudgeBanner
          nudge={nudge}
          onAction={onNudgeAction}
        />
      )}

      {/* Primary Personalized Widgets Grid */}
      <div className="px-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-300" />
            <h3 className="text-xs font-medium text-white tracking-wide uppercase">
              Personalized Priorities ({rankedWidgets.length} Available)
            </h3>
          </div>
          <span className="text-[10px] text-sky-200/80 font-mono">
            Synced for {currentTime}
          </span>
        </div>

        {/* Farm Plot Selector when Agriculture is active */}
        {selectedPersonas.includes('agriculture') && (
          <div className="flex items-center gap-1.5 mb-2.5 overflow-x-auto no-scrollbar py-0.5">
            <span className="text-[11px] text-sky-200 font-medium mr-1 flex items-center gap-1 flex-shrink-0">
              🌾 Field Plot:
            </span>
            {['Plot A (Rice)', 'Plot B (Maize)', 'Plot C (Vegetables)'].map(plot => (
              <button
                key={plot}
                onClick={() => onSelectPlot && onSelectPlot(plot)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all flex-shrink-0 ${
                  (selectedPlot || 'Plot A (Rice)') === plot
                    ? 'bg-emerald-500 text-slate-950 font-bold shadow-xs'
                    : 'bg-white/10 text-white/90 hover:bg-white/20'
                }`}
              >
                {plot}
              </button>
            ))}
          </div>
        )}

        {/* 2-column grid */}
        <div className="grid grid-cols-2 gap-2.5">
          {topPersonalizedWidgets.map(widget => (
            <WidgetCard
              key={widget.id}
              widget={widget}
              onExplain={onExplainWidget}
            />
          ))}
        </div>

        {secondaryWidgets.length > 0 && (
          <div className="mt-2 text-center">
            <button
              onClick={() => setShowAllWidgets(!showAllWidgets)}
              className="text-[11px] text-sky-200 hover:text-white font-medium py-1 px-3 rounded-full bg-white/10 hover:bg-white/15 transition-all"
            >
              {showAllWidgets ? 'Show Less Widgets' : `+ Show ${secondaryWidgets.length} More Context Widgets`}
            </button>
          </div>
        )}

        {showAllWidgets && (
          <div className="grid grid-cols-2 gap-2.5 mt-2.5 animate-fadeIn">
            {secondaryWidgets.map(widget => (
              <WidgetCard
                key={widget.id}
                widget={widget}
                onExplain={onExplainWidget}
              />
            ))}
          </div>
        )}
      </div>

      {/* Original IMD Current Weather Hero Card */}
      <div className="px-4 pt-1">
        <div className="glass-card rounded-mausam p-4 text-white shadow-md relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-normal tracking-tight">
                  {current.temp || '25.2'}°C
                </span>
              </div>
              
              <p className="text-[11px] text-sky-200 mt-1 font-normal">
                Updated At {current.updatedAt || '11:30 AM'}
              </p>

              <div className="mt-3 space-y-1 text-xs text-sky-100 font-normal">
                <p>Humidity: <strong className="font-medium text-white">{current.humidity || 84}%</strong></p>
                <p>24h Rain: <strong className="font-medium text-white">{current.rainfall24h || 0} mm</strong></p>
                <p>Min / Max: <strong className="font-medium text-white">{current.minTemp || 21.0} / {current.maxTemp || 26.5} °C</strong></p>
              </div>
            </div>

            <div className="flex flex-col items-center">
              <div className="relative w-24 h-24 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-2 border-dashed border-white/20" />
                <span className="absolute top-0 text-[10px] text-sky-200 font-bold">N</span>
                <span className="absolute bottom-0 text-[10px] text-sky-200 font-bold">S</span>
                <span className="absolute left-1 text-[10px] text-sky-200 font-bold">W</span>
                <span className="absolute right-1 text-[10px] text-sky-200 font-bold">E</span>
                
                <div 
                  className="w-1.5 h-16 bg-gradient-to-t from-amber-400 via-white to-sky-300 rounded-full transform origin-center transition-transform duration-700 shadow-sm"
                  style={{ transform: `rotate(${current.windDegree || 205}deg)` }}
                />
                
                <div className="w-3 h-3 rounded-full bg-slate-900 border-2 border-white z-10" />
              </div>

              <div className="text-center mt-1">
                <span className="text-xs font-medium text-white block">
                  {current.windSpeed || 8} km/h
                </span>
                <span className="text-[10px] text-sky-200 uppercase font-mono">
                  {current.windDirection || 'SSW'}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-xs font-normal text-sky-100">
                Air Quality Index (AQI)
              </span>
            </div>
            <div className="flex items-center gap-1.5 bg-emerald-500/20 border border-emerald-400/30 px-2.5 py-0.5 rounded-full">
              <span className="text-xs font-medium text-emerald-300">
                {current.aqi || 83}
              </span>
              <span className="text-[10px] text-emerald-200 font-normal">
                Satisfactory
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3 Hourly Forecast */}
      <div className="px-4">
        <div className="flex items-center justify-between text-xs text-sky-200 mb-2 font-normal">
          <span className="font-medium text-white">3 Hourly Forecast</span>
          <span className="text-[11px] opacity-80">Next 24 Hours</span>
        </div>

        <div className="glass-card rounded-mausam p-3 flex gap-4 overflow-x-auto scroll-touch-x no-scrollbar scrollbar-hide">
          {forecast3h.map((item, idx) => (
            <div key={idx} className="flex-shrink-0 flex flex-col items-center min-w-[56px] text-white">
              <span className="text-[11px] font-mono text-sky-200 opacity-90">{item.time}</span>
              <span className="text-base font-normal my-1">{item.temp}°</span>
              
              <div className="flex items-center gap-1 text-[10px] text-sky-300 mt-0.5">
                <Droplets className="w-2.5 h-2.5" />
                <span>{item.rainMm} mm</span>
              </div>
              <span className="text-[10px] text-sky-200/70 font-mono mt-0.5">
                {item.windKmh} km/h
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 7-Day Outlook Forecast */}
      <div className="px-4">
        <div className="flex items-center justify-between text-xs text-sky-200 mb-2 font-normal">
          <span className="font-medium text-white">7-Day Outlook</span>
          <span className="text-[11px] opacity-80">Trend & Min/Max</span>
        </div>

        <div className="glass-card rounded-mausam p-3 space-y-2.5 text-white">
          {daily.map((day, idx) => (
            <div key={idx} className="flex items-center justify-between text-xs">
              <span className="w-14 font-medium text-sky-100">{day.day}</span>
              
              <div className="flex items-center gap-1.5 text-[11px] text-sky-200 flex-1 px-2">
                <CloudRain className="w-3.5 h-3.5 text-sky-300 flex-shrink-0" />
                <span className="truncate">{day.condition}</span>
              </div>

              <div className="flex items-center gap-2 font-mono text-xs">
                <span className="text-sky-300 text-[11px]">{day.minTemp}°</span>
                <div className="w-16 h-1.5 bg-white/15 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-sky-400 to-amber-400 rounded-full"
                    style={{ width: `${Math.min(100, Math.max(20, (day.maxTemp - 15) * 5))}%` }}
                  />
                </div>
                <span className="text-amber-300 font-medium">{day.maxTemp}°</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sun & Moon Timings */}
      <div className="px-4">
        <div className="grid grid-cols-2 gap-2.5">
          <div className="glass-card rounded-mausam p-3 text-white">
            <div className="flex items-center gap-1.5 mb-2 text-xs text-amber-300 font-medium">
              <Sun className="w-4 h-4" />
              <span>Sun Timings</span>
            </div>
            <div className="flex justify-between text-xs">
              <div>
                <span className="text-[10px] text-sky-200 block">Sunrise</span>
                <span className="font-mono text-white font-medium">{astronomy.sunrise || '05:42 AM'}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-sky-200 block">Sunset</span>
                <span className="font-mono text-white font-medium">{astronomy.sunset || '06:18 PM'}</span>
              </div>
            </div>
          </div>

          <div className="glass-card rounded-mausam p-3 text-white">
            <div className="flex items-center gap-1.5 mb-2 text-xs text-sky-300 font-medium">
              <Moon className="w-4 h-4" />
              <span>Moon Timings</span>
            </div>
            <div className="flex justify-between text-xs">
              <div>
                <span className="text-[10px] text-sky-200 block">Moonrise</span>
                <span className="font-mono text-white font-medium">{astronomy.moonrise || '07:12 PM'}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-sky-200 block">Moonset</span>
                <span className="font-mono text-white font-medium">{astronomy.moonset || '06:05 AM'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Radar & Alerts Quick Navigation */}
      <div className="px-4 pt-1">
        <div className="grid grid-cols-2 gap-2.5">
          <button
            onClick={onOpenRadar}
            className="p-3 bg-white/10 hover:bg-white/15 active:bg-white/20 rounded-mausam border border-white/15 text-white flex items-center justify-between text-xs transition-all shadow-xs"
          >
            <div className="flex items-center gap-2">
              <Map className="w-4 h-4 text-sky-300" />
              <div className="text-left">
                <span className="font-medium block">Doppler Radar</span>
                <span className="text-[10px] text-sky-200/80">Live reflectivity scan</span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-sky-300/80" />
          </button>

          <button
            onClick={onOpenAlerts}
            className="p-3 bg-white/10 hover:bg-white/15 active:bg-white/20 rounded-mausam border border-white/15 text-white flex items-center justify-between text-xs transition-all shadow-xs"
          >
            <div className="flex items-center gap-2">
              <CloudRain className="w-4 h-4 text-amber-300" />
              <div className="text-left">
                <span className="font-medium block">Alerts & Warnings</span>
                <span className="text-[10px] text-sky-200/80">IMD advisory bulletin</span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-sky-300/80" />
          </button>
        </div>
      </div>
    </div>
  );
}
