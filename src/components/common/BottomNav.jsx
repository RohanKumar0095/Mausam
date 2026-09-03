import React from 'react';
import { Home, CloudRain, AlertTriangle, MapPin, MessageCircle, Sparkles } from 'lucide-react';
import { useI18n } from '../../i18n/i18nContext';

export default function BottomNav({ activeTab, onTabChange, alertCount = 0, onOpenChat }) {
  const { t } = useI18n();

  return (
    <div className="fixed sm:absolute bottom-0 left-0 right-0 z-40 bg-[#0e4a7b]/95 backdrop-blur-md border-t border-white/20 px-2 py-1.5 text-white flex items-center justify-around shadow-lg">
      <button
        onClick={() => onTabChange('home')}
        className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-lg transition-colors ${
          activeTab === 'home' ? 'text-sky-300 font-semibold' : 'text-white/70 hover:text-white'
        }`}
      >
        <Home className="w-4 h-4" />
        <span className="text-[10px] mt-0.5">{t('nav_home')}</span>
      </button>

      <button
        onClick={() => onTabChange('forecast')}
        className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-lg transition-colors ${
          activeTab === 'forecast' ? 'text-sky-300 font-semibold' : 'text-white/70 hover:text-white'
        }`}
      >
        <CloudRain className="w-4 h-4" />
        <span className="text-[10px] mt-0.5">{t('nav_forecast')}</span>
      </button>

      {/* Floating / Integrated MAUSAM Assistant Button */}
      <button
        onClick={onOpenChat}
        className="flex items-center gap-1.5 px-3 py-1.5 -my-1 rounded-full bg-gradient-to-r from-sky-400 to-brand-light text-slate-900 font-medium text-[11px] shadow-md hover:scale-105 active:scale-95 transition-all border border-sky-200 animate-pulse"
      >
        <Sparkles className="w-3.5 h-3.5 text-brand fill-brand" />
        <span>{t('nav_chat_btn')}</span>
      </button>

      <button
        onClick={() => onTabChange('alerts')}
        className={`relative flex flex-col items-center justify-center py-1 px-2.5 rounded-lg transition-colors ${
          activeTab === 'alerts' ? 'text-sky-300 font-semibold' : 'text-white/70 hover:text-white'
        }`}
      >
        <AlertTriangle className="w-4 h-4" />
        <span className="text-[10px] mt-0.5">{t('nav_alerts')}</span>
        {alertCount > 0 && (
          <span className="absolute top-0 right-1.5 w-2 h-2 rounded-full bg-rose-500 animate-ping" />
        )}
      </button>

      <button
        onClick={() => onTabChange('locations')}
        className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-lg transition-colors ${
          activeTab === 'locations' ? 'text-sky-300 font-semibold' : 'text-white/70 hover:text-white'
        }`}
      >
        <MapPin className="w-4 h-4" />
        <span className="text-[10px] mt-0.5">{t('nav_locations')}</span>
      </button>
    </div>
  );
}
