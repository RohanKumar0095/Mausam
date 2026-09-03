import React from 'react';
import { Sparkles, Check, ArrowRight, ShieldCheck } from 'lucide-react';
import { PERSONAS } from '../data/personaDefinitions';

export default function PersonalizationComplete({ derivedPersonas = [], routine = [], onOpenMausam }) {
  const personaCards = PERSONAS.filter(p => derivedPersonas.includes(p.id));

  return (
    <div className="min-h-screen bg-[#F4F8FB] flex flex-col justify-between p-4 sm:p-6 text-slate-800">
      <div className="max-w-md mx-auto w-full flex-1 flex flex-col justify-between">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] font-mono text-emerald-700 font-medium uppercase tracking-widest flex items-center gap-1">
            <Check className="w-3.5 h-3.5" /> PROFILE READY
          </span>
          <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-medium">
            Rule Model Synced
          </span>
        </div>

        <div className="space-y-3.5 my-auto py-2">
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto mb-2 shadow-xs">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <h1 className="text-lg font-medium text-slate-900">
              Your MAUSAM is ready
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Personalization engine configured with your schedule.
            </p>
          </div>

          <div className="bg-white p-3.5 rounded-mausam border border-slate-200 shadow-2xs space-y-2">
            <span className="text-[11px] font-medium text-slate-600 uppercase tracking-wider block">
              Derived Weather Personas ({personaCards.length})
            </span>
            <div className="flex flex-wrap gap-1.5">
              {personaCards.map(p => (
                <span
                  key={p.id}
                  className="px-2.5 py-1 rounded-full text-xs font-medium text-white shadow-2xs"
                  style={{ backgroundColor: p.color }}
                >
                  {p.label}
                </span>
              ))}
            </div>
          </div>

          <div className="bg-white p-3.5 rounded-mausam border border-slate-200 shadow-2xs space-y-2">
            <span className="text-[11px] font-medium text-slate-600 uppercase tracking-wider block">
              Active Routine Schedule ({routine.length} slots)
            </span>
            <div className="space-y-1 text-xs text-slate-700">
              {routine.slice(0, 3).map(act => (
                <div key={act.id} className="flex items-center justify-between text-[11.5px]">
                  <span className="font-medium truncate">{act.label}</span>
                  <span className="font-mono text-slate-500 text-[10px]">{act.startTime}–{act.endTime}</span>
                </div>
              ))}
              {routine.length > 3 && (
                <span className="text-[10px] text-slate-400 block pt-0.5 font-mono">
                  + {routine.length - 3} more schedule slots configured
                </span>
              )}
            </div>
          </div>

          <div className="bg-brand-light/70 p-3 rounded-mausam border border-brand/20 text-xs text-brand space-y-1">
            <span className="font-medium flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Context Priority Features:
            </span>
            <p className="text-[11px] text-slate-600 leading-snug">
              Rain timing during transit • UV protection for morning runs • Safety override alerts for severe weather.
            </p>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-200 mt-4">
          <button
            onClick={onOpenMausam}
            className="w-full py-2.5 bg-brand hover:bg-brand-dark text-white rounded-mausam text-xs font-medium flex items-center justify-center gap-2 shadow-xs transition-colors"
          >
            <span>Open My MAUSAM</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
