import React from 'react';
import { PERSONAS } from '../../data/personaDefinitions';
import DraggableScrollRow from './DraggableScrollRow';
import { 
  Activity, 
  HeartPulse, 
  Car, 
  Users, 
  Sprout, 
  CalendarDays, 
  Compass, 
  Check,
  Trophy,
  Sun
} from 'lucide-react';

const ICON_MAP = {
  Activity,
  HeartPulse,
  Car,
  Users,
  Sprout,
  CalendarDays,
  Compass,
  Trophy,
  Sun
};

export default function PersonaChipRow({ selectedPersonas = [], onTogglePersona }) {
  return (
    <div className="w-full py-1.5">
      <div className="px-4 flex items-center justify-between text-xs text-white/70 mb-1.5">
        <span className="font-medium text-sky-100">Active Profiles</span>
        <span className="text-[11px] text-sky-200/80">Multi-select to blend</span>
      </div>
      
      <DraggableScrollRow className="gap-2 py-1 px-4">
        {PERSONAS.map(p => {
          const isSelected = selectedPersonas.includes(p.id);
          const Icon = ICON_MAP[p.icon] || Activity;

          return (
            <button
              key={p.id}
              onClick={() => onTogglePersona(p.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-all duration-200 flex-shrink-0 whitespace-nowrap border select-none ${
                isSelected
                  ? 'text-white shadow-sm ring-1 ring-white/30'
                  : 'bg-[#F1EFE8] text-[#5F5E5A] border-slate-300/40 hover:bg-[#eae8e0]'
              }`}
              style={{
                backgroundColor: isSelected ? p.color : undefined,
                borderColor: isSelected ? p.color : undefined,
              }}
            >
              <Icon className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="font-medium tracking-tight">{p.label}</span>
              {isSelected && (
                <Check className="w-3 h-3 ml-0.5 opacity-90 stroke-[2.5] flex-shrink-0" />
              )}
            </button>
          );
        })}
        {/* Trailing spacer for partial edge visibility */}
        <div className="w-3 flex-shrink-0" aria-hidden="true" />
      </DraggableScrollRow>
    </div>
  );
}
