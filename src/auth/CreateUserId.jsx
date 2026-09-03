import React, { useState } from 'react';
import { ArrowLeft, User, Check, Sparkles, ArrowRight } from 'lucide-react';
import { authService } from './authService';
import { useI18n } from '../i18n/i18nContext';

export default function CreateUserId({ onUserIdCreated, onBack }) {
  const { t } = useI18n();
  const [userId, setUserId] = useState('rohan_weather');
  const [error, setError] = useState('');

  const cleanUserId = userId.trim().toLowerCase();
  const isValidFormat = /^[a-z0-9_]{4,20}$/.test(cleanUserId);
  const isAvailable = isValidFormat && cleanUserId !== 'admin' && cleanUserId !== 'root';

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isValidFormat) {
      setError('User ID must be 4–20 characters (letters, numbers, _).');
      return;
    }

    authService.saveUserId(cleanUserId);
    onUserIdCreated(cleanUserId);
  };

  return (
    <div className="min-h-screen bg-[#F4F8FB] flex flex-col justify-between p-4 sm:p-6 text-slate-800">
      <div className="max-w-md mx-auto w-full flex-1 flex flex-col">
        {/* Top Navigation */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={onBack}
            className="p-1.5 -ml-1.5 rounded-full text-slate-500 hover:text-slate-800 hover:bg-slate-200/60"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <span className="text-[11px] font-mono text-slate-400 uppercase tracking-widest">
            {t('userid_step')}
          </span>
          <div className="w-4" />
        </div>

        {/* Title */}
        <div className="mb-5">
          <h2 className="text-lg font-bold text-slate-900">{t('userid_title')}</h2>
          <p className="text-xs text-slate-500 mt-0.5 font-normal">
            {t('userid_subtitle')}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 flex-1 text-xs">
          <div>
            <label className="block text-slate-700 font-medium mb-1 text-[11.5px]">
              {t('userid_label')}
            </label>
            <div className="relative">
              <input
                type="text"
                value={userId}
                onChange={e => {
                  setUserId(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''));
                  setError('');
                }}
                placeholder={t('userid_placeholder')}
                className="w-full pl-9 pr-8 py-2 bg-white border border-slate-300 rounded-mausam text-xs font-mono focus:ring-1 focus:ring-brand focus:border-brand focus:outline-none"
              />
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              {isAvailable && (
                <Check className="w-4 h-4 text-emerald-600 absolute right-3 top-2.5 stroke-[2.5]" />
              )}
            </div>

            {/* Validation helper status */}
            <div className="mt-2 text-[11px] flex items-center justify-between">
              <span className="text-slate-400 font-mono">{t('userid_rules')}</span>
              {cleanUserId.length >= 4 && (
                <span className={isAvailable ? 'text-emerald-700 font-medium' : 'text-rose-600'}>
                  {isAvailable ? t('userid_available') : t('userid_unavailable')}
                </span>
              )}
            </div>
          </div>

          <div className="p-3 bg-brand-light/60 rounded-mausam border border-brand/20 text-brand text-xs space-y-1">
            <span className="font-semibold flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> {t('userid_what_next_title')}
            </span>
            <p className="text-[11px] text-slate-600 leading-snug">
              {t('userid_what_next_desc')}
            </p>
          </div>

          <button
            type="submit"
            disabled={!isAvailable}
            className="w-full py-2.5 mt-4 bg-brand hover:bg-brand-dark disabled:opacity-50 text-white rounded-mausam text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs transition-colors"
          >
            <span>{t('userid_continue')}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
