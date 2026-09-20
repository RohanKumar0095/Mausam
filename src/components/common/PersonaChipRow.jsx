import React, { useState } from 'react';
import { PERSONAS } from '../../data/personaDefinitions';
import DraggableScrollRow from './DraggableScrollRow';
import { useI18n } from '../../i18n/i18nContext';
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
  Sun,
  Plus,
  X
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
  const { language, t } = useI18n();
  const isHindi = language === 'hi';
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);

  // Active personas shown in row
  const activePersonas = PERSONAS.filter(p => selectedPersonas.includes(p.id));
  // Inactive personas available to add
  const inactivePersonas = PERSONAS.filter(p => !selectedPersonas.includes(p.id));

  return (
    <div className="w-full py-1.5 relative">
      <div className="px-4 flex items-center justify-between text-xs text-white/70 mb-1.5">
        <span className="font-semibold text-sky-100">{t('home_active_profiles')}</span>
        <span className="text-[11px] text-sky-200/80">{t('home_multi_select_blend')}</span>
      </div>
      
      <DraggableScrollRow className="gap-2 py-1 px-4">
        {activePersonas.map(p => {
          const Icon = ICON_MAP[p.icon] || Activity;
          const displayLabel = isHindi ? p.labelHi : p.label;

          return (
            <button
              key={p.id}
              onClick={() => onTogglePersona(p.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-all duration-200 flex-shrink-0 whitespace-nowrap border select-none text-white shadow-sm ring-1 ring-white/30"
              style={{
                backgroundColor: p.color,
                borderColor: p.color,
              }}
            >
              <Icon className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="font-semibold tracking-tight">{displayLabel}</span>
              <Check className="w-3 h-3 ml-0.5 opacity-90 stroke-[2.5] flex-shrink-0" />
            </button>
          );
        })}

        {/* + Add Persona Button */}
        {inactivePersonas.length > 0 && (
          <button
            onClick={() => setIsAddMenuOpen(true)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold bg-white/20 hover:bg-white/30 text-white border border-white/40 backdrop-blur-xs transition-all flex-shrink-0 select-none shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isHindi ? '+ जोड़ें' : '+ Add'}</span>
          </button>
        )}

        <div className="w-3 flex-shrink-0" aria-hidden="true" />
      </DraggableScrollRow>

      {/* Add Persona Modal / Popover */}
      {isAddMenuOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white w-full max-w-sm rounded-mausam shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-brand px-4 py-3 text-white flex items-center justify-between">
              <span className="text-xs font-semibold">
                {isHindi ? 'अतिरिक्त प्रोफाइल सक्रिय करें' : 'Add Weather Profile'}
              </span>
              <button
                onClick={() => setIsAddMenuOpen(false)}
                className="p-1 rounded-full hover:bg-white/20 text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-3 space-y-1.5 max-h-[60vh] overflow-y-auto">
              <p className="text-[11px] text-slate-500 mb-2">
                {isHindi 
                  ? 'अपने मौसम प्राथमिकता स्कोर को मिलाने के लिए प्रोफाइल चुनें:' 
                  : 'Select a profile to blend into your personalized weather intelligence:'}
              </p>
              {inactivePersonas.map(p => {
                const Icon = ICON_MAP[p.icon] || Activity;
                const displayLabel = isHindi ? p.labelHi : p.label;
                return (
                  <button
                    key={p.id}
                    onClick={() => {
                      onTogglePersona(p.id);
                      setIsAddMenuOpen(false);
                    }}
                    className="w-full p-2.5 rounded border border-slate-200 hover:border-brand hover:bg-sky-50 text-left flex items-center justify-between transition-all"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-white"
                        style={{ backgroundColor: p.color }}
                      >
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-slate-900 block">{displayLabel}</span>
                        <span className="text-[10px] text-slate-500">{isHindi ? p.subtitleHi : p.subtitle}</span>
                      </div>
                    </div>
                    <Plus className="w-4 h-4 text-brand" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
