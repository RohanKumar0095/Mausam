"""
MAUSAM Activity-Aware Weather Factor Relevance Engine

Implements an explicit ActivityWeatherRelevanceMatrix and two-stage filtering system.
Determines relevant weather factors BEFORE recommendation scoring based on:
Activity Type + Activity Context + Route Type + Indoor/Outdoor Exposure + Physical Intensity + Persona + Time Window.
"""

from typing import Dict, Any, List, Optional, Set

# Controlled Set of 25 Weather Factors
CONTROLLED_WEATHER_FACTORS = {
    "TEMPERATURE",
    "FEELS_LIKE",
    "HUMIDITY",
    "RAIN_PROBABILITY",
    "RAIN_INTENSITY",
    "THUNDERSTORM",
    "LIGHTNING",
    "WIND_SPEED",
    "WIND_GUSTS",
    "WIND_DIRECTION",
    "VISIBILITY",
    "FOG",
    "AQI",
    "UV_INDEX",
    "WBGT",
    "SURFACE_CONDITION",
    "DEW_POINT",
    "HEAT_INDEX",
    "COLD_STRESS",
    "FLOOD_RISK",
    "SEVERE_WEATHER_ALERT",
    "RAIN_ACCUMULATION",
    "ROAD_CONDITION",
    "AIR_PRESSURE",
    "MULTI_DAY_RAIN_TREND",
    "FLIGHT_DISRUPTION",
    "COMMUTE_WEATHER"
}

# Mapping Controlled Weather Factors to Internal Widget/Signal IDs
FACTOR_TO_WIDGET_MAP = {
    "WBGT": "wbgt_safety",
    "RAIN_PROBABILITY": "rain_probability",
    "RAIN_INTENSITY": "rain_probability",
    "THUNDERSTORM": "lightning_storm_safety",
    "LIGHTNING": "lightning_storm_safety",
    "SEVERE_WEATHER_ALERT": "lightning_storm_safety",
    "TEMPERATURE": "current_conditions",
    "FEELS_LIKE": "current_conditions",
    "HUMIDITY": "humidity_health_impact",
    "WIND_SPEED": "wind_gauge",
    "WIND_GUSTS": "wind_gauge",
    "VISIBILITY": "visibility_fog",
    "FOG": "visibility_fog",
    "AQI": "aqi_health",
    "UV_INDEX": "uv_heat_index",
    "DEW_POINT": "dew_factor",
    "SURFACE_CONDITION": "ground_condition",
    "ROAD_CONDITION": "ground_condition",
    "FLOOD_RISK": "travel_disruption",
    "TRAVEL_DISRUPTION": "travel_disruption",
    "FLIGHT_DISRUPTION": "flight_disruption",
    "COMMUTE_WEATHER": "commute_weather"
}

# 14 Activity Weather Relevance Profiles
ACTIVITY_RELEVANCE_MATRIX = {
    # 1. RUNNING (Route-Based, Outdoor, High Physical Intensity)
    "running": {
        "activity_type": "running",
        "mobility_type": "route_based",
        "environment": "outdoor",
        "physical_intensity": "high",
        "exposure_duration": "moderate",
        "primary_factors": ["WBGT", "TEMPERATURE", "FEELS_LIKE", "RAIN_PROBABILITY", "RAIN_INTENSITY", "AQI", "THUNDERSTORM", "LIGHTNING"],
        "secondary_factors": ["HUMIDITY", "WIND_SPEED", "WIND_GUSTS", "SURFACE_CONDITION", "UV_INDEX"],
        "safety_critical_factors": ["LIGHTNING", "THUNDERSTORM", "SEVERE_WEATHER_ALERT", "AQI", "RAIN_INTENSITY"],
        "contextual_factors": [],
        "excluded_factors": ["DEW_POINT", "AIR_PRESSURE", "ROAD_CONDITION", "FLOOD_RISK", "MULTI_DAY_RAIN_TREND"],
        "wbgt_eligible": True
    },

    # 2. WALKING (Route-Based, Outdoor, Low to Moderate Intensity)
    "walking": {
        "activity_type": "walking",
        "mobility_type": "route_based",
        "environment": "outdoor",
        "physical_intensity": "low",
        "exposure_duration": "brief",
        "primary_factors": ["RAIN_PROBABILITY", "RAIN_INTENSITY", "TEMPERATURE", "FEELS_LIKE", "THUNDERSTORM", "LIGHTNING", "AQI"],
        "secondary_factors": ["WIND_SPEED", "HUMIDITY", "UV_INDEX", "SURFACE_CONDITION", "VISIBILITY"],
        "safety_critical_factors": ["LIGHTNING", "THUNDERSTORM", "RAIN_INTENSITY", "AQI"],
        "contextual_factors": ["WBGT", "HEAT_INDEX"],
        "excluded_factors": ["DEW_POINT", "AIR_PRESSURE", "ROAD_CONDITION"],
        "wbgt_eligible": False  # Contextual only during extreme heat / prolonged walk
    },

    # 3. CYCLING (Route-Based, Outdoor, High Physical Intensity)
    "cycling": {
        "activity_type": "cycling",
        "mobility_type": "route_based",
        "environment": "outdoor",
        "physical_intensity": "high",
        "exposure_duration": "moderate",
        "primary_factors": ["WBGT", "WIND_SPEED", "WIND_GUSTS", "RAIN_INTENSITY", "THUNDERSTORM", "LIGHTNING", "AQI", "TEMPERATURE"],
        "secondary_factors": ["VISIBILITY", "SURFACE_CONDITION", "HUMIDITY", "UV_INDEX", "FEELS_LIKE"],
        "safety_critical_factors": ["LIGHTNING", "WIND_SPEED", "ROAD_CONDITION", "RAIN_INTENSITY", "WBGT"],
        "contextual_factors": [],
        "excluded_factors": ["DEW_POINT", "AIR_PRESSURE"],
        "wbgt_eligible": True
    },

    # 4. COLLEGE (Stationary, Mixed Commute + Indoor, Low Intensity)
    "college": {
        "activity_type": "college",
        "mobility_type": "stationary",
        "environment": "mixed",
        "physical_intensity": "low",
        "exposure_duration": "brief",
        "primary_factors": ["RAIN_PROBABILITY", "RAIN_INTENSITY", "THUNDERSTORM", "LIGHTNING", "TEMPERATURE", "SEVERE_WEATHER_ALERT"],
        "secondary_factors": ["AQI", "VISIBILITY", "WIND_SPEED", "UV_INDEX"],
        "safety_critical_factors": ["THUNDERSTORM", "LIGHTNING", "SEVERE_WEATHER_ALERT", "FLOOD_RISK"],
        "contextual_factors": [],
        "excluded_factors": ["WBGT", "DEW_POINT", "SURFACE_CONDITION", "ROAD_CONDITION"],
        "wbgt_eligible": False
    },

    # 5. SCHOOL / KIDS (Stationary, Mixed Commute + Indoor, Low Intensity)
    "school": {
        "activity_type": "school",
        "mobility_type": "stationary",
        "environment": "mixed",
        "physical_intensity": "low",
        "exposure_duration": "brief",
        "primary_factors": ["RAIN_PROBABILITY", "RAIN_INTENSITY", "THUNDERSTORM", "LIGHTNING", "SEVERE_WEATHER_ALERT", "TEMPERATURE"],
        "secondary_factors": ["AQI", "UV_INDEX", "VISIBILITY", "WIND_SPEED"],
        "safety_critical_factors": ["SEVERE_WEATHER_ALERT", "LIGHTNING", "RAIN_INTENSITY"],
        "contextual_factors": [],
        "excluded_factors": ["WBGT", "DEW_POINT", "SURFACE_CONDITION"],
        "wbgt_eligible": False
    },

    # 6. OFFICE (Stationary, Mixed Commute + Indoor, Low Intensity)
    "office": {
        "activity_type": "office",
        "mobility_type": "stationary",
        "environment": "mixed",
        "physical_intensity": "low",
        "exposure_duration": "brief",
        "primary_factors": ["RAIN_PROBABILITY", "RAIN_INTENSITY", "THUNDERSTORM", "SEVERE_WEATHER_ALERT", "VISIBILITY"],
        "secondary_factors": ["TEMPERATURE", "AQI", "WIND_SPEED"],
        "safety_critical_factors": ["SEVERE_WEATHER_ALERT", "FLOOD_RISK", "THUNDERSTORM"],
        "contextual_factors": [],
        "excluded_factors": ["WBGT", "DEW_POINT", "SURFACE_CONDITION", "HEAT_INDEX"],
        "wbgt_eligible": False
    },

    # 7. COMMUTE / TRANSIT (Route-Based, Variable Exposure, Low Intensity)
    "commute": {
        "activity_type": "commute",
        "mobility_type": "route_based",
        "environment": "variable",
        "physical_intensity": "low",
        "exposure_duration": "brief",
        "primary_factors": ["RAIN_INTENSITY", "RAIN_PROBABILITY", "VISIBILITY", "FOG", "THUNDERSTORM", "LIGHTNING", "WIND_SPEED", "WIND_GUSTS", "ROAD_CONDITION", "COMMUTE_WEATHER"],
        "secondary_factors": ["TEMPERATURE", "AQI", "FLOOD_RISK"],
        "safety_critical_factors": ["RAIN_INTENSITY", "FLOOD_RISK", "FOG", "VISIBILITY", "THUNDERSTORM", "WIND_SPEED", "COMMUTE_WEATHER"],
        "contextual_factors": [],
        "excluded_factors": ["WBGT", "DEW_POINT", "HEAT_INDEX"],
        "wbgt_eligible": False
    },

    # 8. TRAVEL / OUTSTATION (Route-Based, Variable Exposure, Low Intensity)
    "travel": {
        "activity_type": "travel",
        "mobility_type": "route_based",
        "environment": "variable",
        "physical_intensity": "low",
        "exposure_duration": "prolonged",
        "primary_factors": ["SEVERE_WEATHER_ALERT", "RAIN_INTENSITY", "THUNDERSTORM", "LIGHTNING", "WIND_SPEED", "VISIBILITY", "FOG", "FLOOD_RISK", "TRAVEL_DISRUPTION", "FLIGHT_DISRUPTION"],
        "secondary_factors": ["TEMPERATURE", "MULTI_DAY_RAIN_TREND"],
        "safety_critical_factors": ["THUNDERSTORM", "FLOOD_RISK", "SEVERE_WEATHER_ALERT", "TRAVEL_DISRUPTION", "FLIGHT_DISRUPTION"],
        "contextual_factors": ["AQI", "COLD_STRESS"],
        "excluded_factors": ["WBGT", "DEW_POINT", "SURFACE_CONDITION"],
        "wbgt_eligible": False
    },

    # 9. OUTDOOR EVENT (Outdoor, High Exposure, Low Intensity)
    "outdoor_event": {
        "activity_type": "outdoor_event",
        "mobility_type": "route_based",
        "environment": "outdoor",
        "physical_intensity": "low",
        "exposure_duration": "prolonged",
        "primary_factors": ["RAIN_PROBABILITY", "RAIN_INTENSITY", "THUNDERSTORM", "LIGHTNING", "WIND_SPEED", "WIND_GUSTS", "TEMPERATURE", "SEVERE_WEATHER_ALERT"],
        "secondary_factors": ["HUMIDITY", "UV_INDEX", "SURFACE_CONDITION"],
        "safety_critical_factors": ["LIGHTNING", "THUNDERSTORM", "SEVERE_WEATHER_ALERT", "WIND_GUSTS"],
        "contextual_factors": ["HEAT_INDEX", "WBGT"],
        "excluded_factors": ["DEW_POINT"],
        "wbgt_eligible": False  # WBGT contextual only for all-day summer sports festival
    },

    # 10. AGRICULTURE / FARM WORK (Outdoor, High Exposure, Variable Intensity)
    "farm_work": {
        "activity_type": "farm_work",
        "mobility_type": "stationary",
        "environment": "outdoor",
        "physical_intensity": "moderate",
        "exposure_duration": "prolonged",
        "primary_factors": ["RAIN_PROBABILITY", "RAIN_INTENSITY", "RAIN_ACCUMULATION", "WIND_SPEED", "HUMIDITY", "TEMPERATURE", "MULTI_DAY_RAIN_TREND"],
        "secondary_factors": ["SEVERE_WEATHER_ALERT", "UV_INDEX", "DEW_POINT"],
        "safety_critical_factors": ["SEVERE_WEATHER_ALERT", "LIGHTNING", "FLOOD_RISK"],
        "contextual_factors": ["FLOOD_RISK", "FOG", "WBGT"],
        "excluded_factors": ["HEAT_INDEX"],
        "wbgt_eligible": False  # WBGT relevant ONLY for manual field labour for 5+ hours
    },

    # 11. BEACH ACTIVITY (Outdoor, High Exposure, Low to Moderate Intensity)
    "beach_activity": {
        "activity_type": "beach_activity",
        "mobility_type": "stationary",
        "environment": "outdoor",
        "physical_intensity": "low",
        "exposure_duration": "prolonged",
        "primary_factors": ["UV_INDEX", "TEMPERATURE", "FEELS_LIKE", "RAIN_PROBABILITY", "THUNDERSTORM", "LIGHTNING", "WIND_SPEED"],
        "secondary_factors": ["HUMIDITY", "AQI"],
        "safety_critical_factors": ["LIGHTNING", "THUNDERSTORM", "SEVERE_WEATHER_ALERT"],
        "contextual_factors": ["HEAT_INDEX", "WBGT"],
        "excluded_factors": ["DEW_POINT", "ROAD_CONDITION"],
        "wbgt_eligible": False
    },

    # 12. SPORTS (Outdoor, High Exposure, High Physical Intensity)
    "sports": {
        "activity_type": "sports",
        "mobility_type": "stationary",
        "environment": "outdoor",
        "physical_intensity": "high",
        "exposure_duration": "moderate",
        "primary_factors": ["WBGT", "RAIN_INTENSITY", "THUNDERSTORM", "LIGHTNING", "WIND_SPEED", "SURFACE_CONDITION"],
        "secondary_factors": ["TEMPERATURE", "HUMIDITY", "UV_INDEX", "AQI"],
        "safety_critical_factors": ["LIGHTNING", "THUNDERSTORM", "WBGT", "SEVERE_WEATHER_ALERT"],
        "contextual_factors": ["DEW_POINT"],
        "excluded_factors": ["AIR_PRESSURE", "MULTI_DAY_RAIN_TREND"],
        "wbgt_eligible": True
    },

    # 13. INDOOR WORK / STUDY (Indoor, Stationary, Low Intensity)
    "indoor": {
        "activity_type": "indoor",
        "mobility_type": "stationary",
        "environment": "indoor",
        "physical_intensity": "low",
        "exposure_duration": "brief",
        "primary_factors": ["SEVERE_WEATHER_ALERT", "TEMPERATURE"],
        "secondary_factors": ["RAIN_PROBABILITY", "THUNDERSTORM", "AQI"],
        "safety_critical_factors": ["SEVERE_WEATHER_ALERT"],
        "contextual_factors": [],
        "excluded_factors": ["WBGT", "DEW_POINT", "SURFACE_CONDITION", "WIND_GUSTS", "UV_INDEX", "ROAD_CONDITION"],
        "wbgt_eligible": False
    },

    # 14. OTHER ACTIVITY (Ambiguous / Fallback)
    "other": {
        "activity_type": "other",
        "mobility_type": "stationary",
        "environment": "mixed",
        "physical_intensity": "low",
        "exposure_duration": "brief",
        "primary_factors": ["SEVERE_WEATHER_ALERT", "RAIN_PROBABILITY", "THUNDERSTORM", "TEMPERATURE"],
        "secondary_factors": ["AQI", "WIND_SPEED"],
        "safety_critical_factors": ["SEVERE_WEATHER_ALERT", "LIGHTNING"],
        "contextual_factors": [],
        "excluded_factors": ["WBGT", "DEW_POINT", "SURFACE_CONDITION"],
        "wbgt_eligible": False
    }
}

# Alias Map for Activity Variations
ACTIVITY_ALIAS_MAP = {
    "running": "running",
    "run": "running",
    "morning_run": "running",
    "jogging": "running",
    "marathon": "running",
    "cycling": "cycling",
    "cycle": "cycling",
    "biking": "cycling",
    "bike_ride": "cycling",
    "walking": "walking",
    "walk": "walking",
    "morning_walk": "walking",
    "sports": "sports",
    "cricket": "sports",
    "football": "sports",
    "soccer": "sports",
    "tennis": "sports",
    "athletics": "sports",
    "training": "sports",
    "college": "college",
    "class": "college",
    "university": "college",
    "school": "school",
    "kids": "school",
    "school_pickup": "school",
    "office": "office",
    "work": "office",
    "commute": "commute",
    "two_wheeler_commute": "commute",
    "car_commute": "commute",
    "transit": "commute",
    "travel": "travel",
    "air_travel": "travel",
    "outstation": "travel",
    "flight": "travel",
    "outdoor_event": "outdoor_event",
    "event": "outdoor_event",
    "festival": "outdoor_event",
    "farm_work": "farm_work",
    "agriculture": "farm_work",
    "farming": "farm_work",
    "irrigation_check": "farm_work",
    "beach_activity": "beach_activity",
    "beach": "beach_activity",
    "swimming": "beach_activity",
    "indoor": "indoor",
    "indoor_work": "indoor",
    "study": "indoor",
    "reading": "indoor",
    "gym_indoor": "indoor"
}


def normalize_activity_type(raw_type: Optional[str]) -> str:
    """Normalizes any activity label or type string into one of the 14 standard activity keys."""
    if not raw_type:
        return "other"
    s = str(raw_type).lower().strip().replace(" ", "_")
    return ACTIVITY_ALIAS_MAP.get(s, "other")


def is_wbgt_relevant(activity_context: Dict[str, Any]) -> bool:
    """
    Explicit WBGT Eligibility Rule.
    WBGT is eligible ONLY IF:
    - Activity is physically demanding (intensity == 'high') (e.g., Running, Cycling, Competitive Sports)
    - OR activity is moderate intensity + prolonged outdoor exposure (e.g., 5-hour heavy farm labor)
    - OR explicit heat-safety use case
    EXCLUDES: Office, College, School, Commute, Travel, Indoor Work/Study, Casual Walking.
    """
    if isinstance(activity_context, str):
        act_key = normalize_activity_type(activity_context)
        ctx = {"activity_type": act_key}
    else:
        ctx = activity_context or {}
        act_raw = ctx.get("activity_type") or ctx.get("type") or ctx.get("id") or ctx.get("activity")
        if isinstance(act_raw, dict):
            act_raw = act_raw.get("type") or act_raw.get("activity_type") or act_raw.get("id")
        act_key = normalize_activity_type(act_raw)

    profile = ACTIVITY_RELEVANCE_MATRIX.get(act_key, ACTIVITY_RELEVANCE_MATRIX["other"])

    # 1. Environment Check
    env = ctx.get("environment") or profile.get("environment", "mixed")
    if env == "indoor":
        return False

    # 2. Intensity & Duration Modifiers
    intensity = ctx.get("physical_intensity") or profile.get("physical_intensity", "low")
    exposure = ctx.get("exposure_duration") or profile.get("exposure_duration", "brief")

    # High-intensity outdoor exertion (Running, Cycling, Sports) -> TRUE
    if profile.get("wbgt_eligible") and intensity == "high":
        return True

    # Prolonged moderate outdoor exertion (e.g., 5-hour farm labor or multi-hour endurance event)
    if intensity in ("moderate", "high") and exposure == "prolonged" and env == "outdoor":
        return True

    # Extreme heat context override
    temp_c = ctx.get("temp_c") or ctx.get("temperature")
    if temp_c and temp_c >= 38.0 and env == "outdoor" and exposure == "prolonged":
        return True

    return False


def get_relevant_weather_factors(
    activity_type: Optional[str] = None,
    activity_context: Optional[Dict[str, Any]] = None,
    persona: str = "daily_life",
    environment: Optional[str] = None,
    intensity: Optional[str] = None,
    mobility_type: Optional[str] = None
) -> Dict[str, Any]:
    """
    STAGE 1 FILTERING ENGINE:
    Determines relevant weather factors BEFORE weather calculation and recommendation scoring.
    Returns structured factor profile including evaluated_factors and excluded_factors.
    """
    ctx = dict(activity_context or {})
    if activity_type:
        ctx["activity_type"] = activity_type

    act_raw = ctx.get("activity_type") or ctx.get("type") or ctx.get("id") or ctx.get("activity")
    if isinstance(act_raw, dict):
        act_raw = act_raw.get("type") or act_raw.get("activity_type") or act_raw.get("id")

    act_key = normalize_activity_type(act_raw)
    profile = dict(ACTIVITY_RELEVANCE_MATRIX.get(act_key, ACTIVITY_RELEVANCE_MATRIX["other"]))

    # Apply Context Modifiers
    env = environment or ctx.get("environment") or profile["environment"]
    phys_int = intensity or ctx.get("physical_intensity") or profile["physical_intensity"]
    mob_type = mobility_type or ctx.get("mobility_type") or profile["mobility_type"]

    primary = list(profile["primary_factors"])
    secondary = list(profile["secondary_factors"])
    safety = list(profile["safety_critical_factors"])
    contextual = list(profile["contextual_factors"])
    excluded = list(profile["excluded_factors"])

    # Dynamic WBGT Evaluation
    wbgt_active = is_wbgt_relevant(ctx)
    if not wbgt_active:
        if "WBGT" in primary:
            primary.remove("WBGT")
        if "WBGT" in secondary:
            secondary.remove("WBGT")
        if "WBGT" in safety:
            safety.remove("WBGT")
        if "WBGT" in contextual:
            contextual.remove("WBGT")
        if "WBGT" not in excluded:
            excluded.append("WBGT")
    else:
        if "WBGT" in excluded:
            excluded.remove("WBGT")
        if "WBGT" not in primary and "WBGT" not in secondary:
            primary.append("WBGT")

    evaluated_set = set(primary + secondary + safety + contextual)
    all_excluded = set(excluded) | (CONTROLLED_WEATHER_FACTORS - evaluated_set)

    # Persona Decision Weights
    decision_weights = {}
    for factor in evaluated_set:
        w = 0.70
        if factor in safety:
            w = 1.0
        elif factor in primary:
            w = 0.85
        elif factor in secondary:
            w = 0.50

        # Persona adjustments
        if persona == "sportsperson" and factor in ("WBGT", "AQI", "THUNDERSTORM"):
            w = max(w, 0.95)
        elif persona == "traveler" and factor in ("SEVERE_WEATHER_ALERT", "VISIBILITY", "RAIN_INTENSITY"):
            w = max(w, 0.95)
        elif persona == "commuter" and factor in ("RAIN_INTENSITY", "VISIBILITY", "FOG", "WIND_SPEED"):
            w = max(w, 0.90)

        decision_weights[factor] = w

    return {
        "activity_type": act_key,
        "persona": persona,
        "environment": env,
        "physical_intensity": phys_int,
        "mobility_type": mob_type,
        "wbgt_eligible": wbgt_active,
        "primary_factors": primary,
        "secondary_factors": secondary,
        "safety_critical_factors": safety,
        "contextual_factors": contextual,
        "excluded_factors": sorted(list(all_excluded)),
        "evaluated_factors": sorted(list(evaluated_set)),
        "decision_weights": decision_weights
    }


def get_allowed_factors(activity_context: Dict[str, Any], persona: str = "daily_life") -> List[str]:
    """
    HARD ALLOWED-FACTORS GATE:
    Returns normalized lowercase names of ALL allowed weather factors for the target activity.
    If a factor (e.g. 'wbgt') is excluded for this activity context, it is HARD-EXCLUDED from this list.
    """
    rel = get_relevant_weather_factors(activity_context=activity_context, persona=persona)
    allowed = [f.lower() for f in rel["evaluated_factors"]]
    if not rel["wbgt_eligible"] and "wbgt" in allowed:
        allowed.remove("wbgt")
    return sorted(list(set(allowed)))


def filter_signals_by_allowed_factors(signals: List[Dict[str, Any]], allowed_factors: List[str]) -> List[Dict[str, Any]]:
    """
    Hard filters intelligence signals so that NO signal derived from an excluded weather factor reaches decision logic.
    """
    allowed_set = set(f.lower() for f in allowed_factors)
    filtered = []
    for sig in signals:
        w_type = (sig.get("widget_type") or sig.get("widgetType") or "").lower()
        cat = (sig.get("category") or "").lower()
        if (w_type == "wbgt_safety" or cat == "heat_stress") and "wbgt" not in allowed_set:
            continue
        if (w_type == "dew_factor" or cat == "surface_grip") and ("dew_point" not in allowed_set and "surface_condition" not in allowed_set):
            continue
        if (w_type in ("travel_disruption", "flight_disruption")) and ("travel_disruption" not in allowed_set and "flight_disruption" not in allowed_set and "flood_risk" not in allowed_set and "severe_weather_alert" not in allowed_set):
            continue
        filtered.append(sig)
    return filtered


def get_context_relevance(context: Dict[str, Any]) -> Dict[str, Any]:
    """
    Backwards-Compatible Relevance Adapter.
    Translates ActivityWeatherRelevanceEngine results into internal widget relevance maps.
    """
    persona = (context.get("persona") or context.get("selected_personas", ["daily_life"])[0]).lower()
    factors = get_relevant_weather_factors(activity_context=context, persona=persona)

    signal_relevance = {}
    for factor in CONTROLLED_WEATHER_FACTORS:
        widget_id = FACTOR_TO_WIDGET_MAP.get(factor)
        if not widget_id:
            continue

        if factor in factors["excluded_factors"]:
            # Only mark as not_relevant if it's not present in evaluated_factors via another factor
            other_eval = any(FACTOR_TO_WIDGET_MAP.get(f) == widget_id for f in factors["evaluated_factors"])
            if not other_eval:
                signal_relevance[widget_id] = "not_relevant"
        elif factor in factors["safety_critical_factors"]:
            signal_relevance[widget_id] = "critical"
        elif factor in factors["primary_factors"]:
            signal_relevance[widget_id] = "high"
        elif factor in factors["secondary_factors"]:
            if signal_relevance.get(widget_id) not in ("critical", "high"):
                signal_relevance[widget_id] = "medium"

    applicable_widgets = {w for w, rel in signal_relevance.items() if rel != "not_relevant"}

    return {
        "activity_type": factors["activity_type"],
        "persona": persona,
        "has_activity_context": True,
        "signal_relevance": signal_relevance,
        "applicable_widgets": applicable_widgets,
        "relevance_factors": factors
    }


def validate_signal_applicability(signal: Dict[str, Any], context: Dict[str, Any]) -> bool:
    """
    Validates whether a candidate intelligence signal is applicable to the current context.
    Returns False if the signal is derived from an EXCLUDED weather factor for that activity.
    """
    widget_type = signal.get("widget_type") or signal.get("widgetType")
    if not widget_type:
        return True

    profile = get_context_relevance(context)
    relevance = profile["signal_relevance"].get(widget_type)

    if relevance == "not_relevant":
        return False

    if widget_type == "wbgt_safety" and not profile["relevance_factors"]["wbgt_eligible"]:
        return False

    return True

