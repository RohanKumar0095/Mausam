import React from 'react';
import { Menu, Search, MapPin, ChevronDown, Bell } from 'lucide-react';
import { useI18n } from '../../i18n/i18nContext';

export default function Header({
  locationData,
  currentLocationId,
  onOpenLocationPicker,
  onOpenDrawer,
  briefingText,
  currentTime,
  onOpenSearch,
  activeAlertCount = 0,
  onOpenAlertCenter
}) {
  const { t } = useI18n();

  return (
    <header className="w-full text-white bg-transparent">
      {/* Top Utility Bar */}
      <div className="px-4 pt-3 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenDrawer}
            className="p-1.5 -ml-1.5 rounded-full hover:bg-white/10 active:bg-white/20 transition-colors"
            title={t('drawer_services_title')}
          >
            <Menu className="w-5 h-5" />
          </button>

          <div>
            <span className="text-[13px] font-bold tracking-wider font-mono">
              {t('app_title')}
            </span>
            <span className="text-[10px] text-sky-200 block font-normal leading-none mt-0.5">
              {t('imd_title')}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Notification Bell Button */}
          {onOpenAlertCenter && (
            <button
              onClick={onOpenAlertCenter}
              className="p-1.5 rounded-full bg-white/15 hover:bg-white/25 border border-white/20 relative transition-all shadow-xs"
              title="Alert Center"
            >
              <Bell className="w-4 h-4 text-sky-200" />
              {activeAlertCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                  {activeAlertCount}
                </span>
              )}
            </button>
          )}

          {/* Location Selector Button */}
          <button
            onClick={onOpenLocationPicker}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/15 hover:bg-white/25 rounded-full backdrop-blur-md transition-all border border-white/20 text-xs shadow-xs"
          >
            <MapPin className="w-3.5 h-3.5 text-sky-300 flex-shrink-0" />
            <span className="font-medium max-w-[120px] truncate text-white">
              {locationData?.name || locationData?.city || locationData?.district || 'My Location'}
            </span>
            <ChevronDown className="w-3 h-3 text-sky-300 flex-shrink-0" />
          </button>
        </div>
      </div>

      {/* Daily Briefing Banner */}
      {briefingText && (
        <div className="mx-4 mt-2 mb-1 p-3 rounded-mausam bg-white/15 backdrop-blur-md border border-white/20 shadow-sm">
          <div className="flex items-start gap-2">
            <span className="text-sm">🌤️</span>
            <div className="flex-1 min-w-0">
              <span className="text-[10.5px] uppercase tracking-wider font-semibold text-sky-300 block mb-0.5">
                {t('official_weather_info')} • {currentTime}
              </span>
              <p className="text-[12px] font-normal leading-relaxed text-white">
                {briefingText}
              </p>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
