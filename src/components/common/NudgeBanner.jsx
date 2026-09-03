import React from 'react';
import { Lightbulb, ArrowRight, X, Sun, CloudRain, PartyPopper, Sprout, Flame } from 'lucide-react';

const NUDGE_ICONS = {
  Sun,
  CloudRain,
  PartyPopper,
  Sprout,
  Flame,
  default: Lightbulb
};

export default function NudgeBanner({ nudge, onAction, onDismiss }) {
  if (!nudge) return null;

  const IconComponent = NUDGE_ICONS[nudge.icon] || NUDGE_ICONS.default;

  return (
    <div className="px-4 py-1 animate-fadeIn">
      <div className="bg-amber-50/95 border border-amber-300/80 rounded-mausam p-3 shadow-sm text-slate-800 backdrop-blur-sm">
        <div className="flex items-start gap-2.5">
          <div 
            className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-white mt-0.5 shadow-xs"
            style={{ backgroundColor: nudge.badgeColor || '#BA7517' }}
          >
            <IconComponent className="w-4 h-4" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-1 mb-0.5">
              <span 
                className="text-[10px] font-medium tracking-wider px-1.5 py-0.2 rounded text-white"
                style={{ backgroundColor: nudge.badgeColor || '#BA7517' }}
              >
                💡 {nudge.badge}
              </span>
              {onDismiss && (
                <button
                  onClick={onDismiss}
                  className="p-1 -mr-1 text-slate-400 hover:text-slate-600 rounded"
                  aria-label="Dismiss"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <p className="text-[12.5px] leading-snug font-normal text-slate-800 mt-1">
              {nudge.message}
            </p>

            {nudge.actionLabel && (
              <button
                onClick={() => onAction && onAction(nudge.actionTab)}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-brand hover:text-brand-dark mt-2 group"
              >
                <span>{nudge.actionLabel}</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
