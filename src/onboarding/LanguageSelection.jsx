import React from 'react';
import { Globe, Check, ArrowRight, ArrowLeft } from 'lucide-react';
import { useI18n } from '../i18n/i18nContext';

const LANGUAGES = [
  { code: 'en', label: 'English', native: 'English', active: true },
  { code: 'hi', label: 'Hindi', native: 'हिन्दी', active: true },
  { code: 'bn', label: 'Bengali', native: 'বাংলা', active: false },
  { code: 'te', label: 'Telugu', native: 'తెలుగు', active: false },
  { code: 'mr', label: 'Marathi', native: 'मराठी', active: false },
  { code: 'ta', label: 'Tamil', native: 'தமிழ்', active: false },
  { code: 'gu', label: 'Gujarati', native: 'ગુજરાતી', active: false }
];

export default function LanguageSelection({ onContinue, onBack }) {
  const { language, setLanguage, t } = useI18n();

  return (
    <div className="min-h-screen bg-[#F4F8FB] flex flex-col justify-between p-4 sm:p-6 text-slate-800">
      <div className="max-w-md mx-auto w-full flex-1 flex flex-col">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={onBack}
            className="p-1.5 -ml-1.5 rounded-full text-slate-500 hover:text-slate-800 hover:bg-slate-200/60"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <span className="text-[11px] font-mono text-slate-400 uppercase tracking-widest">
            {t('lang_setup_title')}
          </span>
          <div className="w-4" />
        </div>

        {/* Title */}
        <div className="mb-4 text-center">
          <div className="w-10 h-10 rounded-full bg-brand-light text-brand flex items-center justify-center mx-auto mb-2">
            <Globe className="w-5 h-5" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">{t('lang_choose_title')}</h2>
          <p className="text-xs text-slate-500 mt-1 font-normal">
            {t('lang_choose_subtitle')}
          </p>
        </div>

        {/* Language Grid */}
        <div className="grid grid-cols-1 gap-2 flex-1 overflow-y-auto max-h-[58vh] pr-1 py-1">
          {LANGUAGES.map(lang => {
            const isSelected = language === lang.code;

            return (
              <button
                key={lang.code}
                onClick={() => {
                  if (lang.active) {
                    setLanguage(lang.code);
                  }
                }}
                disabled={!lang.active}
                className={`p-3 rounded-mausam border text-left flex items-center justify-between transition-all ${
                  isSelected
                    ? 'bg-brand text-white border-brand shadow-xs'
                    : lang.active
                      ? 'bg-white text-slate-800 border-slate-200/80 hover:bg-slate-50'
                      : 'bg-slate-100/60 border-slate-200 text-slate-400 opacity-60 cursor-not-allowed'
                }`}
              >
                <div>
                  <span className="text-xs font-semibold block">{lang.native}</span>
                  <span className={`text-[11px] ${isSelected ? 'text-sky-100' : 'text-slate-400'}`}>
                    {lang.label} {!lang.active && '• Coming Soon'}
                  </span>
                </div>
                {isSelected ? (
                  <Check className="w-4 h-4 text-white stroke-[2.5]" />
                ) : (
                  <div className="w-4 h-4 rounded-full border border-slate-300" />
                )}
              </button>
            );
          })}
        </div>

        {/* Footer Continue */}
        <div className="pt-4 border-t border-slate-200 mt-4 flex items-center justify-between">
          <button
            onClick={onBack}
            className="px-3 py-2 text-slate-600 hover:text-slate-800 text-xs font-medium"
          >
            {t('q_back')}
          </button>
          <button
            onClick={onContinue}
            className="px-5 py-2.5 bg-brand hover:bg-brand-dark text-white rounded-mausam text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <span>{t('lang_continue')}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
