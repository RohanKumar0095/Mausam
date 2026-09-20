/**
 * Time Utility Functions for AM/PM to 24h Normalization & 12h Formatting
 */

/**
 * Parses any time format (e.g. "07:00 AM", "05:30 PM", "17:00", "7:00", { time: "07:00", period: "AM" })
 * into structured time parts.
 *
 * @param {string|object} input 
 * @returns {{ hour24: number, minute: number, hour12: number, period: string, display12h: string, time24h: string }}
 */
export function parseTime(input) {
  if (!input) {
    return { hour24: 0, minute: 0, hour12: 12, period: 'AM', display12h: '12:00 AM', time24h: '00:00' };
  }

  let timeStr = '';
  let explicitPeriod = null;

  if (typeof input === 'object') {
    if (input.period) {
      explicitPeriod = input.period.toUpperCase();
    }
    timeStr = input.time || input.start_time || input.end_time || '';
  } else if (typeof input === 'string') {
    timeStr = input.replace(/Now\s*•\s*/gi, '').trim();
  }

  // Check if string already contains AM/PM
  const amPmMatch = timeStr.match(/(AM|PM)/i);
  if (amPmMatch) {
    explicitPeriod = amPmMatch[1].toUpperCase();
    timeStr = timeStr.replace(/(AM|PM)/i, '').trim();
  }

  const parts = timeStr.split(':');
  let rawHour = parseInt(parts[0], 10);
  if (isNaN(rawHour)) rawHour = 0;

  let minute = parseInt(parts[1], 10);
  if (isNaN(minute)) minute = 0;

  let hour24 = rawHour;
  let period = explicitPeriod;

  if (explicitPeriod) {
    // 12-hour format with explicit AM/PM
    let h12 = rawHour % 12;
    if (h12 === 0) h12 = 12; // 12 AM or 12 PM

    if (explicitPeriod === 'PM') {
      hour24 = (rawHour === 12) ? 12 : rawHour + 12;
      if (rawHour < 12) hour24 = rawHour + 12;
    } else { // AM
      hour24 = (rawHour === 12) ? 0 : rawHour;
    }
  } else {
    // No explicit AM/PM provided. Infer from 24h hour value.
    if (rawHour >= 12) {
      period = 'PM';
    } else {
      period = 'AM';
    }
    hour24 = rawHour % 24;
  }

  // Ensure bounds
  hour24 = Math.max(0, Math.min(23, hour24));
  minute = Math.max(0, Math.min(59, minute));

  let hour12 = hour24 % 12;
  if (hour12 === 0) hour12 = 12;

  const paddedHour24 = String(hour24).padStart(2, '0');
  const paddedMinute = String(minute).padStart(2, '0');
  const paddedHour12 = String(hour12).padStart(2, '0');

  return {
    hour24,
    minute,
    hour12,
    period,
    display12h: `${paddedHour12}:${paddedMinute} ${period}`,
    time24h: `${paddedHour24}:${paddedMinute}`
  };
}

/**
 * Normalizes input time to 24-hour "HH:MM" string.
 * Examples:
 *  "07:00 AM" -> "07:00"
 *  "07:00 PM" -> "19:00"
 *  "12:00 AM" -> "00:00"
 *  "12:00 PM" -> "12:00"
 */
export function normalizeTimeTo24h(input) {
  return parseTime(input).time24h;
}

/**
 * Formats input time to 12-hour "HH:MM AM/PM" string.
 * Examples:
 *  "17:00" -> "05:00 PM"
 *  "07:00" -> "07:00 AM"
 *  "00:00" -> "12:00 AM"
 *  "12:00" -> "12:00 PM"
 */
export function formatTime12h(input) {
  return parseTime(input).display12h;
}

/**
 * Returns integer 24-hour value (0-23).
 */
export function getHourFromTime(input) {
  return parseTime(input).hour24;
}

/**
 * Formats a range of start and end times into 12-hour display string.
 * Example: "07:00 AM – 08:00 AM"
 */
export function formatTimeRange12h(startTime, endTime) {
  const startStr = formatTime12h(startTime);
  const endStr = formatTime12h(endTime);
  return `${startStr} – ${endStr}`;
}
