import React from 'react';
import { 
  X, 
  ShieldAlert, 
  AlertTriangle, 
  Clock, 
  MapPin, 
  Sparkles, 
  CheckCircle2, 
  Info,
  Calendar,
  ArrowRight,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { useI18n } from '../../i18n/i18nContext';

export default function AlertDetailModal({ alert = null, isOpen = false, onClose, onEditRoutine }) {
  const { language } = useI18n();
  const isHindi = language === 'hi' || language === 'Hindi';

  if (!isOpen || !alert) return null;

  const isCritical = alert.severity === 'CRITICAL';
  const isHigh = alert.severity === 'HIGH';

  let severityBadgeClass = 'bg-amber-500/20 text-amber-300 border-amber-400/40';
  let Icon = AlertTriangle;

  if (isCritical) {
    severityBadgeClass = 'bg-rose-500/20 text-rose-300 border-rose-400/40';
    Icon = ShieldAlert;
  } else if (alert.status === 'RESOLVED') {
    severityBadgeClass = 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40';
    Icon = ShieldCheck;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#0B132B] text-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-700/60 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl border ${isCritical ? 'bg-rose-500/20 border-rose-400/40 text-rose-300' : 'bg-amber-500/20 border-amber-400/40 text-amber-300'}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <span className={`px-2 py-0.5 rounded text-[9.5px] font-mono font-bold uppercase tracking-wider border ${severityBadgeClass}`}>
                {alert.severity} • {alert.type?.replace('_', ' ')}
              </span>
              <h3 className="text-base font-bold text-white leading-tight mt-1">
                {alert.title}
              </h3>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1 text-xs">

          {/* Activity & Location Metadata */}
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between text-slate-300 flex-wrap gap-2">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              <span className="font-semibold text-white">{alert.location?.name || 'Selected Location'}</span>
            </div>

            {alert.activity && (
              <div className="flex items-center gap-1.5 text-amber-300 font-mono">
                <Clock className="w-3.5 h-3.5" />
                <span>{alert.activity.name} ({alert.activity.formattedTimeRange})</span>
              </div>
            )}
          </div>

          {/* Why This Matters */}
          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1.5">
            <span className="text-[11px] font-bold text-sky-300 uppercase tracking-wider block flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5" />
              <span>Why This Matters</span>
            </span>
            <p className="text-[12px] text-slate-200 leading-relaxed">
              {alert.why || alert.summary}
            </p>
          </div>

          {/* Triggering Weather Factors */}
          {alert.triggeredFactors && alert.triggeredFactors.length > 0 && (
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Triggered Weather Risk Factors
              </span>
              <div className="grid grid-cols-1 gap-2">
                {alert.triggeredFactors.map((tf, idx) => (
                  <div key={idx} className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80 flex items-start gap-2 text-xs">
                    <CheckCircle2 className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-white font-mono block">{tf.factor} {tf.forecastValue ? `(${tf.forecastValue})` : ''}</strong>
                      <span className="text-[11px] text-slate-300 leading-snug block mt-0.5">{tf.explanation}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Hourly Weather Timeline */}
          {alert.hourlyData && alert.hourlyData.length > 0 && (
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Weather Window Hourly Breakdown
              </span>
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-slate-700">
                {alert.hourlyData.map((slot, idx) => {
                  const popVal = slot.pop ? (slot.pop > 1 ? slot.pop : slot.pop * 100) : 20;
                  return (
                    <div key={idx} className="flex-shrink-0 w-20 p-2 rounded-xl bg-slate-900 border border-slate-800 text-center">
                      <span className="text-[10px] text-slate-400 block font-mono">
                        {slot.time || (slot.dt_txt ? slot.dt_txt.split(' ')[1].slice(0, 5) : '12:00')}
                      </span>
                      <span className="text-xs font-bold text-white block my-1 font-mono">
                        {slot.temp != null ? `${Math.round(slot.temp)}°C` : '--'}
                      </span>
                      <span className="text-[10px] text-sky-300 font-mono block">
                        🌧 {Math.round(popVal)}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Actionable Alternative Window */}
          {alert.recommendation && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 space-y-2">
              <div className="flex items-center gap-1.5 text-emerald-400 font-semibold text-xs">
                <Sparkles className="w-4 h-4" />
                <span>Suggested Action / Safer Window</span>
              </div>
              <p className="text-[11.5px] text-emerald-200 leading-relaxed">
                {alert.recommendation.advice}
              </p>
              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] font-mono text-emerald-300">
                  Recommended Time: <strong>{alert.recommendation.suggestedWindow}</strong>
                </span>
                {onEditRoutine && (
                  <button
                    onClick={() => {
                      onClose();
                      onEditRoutine();
                    }}
                    className="px-2.5 py-1 rounded bg-emerald-500 text-slate-950 font-bold text-[10.5px] hover:bg-emerald-400 transition-colors flex items-center gap-1"
                  >
                    <span>Reschedule Routine</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 bg-slate-900/90 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold rounded-xl text-xs transition-colors shadow-sm"
          >
            Close Alert
          </button>
        </div>

      </div>
    </div>
  );
}
