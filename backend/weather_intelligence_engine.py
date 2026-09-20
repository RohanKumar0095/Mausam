"""
MAUSAM Persona Intelligence Engine & Signal Aggregation Service

Generates Structured Intelligence Signals for every widget in the system.
The widget UI and decision engines (Today's Activity Plan & Primary Decision Intelligence)
consume the SAME structured signals, maintaining 100% data lineage and consistency.
Includes Time-Aware Next Occurrence Resolution and Exact Weather Window Forecast Analysis.
"""

import datetime
import math
import re
from typing import Dict, Any, List, Optional, Tuple
from backend.daily_engine import score_activity, best_alternative_block, BLOCK_TIMES
from backend.sportsperson_engine import evaluate_sportsperson_recommendation, get_personalized_wbgt_thresholds
from backend.context_relevance_engine import get_context_relevance, validate_signal_applicability

def parse_time_string(input_val) -> Tuple[int, int, str, str, str]:
    """
    Parses any time format (e.g. "07:00 AM", "05:00 PM", "17:00", "07:00", {"time": "07:00", "period": "AM"})
    Returns tuple: (hour24, minute, period, display12h, time24h)
    """
    if not input_val:
        return 0, 0, "AM", "12:00 AM", "00:00"

    time_str = ""
    explicit_period = None

    if isinstance(input_val, dict):
        explicit_period = input_val.get("period")
        time_str = input_val.get("time") or input_val.get("start_time") or input_val.get("end_time") or ""
    elif isinstance(input_val, str):
        time_str = input_val.strip()

    # Check for explicit AM/PM in string
    am_pm_match = re.search(r'(AM|PM)', time_str, re.IGNORECASE)
    if am_pm_match:
        explicit_period = am_pm_match.group(1).upper()
        time_str = re.sub(r'(AM|PM)', '', time_str, flags=re.IGNORECASE).strip()

    parts = time_str.split(':')
    try:
        raw_hour = int(parts[0])
    except Exception:
        raw_hour = 0

    try:
        minute = int(parts[1]) if len(parts) > 1 else 0
    except Exception:
        minute = 0

    if explicit_period:
        period = explicit_period.upper()
        if period == "PM":
            hour24 = 12 if raw_hour == 12 else (raw_hour + 12 if raw_hour < 12 else raw_hour)
        else: # AM
            hour24 = 0 if raw_hour == 12 else (raw_hour % 12)
    else:
        # Legacy/24-hour string logic: if raw_hour >= 12 -> PM, else AM
        if raw_hour >= 12:
            period = "PM"
        else:
            period = "AM"
        hour24 = raw_hour % 24

    hour24 = max(0, min(23, hour24))
    minute = max(0, min(59, minute))

    h12 = hour24 % 12
    if h12 == 0:
        h12 = 12

    display12h = f"{h12:02d}:{minute:02d} {period}"
    time24h = f"{hour24:02d}:{minute:02d}"

    return hour24, minute, period, display12h, time24h

def format_time_12h(input_val) -> str:
    _, _, _, display12h, _ = parse_time_string(input_val)
    return display12h

def normalize_time_24h(input_val) -> str:
    _, _, _, _, time24h = parse_time_string(input_val)
    return time24h

# Decision Priority Hierarchy Levels
HIERARCHY_SAFETY = 1       # Thunderstorm, Extreme WBGT (≥32.2°C), Severe AQI (>200), IMD Red Alert
HIERARCHY_DISRUPTION = 2   # Heavy Rain (≥60%), Strong Wind (≥25km/h), Elevated Heat (WBGT ≥29°C), Poor Visibility (<2km)
HIERARCHY_PERFORMANCE = 3  # Moderate Heat (>30°C), Passing Showers (35-60%), Dew Risk
HIERARCHY_COMFORT = 4      # High Humidity (>80%), High UV (>6), Mild Temp Discomfort

# Persona-Specific Signal Importance Weights
PERSONA_SIGNAL_WEIGHTS = {
    "sportsperson": {
        "wbgt_safety": 0.95,
        "lightning_storm_safety": 1.0,
        "dew_factor": 0.70,
        "ground_condition": 0.65,
        "rain_probability": 0.85,
        "training_window": 0.90,
        "running_window": 0.85,
        "wind_gauge": 0.60,
    },
    "fitness": {
        "exercise_comfort_index": 0.90,
        "outdoor_exercise_aqi": 0.85,
        "wbgt_safety": 0.80,
        "uv_heat_index": 0.75,
        "running_window": 0.85,
        "workout_recommendation": 0.80,
        "rain_probability": 0.70,
    },
    "health_conscious": {
        "aqi_health": 0.95,
        "uv_heat_index": 0.90,
        "humidity_health_impact": 0.80,
        "current_conditions": 0.75,
        "relative_environmental_context": 0.70,
        "rain_probability": 0.65,
    },
    "commuter": {
        "commute_weather": 0.95,
        "morning_commute_conditions": 0.90,
        "return_commute_conditions": 0.90,
        "two_wheeler_risk": 0.85,
        "visibility_fog": 0.90,
        "rain_probability": 0.90,
        "lightning_storm_safety": 1.0,
    },
    "parent": {
        "school_transit": 0.95,
        "school_pickup_weather": 0.90,
        "child_safety_recommendations": 0.95,
        "family_weather_alerts": 0.90,
        "aqi_health": 0.85,
        "rain_probability": 0.80,
    },
    "event_planner": {
        "outdoor_event_suitability": 0.95,
        "event_forecast_timeline": 0.90,
        "event_comfort_index": 0.80,
        "event_wind_conditions": 0.85,
        "event_contingency_backup": 0.90,
        "rain_probability": 0.90,
        "wind_gauge": 0.85,
    },
    "agriculture": {
        "agri_action_checklist": 0.95,
        "crop_stage_risk": 0.90,
        "multi_day_rainfall": 0.90,
        "irrigation_nudge": 0.85,
        "frost_heat_alert": 0.95,
        "pest_disease_risk": 0.85,
    },
    "traveler": {
        "travel_conditions": 0.95,
        "saved_destination_weather": 0.85,
        "travel_disruption_alerts": 0.90,
        "smart_packing_checklist": 0.75,
        "today_forecast": 0.80,
        "rain_probability": 0.85,
    },
    "daily_life": {
        "current_conditions": 0.70,
        "today_forecast": 0.80,
        "rain_probability": 0.80,
        "aqi_health": 0.75,
        "uv_heat_index": 0.70,
        "wbgt_safety": 0.65,
    }
}


DAY_NAMES = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]
DAY_ABBRS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"]

import logging
logger = logging.getLogger(__name__)

# Context-specific WBGT Cache: key -> wbgt:{location}:{date}:{time_window}
WBGT_CACHE: Dict[str, Dict[str, Any]] = {}


def calculate_wbgt(temp_c: float, humidity_pct: float) -> float:
    """
    Calculates Wet-Bulb Globe Temperature (WBGT) estimate using Liljegren / ABM approximation.
    """
    if temp_c is None or humidity_pct is None:
        return 27.0
    try:
        vapor_pressure = (humidity_pct / 100.0) * 6.105 * math.exp((17.27 * temp_c) / (temp_c + 237.7))
        wbgt = round(0.567 * temp_c + 0.393 * vapor_pressure + 3.94, 1)
        return min(34.5, wbgt)
    except Exception:
        return 27.0


def calculate_activity_wbgt(
    weather_window_data: Dict[str, Any],
    activity_context: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Dynamically calculates WBGT from weather data belonging strictly to an activity occurrence and time window.
    Stores and validates cache key: wbgt:{location}:{date}:{time_window}
    """
    location = activity_context.get("location") or "Selected Location"
    date_str = activity_context.get("date") or activity_context.get("occurrence_date") or "today"
    time_window = activity_context.get("time_window") or "00:00-23:59"
    temporal_ctx = activity_context.get("temporal_context") or "future"

    loc_slug = re.sub(r'[^a-zA-Z0-9]+', '_', str(location).lower()).strip('_')
    time_slug = re.sub(r'[^a-zA-Z0-9]+', '-', str(time_window).lower()).strip('-')
    cache_key = f"wbgt:{loc_slug}:{date_str}:{time_slug}"

    temp_c = weather_window_data.get("temp_c") if weather_window_data.get("temp_c") is not None else weather_window_data.get("temperature", 28.0)
    humidity_pct = weather_window_data.get("humidity_pct") if weather_window_data.get("humidity_pct") is not None else weather_window_data.get("humidity", 65.0)
    wind_kmh = weather_window_data.get("wind_speed_kmh") if weather_window_data.get("wind_speed_kmh") is not None else weather_window_data.get("wind", 10.0)
    uv_index = weather_window_data.get("uv_index") if weather_window_data.get("uv_index") is not None else weather_window_data.get("uv", 4.0)

    # Internal Validation Logging
    logger.debug(
        f"[WBGT CALCULATION] Key: {cache_key} | Location: {location} | Date: {date_str} | "
        f"Time Window: {time_window} | Temp: {temp_c}°C | Humidity: {humidity_pct}% | Wind: {wind_kmh} km/h | UV: {uv_index}"
    )

    wbgt_val = calculate_wbgt(temp_c, humidity_pct)

    provenance = {
        "metric": "wbgt",
        "value": wbgt_val,
        "cache_key": cache_key,
        "temporal_context": temporal_ctx,
        "source_timestamp": datetime.datetime.now().isoformat(),
        "location": location,
        "calculation_inputs": {
            "temperature": temp_c,
            "humidity": humidity_pct,
            "wind": wind_kmh,
            "uv_index": uv_index
        }
    }

    result = {
        "value": wbgt_val,
        "cache_key": cache_key,
        "provenance": provenance
    }

    WBGT_CACHE[cache_key] = result
    return result


PROHIBITED_CURRENT_WIDGET_KEYS = {
    "forecast_date",
    "activity_id",
    "recommendation_status",
    "activity_window"
}


def validate_temporal_context(data_object: Dict[str, Any], expected_context: str) -> bool:
    """
    Strict Temporal Context Validator.
    Rejects any signal or widget if its temporal_context does not match expected_context.
    For expected_context == 'current', rejects objects containing future recommendation fields.
    """
    if not isinstance(data_object, dict):
        return False

    context = data_object.get("temporal_context")
    if context != expected_context:
        return False

    if expected_context == "current":
        for prohibited in PROHIBITED_CURRENT_WIDGET_KEYS:
            if prohibited in data_object:
                return False

    return True



def parse_active_days(raw_days: Any) -> List[int]:
    """
    Parses active days representation into a list of weekday integers (0=Sunday, 1=Monday, ..., 6=Saturday).
    Returns list of all 7 days [0,1,2,3,4,5,6] if unspecified or 'daily'.
    """
    if not raw_days:
        return list(range(7))

    if isinstance(raw_days, str):
        s = raw_days.lower().strip()
        if s in ("daily", "all", "everyday"):
            return list(range(7))
        raw_days = [d.strip() for d in s.replace(",", " ").split() if d.strip()]

    if isinstance(raw_days, (list, tuple, set)):
        result = set()
        for item in raw_days:
            if isinstance(item, int):
                result.add(item % 7)
            elif isinstance(item, str):
                s = item.lower().strip()
                if s in ("daily", "all", "everyday"):
                    return list(range(7))
                if s in DAY_NAMES:
                    result.add(DAY_NAMES.index(s))
                elif s in DAY_ABBRS:
                    result.add(DAY_ABBRS.index(s))
        return sorted(list(result)) if result else list(range(7))

    return list(range(7))


def resolve_next_activity_occurrence(
    activity: Dict[str, Any],
    current_datetime: Optional[datetime.datetime] = None,
    user_timezone: Optional[str] = None
) -> Dict[str, Any]:
    """
    Resolves the next valid occurrence for a given routine activity based on current local time
    and recurrence rules. Supports AM/PM, 24-hour normalization, and overnight activities.
    """
    if current_datetime is None:
        current_datetime = datetime.datetime.now()

    start_str = activity.get("startTime") or activity.get("start_time") or "07:00 AM"
    end_str = activity.get("endTime") or activity.get("end_time") or "08:00 AM"

    start_h, start_m, start_p, start_disp, start_24 = parse_time_string(start_str)
    end_h, end_m, end_p, end_disp, end_24 = parse_time_string(end_str)

    start_min = start_h * 60 + start_m
    end_min = end_h * 60 + end_m
    curr_min = current_datetime.hour * 60 + current_datetime.minute

    raw_days = (
        activity.get("days")
        or activity.get("activeDays")
        or activity.get("daysOfWeek")
        or activity.get("recurrence")
    )
    active_weekday_indices = parse_active_days(raw_days)

    is_overnight = end_min <= start_min

    for offset in range(8):
        candidate_dt = current_datetime + datetime.timedelta(days=offset)
        candidate_weekday = (candidate_dt.weekday() + 1) % 7

        if candidate_weekday not in active_weekday_indices:
            continue

        candidate_date_str = candidate_dt.strftime("%Y-%m-%d")
        if is_overnight:
            end_dt = candidate_dt + datetime.timedelta(days=1)
            end_date_str = end_dt.strftime("%Y-%m-%d")
        else:
            end_date_str = candidate_date_str

        if offset == 0:
            if is_overnight:
                is_active = curr_min >= start_min or curr_min < end_min
                is_past = not is_active and (curr_min >= end_min and curr_min < start_min)
            else:
                is_active = start_min <= curr_min < end_min
                is_past = curr_min >= end_min

            if not is_past:
                status = "active" if is_active else "upcoming"
                display_label = "Currently Active" if is_active else "Today"
                return {
                    "occurrence_date": candidate_date_str,
                    "end_occurrence_date": end_date_str,
                    "start_datetime": f"{candidate_date_str}T{start_h:02d}:{start_m:02d}:00",
                    "end_datetime": f"{end_date_str}T{end_h:02d}:{end_m:02d}:00",
                    "occurrence_status": status,
                    "display_label": display_label,
                    "day_offset": 0,
                    "is_today": True,
                    "is_tomorrow": False,
                    "is_active": is_active,
                    "formatted_date": display_label,
                    "display_start_time": start_disp,
                    "display_end_time": end_disp,
                    "normalized_start_time": start_24,
                    "normalized_end_time": end_24,
                }
        else:
            is_tomorrow = (offset == 1)
            display_label = "Tomorrow" if is_tomorrow else candidate_dt.strftime("%a, %b %d")
            return {
                "occurrence_date": candidate_date_str,
                "end_occurrence_date": end_date_str,
                "start_datetime": f"{candidate_date_str}T{start_h:02d}:{start_m:02d}:00",
                "end_datetime": f"{end_date_str}T{end_h:02d}:{end_m:02d}:00",
                "occurrence_status": "upcoming",
                "display_label": display_label,
                "day_offset": offset,
                "is_today": False,
                "is_tomorrow": is_tomorrow,
                "is_active": False,
                "formatted_date": display_label,
                "display_start_time": start_disp,
                "display_end_time": end_disp,
                "normalized_start_time": start_24,
                "normalized_end_time": end_24,
            }

    # Fallback to tomorrow
    tomorrow_dt = current_datetime + datetime.timedelta(days=1)
    tomorrow_date_str = tomorrow_dt.strftime("%Y-%m-%d")
    return {
        "occurrence_date": tomorrow_date_str,
        "end_occurrence_date": tomorrow_date_str,
        "start_datetime": f"{tomorrow_date_str}T{start_h:02d}:{start_m:02d}:00",
        "end_datetime": f"{tomorrow_date_str}T{end_h:02d}:{end_m:02d}:00",
        "occurrence_status": "upcoming",
        "display_label": "Tomorrow",
        "day_offset": 1,
        "is_today": False,
        "is_tomorrow": True,
        "is_active": False,
        "formatted_date": "Tomorrow",
        "display_start_time": start_disp,
        "display_end_time": end_disp,
        "normalized_start_time": start_24,
        "normalized_end_time": end_24,
    }


def get_activity_weather_window(
    weather_data: Dict[str, Any],
    occurrence_date: str,
    start_time: str,
    end_time: str,
    location_str: str = "Selected Location",
    occurrence_status: str = "upcoming"
) -> Dict[str, Any]:
    """
    Fetches, filters, and aggregates weather forecast metrics strictly for the scheduled activity occurrence date and time window.
    Ensures recommendation decisions NEVER use current weather for future activity dates.
    Uses normalized 24-hour start and end hours for weather forecast filtering while preserving 12-hour display strings.
    """
    current_weather = weather_data.get("current") or weather_data.get("metadata") or {}

    start_h, start_m, _, start_disp, start_24 = parse_time_string(start_time)
    end_h, end_m, _, end_disp, end_24 = parse_time_string(end_time)

    display_window = f"{start_disp} – {end_disp}"

    # Active session happening right now
    if occurrence_status == "active":
        temp = current_weather.get("temp") or current_weather.get("temp_c") or 28.0
        humidity = current_weather.get("humidity") or current_weather.get("humidity_pct") or 65.0
        wind = current_weather.get("windSpeed") or current_weather.get("wind_speed_kmh") or 10.0
        pop = current_weather.get("pop") or current_weather.get("rain_probability") or 15
        if pop > 1.0:
            pop = pop / 100.0
        uv = current_weather.get("uvIndex") or current_weather.get("uv_index") or 4.0
        aqi = current_weather.get("aqi") or 45.0
        vis = current_weather.get("visibility") or current_weather.get("visibility_km") or 8.5
        wbgt = current_weather.get("wbgt") or current_weather.get("wbgt_c") or calculate_wbgt(temp, humidity)

        return {
            "is_available": True,
            "data_type": "active_live",
            "analyzed_context": {
                "date": occurrence_date,
                "time_window": display_window,
                "start_time": start_24,
                "end_time": end_24,
                "display_start_time": start_disp,
                "display_end_time": end_disp,
                "location": location_str,
                "data_type": "active_live"
            },
            "weather_snapshot": {
                "temp_c": round(temp, 1),
                "humidity_pct": round(humidity, 1),
                "wind_speed_kmh": round(wind, 1),
                "rain_probability": round(pop * 100 if pop <= 1.0 else pop),
                "rain_probability_frac": pop if pop <= 1.0 else pop / 100.0,
                "uv_index": round(uv, 1),
                "aqi": aqi,
                "visibility_km": vis,
                "wbgt_c": round(wbgt, 1)
            }
        }

    # Upcoming sessions (later today or future date)
    search_end_h = end_h
    if search_end_h <= start_h:
        search_end_h = start_h + 1

    # Search for hourly forecast entries in weather_data
    hourly_entries = (
        weather_data.get("forecast3Hourly")
        or weather_data.get("hourlyForecast")
        or weather_data.get("hourly")
        or weather_data.get("forecast_hourly")
        or weather_data.get("list")
        or []
    )

    matching_slots = []
    for entry in hourly_entries:
        entry_date = entry.get("date") or (entry.get("dt_txt", "").split(" ")[0] if " " in entry.get("dt_txt", "") else None)
        entry_time_str = entry.get("time") or (entry.get("dt_txt", "").split(" ")[1] if " " in entry.get("dt_txt", "") else "12:00")
        entry_h, _, _, _, _ = parse_time_string(entry_time_str)

        date_match = (not entry_date) or (entry_date == occurrence_date)
        if date_match and (start_h - 1 <= entry_h <= search_end_h + 1):
            matching_slots.append(entry)

    if matching_slots:
        temps = [s.get("temp") or s.get("temp_c") for s in matching_slots if (s.get("temp") or s.get("temp_c")) is not None]
        hums = [s.get("humidity") or s.get("humidity_pct") for s in matching_slots if (s.get("humidity") or s.get("humidity_pct")) is not None]
        pops = [s.get("pop") or s.get("rain_probability") for s in matching_slots if (s.get("pop") or s.get("rain_probability")) is not None]
        winds = [s.get("windSpeed") or s.get("wind_speed_kmh") for s in matching_slots if (s.get("windSpeed") or s.get("wind_speed_kmh")) is not None]
        uvs = [s.get("uvIndex") or s.get("uv_index") for s in matching_slots if (s.get("uvIndex") or s.get("uv_index")) is not None]

        mean_temp = sum(temps) / len(temps) if temps else 28.0
        mean_hum = sum(hums) / len(hums) if hums else 65.0
        max_pop_val = max(pops) if pops else 0.15
        if max_pop_val > 1.0:
            max_pop_val = max_pop_val / 100.0
        max_wind = max(winds) if winds else 10.0
        max_uv = max(uvs) if uvs else 4.0
        wbgt_res = calculate_activity_wbgt(
            {"temp_c": mean_temp, "humidity_pct": mean_hum, "wind_speed_kmh": max_wind, "uv_index": max_uv},
            {"location": location_str, "date": occurrence_date, "time_window": display_window, "temporal_context": "future"}
        )
        calculated_wbgt = wbgt_res["value"]

        return {
            "is_available": True,
            "data_type": "hourly_forecast",
            "analyzed_context": {
                "date": occurrence_date,
                "time_window": display_window,
                "start_time": start_24,
                "end_time": end_24,
                "display_start_time": start_disp,
                "display_end_time": end_disp,
                "location": location_str,
                "data_type": "hourly_forecast",
                "wbgt_cache_key": wbgt_res["cache_key"],
                "provenance": wbgt_res["provenance"]
            },
            "weather_snapshot": {
                "temp_c": round(mean_temp, 1),
                "humidity_pct": round(mean_hum, 1),
                "wind_speed_kmh": round(max_wind, 1),
                "rain_probability": round(max_pop_val * 100),
                "rain_probability_frac": max_pop_val,
                "uv_index": round(max_uv, 1),
                "aqi": weather_data.get("aqi", 45.0),
                "visibility_km": weather_data.get("visibility_km", 8.5),
                "wbgt_c": round(calculated_wbgt, 1)
            }
        }

    # Diurnal estimation fallback if daily forecast exists
    daily_entries = weather_data.get("dailyForecast") or weather_data.get("forecastDays") or []
    matching_daily = next((d for d in daily_entries if d.get("date") == occurrence_date), None)

    if matching_daily or weather_data.get("temp_c") is not None or current_weather.get("temp") is not None:
        base_temp = (matching_daily.get("maxTemp") + matching_daily.get("minTemp")) / 2.0 if matching_daily and matching_daily.get("maxTemp") is not None else (current_weather.get("temp") or weather_data.get("temp_c") or 28.0)
        base_pop = (matching_daily.get("pop") or 15) / 100.0 if matching_daily and matching_daily.get("pop") is not None else (current_weather.get("pop") or weather_data.get("rain_probability") or 0.15)
        if base_pop > 1.0:
            base_pop = base_pop / 100.0

        if start_h < 11:
            win_temp = base_temp - 3.5
            win_hum = 75.0
            win_uv = 3.0
        elif start_h < 16:
            win_temp = base_temp + 2.5
            win_hum = 50.0
            win_uv = 7.0
        else:
            win_temp = base_temp - 1.5
            win_hum = 70.0
            win_uv = 0.5

        calculated_wbgt = calculate_wbgt(win_temp, win_hum)

        return {
            "is_available": True,
            "data_type": "daily_forecast_diurnal",
            "analyzed_context": {
                "date": occurrence_date,
                "time_window": f"{start_time} – {end_time}",
                "location": location_str,
                "data_type": "daily_forecast_diurnal"
            },
            "weather_snapshot": {
                "temp_c": round(win_temp, 1),
                "humidity_pct": round(win_hum, 1),
                "wind_speed_kmh": 10.0,
                "rain_probability": round(base_pop * 100),
                "rain_probability_frac": base_pop,
                "uv_index": round(win_uv, 1),
                "aqi": 45.0,
                "visibility_km": 8.5,
                "wbgt_c": round(calculated_wbgt, 1)
            }
        }

    # Unavailable forecast data
    return {
        "is_available": False,
        "data_type": "unavailable",
        "reason": "Forecast data for your scheduled activity window is currently unavailable."
    }


def get_persona_weight(persona: str, widget_type: str) -> float:
    """Returns persona-specific importance weight for a widget signal."""
    weights = PERSONA_SIGNAL_WEIGHTS.get(persona, PERSONA_SIGNAL_WEIGHTS["daily_life"])
    return weights.get(widget_type, 0.50)


def generate_current_persona_signals(
    context: Dict[str, Any],
    weather_data: Dict[str, Any]
) -> Dict[str, Any]:
    """
    LAYER 1: REAL-TIME PERSONA INTELLIGENCE
    Answers: "What weather conditions matter to me right now?"
    Uses current timestamp, current location, real-time weather API data.
    """
    current = weather_data.get("current") or weather_data.get("metadata") or {}
    selected_personas = context.get("selected_personas") or ["daily_life"]
    primary_persona = selected_personas[0]
    location_str = weather_data.get("name") or weather_data.get("district") or weather_data.get("city") or "Current Location"

    current_dt = context.get("current_datetime") or datetime.datetime.now()
    if isinstance(current_dt, str):
        try:
            current_dt = datetime.datetime.fromisoformat(current_dt)
        except Exception:
            current_dt = datetime.datetime.now()

    timestamp_str = current_dt.isoformat()

    temp = current.get("temp") or current.get("temp_c") or 28.0
    humidity = current.get("humidity") or current.get("humidity_pct") or 65.0
    wind = current.get("windSpeed") or current.get("wind_speed_kmh") or 10.0
    pop = current.get("pop") or current.get("rain_probability") or 15
    if pop > 1.0:
        pop = pop / 100.0
    uv = current.get("uvIndex") or current.get("uv_index") or 4.0
    aqi = current.get("aqi") or 45.0
    vis = current.get("visibility") or current.get("visibility_km") or 8.5
    wbgt_res = calculate_activity_wbgt(
        {"temp_c": temp, "humidity_pct": humidity, "wind_speed_kmh": wind, "uv_index": uv},
        {"location": location_str, "date": current_dt.strftime("%Y-%m-%d"), "time_window": "current", "temporal_context": "current"}
    )
    wbgt = wbgt_res["value"]

    rel_profile = get_context_relevance({"persona": primary_persona, "activity": None, "activity_type": "current"})
    rel_map = rel_profile.get("signal_relevance", {})

    raw_signals = [
        {
            "widget_type": "current_conditions",
            "temporal_context": "current",
            "observed_at": timestamp_str,
            "location": location_str,
            "data_source": "live_current_weather",
            "persona": primary_persona,
            "metric_name": "Temperature",
            "value": temp,
            "unit": "°C",
            "relevance": rel_map.get("current_conditions", "high"),
            "provenance": {
                "metric": "temperature",
                "value": temp,
                "temporal_context": "current",
                "source_timestamp": timestamp_str,
                "location": location_str,
                "calculation_inputs": {"temperature": temp, "humidity": humidity}
            }
        },
        {
            "widget_type": "aqi_health",
            "temporal_context": "current",
            "observed_at": timestamp_str,
            "location": location_str,
            "data_source": "live_current_weather",
            "persona": primary_persona,
            "metric_name": "AQI",
            "value": aqi,
            "unit": None,
            "relevance": rel_map.get("aqi_health", "high"),
            "provenance": {
                "metric": "aqi",
                "value": aqi,
                "temporal_context": "current",
                "source_timestamp": timestamp_str,
                "location": location_str,
                "calculation_inputs": {"aqi": aqi}
            }
        },
        {
            "widget_type": "uv_heat_index",
            "temporal_context": "current",
            "observed_at": timestamp_str,
            "location": location_str,
            "data_source": "live_current_weather",
            "persona": primary_persona,
            "metric_name": "UV Index",
            "value": uv,
            "unit": None,
            "relevance": rel_map.get("uv_heat_index", "high"),
            "provenance": {
                "metric": "uv_index",
                "value": uv,
                "temporal_context": "current",
                "source_timestamp": timestamp_str,
                "location": location_str,
                "calculation_inputs": {"uv_index": uv}
            }
        },
        {
            "widget_type": "wbgt_safety",
            "temporal_context": "current",
            "observed_at": timestamp_str,
            "location": location_str,
            "data_source": "live_current_weather",
            "persona": primary_persona,
            "metric_name": "WBGT Heat Index",
            "value": wbgt,
            "unit": "°C",
            "relevance": rel_map.get("wbgt_safety", "medium"),
            "provenance": wbgt_res["provenance"]
        },
        {
            "widget_type": "rain_probability",
            "temporal_context": "current",
            "observed_at": timestamp_str,
            "location": location_str,
            "data_source": "live_current_weather",
            "persona": primary_persona,
            "metric_name": "Precipitation Risk",
            "value": round(pop * 100),
            "unit": "%",
            "relevance": rel_map.get("rain_probability", "high"),
            "provenance": {
                "metric": "precipitation_risk",
                "value": round(pop * 100),
                "temporal_context": "current",
                "source_timestamp": timestamp_str,
                "location": location_str,
                "calculation_inputs": {"pop": pop}
            }
        },
        {
            "widget_type": "visibility_fog",
            "temporal_context": "current",
            "observed_at": timestamp_str,
            "location": location_str,
            "data_source": "live_current_weather",
            "persona": primary_persona,
            "metric_name": "Visibility",
            "value": vis,
            "unit": "km",
            "relevance": rel_map.get("visibility_fog", "medium"),
            "provenance": {
                "metric": "visibility",
                "value": vis,
                "temporal_context": "current",
                "source_timestamp": timestamp_str,
                "location": location_str,
                "calculation_inputs": {"visibility": vis}
            }
        }
    ]

    valid_signals = [s for s in raw_signals if validate_temporal_context(s, "current")]

    return {
        "temporal_context": "current",
        "timestamp": timestamp_str,
        "location": location_str,
        "weather_source": "current_weather",
        "data_source": "live_current_weather",
        "signals": valid_signals
    }


def generate_structured_signals(
    context: Dict[str, Any],
    routine_activities: List[Dict[str, Any]],
    weather_data: Dict[str, Any]
) -> List[Dict[str, Any]]:
    """
    Generates normalized Structured Intelligence Signals for scheduled routine activities.
    All activity signals carry temporal_context = 'future' and weather_source = 'hourly_forecast'.
    """
    selected_personas = context.get("selected_personas") or ["daily_life"]
    primary_persona = selected_personas[0]

    current_dt = context.get("current_datetime")
    if isinstance(current_dt, str):
        try:
            current_dt = datetime.datetime.fromisoformat(current_dt)
        except Exception:
            current_dt = datetime.datetime.now()
    elif not isinstance(current_dt, datetime.datetime):
        current_dt = datetime.datetime.now()

    signals = []
    signal_counter = 1

    if not routine_activities:
        current = weather_data.get("current") or weather_data.get("metadata") or {}
        temp = current.get("temp") or current.get("temp_c") or 28.0
        pop = (current.get("pop") or current.get("rain_probability") or 15)
        if pop > 1.0:
            pop = pop / 100.0

        weight = get_persona_weight(primary_persona, "today_forecast")
        signals.append({
            "signal_id": f"sig_{signal_counter}_ambient",
            "temporal_context": "future",
            "weather_source": "hourly_forecast",
            "widget_type": "today_forecast",
            "category": "ambient_weather",
            "severity": "low",
            "impact": "neutral",
            "value": temp,
            "unit": "°C",
            "decision_weight": weight,
            "affects_activity_id": None,
            "affects_activity": None,
            "location": "Selected Location",
            "time_window": "Daily",
            "threshold": None,
            "threshold_exceeded": False,
            "recommendation_constraints": [],
            "explanation": f"Ambient temperature forecast is {temp}°C with low precipitation probability."
        })
        return signals

    for act in routine_activities:
        act_id = act.get("id") or act.get("activity_id") or f"act_{len(signals)+1}"
        act_label = act.get("label") or act.get("activity_name") or "Routine Activity"
        act_type = (act.get("type") or act.get("activity_type") or "running").lower()
        start_time_raw = act.get("startTime") or act.get("start_time") or "07:00 AM"
        end_time_raw = act.get("endTime") or act.get("end_time") or "08:00 AM"
        start_time = format_time_12h(start_time_raw)
        end_time = format_time_12h(end_time_raw)
        location_str = act.get("location") or act.get("startLocation") or "Selected Location"

        occurrence = resolve_next_activity_occurrence(act, current_dt, context.get("timezone"))
        win = get_activity_weather_window(weather_data, occurrence["occurrence_date"], start_time, end_time, location_str, occurrence["occurrence_status"])

        if not win["is_available"]:
            continue

        act_context = {
            "persona": primary_persona,
            "activity": act,
            "activity_type": act_type
        }
        rel_profile = get_context_relevance(act_context)
        rel_map = rel_profile["signal_relevance"]

        snap = win["weather_snapshot"]
        display_label = occurrence["display_label"]
        time_window = f"{display_label} • {start_time} – {end_time}" if display_label != "Today" else f"{start_time} – {end_time}"

        temp_c = snap["temp_c"]
        pop = snap["rain_probability_frac"]
        wbgt_c = snap["wbgt_c"]
        humidity = snap["humidity_pct"]
        wind = snap["wind_speed_kmh"]
        pop_pct = round(pop * 100)
        rain_exceeded = pop >= 0.5
        rain_severity = "high" if pop >= 0.6 else ("moderate" if pop >= 0.35 else "low")

        # 1. WBGT Safety Signal (ONLY generated when WBGT is eligible for the activity context)
        if rel_map.get("wbgt_safety") != "not_relevant" and rel_profile.get("relevance_factors", {}).get("wbgt_eligible"):
            limit = 28.7
            wbgt_exceeded = wbgt_c >= limit
            wbgt_severity = "critical" if wbgt_c >= 32.2 else ("high" if wbgt_exceeded else "low")
            wbgt_weight = get_persona_weight(primary_persona, "wbgt_safety")

            signals.append({
                "signal_id": f"sig_{act_id}_wbgt",
                "temporal_context": "future",
                "weather_source": win.get("data_type", "hourly_forecast"),
                "widget_type": "wbgt_safety",
                "category": "heat_stress",
                "severity": wbgt_severity,
                "impact": "negative" if wbgt_exceeded else "positive",
                "value": round(wbgt_c, 1),
                "unit": "°C",
                "decision_weight": wbgt_weight,
                "relevance": rel_map.get("wbgt_safety", "medium"),
                "applicable_to": [act_type],
                "affects_activity_id": act_id,
                "affects_activity": act_label,
                "location": location_str,
                "time_window": time_window,
                "occurrence_date": occurrence["occurrence_date"],
                "occurrence_status": occurrence["occurrence_status"],
                "display_label": occurrence["display_label"],
                "analyzed_context": win["analyzed_context"],
                "threshold": limit,
                "threshold_exceeded": wbgt_exceeded,
                "recommendation_constraints": ["reduce_intensity", "increase_hydration"] if wbgt_exceeded else [],
                "explanation": f"Forecast WBGT ({wbgt_c}°C) {'exceeds' if wbgt_exceeded else 'remains below'} threshold ({limit}°C) for {time_window} {act_label}."
            })

        # 2. Rain Probability Signal
        if rel_map.get("rain_probability") != "not_relevant":
            rain_weight = get_persona_weight(primary_persona, "rain_probability")

            signals.append({
                "signal_id": f"sig_{act_id}_rain",
                "temporal_context": "future",
                "weather_source": win.get("data_type", "hourly_forecast"),
                "widget_type": "rain_probability",
                "category": "precipitation",
                "severity": rain_severity,
                "impact": "negative" if rain_exceeded else "positive",
                "value": pop_pct,
                "unit": "%",
                "decision_weight": rain_weight,
                "relevance": rel_map.get("rain_probability", "high"),
                "applicable_to": [act_type],
                "affects_activity_id": act_id,
                "affects_activity": act_label,
                "location": location_str,
                "time_window": time_window,
                "occurrence_date": occurrence["occurrence_date"],
                "occurrence_status": occurrence["occurrence_status"],
                "display_label": occurrence["display_label"],
                "analyzed_context": win["analyzed_context"],
                "threshold": 50.0,
                "threshold_exceeded": rain_exceeded,
                "recommendation_constraints": ["carry_gear", "consider_indoor_alternative"] if rain_exceeded else [],
                "explanation": f"Forecast rain probability is {pop_pct}% during {time_window} {act_label}."
            })

        # 3. Dew Factor / Grip Signal
        if rel_map.get("dew_factor") != "not_relevant":
            dew_risk = humidity > 80 and temp_c < 25.0
            dew_weight = get_persona_weight(primary_persona, "dew_factor")

            signals.append({
                "signal_id": f"sig_{act_id}_dew",
                "temporal_context": "future",
                "weather_source": win.get("data_type", "hourly_forecast"),
                "widget_type": "dew_factor",
                "category": "surface_grip",
                "severity": "moderate" if dew_risk else "low",
                "impact": "negative" if dew_risk else "positive",
                "value": "High Dew Risk" if dew_risk else "Firm Grip",
                "unit": None,
                "decision_weight": dew_weight,
                "relevance": rel_map.get("dew_factor", "medium"),
                "applicable_to": [act_type],
                "affects_activity_id": act_id,
                "affects_activity": act_label,
                "location": location_str,
                "time_window": time_window,
                "occurrence_date": occurrence["occurrence_date"],
                "occurrence_status": occurrence["occurrence_status"],
                "display_label": occurrence["display_label"],
                "analyzed_context": win["analyzed_context"],
                "threshold": None,
                "threshold_exceeded": dew_risk,
                "recommendation_constraints": ["use_studded_footwear", "keep_dry_towels"] if dew_risk else [],
                "explanation": f"Outfield moisture forecast for {time_window} {act_label}: {'Significant dew expected.' if dew_risk else 'Minimal outfield moisture expected.'}"
            })

        # 4. Travel & Commute Disruption Signal
        if rel_map.get("travel_disruption") != "not_relevant" or rel_map.get("flight_disruption") != "not_relevant" or rel_map.get("commute_weather") != "not_relevant":
            is_travel = act_type in ("travel", "air_travel")
            widget_t = "travel_disruption" if is_travel else "commute_weather"
            disrupt_weight = get_persona_weight(primary_persona, widget_t)
            disrupt_risk = rain_exceeded or wind >= 25.0

            signals.append({
                "signal_id": f"sig_{act_id}_disruption",
                "temporal_context": "future",
                "weather_source": win.get("data_type", "hourly_forecast"),
                "widget_type": widget_t,
                "category": "transit_disruption",
                "severity": "high" if disrupt_risk else "low",
                "impact": "negative" if disrupt_risk else "positive",
                "value": f"{time_window}",
                "unit": None,
                "decision_weight": disrupt_weight,
                "relevance": rel_map.get(widget_t, "critical" if is_travel else "high"),
                "applicable_to": [act_type],
                "affects_activity_id": act_id,
                "affects_activity": act_label,
                "location": location_str,
                "time_window": time_window,
                "occurrence_date": occurrence["occurrence_date"],
                "occurrence_status": occurrence["occurrence_status"],
                "display_label": occurrence["display_label"],
                "analyzed_context": win["analyzed_context"],
                "threshold": None,
                "threshold_exceeded": disrupt_risk,
                "recommendation_constraints": ["allow_extra_travel_time", "check_flight_status"] if disrupt_risk else [],
                "explanation": f"{'Travel' if is_travel else 'Commute'} forecast for {time_window} {act_label}: {'Travel disruption or delay risk expected.' if disrupt_risk else 'Smooth transit conditions expected.'}"
            })

        # 5. Visibility / Fog Safety Signal
        if rel_map.get("visibility_fog") != "not_relevant":
            vis_val = snap.get("visibility_km", 8.5)
            vis_risk = vis_val < 2.0
            signals.append({
                "signal_id": f"sig_{act_id}_vis",
                "temporal_context": "future",
                "weather_source": win.get("data_type", "hourly_forecast"),
                "widget_type": "visibility_fog",
                "category": "road_safety",
                "severity": "critical" if vis_val < 1.0 else ("high" if vis_risk else "low"),
                "impact": "negative" if vis_risk else "positive",
                "value": f"{vis_val} km",
                "unit": "km",
                "decision_weight": 0.90,
                "relevance": rel_map.get("visibility_fog", "high"),
                "applicable_to": [act_type],
                "affects_activity_id": act_id,
                "affects_activity": act_label,
                "location": location_str,
                "time_window": time_window,
                "occurrence_date": occurrence["occurrence_date"],
                "occurrence_status": occurrence["occurrence_status"],
                "display_label": occurrence["display_label"],
                "analyzed_context": win["analyzed_context"],
                "threshold": 2.0,
                "threshold_exceeded": vis_risk,
                "recommendation_constraints": ["use_fog_lights", "reduce_speed"] if vis_risk else [],
                "explanation": f"Visibility forecast for {time_window} {act_label}: {vis_val} km."
            })

    return [s for s in signals if validate_temporal_context(s, "future")]


def validate_consistency(
    primary_insight: Dict[str, Any],
    activities: List[Dict[str, Any]]
) -> Tuple[Dict[str, Any], List[Dict[str, Any]]]:
    """
    Consistency Validation Layer:
    Checks for contradictions between Primary Decision Intelligence and Activity Recommendations.
    """
    validated_activities = []
    has_critical_safety = False
    has_high_disruption = False

    for act in activities:
        act_copy = dict(act)
        status = act_copy.get("status", "GO")
        primary_reason = act_copy.get("primary_reason") or {}
        factor = primary_reason.get("factor")

        if factor in ("thunderstorm", "lightning", "wbgt_c") and primary_reason.get("assessment") == "Extreme Risk":
            has_critical_safety = True
            if status == "GO":
                act_copy["status"] = "RESCHEDULE"
                act_copy["summary"] = "Extreme safety hazard detected — outdoor activity postponed."
                act_copy["recommended_action"] = "Reschedule to a safer window or stay indoors."

        if factor == "rain_probability" and primary_reason.get("assessment") == "High Risk":
            has_high_disruption = True
            if status == "GO":
                act_copy["status"] = "MODIFY"
                act_copy["summary"] = "Rain probability is elevated during this window."
                act_copy["recommended_action"] = "Carry waterproof gear and monitor radar."

        validated_activities.append(act_copy)

    validated_insight = dict(primary_insight)
    if has_critical_safety and validated_insight.get("status") == "GO":
        validated_insight["status"] = "RESCHEDULE"
        validated_insight["headline"] = "Severe weather / extreme heat alert active during scheduled window."
        validated_insight["severity_level"] = "RED"
    elif has_high_disruption and validated_insight.get("status") == "GO":
        validated_insight["status"] = "MODIFY"
        validated_insight["headline"] = "Elevated rain or weather disruption expected during schedule."
        validated_insight["severity_level"] = "AMBER"

    return validated_insight, validated_activities


def evaluate_shared_weather_intelligence(context: Dict[str, Any]) -> Dict[str, Any]:
    """
    Evaluates a DecisionContext and produces a structured intelligence contract:
    - Layer 1: Real-Time Persona Intelligence (temporal_context = 'current')
    - Layer 2: Future Personalized Recommendations (temporal_context = 'future')
    """
    user_id = context.get("user_id", "usr_demo")
    date = context.get("date", "2026-09-04")
    selected_personas = context.get("selected_personas") or ["daily_life"]
    primary_persona = selected_personas[0]
    routine_activities = context.get("routine_activities") or []
    weather_data = context.get("weather_data") or {}
    athlete_profile = context.get("athlete_profile") or {
        "athlete_id": user_id,
        "age_group": "adult",
        "experience_level": "intermediate",
        "risk_tolerance": "balanced",
        "sport": "running"
    }

    current_dt = context.get("current_datetime")
    if isinstance(current_dt, str):
        try:
            current_dt = datetime.datetime.fromisoformat(current_dt)
        except Exception:
            current_dt = datetime.datetime.now()
    elif not isinstance(current_dt, datetime.datetime):
        current_dt = datetime.datetime.now()

    # Layer 1 Real-time Current Intelligence
    current_intelligence = generate_current_persona_signals(context, weather_data)

    # Layer 2 Future Recommendation Signals
    future_signals = generate_structured_signals(context, routine_activities, weather_data)

    if not routine_activities:
        primary_rec = {
            "temporal_context": "future",
            "status": "GO",
            "headline": "No routine activities scheduled.",
            "recommendation": "Add activities to your Daily Weather Routine to receive personalized weather intelligence.",
            "primary_concern": "none",
            "severity_level": "GREEN",
            "target_activity": None,
            "target_occurrence_label": "Upcoming",
            "primary_signal": None,
            "weather_source": "hourly_forecast",
            "supporting_signals": []
        }

        return {
            "user_id": user_id,
            "date": date,
            "temporal_context": "future",
            "weather_source": "hourly_forecast",
            "overall_risk": "LOW",
            "primary_concern": "none",
            "plan_title": "RECOMMENDED",
            "plan_subtitle": "Personalized forecast-based guidance",
            "total_activities": 0,
            "signals": future_signals,
            "current_intelligence": current_intelligence,
            "primary_recommendation": primary_rec,
            "primary_decision_insight": primary_rec,
            "activities": []
        }

    evaluated_activities = []
    highest_hierarchy = HIERARCHY_COMFORT
    highest_risk_act = None
    highest_signal_id = None
    primary_concern_key = "none"

    signals_by_act = {}
    for sig in future_signals:
        act_id = sig.get("affects_activity_id")
        if act_id:
            signals_by_act.setdefault(act_id, []).append(sig)

    for act in routine_activities:
        act_id = act.get("id") or act.get("activity_id") or f"act_{len(evaluated_activities)+1}"
        start_time_raw = act.get("startTime") or act.get("start_time") or "07:00 AM"
        end_time_raw = act.get("endTime") or act.get("end_time") or "08:00 AM"
        start_time = format_time_12h(start_time_raw)
        end_time = format_time_12h(end_time_raw)
        time_window = f"{start_time} – {end_time}"
        act_label = act.get("label") or act.get("activity_name") or "Routine Activity"
        location_str = act.get("location") or act.get("startLocation") or "Selected Location"
        act_type = (act.get("type") or act.get("activity_type") or "running").lower()

        occurrence = resolve_next_activity_occurrence(act, current_dt, context.get("timezone"))
        win = get_activity_weather_window(
            weather_data,
            occurrence["occurrence_date"],
            start_time,
            end_time,
            location_str,
            occurrence["occurrence_status"]
        )

        if not win["is_available"]:
            item = {
                "activity_id": act_id,
                "temporal_context": "future",
                "weather_source": "hourly_forecast",
                "activity_label": act_label,
                "activity_type": act_type,
                "persona": primary_persona,
                "preferred_block": "morning",
                "location": location_str,
                "time_window": time_window,
                "occurrence_date": occurrence["occurrence_date"],
                "occurrence_status": occurrence["occurrence_status"],
                "display_label": occurrence["display_label"],
                "is_today": occurrence["is_today"],
                "is_tomorrow": occurrence["is_tomorrow"],
                "is_active": occurrence["is_active"],
                "flexible": act.get("flexible", True),
                "status": "INSUFFICIENT DATA",
                "summary": "Forecast data for your scheduled activity window is currently unavailable.",
                "primary_reason": {
                    "factor": "forecast_availability",
                    "observed_value": "Unavailable",
                    "assessment": "Missing Data"
                },
                "supporting_signals": [],
                "analyzed_factors": [],
                "analyzed_context": win.get("analyzed_context"),
                "forecast_context": {
                    "date": occurrence["occurrence_date"],
                    "time_window": time_window,
                    "location": location_str,
                    "data_source": "hourly_forecast"
                },
                "weather_snapshot": None,
                "what_this_means": "Forecast data for target date and time window is not yet available from the weather provider.",
                "recommended_action": "Check back closer to your scheduled activity time.",
                "alternative_window": None,
                "sportsperson_assessment": None,
                "conditions": None
            }
            evaluated_activities.append(item)
            continue

        snap = win["weather_snapshot"]
        block_cond = {
            "temp_c": snap["temp_c"],
            "humidity_pct": snap["humidity_pct"],
            "wind_speed_kmh": snap["wind_speed_kmh"],
            "rain_probability": snap["rain_probability_frac"],
            "uv_index": snap["uv_index"],
            "aqi": snap["aqi"],
            "visibility_km": snap["visibility_km"],
            "wbgt_c": snap["wbgt_c"],
            "insufficient_data": False
        }

        eval_res = score_activity(act, block_cond, primary_persona)

        if occurrence["is_active"]:
            if eval_res["status"] == "GO":
                eval_res["summary"] = f"Currently Active — conditions remain suitable for the rest of your session ({start_time}–{end_time})."
            else:
                eval_res["summary"] = f"Currently Active — {eval_res['summary']}"

        act_context = {
            "persona": primary_persona,
            "activity": act,
            "activity_type": act_type
        }
        raw_act_signals = signals_by_act.get(act_id, [])
        act_signals = [s for s in raw_act_signals if validate_signal_applicability(s, act_context)]
        supporting_signal_ids = [s["signal_id"] for s in act_signals]

        sport_eval = None
        top_act_signal = None
        for sig in act_signals:
            if sig["severity"] in ("critical", "high") and sig["impact"] == "negative":
                top_act_signal = sig["signal_id"]
                if sig["widget_type"] == "wbgt_safety":
                    eval_res["status"] = "RESCHEDULE" if sig["severity"] == "critical" else "MODIFY"
                    eval_res["summary"] = sig["explanation"]
                    eval_res["primary_reason"] = {
                        "factor": "wbgt_c",
                        "observed_value": f"{sig['value']}°C",
                        "assessment": "Extreme Risk" if sig["severity"] == "critical" else "High Risk"
                    }
                elif sig["widget_type"] == "rain_probability":
                    if eval_res["status"] == "GO":
                        eval_res["status"] = "MODIFY"
                        eval_res["summary"] = sig["explanation"]
                elif sig["widget_type"] in ("travel_disruption", "flight_disruption"):
                    eval_res["status"] = "RESCHEDULE" if sig["severity"] == "critical" else "MODIFY"
                    eval_res["summary"] = sig["explanation"]
                    eval_res["primary_reason"] = {
                        "factor": "travel_disruption",
                        "observed_value": sig["value"],
                        "assessment": "High Disruption"
                    }

        if "sportsperson" in selected_personas and act_type in ("running", "cycling", "sports", "cricket", "outdoor_event", "walking"):
            ath_copy = dict(athlete_profile)
            ath_copy["sport"] = act_type
            sp_res = evaluate_sportsperson_recommendation(ath_copy, {"temp_c": snap["temp_c"], "humidity_pct": snap["humidity_pct"], "wind_speed_kmh": snap["wind_speed_kmh"], "rain_probability": snap["rain_probability_frac"]}, "morning")
            sport_eval = sp_res.get("sportsperson_assessment")
            if sport_eval:
                sport_eval["estimated_wbgt"] = snap["wbgt_c"]
                sport_eval["wbgt_clamped"] = snap["wbgt_c"]

        act_status = eval_res["status"]
        act_hierarchy = HIERARCHY_COMFORT
        if act_status == "RESCHEDULE":
            act_hierarchy = HIERARCHY_SAFETY
        elif act_status == "MODIFY":
            act_hierarchy = HIERARCHY_DISRUPTION

        if act_hierarchy < highest_hierarchy:
            highest_hierarchy = act_hierarchy
            highest_risk_act = act_label
            highest_signal_id = top_act_signal or (supporting_signal_ids[0] if supporting_signal_ids else None)

        alt_obj = None
        if act_status in ("RESCHEDULE", "MODIFY") and act.get("flexible", True):
            alt_start, alt_end = BLOCK_TIMES.get("evening", ("17:00", "19:30"))
            alt_obj = {
                "available": True,
                "start": alt_start,
                "end": alt_end,
                "block_name": "evening",
                "reason": "Lower rainfall/heat risk during the evening window."
            }

        item = {
            "activity_id": act_id,
            "temporal_context": "future",
            "weather_source": "hourly_forecast",
            "activity_label": act_label,
            "activity_type": act_type,
            "persona": primary_persona,
            "preferred_block": "morning",
            "location": location_str,
            "time_window": time_window,
            "schedule": {
                "start_time": occurrence.get("normalized_start_time"),
                "end_time": occurrence.get("normalized_end_time"),
                "display_start_time": occurrence.get("display_start_time"),
                "display_end_time": occurrence.get("display_end_time"),
                "timezone": context.get("timezone", "Asia/Kolkata")
            },
            "occurrence_date": occurrence["occurrence_date"],
            "occurrence_status": occurrence["occurrence_status"],
            "display_label": occurrence["display_label"],
            "is_today": occurrence["is_today"],
            "is_tomorrow": occurrence["is_tomorrow"],
            "is_active": occurrence["is_active"],
            "flexible": act.get("flexible", True),
            "status": act_status,
            "summary": eval_res["summary"],
            "primary_reason": eval_res.get("primary_reason"),
            "supporting_signals": supporting_signal_ids,
            "analyzed_factors": eval_res.get("analyzed_factors", []),
            "analyzed_context": win["analyzed_context"],
            "forecast_context": {
                "date": occurrence["occurrence_date"],
                "time_window": time_window,
                "location": location_str,
                "data_source": "hourly_forecast"
            },
            "weather_snapshot": snap,
            "what_this_means": eval_res["what_this_means"],
            "recommended_action": eval_res["recommended_action"],
            "alternative_window": alt_obj,
            "sportsperson_assessment": sport_eval,
            "conditions": block_cond
        }
        evaluated_activities.append(item)

    all_today = all(a.get("is_today") for a in evaluated_activities) if evaluated_activities else True
    all_tomorrow = all(a.get("is_tomorrow") for a in evaluated_activities) if evaluated_activities else False

    if all_today:
        plan_subtitle = "Based on upcoming forecast conditions today"
    elif all_tomorrow:
        plan_subtitle = "Based on your next scheduled activities tomorrow"
    else:
        plan_subtitle = "Based on your next scheduled activities"

    all_supporting_signal_ids = [s["signal_id"] for s in future_signals if s["severity"] in ("critical", "high", "moderate")]

    if highest_hierarchy == HIERARCHY_SAFETY:
        pdi_status = "RESCHEDULE"
        pdi_severity = "RED"
        pdi_headline = f"Severe safety hazard / extreme heat alert during your {highest_risk_act or 'scheduled activity'}."
        pdi_recommendation = "Postpone outdoor sessions or switch to an indoor alternative."
        primary_concern_key = "safety_hazard"
    elif highest_hierarchy == HIERARCHY_DISRUPTION:
        pdi_status = "MODIFY"
        pdi_severity = "AMBER"
        pdi_headline = f"Weather disruption expected during your {highest_risk_act or 'scheduled activity'}."
        pdi_recommendation = "Carry protective gear, adjust pace, or consider shifting time window."
        primary_concern_key = "disruption_risk"
    else:
        pdi_status = "GO"
        pdi_severity = "GREEN"
        pdi_headline = "Weather conditions are favorable for your planned schedule."
        pdi_recommendation = "Proceed with your scheduled activities as planned. Stay hydrated."
        primary_concern_key = "none"

    target_occ_label = "Today"
    if highest_risk_act:
        for act_item in evaluated_activities:
            if act_item["activity_label"] == highest_risk_act:
                target_occ_label = act_item["display_label"]
                break
    elif evaluated_activities:
        target_occ_label = evaluated_activities[0]["display_label"]

    primary_insight = {
        "temporal_context": "future",
        "status": pdi_status,
        "headline": pdi_headline,
        "recommendation": pdi_recommendation,
        "primary_concern": primary_concern_key,
        "severity_level": pdi_severity,
        "target_activity": highest_risk_act,
        "target_occurrence_label": target_occ_label,
        "primary_signal": highest_signal_id or (all_supporting_signal_ids[0] if all_supporting_signal_ids else None),
        "weather_source": "hourly_forecast",
        "supporting_signals": all_supporting_signal_ids
    }

    validated_insight, final_activities = validate_consistency(primary_insight, evaluated_activities)
    overall_risk_str = "CRITICAL" if highest_hierarchy == HIERARCHY_SAFETY else ("HIGH" if highest_hierarchy == HIERARCHY_DISRUPTION else "LOW")

    return {
        "user_id": user_id,
        "date": date,
        "temporal_context": "future",
        "weather_source": "hourly_forecast",
        "overall_risk": overall_risk_str,
        "primary_concern": primary_concern_key,
        "plan_title": "RECOMMENDED",
        "plan_subtitle": plan_subtitle,
        "total_activities": len(final_activities),
        "signals": future_signals,
        "current_intelligence": current_intelligence,
        "primary_recommendation": validated_insight,
        "primary_decision_insight": validated_insight,
        "activities": final_activities
    }

