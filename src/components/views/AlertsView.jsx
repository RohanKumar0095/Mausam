import React from 'react';
import { ShieldAlert, AlertTriangle, CheckCircle, Info, Radio, Zap, Wind } from 'lucide-react';
import { useI18n } from '../../i18n/i18nContext';

export default function AlertsView({ safetyInfo, weatherData, routine = [] }) {
  const { language, t } = useI18n();
  const isHindi = language === 'hi';

  const isSevere = safetyInfo?.isSevere;

  return (
    <div className="space-y-4 px-4 py-2 pb-24 text-white">
      <div>
        <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
          {t('hero_alerts_warnings')}
        </h3>
        <p className="text-xs text-sky-200/80 mt-0.5 leading-snug">
          {t('hero_imd_advisory')}
        </p>
      </div>

      {/* Active Warning Banner */}
      <div 
        className="p-4 rounded-mausam shadow-md border"
        style={{ 
          backgroundColor: safetyInfo?.bg || '#F0F6E8',
          borderColor: safetyInfo?.border || '#639922',
          color: '#1e293b'
        }}
      >
        <div className="flex items-start gap-2.5">
          {isSevere ? (
            <ShieldAlert className="w-5 h-5 flex-shrink-0 mt-0.5 text-rose-600" />
          ) : (
            <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-emerald-600" />
          )}

          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-sm" style={{ color: safetyInfo?.color || '#0F6E56' }}>
              {safetyInfo?.title}
            </h4>
            <p className="text-xs mt-1 leading-relaxed text-slate-700">
              {safetyInfo?.text}
            </p>

            {safetyInfo?.actionRequired && (
              <div className="mt-2.5 pt-2 border-t border-slate-300 text-[11.5px] font-semibold text-rose-800">
                {safetyInfo.actionRequired}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Warning Color Legend */}
      <div className="p-3 bg-white/10 backdrop-blur-md rounded-mausam border border-white/15 space-y-2 text-xs">
        <span className="font-semibold text-sky-100 uppercase tracking-wider text-[11px] block">
          {isHindi ? 'IMD रंग कोड चेतावनी वर्गीकरण' : 'IMD Color-Coded Warning Levels'}
        </span>

        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <div className="p-2 rounded bg-emerald-950/40 border border-emerald-500/40 text-emerald-200">
            <span className="font-bold block">🟢 GREEN</span>
            <span>{isHindi ? 'कोई चेतावनी नहीं (सुरक्षित)' : 'No Warning (Safe)'}</span>
          </div>
          <div className="p-2 rounded bg-yellow-950/40 border border-yellow-500/40 text-yellow-200">
            <span className="font-bold block">🟡 YELLOW</span>
            <span>{isHindi ? 'निगरानी रखें (अपडेट रहें)' : 'Watch (Be Updated)'}</span>
          </div>
          <div className="p-2 rounded bg-amber-950/40 border border-amber-500/40 text-amber-200">
            <span className="font-bold block">🟠 ORANGE</span>
            <span>{isHindi ? 'तैयार रहें (सतर्क)' : 'Alert (Be Prepared)'}</span>
          </div>
          <div className="p-2 rounded bg-rose-950/40 border border-rose-500/40 text-rose-200">
            <span className="font-bold block">🔴 RED</span>
            <span>{isHindi ? 'कार्रवाई करें (चेतावनी)' : 'Warning (Take Action)'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
