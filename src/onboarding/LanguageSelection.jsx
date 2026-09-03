import React, { useState } from 'react';
import { Globe, Check, ArrowRight, ArrowLeft } from 'lucide-react';

const LANGUAGES = [
  { id: 'en', name: 'English', native: 'English' },
  { id: 'hi', name: 'Hindi', native: 'हिन्दी' },
  { id: 'mr', name: 'Marathi', native: 'मराठी' },
  { id: 'bn', name: 'Bengali', native: 'বাংলা' },
  { id: 'ta', name: 'Tamil', native: 'தமிழ்' },
  { id: 'te', name: 'Telugu', native: 'తెలుగు' },
  { id: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ' },
  { id: 'ml', name: 'Malayalam', native: 'മലയാളം' },
  { id: 'gu', name: 'Gujarati', native: 'ગુજરાતી' },
  { id: 'pa', name: 'Punjabi', native: 'ਪੰਜਾਬੀ' },
  { id: 'or', name: 'Odia', native: 'ଓଡ଼ିଆ' },
];

export default function LanguageSelection({ selectedLanguage, onSelectLanguage, onContinue, onBack }) {
  const [currentLang, setCurrentLang] = useState(selectedLanguage || 'English');

  const handleSelect = (langName) => {
    setCurrentLang(langName);
    onSelectLanguage(langName);
  };

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
            LANGUAGE SETUP
          </span>
          <div className="w-4" />
        </div>

        {/* Title */}
        <div className="mb-4 text-center">
          <div className="w-10 h-10 rounded-full bg-brand-light text-brand flex items-center justify-center mx-auto mb-2">
            <Globe className="w-5 h-5" />
          </div>
          <h2 className="text-lg font-medium text-slate-900">Choose your language</h2>
          <p className="text-xs text-slate-500 mt-1 font-normal">
            Select your preferred language for personalized MAUSAM insights.
          </p>
        </div>

        {/* Language Grid */}
        <div className="grid grid-cols-1 gap-2 flex-1 overflow-y-auto max-h-[58vh] pr-1 py-1">
          {LANGUAGES.map(lang => {
            const isSelected = currentLang === lang.name;
            return (
              <button
                key={lang.id}
                onClick={() => handleSelect(lang.name)}
                className={`p-3 rounded-mausam border text-left flex items-center justify-between transition-all ${
                  isSelected
                    ? 'bg-brand text-white border-brand shadow-xs'
                    : 'bg-white text-slate-800 border-slate-200/80 hover:bg-slate-50'
                }`}
              >
                <div>
                  <span className="text-xs font-medium block">{lang.name}</span>
                  <span className={`text-[11px] ${isSelected ? 'text-sky-100' : 'text-slate-400'}`}>
                    {lang.native}
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
        <div className="pt-4 border-t border-slate-200 mt-4">
          <button
            onClick={() => onContinue(currentLang)}
            className="w-full py-2.5 bg-brand hover:bg-brand-dark text-white rounded-mausam text-xs font-medium flex items-center justify-center gap-1.5 shadow-xs transition-colors"
          >
            <span>Continue</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
