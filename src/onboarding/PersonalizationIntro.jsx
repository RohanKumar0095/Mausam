import React from 'react';
import { Sparkles, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function PersonalizationIntro({ onStartQuestions, onBack }) {
  return (
    <div className="min-h-screen bg-[#F4F8FB] flex flex-col justify-between p-4 sm:p-6 text-slate-800">
      <div className="max-w-md mx-auto w-full flex-1 flex flex-col justify-between">
        <div className="flex items-center justify-between mb-4">
          <span className="text-[11px] font-mono text-slate-400 uppercase tracking-widest">
            STEP 3 OF 3 • ONBOARDING
          </span>
          <span className="text-[10px] bg-brand-light text-brand px-2 py-0.5 rounded-full font-medium">
            Rule Model Synced
          </span>
        </div>

        <div className="my-auto text-center py-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand to-sky-600 flex items-center justify-center text-white mx-auto mb-4 shadow-md">
            <Sparkles className="w-8 h-8 text-sky-200 animate-pulse" />
          </div>

          <h1 className="text-xl font-medium text-slate-900 tracking-tight">
            Let's personalize your MAUSAM
          </h1>

          <p className="text-xs text-slate-600 mt-2 leading-relaxed max-w-xs mx-auto font-normal">
            Tell us a little about your daily life. We'll use this to show the weather information that matters most to you at the right time.
          </p>

          <div className="mt-6 space-y-2.5 text-left max-w-xs mx-auto bg-white p-3.5 rounded-mausam border border-slate-200/80 shadow-2xs">
            <div className="flex items-start gap-2 text-xs text-slate-700">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <span>Dynamic priority ranking for fitness, work, and farm routines</span>
            </div>
            <div className="flex items-start gap-2 text-xs text-slate-700">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <span>Location-conditioned advisories for home, farm, and office</span>
            </div>
            <div className="flex items-start gap-2 text-xs text-slate-700">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <span>Critical safety override protocols for severe storms</span>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-200 mt-4">
          <button
            onClick={onStartQuestions}
            className="w-full py-2.5 bg-brand hover:bg-brand-dark text-white rounded-mausam text-xs font-medium flex items-center justify-center gap-1.5 shadow-xs transition-colors"
          >
            <span>Get Started</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
