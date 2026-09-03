import React from 'react';
import { X, Sparkles, CheckCircle2 } from 'lucide-react';

export default function ExplainModal({ widget, isOpen, onClose }) {
  if (!isOpen || !widget) return null;

  const { label, score, breakdown = {}, recommendation } = widget;
  const { personaPoints = 0, activityPoints = 0, timePoints = 0, weatherPoints = 0, locationPoints = 0, reasons = [] } = breakdown;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white w-full max-w-sm rounded-mausam shadow-2xl border border-slate-200 overflow-hidden">
        <div className="bg-brand px-4 py-3 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-sky-300" />
            <h3 className="text-sm font-medium">Why Am I Seeing This?</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-white/20 text-white/90"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 text-slate-800 space-y-3.5 text-xs">
          <div>
            <div className="flex items-center justify-between mb-0.5">
              <span className="font-medium text-sm text-slate-900">{label}</span>
              <span className="px-2 py-0.5 rounded-full bg-brand-light text-brand font-medium text-[11px]">
                {score}% Relevance
              </span>
            </div>
            <p className="text-slate-500 text-[11px]">
              Ranked dynamically by the MAUSAM Context Engine based on your active routine.
            </p>
          </div>

          <div className="space-y-1.5 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
            <span className="font-medium text-slate-700 text-[10.5px] uppercase tracking-wider block mb-1">
              Relevance Weight Breakdown
            </span>

            <div className="grid grid-cols-2 gap-1.5 text-[11px]">
              <div className="p-1.5 bg-white rounded border border-slate-200">
                <span className="text-slate-500 block text-[10px]">Persona Match</span>
                <span className="font-medium text-brand">+{personaPoints} pts</span>
              </div>
              <div className="p-1.5 bg-white rounded border border-slate-200">
                <span className="text-slate-500 block text-[10px]">Activity Overlap</span>
                <span className="font-medium text-brand">+{activityPoints} pts</span>
              </div>
              <div className="p-1.5 bg-white rounded border border-slate-200">
                <span className="text-slate-500 block text-[10px]">Time Alignment</span>
                <span className="font-medium text-brand">+{timePoints} pts</span>
              </div>
              <div className="p-1.5 bg-white rounded border border-slate-200">
                <span className="text-slate-500 block text-[10px]">Weather Impact</span>
                <span className="font-medium text-brand">+{weatherPoints} pts</span>
              </div>
            </div>
          </div>

          <div>
            <span className="font-medium text-slate-700 text-[10.5px] uppercase tracking-wider block mb-1.5">
              Active Decision Factors
            </span>
            <ul className="space-y-1.5">
              {reasons.map((reason, idx) => (
                <li key={idx} className="flex items-start gap-2 text-slate-700 leading-snug">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          </div>

          {recommendation && (
            <div className="p-2.5 rounded bg-sky-50 border border-sky-100 text-sky-900 leading-snug">
              <strong className="font-medium">Actionable Guidance: </strong>
              {recommendation}
            </div>
          )}
        </div>

        <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-brand text-white rounded text-xs font-medium hover:bg-brand-dark transition-colors"
          >
            Understood
          </button>
        </div>
      </div>
    </div>
  );
}
