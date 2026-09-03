import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Trash2, Plus, MapPin } from 'lucide-react';
import { DEFAULT_ROUTINE } from '../data/routineData';
import { customLocationStore } from '../data/customLocationStore';

export default function RoutineSetup({ onContinueRoutine, onBack }) {
  const [routine, setRoutine] = useState(DEFAULT_ROUTINE);
  const [newLabel, setNewLabel] = useState('');
  const [newType, setNewType] = useState('running');
  const [newStart, setNewStart] = useState('06:30');
  const [newEnd, setNewEnd] = useState('07:30');
  const [newLocation, setNewLocation] = useState('Park — Gaya');
  const [showAddForm, setShowAddForm] = useState(false);

  const allLocations = customLocationStore.getAllLocations();

  const handleAdd = () => {
    if (!newLabel.trim()) return;
    const item = {
      id: `act-onboard-${Date.now()}`,
      type: newType,
      label: newLabel.trim(),
      startTime: newStart,
      endTime: newEnd,
      location: newLocation,
      notes: 'Configured in onboarding'
    };
    setRoutine([...routine, item]);
    setNewLabel('');
    setShowAddForm(false);
  };

  const handleDelete = (id) => {
    if (routine.length > 1) {
      setRoutine(routine.filter(x => x.id !== id));
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F8FB] flex flex-col justify-between p-4 sm:p-6 text-slate-800">
      <div className="max-w-md mx-auto w-full flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={onBack}
            className="p-1.5 -ml-1.5 rounded-full text-slate-500 hover:text-slate-800 hover:bg-slate-200/60"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <span className="text-[11px] font-mono text-slate-400 uppercase tracking-widest">
            DAILY ROUTINE BUILDER
          </span>
          <div className="w-4" />
        </div>

        <div className="mb-3">
          <h2 className="text-base font-medium text-slate-900">
            Tell us about your typical day
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 font-normal">
            MAUSAM aligns weather forecasts to your schedule so you never have to interpret raw numbers manually.
          </p>
        </div>

        <div className="space-y-2 flex-1 overflow-y-auto max-h-[52vh] pr-1 py-1">
          {routine.map(act => (
            <div
              key={act.id}
              className="p-2.5 rounded-mausam bg-white border border-slate-200 flex items-center justify-between gap-2 shadow-2xs"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-slate-900 text-xs truncate">{act.label}</span>
                  <span className="px-1.5 py-0.2 rounded bg-brand-light text-brand text-[10px] font-mono">
                    {act.startTime} – {act.endTime}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5 truncate">📍 {act.location}</p>
              </div>

              <button
                onClick={() => handleDelete(act.id)}
                className="p-1 text-slate-400 hover:text-rose-600 rounded"
                title="Remove activity"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}

          {!showAddForm ? (
            <button
              onClick={() => setShowAddForm(true)}
              className="w-full py-2 rounded-mausam border border-dashed border-brand/40 bg-brand-light/30 text-brand text-xs font-medium flex items-center justify-center gap-1 hover:bg-brand-light/50 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Another Activity</span>
            </button>
          ) : (
            <div className="p-3 bg-white rounded-mausam border border-brand/30 space-y-2 text-xs shadow-xs">
              <span className="font-medium text-brand block">New Activity</span>
              <input
                type="text"
                value={newLabel}
                onChange={e => setNewLabel(e.target.value)}
                placeholder="e.g. Evening Running or Coaching Class"
                className="w-full px-2.5 py-1.5 rounded border border-slate-300 text-xs focus:ring-1 focus:ring-brand focus:outline-none"
              />

              <div>
                <label className="text-[10.5px] text-slate-500 block mb-0.5">Select Location</label>
                <select
                  value={newLocation}
                  onChange={e => setNewLocation(e.target.value)}
                  className="w-full px-2 py-1.5 rounded border border-slate-300 text-xs focus:ring-1 focus:ring-brand focus:outline-none bg-white"
                >
                  {allLocations.map(loc => (
                    <option key={loc.id} value={loc.name}>
                      📍 {loc.name} ({loc.purpose})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <input
                  type="time"
                  value={newStart}
                  onChange={e => setNewStart(e.target.value)}
                  className="px-2 py-1 rounded border border-slate-300 text-xs font-mono"
                />
                <input
                  type="time"
                  value={newEnd}
                  onChange={e => setNewEnd(e.target.value)}
                  className="px-2 py-1 rounded border border-slate-300 text-xs font-mono"
                />
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={handleAdd}
                  disabled={!newLabel.trim()}
                  className="flex-1 py-1.5 bg-brand text-white rounded font-medium disabled:opacity-50"
                >
                  Add
                </button>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="pt-3 border-t border-slate-200 mt-3 flex items-center justify-between">
          <button
            onClick={onBack}
            className="px-3 py-2 text-slate-600 hover:text-slate-800 text-xs font-medium"
          >
            Back
          </button>
          <button
            onClick={() => onContinueRoutine(routine)}
            className="px-5 py-2 bg-brand hover:bg-brand-dark text-white rounded-mausam text-xs font-medium flex items-center gap-1 shadow-xs transition-colors"
          >
            <span>Review & Generate MAUSAM</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
