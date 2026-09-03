import React from 'react';
import { Menu, Search, MapPin, Sparkles, ChevronDown } from 'lucide-react';

export default function Header({
  locationData,
  currentLocationId,
  onOpenLocationPicker,
  onOpenDrawer,
  briefingText,
  currentTime,
  onOpenSearch
}) {
  const loc = locationData || { name: 'Birla Institute of Technology, circular road', purpose: 'Home' };

  return (
    <header className="relative z-20 px-4 pt-3 pb-2 text-white">
      {/* Top Bar: Hamburger, Location, Date, Search */}
      <div className="flex items-center justify-between gap-2">
        <button
          onClick={onOpenDrawer}
          className="p-2 -ml-2 rounded-full hover:bg-white/10 active:scale-95 transition-all text-white/90"
          aria-label="Open Menu"
        >
          <Menu className="w-6 h-6" />
        </button>

        <button
          onClick={onOpenLocationPicker}
          className="flex-1 flex flex-col items-center justify-center text-center px-2 py-0.5 rounded-lg hover:bg-white/10 transition-colors group"
        >
          <div className="flex items-center gap-1.5 max-w-[240px] truncate text-center">
            <MapPin className="w-4 h-4 text-sky-300 flex-shrink-0" />
            <span className="text-[15px] font-medium tracking-tight truncate text-white">
              {loc.name}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-white/70 group-hover:translate-y-0.5 transition-transform" />
          </div>
          <div className="flex items-center gap-2 text-[11px] text-sky-200/80 font-normal mt-0.5">
            <span>03 September 2026</span>
            <span>•</span>
            <span className="bg-white/20 text-white px-1.5 py-0.2 rounded text-[10px] font-medium">
              {loc.purpose || 'Personalized'}
            </span>
          </div>
        </button>

        <button
          onClick={onOpenSearch}
          className="p-2 -mr-2 rounded-full hover:bg-white/10 active:scale-95 transition-all text-white/90"
          aria-label="Search"
        >
          <Search className="w-5 h-5" />
        </button>
      </div>

      {/* Personalized Daily Briefing */}
      {briefingText && (
        <div className="mt-2.5 bg-gradient-to-r from-sky-900/70 to-brand-dark/90 backdrop-blur-md rounded-mausam p-3 border border-sky-400/25 shadow-sm text-white">
          <div className="flex items-start gap-2.5">
            <div className="w-6 h-6 rounded-full bg-sky-400/20 flex items-center justify-center flex-shrink-0 mt-0.5 border border-sky-300/30">
              <Sparkles className="w-3.5 h-3.5 text-sky-300 animate-pulse" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between text-[11px] uppercase tracking-wider text-sky-200 font-medium mb-0.5">
                <span>Personalized Daily Briefing</span>
                <span className="text-[10px] text-sky-300/80 font-mono">{currentTime} IST</span>
              </div>
              <p className="text-[13px] leading-snug text-sky-50 font-normal">
                {briefingText}
              </p>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
