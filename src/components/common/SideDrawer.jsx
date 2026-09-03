import React from 'react';
import { 
  X, 
  User, 
  MapPin, 
  Sprout, 
  Plane, 
  Users, 
  Flame, 
  Zap, 
  Radio, 
  CloudRain, 
  Navigation, 
  Globe, 
  Heart, 
  Bell, 
  ChevronRight,
  Sparkles,
  Settings,
  LogOut,
  UserCheck
} from 'lucide-react';

export default function SideDrawer({ 
  isOpen, 
  onClose, 
  currentLocation, 
  onSelectTab,
  currentUser,
  currentLanguage = 'English',
  onOpenProfile,
  onOpenLogin,
  onLogout 
}) {
  if (!isOpen) return null;

  const menuItems = [
    { id: 'agromet', label: 'Agromet Products', icon: Sprout, tab: 'forecast' },
    { id: 'aviation', label: 'Aviation Weather', icon: Plane, tab: 'forecast' },
    { id: 'crowdsource', label: 'Crowd Source', icon: Users, tab: 'forecast' },
    { id: 'cyclone', label: 'Cyclone Tracker', icon: Flame, tab: 'alerts' },
    { id: 'lightning', label: 'Lightning Nowcast', icon: Zap, tab: 'alerts' },
    { id: 'radar', label: 'Radar & Satellite', icon: Radio, tab: 'radar' },
    { id: 'rain_alert', label: 'Rain Alert', icon: CloudRain, tab: 'alerts' },
    { id: 'route_cast', label: 'Route Now Cast', icon: Navigation, tab: 'forecast' },
  ];

  const secondaryItems = [
    { id: 'lang', label: currentLanguage || 'English', icon: Globe, hasArrow: true, action: onOpenProfile },
    { id: 'favs', label: 'Favourites', icon: Heart, tab: 'locations' },
    { id: 'notifs', label: 'Notification', icon: Bell, tab: 'alerts' },
  ];

  const isLoggedIn = !!(currentUser && currentUser.userId);

  return (
    <div className="fixed inset-0 z-50 flex">
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity animate-fadeIn"
      />

      <div className="relative w-80 max-w-[85vw] bg-white h-full shadow-2xl flex flex-col z-10 animate-slideIn">
        {/* User Profile Header */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white flex-shrink-0 shadow-xs ${
                isLoggedIn ? 'bg-brand' : 'bg-slate-300 text-slate-600'
              }`}>
                {isLoggedIn ? <UserCheck className="w-5 h-5" /> : <User className="w-5 h-5" />}
              </div>
              <div className="min-w-0">
                {isLoggedIn ? (
                  <div>
                    <h4 className="text-sm font-medium text-slate-900 truncate font-mono">
                      @{currentUser.userId}
                    </h4>
                    <button
                      onClick={() => {
                        onClose();
                        onOpenProfile();
                      }}
                      className="text-[11px] text-brand hover:underline font-medium block"
                    >
                      Personalization & Routine
                    </button>
                  </div>
                ) : (
                  <div>
                    <h4 className="text-sm font-medium text-slate-900">Guest User</h4>
                    <button
                      onClick={() => {
                        onClose();
                        onOpenLogin();
                      }}
                      className="text-[11px] text-brand font-medium hover:underline"
                    >
                      Log in / Sign up
                    </button>
                  </div>
                )}
              </div>
            </div>

            <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
          </div>

          {currentLocation && (
            <div className="bg-white p-2.5 rounded-lg border border-slate-200 text-xs text-slate-700 flex items-start gap-2 shadow-2xs">
              <MapPin className="w-4 h-4 text-brand flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate text-[12px]">{currentLocation.name}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">{currentLocation.current?.temp}°C • {currentLocation.current?.condition}</p>
              </div>
            </div>
          )}
        </div>

        {/* IMD Weather Services */}
        <div className="flex-1 overflow-y-auto py-2">
          <div className="px-3 pb-1 text-[10px] uppercase tracking-wider text-slate-400 font-medium">
            IMD Weather Services
          </div>

          {menuItems.map(item => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => {
                  if (item.tab && onSelectTab) onSelectTab(item.tab);
                  onClose();
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-slate-700 hover:bg-slate-50 active:bg-slate-100 transition-colors text-xs font-normal"
              >
                <Icon className="w-4 h-4 text-slate-500 stroke-[1.8]" />
                <span className="flex-1 text-[13px]">{item.label}</span>
              </button>
            );
          })}

          <div className="my-2 border-t border-slate-100" />

          {secondaryItems.map(item => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => {
                  if (item.action) {
                    onClose();
                    item.action();
                  } else if (item.tab && onSelectTab) {
                    onSelectTab(item.tab);
                    onClose();
                  }
                }}
                className="w-full flex items-center justify-between px-4 py-2 text-left text-slate-700 hover:bg-slate-50 transition-colors text-xs"
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 text-slate-500 stroke-[1.8]" />
                  <span className="text-[13px]">{item.label}</span>
                </div>
                {item.hasArrow && <ChevronRight className="w-4 h-4 text-slate-400" />}
              </button>
            );
          })}

          {isLoggedIn && (
            <button
              onClick={() => {
                onClose();
                onLogout();
              }}
              className="w-full flex items-center gap-3 px-4 py-2 text-left text-rose-600 hover:bg-rose-50 transition-colors text-xs mt-1"
            >
              <LogOut className="w-4 h-4 stroke-[1.8]" />
              <span className="text-[13px] font-medium">Logout</span>
            </button>
          )}
        </div>

        {/* Hackathon SIH 2026 Footer info */}
        <div className="p-3 border-t border-slate-100 bg-brand-light/40 text-[11px] text-brand">
          <div className="flex items-center gap-1.5 font-medium">
            <Sparkles className="w-3.5 h-3.5" />
            <span>SIH 2026 — Problem SIH26076</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-0.5">
            Personalized Homepage for MAUSAM Mobile App
          </p>
        </div>
      </div>
    </div>
  );
}
