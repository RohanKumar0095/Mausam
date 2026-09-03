import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';

const QUESTIONS = [
  {
    id: 'usualDay',
    title: 'What does your usual day involve?',
    subtitle: 'Select all that apply to your lifestyle.',
    options: [
      { id: 'farm', label: '🌾 Farming / Agriculture' },
      { id: 'college', label: '🏫 School / College' },
      { id: 'office', label: '💼 Office / Work' },
      { id: 'running', label: '🏃 Exercise / Running' },
      { id: 'cycling', label: '🚲 Cycling' },
      { id: 'commute', label: '🚗 Daily Commute / Transit' },
      { id: 'travel', label: '✈️ Travelling' },
      { id: 'events', label: '🎉 Outdoor Events / Functions' },
      { id: 'beach', label: '🏖️ Beach / Outdoor Leisure' },
      { id: 'home', label: '🏠 Mostly at Home' },
      { id: 'family', label: '👨‍👩‍👧 Family / Children Activities' },
      { id: 'sports', label: '🏟️ Sports / Outdoor Games' },
      { id: 'indoor', label: '📚 Mostly Indoor Work / Study' },
      { id: 'other', label: '⚡ Other Activities' },
    ]
  },
  {
    id: 'weatherFactors',
    title: 'Which weather information matters most to you?',
    subtitle: 'Choose the parameters you check most frequently.',
    options: [
      { id: 'rain', label: '🌧️ Rain & Thunderstorms' },
      { id: 'temp', label: '🌡️ Temperature & Heat' },
      { id: 'uv', label: '☀️ UV / Sun Exposure' },
      { id: 'wind', label: '💨 Wind Speed & Gusts' },
      { id: 'visibility', label: '🌫️ Visibility / Fog' },
      { id: 'aqi', label: '😷 Air Quality (AQI)' },
      { id: 'lightning', label: '⚡ Lightning / Severe Weather' },
      { id: 'coastal', label: '🌊 Coastal / Tide Conditions' },
      { id: 'agri_soil', label: '🌾 Agriculture & Soil Conditions' },
      { id: 'road_transit', label: '🚦 Road / Travel Conditions' },
      { id: 'sun_astro', label: '🌅 Sunrise / Sunset & Astronomy' },
    ]
  },
  {
    id: 'outdoorActivities',
    title: 'What activities do you regularly do outdoors?',
    subtitle: 'MAUSAM synchronizes predictions with your outdoor hours.',
    options: [
      { id: 'out_run', label: '🏃 Running' },
      { id: 'out_walk', label: '🚶 Walking / Jogging' },
      { id: 'out_cycle', label: '🚲 Cycling' },
      { id: 'out_sports', label: '🏏 Sports / Games' },
      { id: 'out_farm', label: '🌾 Farm Work' },
      { id: 'out_commute', label: '🚗 Commuting' },
      { id: 'out_events', label: '🎉 Events / Functions' },
      { id: 'out_beach', label: '🏖️ Beach Activities' },
      { id: 'out_travel', label: '🧳 Travel / Sightseeing' },
      { id: 'out_none', label: '🏠 None / Rarely outdoors' },
    ]
  },
  {
    id: 'decisionGoals',
    title: 'What would you like MAUSAM to help you decide?',
    subtitle: 'Weather-to-Action intelligence tailored for you.',
    options: [
      { id: 'dec_exercise', label: '🏃 Is it a good time to exercise?' },
      { id: 'dec_commute', label: '🚗 Is it safe to travel or commute?' },
      { id: 'dec_farm', label: '🌾 Is it suitable for farm work / spraying?' },
      { id: 'dec_event', label: '🎉 Is it suitable for an outdoor event?' },
      { id: 'dec_family', label: '👨‍👩‍👧 Is it safe for my family outdoors?' },
      { id: 'dec_travel', label: '✈️ Is it suitable for travel?' },
      { id: 'dec_plan', label: '📅 How should I plan my day around the weather?' },
      { id: 'dec_risks', label: '⚠️ What weather risks should I know about?' },
    ]
  },
  {
    id: 'alertTypes',
    title: 'Which weather alerts are important to you?',
    subtitle: 'High-priority notifications for your routine.',
    options: [
      { id: 'al_rain', label: '🌧️ Heavy Rain' },
      { id: 'al_lightning', label: '⚡ Lightning / Thunderstorm' },
      { id: 'al_winds', label: '💨 Strong Winds / Squall' },
      { id: 'al_heat', label: '🌡️ Extreme Heat & Heatwave' },
      { id: 'al_aqi', label: '😷 Poor Air Quality (AQI)' },
      { id: 'al_coastal', label: '🌊 Coastal / High Tide' },
      { id: 'al_travel', label: '🚗 Travel / Road Weather' },
      { id: 'al_agri', label: '🌾 Agriculture Weather Advisory' },
      { id: 'al_all', label: '🚨 All important weather alerts' },
    ]
  }
];

export default function PreferenceQuestions({ onCompleteQuestions, onBack }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState({
    usualDay: ['🏃 Exercise / Running', '💼 Office / Work', '🚗 Daily Commute / Transit'],
    weatherFactors: ['🌧️ Rain & Thunderstorms', '🌡️ Temperature & Heat', '☀️ UV / Sun Exposure', '😷 Air Quality (AQI)'],
    outdoorActivities: ['🏃 Running', '🚗 Commuting'],
    decisionGoals: ['🏃 Is it a good time to exercise?', '🚗 Is it safe to travel or commute?', '📅 How should I plan my day around the weather?'],
    alertTypes: ['🌧️ Heavy Rain', '⚡ Lightning / Thunderstorm', '😷 Poor Air Quality (AQI)']
  });

  const question = QUESTIONS[currentStep];
  const currentSelections = answers[question.id] || [];

  const toggleOption = (optionLabel) => {
    const isSelected = currentSelections.includes(optionLabel);
    let next = [];
    if (isSelected) {
      if (currentSelections.length > 1) {
        next = currentSelections.filter(x => x !== optionLabel);
      } else {
        next = currentSelections;
      }
    } else {
      next = [...currentSelections, optionLabel];
    }
    setAnswers({ ...answers, [question.id]: next });
  };

  const handleNext = () => {
    if (currentStep < QUESTIONS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onCompleteQuestions(answers);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else {
      onBack();
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F8FB] flex flex-col justify-between p-4 sm:p-6 text-slate-800">
      <div className="max-w-md mx-auto w-full flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={handlePrev}
            className="p-1.5 -ml-1.5 rounded-full text-slate-500 hover:text-slate-800 hover:bg-slate-200/60"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <span className="text-[11px] font-mono text-slate-500 font-medium uppercase tracking-wider">
            QUESTION {currentStep + 1} OF {QUESTIONS.length}
          </span>
          <span className="text-[10px] text-brand font-medium">
            Multi-Select
          </span>
        </div>

        <div className="w-full h-1.5 bg-slate-200 rounded-full mb-4 overflow-hidden">
          <div
            className="h-full bg-brand transition-all duration-300 rounded-full"
            style={{ width: `${((currentStep + 1) / QUESTIONS.length) * 100}%` }}
          />
        </div>

        <div className="mb-3">
          <h2 className="text-base font-medium text-slate-900 leading-snug">
            {question.title}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 font-normal">
            {question.subtitle}
          </p>
        </div>

        <div className="space-y-1.5 flex-1 overflow-y-auto max-h-[52vh] pr-1 py-1">
          {question.options.map(opt => {
            const isSelected = currentSelections.includes(opt.label);
            return (
              <button
                key={opt.id}
                onClick={() => toggleOption(opt.label)}
                className={`w-full p-2.5 rounded-mausam border text-left flex items-center justify-between text-xs transition-all ${
                  isSelected
                    ? 'bg-brand-light/80 border-brand text-slate-900 ring-1 ring-brand/30 shadow-2xs'
                    : 'bg-white text-slate-700 border-slate-200/80 hover:bg-slate-50'
                }`}
              >
                <span className="font-normal">{opt.label}</span>
                {isSelected ? (
                  <div className="w-4 h-4 rounded bg-brand text-white flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 stroke-[2.5]" />
                  </div>
                ) : (
                  <div className="w-4 h-4 rounded border border-slate-300 flex-shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        <div className="pt-3 border-t border-slate-200 mt-3 flex items-center justify-between">
          <button
            onClick={handlePrev}
            className="px-3 py-2 text-slate-600 hover:text-slate-800 text-xs font-medium"
          >
            Back
          </button>
          <button
            onClick={handleNext}
            className="px-5 py-2 bg-brand hover:bg-brand-dark text-white rounded-mausam text-xs font-medium flex items-center gap-1 shadow-xs transition-colors"
          >
            <span>{currentStep === QUESTIONS.length - 1 ? 'Save & Setup Locations' : 'Next Question'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
