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
  Edit3
} from 'lucide-react';

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
  onEditRoutine
}) {
  const [currH, currM] = currentTime.split(':').map(Number);
  const currentMinutes = (currH || 0) * 60 + (currM || 0);

  return (
    <div className="w-full py-2">
      <div className="px-4 flex items-center justify-between text-xs text-white/80 mb-2">
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-sky-300" />
          <span className="font-medium text-white">Daily Weather Routine</span>
        </div>
        <button
          onClick={onEditRoutine}
          className="text-sky-300 hover:text-white flex items-center gap-1 text-[11px] font-medium transition-colors"
        >
          <Edit3 className="w-3 h-3" />
          <span>Edit Routine</span>
        </button>
      </div>

      <DraggableScrollRow className="items-stretch gap-2.5 py-1 px-4">
        {routine.map(act => {
          const Icon = ICON_MAP[act.type] || Clock;
          const [startH, startM] = act.startTime.split(':').map(Number);
          const [endH, endM] = act.endTime.split(':').map(Number);
          const startMin = (startH || 0) * 60 + (startM || 0);
          const endMin = (endH || 0) * 60 + (endM || 0);

          const isActive = currentMinutes >= startMin && currentMinutes < endMin;

          return (
            <div
              key={act.id}
              className={`flex-shrink-0 w-44 min-w-[176px] rounded-mausam p-2.5 transition-all border select-none ${
                isActive
                  ? 'bg-white text-slate-900 border-amber-400 shadow-md ring-2 ring-amber-400/40'
                  : 'bg-white/10 backdrop-blur-md text-white border-white/15 hover:bg-white/15'
              }`}
            >
              <div className="flex items-center justify-between gap-1 mb-1">
                <span className={`text-[10px] font-mono font-medium ${isActive ? 'text-amber-700' : 'text-sky-200'}`}>
                  {act.startTime} – {act.endTime}
                </span>
                {isActive && (
                  <span className="bg-amber-500 text-slate-950 text-[9px] font-medium px-1.5 py-0.2 rounded-full animate-pulse">
                    ACTIVE NOW
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5 my-1">
                <div className={`p-1 rounded ${isActive ? 'bg-amber-100 text-amber-800' : 'bg-white/20 text-white'}`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <h5 className={`text-[12px] font-medium truncate ${isActive ? 'text-slate-900' : 'text-white'}`}>
                  {act.label}
                </h5>
              </div>

              <p className={`text-[10.5px] truncate font-normal ${isActive ? 'text-slate-500' : 'text-sky-100/70'}`}>
                📍 {act.location}
              </p>
            </div>
          );
        })}

        <button
          onClick={onEditRoutine}
          className="flex-shrink-0 w-24 min-w-[96px] rounded-mausam border border-dashed border-white/30 bg-white/5 hover:bg-white/10 flex flex-col items-center justify-center p-2 text-white/70 hover:text-white transition-all text-center gap-1 select-none"
        >
          <Plus className="w-4 h-4" />
          <span className="text-[10px] font-normal">Add Activity</span>
        </button>

        <div className="w-3 flex-shrink-0" aria-hidden="true" />
      </DraggableScrollRow>
    </div>
  );
}
