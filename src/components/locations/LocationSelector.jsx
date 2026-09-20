import React, { useState } from 'react';
import { X, MapPin, Check, Plus } from 'lucide-react';
import { customLocationStore } from '../../data/customLocationStore';
import LocationHierarchyForm from './LocationHierarchyForm';

export default function LocationSelector({
  isOpen,
  onClose,
  currentLocationId,
  onSelectLocation
}) {
  const [isAddingNew, setIsAddingNew] = useState(false);

  if (!isOpen) return null;

  const allLocations = customLocationStore.getAllLocations();

  const handleSaveNewLocation = (locationData) => {
    const newLoc = customLocationStore.saveCustomLocation(locationData);
    setIsAddingNew(false);
    onSelectLocation(newLoc.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white w-full max-w-lg rounded-mausam shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        <div className="bg-brand px-4 py-3 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-sky-300" />
            <h3 className="text-sm font-medium">
              {isAddingNew ? 'Add Location Hierarchy' : 'Select Location'}
            </h3>
          </div>
          <button 
            onClick={() => {
              setIsAddingNew(false);
              onClose();
            }} 
            className="p-1 rounded-full hover:bg-white/20 text-white/90"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-3 text-xs max-h-[75vh] overflow-y-auto">
          {isAddingNew ? (
            <LocationHierarchyForm
              onSave={handleSaveNewLocation}
              onCancel={() => setIsAddingNew(false)}
            />
          ) : (
            <>
              <div className="flex items-center justify-between gap-2 mb-1">
                <p className="text-slate-500 leading-snug">
                  Select a location to adapt weather advisories and daily routines.
                </p>
                <button
                  type="button"
                  onClick={() => setIsAddingNew(true)}
                  className="px-2.5 py-1 bg-sky-50 text-brand border border-brand/40 hover:bg-brand hover:text-white rounded-md text-[11px] font-semibold flex items-center gap-1 shrink-0 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Add Location</span>
                </button>
              </div>

              <div className="space-y-2">
                {allLocations.map(loc => {
                  const isSelected = currentLocationId === loc.id;

                  return (
                    <button
                      key={loc.id}
                      onClick={() => {
                        onSelectLocation(loc.id);
                        onClose();
                      }}
                      className={`w-full p-3 rounded-lg border text-left transition-all flex items-start justify-between gap-2 ${
                        isSelected
                          ? 'border-brand bg-brand-light/60 shadow-xs ring-1 ring-brand/30'
                          : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium text-slate-900 text-[13px] truncate">
                            {loc.name}
                          </span>
                          {loc.custom && (
                            <span className="px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 text-[9px] font-medium uppercase tracking-tight">
                              Custom
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500 mt-1">
                          <span className="bg-white px-1.5 py-0.2 rounded border border-slate-200 text-brand font-medium">
                            🏷️ {loc.purpose}
                          </span>
                          <span className="truncate">
                            {loc.area ? `${loc.area}, ` : ''}
                            {loc.city ? `${loc.city}, ` : ''}
                            {loc.district ? `${loc.district}, ` : ''}
                            {loc.state} {loc.pincode ? `(${loc.pincode})` : ''}
                          </span>
                        </div>
                        <p className="text-[10.5px] text-slate-500 mt-1 font-mono">
                          📍 {loc.latitude?.toFixed(2)}°N, {loc.longitude?.toFixed(2)}°E
                        </p>
                      </div>

                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-brand text-white flex items-center justify-center flex-shrink-0 mt-1">
                          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>

        <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
          <button
            onClick={() => {
              setIsAddingNew(false);
              onClose();
            }}
            className="px-4 py-1.5 bg-slate-200 text-slate-700 rounded text-xs font-medium hover:bg-slate-300"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

