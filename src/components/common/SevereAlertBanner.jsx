import React from 'react';
import { AlertOctagon, AlertTriangle, ShieldCheck, ChevronRight } from 'lucide-react';

export default function SevereAlertBanner({ safetyInfo, onOpenAlerts }) {
  if (!safetyInfo) return null;

  const { level, isSevere, isCaution, isSafe, headline, description, impactAdvice, validUntil } = safetyInfo;

  let bgClasses = 'bg-emerald-50 text-emerald-950 border-emerald-300';
  let badgeClasses = 'bg-severity-safe text-white';
  let Icon = ShieldCheck;

  if (isSevere) {
    bgClasses = 'bg-[#FCEBEB] text-[#791F1F] border-rose-400/80 shadow-md ring-2 ring-rose-500/20';
    badgeClasses = 'bg-severity-severe text-white';
    Icon = AlertOctagon;
  } else if (isCaution) {
    bgClasses = 'bg-[#FAEEDA] text-[#854F0B] border-amber-300 shadow-sm';
    badgeClasses = 'bg-severity-caution text-white';
    Icon = AlertTriangle;
  }

  if (isSafe) {
    return (
      <div className="px-4 py-2">
        <button
          onClick={onOpenAlerts}
          className="w-full bg-[#1D9E75]/90 hover:bg-[#1D9E75] text-white py-2.5 px-4 rounded-mausam text-center font-medium text-[13px] tracking-wide shadow-sm flex items-center justify-center gap-2 transition-colors border border-emerald-400/30"
        >
          <ShieldCheck className="w-4 h-4 text-emerald-200" />
          <span>NO WARNING (NO ACTION)</span>
        </button>
      </div>
    );
  }

  return (
    <div className="px-4 py-2 animate-pulse-slow">
      <div className={`rounded-mausam p-3.5 border ${bgClasses} transition-all`}>
        <div className="flex items-start gap-2.5">
          <div className="p-1.5 rounded-full bg-white/80 shadow-xs flex-shrink-0 mt-0.5">
            <Icon className="w-5 h-5" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-1 mb-1">
              <span className={`text-[10px] uppercase tracking-wider font-medium px-1.5 py-0.5 rounded ${badgeClasses}`}>
                IMD OFFICIAL WARNING • {level}
              </span>
              <span className="text-[10px] opacity-75 font-mono">Until {validUntil}</span>
            </div>

            <h4 className="text-[13px] font-medium leading-tight mb-1">
              {headline}
            </h4>

            <p className="text-[12px] opacity-90 leading-snug mb-2 font-normal">
              {description}
            </p>

            {impactAdvice && (
              <div className="p-2 rounded bg-white/70 border border-current/15 text-[11.5px] font-normal leading-snug">
                <strong className="font-medium">Personalized Impact: </strong>
                {impactAdvice}
              </div>
            )}

            <button
              onClick={onOpenAlerts}
              className="inline-flex items-center gap-1 text-[11px] font-medium underline underline-offset-2 mt-2 hover:opacity-80"
            >
              <span>View District Bulletins & Radar Nowcast</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
