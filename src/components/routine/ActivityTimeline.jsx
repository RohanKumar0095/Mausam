import React from 'react';
import DraggableScrollRow from '../common/DraggableScrollRow';
import { 
  Footprints, 
  Car, 
  PartyPopper, 
  Sprout, 
  GraduationCap, 
  Briefcase, 
  Baby, 
  Plane, 
  Palmtree, 
  Trophy, 
  Building2, 
  Clock,
  Plus,
  Edit3,
  Navigation
} from 'lucide-react';
import { useI18n } from '../../i18n/i18nContext';
import { parseTime, formatTimeRange12h } from '../../utils/timeUtils';

const ICON_MAP = {
  running: Footprints,
  walking: Footprints,
  cycling: Footprints,
  college: GraduationCap,
  school: Baby,
  office: Briefcase,
  commute: Car,
  travel: Plane,
  outdoor_event: PartyPopper,
  farm_work: Sprout,
  beach: Palmtree,
  sports: Trophy,
  indoor: Building2,
  other: Clock
};

export default function ActivityTimeline({
  routine = [],
  currentTime = '06:30',
  onEditRoutine,
  onSelectRoutine
}) {
  const { language, t } = useI18n();
  const isHindi = language === 'hi' || language === 'Hindi';

  const parsedNow = parseTime(currentTime);
  const currentMinutes = parsedNow.hour24 * 60 + parsedNow.minute;

  return (
    <div className="w-full py-2">
      <div className="px-4 flex items-center justify-between text-xs text-white/80 mb-2">
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-sky-300" />
          <span className="font-medium text-white">{t('home_daily_weather_routine') || 'Daily Weather Routine'}</span>
          <span className="text-[10px] text-sky-200/80 ml-1 hidden sm:inline">
            ({isHindi ? 'मार्ग मौसम देखने के लिए कार्ड पर टैप करें' : 'Tap card for route weather'})
          </span>
        </div>
        <button
          onClick={onEditRoutine}
          className="text-sky-300 hover:text-white flex items-center gap-1 text-[11px] font-medium transition-colors"
        >
          <Edit3 className="w-3 h-3" />
          <span>{t('home_edit_routine') || 'Edit Routine'}</span>
        </button>
      </div>

      <DraggableScrollRow className="items-stretch gap-2.5 py-1 px-4">
        {routine.map(act => {
          const Icon = ICON_MAP[act.type] || Clock;
          const startP = parseTime(act.startTime);
          const endP = parseTime(act.endTime);
          const startMin = startP.hour24 * 60 + startP.minute;
          const endMin = endP.hour24 * 60 + endP.minute;

          const isActive = currentMinutes >= startMin && currentMinutes < endMin;

          return (
            <button
              key={act.id}
              type="button"
              onClick={() => onSelectRoutine && onSelectRoutine(act)}
              className={`flex-shrink-0 w-48 min-w-[192px] text-left rounded-mausam p-2.5 transition-all border select-none group cursor-pointer hover:scale-[1.02] active:scale-[0.98] ${
                isActive
                  ? 'bg-white text-slate-900 border-amber-400 shadow-md ring-2 ring-amber-400/40'
                  : 'bg-white/10 backdrop-blur-md text-white border-white/15 hover:bg-white/20 hover:border-sky-300/40'
              }`}
              title={isHindi ? `${act.label} का मार्ग मौसम देखें` : `View route weather for ${act.label}`}
            >
              <div className="flex items-center justify-between gap-1 mb-1">
                <span className={`text-[10px] font-mono font-medium ${isActive ? 'text-amber-700' : 'text-sky-200'}`}>
                  {formatTimeRange12h(act.startTime, act.endTime)}
                </span>
                {isActive ? (
                  <span className="bg-amber-500 text-slate-950 text-[9px] font-bold px-1.5 py-0.2 rounded-full animate-pulse">
                    {t('home_active_now') || 'ACTIVE NOW'}
                  </span>
                ) : (
                  <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-medium flex items-center gap-0.5 transition-colors ${
                    (act.isRoute || act.location?.includes('→') || act.location?.includes('->'))
                      ? 'bg-sky-500/20 text-sky-200 border border-sky-300/30'
                      : 'text-sky-200/70'
                  }`}>
                    <Navigation className="w-2.5 h-2.5 text-sky-300" />
                    <span>{(act.isRoute || act.location?.includes('→') || act.location?.includes('->')) ? (isHindi ? 'मार्ग मौसम' : 'Route Weather') : (isHindi ? 'स्थान' : 'Location')}</span>
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5 my-1">
                <div className={`p-1 rounded shrink-0 ${isActive ? 'bg-amber-100 text-amber-800' : 'bg-white/20 text-white'}`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <h5 className={`text-[12px] font-medium truncate ${isActive ? 'text-slate-900' : 'text-white'}`}>
                  {act.label}
                </h5>
              </div>

              <div className="flex items-center justify-between gap-1 mt-1 pt-1 border-t border-white/10">
                <p className={`text-[10.5px] truncate font-normal ${isActive ? 'text-slate-500' : 'text-sky-100/70'}`}>
                  📍 {act.location}
                </p>
                <span className={`text-[9.5px] font-medium shrink-0 flex items-center gap-0.5 ${isActive ? 'text-[#1F5C8B]' : 'text-sky-300 group-hover:underline'}`}>
                  <span>{isHindi ? 'मौसम' : 'Weather'}</span>
                  <span className="text-[11px] leading-none">›</span>
                </span>
              </div>
            </button>
          );
        })}

        <button
          onClick={onEditRoutine}
          className="flex-shrink-0 w-24 min-w-[96px] rounded-mausam border border-dashed border-white/30 bg-white/5 hover:bg-white/10 flex flex-col items-center justify-center p-2 text-white/70 hover:text-white transition-all text-center gap-1 select-none"
        >
          <Plus className="w-4 h-4" />
          <span className="text-[10px] font-normal">{t('home_add_activity') || 'Add Activity'}</span>
        </button>

        <div className="w-3 flex-shrink-0" aria-hidden="true" />
      </DraggableScrollRow>
    </div>
  );
}
