import React from 'react';
import { 
  MapPin, 
  Check 
} from 'lucide-react';
import { customLocationStore } from '../../data/customLocationStore';

export default function LocationsView({ currentLocationId, onSelectLocation }) {
  const allLocations = customLocationStore.getAllLocations();

  return (
    <div className="space-y-4 px-4 py-2 pb-24 text-white">
      <div>
        <h3 className="text-sm font-medium text-white">Saved Locations with Purpose</h3>
        <p className="text-xs text-sky-200/80 mt-0.5 leading-snug">
          MAUSAM adapts its priorities based on what each saved location is used for (Home, Farm, Office, Travel).
        </p>
      </div>

      <div className="space-y-2.5">
        {allLocations.map(loc => {
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
                    <MapPin className="w-4 h-4 text-sky-300 flex-shrink-0" />
                    <span className="font-medium text-white text-[13.5px] truncate">
                      {loc.name}
                    </span>
                    {loc.custom && (
                      <span className="px-1.5 py-0.2 rounded bg-emerald-500/30 text-emerald-200 text-[9px] font-medium uppercase tracking-tight border border-emerald-400/30">
                        Custom
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-sky-200 mt-1">
                    <span className="bg-sky-500/30 text-sky-100 px-1.5 py-0.2 rounded border border-sky-300/30 font-medium">
                      🏷️ {loc.purpose}
                    </span>
                    <span className="truncate">{loc.address || `${loc.district}, ${loc.state}`}</span>
                  </div>

                  <p className="text-xs text-sky-100 mt-1.5 font-normal">
                    {loc.current.condition}
                  </p>
                </div>

                <div className="text-right flex-shrink-0">
                  <span className="text-2xl font-normal text-white">
                    {loc.current.temp}°C
                  </span>
                  <span className="text-[10.5px] text-sky-300 block font-mono">
                    AQI {loc.current.aqi} • {loc.current.humidity}% 💧
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
    </div>
  );
}
