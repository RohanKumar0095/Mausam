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
  Users
} from 'lucide-react';

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
  Users
};

export default function WidgetCard({ widget, onExplain }) {
  const {
    id,
    label,
    value,
    score,
    status,
    statusColor,
    recommendation,
    confidenceLabel,
    icon
  } = widget;

  const IconComponent = ICON_MAP[icon] || Sun;

  return (
    <div className="bg-white rounded-mausam p-3.5 border border-slate-200/90 shadow-xs flex flex-col justify-between hover:border-brand/40 transition-all group relative">
      <div>
        <div className="flex items-start justify-between gap-1 mb-1.5">
          <div className="flex items-center gap-1.5 min-w-0">
            <div className="w-6 h-6 rounded-md bg-brand-light flex items-center justify-center text-brand flex-shrink-0">
              <IconComponent className="w-3.5 h-3.5" />
            </div>
            <span className="text-[11.5px] font-medium text-slate-700 tracking-tight truncate">
              {label}
            </span>
          </div>

          <button
            onClick={() => onExplain && onExplain(widget)}
            className="p-1 -mr-1 text-slate-400 hover:text-brand hover:bg-slate-100 rounded-full transition-colors flex items-center gap-0.5"
            title="Why am I seeing this?"
            aria-label="Why am I seeing this?"
          >
            <Info className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex items-baseline justify-between gap-2 mt-1.5">
          <span className="text-[19px] font-medium text-slate-900 tracking-tight leading-tight">
            {value}
          </span>
          <span
            className="text-[10px] font-medium px-2 py-0.5 rounded-full border border-current/20 flex-shrink-0"
            style={{
              color: statusColor || '#1F5C8B',
              backgroundColor: `${statusColor || '#1F5C8B'}15`
            }}
          >
            {status}
          </span>
        </div>

        {recommendation && (
          <p className="text-[11.5px] leading-snug text-slate-600 font-normal mt-2 pt-2 border-t border-slate-100">
            {recommendation}
          </p>
        )}
      </div>

      <div className="flex items-center justify-between text-[10px] text-slate-400 font-normal mt-2.5 pt-1 border-t border-slate-50">
        <span className="truncate">{confidenceLabel || 'Verified IMD Model'}</span>
        <span className="flex items-center gap-1 font-medium text-brand">
          <Sparkles className="w-2.5 h-2.5 text-brand" />
          {score}% Match
        </span>
      </div>
    </div>
  );
}
