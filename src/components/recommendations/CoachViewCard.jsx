import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  Users, 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  UserX, 
  Activity, 
  Flame, 
  Wind, 
  Droplets 
} from 'lucide-react';
import { useI18n } from '../../i18n/i18nContext';
import { fetchCoachTeamRecommendations } from '../../services/recommendationService';

export default function CoachViewCard({
  locationName = 'Ranchi Sports Complex',
  sport = 'running',
  sessionBlock = 'evening',
  weatherData = {}
}) {
  const { language } = useI18n();
  const isHindi = language === 'hi' || language === 'Hindi';

  const [teamData, setTeamData] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadTeamPlan = async () => {
    setLoading(true);
    try {
      const data = await fetchCoachTeamRecommendations({
        location: locationName,
        sport,
        sessionBlock,
        weatherData
      });
      setTeamData(data);
    } catch (err) {
      console.error('Failed to load coach team recommendations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeamPlan();
  }, [locationName, sport, sessionBlock, weatherData]);

  const aggregateDecision = teamData?.aggregate_decision || 'Proceed';
  const flaggedAthletes = teamData?.flagged_athletes || [];

  const isReschedule = aggregateDecision.includes('Reschedule');
  const isModify = aggregateDecision.includes('modifications');

  return (
    <div className="mx-4 p-4 rounded-mausam bg-gradient-to-br from-slate-900/95 via-sky-950/90 to-slate-900/95 backdrop-blur-md border border-amber-400/40 shadow-2xl text-white space-y-3.5 animate-fadeIn">
      
      {/* 1. Top Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-400/30">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-200">
                {isHindi ? 'कोच / टीम निर्णय दृश्य' : 'Coach & Team View'}
              </h3>
              <span className="bg-amber-400/20 text-amber-200 text-[9.5px] font-mono px-2 py-0.2 rounded-full border border-amber-300/30">
                {isHindi ? 'दस्ता निर्णय' : 'Squad Heat & Weather Safety'}
              </span>
            </div>
            <p className="text-[10.5px] text-sky-200/80 mt-0.5">
              📍 {locationName} • {sport.toUpperCase()} • 🕒 {teamData?.time_window || '17:00 – 19:30'}
            </p>
          </div>
        </div>

        <button
          onClick={loadTeamPlan}
          className="p-1.5 rounded-full hover:bg-white/15 text-amber-300 transition-colors"
          title={isHindi ? 'ताज़ा करें' : 'Refresh Squad Call'}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* 2. Aggregate Team Call Banner */}
      {loading ? (
        <div className="py-5 text-center text-xs text-amber-200/70 font-mono animate-pulse">
          ⚡ {isHindi ? 'टीम के सभी खिलाड़ियों का व्यक्तिगत तापीय तनाव विश्लेषित हो रहा है...' : 'Evaluating personalized WBGT & weather limits for all squad members...'}
        </div>
      ) : (
        <div className={`p-3.5 rounded-xl border flex items-start gap-3 shadow-xs ${
          isReschedule
            ? 'bg-rose-950/40 border-rose-500/50 text-rose-100'
            : isModify
              ? 'bg-amber-950/40 border-amber-400/50 text-amber-100'
              : 'bg-emerald-950/40 border-emerald-500/50 text-emerald-100'
        }`}>
          {isReschedule ? (
            <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5 animate-bounce" />
          ) : isModify ? (
            <AlertTriangle className="w-5 h-5 text-amber-300 shrink-0 mt-0.5" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider text-white ${
                isReschedule ? 'bg-rose-600' : isModify ? 'bg-amber-600' : 'bg-emerald-600'
              }`}>
                {aggregateDecision}
              </span>
              <span className="text-[10.5px] font-mono text-slate-300">
                👥 {teamData?.total_athletes || 0} {isHindi ? 'खिलाड़ी' : 'Squad Members'} (⚠️ {teamData?.flagged_count || 0} {isHindi ? 'चिह्नित' : 'Flagged'})
              </span>
            </div>

            <h4 className="font-semibold text-[12.5px] text-white mt-1.5 leading-snug">
              {teamData?.summary_reason}
            </h4>
          </div>
        </div>
      )}

      {/* 3. Individually Flagged Squad Members */}
      {flaggedAthletes.length > 0 && (
        <div className="space-y-2 pt-1 border-t border-white/10">
          <span className="text-[10.5px] font-bold text-amber-200 uppercase tracking-wider block">
            {isHindi ? 'व्यक्तिगत रूप से चिह्नित खिलाड़ी (जोखिम अलर्ट)' : 'Individually Flagged Squad Members'}
          </span>

          <div className="space-y-2">
            {flaggedAthletes.map((ath) => (
              <div 
                key={ath.athlete_id}
                className="p-2.5 rounded-xl bg-white/10 border border-white/15 flex flex-col gap-1 text-xs"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <UserX className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    <span className="font-bold text-white text-[12px] truncate">{ath.name}</span>
                    <span className="text-[9.5px] text-sky-200 font-mono px-1.5 py-0.2 rounded bg-sky-950 border border-sky-500/30 shrink-0">
                      {ath.age_group} • {ath.experience_level} • {ath.risk_tolerance}
                    </span>
                  </div>

                  <span className="text-[10px] font-bold text-rose-300 bg-rose-950/60 px-2 py-0.2 rounded border border-rose-500/40 shrink-0">
                    {ath.individual_status}
                  </span>
                </div>

                <p className="text-[11px] text-slate-200 leading-snug pl-5">
                  {ath.flag_reason}
                </p>

                <div className="pl-5 pt-0.5 text-[10px] font-mono text-amber-300 flex items-center gap-2">
                  <span>🎯 {isHindi ? 'व्यक्तिगत WBGT सीमा:' : 'Personalized WBGT Limit:'} {ath.personalized_wbgt_limit}°C</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
