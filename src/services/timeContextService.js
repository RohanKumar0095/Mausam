/**
 * TimeContextService - Centralized, Authoritative Time Management System for MAUSAM
 * 
 * Manages 3 distinct time concepts:
 * 1. CURRENT TIME: Real current device/browser time (dynamic, refreshed every minute / on focus).
 *    NEVER overwritten by activity start time, routine time, or chatbot query time.
 * 2. SCHEDULED TIME: Activity-specific selected time (stored separately per activity).
 * 3. QUERY / REFERENCE TIME: Specific time requested in chatbot/voice queries (local to request).
 */

import { parseTime, formatTime12h, normalizeTimeTo24h } from '../utils/timeUtils.js';

class TimeContextService {
  constructor() {
    this.listeners = new Set();
    this.activeTimezone = typeof Intl !== 'undefined' && Intl.DateTimeFormat
      ? (Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata')
      : 'Asia/Kolkata';

    // Auto-update timer tick every minute in browser
    if (typeof window !== 'undefined') {
      this.timerId = setInterval(() => this.notifyListeners(), 60000);
      window.addEventListener('focus', () => this.notifyListeners());
    }
  }

  /**
   * Subscribe to minute-by-minute time ticks
   */
  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notifyListeners() {
    const ctx = this.getCurrentContext();
    this.listeners.forEach(fn => fn(ctx));
  }

  /**
   * Set active location timezone (e.g., 'Asia/Kolkata')
   */
  setTimezone(tz) {
    if (tz && typeof tz === 'string') {
      this.activeTimezone = tz;
      this.notifyListeners();
    }
  }

  getTimezone() {
    return this.activeTimezone || 'Asia/Kolkata';
  }

  /**
   * Returns current real Date instance
   */
  getNow() {
    return new Date();
  }

  /**
   * Full authoritative current time context
   */
  getCurrentContext() {
    const now = this.getNow();
    const iso = now.toISOString();
    const dateStr = iso.split('T')[0];

    const hour24 = now.getHours();
    const minute = now.getMinutes();
    const period = hour24 >= 12 ? 'PM' : 'AM';
    let hour12 = hour24 % 12;
    if (hour12 === 0) hour12 = 12;

    const paddedH12 = String(hour12).padStart(2, '0');
    const paddedH24 = String(hour24).padStart(2, '0');
    const paddedM = String(minute).padStart(2, '0');
    const time12h = `${paddedH12}:${paddedM} ${period}`;
    const time24h = `${paddedH24}:${paddedM}`;

    const formattedDate = now.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });

    return {
      now,
      iso,
      currentDate: dateStr,
      formattedDate,
      time12h,
      time24h,
      displayNow: `Now • ${time12h}`,
      hour: hour24,
      minute,
      timezone: this.getTimezone(),
      currentTimestamp: now.getTime(),
      source: 'device'
    };
  }

  /**
   * Parses query time with intelligent Date Resolution & Interpretation
   * 
   * @param {string} queryText - User's chat or voice query
   * @param {Object} currentContext - Result of getCurrentContext()
   * @returns {Object} QueryTimeContext
   */
  parseQueryTimeContext(queryText = '', currentContext = null) {
    const ctx = currentContext || this.getCurrentContext();
    const q = queryText.toLowerCase().trim();

    const todayStr = ctx.currentDate;
    const tom = new Date(ctx.now);
    tom.setDate(tom.getDate() + 1);
    const tomorrowStr = tom.toISOString().split('T')[0];

    let targetDate = todayStr;
    let targetTime24h = null;
    let isExplicitDate = false;
    let isAdjustedToTomorrow = false;
    let explanationText = '';

    // 1. Detect relative/explicit date keywords
    if (q.includes('tomorrow') || q.includes('कल')) {
      targetDate = tomorrowStr;
      isExplicitDate = true;
    } else if (q.includes('tonight') || q.includes('आज रात')) {
      targetDate = todayStr;
      targetTime24h = '20:00';
      isExplicitDate = true;
    } else if (q.includes('this evening') || q.includes('आज शाम')) {
      targetDate = todayStr;
      targetTime24h = '18:00';
      isExplicitDate = true;
    } else if (q.includes('this morning') || q.includes('आज सुबह')) {
      targetDate = todayStr;
      targetTime24h = '08:00';
      isExplicitDate = true;
    }

    // 2. Extract explicit time patterns (e.g., "6 pm", "6:30 am", "at 7", "18:00")
    if (!targetTime24h) {
      const timeRegex = /(\d{1,2})(:(\d{2}))?\s*(am|pm|बजे)?/i;
      const match = q.match(timeRegex);
      if (match) {
        let hour = parseInt(match[1], 10);
        const minStr = match[3] || '00';
        const period = (match[4] || '').toLowerCase();

        if (period === 'pm' || q.includes('pm') || q.includes('शाम') || q.includes('रात') || q.includes('evening') || q.includes('night')) {
          if (hour < 12) hour += 12;
        } else if (period === 'am' || q.includes('am') || q.includes('सुबह') || q.includes('morning')) {
          if (hour === 12) hour = 0;
        }
        hour = Math.max(0, Math.min(23, hour));
        targetTime24h = `${String(hour).padStart(2, '0')}:${minStr}`;
      }
    }

    // 3. Fallback: If no time specified, default to real current time ('now')
    if (!targetTime24h) {
      if (q.includes('now') || q.includes('अभी') || q.includes('current')) {
        targetTime24h = ctx.time24h;
      } else {
        targetTime24h = ctx.time24h;
      }
    }

    // 4. Date Resolution Rule:
    // If a time was asked without specifying "tomorrow", but that hour has ALREADY PASSED today:
    // e.g. Current time is 20:00 (8 PM), user asks for "6 PM" (18:00).
    if (!isExplicitDate && targetTime24h !== ctx.time24h) {
      const [reqH] = targetTime24h.split(':').map(Number);
      if (reqH < ctx.hour) {
        targetDate = tomorrowStr;
        isAdjustedToTomorrow = true;
        const formattedTarget = formatTime12h(targetTime24h);
        explanationText = `It is currently ${ctx.time12h}, so I'm checking tomorrow's forecast for ${formattedTarget}.`;
      }
    }

    const displayTime = formatTime12h(targetTime24h);

    return {
      queryDate: targetDate,
      queryTime: targetTime24h,
      displayTime,
      isAdjustedToTomorrow,
      explanationText,
      timezone: ctx.timezone,
      source: 'explicit_user_query'
    };
  }

  /**
   * Diagnostic summary snapshot
   */
  getDiagnostics({ selectedActivity = null, queryTimeContext = null, weatherData = null } = {}) {
    const ctx = this.getCurrentContext();
    return {
      actualCurrentTime: ctx.iso,
      formattedCurrentTime: ctx.time12h,
      timezone: ctx.timezone,
      selectedActivityTime: selectedActivity ? (selectedActivity.startTime || selectedActivity.start_datetime) : null,
      queryTime: queryTimeContext ? queryTimeContext.queryTime : null,
      currentWeatherTimestamp: weatherData?.current?.dt_txt || ctx.iso,
      weatherDataSource: weatherData?.current ? 'live_current_weather' : 'skeleton_fallback'
    };
  }
}

export const timeContextService = new TimeContextService();
