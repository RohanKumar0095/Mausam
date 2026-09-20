import React, { useState } from 'react';
import { 
  MapPin, 
  Check,
  Trophy,
  Sparkles,
  Plus,
  X
} from 'lucide-react';
import { customLocationStore } from '../../data/customLocationStore';
import { useI18n } from '../../i18n/i18nContext';
import LocationHierarchyForm from '../locations/LocationHierarchyForm';

export default function LocationsView({ currentLocationId, onSelectLocation, onOpenChat }) {
  const { t, language } = useI18n();
  const isHindi = language === 'hi';

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [locationsList, setLocationsList] = useState(() => customLocationStore.getAllLocations());

  const handleSaveLocation = (locationData) => {
    const newLoc = customLocationStore.saveCustomLocation(locationData);
    setLocationsList(customLocationStore.getAllLocations());
    onSelectLocation(newLoc.id);
    setIsAddModalOpen(false);
  };

  return (
    <div className="space-y-3.5 px-4 py-2 pb-24 text-white">
      {/* 1. Header description + Add Action */}
      <div className="flex items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-white">Saved Locations & Training Grounds</h3>
          <p className="text-xs text-sky-200/80 mt-0.5 leading-snug">
            MAUSAM adapts its priorities based on location purpose (Sports, Home, Farm, Office, Travel).
          </p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-3 py-1.5 bg-sky-400/20 hover:bg-sky-400/30 text-white text-xs font-semibold rounded-lg border border-sky-300/40 shrink-0 flex items-center gap-1 transition-all hover:scale-105 active:scale-95"
        >
          <Plus className="w-3.5 h-3.5 text-sky-300" />
          <span>{isHindi ? '+ स्थान जोड़ें' : '+ Add Location'}</span>
        </button>
      </div>

      {/* 2. MAUSAM Ground & Locations Assistant Launcher Card */}
      <div className="p-3.5 rounded-2xl bg-gradient-to-br from-[#1F5C8B] via-[#1a4f78] to-[#123b5c] border border-sky-300/30 shadow-md flex items-center justify-between gap-3 text-white">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-full bg-[#D85A30] flex items-center justify-center shrink-0 border border-white/30 shadow-xs">
            <Trophy className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-bold text-white truncate">
              {t('chat_locations_assistant_title') || 'Ground & Location Assistant'}
            </h4>
            <p className="text-[10px] text-sky-200/90 leading-tight mt-0.5 line-clamp-2">
              {t('chat_locations_assistant_sub') || 'Check pitch conditions, rain probabilities, and WBGT heat stress for your grounds.'}
            </p>
          </div>
        </div>
        <button
          onClick={onOpenChat}
          className="px-3 py-1.5 bg-[#D85A30] hover:bg-[#bd4b25] text-white text-[11px] font-semibold rounded-lg shadow-sm shrink-0 flex items-center gap-1.5 transition-all border border-amber-300/30 hover:scale-105 active:scale-95"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-200 fill-amber-200" />
          <span>{t('chat_locations_assistant_btn') || 'Ask Assistant'}</span>
        </button>
      </div>

      {/* 3. Location List */}
      <div className="space-y-2.5">
        {locationsList.map(loc => {
          const isSelected = currentLocationId === loc.id;

          return (
            <button
              key={loc.id}
              onClick={() => onSelectLocation(loc.id)}
              className={`w-full text-left p-3.5 rounded-mausam border transition-all ${
                isSelected
                  ? 'bg-white/20 border-sky-300 shadow-md ring-2 ring-sky-300/40'
                  : 'bg-white/10 hover:bg-white/15 border-white/15'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-sky-300 shrink-0" />
                    <span className="font-medium text-white text-[13.5px] truncate">
                      {loc.name}
                    </span>
                    {loc.custom && (
                      <span className="px-1.5 py-0.2 rounded bg-emerald-500/30 text-emerald-200 text-[9px] font-medium uppercase tracking-tight border border-emerald-400/30">
                        Custom
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-sky-200 mt-1">
                    <span className="bg-sky-500/30 text-sky-100 px-1.5 py-0.2 rounded border border-sky-300/30 font-medium">
                      🏷️ {loc.purpose}
                    </span>
                    <span className="truncate">
                      {loc.area ? `${loc.area}, ` : ''}
                      {loc.city ? `${loc.city}, ` : ''}
                      {loc.district ? `${loc.district}, ` : ''}
                      {loc.state} {loc.pincode ? `(${loc.pincode})` : ''}
                    </span>
                  </div>

                  <p className="text-[11px] text-sky-100 mt-1 font-mono">
                    📍 {loc.latitude?.toFixed(2)}°N, {loc.longitude?.toFixed(2)}°E
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xs text-sky-200 block font-medium">
                    {loc.district || loc.city}
                  </span>
                  <span className="text-[10px] text-sky-300 block font-mono">
                    {loc.state}
                  </span>
                </div>
              </div>

              {isSelected && (
                <div className="mt-2.5 pt-2 border-t border-white/15 flex items-center justify-between text-[11px] text-sky-200">
                  <span className="flex items-center gap-1 font-medium text-sky-300">
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" /> Active Location
                  </span>
                  <span>Dashboard customized for {loc.purpose}</span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Add Location Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn text-slate-800">
          <div className="bg-white w-full max-w-lg rounded-mausam shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
            <div className="bg-brand px-4 py-3 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-sky-300" />
                <h3 className="text-sm font-semibold">
                  {isHindi ? 'नया स्थान पदानुक्रम जोड़ें' : 'Add Location Hierarchy'}
                </h3>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="p-1 rounded-full hover:bg-white/20 text-white/90">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto max-h-[82vh]">
              <LocationHierarchyForm
                onSave={handleSaveLocation}
                onCancel={() => setIsAddModalOpen(false)}
                isHindi={isHindi}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

