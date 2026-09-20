import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Plus, Trash2, Edit2 } from 'lucide-react';
import { useI18n } from '../i18n/i18nContext';

const QUESTIONS = [
  {
    id: 'usualDay',
    title: 'What does your usual day involve?',
    titleHi: 'आपका सामान्य दिन किन गतिविधियों से जुड़ा होता है?',
    subtitle: 'Select all that apply to your lifestyle.',
    subtitleHi: 'जो विकल्प आप पर लागू होते हैं, उन्हें चुनें।',
    options: [
      { id: 'farm', label: 'Agriculture', labelHi: 'कृषि कार्य' },
      { id: 'college', label: 'Health-conscioius', labelHi: 'स्वास्थ्य के प्रति सजग' },
      { id: 'office', label: 'Sportsperson', labelHi: 'खिलाड़ी' },
      { id: 'running', label: 'Event planner', labelHi: 'कार्यक्रम आयोजक' },
      { id: 'cycling', label: 'Commuter', labelHi: 'रोज़ाना आने-जाने वाला व्यक्ति' },
      { id: 'commute', label: 'Traveler', labelHi: 'सफ़र करने वाला व्यक्ति' },
      { id: 'travel', label: 'parent', labelHi: 'माता-पिता' },
      
    ]
  },
 
  {
    id: 'alertTypes',
    title: 'Which weather alerts are important to you?',
    titleHi: 'आपके लिए कौन-से मौसम अलर्ट सबसे महत्वपूर्ण हैं?',
    subtitle: 'High-priority notifications for your routine.',
    subtitleHi: 'आपकी दिनचर्या के लिए उच्च-प्राथमिकता वाली सूचनाएं।',
    options: [
      { id: 'al_rain', label: '🌧️ Heavy Rain', labelHi: '🌧️ भारी वर्षा की चेतावनी' },
      { id: 'al_lightning', label: '⚡ Lightning / Thunderstorm', labelHi: '⚡ आकाशीय बिजली और गरज-चमक' },
      { id: 'al_winds', label: '💨 Strong Winds / Squall', labelHi: '💨 तेज आंधी और हवा के झोंके' },
      { id: 'al_heat', label: '🌡️ Extreme Heat & Heatwave', labelHi: '🌡️ भीषण गर्मी और लू (हीटवेव)' },
      { id: 'al_aqi', label: '😷 Poor Air Quality (AQI)', labelHi: '😷 खराब वायु गुणवत्ता चेतावनी' },
      { id: 'al_coastal', label: '🌊 Coastal / High Tide', labelHi: '🌊 तटीय ऊंची लहरें और उच्च ज्वार' },
      { id: 'al_travel', label: '🚗 Travel / Road Weather', labelHi: '🚗 मार्ग और सड़क मौसम अलर्ट' },
      { id: 'al_agri', label: '🌾 Agriculture Weather Advisory', labelHi: '🌾 विशेष कृषि मौसम बुलेटिन' },
      { id: 'al_all', label: '🚨 All important weather alerts', labelHi: '🚨 सभी महत्वपूर्ण मौसम चेतावनियाँ' },
    ]
  }
];

export default function PreferenceQuestions({ onCompleteQuestions, onBack }) {
  const { language, t } = useI18n();
  const isHindi = language === 'hi';

  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState({
    usualDay: [],
    weatherFactors: [],
    decisionGoals: [],
    customDecisions: [],
    alertTypes: []
  });

  // Custom question state for Question 3
  const [customInput, setCustomInput] = useState('');
  const [editingIndex, setEditingIndex] = useState(null);
  const [editingText, setEditingText] = useState('');

  const question = QUESTIONS[currentStep];
  const currentSelections = answers[question.id] || [];

  const toggleOption = (optionLabel) => {
    const isSelected = currentSelections.includes(optionLabel);

    // Special handling for Alert Types "All important weather alerts"
    if (question.id === 'alertTypes') {
      const allLabel = isHindi ? '🚨 सभी महत्वपूर्ण मौसम चेतावनियाँ' : '🚨 All important weather alerts';
      const isAllOption = optionLabel.includes('All important') || optionLabel.includes('सभी महत्वपूर्ण');

      if (isAllOption) {
        if (isSelected) {
          setAnswers({ ...answers, alertTypes: [] });
        } else {
          // Select all options
          const allOptionsLabels = question.options.map(opt => isHindi ? opt.labelHi : opt.label);
          setAnswers({ ...answers, alertTypes: allOptionsLabels });
        }
        return;
      } else {
        let next = isSelected 
          ? currentSelections.filter(x => x !== optionLabel && !x.includes('All important') && !x.includes('सभी महत्वपूर्ण'))
          : [...currentSelections.filter(x => !x.includes('All important') && !x.includes('सभी महत्वपूर्ण')), optionLabel];
        
        // If all other alerts are selected, also add the "all" option
        const otherOptions = question.options.filter(o => o.id !== 'al_all');
        const otherLabels = otherOptions.map(o => isHindi ? o.labelHi : o.label);
        const allSelected = otherLabels.every(l => next.includes(l));
        if (allSelected) {
          next = [...next, allLabel];
        }
        setAnswers({ ...answers, alertTypes: next });
        return;
      }
    }

    // Default toggle for other questions (allow 0 to N selections)
    const next = isSelected
      ? currentSelections.filter(x => x !== optionLabel)
      : [...currentSelections, optionLabel];
    
    setAnswers({ ...answers, [question.id]: next });
  };

  // Custom decisions management for Question 3
  const handleAddCustomQuestion = (e) => {
    e?.preventDefault();
    if (!customInput.trim()) return;
    const nextCustom = [...(answers.customDecisions || []), customInput.trim()];
    setAnswers({ ...answers, customDecisions: nextCustom });
    setCustomInput('');
  };

  const handleDeleteCustomQuestion = (idx) => {
    const nextCustom = (answers.customDecisions || []).filter((_, i) => i !== idx);
    setAnswers({ ...answers, customDecisions: nextCustom });
    if (editingIndex === idx) {
      setEditingIndex(null);
      setEditingText('');
    }
  };

  const handleStartEdit = (idx, text) => {
    setEditingIndex(idx);
    setEditingText(text);
  };

  const handleSaveEdit = (idx) => {
    if (!editingText.trim()) {
      handleDeleteCustomQuestion(idx);
      return;
    }
    const nextCustom = [...(answers.customDecisions || [])];
    nextCustom[idx] = editingText.trim();
    setAnswers({ ...answers, customDecisions: nextCustom });
    setEditingIndex(null);
    setEditingText('');
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
            {t('q_question')} {currentStep + 1} {t('q_of')} {QUESTIONS.length}
          </span>
          <span className="text-[10px] text-brand font-medium">
            {t('q_multi_select')}
          </span>
        </div>

        <div className="w-full h-1.5 bg-slate-200 rounded-full mb-4 overflow-hidden">
          <div
            className="h-full bg-brand transition-all duration-300 rounded-full"
            style={{ width: `${((currentStep + 1) / QUESTIONS.length) * 100}%` }}
          />
        </div>

        <div className="mb-3">
          <h2 className="text-base font-bold text-slate-900 leading-snug">
            {isHindi ? question.titleHi : question.title}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 font-normal">
            {isHindi ? question.subtitleHi : question.subtitle}
          </p>
        </div>

        <div className="space-y-2 flex-1 overflow-y-auto max-h-[52vh] pr-1 py-1">
          {question.options.map(opt => {
            const displayLabel = isHindi ? opt.labelHi : opt.label;
            const isSelected = currentSelections.includes(displayLabel) || currentSelections.includes(opt.label);

            return (
              <button
                key={opt.id}
                onClick={() => toggleOption(displayLabel)}
                className={`w-full p-2.5 rounded-mausam border text-left flex items-center justify-between text-xs transition-all ${
                  isSelected
                    ? 'bg-brand-light/80 border-brand text-slate-900 ring-1 ring-brand/30 shadow-2xs'
                    : 'bg-white text-slate-700 border-slate-200/80 hover:bg-slate-50'
                }`}
              >
                <span className="font-normal">{displayLabel}</span>
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

          {/* Interactive Custom Questions / Decision Goals Builder in Question 3 */}
          {question.id === 'decisionGoals' && (
            <div className="mt-4 pt-3 border-t border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11.5px] font-semibold text-slate-800">
                  {isHindi ? '✨ अपने स्वयं के मौसम प्रश्न जोड़ें' : '✨ Add Your Custom Questions / Decisions'}
                </span>
                <span className="text-[10px] text-slate-400">
                  {(answers.customDecisions || []).length} {isHindi ? 'प्रश्न' : 'custom'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                {isHindi 
                  ? 'उदा. "क्या सुबह 6 बजे दौड़ने जाना सुरक्षित है?", "क्या 5 बजे छाता ले जाना चाहिए?"'
                  : 'e.g., "Is it safe to go jogging at 6 AM?", "Should I carry an umbrella at 5 PM?"'}
              </p>

              {/* Add Input Form */}
              <form onSubmit={handleAddCustomQuestion} className="flex gap-1.5 pt-1">
                <input
                  type="text"
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                  placeholder={isHindi ? 'अपना व्यक्तिगत सवाल लिखें...' : 'Type your personalized decision question...'}
                  className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-300 rounded focus:ring-1 focus:ring-brand focus:outline-none placeholder:text-slate-400"
                />
                <button
                  type="submit"
                  disabled={!customInput.trim()}
                  className="px-3 py-1.5 bg-brand text-white text-xs font-medium rounded hover:bg-brand-dark disabled:opacity-50 flex items-center gap-1 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isHindi ? 'जोड़ें' : 'Add'}</span>
                </button>
              </form>

              {/* List of Custom Questions */}
              {(answers.customDecisions || []).length > 0 && (
                <div className="space-y-1.5 pt-1">
                  {answers.customDecisions.map((customQ, idx) => (
                    <div
                      key={idx}
                      className="p-2 rounded bg-emerald-50/70 border border-emerald-200/80 flex items-center justify-between gap-2 text-xs text-slate-800"
                    >
                      {editingIndex === idx ? (
                        <div className="flex-1 flex gap-1.5">
                          <input
                            type="text"
                            value={editingText}
                            onChange={(e) => setEditingText(e.target.value)}
                            className="flex-1 px-2 py-1 bg-white border border-slate-300 rounded text-xs focus:outline-none"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveEdit(idx)}
                            className="px-2 py-1 bg-emerald-600 text-white rounded text-[10.5px] font-medium"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingIndex(null)}
                            className="px-2 py-1 bg-slate-200 text-slate-700 rounded text-[10.5px]"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="flex-1 min-w-0 flex items-start gap-1.5">
                            <span className="text-emerald-600 font-bold">•</span>
                            <span className="truncate font-medium text-slate-800">{customQ}</span>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button
                              type="button"
                              onClick={() => handleStartEdit(idx, customQ)}
                              className="p-1 text-slate-500 hover:text-slate-800 rounded hover:bg-slate-200/60"
                              title="Edit question"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteCustomQuestion(idx)}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50"
                              title="Delete question"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="pt-3 border-t border-slate-200 mt-3 flex items-center justify-between">
          <button
            onClick={handlePrev}
            className="px-3 py-2 text-slate-600 hover:text-slate-800 text-xs font-medium"
          >
            {t('q_back')}
          </button>
          <button
            onClick={handleNext}
            className="px-5 py-2 bg-brand hover:bg-brand-dark text-white rounded-mausam text-xs font-semibold flex items-center gap-1 shadow-xs transition-colors"
          >
            <span>{currentStep === QUESTIONS.length - 1 ? t('q_save_locations') : t('q_next')}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
