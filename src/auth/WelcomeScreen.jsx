import React from 'react';
import { Sparkles, ArrowRight, ShieldCheck, PlayCircle, LogIn, UserPlus } from 'lucide-react';

export default function WelcomeScreen({ onGetStarted, onLogin, onTryDemo }) {
  return (
    <div className="min-h-screen bg-[#F4F8FB] flex flex-col justify-between p-4 sm:p-6 text-slate-800">
      {/* Top Government IMD Badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-full bg-brand flex items-center justify-center text-white font-medium text-xs shadow-xs border border-white/20">
            IMD
          </div>
          <div>
            <h4 className="text-[12px] font-medium text-brand tracking-tight">
              India Meteorological Department
            </h4>
            <p className="text-[10px] text-slate-500">Ministry of Earth Sciences, Govt. of India</p>
          </div>
        </div>

        <span className="text-[10px] bg-brand-light text-brand px-2 py-0.5 rounded-full font-medium border border-brand/20">
          SIH 2026
        </span>
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

        <h1 className="text-2xl font-medium text-brand-dark tracking-tight">
          MAUSAM
        </h1>
        <h2 className="text-[15px] font-medium text-slate-700 mt-1">
          Weather that matters to you.
        </h2>

        <p className="text-xs text-slate-500 mt-2.5 leading-relaxed max-w-xs mx-auto font-normal">
          Get personalized weather intelligence based on your daily routine, locations, and lifestyle activities.
        </p>

        {/* Action Buttons */}
        <div className="space-y-2.5 mt-8 max-w-xs mx-auto">
          <button
            onClick={onGetStarted}
            className="w-full py-2.5 px-4 bg-brand hover:bg-brand-dark text-white rounded-mausam text-xs font-medium flex items-center justify-center gap-2 shadow-xs active:scale-98 transition-all"
          >
            <UserPlus className="w-4 h-4" />
            <span>Create Account</span>
            <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
          </button>

          <button
            onClick={onLogin}
            className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300/80 rounded-mausam text-xs font-medium flex items-center justify-center gap-2 shadow-2xs active:scale-98 transition-all"
          >
            <LogIn className="w-4 h-4 text-brand" />
            <span>Login</span>
          </button>

          {/* Judge Demo Quick Bypass */}
          <button
            onClick={onTryDemo}
            className="w-full py-2 px-3 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-mausam text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
          >
            <PlayCircle className="w-3.5 h-3.5 text-amber-700" />
            <span>Try Judge Demo Mode (Instant Access)</span>
          </button>
        </div>
      </div>

      {/* Footer Notice */}
      <div className="text-center text-[11px] text-slate-400 font-normal pt-2 border-t border-slate-200/60 max-w-sm mx-auto">
        <div className="flex items-center justify-center gap-1 text-slate-500 mb-0.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span className="font-medium">Official Weather Information</span>
        </div>
        <p>Personalized for your daily life • Problem SIH26076</p>
      </div>
    </div>
  );
}
