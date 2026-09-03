import React, { useState } from 'react';
import { ArrowLeft, Lock, Mail, Phone, CheckCircle2, ShieldCheck, ArrowRight } from 'lucide-react';
import { authService } from './authService';
import { useI18n } from '../i18n/i18nContext';

export default function Signup({ onSendOtp, onNavigateLogin, onBack }) {
  const { t } = useI18n();
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!emailOrPhone.trim()) {
      setError(t('signup_error_required'));
      return;
    }

    const isEmail = emailOrPhone.includes('@');
    const isPhone = /^[0-9+ ]{10,14}$/.test(emailOrPhone.trim());

    if (!isEmail && !isPhone) {
      setError(t('signup_error_invalid_contact'));
      return;
    }

    if (password.length < 8) {
      setError(t('signup_error_password_len'));
      return;
    }

    if (password !== confirmPassword) {
      setError(t('signup_error_password_match'));
      return;
    }

    if (!agreeTerms) {
      setError(t('signup_error_terms'));
      return;
    }

    // Save temporary signup session
    authService.signup({ emailOrPhone: emailOrPhone.trim(), password });
    onSendOtp(emailOrPhone.trim());
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
            {t('signup_step')}
          </span>
          <div className="w-4" />
        </div>

        {/* Header */}
        <div className="mb-5">
          <h2 className="text-lg font-bold text-slate-900">{t('signup_title')}</h2>
          <p className="text-xs text-slate-500 mt-0.5 font-normal">
            {t('signup_subtitle')}
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5 flex-1 text-xs">
          <div>
            <label className="block text-slate-700 font-medium mb-1 text-[11.5px]">
              {t('signup_email_phone_label')}
            </label>
            <div className="relative">
              <input
                type="text"
                value={emailOrPhone}
                onChange={e => setEmailOrPhone(e.target.value)}
                placeholder={t('signup_email_phone_placeholder')}
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-mausam text-xs focus:ring-1 focus:ring-brand focus:border-brand focus:outline-none"
              />
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-medium mb-1 text-[11.5px]">
              {t('signup_password_label')}
            </label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder={t('signup_password_placeholder')}
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-mausam text-xs focus:ring-1 focus:ring-brand focus:border-brand focus:outline-none font-mono"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-medium mb-1 text-[11.5px]">
              {t('signup_confirm_password_label')}
            </label>
            <div className="relative">
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder={t('signup_confirm_password_placeholder')}
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-mausam text-xs focus:ring-1 focus:ring-brand focus:border-brand focus:outline-none font-mono"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>
          </div>

          {/* Terms & Conditions checkbox */}
          <div className="pt-1">
            <label className="flex items-start gap-2 text-[11px] text-slate-600 cursor-pointer">
              <input
                type="checkbox"
                checked={agreeTerms}
                onChange={e => setAgreeTerms(e.target.checked)}
                className="mt-0.5 rounded border-slate-300 text-brand focus:ring-brand accent-brand"
              />
              <span>
                {t('signup_terms_agree')}{' '}
                <span className="text-brand font-medium underline">{t('signup_terms_link')}</span>{' '}
                {t('signup_and')}{' '}
                <span className="text-brand font-medium underline">{t('signup_privacy_link')}</span>{' '}
                {t('signup_terms_org')}
              </span>
            </label>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 mt-4 bg-brand hover:bg-brand-dark text-white rounded-mausam text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs transition-colors"
          >
            <span>{t('signup_send_otp')}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        {/* Existing Account Footer */}
        <div className="text-center text-xs text-slate-500 pt-4 border-t border-slate-200 mt-4">
          <span>{t('signup_already_have_account')} </span>
          <button
            onClick={onNavigateLogin}
            className="text-brand font-semibold hover:underline"
          >
            {t('welcome_login')}
          </button>
        </div>
      </div>
    </div>
  );
}
