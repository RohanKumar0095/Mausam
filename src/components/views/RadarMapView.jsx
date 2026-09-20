import React, { useState } from 'react';
import { 
  Play, 
  Pause 
} from 'lucide-react';
import { customLocationStore } from '../../data/customLocationStore';


export default function RadarMapView({ weatherData, savedLocations = [] }) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [selectedLayer, setSelectedLayer] = useState('radar');
  const [radarFrame, setRadarFrame] = useState(3);

  const frames = ['11:00 AM', '11:15 AM', '11:30 AM', '11:45 AM (Now)', '12:00 PM (Forecast)'];
  const primaryName = weatherData?.name || weatherData?.district || 'Primary Ground';
  const primaryTemp = weatherData?.current?.temp != null ? `${weatherData.current.temp}°C` : 'Live Feed';

  const userLocations = savedLocations.length > 0 ? savedLocations : customLocationStore.getAllLocations();
  const secondaryLocation = userLocations[1] ? userLocations[1].name : 'Regional Observation Zone';
  const tertiaryLocation = userLocations[2] ? userLocations[2].name : 'Surrounding Activity Corridor';

  return (
    <div className="space-y-3 px-4 py-2 pb-24 text-white">
      <div className="relative w-full h-80 rounded-mausam bg-slate-900 border border-white/20 overflow-hidden shadow-lg flex flex-col justify-between p-3">
        <div className="absolute inset-0 bg-gradient-to-b from-[#07243d] to-[#041220] opacity-90" />

        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-64 h-64 rounded-full border border-sky-500/20" />
          <div className="w-48 h-48 rounded-full border border-sky-500/25 absolute" />
          <div className="w-32 h-32 rounded-full border border-sky-500/30 absolute" />
          <div className="w-16 h-16 rounded-full border border-sky-500/40 absolute" />
          <div className="w-2 h-2 rounded-full bg-sky-400 absolute animate-ping" />
        </div>

        <div className="absolute inset-0 pointer-events-none">
          <div 
            className="absolute top-16 left-24 w-32 h-24 rounded-full bg-gradient-to-r from-emerald-500/40 via-amber-500/50 to-rose-600/60 blur-md transition-all duration-1000 transform"
            style={{ transform: `translate(${radarFrame * 6}px, ${radarFrame * 3}px)` }}
          />
          <div 
            className="absolute bottom-14 right-16 w-28 h-20 rounded-full bg-gradient-to-r from-sky-400/40 via-emerald-500/50 to-yellow-500/60 blur-md transition-all duration-1000 transform"
            style={{ transform: `translate(${radarFrame * 4}px, -${radarFrame * 2}px)` }}
          />
        </div>

        <div className="absolute top-20 left-28 z-10 flex items-center gap-1 text-[11px] font-mono text-white drop-shadow">
          <div className="w-2 h-2 rounded-full bg-amber-400" />
          <span>📍 {primaryName} ({primaryTemp})</span>
        </div>
        <div className="absolute top-12 left-44 z-10 flex items-center gap-1 text-[11px] font-mono text-white drop-shadow">
          <div className="w-2 h-2 rounded-full bg-rose-400" />
          <span>{secondaryLocation} (Precip Echo)</span>
        </div>
        <div className="absolute bottom-16 right-20 z-10 flex items-center gap-1 text-[11px] font-mono text-white drop-shadow">
          <div className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>{tertiaryLocation}</span>
        </div>

        <div className="relative z-10 flex items-center justify-between">
          <div className="flex bg-slate-900/80 p-1 rounded-lg backdrop-blur-md border border-white/20 text-[10px]">
            <button
              onClick={() => setSelectedLayer('radar')}
              className={`px-2 py-1 rounded transition-all ${selectedLayer === 'radar' ? 'bg-brand text-white font-medium' : 'text-slate-300'}`}
            >
              Doppler Radar
            </button>
            <button
              onClick={() => setSelectedLayer('satellite')}
              className={`px-2 py-1 rounded transition-all ${selectedLayer === 'satellite' ? 'bg-brand text-white font-medium' : 'text-slate-300'}`}
            >
              INSAT-3D Cloud
            </button>
            <button
              onClick={() => setSelectedLayer('lightning')}
              className={`px-2 py-1 rounded transition-all ${selectedLayer === 'lightning' ? 'bg-brand text-white font-medium' : 'text-slate-300'}`}
            >
              Lightning
            </button>
          </div>

          <span className="text-[10px] font-mono bg-slate-900/80 px-2 py-1 rounded border border-white/20 text-sky-200">
            IMD Doppler Weather Radar
          </span>
        </div>

        <div className="relative z-10 bg-slate-900/80 p-2 rounded-lg backdrop-blur-md border border-white/20 flex items-center gap-3">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="p-1.5 rounded-full bg-brand hover:bg-brand-dark text-white flex-shrink-0"
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
          </button>

          <div className="flex-1">
            <div className="flex items-center justify-between text-[10px] text-sky-200 font-mono mb-1">
              <span>{frames[radarFrame]}</span>
              <span className="text-emerald-400">Live 10-Min Loop</span>
            </div>
            <input
              type="range"
              min="0"
              max="4"
              value={radarFrame}
              onChange={e => setRadarFrame(Number(e.target.value))}
              className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-sky-400"
            />
          </div>
        </div>
      </div>

      <div className="glass-card rounded-mausam p-3 text-xs text-white space-y-1.5">
        <div className="flex items-center justify-between text-[11px] text-sky-200 font-medium">
          <span>Reflectivity Intensity (dBZ / Rain Rate)</span>
          <span className="font-mono">Light → Severe</span>
        </div>
        <div className="h-2 rounded-full bg-gradient-to-r from-sky-400 via-emerald-400 via-yellow-400 via-orange-500 to-rose-600" />
        <div className="flex justify-between text-[9px] font-mono text-sky-300/80">
          <span>10 dBZ (Drizzle)</span>
          <span>35 dBZ (Moderate)</span>
          <span>55+ dBZ (Squall/Hail)</span>
        </div>
      </div>
    </div>
  );
}
