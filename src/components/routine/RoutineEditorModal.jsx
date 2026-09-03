import React, { useState } from 'react';
import { X, Trash2, Clock, Check } from 'lucide-react';
import { ACTIVITY_TYPES } from '../../data/routineData';
import { customLocationStore } from '../../data/customLocationStore';

export default function RoutineEditorModal({ isOpen, onClose, routine = [], onSaveRoutine }) {
  if (!isOpen) return null;

  const [activities, setActivities] = useState([...routine]);
  const [newLabel, setNewLabel] = useState('');
  const [newType, setNewType] = useState('running');
  const [newStart, setNewStart] = useState('07:00');
  const [newEnd, setNewEnd] = useState('08:00');
  const [newLocation, setNewLocation] = useState('Park — Gaya');

  const allLocations = customLocationStore.getAllLocations();

  const handleAdd = () => {
    if (!newLabel.trim()) return;
    const newAct = {
      id: `act-custom-${Date.now()}`,
      type: newType,
      label: newLabel.trim(),
      startTime: newStart,
      endTime: newEnd,
      location: newLocation,
      notes: 'Custom user routine'
    };
    setActivities([...activities, newAct]);
    setNewLabel('');
  };

  const handleDelete = (id) => {
    setActivities(activities.filter(a => a.id !== id));
  };

  const handleSave = () => {
    onSaveRoutine(activities);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white w-full max-w-md rounded-mausam shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        <div className="bg-brand px-4 py-3 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-sky-300" />
            <h3 className="text-sm font-medium">Daily Weather Routine</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-white/20 text-white/90">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto space-y-4 text-xs">
          <p className="text-slate-500 leading-snug">
            Tell MAUSAM what you normally do during the day. The homepage will dynamically prioritize weather conditions that affect your schedule.
          </p>

          <div className="space-y-2">
            <span className="font-medium text-slate-700 uppercase tracking-wider text-[11px] block">
              Current Schedule ({activities.length} activities)
            </span>

            {activities.map(act => (
              <div key={act.id} className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-900 text-[12px]">{act.label}</span>
                    <span className="px-1.5 py-0.2 rounded bg-brand-light text-brand text-[10px] font-mono">
                      {act.startTime} – {act.endTime}
                    </span>
                  </div>
                  <p className="text-slate-500 text-[11px] mt-0.5 truncate">📍 {act.location}</p>
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
          </div>

          <div className="p-3 bg-sky-50/70 rounded-lg border border-sky-100 space-y-2.5">
            <span className="font-medium text-brand text-[11px] uppercase tracking-wider block">
              + Add Routine Activity
            </span>

            <div>
              <label className="text-[11px] text-slate-600 block mb-1">Activity Name</label>
              <input
                type="text"
                value={newLabel}
                onChange={e => setNewLabel(e.target.value)}
                placeholder="e.g. Evening Running, Coaching Class, Farm Spray"
                className="w-full px-2.5 py-1.5 rounded border border-slate-300 text-xs focus:ring-1 focus:ring-brand focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] text-slate-600 block mb-1">Activity Type</label>
                <select
                  value={newType}
                  onChange={e => setNewType(e.target.value)}
                  className="w-full px-2 py-1.5 rounded border border-slate-300 text-xs focus:ring-1 focus:ring-brand focus:outline-none bg-white"
                >
                  {ACTIVITY_TYPES.map(t => (
                    <option key={t.id} value={t.id}>{t.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] text-slate-600 block mb-1">Location</label>
                <select
                  value={newLocation}
                  onChange={e => setNewLocation(e.target.value)}
                  className="w-full px-2 py-1.5 rounded border border-slate-300 text-xs focus:ring-1 focus:ring-brand focus:outline-none bg-white"
                >
                  {allLocations.map(loc => (
                    <option key={loc.id} value={loc.name}>
                      📍 {loc.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] text-slate-600 block mb-1">Start Time</label>
                <input
                  type="time"
                  value={newStart}
                  onChange={e => setNewStart(e.target.value)}
                  className="w-full px-2 py-1 rounded border border-slate-300 text-xs font-mono"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-600 block mb-1">End Time</label>
                <input
                  type="time"
                  value={newEnd}
                  onChange={e => setNewEnd(e.target.value)}
                  className="w-full px-2 py-1 rounded border border-slate-300 text-xs font-mono"
                />
              </div>
            </div>

            <button
              onClick={handleAdd}
              disabled={!newLabel.trim()}
              className="w-full py-1.5 bg-sky-700 text-white rounded text-xs font-medium hover:bg-sky-800 disabled:opacity-50 transition-colors"
            >
              Add to Schedule
            </button>
          </div>
        </div>

        <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-slate-600 hover:text-slate-800 text-xs font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-1.5 bg-brand text-white rounded text-xs font-medium hover:bg-brand-dark transition-colors flex items-center gap-1"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Save & Apply Routine</span>
          </button>
        </div>
      </div>
    </div>
  );
}
