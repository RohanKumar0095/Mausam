import React, { useState } from 'react';
import { 
  CloudRain, 
  Sun, 
  Wind, 
  Droplets, 
  Eye, 
  Clock
} from 'lucide-react';

export default function ForecastView({ weatherData, routine = [] }) {
  const current = weatherData?.current || {};
  const forecast3h = weatherData?.forecast3Hourly || [];
  const daily = weatherData?.dailyForecast || [];
  const [forecastTab, setForecastTab] = useState('hourly');

  return (
    <div className="space-y-4 px-4 py-2 pb-24 text-white">
      <div className="flex bg-white/10 p-1 rounded-lg backdrop-blur-md">
        <button
          onClick={() => setForecastTab('hourly')}
          className={`flex-1 py-1.5 rounded text-xs font-medium transition-all ${
            forecastTab === 'hourly' ? 'bg-white text-brand shadow-xs' : 'text-sky-100 hover:text-white'
          }`}
        >
          Hourly & 3-Hourly
        </button>
        <button
          onClick={() => setForecastTab('daily')}
          className={`flex-1 py-1.5 rounded text-xs font-medium transition-all ${
            forecastTab === 'daily' ? 'bg-white text-brand shadow-xs' : 'text-sky-100 hover:text-white'
          }`}
        >
          7-Day Outlook
        </button>
        <button
          onClick={() => setForecastTab('agromet')}
          className={`flex-1 py-1.5 rounded text-xs font-medium transition-all ${
            forecastTab === 'agromet' ? 'bg-white text-brand shadow-xs' : 'text-sky-100 hover:text-white'
          }`}
        >
          Agromet Advisory
        </button>
      </div>

      {forecastTab === 'hourly' && (
        <div className="space-y-3">
          <div className="glass-card rounded-mausam p-3.5 shadow-sm">
            <div className="flex items-center justify-between text-xs text-sky-200 mb-2 font-medium">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-sky-300" />
                <span>Routine-Synchronized Timeline</span>
              </span>
              <span className="text-[10px] text-sky-300/80 font-mono">Today</span>
            </div>

            <div className="space-y-2">
              {forecast3h.map((item, idx) => (
                <div key={idx} className="p-2.5 rounded-lg bg-white/5 border border-white/10 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[11px] text-sky-200 w-12 font-medium">{item.time}</span>
                    <CloudRain className="w-4 h-4 text-sky-300" />
                    <div>
                      <span className="font-medium text-white">{item.label}</span>
                      <span className="text-[10.5px] text-sky-200/80 block">💧 {item.rainMm} • {item.pop}% pop</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-medium text-white">{item.temp}°C</span>
                    <span className="text-[10px] text-sky-200 block font-mono">Hum: {item.humidity}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div className="glass-card rounded-mausam p-3 shadow-xs">
              <div className="flex items-center gap-1.5 text-xs text-sky-200 mb-1">
                <Sun className="w-3.5 h-3.5 text-amber-300" />
                <span>UV Index Curve</span>
              </div>
              <p className="text-xl font-medium text-white mt-1">UV {current.uvIndex || 6}</p>
              <p className="text-[11px] text-sky-200 mt-1">Peak: 12:30 PM (UV 8.2)</p>
            </div>

            <div className="glass-card rounded-mausam p-3 shadow-xs">
              <div className="flex items-center gap-1.5 text-xs text-sky-200 mb-1">
                <Eye className="w-3.5 h-3.5 text-emerald-300" />
                <span>Transit Visibility</span>
              </div>
              <p className="text-xl font-medium text-white mt-1">{current.visibility || 5.2} km</p>
              <p className="text-[11px] text-sky-200 mt-1">Road status: Good</p>
            </div>
          </div>
        </div>
      )}

      {forecastTab === 'daily' && (
        <div className="space-y-3">
          <div className="glass-card rounded-mausam p-4 shadow-sm space-y-3">
            <h4 className="text-xs font-medium text-sky-200 uppercase tracking-wider">
              7-Day Synoptic Weather Guidance
            </h4>

            {daily.map((day, idx) => (
              <div key={idx} className="p-2.5 rounded-lg bg-white/5 border border-white/10 flex items-center justify-between text-xs">
                <div className="w-24">
                  <span className="font-mono text-[10px] text-sky-300 block">{day.date}</span>
                  <span className="font-medium text-white text-[13px]">{day.day}</span>
                </div>

                <div className="flex-1 px-2">
                  <span className="text-[11.5px] text-sky-100 font-normal block truncate">{day.condition}</span>
                  <span className="text-[10px] text-sky-300 font-mono">Rain Risk: {day.pop}%</span>
                </div>

                <div className="text-right">
                  <span className="font-mono text-white font-medium">{day.minTemp}° – {day.maxTemp}°C</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {forecastTab === 'agromet' && (
        <div className="space-y-3">
          <div className="glass-card rounded-mausam p-4 shadow-sm space-y-3">
            <h4 className="text-xs font-medium text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
              <span>🌾 IMD Agromet Advisory Bulletin</span>
            </h4>

            <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-400/30 text-xs space-y-2">
              <p className="font-medium text-emerald-200">Kharif Paddy & Field Operations:</p>
              <p className="text-sky-100 leading-snug">
                Current soil moisture levels are optimum for transplantation and root development. Intermittent light rain expected over next 48 hours will maintain adequate canal ponding.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-white/5 border border-white/10 text-xs space-y-1.5">
              <span className="font-medium text-white block">Chemical / Spray Schedule:</span>
              <p className="text-sky-200 leading-snug">
                Perform weedicide / foliar application only between 06:30 AM and 11:00 AM. Avoid afternoon spraying due to high probability of rain washout.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
