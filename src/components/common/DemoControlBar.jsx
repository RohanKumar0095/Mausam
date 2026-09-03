import React from 'react';
import { Clock, ShieldAlert, Smartphone, Monitor, RotateCcw, Globe } from 'lucide-react';
import { PRESET_PROFILES } from '../../data/presetProfiles';
import { useI18n } from '../../i18n/i18nContext';

export default function DemoControlBar({
  currentTime,
  onTimeChange,
  activeProfileId,
  onSelectProfile,
  simulatedSeverity,
  onToggleSevereAlert,
  isMobileFramed,
  onToggleFrame,
  onResetOnboarding
}) {
  const { language, setLanguage, t } = useI18n();
  const isHindi = language === 'hi';

  const TIME_OPTIONS = [
    { label: '06:30', val: '06:30' },
    { label: '09:00', val: '09:00' },
    { label: '16:30', val: '16:30' },
    { label: '19:00', val: '19:00' },
    { label: '22:00', val: '22:00' }
  ];

  return (
    <div className="w-full bg-slate-900 text-white px-3 py-2 border-b border-slate-800 text-xs flex flex-wrap items-center justify-between gap-2 shadow-md">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="bg-sky-500 text-slate-950 font-bold px-2 py-0.5 rounded text-[10px] tracking-wider uppercase">
          {t('demo_badge')}
        </span>

        {/* Language Quick Switcher */}
        <div className="flex items-center gap-1 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
          <Globe className="w-3 h-3 text-sky-400" />
          <button
            onClick={() => setLanguage('en')}
            className={`px-1.5 py-0.2 rounded text-[10px] ${!isHindi ? 'bg-brand text-white font-bold' : 'text-slate-400'}`}
          >
            EN
          </button>
          <button
            onClick={() => setLanguage('hi')}
            className={`px-1.5 py-0.2 rounded text-[10px] ${isHindi ? 'bg-brand text-white font-bold' : 'text-slate-400'}`}
          >
            हिन्दी
          </button>
        </div>

        {/* Preset Select Dropdown */}
        <div className="flex items-center gap-1">
          <span className="text-slate-400 text-[11px]">{t('demo_preset')}</span>
          <select
            value={activeProfileId}
            onChange={(e) => onSelectProfile(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-sky-300 text-xs rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-sky-400"
          >
            {Object.keys(PRESET_PROFILES).map(k => (
              <option key={k} value={k}>{PRESET_PROFILES[k].name}</option>
            ))}
          </select>
        </div>

        {/* Time Fast-Travel Buttons */}
        <div className="flex items-center gap-1 bg-slate-800/80 p-0.5 rounded border border-slate-700">
          <Clock className="w-3 h-3 text-sky-400 ml-1" />
          {TIME_OPTIONS.map(to => (
            <button
              key={to.val}
              onClick={() => onTimeChange(to.val)}
              className={`px-1.5 py-0.5 rounded text-[11px] font-mono transition-colors ${
                currentTime === to.val
                  ? 'bg-sky-500 text-slate-950 font-bold'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              {to.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {/* Simulate Red Alert Button */}
        <button
          onClick={onToggleSevereAlert}
          className={`flex items-center gap-1 px-2.5 py-1 rounded font-medium text-xs transition-all ${
            simulatedSeverity === 'RED'
              ? 'bg-rose-600 text-white animate-pulse shadow-sm'
              : 'bg-rose-950/80 border border-rose-800 text-rose-300 hover:bg-rose-900'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>{simulatedSeverity === 'RED' ? t('demo_red_alert_active') : t('demo_simulate_red_alert')}</span>
        </button>

        {/* Toggle Mobile Frame */}
        <button
          onClick={onToggleFrame}
          className="hidden sm:flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded border border-slate-700 text-xs transition-colors"
          title="Toggle Mobile Viewport"
        >
          {isMobileFramed ? <Monitor className="w-3.5 h-3.5" /> : <Smartphone className="w-3.5 h-3.5" />}
          <span>{isMobileFramed ? 'Full View' : 'Mobile Frame'}</span>
        </button>

        {/* Reset Onboarding Button */}
        <button
          onClick={onResetOnboarding}
          className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-sky-300 px-2 py-1 rounded border border-slate-700 text-xs transition-colors"
          title="Restart Onboarding"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Onboarding</span>
        </button>
      </div>
    </div>
  );
}
