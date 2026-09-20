import React, { useState } from 'react';
import { 
  X, 
  Bell, 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  ChevronRight,
  Filter,
  Info
} from 'lucide-react';
import { useI18n } from '../../i18n/i18nContext';

export default function AlertCenterModal({ alerts = [], isOpen = false, onClose, onSelectAlert }) {
  const { language } = useI18n();
  const isHindi = language === 'hi' || language === 'Hindi';

  const [activeTab, setActiveTab] = useState('ACTIVE'); // 'ACTIVE' | 'UPCOMING' | 'RESOLVED'

  if (!isOpen) return null;

  const activeAlerts = alerts.filter(a => a.status === 'ACTIVE' && a.type !== 'FORECAST_CHANGE');
  const upcomingAlerts = alerts.filter(a => a.type === 'FORECAST_CHANGE' || (a.status === 'ACTIVE' && a.type === 'ACTIVITY_IMPACT'));
  const resolvedAlerts = alerts.filter(a => a.status === 'RESOLVED');

  const displayList = activeTab === 'ACTIVE' 
    ? activeAlerts 
    : (activeTab === 'UPCOMING' ? upcomingAlerts : resolvedAlerts);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#0B132B] text-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-700/60 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sky-500/15 border border-sky-400/30 text-sky-300">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white leading-tight">
                Alert Center
              </h3>
              <span className="text-[10px] text-sky-300 block font-mono">
                Contextual Weather & Activity Warnings
              </span>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-800 bg-slate-900/40 p-1 gap-1 px-4">
          <button
            onClick={() => setActiveTab('ACTIVE')}
            className={`flex-1 py-2 text-center text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'ACTIVE' 
                ? 'bg-sky-500 text-slate-950 shadow-sm' 
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <span>ACTIVE</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-900/40 text-current">
              {activeAlerts.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('UPCOMING')}
            className={`flex-1 py-2 text-center text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'UPCOMING' 
                ? 'bg-sky-500 text-slate-950 shadow-sm' 
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <span>UPCOMING</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-900/40 text-current">
              {upcomingAlerts.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('RESOLVED')}
            className={`flex-1 py-2 text-center text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'RESOLVED' 
                ? 'bg-sky-500 text-slate-950 shadow-sm' 
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <span>RESOLVED</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-900/40 text-current">
              {resolvedAlerts.length}
            </span>
          </button>
        </div>

        {/* Content List */}
        <div className="p-4 overflow-y-auto space-y-2.5 flex-1 text-xs">
          {displayList.length === 0 ? (
            <div className="p-8 text-center text-slate-400 space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
              <p className="font-semibold text-white">No {activeTab.toLowerCase()} alerts</p>
              <p className="text-[11px] leading-relaxed max-w-xs mx-auto">
                No weather warnings match this category. All routine activities and local weather parameters are clear.
              </p>
            </div>
          ) : (
            displayList.map(alert => {
              const isCritical = alert.severity === 'CRITICAL';
              const Icon = alert.status === 'RESOLVED' ? CheckCircle2 : (isCritical ? ShieldAlert : AlertTriangle);
              const cardBg = isCritical 
                ? 'bg-rose-500/10 border-rose-500/30 hover:border-rose-400/60' 
                : (alert.status === 'RESOLVED' ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-slate-900/80 border-slate-800 hover:border-sky-400/40');

              return (
                <button
                  key={alert.alertId}
                  onClick={() => {
                    onClose();
                    onSelectAlert(alert);
                  }}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-start gap-3 group cursor-pointer ${cardBg}`}
                >
                  <div className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${isCritical ? 'bg-rose-500/20 text-rose-300' : (alert.status === 'RESOLVED' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300')}`}>
                    <Icon className="w-4 h-4" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-[10px] font-mono uppercase text-sky-300 font-semibold truncate">
                        {alert.location?.name || 'Selected Location'} • {alert.type?.replace('_', ' ')}
                      </span>
                      <span className="text-[9.5px] px-1.5 py-0.2 rounded font-mono font-bold uppercase bg-white/10 text-white">
                        {alert.severity}
                      </span>
                    </div>

                    <h4 className="text-[12.5px] font-bold text-white truncate group-hover:text-sky-200 transition-colors">
                      {alert.title}
                    </h4>

                    <p className="text-[11px] text-slate-300 mt-1 line-clamp-2 leading-relaxed">
                      {alert.summary}
                    </p>

                    {alert.activity && (
                      <span className="mt-2 text-[10px] font-mono text-amber-300 block">
                        🕒 {alert.activity.name} ({alert.activity.formattedTimeRange})
                      </span>
                    )}
                  </div>

                  <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white shrink-0 self-center transition-colors" />
                </button>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-slate-900/90 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold rounded-xl text-xs transition-colors shadow-sm"
          >
            Close Alert Center
          </button>
        </div>

      </div>
    </div>
  );
}
