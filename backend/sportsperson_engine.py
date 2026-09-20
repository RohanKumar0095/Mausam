"""
MAUSAM Sportsperson Personalized Recommendation Engine

Extends activity recommendation with personalized WBGT thresholds (age_group, experience_level, risk_tolerance),
dew-risk & wind-sensitivity tags per sport type, and 34.5°C WBGT clamp for individual athletes.
"""

from typing import Dict, Any, Optional
from backend.daily_engine import derive_block_conditions

# Baseline ACSM / Sports Medicine WBGT Zone Cutoffs (°C)
BASELINE_WBGT_LOW = 24.0
BASELINE_WBGT_HIGH = 28.0
BASELINE_WBGT_VERY_HIGH = 31.0
BASELINE_WBGT_EXTREME = 32.2

# Personalization Shift Matrices
AGE_SHIFTS = {
    "junior": -1.5,
    "adult": 0.0,
    "senior": -1.0
}

EXPERIENCE_SHIFTS = {
    "beginner": -1.0,
    "intermediate": 0.0,
    "elite": 1.0
}

RISK_SHIFTS = {
    "conservative": -1.0,
    "balanced": 0.0,
    "aggressive": 0.5
}

# Sport Sensitivity Tag Registries
DEW_SENSITIVE_SPORTS = ["tennis", "cricket"]
WIND_SENSITIVE_SPORTS = ["cycling", "rowing", "athletics"]
RAIN_SENSITIVE_SPORTS = ["football", "rugby", "hockey"]


def calculate_personalized_shifts(age_group: str, experience_level: str, risk_tolerance: str) -> float:
    """
    Computes cumulative WBGT threshold shift based on athlete profile.
    """
    shift_age = AGE_SHIFTS.get((age_group or "").lower(), 0.0)
    shift_exp = EXPERIENCE_SHIFTS.get((experience_level or "").lower(), 0.0)
    shift_risk = RISK_SHIFTS.get((risk_tolerance or "").lower(), 0.0)
    return round(shift_age + shift_exp + shift_risk, 2)


def get_personalized_wbgt_thresholds(age_group: str, experience_level: str, risk_tolerance: str) -> Dict[str, float]:
    """
    Returns custom WBGT threshold boundaries for an athlete.
    """
    shift = calculate_personalized_shifts(age_group, experience_level, risk_tolerance)
    return {
        "low_limit": round(BASELINE_WBGT_LOW + shift, 1),
        "high_limit": round(BASELINE_WBGT_HIGH + shift, 1),
        "very_high_limit": round(BASELINE_WBGT_VERY_HIGH + shift, 1),
        "extreme_limit": round(BASELINE_WBGT_EXTREME + shift, 1),
        "shift": shift
    }


def evaluate_sportsperson_recommendation(
    athlete_profile: Dict[str, Any],
    weather_data: Dict[str, Any],
    session_block: str = "evening"
) -> Dict[str, Any]:
    """
    Evaluates personalized recommendation for an individual athlete.
    Gracefully degrades if inputs are incomplete.
    """
    sport = (athlete_profile.get("sport") or "running").lower()
    age_group = (athlete_profile.get("age_group") or "adult").lower()
    experience = (athlete_profile.get("experience_level") or "intermediate").lower()
    risk = (athlete_profile.get("risk_tolerance") or "balanced").lower()

    # 1. Derive block-level weather conditions
    block_cond = derive_block_conditions(weather_data, session_block)

    if block_cond.get("insufficient_data") or weather_data.get("temp_c") is None:
        thresholds = get_personalized_wbgt_thresholds(age_group, experience, risk)
        return {
            "status": "INSUFFICIENT DATA",
            "summary": "Weather variables incomplete for thermal stress analysis.",
            "sportsperson_assessment": {
                "estimated_wbgt": None,
                "wbgt_clamped": None,
                "personalized_limit": thresholds["high_limit"],
                "zone": "Unknown",
                "dew_risk": False,
                "wind_flag": False,
                "experience_level": experience,
                "risk_tolerance": risk,
                "age_group": age_group,
                "shift_breakdown": {
                    "age": AGE_SHIFTS.get(age_group, 0.0),
                    "experience": EXPERIENCE_SHIFTS.get(experience, 0.0),
                    "risk": RISK_SHIFTS.get(risk, 0.0)
                }
            }
        }

    raw_wbgt = block_cond.get("wbgt_c")
    temp_c = block_cond.get("temp_c")
    humidity_pct = block_cond.get("humidity_pct", 50.0)
    wind_kmh = block_cond.get("wind_speed_kmh", 10.0)
    rain_prob = block_cond.get("rain_probability", 0.0)

    # 2. WBGT Clamp at 34.5°C (Documented limitation of simplified formula at high humidity)
    # Clamp WBGT at 34.5°C due to documented limitation of simplified formula at extreme humidity
    wbgt_clamped = min(34.5, raw_wbgt) if raw_wbgt is not None else None

    # 3. Personalized threshold shift
    thresholds = get_personalized_wbgt_thresholds(age_group, experience, risk)
    extreme_cutoff = thresholds["extreme_limit"]
    high_cutoff = thresholds["high_limit"]
    very_high_cutoff = thresholds["very_high_limit"]

    # 4. WBGT Zone Classification & Status
    status = "GO"
    summary = "Conditions are suitable for outdoor athletic training."
    wbgt_zone = "Low Risk"

    eval_wbgt = wbgt_clamped if wbgt_clamped is not None else temp_c

    if eval_wbgt is not None:
        if eval_wbgt >= extreme_cutoff:
            status = "RESCHEDULE"
            summary = (
                f"Estimated WBGT ({eval_wbgt}°C) exceeds your personalized extreme threshold ({extreme_cutoff}°C)."
            )
            wbgt_zone = "Extreme Risk"
        elif eval_wbgt >= very_high_cutoff:
            status = "MODIFY"
            summary = (
                f"WBGT ({eval_wbgt}°C) is in the very high thermal stress zone for your profile limit ({very_high_cutoff}°C)."
            )
            wbgt_zone = "Very High Risk"
        elif eval_wbgt >= high_cutoff:
            status = "MODIFY"
            summary = (
                f"WBGT ({eval_wbgt}°C) is elevated for your profile (caution threshold: {high_cutoff}°C)."
            )
            wbgt_zone = "High Risk"
        elif eval_wbgt >= BASELINE_WBGT_LOW:
            wbgt_zone = "Moderate Risk"

    # 5. Dew Risk Check
    dew_risk = False
    if sport in DEW_SENSITIVE_SPORTS and session_block == "evening" and humidity_pct > 80.0:
        dew_risk = True
        dew_msg = f"Dew risk: evening humidity {humidity_pct}% may cause slick court/ball surface."
        if status == "GO":
            status = "MODIFY"
            summary = dew_msg
        else:
            summary += f" {dew_msg}"

    # 6. Wind Sensitivity Check
    wind_flag = False
    if sport in WIND_SENSITIVE_SPORTS and wind_kmh > 25.0:
        wind_flag = True
        wind_msg = f"Crosswind hazard: wind speed {wind_kmh} km/h exceeds safe threshold for {sport}."
        if status == "GO":
            status = "MODIFY"
            summary = wind_msg
        else:
            summary += f" {wind_msg}"

    return {
        "status": status,
        "summary": summary,
        "sportsperson_assessment": {
            "estimated_wbgt": raw_wbgt,
            "wbgt_clamped": wbgt_clamped,
            "personalized_limit": high_cutoff,
            "zone": wbgt_zone,
            "dew_risk": dew_risk,
            "wind_flag": wind_flag,
            "experience_level": experience,
            "risk_tolerance": risk,
            "age_group": age_group,
            "shift_breakdown": {
                "age": AGE_SHIFTS.get(age_group, 0.0),
                "experience": EXPERIENCE_SHIFTS.get(experience, 0.0),
                "risk": RISK_SHIFTS.get(risk, 0.0)
            }
        }
    }
