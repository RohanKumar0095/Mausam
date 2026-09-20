import React from 'react';
import { ShieldAlert, AlertTriangle, ChevronRight, Bell, Clock } from 'lucide-react';
import { useI18n } from '../../i18n/i18nContext';

export default function InAppAlertBanner({ alerts = [], onSelectAlert, onOpenAlertCenter }) {
  if (!alerts || alerts.length === 0) return null;

  const activeAlerts = alerts.filter(a => a.status === 'ACTIVE');
  if (activeAlerts.length === 0) return null;

  // Highest priority alert first
  const primaryAlert = activeAlerts[0];
  const additionalCount = activeAlerts.length - 1;

  const isCritical = primaryAlert.severity === 'CRITICAL';
  const isHigh = primaryAlert.severity === 'HIGH';

  let bgStyles = 'bg-amber-500/20 border-amber-400/50 text-amber-100';
  let badgeStyles = 'bg-amber-500 text-slate-950';
  let Icon = AlertTriangle;

  if (isCritical) {
    bgStyles = 'bg-rose-500/20 border-rose-400/60 text-rose-100 ring-2 ring-rose-500/30 animate-pulse-slow';
    badgeStyles = 'bg-rose-600 text-white';
    Icon = ShieldAlert;
  } else if (isHigh) {
    bgStyles = 'bg-amber-500/20 border-amber-400/50 text-amber-100';
    badgeStyles = 'bg-amber-500 text-slate-950';
    Icon = AlertTriangle;
  }

  return (
    <div className="mx-4 my-2">
      <div className={`p-3.5 rounded-mausam border backdrop-blur-md transition-all shadow-lg ${bgStyles}`}>
        <div className="flex items-start gap-2.5">
          <div className={`p-1.5 rounded-full shrink-0 mt-0.5 ${isCritical ? 'bg-rose-500/30 text-rose-200' : 'bg-amber-500/30 text-amber-200'}`}>
            <Icon className="w-4 h-4" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-1 mb-1">
              <span className={`text-[9.5px] uppercase tracking-wider font-bold px-1.5 py-0.3 rounded ${badgeStyles}`}>
                {primaryAlert.type.replace('_', ' ')} • {primaryAlert.severity}
              </span>

              {additionalCount > 0 && (
                <button
                  onClick={onOpenAlertCenter}
                  className="text-[10px] font-semibold bg-white/20 hover:bg-white/30 text-white px-2 py-0.5 rounded-full border border-white/20 transition-colors flex items-center gap-1"
                >
                  <Bell className="w-2.5 h-2.5" />
                  <span>+{additionalCount} more</span>
                </button>
              )}
            </div>

            <h4 className="text-[13px] font-bold text-white leading-snug">
              {primaryAlert.title}
            </h4>

            <p className="text-[11.5px] text-white/90 mt-1 leading-relaxed">
              {primaryAlert.summary}
            </p>

            {primaryAlert.activity && (
              <div className="mt-2 pt-1.5 border-t border-white/10 flex items-center justify-between text-[10.5px]">
                <span className="flex items-center gap-1 text-sky-200">
                  <Clock className="w-3 h-3 text-sky-300" />
                  <span>{primaryAlert.activity.name} ({primaryAlert.activity.formattedTimeRange})</span>
                </span>
              </div>
            )}

            <div className="mt-2.5 flex items-center justify-end">
              <button
                onClick={() => onSelectAlert(primaryAlert)}
                className="px-3 py-1 rounded bg-white/20 hover:bg-white/30 text-white text-[11px] font-semibold border border-white/25 flex items-center gap-1 transition-all hover:scale-105 active:scale-95 shadow-sm"
              >
                <span>View Details & Actions</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
