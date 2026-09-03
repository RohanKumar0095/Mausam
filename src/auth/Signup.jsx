import React, { useState } from 'react';
import { ArrowLeft, Lock, Mail, Phone, CheckCircle2, ShieldCheck, ArrowRight } from 'lucide-react';
import { authService } from './authService';

export default function Signup({ onSendOtp, onNavigateLogin, onBack }) {
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!emailOrPhone.trim()) {
      setError('Please enter your email or mobile number.');
      return;
    }

    const isEmail = emailOrPhone.includes('@');
    const isPhone = /^[0-9+ ]{10,14}$/.test(emailOrPhone.trim());

    if (!isEmail && !isPhone) {
      setError('Please provide a valid email address or 10-digit mobile number.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Password and confirmation do not match.');
      return;
    }

    if (!agreeTerms) {
      setError('You must accept the Terms & Conditions and Privacy Policy.');
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
            STEP 1 OF 3 • SIGN UP
          </span>
          <div className="w-4" />
        </div>

        {/* Header */}
        <div className="mb-5">
          <h2 className="text-lg font-medium text-slate-900">Create your MAUSAM account</h2>
          <p className="text-xs text-slate-500 mt-0.5 font-normal">
            Personalize weather forecasts for your routine, transit, and daily safety.
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
              Email or Mobile Number
            </label>
            <div className="relative">
              <input
                type="text"
                value={emailOrPhone}
                onChange={e => setEmailOrPhone(e.target.value)}
                placeholder="e.g. name@domain.com or 9876543210"
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-mausam text-xs focus:ring-1 focus:ring-brand focus:border-brand focus:outline-none"
              />
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-medium mb-1 text-[11.5px]">
              Create Password
            </label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-mausam text-xs focus:ring-1 focus:ring-brand focus:border-brand focus:outline-none"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-medium mb-1 text-[11.5px]">
              Confirm Password
            </label>
            <div className="relative">
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your password"
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-mausam text-xs focus:ring-1 focus:ring-brand focus:border-brand focus:outline-none"
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
                I agree to the <span className="text-brand font-medium underline">Terms & Conditions</span> and <span className="text-brand font-medium underline">Privacy Policy</span> of the India Meteorological Department.
              </span>
            </label>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 mt-4 bg-brand hover:bg-brand-dark text-white rounded-mausam text-xs font-medium flex items-center justify-center gap-1.5 shadow-xs transition-colors"
          >
            <span>Send OTP Verification</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        {/* Existing Account Footer */}
        <div className="text-center text-xs text-slate-500 pt-4 border-t border-slate-200 mt-4">
          <span>Already have an account? </span>
          <button
            onClick={onNavigateLogin}
            className="text-brand font-medium hover:underline"
          >
            Login
          </button>
        </div>
      </div>
    </div>
  );
}
