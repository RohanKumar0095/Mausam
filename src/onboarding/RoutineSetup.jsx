import React, { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, Trash2, Plus, MapPin, Clock, AlertCircle, Navigation } from 'lucide-react';
import { customLocationStore } from '../data/customLocationStore';
import { useI18n } from '../i18n/i18nContext';
import { ACTIVITY_TYPES, isRouteBasedActivity } from '../data/routineData';

export default function RoutineSetup({ onContinueRoutine, onBack }) {
  const { language, t } = useI18n();
  const isHindi = language === 'hi';

  const [savedLocations, setSavedLocations] = useState(() => customLocationStore.getAllLocations());

  const [routine, setRoutine] = useState([]);
  const [newLabel, setNewLabel] = useState('');
  const [newType, setNewType] = useState('running');
  const [newStart, setNewStart] = useState('07:00');
  const [newEnd, setNewEnd] = useState('08:00');
  const [selectedStartId, setSelectedStartId] = useState('');
  const [selectedEndId, setSelectedEndId] = useState('');
  const [selectedSingleId, setSelectedSingleId] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    const locs = customLocationStore.getAllLocations();
    setSavedLocations(locs);
    if (locs.length > 0) {
      setSelectedStartId(prev => (prev && locs.some(l => l.id === prev)) ? prev : locs[0].id);
      setSelectedEndId(prev => (prev && locs.some(l => l.id === prev)) ? prev : (locs[1]?.id || locs[0].id));
      setSelectedSingleId(prev => (prev && locs.some(l => l.id === prev)) ? prev : locs[0].id);
    }
  }, []);

  const isRoute = isRouteBasedActivity(newType);

  const handleAdd = () => {
    if (!newLabel.trim()) return;

    let item;
    if (isRoute) {
      const startObj = savedLocations.find(l => l.id === selectedStartId) || savedLocations[0];
      const endObj = savedLocations.find(l => l.id === selectedEndId) || savedLocations[0];
      const startName = startObj ? startObj.name : 'Start Location';
      const endName = endObj ? endObj.name : 'End Location';

      item = {
        id: `act-onboard-${Date.now()}`,
        type: newType,
        label: newLabel.trim(),
        startTime: newStart,
        endTime: newEnd,
        isRoute: true,
        startLocation: startName,
        endLocation: endName,
        location: `${startName} → ${endName}`,
        locationId: startObj ? startObj.id : null,
        notes: 'Configured in routine setup'
      };
    } else {
      const locObj = savedLocations.find(l => l.id === selectedSingleId) || savedLocations[0];
      const locName = locObj ? locObj.name : 'Selected Location';

      item = {
        id: `act-onboard-${Date.now()}`,
        type: newType,
        label: newLabel.trim(),
        startTime: newStart,
        endTime: newEnd,
        isRoute: false,
        locationId: locObj ? locObj.id : null,
        location: locName,
        notes: 'Configured in routine setup'
      };
    }

    setRoutine([...routine, item]);
    setNewLabel('');
    setShowAddForm(false);
  };

  const handleDelete = (id) => {
    setRoutine(routine.filter(x => x.id !== id));
  };

  const handleSkip = () => {
    onContinueRoutine([]);
  };

  return (
    <div className="min-h-screen bg-[#F4F8FB] flex flex-col justify-between p-4 sm:p-6 text-slate-800">
      <div className="max-w-md mx-auto w-full flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={onBack}
            className="p-1.5 -ml-1.5 rounded-full text-slate-500 hover:text-slate-800 hover:bg-slate-200/60"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider font-medium">
            {isHindi ? 'दैनिक दिनचर्या (वैकल्पिक)' : 'DAILY ROUTINE (OPTIONAL)'}
          </span>
          <div className="w-4" />
        </div>

        <div className="mb-3">
          <h2 className="text-base font-bold text-slate-900 leading-snug">
            {isHindi ? 'अपनी दैनिक गतिविधियों का समय निर्धारित करें' : 'Tell us about your daily routine'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 font-normal">
            {isHindi 
              ? 'MAUSAM आपके शेड्यूल के समय के अनुसार सटीक मौसम पूर्वानुमान प्रदर्शित करता है।'
              : 'MAUSAM aligns weather forecasts to your schedule so you receive timely, actionable advisories.'}
          </p>
        </div>

        {/* Locations warning if none added */}
        {savedLocations.length === 0 && (
          <div className="p-3 mb-3 bg-amber-50 border border-amber-200 rounded-mausam text-amber-800 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-600" />
            <div className="flex-1">
              <span className="font-semibold block">
                {isHindi ? 'कोई स्थान नहीं मिला' : 'No saved locations found'}
              </span>
              <p className="text-[11px] mt-0.5 text-amber-700">
                {isHindi 
                  ? 'अपनी दिनचर्या के लिए स्थान चुनने से पहले पिछले चरण में एक स्थान जोड़ें।'
                  : 'Add a location first in the previous step to link it with your routine activities.'}
              </p>
              <button
                onClick={onBack}
                className="mt-1.5 px-2 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-[10.5px] font-medium transition-colors"
              >
                {isHindi ? '← स्थान सेटअप पर जाएं' : '← Go to Location Setup'}
              </button>
            </div>
          </div>
        )}

        {/* Routine Activities List */}
        <div className="space-y-2 flex-1 overflow-y-auto max-h-[50vh] pr-1 py-1">
          {routine.length === 0 && !showAddForm ? (
            <div className="p-6 text-center bg-white rounded-mausam border border-slate-200 shadow-2xs my-auto">
              <div className="w-10 h-10 rounded-full bg-brand-light text-brand flex items-center justify-center mx-auto mb-2">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="text-xs font-semibold text-slate-800">
                {isHindi ? 'कोई गतिविधि नहीं जोड़ी गई (वैकल्पिक)' : 'No routine activities added yet (Optional)'}
              </h3>
              <p className="text-[11px] text-slate-500 mt-1 max-w-xs mx-auto">
                {isHindi
                  ? 'आप व्यायाम, यात्रा या काम के लिए समय जोड़ सकते हैं या बिना दिनचर्या के सीधे आगे बढ़ सकते हैं।'
                  : 'You can add time slots for work, workouts, or travel, or simply skip this step.'}
              </p>
            </div>
          ) : (
            routine.map(act => (
              <div
                key={act.id}
                className="p-2.5 rounded-mausam bg-white border border-slate-200 flex items-center justify-between gap-2 shadow-2xs"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900 text-xs truncate">{act.label}</span>
                    <span className="px-1.5 py-0.2 rounded bg-brand-light text-brand text-[10px] font-mono font-medium">
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
            ))
          )}

          {!showAddForm ? (
            <button
              onClick={() => setShowAddForm(true)}
              disabled={savedLocations.length === 0}
              className="w-full py-2.5 rounded-mausam border border-dashed border-brand/50 bg-white hover:bg-sky-50 text-brand text-xs font-semibold flex items-center justify-center gap-1 shadow-2xs hover:shadow-xs transition-all disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>{isHindi ? '+ गतिविधि जोड़ें' : '+ Add Routine Activity'}</span>
            </button>
          ) : (
            <div className="p-3 bg-white rounded-mausam border border-brand/30 space-y-2.5 text-xs shadow-xs">
              <span className="font-semibold text-slate-900 block">
                {isHindi ? 'नई गतिविधि' : 'New Activity'}
              </span>
              
              <div>
                <label className="text-[10.5px] text-slate-600 font-medium block mb-1">
                  {isHindi ? 'गतिविधि का नाम' : 'Activity Name'}
                </label>
                <input
                  type="text"
                  value={newLabel}
                  onChange={e => setNewLabel(e.target.value)}
                  placeholder={isHindi ? 'उदा. सुबह की दौड़, ऑफिस यात्रा, शाम का टहलना' : 'e.g. Morning Jog, Office Commute, Evening Walk'}
                  className="w-full px-2.5 py-1.5 rounded border border-slate-300 text-xs focus:ring-1 focus:ring-brand focus:outline-none bg-slate-50 focus:bg-white"
                />
              </div>

              <div>
                <label className="text-[10.5px] text-slate-600 font-medium block mb-1">
                  {isHindi ? 'गतिविधि का प्रकार' : 'Activity Type'}
                </label>
                <select
                  value={newType}
                  onChange={e => setNewType(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded border border-slate-300 text-xs focus:ring-1 focus:ring-brand focus:outline-none bg-white text-slate-800 font-medium"
                >
                  {ACTIVITY_TYPES.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.label} ({isRouteBasedActivity(t.id) ? 'Route 🧭' : 'Single Place 📍'})
                    </option>
                  ))}
                </select>
              </div>

              {isRoute ? (
                <div className="p-2.5 bg-sky-50/70 rounded-md border border-sky-200 space-y-2">
                  <span className="text-[10px] font-bold text-sky-900 uppercase tracking-wider block flex items-center gap-1">
                    <Navigation className="w-3 h-3 text-sky-600" />
                    {isHindi ? 'यात्रा मार्ग स्थान (प्रारंभ → गंतव्य)' : 'Route Journey Locations (Start → End)'}
                  </span>

                  <div>
                    <label className="text-[10px] text-slate-600 block mb-0.5 font-medium">
                      {isHindi ? 'प्रारंभ स्थान (Departure)' : 'Start Location (Departure)'}
                    </label>
                    <select
                      value={selectedStartId}
                      onChange={e => setSelectedStartId(e.target.value)}
                      className="w-full px-2 py-1.5 rounded border border-slate-300 text-xs focus:ring-1 focus:ring-brand focus:outline-none bg-white"
                    >
                      {savedLocations.map(loc => (
                        <option key={`start-${loc.id}`} value={loc.id}>
                          📍 {loc.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-600 block mb-0.5 font-medium">
                      {isHindi ? 'गंतव्य स्थान (Destination)' : 'End Location (Destination)'}
                    </label>
                    <select
                      value={selectedEndId}
                      onChange={e => setSelectedEndId(e.target.value)}
                      className="w-full px-2 py-1.5 rounded border border-slate-300 text-xs focus:ring-1 focus:ring-brand focus:outline-none bg-white font-medium text-slate-800"
                    >
                      {savedLocations.map(loc => (
                        <option key={`end-${loc.id}`} value={loc.id}>
                          📍 {loc.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="text-[10.5px] text-slate-600 font-medium block mb-1">
                    {isHindi ? 'स्थान चुनें' : 'Select Location'}
                  </label>
                  <select
                    value={selectedSingleId}
                    onChange={e => setSelectedSingleId(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded border border-slate-300 text-xs focus:ring-1 focus:ring-brand focus:outline-none bg-white text-slate-800"
                  >
                    {savedLocations.map(loc => (
                      <option key={loc.id} value={loc.id}>
                        📍 {loc.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-500 block mb-0.5">{isHindi ? 'प्रारंभ समय' : 'Start Time'}</label>
                  <input
                    type="time"
                    value={newStart}
                    onChange={e => setNewStart(e.target.value)}
                    className="w-full px-2 py-1 rounded border border-slate-300 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 block mb-0.5">{isHindi ? 'समाप्त समय' : 'End Time'}</label>
                  <input
                    type="time"
                    value={newEnd}
                    onChange={e => setNewEnd(e.target.value)}
                    className="w-full px-2 py-1 rounded border border-slate-300 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  onClick={handleAdd}
                  disabled={!newLabel.trim()}
                  className="flex-1 py-1.5 bg-brand text-white rounded text-xs font-semibold hover:bg-brand-dark disabled:opacity-50 transition-colors"
                >
                  {isHindi ? 'गतिविधि जोड़ें' : 'Add Activity'}
                </button>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded text-xs font-medium"
                >
                  {isHindi ? 'रद्द करें' : 'Cancel'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-slate-200 mt-3 flex items-center justify-between">
          <button
            onClick={onBack}
            className="px-3 py-2 text-slate-600 hover:text-slate-800 text-xs font-medium"
          >
            {t('q_back')}
          </button>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleSkip}
              className="px-3 py-2 text-slate-500 hover:text-slate-800 text-xs font-medium"
            >
              {isHindi ? 'अभी छोड़ें (Skip)' : 'Skip for now'}
            </button>
            <button
              onClick={() => onContinueRoutine(routine)}
              className="px-4 py-2 bg-brand hover:bg-brand-dark text-white rounded-mausam text-xs font-semibold flex items-center gap-1 shadow-xs transition-colors"
            >
              <span>{isHindi ? 'समीक्षा करें और पूरा करें' : 'Review & Complete'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
