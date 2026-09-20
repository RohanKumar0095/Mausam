import React from 'react';
import ReactDOM from 'react-dom';
import { 
  X, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  HelpCircle,
  Thermometer, 
  Droplets, 
  Wind, 
  Sun, 
  Flame, 
  Eye, 
  Activity, 
  ArrowRight,
  Footprints,
  Car,
  GraduationCap,
  Briefcase,
  Trophy,
  Sprout,
  PartyPopper,
  ShieldAlert,
  Info,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { useI18n } from '../../i18n/i18nContext';
import { validateSignalApplicability } from '../../engine/contextRelevanceEngine';

const ACTIVITY_ICON_MAP = {
  running: Footprints,
  walking: Footprints,
  cycling: Footprints,
  college: GraduationCap,
  school: GraduationCap,
  office: Briefcase,
  commute: Car,
  sports: Trophy,
  farm_work: Sprout,
  outdoor_event: PartyPopper
};

const FACTOR_ICON_MAP = {
  'Temperature': Thermometer,
  'Temperature & WBGT': Thermometer,
  'Rain Probability': Droplets,
  'Humidity': Droplets,
  'Wind': Wind,
  'UV Exposure': Sun,
  'Air Quality (AQI)': Activity,
  'Visibility': Eye,
  'WBGT Heat Index': Flame
};

const WIDGET_TITLE_MAP = {
  wbgt_safety: 'WBGT Heat Stress Safety',
  dew_factor: 'Dew Factor & Ball Grip',
  training_window: 'Training Window Forecast',
  ground_condition: 'Ground & Pitch Condition',
  running_window: 'Optimal Running Window',
  commute_weather: 'Commute & Road Advisory',
  travel_disruption: 'Travel & Flight Advisory',
  rain_probability: 'Precipitation Risk',
  wind_gauge: 'Wind Velocity',
  lightning_storm_safety: 'Lightning & Storm Safety',
  aqi_health: 'Air Quality Health Risk',
  uv_heat_index: 'UV Exposure Guidance',
  today_forecast: 'Daily Weather Outlook'
};

export default function RecommendationDetailModal({
  isOpen,
  onClose,
  item = null,
  allSignals = []
}) {
  const { language } = useI18n();
  const isHindi = language === 'hi' || language === 'Hindi';

  if (!isOpen || !item) return null;

  const Icon = ACTIVITY_ICON_MAP[item.activity_type] || Footprints;

  const isGo = item.status === 'GO';
  const isModify = item.status === 'MODIFY';
  const isReschedule = item.status === 'RESCHEDULE';

  const actContext = {
    persona: item.persona,
    activity: item.activity_type,
    activity_type: item.activity_type
  };

  const rawFactors = item.analyzed_factors || [];
  // Exclude non-applicable factors (e.g. WBGT Heat Index for non-exertional travel/stationary activities)
  const factors = rawFactors.filter(f => {
    if (['travel', 'air_travel', 'commute', 'two_wheeler_commute', 'car_commute', 'office', 'college', 'school', 'indoor', 'indoor_work', 'study'].includes(item.activity_type)) {
      if (f.name === 'WBGT Heat Index' || f.name === 'Temperature & WBGT') return false;
    }
    return true;
  });

  const sportAssessment = ['running', 'cycling', 'sports', 'cricket'].includes(item.activity_type) ? item.sportsperson_assessment : null;
  const altWindow = item.alternative_window;

  // Filter structured signals matching this specific activity and validated by ContextRelevanceEngine
  const relevantSignals = (allSignals || []).filter(sig => {
    if (!validateSignalApplicability(sig, actContext)) return false;
    if (item.supporting_signals && item.supporting_signals.includes(sig.signal_id)) return true;
    if (sig.affects_activity_id && sig.affects_activity_id === item.activity_id) return true;
    return false;
  });

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-fadeIn">
      <div className="bg-[#F4F8FB] w-full max-w-xl rounded-2xl shadow-2xl border border-slate-300 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* 1. Modal Top Header */}
        <div className="bg-[#1F5C8B] px-4 py-3.5 text-white flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center shrink-0 border border-white/30">
              <Icon className="w-5 h-5 text-sky-200" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-bold truncate tracking-tight">{item.activity_label}</h3>
                <span className="bg-sky-400/25 text-sky-100 text-[10px] font-mono px-2 py-0.5 rounded-full border border-sky-300/30 shrink-0">
                  🕒 {item.time_window}
                </span>
              </div>
              <p className="text-[11px] text-sky-200 truncate mt-0.5 flex items-center gap-1 font-medium">
                <MapPin className="w-3 h-3 text-sky-300 shrink-0" />
                <span>{item.location}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/20 text-white/90 transition-colors ml-2 shrink-0"
            title={isHindi ? 'बंद करें' : 'Close'}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-4 overflow-y-auto space-y-4 text-xs text-slate-800">
          
          {/* 2. Main Status & Primary Recommendation Banner */}
          <div 
            className="p-4 rounded-xl border flex items-start gap-3 shadow-xs"
            style={{ 
              backgroundColor: isGo ? '#ECFDF5' : isModify ? '#FFFBEB' : '#FEF2F2',
              borderColor: isGo ? '#A7F3D0' : isModify ? '#FDE68A' : '#FCA5A5'
            }}
          >
            {isGo ? (
              <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
            ) : isModify ? (
              <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
            ) : (
              <XCircle className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
            )}

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
                <span 
                  className="font-bold text-[10.5px] uppercase tracking-wider px-2.5 py-0.5 rounded-full text-white"
                  style={{ backgroundColor: isGo ? '#0F6E56' : isModify ? '#D97706' : '#DC2626' }}
                >
                  ✓ {item.status}
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  {isHindi ? 'एकल निर्णय स्रोत द्वारा सत्यापित' : 'Single Decision Truth Verified'}
                </span>
              </div>

              <h4 className="font-bold text-sm text-slate-900 leading-snug">
                {item.summary}
              </h4>
            </div>
          </div>

          {/* 3. Decision Context Statement */}
          <div className="p-3 rounded-xl bg-sky-50/80 border border-sky-200 shadow-xs space-y-1">
            <span className="font-bold text-[10.5px] text-[#1F5C8B] uppercase tracking-wider block">
              {isHindi ? 'यह निर्णय क्यों?' : 'Why this recommendation?'}
            </span>
            <p className="text-[11.5px] text-slate-700 leading-relaxed font-medium">
              {isHindi
                ? `आपकी ${item.time_window} के लिए ${item.location} में निर्धारित ${item.activity_label} गतिविधि का विशेष रूप से मौसम विश्लेषण किया गया।`
                : `Weather conditions were analyzed specifically for your scheduled ${item.time_window} ${item.activity_label} activity at ${item.location}.`}
            </p>
          </div>

          {/* 3.5. Exact Analyzed Weather Window & Data Provenance Card */}
          <div className="p-3.5 rounded-xl bg-slate-900 text-white shadow-md space-y-2 border border-sky-400/35">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <span className="font-bold text-[11px] text-sky-300 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-sky-400" />
                {isHindi ? 'विश्लेषित मौसम समय-सीमा (Forecast Provenance)' : 'ANALYZED WEATHER WINDOW'}
              </span>
              <span className="text-[9.5px] font-mono px-2 py-0.5 rounded bg-sky-500/20 text-sky-200 border border-sky-400/30 uppercase">
                {item.analyzed_context?.data_type === 'hourly_forecast' ? 'Hourly Forecast' : (item.analyzed_context?.data_type === 'active_live' ? 'Live Current' : 'Diurnal Forecast')}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px]">
              <div className="p-2 rounded bg-white/5 border border-white/10">
                <span className="text-[9.5px] text-sky-200/70 block">📅 {isHindi ? 'तारीख' : 'Date'}</span>
                <span className="font-bold text-white">{item.display_label || item.occurrence_date}</span>
              </div>
              <div className="p-2 rounded bg-white/5 border border-white/10">
                <span className="text-[9.5px] text-sky-200/70 block">🕒 {isHindi ? 'समय सीमा' : 'Window'}</span>
                <span className="font-bold text-white">{item.time_window}</span>
              </div>
              <div className="p-2 rounded bg-white/5 border border-white/10">
                <span className="text-[9.5px] text-sky-200/70 block">🌡️ {isHindi ? 'तापमान / WBGT' : 'Temp / WBGT'}</span>
                <span className="font-bold text-amber-300">
                  {item.weather_snapshot?.temp_c != null ? `${item.weather_snapshot.temp_c}°C` : '--'} ({item.weather_snapshot?.wbgt_c != null ? `${item.weather_snapshot.wbgt_c}°C WBGT` : '--'})
                </span>
              </div>
              <div className="p-2 rounded bg-white/5 border border-white/10">
                <span className="text-[9.5px] text-sky-200/70 block">🌧️ {isHindi ? 'बारिश जोखिम' : 'Rain Prob'}</span>
                <span className="font-bold text-sky-300">
                  {item.weather_snapshot?.rain_probability != null ? `${item.weather_snapshot.rain_probability}%` : '--'}
                </span>
              </div>
            </div>
          </div>

          {/* 4. Influencing Persona Intelligence Signals */}
          {relevantSignals.length > 0 && (
            <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-2.5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="font-bold text-[11px] text-[#1F5C8B] uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  {isHindi ? 'प्रभावी पर्सोना इंटेलिजेंस संकेत' : 'Influencing Persona Intelligence Signals'}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {relevantSignals.length} {isHindi ? 'सक्रिय साक्ष्य' : 'Active Signals'}
                </span>
              </div>

              <div className="space-y-2">
                {relevantSignals.map((sig, idx) => {
                  const title = WIDGET_TITLE_MAP[sig.widget_type] || sig.widget_type;
                  const isCrit = sig.severity === 'critical';
                  const isHigh = sig.severity === 'high';
                  const isMod = sig.severity === 'moderate';

                  return (
                    <div 
                      key={idx} 
                      className={`p-2.5 rounded-xl border flex flex-col gap-1 ${
                        isCrit || isHigh 
                          ? 'bg-amber-50/70 border-amber-200 text-amber-950' 
                          : 'bg-[#F4F8FB] border-slate-200 text-slate-900'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 font-bold text-xs">
                          <span className="text-amber-500">⚡</span>
                          <span>{title}</span>
                        </div>
                        <span className={`text-[9.5px] font-extrabold uppercase px-2 py-0.5 rounded-full text-white ${
                          isCrit ? 'bg-rose-600' : isHigh ? 'bg-amber-600' : isMod ? 'bg-sky-600' : 'bg-emerald-600'
                        }`}>
                          {sig.severity}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-700 leading-snug">
                        {sig.explanation}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 5. Weather Factors Analyzed Grid */}
          <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-2.5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="font-bold text-[11px] text-[#1F5C8B] uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-[#1F5C8B]" />
                {isHindi ? 'विश्लेषित मौसम कारक' : 'Weather Factors Analyzed'}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {factors.length} {isHindi ? 'कारक' : 'Factors'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {factors.map((f, idx) => {
                const FactorIcon = FACTOR_ICON_MAP[f.name] || Info;
                const isNeg = f.impact === 'negative';

                return (
                  <div 
                    key={idx} 
                    className={`p-2.5 rounded-xl border flex flex-col justify-between ${
                      isNeg 
                        ? 'bg-rose-50/60 border-rose-200 text-rose-950' 
                        : 'bg-[#F4F8FB] border-slate-200 text-slate-900'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10.5px] font-bold text-slate-600 flex items-center gap-1">
                          <FactorIcon className={`w-3.5 h-3.5 ${isNeg ? 'text-rose-600' : 'text-sky-600'}`} />
                          {f.name}
                        </span>
                        <span className={`text-[9.5px] font-bold px-1.5 py-0.2 rounded ${
                          isNeg ? 'bg-rose-200 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {f.assessment}
                        </span>
                      </div>
                      <div className="text-base font-extrabold text-slate-900 font-mono">
                        {f.value}
                      </div>
                    </div>
                    <p className="text-[10.5px] text-slate-600 leading-snug mt-1.5 pt-1.5 border-t border-slate-200/70">
                      {f.explanation}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 6. Sportsperson Personalized Heat Assessment Card (If active) */}
          {sportAssessment && (
            <div className="p-3.5 rounded-xl bg-amber-50/90 border border-amber-300 shadow-xs space-y-2 text-amber-950">
              <div className="flex items-center justify-between border-b border-amber-200/80 pb-1.5">
                <span className="font-bold text-[11px] text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-amber-600" />
                  {isHindi ? 'व्यक्तिगत खेल तापीय तनाव मूल्यांकन' : 'Personalized Sport Heat Assessment'}
                </span>
                <span className="text-[9.5px] font-bold bg-amber-200 text-amber-900 px-2 py-0.2 rounded-full uppercase">
                  {sportAssessment.zone}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                <div className="p-2 rounded-lg bg-white border border-amber-200">
                  <span className="text-[10px] text-slate-500 block">{isHindi ? 'अनुमानित WBGT' : 'Estimated WBGT'}</span>
                  <span className="text-sm font-extrabold text-amber-900">{sportAssessment.estimated_wbgt ?? '--'}°C</span>
                </div>
                <div className="p-2 rounded-lg bg-white border border-amber-200">
                  <span className="text-[10px] text-slate-500 block">{isHindi ? 'आपकी व्यक्तिगत सीमा' : 'Your Caution Limit'}</span>
                  <span className="text-sm font-extrabold text-slate-900">{sportAssessment.personalized_limit ?? '--'}°C</span>
                </div>
              </div>

              <div className="text-[10.5px] text-slate-700 leading-snug pt-1">
                <span><strong>{isHindi ? 'आपकी प्रोफ़ाइल सीमाएं:' : 'Your threshold considers:'}</strong></span>
                <div className="flex items-center gap-1.5 mt-1 flex-wrap font-mono text-[10px]">
                  <span className="px-2 py-0.5 rounded bg-white border border-amber-200 text-amber-900">
                    Experience: {sportAssessment.experience_level}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-white border border-amber-200 text-amber-900">
                    Risk: {sportAssessment.risk_tolerance}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-white border border-amber-200 text-amber-900">
                    Age Group: {sportAssessment.age_group}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* 7. What This Means Section */}
          <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-xs space-y-1">
            <span className="font-bold text-[10.5px] text-[#1F5C8B] uppercase tracking-wider block">
              {isHindi ? 'इसका क्या अर्थ है' : 'What This Means'}
            </span>
            <p className="text-[11.5px] text-slate-700 leading-relaxed font-medium">
              {item.what_this_means || (isGo
                ? (isHindi
                    ? 'मौसम की स्थितियां आपकी गतिविधि समय-विंडो के अनुकूल हैं और कोई बड़ा बदलाव आवश्यक नहीं है।'
                    : 'Weather conditions remain within safe operational parameters during your scheduled window.')
                : item.summary)}
            </p>
          </div>

          {/* 8. Recommended Action Section */}
          <div className="p-3 rounded-xl bg-emerald-50/80 border border-emerald-200 shadow-xs space-y-1 text-emerald-950">
            <span className="font-bold text-[10.5px] text-emerald-900 uppercase tracking-wider block">
              💡 {isHindi ? 'अनुशंसित कदम' : 'Recommended Action'}
            </span>
            <p className="text-[11.5px] text-emerald-900 leading-relaxed font-semibold">
              {item.recommended_action || (isGo
                ? (isHindi ? 'योजना के अनुसार आगे बढ़ें। जलयोजन बनाए रखें।' : 'Proceed as planned. Stay hydrated and monitor local forecast.')
                : item.summary)}
            </p>
          </div>

          {/* 9. Suggested Alternative Window Callout */}
          {altWindow && altWindow.available && (
            <div className="p-3 rounded-xl bg-sky-50 border border-sky-200 shadow-xs text-sky-950 space-y-1">
              <span className="font-bold text-[10.5px] text-[#1F5C8B] uppercase tracking-wider flex items-center gap-1">
                <ArrowRight className="w-3.5 h-3.5 text-sky-600" />
                {isHindi ? 'सुझाया गया वैकल्पिक समय विंडोज़' : 'Suggested Alternative Window'}
              </span>
              <div className="flex items-center justify-between text-xs font-bold text-[#1F5C8B]">
                <span>🕒 {altWindow.start} – {altWindow.end} ({altWindow.block_name})</span>
              </div>
              <p className="text-[10.5px] text-slate-600 mt-0.5">
                {altWindow.reason}
              </p>
            </div>
          )}

        </div>

        {/* 10. Modal Footer */}
        <div className="p-3 bg-white border-t border-slate-200 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 font-mono">
            {isHindi ? 'मौसम सलाह विवरण' : 'Verified weather intelligence'}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#1F5C8B] hover:bg-[#164467] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
          >
            {isHindi ? 'वापस जाएं' : 'Done / Close'}
          </button>
        </div>

      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, document.body);
}
