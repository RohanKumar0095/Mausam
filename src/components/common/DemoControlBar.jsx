import React from 'react';
import { 
  Clock, 
  UserCheck, 
  AlertTriangle, 
  Smartphone, 
  RotateCcw,
  Sparkles,
  Layers
} from 'lucide-react';
import { PRESET_PROFILES } from '../../data/presetProfiles';

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
  const times = [
    { label: '06:30 Morning', value: '06:30' },
    { label: '09:00 Midday', value: '09:00' },
    { label: '16:30 Evening', value: '16:30' },
    { label: '19:00 Night', value: '19:00' },
    { label: '22:00 Late', value: '22:00' },
  ];

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-slate-200 px-3 py-2 text-xs select-none shadow-md z-40">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
        {/* Hackathon Badge */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-brand text-white font-medium text-[11px] shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-sky-200" />
            <span>SIH26076 MAUSAM DEMO BAR</span>
          </div>
        </div>

        {/* Preset Combinations */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5 max-w-xl">
          <div className="flex items-center gap-1 text-[11px] text-slate-400 mr-1 flex-shrink-0">
            <Layers className="w-3.5 h-3.5 text-sky-400" />
            <span>Preset:</span>
          </div>
          {Object.values(PRESET_PROFILES).map((prof) => (
            <button
              key={prof.id}
              onClick={() => onSelectProfile(prof.id)}
              className={`px-2 py-1 rounded text-[11px] font-medium transition-all flex-shrink-0 ${
                activeProfileId === prof.id
                  ? 'bg-sky-500 text-slate-950 font-bold shadow-xs'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {prof.shortLabel || prof.name}
            </button>
          ))}
        </div>

        {/* Time Simulator */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <div className="flex items-center gap-1 text-[11px] text-slate-400 mr-1">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>Time:</span>
          </div>
          <div className="flex items-center gap-1 bg-slate-800/80 p-0.5 rounded-md border border-slate-700">
            {times.map((t) => (
              <button
                key={t.value}
                onClick={() => onTimeChange(t.value)}
                className={`px-1.5 py-0.5 rounded text-[10.5px] font-mono transition-all ${
                  currentTime === t.value
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700'
                }`}
              >
                {t.value}
              </button>
            ))}
          </div>
        </div>

        {/* Action Toggles */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {/* Red Alert Simulator */}
          <button
            onClick={onToggleSevereAlert}
            className={`px-2.5 py-1 rounded text-[11px] font-medium flex items-center gap-1 transition-all ${
              simulatedSeverity === 'RED'
                ? 'bg-rose-600 text-white animate-pulse shadow-xs ring-2 ring-rose-400'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            <span>{simulatedSeverity === 'RED' ? 'Red Alert Active' : 'Simulate Red Alert'}</span>
          </button>

          {/* Frame Toggle */}
          <button
            onClick={onToggleFrame}
            className={`p-1.5 rounded transition-all ${
              isMobileFramed
                ? 'bg-slate-700 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
            title="Toggle Mobile / Wide Viewport"
          >
            <Smartphone className="w-3.5 h-3.5" />
          </button>

          {/* Reset Flow */}
          <button
            onClick={onResetOnboarding}
            className="p-1.5 rounded bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-all"
            title="Re-run Onboarding Questions"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
}
