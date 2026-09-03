import React from 'react';
import { 
  CloudRain, 
  Sun, 
  Calendar, 
  Clock, 
  Droplets, 
  Wind, 
  Sunrise, 
  Sunset, 
  Moon, 
  Compass, 
  Radio
} from 'lucide-react';
import { useI18n } from '../../i18n/i18nContext';

export default function ForecastView({ weatherData, routine = [] }) {
  const { language, t } = useI18n();
  const isHindi = language === 'hi';

  const hourly = weatherData?.forecast3Hourly || [];
  const daily = weatherData?.dailyForecast || [];
  const astronomy = weatherData?.astronomy || {
    sunrise: '05:32 AM',
    sunset: '06:08 PM',
    moonrise: '08:14 PM',
    moonset: '09:22 AM',
    moonPhase: 'Waning Gibbous 78%'
  };

  return (
    <div className="space-y-4 px-4 py-2 pb-24 text-white">
      {/* 3-Hourly Forecast Section */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-sky-300" />
            <h3 className="text-sm font-semibold uppercase tracking-wider text-sky-100">
              {t('hero_hourly_forecast')}
            </h3>
          </div>
          <span className="text-[11px] text-sky-200/80 font-mono">
            {t('hero_next_24_hours')}
          </span>
        </div>

        <div className="space-y-2">
          {hourly.slice(0, 6).map((h, i) => (
            <div
              key={i}
              className="p-2.5 rounded-mausam bg-white/10 backdrop-blur-md border border-white/15 flex items-center justify-between gap-2 shadow-xs"
            >
              <div className="flex items-center gap-2.5 min-w-[75px]">
                <span className="text-xs font-mono font-medium text-sky-100">{h.time}</span>
                <span className="text-lg">🌤️</span>
              </div>

              <div className="flex-1 min-w-0">
                <span className="text-xs font-medium block truncate text-white">
                  {h.label || h.condition}
                </span>
                <span className="text-[10.5px] text-sky-200 block truncate">
                  {t('hero_humidity')} {h.humidity}% • {h.rainMm || '0.0 mm'}
                </span>
              </div>

              <div className="text-right flex-shrink-0">
                <span className="text-sm font-bold block text-white">{h.temp}°C</span>
                <span className="text-[10.5px] text-sky-300 block font-mono">{h.pop}% 💧</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 7-Day Outlook */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-sky-300" />
            <h3 className="text-sm font-semibold uppercase tracking-wider text-sky-100">
              {t('hero_7day_outlook')}
            </h3>
          </div>
          <span className="text-[11px] text-sky-200/80 font-mono">
            {t('hero_trend_min_max')}
          </span>
        </div>

        <div className="space-y-2">
          {daily.map((d, i) => (
            <div
              key={i}
              className="p-2.5 rounded-mausam bg-white/10 backdrop-blur-md border border-white/15 flex items-center justify-between gap-2 shadow-xs"
            >
              <div className="min-w-[80px]">
                <span className="text-xs font-medium block text-white">{d.day}</span>
                <span className="text-[10px] text-sky-200 font-mono block">{d.date}</span>
              </div>

              <div className="flex-1 min-w-0 flex items-center gap-2">
                <span className="text-lg">🌧️</span>
                <span className="text-xs text-sky-100 truncate">{d.condition}</span>
              </div>

              <div className="text-right flex-shrink-0">
                <span className="text-xs font-bold text-white">
                  {d.minTemp}° / {d.maxTemp}°C
                </span>
                <span className="text-[10.5px] text-sky-300 block font-mono">
                  {d.pop}% {isHindi ? 'बारिश' : 'Rain'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sun & Moon Timings */}
      <div>
        <h3 className="text-sm font-semibold uppercase tracking-wider text-sky-100 mb-2">
          {t('hero_sun_timings')} & {t('hero_moon_timings')}
        </h3>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-3 bg-white/10 backdrop-blur-md border border-white/15 rounded-mausam space-y-1">
            <div className="flex items-center gap-1 text-amber-300 font-medium">
              <Sunrise className="w-4 h-4" />
              <span>{t('hero_sunrise')}</span>
            </div>
            <span className="text-sm font-semibold block">{astronomy.sunrise}</span>
          </div>

          <div className="p-3 bg-white/10 backdrop-blur-md border border-white/15 rounded-mausam space-y-1">
            <div className="flex items-center gap-1 text-orange-300 font-medium">
              <Sunset className="w-4 h-4" />
              <span>{t('hero_sunset')}</span>
            </div>
            <span className="text-sm font-semibold block">{astronomy.sunset}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
