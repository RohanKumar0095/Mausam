import React from 'react';
import { 
  X, 
  User, 
  Globe, 
  MapPin, 
  Clock, 
  LogOut, 
  Edit3 
} from 'lucide-react';
import { PERSONAS } from '../../data/personaDefinitions';

export default function ProfileModal({
  isOpen,
  onClose,
  currentUser,
  currentLanguage,
  selectedPersonas = [],
  routine = [],
  onEditPersonalization,
  onEditRoutine,
  onManageLocations,
  onChangeLanguage,
  onLogout
}) {
  if (!isOpen) return null;

  const activePersonaObjects = PERSONAS.filter(p => selectedPersonas.includes(p.id));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white w-full max-w-sm rounded-mausam shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
        <div className="bg-brand px-4 py-3 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-sky-300" />
            <h3 className="text-sm font-medium">My Profile & Preferences</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-white/20 text-white/90">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto space-y-3.5 text-xs text-slate-700">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 font-mono uppercase block">User ID</span>
              <span className="font-medium text-slate-900 text-sm font-mono">
                @{currentUser?.userId || 'rohan_weather'}
              </span>
            </div>
            <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-medium">
              Verified
            </span>
          </div>

          <div className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-brand" />
              <div>
                <span className="text-slate-500 text-[10px] block">App Language</span>
                <span className="font-medium text-slate-800">{currentLanguage || 'English'}</span>
              </div>
            </div>
            <button
              onClick={onChangeLanguage}
              className="text-brand hover:underline font-medium text-[11px]"
            >
              Change
            </button>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-medium text-slate-700 text-[11px] uppercase tracking-wider">
                Personalized Profiles
              </span>
              <button
                onClick={onEditPersonalization}
                className="text-brand text-[11px] font-medium hover:underline flex items-center gap-0.5"
              >
                <Edit3 className="w-3 h-3" /> Edit
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {activePersonaObjects.map(p => (
                <span
                  key={p.id}
                  className="px-2 py-0.5 rounded text-[11px] font-medium text-white shadow-2xs"
                  style={{ backgroundColor: p.color }}
                >
                  {p.label}
                </span>
              ))}
            </div>
          </div>

          <div className="space-y-1.5 pt-1 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <span className="font-medium text-slate-700 text-[11px] uppercase tracking-wider">
                Daily Routine ({routine.length} slots)
              </span>
              <button
                onClick={onEditRoutine}
                className="text-brand text-[11px] font-medium hover:underline flex items-center gap-0.5"
              >
                <Clock className="w-3 h-3" /> Manage
              </button>
            </div>
            <div className="space-y-1 text-[11px] text-slate-600">
              {routine.slice(0, 2).map(act => (
                <div key={act.id} className="flex items-center justify-between">
                  <span>{act.label}</span>
                  <span className="font-mono text-slate-400">{act.startTime}–{act.endTime}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 space-y-1.5">
            <button
              onClick={onManageLocations}
              className="w-full py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded text-slate-700 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
            >
              <MapPin className="w-3.5 h-3.5 text-brand" />
              <span>Manage Saved Locations</span>
            </button>

            <button
              onClick={onLogout}
              className="w-full py-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </div>

        <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 text-right">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-brand text-white rounded text-xs font-medium hover:bg-brand-dark"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
