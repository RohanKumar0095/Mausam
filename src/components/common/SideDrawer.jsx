import React from 'react';
import { 
  X, 
  MapPin, 
  User, 
  LogOut, 
  LogIn, 
  Settings, 
  ShieldCheck, 
  Radio, 
  CloudRain, 
  Compass, 
  Layers, 
  Bell, 
  Globe
} from 'lucide-react';
import { useI18n } from '../../i18n/i18nContext';

export default function SideDrawer({
  isOpen,
  onClose,
  currentLocation = {},
  onSelectTab,
  currentUser,
  currentLanguage,
  onOpenProfile,
  onOpenLogin,
  onLogout
}) {
  const { language, setLanguage, t } = useI18n();
  const isHindi = language === 'hi';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex animate-fadeIn">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity" 
      />

      {/* Drawer Content */}
      <div className="relative w-72 max-w-[85vw] bg-white text-slate-800 h-full shadow-2xl z-10 flex flex-col justify-between">
        {/* Top Header */}
        <div className="bg-brand text-white p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono tracking-widest text-sky-200">
              {t('app_title')} • IMD
            </span>
            <button onClick={onClose} className="p-1 rounded-full hover:bg-white/20 text-white/90">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white">
              <User className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-sm truncate text-white">
                {currentUser ? (currentUser.userId || 'rohan_weather') : t('drawer_guest_user')}
              </h4>
              <p className="text-[11px] text-sky-200 truncate">
                📍 {currentLocation.name || currentLocation.city || currentLocation.district || 'My Location'}
              </p>
            </div>
          </div>
        </div>

        {/* Middle Navigation Services */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1 text-xs">
          <div className="p-2 mb-2 rounded-lg bg-sky-50 border border-sky-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-brand" />
              <span className="font-medium text-slate-800">{t('profile_app_language')}</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setLanguage('en')}
                className={`px-2 py-0.5 rounded text-[10.5px] font-medium transition-all ${
                  !isHindi ? 'bg-brand text-white' : 'bg-white text-slate-600 border border-slate-200'
                }`}
              >
                EN
              </button>
              <button
                onClick={() => setLanguage('hi')}
                className={`px-2 py-0.5 rounded text-[10.5px] font-medium transition-all ${
                  isHindi ? 'bg-brand text-white' : 'bg-white text-slate-600 border border-slate-200'
                }`}
              >
                हिन्दी
              </button>
            </div>
          </div>

          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block px-2 pt-1 pb-0.5">
            {t('drawer_services_title')}
          </span>

          <button
            onClick={() => onSelectTab('home')}
            className="w-full flex items-center gap-2.5 p-2 rounded hover:bg-slate-100 text-slate-700 text-left font-normal"
          >
            <Radio className="w-4 h-4 text-brand" />
            <span>{t('drawer_radar')}</span>
          </button>

          <button
            onClick={() => onSelectTab('forecast')}
            className="w-full flex items-center gap-2.5 p-2 rounded hover:bg-slate-100 text-slate-700 text-left font-normal"
          >
            <CloudRain className="w-4 h-4 text-sky-600" />
            <span>{t('drawer_rain_alert')}</span>
          </button>

          <button
            onClick={() => onSelectTab('alerts')}
            className="w-full flex items-center gap-2.5 p-2 rounded hover:bg-slate-100 text-slate-700 text-left font-normal"
          >
            <ShieldCheck className="w-4 h-4 text-amber-600" />
            <span>{t('drawer_lightning')}</span>
          </button>

          <button
            onClick={() => onSelectTab('locations')}
            className="w-full flex items-center gap-2.5 p-2 rounded hover:bg-slate-100 text-slate-700 text-left font-normal"
          >
            <MapPin className="w-4 h-4 text-emerald-600" />
            <span>{t('nav_locations')}</span>
          </button>

          <button
            onClick={onOpenProfile}
            className="w-full flex items-center gap-2.5 p-2 rounded hover:bg-slate-100 text-slate-700 text-left font-normal"
          >
            <Settings className="w-4 h-4 text-slate-600" />
            <span>{t('drawer_profile_link')}</span>
          </button>
        </div>

        {/* Bottom Actions */}
        <div className="p-3 border-t border-slate-200 bg-slate-50">
          {currentUser ? (
            <button
              onClick={onLogout}
              className="w-full py-2 px-3 rounded text-rose-600 hover:bg-rose-50 flex items-center justify-center gap-2 text-xs font-medium transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>{t('drawer_logout')}</span>
            </button>
          ) : (
            <button
              onClick={onOpenLogin}
              className="w-full py-2 px-3 rounded bg-brand text-white hover:bg-brand-dark flex items-center justify-center gap-2 text-xs font-medium transition-colors shadow-xs"
            >
              <LogIn className="w-4 h-4" />
              <span>{t('drawer_login_signup')}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
