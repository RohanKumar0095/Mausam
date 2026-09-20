import React, { useState, useEffect } from 'react';
import { 
  CalendarDays, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  HelpCircle, 
  Clock, 
  ArrowRight, 
  Footprints, 
  GraduationCap, 
  Briefcase, 
  Sprout, 
  Car, 
  Trophy,
  RefreshCw,
  Plus,
  Sparkles,
  Info
} from 'lucide-react';
import { useI18n } from '../../i18n/i18nContext';
import { fetchDailyPlanRecommendations } from '../../services/recommendationService';
import RecommendationDetailModal from './RecommendationDetailModal';

const ACTIVITY_ICON_MAP = {
  running: Footprints,
  walking: Footprints,
  cycling: Footprints,
  college: GraduationCap,
  school: GraduationCap,
  office: Briefcase,
  commute: Car,
  sports: Trophy,
  farm_work: Sprout
};

export default function DailyPlanCard({
  userId = 'usr_demo',
  weatherData = {},
  routine = [],
  selectedPersonas = ['daily_life'],
  onEditRoutine
}) {
  const { language } = useI18n();
  const isHindi = language === 'hi' || language === 'Hindi';

  const [planData, setPlanData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedDetailItem, setSelectedDetailItem] = useState(null);

  const loadPlan = async () => {
    if (!routine || routine.length === 0) {
      setPlanData({ total_activities: 0, activities: [] });
      return;
    }

    setLoading(true);
    try {
      const data = await fetchDailyPlanRecommendations({
        userId,
        date: new Date().toISOString().split('T')[0],
        selectedPersonas,
        routine,
        weatherData
      });
      setPlanData(data);
    } catch (err) {
      console.error('Failed to load recommendations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlan();
  }, [routine, weatherData, selectedPersonas]);

  const activities = planData?.activities || [];
  const primaryRec = planData?.primary_recommendation || planData?.primary_decision_insight;

  return (
    <div className="mx-4 p-4 rounded-mausam bg-gradient-to-br from-slate-900/90 via-sky-950/80 to-slate-900/90 backdrop-blur-md border border-sky-400/35 shadow-xl text-white space-y-4 animate-fadeIn">
      
      {/* 1. LAYER 2 UNIFIED HEADER: RECOMMENDED */}
      <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-sky-500/20 text-sky-300 border border-sky-400/30">
            <Sparkles className="w-4 h-4 text-amber-300" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
              <span>{isHindi ? 'अनुशंसित (RECOMMENDED)' : 'RECOMMENDED'}</span>
              <span className="bg-sky-400/20 text-sky-200 text-[9.5px] font-mono px-2 py-0.2 rounded-full border border-sky-300/30">
                {isHindi ? 'पूर्वाभास आधारित' : 'Forecast-Based Intelligence'}
              </span>
            </h3>
            <p className="text-[10.5px] text-sky-200/80 mt-0.5">
              {planData?.plan_subtitle || (isHindi ? 'आपकी आगामी गतिविधियों के लिए मौसम सलाह' : 'Personalized forecast-based guidance for your upcoming schedule')}
            </p>
          </div>
        </div>

        {routine && routine.length > 0 && (
          <button
            onClick={loadPlan}
            className="p-1.5 rounded-full hover:bg-white/15 text-sky-200 transition-colors"
            title={isHindi ? 'ताज़ा करें' : 'Refresh Recommendations'}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        )}
      </div>

      {/* 2. Empty State (When user has 0 activities in Daily Weather Routine) */}
      {(!routine || routine.length === 0) ? (
        <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center space-y-3 py-6">
          <div className="w-10 h-10 rounded-full bg-sky-500/10 border border-sky-400/20 text-sky-300 mx-auto flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h4 className="font-bold text-xs text-white">
              {isHindi ? 'कोई गतिविधि निर्धारित नहीं है।' : 'No activities scheduled in your routine.'}
            </h4>
            <p className="text-[11px] text-sky-200/80 max-w-sm mx-auto leading-relaxed">
              {isHindi
                ? 'अपनी दैनिक मौसम दिनचर्या में गतिविधियां जोड़ें और मौसम आपके समय के अनुसार मौसम का विश्लेषण करेगा।'
                : 'Add activities to your Daily Weather Routine to receive personalized, forecast-based recommendations.'}
            </p>
          </div>

          <button
            onClick={onEditRoutine}
            className="px-4 py-2 rounded-xl bg-[#1F5C8B] hover:bg-[#164467] text-white text-xs font-semibold shadow-md border border-sky-300/30 transition-all inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>{isHindi ? '+ दिनचर्या गतिविधि जोड़ें' : '+ Add Routine Activity'}</span>
          </button>
        </div>
      ) : loading ? (
        <div className="py-6 text-center text-xs text-sky-200/70 font-mono animate-pulse">
          ⚡ {isHindi ? 'पूर्वाभास मौसम विश्लेषण हो रहा है...' : 'Analyzing forecast conditions for your upcoming schedule...'}
        </div>
      ) : (
        <div className="space-y-3.5">
          {/* 3. EMBEDDED PRIMARY RECOMMENDATION BANNER */}
          {primaryRec && (
            <div className={`p-3.5 rounded-xl border flex flex-col gap-2 transition-all shadow-md ${
              primaryRec.status === 'GO'
                ? 'bg-emerald-950/35 border-emerald-500/40 text-emerald-100'
                : primaryRec.status === 'MODIFY'
                  ? 'bg-amber-950/35 border-amber-400/40 text-amber-100'
                  : 'bg-rose-950/40 border-rose-500/45 text-rose-100'
            }`}>
              <div className="flex items-center justify-between gap-2 flex-wrap border-b border-white/10 pb-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-400/20 text-amber-200 border border-amber-300/40 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-amber-300" />
                    {isHindi ? 'प्राथमिक सलाह' : 'PRIMARY RECOMMENDATION'}
                  </span>
                  {primaryRec.target_activity && (
                    <span className="text-[11px] font-semibold text-sky-100">
                      Focus: {primaryRec.target_activity} {primaryRec.target_occurrence_label ? `(${primaryRec.target_occurrence_label})` : ''}
                    </span>
                  )}
                </div>

                <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border flex items-center gap-1 uppercase tracking-wider ${
                  primaryRec.status === 'GO'
                    ? 'bg-emerald-500/30 border-emerald-400/50 text-emerald-200'
                    : primaryRec.status === 'MODIFY'
                      ? 'bg-amber-500/30 border-amber-400/50 text-amber-200'
                      : 'bg-rose-600/40 border-rose-400/60 text-rose-100'
                }`}>
                  {primaryRec.status === 'GO' && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                  {primaryRec.status === 'MODIFY' && <AlertTriangle className="w-3 h-3 text-amber-300" />}
                  {primaryRec.status === 'RESCHEDULE' && <XCircle className="w-3 h-3 text-rose-400" />}
                  ✓ {primaryRec.status}
                </span>
              </div>

              <h4 className="text-xs font-bold text-amber-200 leading-snug">
                {primaryRec.headline}
              </h4>

              <p className="text-[11.5px] text-sky-100 leading-relaxed font-normal">
                {primaryRec.recommendation}
              </p>
            </div>
          )}

          {/* 4. UPCOMING ACTIVITIES LIST SUBSECTION */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between text-[11px] font-bold text-sky-200 uppercase tracking-wider">
              <span>{isHindi ? 'आगामी गतिविधियां' : 'UPCOMING ACTIVITIES'}</span>
              <span className="text-[10px] font-mono text-sky-300/70 font-normal">
                {activities.length} {isHindi ? 'गतिविधियां' : 'Scheduled'}
              </span>
            </div>

            <div className="space-y-2.5">
              {activities.map((item) => {
                const Icon = ACTIVITY_ICON_MAP[item.activity_type] || Footprints;
                const isGo = item.status === 'GO';
                const isModify = item.status === 'MODIFY';
                const isReschedule = item.status === 'RESCHEDULE';
                const isCurrentlyActive = item.is_active || item.occurrence_status === 'active';

                return (
                  <div 
                    key={item.activity_id}
                    className={`p-3 rounded-xl border transition-all flex flex-col gap-2 ${
                      isGo
                        ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-100'
                        : isModify
                          ? 'bg-amber-950/30 border-amber-400/40 text-amber-100'
                          : isReschedule
                            ? 'bg-rose-950/35 border-rose-500/40 text-rose-100'
                            : 'bg-slate-800/40 border-slate-600/40 text-slate-200'
                    }`}
                  >
                    {/* Title, Time Window & Status Badge */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className={`p-1.5 rounded-lg shrink-0 ${
                          isGo ? 'bg-emerald-500/20 text-emerald-300' : isModify ? 'bg-amber-500/20 text-amber-300' : 'bg-rose-500/20 text-rose-300'
                        }`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h4 className="font-bold text-[13px] capitalize truncate text-white">
                              {item.activity_label}
                            </h4>
                            {item.display_label && (
                              <span className={`px-2 py-0.2 rounded text-[9px] font-extrabold uppercase font-mono tracking-wider border ${
                                isCurrentlyActive 
                                  ? 'bg-amber-400/30 text-amber-200 border-amber-400/50 animate-pulse' 
                                  : 'bg-sky-400/20 text-sky-200 border-sky-300/30'
                              }`}>
                                {isCurrentlyActive ? '⚡ CURRENTLY ACTIVE' : `📅 ${item.display_label}`}
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-sky-200/80 font-mono truncate mt-0.5">
                            🕒 {item.time_window} • 📍 {item.location}
                          </p>
                        </div>
                      </div>

                      {/* Status Badge */}
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider shrink-0 flex items-center gap-1 border ${
                        isGo
                          ? 'bg-emerald-500/30 border-emerald-400/50 text-emerald-200'
                          : isModify
                            ? 'bg-amber-500/30 border-amber-400/50 text-amber-200'
                            : isReschedule
                              ? 'bg-rose-600/40 border-rose-400/60 text-rose-100'
                              : 'bg-slate-700/50 border-slate-500 text-slate-300'
                      }`}>
                        {isGo && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                        {isModify && <AlertTriangle className="w-3 h-3 text-amber-300" />}
                        {isReschedule && <XCircle className="w-3 h-3 text-rose-400" />}
                        ✓ {item.status}
                      </span>
                    </div>

                    {/* Concise Summary */}
                    <p className="text-[11.5px] leading-snug pl-0.5 text-slate-200">
                      {item.summary}
                    </p>

                    {/* Bottom Row: Detailed Explanation Trigger Button */}
                    <div className="pt-1.5 border-t border-white/10 flex items-center justify-between gap-2">
                      <span className="text-[10px] text-sky-200/70 font-mono">
                        {item.flexible ? (isHindi ? 'लचीला समय' : 'Flexible schedule') : (isHindi ? 'निश्चित समय' : 'Fixed schedule')}
                      </span>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDetailItem(item);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-sky-200 hover:text-white text-[10.5px] font-medium border border-sky-300/30 transition-all flex items-center gap-1 shrink-0 cursor-pointer active:scale-95"
                      >
                        <HelpCircle className="w-3 h-3 text-sky-300" />
                        <span>{isHindi ? 'यह सलाह क्यों?' : 'Why this recommendation?'}</span>
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 5. Detailed "Why This Recommendation?" Modal */}
      <RecommendationDetailModal
        isOpen={!!selectedDetailItem}
        onClose={() => setSelectedDetailItem(null)}
        item={selectedDetailItem}
        allSignals={planData?.signals || []}
      />

    </div>
  );
}

