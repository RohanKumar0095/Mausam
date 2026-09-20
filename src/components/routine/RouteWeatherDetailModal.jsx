import React from 'react';
import { 
  X, 
  MapPin, 
  Clock, 
  ArrowRight, 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  Navigation, 
  Droplets, 
  Wind, 
  Flame, 
  Eye, 
  Footprints,
  Car,
  GraduationCap,
  Briefcase,
  Trophy,
  Sprout,
  PartyPopper,
  Compass,
  Activity,
  Zap
} from 'lucide-react';
import { useI18n } from '../../i18n/i18nContext';
import { formatTimeRange12h } from '../../utils/timeUtils';
import { evaluateRouteWeather } from '../../engine/routeWeatherEngine';

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

export default function RouteWeatherDetailModal({
  isOpen,
  onClose,
  activity,
  baseLocation = {},
  weatherData = {},
  safetyInfo = {},
  selectedPersonas = ['daily_life'],
  allLocations = []
}) {
  const { language } = useI18n();
  const isHindi = language === 'hi' || language === 'Hindi';

  if (!isOpen || !activity) return null;

  const evaluation = evaluateRouteWeather({
    activity,
    baseLocation,
    weatherData,
    safetyInfo,
    selectedPersonas,
    allLocations,
    language
  });

  const Icon = ACTIVITY_ICON_MAP[activity.type] || Clock;
  const checkpoints = evaluation.checkpoints || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-fadeIn">
      <div className="bg-[#F4F8FB] w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-300 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* 1. Modal Top Header */}
        <div className="bg-[#1F5C8B] px-4 py-3 text-white flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center shrink-0 border border-white/30">
              <Icon className="w-5 h-5 text-sky-200" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-bold truncate tracking-tight">{activity.label}</h3>
                <span className="bg-sky-400/25 text-sky-100 text-[10px] font-mono px-2 py-0.5 rounded-full border border-sky-300/30 shrink-0">
                  🕒 {evaluation.timeWindow}
                </span>
                <span className="bg-emerald-500/25 text-emerald-100 text-[10px] font-mono px-2 py-0.5 rounded-full border border-emerald-400/30 shrink-0">
                  📏 {evaluation.routeDistanceFormatted}
                </span>
              </div>
              <p className="text-[11px] text-sky-200 truncate mt-0.5 flex items-center gap-1.5 font-medium">
                <span>📍 {evaluation.route.start.name}</span>
                <ArrowRight className="w-3.5 h-3.5 inline text-sky-300 shrink-0" />
                <span>📍 {evaluation.route.destination.name}</span>
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
        <div className="p-4 overflow-y-auto space-y-3.5 text-xs text-slate-800">
          
          {/* 2. Overall Route Suitability & Risk Banner */}
          <div 
            className="p-3.5 rounded-xl border flex items-start gap-3 shadow-xs"
            style={{ 
              backgroundColor: evaluation.isSevere ? '#FEF2F2' : (evaluation.suitability === 'FAVORABLE' ? '#ECFDF5' : '#FFFBEB'),
              borderColor: evaluation.isSevere ? '#FCA5A5' : (evaluation.suitability === 'FAVORABLE' ? '#A7F3D0' : '#FDE68A')
            }}
          >
            {evaluation.isSevere ? (
              <ShieldAlert className="w-6 h-6 text-rose-600 shrink-0 mt-0.5 animate-bounce" />
            ) : evaluation.suitability === 'FAVORABLE' ? (
              <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
            )}

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <span 
                    className="font-bold text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full text-white"
                    style={{ backgroundColor: evaluation.suitabilityColor }}
                  >
                    {evaluation.suitabilityLabel}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-slate-900 text-white">
                    {isHindi ? 'कुल जोखिम:' : 'Overall Risk:'} {evaluation.overallRisk}
                  </span>
                </div>
                <span className="text-[10.5px] text-slate-600 font-mono font-medium">
                  {evaluation.pointsAnalyzed} {isHindi ? 'मार्ग बिंदु विश्लेषित' : 'Weather Points Analyzed'}
                </span>
              </div>

              <h4 className="font-semibold text-xs text-slate-900 mt-1.5 leading-snug">
                {evaluation.summaryHeadline}
              </h4>
              <p className="text-[11.5px] text-slate-700 mt-0.5 leading-relaxed">
                {evaluation.summaryAdvice}
              </p>

              {evaluation.highestRiskSegment && (
                <div className="mt-2 pt-2 border-t border-slate-300/50 flex items-center gap-1.5 text-[10.5px] text-rose-900 font-medium">
                  <Zap className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                  <span><strong>{isHindi ? 'उच्चतम जोखिम बिंदु:' : 'Highest Risk Segment:'}</strong> {evaluation.highestRiskSegment}</span>
                </div>
              )}
            </div>
          </div>

          {/* 3. Route Weather Progress Visualization (Horizontal Journey Flow) */}
          <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="font-bold text-[11px] text-[#1F5C8B] uppercase tracking-wider flex items-center gap-1.5">
                <Navigation className="w-3.5 h-3.5 text-[#1F5C8B]" />
                {isHindi ? 'मार्ग मौसम प्रगति रेखा (स्थान + समय सिंक)' : 'Route Weather Journey Progress (Space + Time Aware)'}
              </span>
              <span className="text-[10px] text-slate-500 font-mono font-medium">
                📍 {evaluation.routeDistanceFormatted}
              </span>
            </div>

            {/* Dynamic Checkpoints Grid / Horizontal Progress */}
            <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-5 gap-2 relative">
              {checkpoints.map((chk, idx) => {
                const isStart = idx === 0;
                const isEnd = idx === checkpoints.length - 1;

                return (
                  <div 
                    key={idx}
                    className={`p-2.5 rounded-xl border flex flex-col justify-between transition-all relative ${
                      chk.riskLevel === 'HIGH'
                        ? 'bg-rose-50/80 border-rose-300 text-rose-950'
                        : chk.riskLevel === 'MODERATE'
                          ? 'bg-amber-50/80 border-amber-300 text-amber-950'
                          : 'bg-[#F4F8FB] border-slate-200 text-slate-900'
                    }`}
                  >
                    {/* Header: Progress & Time */}
                    <div>
                      <div className="flex items-center justify-between text-[9.5px] font-mono font-bold uppercase text-slate-500 mb-1">
                        <span className="flex items-center gap-1">
                          <span className={`w-2 h-2 rounded-full ${isStart ? 'bg-[#1F5C8B]' : isEnd ? 'bg-amber-600' : 'bg-sky-500'}`} />
                          {isStart ? (isHindi ? 'प्रारंभ' : 'Start') : isEnd ? (isHindi ? 'गंतव्य' : 'End') : `${chk.progressPct}%`}
                        </span>
                        <span className="text-sky-900 font-bold bg-white px-1.5 py-0.2 rounded border border-slate-200">
                          {chk.time}
                        </span>
                      </div>

                      <h5 className="font-bold text-slate-900 text-[11.5px] truncate" title={chk.name}>
                        {chk.name}
                      </h5>

                      <div className="flex items-center justify-between mt-1 text-xs">
                        <span className="text-base">{chk.icon}</span>
                        <span className="font-extrabold text-slate-900">{chk.temp}</span>
                      </div>

                      <p className="text-[10px] font-medium text-slate-600 truncate mt-0.5">
                        {chk.condition}
                      </p>
                    </div>

                    {/* Footer Metrics per Checkpoint */}
                    <div className="mt-2 pt-1.5 border-t border-slate-200/80 text-[10px] space-y-0.5 font-medium">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">{isHindi ? 'वर्षा:' : 'Rain:'}</span>
                        <span className={`font-bold ${chk.rainProb >= 60 ? 'text-rose-600 font-extrabold' : 'text-sky-700'}`}>
                          {chk.rainProb}% 💧
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">{isHindi ? 'हवा:' : 'Wind:'}</span>
                        <span className="text-slate-800">{chk.windSpeed}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">{isHindi ? 'सतह:' : 'Surface:'}</span>
                        <span className="text-slate-800 truncate font-semibold">{chk.surfaceCondition}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <p className="text-[9.5px] text-slate-400 font-mono text-center pt-1">
              {isHindi
                ? 'ℹ️ मार्ग के प्रत्येक बिंदु का मौसम वास्तविक भौगोलिक स्थिति (अक्षांश/देशांतर) और अनुमानित आगमन समय से सिंक है।'
                : 'ℹ️ Weather at each checkpoint is sampled geographically along route coordinates at estimated arrival time.'}
            </p>
          </div>

          {/* 4. Localized Weather Changes Detection */}
          {evaluation.localizedTransitions && evaluation.localizedTransitions.length > 0 && (
            <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-xs">
              <div className="flex items-center gap-1.5 mb-2 border-b border-slate-100 pb-1.5">
                <Activity className="w-3.5 h-3.5 text-[#1F5C8B]" />
                <span className="font-bold text-[11px] text-[#1F5C8B] uppercase tracking-wider">
                  {isHindi ? 'स्थानिक मौसम परिवर्तन की पहचान' : 'Localized Weather Transitions'}
                </span>
              </div>
              <div className="space-y-1.5">
                {evaluation.localizedTransitions.map((trans, idx) => (
                  <div key={idx} className="p-2 rounded-lg bg-[#F4F8FB] text-slate-800 text-[11px] font-medium leading-snug border border-slate-200">
                    {trans}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 5. Time-Window Forecast Timeline */}
          {evaluation.timeSlots && evaluation.timeSlots.length > 0 && (
            <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-[11px] text-slate-700 uppercase tracking-wider flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-sky-600" />
                  {isHindi ? 'समय सारणी स्लॉट पूर्वाअनुसार मौसम' : 'Time-Window Forecast Timeline'}
                </span>
                <span className="text-[10px] text-slate-500 font-mono font-semibold">{formatTimeRange12h(activity.startTime, activity.endTime)}</span>
              </div>

              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar scrollbar-hide py-1">
                {evaluation.timeSlots.map((slot, idx) => (
                  <div key={idx} className="flex-1 min-w-[90px] p-2 rounded-lg bg-[#F4F8FB] border border-slate-200 text-center text-xs">
                    <span className="text-[10px] font-mono font-bold text-[#1F5C8B] block">{slot.time}</span>
                    <span className="text-base my-0.5 block">🌤️</span>
                    <span className="font-bold text-slate-900 block text-[11.5px]">{slot.temp}°C</span>
                    <span className="text-[9.5px] text-sky-700 font-medium block">{slot.pop ?? 15}% 💧</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 6. Route Environmental & Surface Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-center shadow-xs">
              <span className="text-[10px] text-slate-500 block uppercase font-medium flex items-center justify-center gap-1">
                <Droplets className="w-3.5 h-3.5 text-sky-600" />
                {isHindi ? 'अधिकतम वर्षा' : 'Max Rain Risk'}
              </span>
              <span className="font-bold text-slate-900 text-sm block mt-0.5">
                {evaluation.metrics.rainProb}
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-center shadow-xs">
              <span className="text-[10px] text-slate-500 block uppercase font-medium flex items-center justify-center gap-1">
                <Wind className="w-3.5 h-3.5 text-teal-600" />
                {isHindi ? 'अधिकतम हवा' : 'Max Wind Speed'}
              </span>
              <span className="font-bold text-slate-900 text-sm block mt-0.5">
                {evaluation.metrics.wind}
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-center shadow-xs">
              <span className="text-[10px] text-slate-500 block uppercase font-medium flex items-center justify-center gap-1">
                <Flame className="w-3.5 h-3.5 text-[#D85A30]" />
                {isHindi ? 'तापीय तनाव (WBGT)' : 'Heat Stress (WBGT)'}
              </span>
              <span className="font-bold text-slate-900 text-sm block mt-0.5">
                {evaluation.metrics.wbgt}
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-center shadow-xs">
              <span className="text-[10px] text-slate-500 block uppercase font-medium flex items-center justify-center gap-1">
                <Eye className="w-3.5 h-3.5 text-indigo-600" />
                {isHindi ? 'न्यूनतम दृश्यता' : 'Min Visibility'}
              </span>
              <span className="font-bold text-slate-900 text-sm block mt-0.5">
                {evaluation.metrics.visibility}
              </span>
            </div>
          </div>

        </div>

        {/* 7. Modal Footer */}
        <div className="p-3 bg-white border-t border-slate-200 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 font-mono truncate">
            {activity.notes ? `📝 ${activity.notes}` : (isHindi ? 'मार्ग-आधारित मौसम विश्लेषण' : 'Space & time aware route weather')}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#1F5C8B] hover:bg-[#164467] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors shrink-0"
          >
            {isHindi ? 'वापस जाएं' : 'Done / Close'}
          </button>
        </div>

      </div>
    </div>
  );
}
