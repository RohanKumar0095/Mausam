import React, { useState, useEffect } from 'react';
import { X, Trash2, Clock, Check, Navigation, ArrowRight, AlertTriangle, Plus, Moon } from 'lucide-react';
import { ACTIVITY_TYPES, isRouteBasedActivity } from '../../data/routineData';
import { customLocationStore } from '../../data/customLocationStore';
import LocationHierarchyForm from '../locations/LocationHierarchyForm';
import { formatTime12h, formatTimeRange12h, getHourFromTime } from '../../utils/timeUtils';

export default function RoutineEditorModal({ isOpen, onClose, routine = [], onSaveRoutine }) {
  if (!isOpen) return null;

  const [activities, setActivities] = useState([...routine]);
  const [newLabel, setNewLabel] = useState('');
  const [newType, setNewType] = useState('running');
  const [startVal, setStartVal] = useState('07:00');
  const [startPeriod, setStartPeriod] = useState('AM');
  const [endVal, setEndVal] = useState('08:00');
  const [endPeriod, setEndPeriod] = useState('AM');
  
  // Centralized Dynamic User Locations State
  const [availableLocations, setAvailableLocations] = useState(() => customLocationStore.getAllLocations());
  const [startLocId, setStartLocId] = useState('');
  const [endLocId, setEndLocId] = useState('');
  const [singleLocId, setSingleLocId] = useState('');

  // Inline Add New Location Form State
  const [isAddLocationOpen, setIsAddLocationOpen] = useState(false);

  const isRoute = isRouteBasedActivity(newType);

  // Synchronize locations dynamically whenever modal opens or locations update
  useEffect(() => {
    if (isOpen) {
      const locs = customLocationStore.getAllLocations();
      setAvailableLocations(locs);

      if (locs.length > 0) {
        setStartLocId(prev => (prev && locs.some(l => l.id === prev)) ? prev : locs[0].id);
        setEndLocId(prev => (prev && locs.some(l => l.id === prev)) ? prev : (locs[1]?.id || locs[0].id));
        setSingleLocId(prev => (prev && locs.some(l => l.id === prev)) ? prev : locs[0].id);
      }
    }
  }, [isOpen]);

  const handleSaveInlineLocation = (locationData) => {
    const newLoc = customLocationStore.saveCustomLocation(locationData);
    const updatedLocs = customLocationStore.getAllLocations();
    setAvailableLocations(updatedLocs);

    if (isRoute) {
      setEndLocId(newLoc.id);
    } else {
      setSingleLocId(newLoc.id);
    }

    setIsAddLocationOpen(false);
  };

  const formattedStartStr = formatTime12h(`${startVal} ${startPeriod}`);
  const formattedEndStr = formatTime12h(`${endVal} ${endPeriod}`);
  const startHour24 = getHourFromTime(formattedStartStr);
  const endHour24 = getHourFromTime(formattedEndStr);
  const isOvernight = endHour24 < startHour24 || (endHour24 === startHour24 && formattedStartStr !== formattedEndStr && startPeriod === 'PM' && endPeriod === 'AM');
  const isSameTime = formattedStartStr === formattedEndStr;

  const handleAdd = () => {
    if (!newLabel.trim()) return;
    if (isSameTime) return;

    let newAct;
    if (isRoute) {
      const startObj = availableLocations.find(l => l.id === startLocId) || availableLocations[0];
      const endObj = availableLocations.find(l => l.id === endLocId) || availableLocations[1] || availableLocations[0];
      
      const startName = startObj ? startObj.name : 'Start Location';
      const endName = endObj ? endObj.name : 'End Location';

      newAct = {
        id: `act-custom-${Date.now()}`,
        type: newType,
        label: newLabel.trim(),
        startTime: formattedStartStr,
        endTime: formattedEndStr,
        isRoute: true,
        startLocation: startName,
        startLocationId: startObj?.id,
        startLocationObj: startObj,
        endLocation: endName,
        endLocationId: endObj?.id,
        endLocationObj: endObj,
        location: `${startName} → ${endName}`,
        locationId: startObj?.id,
        notes: 'Route-based journey'
      };
    } else {
      const singleObj = availableLocations.find(l => l.id === singleLocId) || availableLocations[0];
      const singleName = singleObj ? singleObj.name : 'Selected Location';

      newAct = {
        id: `act-custom-${Date.now()}`,
        type: newType,
        label: newLabel.trim(),
        startTime: formattedStartStr,
        endTime: formattedEndStr,
        isRoute: false,
        location: singleName,
        locationId: singleObj?.id,
        locationObj: singleObj,
        notes: 'Stationary activity'
      };
    }

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
            Tell MAUSAM what you normally do during the day. Select exact AM/PM times for accurate weather forecasting.
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
                    <span className="px-1.5 py-0.2 rounded bg-brand-light text-brand text-[10px] font-mono font-semibold">
                      {formatTimeRange12h(act.startTime, act.endTime)}
                    </span>
                    {act.isRoute && (
                      <span className="px-1.5 py-0.2 rounded bg-sky-100 text-sky-800 text-[9px] font-semibold uppercase">
                        Route
                      </span>
                    )}
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
            <div className="flex items-center justify-between">
              <span className="font-medium text-brand text-[11px] uppercase tracking-wider block">
                + Add Routine Activity
              </span>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                isRoute ? 'bg-sky-100 text-sky-800' : 'bg-emerald-100 text-emerald-800'
              }`}>
                {isRoute ? '🧭 Route-Based Journey' : '📍 Stationary Location'}
              </span>
            </div>

            <div>
              <label className="text-[11px] text-slate-600 block mb-1">Activity Name</label>
              <input
                type="text"
                value={newLabel}
                onChange={e => setNewLabel(e.target.value)}
                placeholder={isRoute ? 'e.g. Morning Run, Evening Commute, Cycling' : 'e.g. Gym Workout, Office Work, Study'}
                className="w-full px-2.5 py-1.5 rounded border border-slate-300 text-xs focus:ring-1 focus:ring-brand focus:outline-none bg-white"
              />
            </div>

            <div>
              <label className="text-[11px] text-slate-600 block mb-1">Activity Type</label>
              <select
                value={newType}
                onChange={e => setNewType(e.target.value)}
                className="w-full px-2 py-1.5 rounded border border-slate-300 text-xs focus:ring-1 focus:ring-brand focus:outline-none bg-white font-medium text-slate-800"
              >
                {ACTIVITY_TYPES.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.label} ({isRouteBasedActivity(t.id) ? 'Route-Based 🧭' : 'Stationary 📍'})
                  </option>
                ))}
              </select>
            </div>

            {/* Dynamic Location Selection Bound to Persisted User Locations */}
            {isRoute ? (
              <div className="p-2.5 bg-white rounded-md border border-sky-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10.5px] font-bold text-sky-900 uppercase tracking-wider block flex items-center gap-1">
                    <Navigation className="w-3 h-3 text-sky-600" />
                    Route Journey Locations (Start → End)
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsAddLocationOpen(true)}
                    className="text-[10px] text-brand hover:underline font-semibold flex items-center gap-0.5"
                  >
                    <Plus className="w-3 h-3" />
                    <span>+ Add Location</span>
                  </button>
                </div>

                <div>
                  <label className="text-[10.5px] text-slate-600 block mb-1 font-medium">
                    Start Location (Departure)
                  </label>
                  <select
                    value={startLocId}
                    onChange={e => setStartLocId(e.target.value)}
                    className="w-full px-2 py-1.5 rounded border border-slate-300 text-xs focus:ring-1 focus:ring-brand focus:outline-none bg-slate-50 font-medium text-slate-800"
                  >
                    {availableLocations.map(loc => (
                      <option key={`start-${loc.id}`} value={loc.id}>
                        📍 {loc.name} {loc.purpose ? `(${loc.purpose})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center justify-center text-slate-400 py-0.5">
                  <div className="flex items-center gap-1.5 text-[10px] text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-200 font-mono">
                    <span>Route Journey Path</span>
                    <ArrowRight className="w-3 h-3 text-sky-600" />
                  </div>
                </div>

                <div>
                  <label className="text-[10.5px] text-slate-600 block mb-1 font-medium">
                    End Location (Destination)
                  </label>
                  <select
                    value={endLocId}
                    onChange={e => setEndLocId(e.target.value)}
                    className="w-full px-2 py-1.5 rounded border border-slate-300 text-xs focus:ring-1 focus:ring-brand focus:outline-none bg-slate-50 font-medium text-slate-800"
                  >
                    {availableLocations.map(loc => (
                      <option key={`end-${loc.id}`} value={loc.id}>
                        📍 {loc.name} {loc.purpose ? `(${loc.purpose})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {startLocId === endLocId && availableLocations.length > 1 && (
                  <div className="flex items-center gap-1 text-[10.5px] text-amber-700 bg-amber-50 p-1.5 rounded border border-amber-200">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>Tip: For route activities, Start & End locations usually differ.</span>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] text-slate-600 font-medium">Stationary Activity Location</label>
                  <button
                    type="button"
                    onClick={() => setIsAddLocationOpen(true)}
                    className="text-[10px] text-brand hover:underline font-semibold flex items-center gap-0.5"
                  >
                    <Plus className="w-3 h-3" />
                    <span>+ Add Location</span>
                  </button>
                </div>
                <select
                  value={singleLocId}
                  onChange={e => setSingleLocId(e.target.value)}
                  className="w-full px-2 py-1.5 rounded border border-slate-300 text-xs focus:ring-1 focus:ring-brand focus:outline-none bg-white font-medium text-slate-800"
                >
                  {availableLocations.map(loc => (
                    <option key={loc.id} value={loc.id}>
                      📍 {loc.name} {loc.purpose ? `(${loc.purpose})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Time Selection with Explicit AM/PM Dropdowns */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-medium text-slate-700 block mb-1">Start Time</label>
                <div className="flex gap-1 items-center">
                  <input
                    type="text"
                    value={startVal}
                    onChange={e => setStartVal(e.target.value)}
                    placeholder="07:00"
                    className="w-full px-2.5 py-1.5 rounded border border-slate-300 text-xs font-mono font-semibold bg-white focus:ring-1 focus:ring-brand focus:outline-none text-slate-900"
                  />
                  <select
                    value={startPeriod}
                    onChange={e => setStartPeriod(e.target.value)}
                    className="px-2.5 py-1.5 rounded border border-slate-300 text-xs font-bold bg-slate-100 text-brand-dark focus:ring-1 focus:ring-brand focus:outline-none shadow-xs cursor-pointer"
                  >
                    <option value="AM">AM</option>
                    <option value="PM">PM</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[11px] font-medium text-slate-700 block mb-1">End Time</label>
                <div className="flex gap-1 items-center">
                  <input
                    type="text"
                    value={endVal}
                    onChange={e => setEndVal(e.target.value)}
                    placeholder="08:00"
                    className="w-full px-2.5 py-1.5 rounded border border-slate-300 text-xs font-mono font-semibold bg-white focus:ring-1 focus:ring-brand focus:outline-none text-slate-900"
                  />
                  <select
                    value={endPeriod}
                    onChange={e => setEndPeriod(e.target.value)}
                    className="px-2.5 py-1.5 rounded border border-slate-300 text-xs font-bold bg-slate-100 text-brand-dark focus:ring-1 focus:ring-brand focus:outline-none shadow-xs cursor-pointer"
                  >
                    <option value="AM">AM</option>
                    <option value="PM">PM</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Overnight and Validation Indicator */}
            {isSameTime && (
              <div className="flex items-center gap-1.5 text-[10.5px] text-rose-700 bg-rose-50 p-2 rounded border border-rose-200 font-medium">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                <span>Start time and end time cannot be identical.</span>
              </div>
            )}
            {isOvernight && !isSameTime && (
              <div className="flex items-center gap-1.5 text-[10.5px] text-indigo-800 bg-indigo-50 p-2 rounded border border-indigo-200 font-medium">
                <Moon className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                <span>Overnight Activity (Spans across midnight to next day)</span>
              </div>
            )}

            <button
              onClick={handleAdd}
              disabled={!newLabel.trim() || isSameTime || (isRoute && (!startLocId || !endLocId))}
              className="w-full py-2 bg-sky-700 text-white rounded text-xs font-semibold hover:bg-sky-800 disabled:opacity-50 transition-colors shadow-xs"
            >
              Add Activity to Schedule
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

      {/* Add New Location Modal inside Routine Editor */}
      {isAddLocationOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white w-full max-w-md rounded-mausam shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="bg-brand px-4 py-3 text-white flex items-center justify-between">
              <h4 className="text-xs font-semibold">Add New Saved Location</h4>
              <button onClick={() => setIsAddLocationOpen(false)} className="text-white/80 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto">
              <LocationHierarchyForm
                onSave={handleSaveInlineLocation}
                onCancel={() => setIsAddLocationOpen(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
