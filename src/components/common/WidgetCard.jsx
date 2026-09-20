import React from 'react';
import { 
  Footprints, 
  Car, 
  PartyPopper, 
  Sprout, 
  HeartPulse, 
  Sun, 
  CloudRain, 
  Eye, 
  Compass, 
  Info,
  Sparkles,
  Flame,
  Trophy,
  ShieldCheck,
  Droplets,
  Cloud,
  Users,
  CalendarDays,
  PlusCircle
} from 'lucide-react';
import { getPersonaForWidget } from '../../engine/personaRegistry';

const ICON_MAP = {
  Footprints,
  Car,
  PartyPopper,
  Sprout,
  HeartPulse,
  Sun,
  CloudRain,
  Eye,
  Compass,
  Flame,
  Trophy,
  ShieldCheck,
  Droplets,
  Cloud,
  Users,
  CalendarDays
};

export default function WidgetCard({ widget, onExplain, onSetupAction, showPersonaBadge = true }) {
  const {
    id,
    label,
    value,
    score,
    status,
    statusColor,
    recommendation,
    confidenceLabel,
    icon,
    isSetupPrompt,
    setupActionText
  } = widget;

  const personaConfig = getPersonaForWidget(id);
  const IconComponent = ICON_MAP[icon] || Sun;

  if (isSetupPrompt) {
    return (
      <div className="bg-slate-900/40 backdrop-blur-md rounded-mausam p-4 border border-dashed border-sky-400/40 shadow-xs flex flex-col justify-between text-white relative">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span 
              className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border"
              style={{
                color: personaConfig.color,
                borderColor: `${personaConfig.color}40`,
                backgroundColor: `${personaConfig.color}15`
              }}
            >
              {personaConfig.label} Setup
            </span>
            <PlusCircle className="w-4 h-4 text-sky-300" />
          </div>
          <h4 className="text-sm font-semibold text-white tracking-tight leading-snug">{label}</h4>
          <p className="text-[11.5px] leading-snug text-slate-300 font-normal mt-1.5">
            {recommendation}
          </p>
        </div>

        <button
          onClick={() => onSetupAction && onSetupAction(personaConfig.id)}
          className="mt-3 w-full py-1.5 px-3 rounded bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
        >
          <span>{setupActionText || `Configure ${personaConfig.label}`}</span>
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-mausam p-3.5 border border-slate-200/90 shadow-xs flex flex-col justify-between hover:border-brand/40 transition-all group relative">
      <div>
        <div className="flex items-start justify-between gap-1 mb-2">
          <div className="flex items-start gap-2 min-w-0 flex-1">
            <div className="w-6 h-6 rounded-md bg-brand-light flex items-center justify-center text-brand flex-shrink-0 mt-0.5">
              <IconComponent className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0 flex-1">
              {showPersonaBadge && personaConfig && personaConfig.id !== 'daily_life' && (
                <span 
                  className="inline-block text-[9px] font-bold uppercase tracking-wider mb-0.5 font-mono px-1.5 py-0.2 rounded border"
                  style={{ 
                    color: personaConfig.color,
                    borderColor: `${personaConfig.color}30`,
                    backgroundColor: `${personaConfig.color}10`
                  }}
                >
                  {personaConfig.label}
                </span>
              )}
              <h4 className="text-[12px] font-semibold text-slate-800 tracking-tight leading-tight block">
                {label}
              </h4>
            </div>
          </div>

          <button
            onClick={() => onExplain && onExplain(widget)}
            className="p-1 text-slate-400 hover:text-brand hover:bg-slate-100 rounded-full transition-colors flex-shrink-0 -mt-0.5"
            title="Why am I seeing this?"
            aria-label="Why am I seeing this?"
          >
            <Info className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex items-center justify-between gap-2 my-2">
          <span className="text-[18px] font-bold text-slate-900 tracking-tight leading-none">
            {value}
          </span>
          {status && (
            <span
              className="text-[10px] font-semibold px-2 py-0.5 rounded-full border border-current/20 flex-shrink-0 max-w-[130px] truncate text-center"
              style={{
                color: statusColor || '#1F5C8B',
                backgroundColor: `${statusColor || '#1F5C8B'}15`
              }}
            >
              {status}
            </span>
          )}
        </div>

        {recommendation && (
          <p className="text-[11.5px] leading-snug text-slate-600 font-normal pt-2 border-t border-slate-100">
            {recommendation}
          </p>
        )}
      </div>

      <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium mt-2.5 pt-1.5 border-t border-slate-100/70">
        <span className="truncate">{confidenceLabel || 'Verified Weather Model'}</span>
        <div className="flex items-center gap-1 text-slate-400">
          <Sparkles className="w-2.5 h-2.5 text-slate-400" />
          <span>Active Intelligence</span>
        </div>
      </div>
    </div>
  );
}


