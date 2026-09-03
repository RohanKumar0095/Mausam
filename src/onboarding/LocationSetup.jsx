import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, MapPin, Check, Plus, X, Building, Home, Briefcase, GraduationCap, Sprout, Dumbbell, Car, Plane, PartyPopper, Users, Sparkles } from 'lucide-react';
import { LOCATIONS } from '../data/mockWeatherData';
import { customLocationStore } from '../data/customLocationStore';

const PURPOSE_OPTIONS = [
  'Home',
  'Work / Office',
  'School / College',
  'Farm / Agriculture',
  'Exercise / Sports',
  'Commute',
  'Travel',
  'Outdoor Event',
  'Family',
  'Other'
];

const PERSONA_OPTIONS = [
  { id: 'fitness', label: 'Fitness' },
  { id: 'sportsperson', label: 'Sportsperson' },
  { id: 'agriculture', label: 'Agriculture' },
  { id: 'daily_life', label: 'Daily Life' },
  { id: 'health', label: 'Health' },
  { id: 'commute', label: 'Commute' },
  { id: 'family', label: 'Family' },
  { id: 'events', label: 'Events' },
  { id: 'travel', label: 'Beach & Travel' },
];

export default function LocationSetup({ onContinueLocations, onBack }) {
  const [customLocations, setCustomLocations] = useState(() => customLocationStore.getCustomLocations());
  const [selectedLocations, setSelectedLocations] = useState(['loc-gaya', 'loc-gaya-farm', 'loc-patna']);

  // Modal form state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formName, setFormName] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formPurposes, setFormPurposes] = useState(['Exercise / Sports']);
  const [formPersonas, setFormPersonas] = useState(['fitness']);
  const [formError, setFormError] = useState('');

  const allLocations = [...customLocations, ...LOCATIONS];

  const toggleLocation = (id) => {
    if (selectedLocations.includes(id)) {
      if (selectedLocations.length > 1) {
        setSelectedLocations(selectedLocations.filter(x => x !== id));
      }
    } else {
      setSelectedLocations([...selectedLocations, id]);
    }
  };

  const handleTogglePurpose = (purp) => {
    if (formPurposes.includes(purp)) {
      if (formPurposes.length > 1) {
        setFormPurposes(formPurposes.filter(p => p !== purp));
      }
    } else {
      setFormPurposes([...formPurposes, purp]);
    }
  };

  const handleTogglePersona = (pId) => {
    if (formPersonas.includes(pId)) {
      setFormPersonas(formPersonas.filter(p => p !== pId));
    } else {
      setFormPersonas([...formPersonas, pId]);
    }
  };

  const handleSaveCustomLocation = (e) => {
    e.preventDefault();
    setFormError('');

    if (!formName.trim()) {
      setFormError('Please enter a location name (e.g. "My Running Park").');
      return;
    }
    if (!formAddress.trim()) {
      setFormError('Please enter an address or city (e.g. "Gaya, Bihar").');
      return;
    }
    if (formPurposes.length === 0) {
      setFormError('Please select at least one purpose.');
      return;
    }

    const newLocation = customLocationStore.saveCustomLocation({
      name: formName.trim(),
      address: formAddress.trim(),
      purposes: formPurposes,
      personas: formPersonas
    });

    setCustomLocations([newLocation, ...customLocations]);
    setSelectedLocations([newLocation.id, ...selectedLocations]);
    setFormName('');
    setFormAddress('');
    setFormPurposes(['Exercise / Sports']);
    setFormPersonas(['fitness']);
    setIsAddModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#F4F8FB] flex flex-col justify-between p-4 sm:p-6 text-slate-800">
      <div className="max-w-md mx-auto w-full flex-1 flex flex-col">
        {/* Top Header */}
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={onBack}
            className="p-1.5 -ml-1.5 rounded-full text-slate-500 hover:text-slate-800 hover:bg-slate-200/60"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <span className="text-[11px] font-mono text-slate-400 uppercase tracking-widest">
            LOCATION PURPOSE SETUP
          </span>
          <div className="w-4" />
        </div>

        <div className="mb-3 flex items-start justify-between gap-2">
          <div>
            <h2 className="text-base font-medium text-slate-900">
              Where are your daily activities performed?
            </h2>
            <p className="text-xs text-slate-500 mt-0.5 font-normal">
              Select or add your personal locations to synchronize context-aware weather advisories.
            </p>
          </div>
        </div>

        {/* Add New Location Action Button */}
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="w-full py-2.5 px-3 mb-3 bg-white hover:bg-sky-50 text-brand border border-dashed border-brand/50 rounded-mausam text-xs font-medium flex items-center justify-center gap-1.5 shadow-2xs hover:shadow-xs transition-all"
        >
          <Plus className="w-4 h-4 text-brand" />
          <span>+ Add New Location</span>
        </button>

        {/* Locations List */}
        <div className="space-y-2 flex-1 overflow-y-auto max-h-[50vh] pr-1 py-1">
          {allLocations.map(loc => {
            const isSelected = selectedLocations.includes(loc.id);
            return (
              <button
                key={loc.id}
                onClick={() => toggleLocation(loc.id)}
                className={`w-full p-3 rounded-mausam border text-left flex items-start justify-between gap-2 transition-all ${
                  isSelected
                    ? 'bg-brand-light/70 border-brand ring-1 ring-brand/30 shadow-2xs'
                    : 'bg-white border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <MapPin className={`w-3.5 h-3.5 flex-shrink-0 ${loc.custom ? 'text-emerald-600' : 'text-brand'}`} />
                    <span className="font-medium text-slate-900 text-[12.5px] truncate">
                      {loc.name}
                    </span>
                    {loc.custom && (
                      <span className="px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 text-[9px] font-medium uppercase tracking-tight">
                        Custom
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-1">
                    <span className="bg-white px-1.5 py-0.2 rounded border border-slate-200 text-brand font-medium">
                      🏷️ {loc.purpose}
                    </span>
                    <span className="truncate">{loc.address || `${loc.district}, ${loc.state}`}</span>
                  </div>
                </div>

                {isSelected ? (
                  <div className="w-4 h-4 rounded bg-brand text-white flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-3 h-3 stroke-[2.5]" />
                  </div>
                ) : (
                  <div className="w-4 h-4 rounded border border-slate-300 flex-shrink-0 mt-0.5" />
                )}
              </button>
            );
          })}
        </div>

        {/* Footer Navigation */}
        <div className="pt-3 border-t border-slate-200 mt-3 flex items-center justify-between">
          <button
            onClick={onBack}
            className="px-3 py-2 text-slate-600 hover:text-slate-800 text-xs font-medium"
          >
            Back
          </button>
          <button
            onClick={() => onContinueLocations(selectedLocations)}
            className="px-5 py-2 bg-brand hover:bg-brand-dark text-white rounded-mausam text-xs font-medium flex items-center gap-1 shadow-xs transition-colors"
          >
            <span>Continue to Daily Routine</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Add Location Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white w-full max-w-md rounded-mausam shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-brand px-4 py-3 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-sky-300" />
                <h3 className="text-sm font-medium">Add a Location</h3>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="p-1 rounded-full hover:bg-white/20 text-white/90">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomLocation} className="p-4 overflow-y-auto space-y-3.5 text-xs text-slate-700">
              {formError && (
                <div className="p-2.5 rounded bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                  {formError}
                </div>
              )}

              {/* 1. Location Name */}
              <div>
                <label className="block font-medium text-slate-900 mb-1 text-[11.5px]">
                  1. Location Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  placeholder="e.g. My Home, My Running Park, Farm Plot 1"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-brand focus:outline-none focus:bg-white"
                />
              </div>

              {/* 2. Address */}
              <div>
                <label className="block font-medium text-slate-900 mb-1 text-[11.5px]">
                  2. Address / City <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formAddress}
                  onChange={e => setFormAddress(e.target.value)}
                  placeholder="e.g. 123 Main Road, Gaya, Bihar"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-brand focus:outline-none focus:bg-white"
                />
              </div>

              {/* 3. Purpose Selection */}
              <div>
                <label className="block font-medium text-slate-900 mb-1.5 text-[11.5px]">
                  3. Purpose (Select one or more) <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {PURPOSE_OPTIONS.map(purp => {
                    const isChecked = formPurposes.includes(purp);
                    return (
                      <button
                        type="button"
                        key={purp}
                        onClick={() => handleTogglePurpose(purp)}
                        className={`p-2 rounded border text-left flex items-center justify-between text-[11px] transition-all ${
                          isChecked
                            ? 'bg-brand-light text-brand border-brand font-medium'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <span className="truncate">{purp}</span>
                        {isChecked && <Check className="w-3 h-3 stroke-[2.5] flex-shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 4. Optional Associated Personas */}
              <div>
                <label className="block font-medium text-slate-900 mb-1.5 text-[11.5px]">
                  4. Associated Persona Priorities (Optional)
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {PERSONA_OPTIONS.map(p => {
                    const isChecked = formPersonas.includes(p.id);
                    return (
                      <button
                        type="button"
                        key={p.id}
                        onClick={() => handleTogglePersona(p.id)}
                        className={`px-2.5 py-1 rounded-full text-[10.5px] border transition-all ${
                          isChecked
                            ? 'bg-brand text-white border-brand font-medium'
                            : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                        }`}
                      >
                        {p.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-1.5 text-slate-600 hover:text-slate-800 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-brand hover:bg-brand-dark text-white rounded text-xs font-medium shadow-xs transition-colors flex items-center gap-1"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Save Location</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
