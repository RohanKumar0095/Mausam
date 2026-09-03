import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { useI18n } from '../i18n/i18nContext';

const QUESTIONS = [
  {
    id: 'usualDay',
    title: 'What does your usual day involve?',
    titleHi: 'आपका सामान्य दिन किन गतिविधियों से जुड़ा होता है?',
    subtitle: 'Select all that apply to your lifestyle.',
    subtitleHi: 'जो विकल्प आप पर लागू होते हैं, उन्हें चुनें।',
    options: [
      { id: 'farm', label: '🌾 Farming / Agriculture', labelHi: '🌾 खेती / कृषि कार्य' },
      { id: 'college', label: '🏫 School / College', labelHi: '🏫 स्कूल / कॉलेज की पढ़ाई' },
      { id: 'office', label: '💼 Office / Work', labelHi: '💼 कार्यालय / नौकरी / व्यवसाय' },
      { id: 'running', label: '🏃 Exercise / Running', labelHi: '🏃 व्यायाम / सुबह की दौड़' },
      { id: 'cycling', label: '🚲 Cycling', labelHi: '🚲 साइकिल चलाना' },
      { id: 'commute', label: '🚗 Daily Commute / Transit', labelHi: '🚗 दैनिक यात्रा / ऑफिस आना-जाना' },
      { id: 'travel', label: '✈️ Travelling', labelHi: '✈️ लंबी यात्रा / भ्रमण' },
      { id: 'events', label: '🎉 Outdoor Events / Functions', labelHi: '🎉 बाहरी सामाजिक कार्यक्रम / उत्सव' },
      { id: 'beach', label: '🏖️ Beach / Outdoor Leisure', labelHi: '🏖️ समुद्र तट / बाहरी पर्यटन' },
      { id: 'home', label: '🏠 Mostly at Home', labelHi: '🏠 अधिकांश समय घर पर' },
      { id: 'family', label: '👨‍👩‍👧 Family / Children Activities', labelHi: '👨‍👩‍👧 परिवार / बच्चों की देखभाल' },
      { id: 'sports', label: '🏟️ Sports / Outdoor Games', labelHi: '🏟️ खेलकूद / मैदान का अभ्यास' },
      { id: 'indoor', label: '📚 Mostly Indoor Work / Study', labelHi: '📚 इनडोर अध्ययन / कार्य' },
      { id: 'other', label: '⚡ Other Activities', labelHi: '⚡ अन्य गतिविधियाँ' },
    ]
  },
  {
    id: 'weatherFactors',
    title: 'Which weather information matters most to you?',
    titleHi: 'मौसम की कौन-सी जानकारी आपके लिए सबसे महत्वपूर्ण है?',
    subtitle: 'Choose the parameters you check most frequently.',
    subtitleHi: 'वे पैरामीटर चुनें जिन्हें आप अक्सर देखते हैं।',
    options: [
      { id: 'rain', label: '🌧️ Rain & Thunderstorms', labelHi: '🌧️ बारिश और आंधी-तूफान' },
      { id: 'temp', label: '🌡️ Temperature & Heat', labelHi: '🌡️ तापमान और गर्मी' },
      { id: 'uv', label: '☀️ UV / Sun Exposure', labelHi: '☀️ UV सूचकांक / तेज धूप' },
      { id: 'wind', label: '💨 Wind Speed & Gusts', labelHi: '💨 हवा की गति और झोंके' },
      { id: 'visibility', label: '🌫️ Visibility / Fog', labelHi: '🌫️ दृश्यता और कोहरा' },
      { id: 'aqi', label: '😷 Air Quality (AQI)', labelHi: '😷 वायु गुणवत्ता सूचकांक (AQI)' },
      { id: 'lightning', label: '⚡ Lightning / Severe Weather', labelHi: '⚡ आकाशीय बिजली / गंभीर मौसम' },
      { id: 'coastal', label: '🌊 Coastal / Tide Conditions', labelHi: '🌊 तटीय स्थिति और समुद्री ज्वार' },
      { id: 'agri_soil', label: '🌾 Agriculture & Soil Conditions', labelHi: '🌾 कृषि और मृदा नमी' },
      { id: 'road_transit', label: '🚦 Road / Travel Conditions', labelHi: '🚦 सड़क और यातायात की स्थिति' },
      { id: 'sun_astro', label: '🌅 Sunrise / Sunset & Astronomy', labelHi: '🌅 सूर्योदय, सूर्यास्त और खगोल' },
    ]
  },
  {
    id: 'outdoorActivities',
    title: 'What activities do you regularly do outdoors?',
    titleHi: 'आप नियमित रूप से कौन-सी बाहरी गतिविधियाँ करते हैं?',
    subtitle: 'MAUSAM synchronizes predictions with your outdoor hours.',
    subtitleHi: 'MAUSAM आपके बाहर रहने के समय के साथ पूर्वानुमान का तालमेल बिठाता है।',
    options: [
      { id: 'out_run', label: '🏃 Running', labelHi: '🏃 दौड़ना' },
      { id: 'out_walk', label: '🚶 Walking / Jogging', labelHi: '🚶 टहलना / सुबह की सैर' },
      { id: 'out_cycle', label: '🚲 Cycling', labelHi: '🚲 साइकिल चलाना' },
      { id: 'out_sports', label: '🏏 Sports / Games', labelHi: '🏏 क्रिकेट / फुटबॉल / खेल' },
      { id: 'out_farm', label: '🌾 Farm Work', labelHi: '🌾 खेत की निराई-गुड़ाई व काम' },
      { id: 'out_commute', label: '🚗 Commuting', labelHi: '🚗 दैनिक सफर / यात्रा' },
      { id: 'out_events', label: '🎉 Events / Functions', labelHi: '🎉 खुले में कार्यक्रम' },
      { id: 'out_beach', label: '🏖️ Beach Activities', labelHi: '🏖️ समुद्र तट पर सैर' },
      { id: 'out_travel', label: '🧳 Travel / Sightseeing', labelHi: '🧳 पर्यटन और दर्शनीय स्थल' },
      { id: 'out_none', label: '🏠 None / Rarely outdoors', labelHi: '🏠 बहुत कम / केवल घर पर' },
    ]
  },
  {
    id: 'decisionGoals',
    title: 'What would you like MAUSAM to help you decide?',
    titleHi: 'आप MAUSAM की मदद से किन बातों की योजना बनाना चाहते हैं?',
    subtitle: 'Weather-to-Action intelligence tailored for you.',
    subtitleHi: 'आपके लिए व्यक्तिगत मौसम-से-कार्रवाई परामर्श।',
    options: [
      { id: 'dec_exercise', label: '🏃 Is it a good time to exercise?', labelHi: '🏃 क्या यह व्यायाम करने का सही समय है?' },
      { id: 'dec_commute', label: '🚗 Is it safe to travel or commute?', labelHi: '🚗 क्या यात्रा करना सुरक्षित है?' },
      { id: 'dec_farm', label: '🌾 Is it suitable for farm work / spraying?', labelHi: '🌾 क्या खेत में छिड़काव / उर्वरक का सही समय है?' },
      { id: 'dec_event', label: '🎉 Is it suitable for an outdoor event?', labelHi: '🎉 क्या बाहरी कार्यक्रम के लिए मौसम ठीक रहेगा?' },
      { id: 'dec_family', label: '👨‍👩‍👧 Is it safe for my family outdoors?', labelHi: '👨‍👩‍👧 क्या परिवार के साथ बाहर जाना सुरक्षित है?' },
      { id: 'dec_travel', label: '✈️ Is it suitable for travel?', labelHi: '✈️ क्या लंबी यात्रा के लिए मौसम अनुकूल है?' },
      { id: 'dec_plan', label: '📅 How should I plan my day around the weather?', labelHi: '📅 मौसम के अनुसार दिन की योजना कैसे बनाएं?' },
      { id: 'dec_risks', label: '⚠️ What weather risks should I know about?', labelHi: '⚠️ मुझे किन मौसम जोखिमों से सावधान रहना चाहिए?' },
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

        <div className="space-y-1.5 flex-1 overflow-y-auto max-h-[52vh] pr-1 py-1">
          {question.options.map(opt => {
            const isSelected = currentSelections.includes(opt.label);
            const displayLabel = isHindi ? opt.labelHi : opt.label;

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
