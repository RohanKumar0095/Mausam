import React from 'react';
import { 
  AlertOctagon, 
  AlertTriangle, 
  ShieldCheck, 
  Clock, 
  FileText 
} from 'lucide-react';

export default function AlertsView({ safetyInfo, weatherData, routine = [] }) {
  const current = weatherData?.current || {};
  const { level, isSevere, isCaution, headline, description, validUntil } = safetyInfo || {};

  const districtBulletins = [
    {
      id: 'bul-1',
      district: 'Gaya & Aurangabad',
      level: 'AMBER',
      phenomenon: 'Thunderstorm with Lightning & Gusty Winds (30-40 km/h)',
      timeWindow: '16:00 to 20:00 IST',
      action: 'Seek shelter in non-metallic structures during peak lightning activity.'
    },
    {
      id: 'bul-2',
      district: 'Patna & Nalanda',
      level: 'AMBER',
      phenomenon: 'Heavy Rainfall & Waterlogging',
      timeWindow: '16:30 to 19:30 IST',
      action: 'Drive cautiously along low-lying underpasses and arterial corridors.'
    },
    {
      id: 'bul-3',
      district: 'Ranchi & East Singhbhum',
      level: 'GREEN',
      phenomenon: 'No Adverse Weather Warning',
      timeWindow: 'Next 24 Hours',
      action: 'Safe for normal outdoor agricultural and commercial operations.'
    }
  ];

  return (
    <div className="space-y-4 px-4 py-2 pb-24 text-white">
      <div className={`rounded-mausam p-4 border shadow-md ${
        isSevere 
          ? 'bg-[#791F1F]/90 border-rose-400 text-white'
          : (isCaution ? 'bg-[#854F0B]/90 border-amber-300 text-white' : 'bg-[#0F6E56]/90 border-emerald-400 text-white')
      }`}>
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-full bg-white/20 flex-shrink-0">
            {isSevere ? <AlertOctagon className="w-6 h-6" /> : (isCaution ? <AlertTriangle className="w-6 h-6" /> : <ShieldCheck className="w-6 h-6" />)}
          </div>
          <div className="flex-1">
            <span className="text-[10px] font-mono uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded font-medium">
              IMD OFFICIAL BULLETIN • LEVEL {level || 'GREEN'}
            </span>
            <h3 className="text-sm font-medium mt-1 leading-snug">{headline}</h3>
            <p className="text-xs text-white/90 mt-1 leading-snug">{description}</p>
            <span className="text-[10px] text-white/70 block mt-2 font-mono">Valid Until: {validUntil}</span>
          </div>
        </div>
      </div>

      <div className="glass-card rounded-mausam p-4 shadow-sm space-y-3">
        <h4 className="text-xs font-medium text-sky-200 uppercase tracking-wider flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-sky-300" />
          <span>Routine Risk Intersection</span>
        </h4>

        <div className="space-y-2">
          {routine.map(act => (
            <div key={act.id} className="p-2.5 rounded-lg bg-white/5 border border-white/10 flex items-start justify-between gap-2 text-xs">
              <div>
                <span className="font-medium text-white">{act.label}</span>
                <span className="text-[10px] font-mono text-sky-300 block">{act.startTime}–{act.endTime} • {act.location}</span>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                act.type === 'commute' || act.type === 'outdoor_event'
                  ? 'bg-amber-500/30 text-amber-200 border border-amber-400/40'
                  : 'bg-emerald-500/30 text-emerald-200 border border-emerald-400/40'
              }`}>
                {act.type === 'commute' || act.type === 'outdoor_event' ? 'Caution: Rain Overlap' : 'Safe Window'}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-card rounded-mausam p-4 shadow-sm space-y-3">
        <h4 className="text-xs font-medium text-sky-200 uppercase tracking-wider flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5 text-sky-300" />
          <span>Regional Meteorological Center Bulletins</span>
        </h4>

        <div className="space-y-2.5">
          {districtBulletins.map(bul => (
            <div key={bul.id} className="p-3 rounded-lg bg-white/5 border border-white/10 text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-medium text-white">{bul.district}</span>
                <span className={`text-[10px] font-mono font-medium px-1.5 py-0.2 rounded ${
                  bul.level === 'AMBER' ? 'bg-amber-500 text-slate-950' : 'bg-emerald-600 text-white'
                }`}>
                  {bul.level}
                </span>
              </div>
              <p className="text-sky-100 font-normal leading-snug">{bul.phenomenon}</p>
              <p className="text-[11px] text-sky-300/80">Window: {bul.timeWindow}</p>
              <p className="text-[11px] text-sky-200 pt-1 border-t border-white/10">Action: {bul.action}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
