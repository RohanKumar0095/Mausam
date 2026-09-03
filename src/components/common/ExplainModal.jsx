import React from 'react';
import { X, Sparkles, CheckCircle2, ChevronRight, Info } from 'lucide-react';
import { useI18n } from '../../i18n/i18nContext';

export default function ExplainModal({ widget, isOpen, onClose }) {
  const { language, t } = useI18n();
  const isHindi = language === 'hi';

  if (!isOpen || !widget) return null;

  const pts = widget.pointsBreakdown || {
    personaMatch: 25,
    activityContext: 20,
    timeProximity: 15,
    weatherThreshold: 10,
    locationPurpose: 5
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-brand px-4 py-3 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-sky-300" />
            <h3 className="text-sm font-medium">{t('explain_title')}</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-white/20 text-white/90">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-3.5 text-xs text-slate-700">
          <div>
            <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">
              {widget.confidenceLabel || 'IMD Model'}
            </span>
            <h4 className="text-sm font-semibold text-slate-900 mt-0.5">
              {widget.label}
            </h4>
          </div>

          <div className="p-3 bg-brand-light/50 rounded-xl border border-brand/20 flex items-center justify-between">
            <span className="font-medium text-slate-800">{t('explain_relevance_score')}</span>
            <span className="text-lg font-bold text-brand font-mono">
              {widget.score || 85} / 100
            </span>
          </div>

          <div className="space-y-2">
            <span className="font-semibold text-slate-900 block text-[11.5px]">
              {t('explain_score_breakdown')}
            </span>

            <div className="space-y-1.5 font-mono text-[11px]">
              <div className="flex justify-between p-1.5 bg-slate-50 rounded border border-slate-200">
                <span className="font-sans text-slate-600">{t('explain_persona_match')}</span>
                <span className="text-emerald-700 font-bold">+{pts.personaMatch} pts</span>
              </div>
              <div className="flex justify-between p-1.5 bg-slate-50 rounded border border-slate-200">
                <span className="font-sans text-slate-600">{t('explain_activity_context')}</span>
                <span className="text-emerald-700 font-bold">+{pts.activityContext} pts</span>
              </div>
              <div className="flex justify-between p-1.5 bg-slate-50 rounded border border-slate-200">
                <span className="font-sans text-slate-600">{t('explain_time_alignment')}</span>
                <span className="text-emerald-700 font-bold">+{pts.timeProximity} pts</span>
              </div>
              <div className="flex justify-between p-1.5 bg-slate-50 rounded border border-slate-200">
                <span className="font-sans text-slate-600">{t('explain_weather_sensitivity')}</span>
                <span className="text-emerald-700 font-bold">+{pts.weatherThreshold} pts</span>
              </div>
              <div className="flex justify-between p-1.5 bg-slate-50 rounded border border-slate-200">
                <span className="font-sans text-slate-600">{t('explain_location_purpose')}</span>
                <span className="text-emerald-700 font-bold">+{pts.locationPurpose} pts</span>
              </div>
            </div>
          </div>

          {widget.reasons && widget.reasons.length > 0 && (
            <div className="space-y-1">
              <span className="font-semibold text-slate-900 block text-[11.5px]">
                {t('explain_active_rule')}
              </span>
              <ul className="space-y-1 pl-1">
                {widget.reasons.map((r, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-slate-600 text-[11px]">
                    <span className="text-brand font-bold">•</span>
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-brand text-white rounded text-xs font-medium hover:bg-brand-dark transition-colors"
          >
            {t('explain_close')}
          </button>
        </div>
      </div>
    </div>
  );
}
