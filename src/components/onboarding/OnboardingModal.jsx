import React, { useState } from 'react';
import { 
  Sparkles, 
  Check, 
  ArrowRight, 
  ArrowLeft 
} from 'lucide-react';
import { PERSONAS } from '../../data/personaDefinitions';
import { PREDEFINED_LOCATIONS } from '../../data/locationsData';

export default function OnboardingModal({ isOpen, onComplete }) {
  if (!isOpen) return null;

  const [step, setStep] = useState(1);
  const [selectedLocationId, setSelectedLocationId] = useState('loc-gaya');
  const [selectedPersonas, setSelectedPersonas] = useState(['fitness', 'health', 'commute']);
  const [routineItems, setRoutineItems] = useState([
    { id: '1', type: 'running', label: 'Morning Run', startTime: '06:30', endTime: '07:30', location: 'Park — Gaya' },
    { id: '2', type: 'college', label: 'College / Work', startTime: '09:00', endTime: '15:00', location: 'Gaya Campus' },
    { id: '3', type: 'commute', label: 'Evening Commute', startTime: '16:30', endTime: '17:30', location: 'Transit Corridor' },
    { id: '4', type: 'outdoor_event', label: 'Outdoor Event', startTime: '19:00', endTime: '21:00', location: 'Community Park' },
  ]);

  const togglePersona = (id) => {
    if (selectedPersonas.includes(id)) {
      if (selectedPersonas.length > 1) {
        setSelectedPersonas(selectedPersonas.filter(p => p !== id));
      }
    } else {
      setSelectedPersonas([...selectedPersonas, id]);
    }
  };

  const handleFinish = () => {
    onComplete({
      locationId: selectedLocationId,
      personas: selectedPersonas,
      routine: routineItems
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white w-full max-w-md rounded-mausam shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        <div className="bg-brand px-5 py-4 text-white">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-mono tracking-widest uppercase text-sky-200">
              STEP {step} OF 4
            </span>
            <span className="text-[10px] bg-sky-400/20 text-sky-100 px-2 py-0.5 rounded-full">
              SIH 2026 Prototype
            </span>
          </div>
          <h2 className="text-base font-medium">
            {step === 1 && 'Where should MAUSAM personalize your weather?'}
            {step === 2 && 'What matters most to you?'}
            {step === 3 && 'What does your typical day look like?'}
            {step === 4 && 'Your Personalized Weather Engine is Ready!'}
          </h2>
        </div>

        <div className="p-5 overflow-y-auto flex-1 space-y-4 text-xs text-slate-700">
          {step === 1 && (
            <div className="space-y-3">
              <p className="text-slate-500 leading-snug">
                Select your primary location. You can assign different purposes (Home, Farm, Office, Travel) to each saved place.
              </p>
              <div className="space-y-2">
                {PREDEFINED_LOCATIONS.map(loc => (
                  <button
                    key={loc.id}
                    onClick={() => setSelectedLocationId(loc.id)}
                    className={`w-full p-3 rounded-lg border text-left flex items-start justify-between gap-2 transition-all ${
                      selectedLocationId === loc.id
                        ? 'border-brand bg-brand-light/70 ring-1 ring-brand/30'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <div className="font-medium text-slate-900 text-[13px]">{loc.name}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">Purpose: <strong>{loc.purpose}</strong></div>
                    </div>
                    {selectedLocationId === loc.id && <Check className="w-4 h-4 text-brand stroke-[2.5]" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3">
              <p className="text-slate-500 leading-snug">
                Choose one or more profiles. MAUSAM will intelligently blend your preferences throughout the day.
              </p>
              <div className="grid grid-cols-2 gap-2">
                {PERSONAS.map(p => {
                  const isSelected = selectedPersonas.includes(p.id);
                  return (
                    <button
                      key={p.id}
                      onClick={() => togglePersona(p.id)}
                      className={`p-3 rounded-lg border text-left transition-all ${
                        isSelected
                          ? 'border-current ring-1 ring-current shadow-xs'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                      style={{
                        borderColor: isSelected ? p.color : undefined,
                        backgroundColor: isSelected ? `${p.color}15` : undefined,
                        color: isSelected ? p.color : '#334155'
                      }}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-[12px]">{p.label}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
                      </div>
                      <p className="text-[10.5px] opacity-80 leading-tight">
                        {p.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3">
              <p className="text-slate-500 leading-snug">
                MAUSAM synchronizes weather predictions with your routine to give you timely advisories.
              </p>
              <div className="space-y-2">
                {routineItems.map((act, idx) => (
                  <div key={idx} className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-900">{act.label}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-brand-light text-brand">
                          {act.startTime} – {act.endTime}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">📍 {act.location}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4 text-center py-2">
              <div className="w-12 h-12 rounded-full bg-brand-light text-brand flex items-center justify-center mx-auto shadow-xs">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-medium text-slate-900 mb-1">
                  Personalization Engine Initialized
                </h3>
                <p className="text-slate-500 text-xs leading-relaxed max-w-xs mx-auto">
                  Your homepage is now tuned to your schedule. Weather data will automatically convert into contextual decisions.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          {step > 1 ? (
            <button
              onClick={() => setStep(step - 1)}
              className="px-3 py-1.5 text-slate-600 hover:text-slate-800 text-xs font-medium flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>
          ) : <div />}

          {step < 4 ? (
            <button
              onClick={() => setStep(step + 1)}
              className="px-4 py-1.5 bg-brand text-white rounded text-xs font-medium hover:bg-brand-dark transition-colors flex items-center gap-1"
            >
              Next <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={handleFinish}
              className="px-5 py-2 bg-emerald-700 text-white rounded text-xs font-medium hover:bg-emerald-800 transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <Check className="w-4 h-4" /> Open MAUSAM Homepage
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
