import React, { useState, useEffect } from 'react';
import { ArrowLeft, ShieldCheck, ArrowRight, RotateCcw } from 'lucide-react';
import { authService } from './authService';
import { useI18n } from '../i18n/i18nContext';

export default function OTPVerification({ emailOrPhone, onVerifySuccess, onBack }) {
  const { t } = useI18n();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(30);
  const [error, setError] = useState('');
  const [resendSuccess, setResendSuccess] = useState(false);

  useEffect(() => {
    let interval = null;
    if (timer > 0) {
      interval = setInterval(() => setTimer(prev => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleChange = (val, index) => {
    if (val.length > 1) {
      val = val.slice(-1);
    }
    const nextOtp = [...otp];
    nextOtp[index] = val;
    setOtp(nextOtp);

    // Auto focus next input
    if (val && index < 5) {
      const nextInput = document.getElementById(`otp-box-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-box-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const handleVerify = (e) => {
    e.preventDefault();
    setError('');
    const fullOtp = otp.join('');

    if (fullOtp.length < 6) {
      setError(t('otp_error_digits'));
      return;
    }

    const res = authService.verifyOtp(fullOtp);
    if (res.success) {
      onVerifySuccess();
    } else {
      setError(res.error || t('otp_error_invalid'));
    }
  };

  const handleResend = () => {
    setTimer(30);
    setResendSuccess(true);
    setError('');
    setTimeout(() => setResendSuccess(false), 4000);
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
            {t('otp_title')}
          </span>
          <div className="w-4" />
        </div>

        {/* Title */}
        <div className="mb-5 text-center">
          <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto mb-2">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">{t('otp_heading')}</h2>
          <p className="text-xs text-slate-500 mt-1 font-normal">
            {t('otp_sent_to')} <strong className="font-semibold text-slate-700">{emailOrPhone || 'your contact'}</strong>.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs text-center">
            {error}
          </div>
        )}

        {resendSuccess && (
          <div className="mb-4 p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs text-center">
            {t('otp_resend_success')}
          </div>
        )}

        {/* 6 OTP boxes */}
        <form onSubmit={handleVerify} className="space-y-6 flex-1 text-xs">
          <div className="flex justify-center gap-2">
            {otp.map((digit, idx) => (
              <input
                key={idx}
                id={`otp-box-${idx}`}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                value={digit}
                onChange={e => handleChange(e.target.value, idx)}
                onKeyDown={e => handleKeyDown(e, idx)}
                className="w-11 h-12 text-center text-lg font-mono font-medium rounded-mausam border border-slate-300 bg-white focus:ring-2 focus:ring-brand focus:border-brand focus:outline-none"
              />
            ))}
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-brand hover:bg-brand-dark text-white rounded-mausam text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs transition-colors"
          >
            <span>{t('otp_verify_btn')}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        {/* Resend footer */}
        <div className="text-center text-xs text-slate-500 pt-4 border-t border-slate-200 mt-4 flex items-center justify-between">
          <span>{t('otp_didnt_receive')}</span>
          {timer > 0 ? (
            <span className="text-slate-400 font-mono text-[11px]">{t('otp_resend_in')} {timer}s</span>
          ) : (
            <button
              onClick={handleResend}
              className="text-brand font-semibold hover:underline flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" /> {t('otp_resend_btn')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
