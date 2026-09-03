import React from 'react';
import { Sparkles, ArrowRight, ShieldCheck, PlayCircle, LogIn, UserPlus, Globe } from 'lucide-react';
import { useI18n } from '../i18n/i18nContext';

export default function WelcomeScreen({ onGetStarted, onLogin, onTryDemo }) {
  const { language, setLanguage, t } = useI18n();
  const isHindi = language === 'hi';

  return (
    <div className="min-h-screen bg-[#F4F8FB] flex flex-col justify-between p-4 sm:p-6 text-slate-800">
      {/* Top Government IMD Badge & Language Switcher */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-full bg-brand flex items-center justify-center text-white font-medium text-xs shadow-xs border border-white/20">
            IMD
          </div>
          <div>
            <h4 className="text-[12px] font-medium text-brand tracking-tight">
              {t('imd_title')}
            </h4>
            <p className="text-[10px] text-slate-500">{t('imd_subtitle')}</p>
          </div>
        </div>

        <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-full border border-slate-200 shadow-2xs text-xs">
          <button
            onClick={() => setLanguage('en')}
            className={`px-2 py-0.5 rounded-full transition-all text-[11px] font-medium ${
              !isHindi ? 'bg-brand text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            EN
          </button>
          <button
            onClick={() => setLanguage('hi')}
            className={`px-2 py-0.5 rounded-full transition-all text-[11px] font-medium ${
              isHindi ? 'bg-brand text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            हिन्दी
          </button>
        </div>
      </div>

      {/* Main Hero Card */}
      <div className="max-w-sm mx-auto w-full text-center my-auto py-6">
        {/* Animated Brand Emblem */}
        <div className="relative w-20 h-20 mx-auto mb-4">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-brand-dark to-brand flex items-center justify-center text-white shadow-lg transform -rotate-3 hover:rotate-0 transition-transform">
            <Sparkles className="w-10 h-10 text-sky-300 animate-pulse" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-medium border-2 border-white shadow-xs">
            ✓
          </div>
        </div>

        <h1 className="text-2xl font-bold text-brand-dark tracking-tight">
          {t('app_title')}
        </h1>
        <h2 className="text-[15px] font-semibold text-slate-700 mt-1">
          {t('welcome_headline')}
        </h2>

        <p className="text-xs text-slate-500 mt-2.5 leading-relaxed max-w-xs mx-auto font-normal">
          {t('welcome_subheadline')}
        </p>

        {/* Action Buttons */}
        <div className="space-y-2.5 mt-8 max-w-xs mx-auto">
          <button
            onClick={onGetStarted}
            className="w-full py-2.5 px-4 bg-brand hover:bg-brand-dark text-white rounded-mausam text-xs font-semibold flex items-center justify-center gap-2 shadow-xs active:scale-98 transition-all"
          >
            <UserPlus className="w-4 h-4" />
            <span>{t('welcome_create_account')}</span>
            <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
          </button>

          <button
            onClick={onLogin}
            className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300/80 rounded-mausam text-xs font-semibold flex items-center justify-center gap-2 shadow-2xs active:scale-98 transition-all"
          >
            <LogIn className="w-4 h-4 text-brand" />
            <span>{t('welcome_login')}</span>
          </button>

          {/* Judge Demo Quick Bypass */}
          <button
            onClick={onTryDemo}
            className="w-full py-2 px-3 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-mausam text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
          >
            <PlayCircle className="w-3.5 h-3.5 text-amber-700" />
            <span>{t('welcome_try_demo')}</span>
          </button>
        </div>
      </div>

      {/* Footer Notice */}
      <div className="text-center text-[11px] text-slate-400 font-normal pt-2 border-t border-slate-200/60 max-w-sm mx-auto">
        <div className="flex items-center justify-center gap-1 text-slate-500 mb-0.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span className="font-medium">{t('official_weather_info')}</span>
        </div>
        <p>{t('official_weather_desc')}</p>
      </div>
    </div>
  );
}
