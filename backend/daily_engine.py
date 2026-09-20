"""
MAUSAM Daily Activity Recommendation Engine Service

Ports diurnal time-of-day weather derivation, activity suitability scoring,
persona-aware factor filtering, and structured recommendation explanations.
"""

import math
from typing import Dict, Any, Tuple, Optional, List

BLOCK_TIMES = {
    "morning": ("06:00", "09:00"),
    "afternoon": ("12:00", "15:00"),
    "evening": ("17:00", "19:30"),
}


def derive_block_conditions(day_data: Dict[str, Any], block: str) -> Dict[str, Any]:
    """
    Derives block-level weather estimates from daily aggregate values.
    Reuses exact formula from daily_recommendation_engine.py.
    Gracefully handles missing data.
    """
    temp = day_data.get("temp_c")
    humidity = day_data.get("humidity_pct")
    wind = day_data.get("wind_speed_kmh", 10.0)
    uv = day_data.get("uv_index", 4.0)
    rain_prob = day_data.get("rain_probability", 0.0)
    aqi = day_data.get("aqi", 45.0)
    visibility = day_data.get("visibility_km", 8.5)

    if rain_prob is not None and rain_prob > 1.0:
        rain_prob = rain_prob / 100.0

    if temp is None or humidity is None:
        return {
            "temp_c": temp,
            "humidity_pct": humidity,
            "wind_speed_kmh": wind,
            "uv_index": uv,
            "aqi": aqi,
            "visibility_km": visibility,
            "rain_probability": rain_prob,
            "wbgt_c": None,
            "insufficient_data": True
        }

    if block == "morning":
        block_temp = temp - 4.5
        block_humidity = min(98.0, humidity + 12.0)
        block_uv = max(0.0, (uv or 0.0) * 0.35)
    elif block == "afternoon":
        block_temp = temp + 3.5
        block_humidity = max(15.0, humidity - 15.0)
        block_uv = uv or 5.0
    else:  # evening
        block_temp = temp - 1.5
        block_humidity = min(98.0, humidity + 8.0)  # dew-prone
        block_uv = 0.0

    # Recompute block-level WBGT using Australian ABM / Liljegren approximation formula
    try:
        vapor_pressure = (block_humidity / 100.0) * 6.105 * math.exp((17.27 * block_temp) / (block_temp + 237.7))
        calc_wbgt = round(0.567 * block_temp + 0.393 * vapor_pressure + 3.94, 1)

        # Clamp WBGT at 34.5°C due to documented limitation of simplified formula at extreme humidity
        block_wbgt = min(34.5, calc_wbgt)
    except Exception:
        block_wbgt = None

    return {
        "temp_c": round(block_temp, 1),
        "humidity_pct": round(block_humidity, 1),
        "wind_speed_kmh": wind,
        "uv_index": round(block_uv, 1),
        "aqi": aqi,
        "visibility_km": visibility,
        "rain_probability": rain_prob,
        "wbgt_c": block_wbgt,
        "insufficient_data": False
    }


from backend.context_relevance_engine import get_relevant_weather_factors, is_wbgt_relevant, normalize_activity_type, get_allowed_factors


def score_activity(
    activity: Dict[str, Any],
    conditions: Dict[str, Any],
    persona: str = "daily_life"
) -> Dict[str, Any]:
    """
    Evaluates suitability for an activity using Two-Stage Filtering based on ActivityWeatherRelevanceEngine.
    """
    raw_act_type = activity.get("type") or activity.get("activity_type") or activity.get("id") or "running"
    act_type = normalize_activity_type(raw_act_type)

    if conditions.get("insufficient_data"):
        return {
            "status": "INSUFFICIENT DATA",
            "summary": "Weather inputs incomplete for this time window.",
            "primary_reason": {
                "factor": "data_availability",
                "observed_value": "Missing",
                "assessment": "Insufficient Data"
            },
            "analyzed_factors": [],
            "evaluated_factors": [],
            "excluded_factors": [],
            "decision_factors": [],
            "what_this_means": "Required weather information for your location is currently unavailable.",
            "recommended_action": "Retry when live weather data updates."
        }

    # Stage 1: Determine allowed weather factors for this exact activity context
    allowed_factors = get_allowed_factors(activity_context=activity, persona=persona)
    rel_profile = get_relevant_weather_factors(
        activity_type=act_type,
        activity_context=activity,
        persona=persona
    )
    eval_factors = set(rel_profile["evaluated_factors"])
    excl_factors = rel_profile["excluded_factors"]

    temp = conditions.get("temp_c")
    humidity = conditions.get("humidity_pct")
    rain = conditions.get("rain_probability", 0.0) or 0.0
    wind = conditions.get("wind_speed_kmh", 10.0) or 10.0
    uv = conditions.get("uv_index", 4.0) or 4.0
    aqi = conditions.get("aqi", 45.0) or 45.0
    wbgt = conditions.get("wbgt_c") if "wbgt" in allowed_factors else None
    visibility = conditions.get("visibility_km", 8.5) or 8.5

    rain_pct = int(rain * 100) if rain <= 1.0 else int(rain)

    status = "GO"
    summary = "Conditions are suitable for your planned activity."
    primary_factor = "temperature"
    observed_val = f"{temp}°C" if temp is not None else "--"
    primary_assess = "Suitable"

    # Stage 2: Evaluate ONLY allowed factors
    if "rain_probability" in allowed_factors and rain > 0.5:
        status = "RESCHEDULE" if act_type in ("running", "walking", "cycling", "farm_work") else "MODIFY"
        summary = f"Rain is likely ({rain_pct}%) during your scheduled activity window."
        primary_factor = "rain_probability"
        observed_val = f"{rain_pct}%"
        primary_assess = "High Risk"
    elif "wbgt" in allowed_factors and wbgt is not None and wbgt >= 32.0:
        status = "RESCHEDULE"
        summary = f"Extreme heat stress (WBGT {wbgt}°C) makes outdoor exertion hazardous."
        primary_factor = "wbgt_c"
        observed_val = f"{wbgt}°C"
        primary_assess = "Extreme Risk"
    elif "wind_speed" in allowed_factors and wind > 25.0 and act_type == "cycling":
        status = "MODIFY"
        summary = f"Strong wind gusts ({wind} km/h) present crosswind hazard."
        primary_factor = "wind_speed_kmh"
        observed_val = f"{wind} km/h"
        primary_assess = "Caution"
    elif "temperature" in allowed_factors and temp is not None and temp > (38.0 if rel_profile["environment"] in ("indoor", "mixed") else 34.0):
        status = "MODIFY"
        summary = f"Temperature ({temp}°C) is elevated — adjust duration or pace."
        primary_factor = "temperature"
        observed_val = f"{temp}°C"
        primary_assess = "Elevated"

    # Fail-Safe Assertion Gate: Excluded factors MUST NEVER drive decisions
    if primary_factor in ("wbgt_c", "wbgt") and "wbgt" not in allowed_factors:
        primary_factor = "temperature"
        observed_val = f"{temp}°C" if temp is not None else "--"
        primary_assess = "Suitable"
        if status in ("RESCHEDULE", "MODIFY"):
            status = "GO"
            summary = "Conditions are suitable for your planned activity."

    # Special handling for indoor / low weather sensitivity activities
    if rel_profile["environment"] == "indoor" and status == "GO":
        summary = "No significant weather-related disruption is expected for this indoor activity."

    all_factor_items = []
    decision_factors = []

    if "temperature" in allowed_factors and temp is not None:
        t_impact = "negative" if temp > 34.0 else "positive"
        t_assess = "High" if temp > 34.0 else ("Comfortable" if temp <= 26.0 else "Moderate")
        all_factor_items.append({
            "name": "Temperature",
            "value": f"{temp}°C",
            "assessment": t_assess,
            "impact": t_impact,
            "explanation": "Temperature is comfortable for activity." if temp <= 26.0 else f"Elevated temperature ({temp}°C) requires hydration."
        })
        decision_factors.append({"factor": "temperature", "impact": t_impact})

    if "rain_probability" in allowed_factors:
        r_impact = "negative" if rain > 0.4 else "positive"
        r_assess = "High" if rain > 0.6 else ("Moderate" if rain > 0.3 else "Low Chance")
        all_factor_items.append({
            "name": "Rain Probability",
            "value": f"{rain_pct}%",
            "assessment": r_assess,
            "impact": r_impact,
            "explanation": f"Rain probability is {rain_pct}% — carry rain cover or check radar." if rain > 0.4 else "Minimal chance of precipitation disruption."
        })
        decision_factors.append({"factor": "rain_probability", "impact": r_impact})

    if "humidity" in allowed_factors and humidity is not None:
        h_impact = "negative" if humidity > 80.0 else "positive"
        h_assess = "High / Humid" if humidity > 80.0 else "Comfortable"
        all_factor_items.append({
            "name": "Humidity",
            "value": f"{humidity}%",
            "assessment": h_assess,
            "impact": h_impact,
            "explanation": f"High relative humidity ({humidity}%) affects sweat evaporation." if humidity > 80.0 else "Humidity is in a comfortable range."
        })
        decision_factors.append({"factor": "humidity", "impact": h_impact})

    if "wind_speed" in allowed_factors:
        w_impact = "negative" if wind > 22.0 else "positive"
        w_assess = "Strong Winds" if wind > 22.0 else "Gentle"
        all_factor_items.append({
            "name": "Wind",
            "value": f"{wind} km/h",
            "assessment": w_assess,
            "impact": w_impact,
            "explanation": f"Elevated wind speed ({wind} km/h) may impact stability/gear." if wind > 22.0 else "Light breeze with no significant impact expected."
        })
        decision_factors.append({"factor": "wind", "impact": w_impact})

    if "uv_index" in allowed_factors:
        uv_impact = "negative" if uv > 6.0 else "positive"
        uv_assess = "High" if uv > 6.0 else "Moderate"
        all_factor_items.append({
            "name": "UV Exposure",
            "value": f"{uv}",
            "assessment": uv_assess,
            "impact": uv_impact,
            "explanation": f"High UV index ({uv}) — apply sun protection." if uv > 6.0 else "UV levels are low to moderate."
        })
        decision_factors.append({"factor": "uv_index", "impact": uv_impact})

    if "aqi" in allowed_factors:
        aqi_impact = "negative" if aqi > 100.0 else "positive"
        aqi_assess = "Unhealthy" if aqi > 100.0 else "Good / Moderate"
        all_factor_items.append({
            "name": "Air Quality (AQI)",
            "value": f"{aqi}",
            "assessment": aqi_assess,
            "impact": aqi_impact,
            "explanation": f"AQI of {aqi} may trigger respiratory discomfort." if aqi > 100.0 else "Air quality is acceptable for outdoor activity."
        })
        decision_factors.append({"factor": "aqi", "impact": aqi_impact})

    # What This Means & Recommended Action
    if rel_profile["environment"] == "indoor":
        what_this_means = "No significant weather-related disruption is expected for this indoor activity."
        recommended_action = "Proceed as planned."
    elif status == "GO":
        what_this_means = "Conditions are generally favorable for your planned activity."
        recommended_action = "Proceed as planned. Stay hydrated and carry sunscreen if exposed outdoors for an extended period."
    elif status == "MODIFY":
        what_this_means = f"Weather conditions present minor disruptions ({summary}). The activity can proceed with adjustments."
        recommended_action = "Carry protective gear, adjust pace/intensity, and monitor weather updates."
    else:  # RESCHEDULE
        what_this_means = f"Weather conditions ({summary}) create safety or severe disruption risks during this scheduled window."
        recommended_action = "Consider postponing the activity or switching to an indoor alternative."

    provenance = {
        "activity": act_type,
        "relevance_profile": rel_profile["activity_type"],
        "allowed_factors": allowed_factors,
        "excluded_factors": rel_profile["excluded_factors"],
        "evaluated_factors": list(eval_factors),
        "triggered_rules": [primary_factor] if status != "GO" else [],
        "decision": status
    }

    return {
        "status": status,
        "summary": summary,
        "primary_reason": {
            "factor": primary_factor,
            "observed_value": observed_val,
            "assessment": primary_assess
        },
        "analyzed_factors": all_factor_items,
        "evaluated_factors": rel_profile["evaluated_factors"],
        "excluded_factors": rel_profile["excluded_factors"],
        "decision_factors": decision_factors,
        "decision_provenance": provenance,
        "what_this_means": what_this_means,
        "recommended_action": recommended_action
    }


def best_alternative_block(activity_type: str, day_data: Dict[str, Any], exclude_block: str, persona: str = "daily_life") -> Optional[str]:
    """
    For flexible activities on a bad day, checks if another diurnal block yields a 'GO' status.
    """
    candidates = [b for b in BLOCK_TIMES if b != exclude_block]
    dummy_act = {"type": activity_type}
    for b in candidates:
        cond = derive_block_conditions(day_data, b)
        eval_res = score_activity(dummy_act, cond, persona)
        if eval_res["status"] == "GO":
            return b
    return None
