import React from 'react';
import { X, User, Globe, Check, Edit3, MapPin, Clock, LogOut } from 'lucide-react';
import { PERSONAS } from '../../data/personaDefinitions';
import { useI18n } from '../../i18n/i18nContext';

export default function ProfileModal({
  isOpen,
  onClose,
  currentUser,
  selectedPersonas = [],
  routine = [],
  onEditPersonalization,
  onEditRoutine,
  onManageLocations,
  onChangeLanguage,
  onLogout
}) {
  const { language, setLanguage, t } = useI18n();
  const isHindi = language === 'hi';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-brand px-4 py-3 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-sky-300" />
            <h3 className="text-sm font-medium">{t('profile_title')}</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-white/20 text-white/90">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto space-y-4 text-xs">
          {/* User Account Info */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-slate-500 block">{t('profile_user_id')}</span>
              <span className="font-semibold text-slate-900 text-sm">
                @{currentUser?.userId || 'rohan_weather'}
              </span>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10.5px] font-medium">
              ✓ {t('profile_verified')}
            </span>
          </div>

          {/* Language Selector */}
          <div className="p-3 bg-sky-50/70 rounded-xl border border-sky-100 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-brand" />
                <span className="font-semibold text-brand text-[12px]">
                  {t('profile_app_language')}
                </span>
              </div>
              <span className="text-[11px] text-slate-500">
                {isHindi ? 'हिन्दी सक्रिय' : 'English Active'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`py-2 px-3 rounded-lg border text-center transition-all ${
                  !isHindi
                    ? 'bg-brand text-white border-brand font-medium shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => setLanguage('hi')}
                className={`py-2 px-3 rounded-lg border text-center transition-all ${
                  isHindi
                    ? 'bg-brand text-white border-brand font-medium shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                हिन्दी
              </button>
            </div>
          </div>

          {/* Active Personas */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-800">{t('profile_personalized_profiles')}</span>
              <button
                onClick={onEditPersonalization}
                className="text-brand hover:text-brand-dark flex items-center gap-0.5 text-[11px] font-medium"
              >
                <Edit3 className="w-3 h-3" />
                <span>{t('profile_edit')}</span>
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {PERSONAS.filter(p => selectedPersonas.includes(p.id)).map(p => (
                <span
                  key={p.id}
                  className="px-2.5 py-1 rounded-full text-white text-[11px] font-medium"
                  style={{ backgroundColor: p.color }}
                >
                  {isHindi ? p.labelHi : p.label}
                </span>
              ))}
            </div>
          </div>

          {/* Routine Quick View */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-800">{t('profile_daily_routine')}</span>
              <button
                onClick={onEditRoutine}
                className="text-brand hover:text-brand-dark flex items-center gap-0.5 text-[11px] font-medium"
              >
                <Clock className="w-3 h-3" />
                <span>{t('profile_manage')}</span>
              </button>
            </div>
            <div className="space-y-1.5">
              {routine.slice(0, 3).map(act => (
                <div key={act.id} className="p-2 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                  <span className="font-medium text-slate-800 truncate">{act.label}</span>
                  <span className="text-[10px] font-mono text-slate-500">{act.startTime}–{act.endTime}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Manage Saved Locations */}
          <button
            onClick={onManageLocations}
            className="w-full py-2 px-3 rounded-lg border border-slate-200 hover:bg-slate-50 flex items-center justify-between text-slate-700 transition-colors"
          >
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-brand" />
              <span>{t('profile_manage_locations')}</span>
            </div>
            <span className="text-slate-400">›</span>
          </button>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <button
            onClick={onLogout}
            className="text-rose-600 hover:text-rose-700 text-xs font-medium flex items-center gap-1"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{t('drawer_logout')}</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-brand text-white rounded text-xs font-medium hover:bg-brand-dark transition-colors"
          >
            {t('profile_close')}
          </button>
        </div>
      </div>
    </div>
  );
}
