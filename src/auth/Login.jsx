import React, { useState } from 'react';
import { ArrowLeft, Lock, User, LogIn, PlayCircle } from 'lucide-react';
import { authService } from './authService';

export default function Login({ onLoginSuccess, onNavigateSignup, onTryDemo, onBack }) {
  const [userIdOrPhone, setUserIdOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!userIdOrPhone.trim()) {
      setError('Please enter your User ID or Mobile Number.');
      return;
    }

    if (!password) {
      setError('Please enter your password.');
      return;
    }

    const res = authService.login({ userIdOrPhone: userIdOrPhone.trim(), password });
    if (res.success) {
      onLoginSuccess(res.user);
    } else {
      setError('Invalid credentials.');
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F8FB] flex flex-col justify-between p-4 sm:p-6 text-slate-800">
      <div className="max-w-md mx-auto w-full flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={onBack}
            className="p-1.5 -ml-1.5 rounded-full text-slate-500 hover:text-slate-800 hover:bg-slate-200/60"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <span className="text-[11px] font-mono text-slate-400 uppercase tracking-widest">
            MAUSAM LOGIN
          </span>
          <div className="w-4" />
        </div>

        <div className="mb-5">
          <h2 className="text-lg font-medium text-slate-900">Welcome back</h2>
          <p className="text-xs text-slate-500 mt-0.5 font-normal">
            Sign in to access your personalized weather dashboard.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 flex-1 text-xs">
          <div>
            <label className="block text-slate-700 font-medium mb-1 text-[11.5px]">
              User ID or Mobile Number
            </label>
            <div className="relative">
              <input
                type="text"
                value={userIdOrPhone}
                onChange={e => setUserIdOrPhone(e.target.value)}
                placeholder="e.g. rohan_weather or 9876543210"
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-mausam text-xs focus:ring-1 focus:ring-brand focus:border-brand focus:outline-none"
              />
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-slate-700 font-medium text-[11.5px]">
                Password
              </label>
              <button
                type="button"
                onClick={() => alert('Demo Mode: Enter any password to continue.')}
                className="text-[10.5px] text-brand hover:underline font-normal"
              >
                Forgot Password?
              </button>
            </div>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-mausam text-xs focus:ring-1 focus:ring-brand focus:border-brand focus:outline-none"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 mt-4 bg-brand hover:bg-brand-dark text-white rounded-mausam text-xs font-medium flex items-center justify-center gap-1.5 shadow-xs transition-colors"
          >
            <LogIn className="w-4 h-4" />
            <span>Login</span>
          </button>

          <button
            type="button"
            onClick={onTryDemo}
            className="w-full py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-mausam text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
          >
            <PlayCircle className="w-3.5 h-3.5 text-amber-700" />
            <span>Try Judge Demo Mode Directly</span>
          </button>
        </form>

        <div className="text-center text-xs text-slate-500 pt-4 border-t border-slate-200 mt-4">
          <span>Don't have an account? </span>
          <button
            onClick={onNavigateSignup}
            className="text-brand font-medium hover:underline"
          >
            Create Account
          </button>
        </div>
      </div>
    </div>
  );
}
