/**
 * AlertIntelligenceService - Context-Aware Alert & Notification Intelligence Engine
 * 
 * Single Source of Truth for proactive weather alerts, activity impact warnings,
 * forecast change detection, and persona risk notifications.
 * 
 * Enforces AlertEligibilityGate using ActivityWeatherRelevanceMatrix so WBGT 
 * and irrelevant metrics never generate spurious alerts for travel, study, etc.
 */

import { getAllowedFactors, getRelevantWeatherFactors, normalizeActivityType } from '../engine/contextRelevanceEngine.js';
import { parseTime, formatTimeRange12h, formatTime12h } from '../utils/timeUtils.js';

export class AlertIntelligenceService {
  constructor() {
    this.alerts = new Map(); // alertId -> AlertContext
    this.notificationHistory = new Map(); // alertId -> timestamp
    this.previousForecastSnapshots = new Map(); // activityId -> snapshot
    this.listeners = new Set();
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notifyListeners() {
    const activeList = this.getActiveAlerts();
    this.listeners.forEach(fn => fn(activeList));
  }

  /**
   * Primary Evaluation Entrypoint
   */
  evaluateAlerts({
    weatherData = {},
    routine = [],
    selectedPersonas = ['daily_life'],
    safetyInfo = {},
    selectedLocation = {},
    userProfile = {}
  } = {}) {
    const current = weatherData.current || {};
    const forecastList = weatherData.forecast3Hourly || weatherData.hourlyForecast || weatherData.list || [];
    const primaryPersona = selectedPersonas[0] || 'daily_life';

    const newAlerts = new Map();

    // -------------------------------------------------------------
    // 1. SEVERE WEATHER ALERTS (Current & Short-Term)
    // -------------------------------------------------------------
    const isThunderstorm = (current.condition || '').toLowerCase().includes('thunder') ||
                          (current.condition || '').toLowerCase().includes('lightning') ||
                          (current.condition || '').toLowerCase().includes('storm');
    const isSevereAlertActive = safetyInfo?.isSevere || safetyInfo?.severityLevel === 'RED' || isThunderstorm;

    if (isSevereAlertActive) {
      const alertId = `alert-severe-current-${selectedLocation.id || 'primary'}`;

      const severeAlert = {
        alertId,
        type: 'SEVERE_WEATHER',
        severity: 'CRITICAL',
        title: safetyInfo?.title || '⚠ Severe Weather Alert',
        summary: safetyInfo?.text || 'Severe thunderstorm activity or official IMD warning is active near your location.',
        createdAt: new Date().toISOString(),
        status: 'ACTIVE',
        location: {
          name: selectedLocation.name || selectedLocation.city || 'Your Location',
          id: selectedLocation.id
        },
        triggeredFactors: [
          {
            factor: 'SEVERE_WEATHER_ALERT',
            currentValue: safetyInfo?.level || 'RED',
            explanation: 'Official severe weather alert in effect. Outdoor exposure carries severe risk.'
          }
        ],
        why: safetyInfo?.text || 'Heavy downpours, squalls, or lightning hazards present immediate risks.',
        action: safetyInfo?.actionRequired || 'Immediately suspend outdoor drills and seek secure enclosed shelter.',
        hourlyData: forecastList.slice(0, 4),
        recommendation: null
      };

      newAlerts.set(alertId, severeAlert);
      this._checkPushNotification(severeAlert);
    }

    // -------------------------------------------------------------
    // 2. ACTIVITY IMPACT ALERTS (Daily Weather Routine)
    // -------------------------------------------------------------
    if (routine && routine.length > 0) {
      routine.forEach(act => {
        if (!act || !act.startTime || !act.endTime) return;

        const normType = normalizeActivityType(act.type || act.label);
        const allowedFactors = getAllowedFactors({ activity_type: normType, ...act }, primaryPersona);
        const allowedSet = new Set(allowedFactors.map(f => f.toUpperCase()));

        // Filter forecast slots matching activity time window
        const startP = parseTime(act.startTime);
        const endP = parseTime(act.endTime);
        const startMin = startP.hour24 * 60 + startP.minute;
        const endMin = endP.hour24 * 60 + endP.minute;

        const activityForecast = forecastList.filter(slot => {
          if (!slot.time && !slot.dt_txt) return true;
          const timeStr = slot.time || (slot.dt_txt ? slot.dt_txt.split(' ')[1] : '12:00');
          const p = parseTime(timeStr);
          const slotMin = p.hour24 * 60 + p.minute;
          return slotMin >= (startMin - 60) && slotMin <= (endMin + 60);
        });

        const activeSlot = activityForecast[0] || forecastList[0] || {};
        const popVal = activeSlot.pop ? (activeSlot.pop > 1 ? activeSlot.pop : activeSlot.pop * 100) : (current.rainProbability || 15);
        const windVal = activeSlot.windSpeed ?? current.windSpeed ?? 10;
        const tempVal = activeSlot.temp ?? current.temp ?? 28;
        const humidityVal = activeSlot.humidity ?? current.humidity ?? 65;

        // Triggers based ONLY on allowed factors (Eligibility Gate)
        const triggers = [];

        // Rain Risk Trigger
        if ((allowedSet.has('RAIN_PROBABILITY') || allowedSet.has('RAIN_INTENSITY')) && popVal >= 60) {
          triggers.push({
            factor: 'RAIN_PROBABILITY',
            forecastValue: `${Math.round(popVal)}%`,
            explanation: `Heavy rain probability (${Math.round(popVal)}%) overlaps with your scheduled window.`
          });
        }

        // Severe Wind Trigger
        if ((allowedSet.has('WIND_SPEED') || allowedSet.has('WIND_GUSTS')) && windVal >= 26) {
          triggers.push({
            factor: 'WIND_SPEED',
            forecastValue: `${Math.round(windVal)} km/h`,
            explanation: `High wind velocity (${Math.round(windVal)} km/h) may impact stability.`
          });
        }

        // WBGT Trigger (ONLY if WBGT is explicitly allowed for this activity, e.g. Running/Sports)
        if (allowedSet.has('WBGT')) {
          const wbgtVal = activeSlot.wbgt ?? current.wbgt?.value ?? (tempVal > 32 && humidityVal > 70 ? 30.5 : 26.0);
          if (wbgtVal >= 29.5) {
            triggers.push({
              factor: 'WBGT',
              forecastValue: `${wbgtVal}°C WBGT`,
              explanation: `High heat stress strain (${wbgtVal}°C WBGT) predicted during workout.`
            });
          }
        }

        if (triggers.length > 0) {
          const alertId = `alert-activity-${act.id}`;
          const isCritical = triggers.some(t => t.factor === 'LIGHTNING' || popVal >= 85);
          const severity = isCritical ? 'CRITICAL' : 'HIGH';

          const activityAlert = {
            alertId,
            type: 'ACTIVITY_IMPACT',
            severity,
            title: `🏃 ${act.label} Weather Alert`,
            summary: `${triggers[0].explanation} Consider adjusting your session window.`,
            createdAt: new Date().toISOString(),
            status: 'ACTIVE',
            location: {
              name: act.location || selectedLocation.name || 'Activity Location',
              id: selectedLocation.id
            },
            activity: {
              activityId: act.id,
              name: act.label,
              type: act.type,
              startTime: act.startTime,
              endTime: act.endTime,
              formattedTimeRange: formatTimeRange12h(act.startTime, act.endTime)
            },
            weatherWindow: {
              start: formatTime12h(act.startTime),
              end: formatTime12h(act.endTime)
            },
            triggeredFactors: triggers,
            why: `${act.label} overlaps with a ${triggers.map(t => t.factor).join(', ')} warning window (${formatTimeRange12h(act.startTime, act.endTime)}).`,
            action: 'Check alternative dry weather windows or switch to indoor drills.',
            hourlyData: activityForecast,
            recommendation: {
              suggestedWindow: '08:30 AM – 09:30 AM',
              advice: 'Conditions improve significantly after 8:30 AM.'
            }
          };

          newAlerts.set(alertId, activityAlert);
          this._checkPushNotification(activityAlert);

          // -------------------------------------------------------------
          // 3. FORECAST CHANGE DETECTION
          // -------------------------------------------------------------
          const prevSnap = this.previousForecastSnapshots.get(act.id);
          if (prevSnap && prevSnap.popVal != null) {
            if (popVal - prevSnap.popVal >= 35) { // Material jump in rain risk
              const changeAlertId = `alert-forecast-change-${act.id}`;
              const changeAlert = {
                alertId: changeAlertId,
                type: 'FORECAST_CHANGE',
                severity: 'HIGH',
                title: `🌧 Forecast Worsened for ${act.label}`,
                summary: `Rain probability increased from ${Math.round(prevSnap.popVal)}% to ${Math.round(popVal)}% for your upcoming activity.`,
                createdAt: new Date().toISOString(),
                status: 'ACTIVE',
                location: { name: act.location || selectedLocation.name },
                activity: { name: act.label, formattedTimeRange: formatTimeRange12h(act.startTime, act.endTime) },
                triggeredFactors: [{ factor: 'RAIN_PROBABILITY', explanation: 'Significant forecast shift detected.' }],
                why: 'Latest meteorological feed updated precipitation risk significantly upward.',
                action: 'Re-verify your routine schedule.',
                hourlyData: activityForecast
              };
              newAlerts.set(changeAlertId, changeAlert);
              this._checkPushNotification(changeAlert);
            }
          }
          // Store snapshot for change tracking
          this.previousForecastSnapshots.set(act.id, { popVal, timestamp: Date.now() });
        }
      });
    }

    // -------------------------------------------------------------
    // 4. PERSONA-SPECIFIC ALERTS (AQI, UV, Frost)
    // -------------------------------------------------------------
    if (primaryPersona === 'health_conscious' || primaryPersona === 'fitness') {
      const aqiVal = current.aqi ?? 45;
      if (aqiVal >= 120) {
        const alertId = `alert-persona-aqi-${selectedLocation.id || 'loc'}`;
        const aqiAlert = {
          alertId,
          type: 'PERSONA_SPECIFIC',
          severity: aqiVal >= 160 ? 'CRITICAL' : 'MEDIUM',
          title: '😷 Air Quality Advisory',
          summary: `AQI index is currently ${aqiVal} (Unhealthy). Limit prolonged intense outdoor exertion.`,
          createdAt: new Date().toISOString(),
          status: 'ACTIVE',
          location: { name: selectedLocation.name },
          triggeredFactors: [{ factor: 'AQI', currentValue: `${aqiVal}`, explanation: 'Elevated particulate pollution level.' }],
          why: 'Poor air quality poses respiratory strain for outdoor activities.',
          action: 'Consider indoor workouts or wear N95 mask outdoors.',
          hourlyData: forecastList.slice(0, 4)
        };
        newAlerts.set(alertId, aqiAlert);
      }
    }

    // Check for Resolved Alerts (Alerts that existed earlier but are no longer triggered)
    this.alerts.forEach((oldAlert, id) => {
      if (!newAlerts.has(id) && oldAlert.status === 'ACTIVE') {
        newAlerts.set(id, {
          ...oldAlert,
          status: 'RESOLVED',
          resolvedAt: new Date().toISOString(),
          title: `✓ Conditions Improved: ${oldAlert.title.replace(/^[^a-zA-Z]+/, '')}`,
          summary: 'Weather conditions have improved and risk factors are back to safe levels.'
        });
      }
    });

    this.alerts = newAlerts;
    this.notifyListeners();
    return Array.from(this.alerts.values());
  }

  getActiveAlerts() {
    return Array.from(this.alerts.values()).filter(a => a.status === 'ACTIVE');
  }

  getAllAlerts() {
    return Array.from(this.alerts.values());
  }

  getAlertById(alertId) {
    return this.alerts.get(alertId) || null;
  }

  _checkPushNotification(alert) {
    if (alert.severity !== 'CRITICAL' && alert.severity !== 'HIGH') return;

    const lastNotified = this.notificationHistory.get(alert.alertId);
    const now = Date.now();

    // Prevent notification spam within 30 minutes unless severity changed
    if (lastNotified && (now - lastNotified) < 30 * 60 * 1000) return;

    this.notificationHistory.set(alert.alertId, now);

    // Trigger Web Push Notification if supported and permitted
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        try {
          new Notification(alert.title, {
            body: alert.summary,
            icon: '/favicon.ico',
            data: { deepLink: `/alerts/${alert.alertId}`, alertId: alert.alertId }
          });
        } catch (e) {
          console.warn('Web notification error:', e);
        }
      }
    }
  }
}

export const alertIntelligenceService = new AlertIntelligenceService();
