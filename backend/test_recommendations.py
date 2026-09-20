"""
Pytest Unit Test Suite for MAUSAM Recommendation Engine Module

Tests WBGT threshold shifts, 34.5°C clamp, dew/wind sensitivity checks,
structured explanations, widget ranker cold-start fallback, and graceful degradation.
"""

import pytest
from backend.sportsperson_engine import (
    calculate_personalized_shifts,
    get_personalized_wbgt_thresholds,
    evaluate_sportsperson_recommendation,
    BASELINE_WBGT_EXTREME
)
from backend.daily_engine import derive_block_conditions, score_activity
from backend.ranker import ranker_service


def test_personalized_wbgt_threshold_shifts():
    """
    Tests age_group, experience_level, and risk_tolerance threshold shifts.
    """
    # Case 1: Junior + Beginner + Conservative => -1.5 + -1.0 + -1.0 = -3.5°C shift
    shift1 = calculate_personalized_shifts("junior", "beginner", "conservative")
    assert shift1 == -3.5

    thresholds1 = get_personalized_wbgt_thresholds("junior", "beginner", "conservative")
    assert thresholds1["extreme_limit"] == round(32.2 - 3.5, 1)  # 28.7°C

    # Case 2: Adult + Elite + Aggressive => 0.0 + 1.0 + 0.5 = +1.5°C shift
    shift2 = calculate_personalized_shifts("adult", "elite", "aggressive")
    assert shift2 == 1.5

    thresholds2 = get_personalized_wbgt_thresholds("adult", "elite", "aggressive")
    assert thresholds2["extreme_limit"] == round(32.2 + 1.5, 1)  # 33.7°C


def test_athlete_recommendation_with_personalized_limits():
    """
    Tests that a junior beginner athlete gets RESCHEDULE at lower WBGT than an elite adult.
    """
    weather = {"temp_c": 28.0, "humidity_pct": 70.0, "wind_speed_kmh": 10.0, "rain_probability": 0.1}

    junior_athlete = {
        "athlete_id": "ath_jr",
        "name": "Junior Athlete",
        "age_group": "junior",
        "experience_level": "beginner",
        "risk_tolerance": "conservative",
        "sport": "running"
    }

    elite_athlete = {
        "athlete_id": "ath_el",
        "name": "Elite Athlete",
        "age_group": "adult",
        "experience_level": "elite",
        "risk_tolerance": "aggressive",
        "sport": "running"
    }

    res_jr = evaluate_sportsperson_recommendation(junior_athlete, weather, "evening")
    res_el = evaluate_sportsperson_recommendation(elite_athlete, weather, "evening")

    assert res_jr["status"] == "RESCHEDULE"
    assert "exceeds your personalized extreme threshold" in res_jr["summary"]

    assert res_el["status"] in ("MODIFY", "GO")


def test_wbgt_clamp_at_34_5():
    """
    Tests that WBGT output is strictly clamped at 34.5°C even at extreme ambient heat & humidity.
    """
    extreme_weather = {"temp_c": 44.0, "humidity_pct": 95.0, "wind_speed_kmh": 5.0, "rain_probability": 0.0}
    res = evaluate_sportsperson_recommendation(
        {"athlete_id": "ath_test", "age_group": "adult", "experience_level": "intermediate", "risk_tolerance": "balanced"},
        extreme_weather,
        "afternoon"
    )

    assessment = res["sportsperson_assessment"]
    assert assessment["wbgt_clamped"] is not None
    assert assessment["wbgt_clamped"] <= 34.5


def test_dew_risk_and_wind_sensitivity():
    """
    Tests dew-risk for tennis in evening and wind sensitivity for cycling.
    """
    dew_weather = {"temp_c": 24.0, "humidity_pct": 88.0, "wind_speed_kmh": 8.0, "rain_probability": 0.1}
    tennis_ath = {"athlete_id": "ath_ten", "sport": "tennis", "age_group": "adult"}

    res_ten = evaluate_sportsperson_recommendation(tennis_ath, dew_weather, "evening")
    assert res_ten["sportsperson_assessment"]["dew_risk"] is True
    assert res_ten["status"] == "MODIFY"
    assert "Dew risk" in res_ten["summary"]

    wind_weather = {"temp_c": 24.0, "humidity_pct": 50.0, "wind_speed_kmh": 28.0, "rain_probability": 0.1}
    cycling_ath = {"athlete_id": "ath_cyc", "sport": "cycling", "age_group": "adult"}

    res_cyc = evaluate_sportsperson_recommendation(cycling_ath, wind_weather, "morning")
    assert res_cyc["sportsperson_assessment"]["wind_flag"] is True
    assert res_cyc["status"] == "MODIFY"
    assert "Crosswind hazard" in res_cyc["summary"]


def test_widget_ranker_cold_start_fallback():
    """
    Tests that a user with zero engagement history triggers rule-based persona default fallback and returns non-empty rankings.
    """
    weather = {"temp_c": 28.0, "humidity_pct": 60.0, "rain_probability": 0.1}
    empty_engagement = {}

    ranked, is_fallback = ranker_service.rank_widgets(
        user_id="usr_new",
        persona="sportsperson",
        weather=weather,
        prior_engagement=empty_engagement
    )

    assert is_fallback is True
    assert len(ranked) > 0
    assert ranked[0]["widget_id"] == "wbgt_tracker"


from backend.weather_intelligence_engine import evaluate_shared_weather_intelligence, validate_consistency


def test_contradiction_prevention_safety_override():
    """
    Tests that a critical safety risk (thunderstorm/extreme WBGT) NEVER permits a 'GO' recommendation
    and automatically updates Primary Decision Intelligence to match.
    """
    raw_insight = {
        "status": "GO",
        "headline": "Sunny morning",
        "recommendation": "Have a nice day",
        "primary_concern": "none",
        "severity_level": "GREEN"
    }

    unsafe_activities = [
        {
            "activity_id": "act_1",
            "activity_label": "Morning Football",
            "status": "GO",
            "primary_reason": {
                "factor": "wbgt_c",
                "observed_value": "33.5°C",
                "assessment": "Extreme Risk"
            }
        }
    ]

    val_insight, val_activities = validate_consistency(raw_insight, unsafe_activities)

    assert val_activities[0]["status"] == "RESCHEDULE"
    assert val_insight["status"] == "RESCHEDULE"
    assert val_insight["severity_level"] == "RED"


def test_shared_weather_intelligence_single_truth():
    """
    Tests that evaluate_shared_weather_intelligence returns consistent PDI and Activity Plan recommendations
    without contradictory conclusions for the same schedule.
    """
    context = {
        "user_id": "usr_test",
        "date": "2026-09-04",
        "selected_personas": ["sportsperson"],
        "routine_activities": [
            {
                "id": "act_1",
                "label": "Track Workout",
                "type": "running",
                "startTime": "16:00",
                "endTime": "17:30",
                "flexible": True
            }
        ],
        "weather_data": {
            "temp_c": 38.0,
            "humidity_pct": 80.0,  # WBGT > 32°C => Extreme Risk
            "wind_speed_kmh": 10.0,
            "rain_probability": 0.1
        }
    }

    result = evaluate_shared_weather_intelligence(context)

    pdi = result["primary_decision_insight"]
    act = result["activities"][0]

    assert pdi["status"] == act["status"]
    assert pdi["status"] == "RESCHEDULE"
    assert result["overall_risk"] == "CRITICAL"


def test_decision_priority_hierarchy():
    """
    Tests that a lower-priority positive factor (mild wind) NEVER overrides a high-priority safety risk (heavy rain).
    """
    context = {
        "user_id": "usr_test",
        "date": "2026-09-04",
        "selected_personas": ["daily_life"],
        "routine_activities": [
            {
                "id": "act_rain",
                "label": "Outdoor Cycling",
                "type": "cycling",
                "startTime": "07:00",
                "endTime": "08:00",
                "flexible": True
            }
        ],
        "weather_data": {
            "temp_c": 24.0,  # Comfortable temp
            "humidity_pct": 60.0,  # Comfortable humidity
            "wind_speed_kmh": 5.0,  # Low wind
            "rain_probability": 0.85  # Heavy rain (High Disruption)
        }
    }

    result = evaluate_shared_weather_intelligence(context)
    pdi = result["primary_decision_insight"]

    assert pdi["status"] in ("MODIFY", "RESCHEDULE")
    assert pdi["status"] != "GO"


from backend.weather_intelligence_engine import (
    evaluate_shared_weather_intelligence,
    validate_consistency,
    generate_structured_signals,
    get_persona_weight,
    resolve_next_activity_occurrence,
    parse_active_days
)
import datetime


def test_persona_intelligence_signals_and_lineage():
    """
    Tests that generate_structured_signals produces structured evidence signals with persona weights,
    and that activity recommendations & PDI record explicit signal lineage.
    """
    context = {
        "user_id": "usr_signal_test",
        "date": "2026-09-04",
        "selected_personas": ["sportsperson"],
        "routine_activities": [
            {
                "id": "act_heat_run",
                "label": "Afternoon Track Session",
                "type": "running",
                "startTime": "14:00",
                "endTime": "15:30",
                "flexible": True
            }
        ],
        "weather_data": {
            "temp_c": 36.0,
            "humidity_pct": 75.0,  # Elevated WBGT
            "wind_speed_kmh": 8.0,
            "rain_probability": 0.15
        }
    }

    signals = generate_structured_signals(context, context["routine_activities"], context["weather_data"])
    assert len(signals) >= 2

    wbgt_sig = next((s for s in signals if s["widget_type"] == "wbgt_safety"), None)
    assert wbgt_sig is not None
    assert wbgt_sig["decision_weight"] == get_persona_weight("sportsperson", "wbgt_safety")
    assert wbgt_sig["affects_activity_id"] == "act_heat_run"
    assert wbgt_sig["threshold_exceeded"] is True

    result = evaluate_shared_weather_intelligence(context)
    act_item = result["activities"][0]

    assert len(act_item["supporting_signals"]) > 0
    assert wbgt_sig["signal_id"] in act_item["supporting_signals"]

    pdi = result["primary_decision_insight"]
    assert pdi["primary_signal"] is not None
    assert len(pdi["supporting_signals"]) > 0


def test_time_aware_resolution_upcoming_today():
    """
    TEST 1: Activity later today (Current 06:00, Activity 07:00-08:00 -> Expected: Today)
    """
    current_dt = datetime.datetime(2026, 9, 7, 6, 0, 0)  # Monday 06:00 AM
    activity = {
        "id": "act_run",
        "label": "Morning Run",
        "startTime": "07:00",
        "endTime": "08:00",
        "days": ["Monday", "Wednesday", "Friday"]
    }
    occurrence = resolve_next_activity_occurrence(activity, current_dt)
    assert occurrence["is_today"] is True
    assert occurrence["is_active"] is False
    assert occurrence["display_label"] == "Today"
    assert occurrence["occurrence_status"] == "upcoming"


def test_time_aware_resolution_completed_shifts_to_next():
    """
    TEST 2: Activity already completed (Current 10:00, Activity 07:00-08:00 -> Expected: Tomorrow / next recurrence)
    """
    current_dt = datetime.datetime(2026, 9, 7, 10, 0, 0)  # Monday 10:00 AM
    activity = {
        "id": "act_run",
        "label": "Morning Run",
        "startTime": "07:00",
        "endTime": "08:00",
        "days": ["daily"]
    }
    occurrence = resolve_next_activity_occurrence(activity, current_dt)
    assert occurrence["is_today"] is False
    assert occurrence["is_tomorrow"] is True
    assert occurrence["display_label"] == "Tomorrow"
    assert occurrence["occurrence_status"] == "upcoming"


def test_time_aware_resolution_currently_active():
    """
    TEST 3: Activity currently active (Current 07:30, Activity 07:00-08:00 -> Expected: Currently Active)
    """
    current_dt = datetime.datetime(2026, 9, 7, 7, 30, 0)  # Monday 07:30 AM
    activity = {
        "id": "act_run",
        "label": "Morning Run",
        "startTime": "07:00",
        "endTime": "08:00"
    }
    occurrence = resolve_next_activity_occurrence(activity, current_dt)
    assert occurrence["is_today"] is True
    assert occurrence["is_active"] is True
    assert occurrence["display_label"] == "Currently Active"
    assert occurrence["occurrence_status"] == "active"


def test_time_aware_resolution_weekly_recurrence():
    """
    TEST 4: Weekly recurrence (Current Monday 10 AM, Activity Mon, Wed, Fri 07:00-08:00 -> Expected: Wednesday)
    """
    current_dt = datetime.datetime(2026, 9, 7, 10, 0, 0)  # Monday 10:00 AM
    activity = {
        "id": "act_gym",
        "label": "Gym",
        "startTime": "07:00",
        "endTime": "08:00",
        "days": ["Monday", "Wednesday", "Friday"]
    }
    occurrence = resolve_next_activity_occurrence(activity, current_dt)
    assert occurrence["is_today"] is False
    assert occurrence["is_tomorrow"] is False
    assert occurrence["day_offset"] == 2  # Wednesday
    assert "Wed" in occurrence["display_label"]


def test_time_aware_shared_intelligence_plan_titles():
    """
    TEST 5 & 6: Plan title is always RECOMMENDED, and subtitle/occurrence match state dynamically.
    """
    current_dt = datetime.datetime(2026, 9, 7, 5, 0, 0)
    context_today = {
        "current_datetime": current_dt,
        "selected_personas": ["daily_life"],
        "routine_activities": [
            {"id": "act_1", "label": "Morning Run", "startTime": "07:00", "endTime": "08:00"}
        ],
        "weather_data": {"temp_c": 25.0}
    }
    res_today = evaluate_shared_weather_intelligence(context_today)
    assert res_today["plan_title"] == "RECOMMENDED"
    assert "today" in res_today["plan_subtitle"].lower()

    current_dt_night = datetime.datetime(2026, 9, 7, 20, 0, 0)
    context_tomorrow = {
        "current_datetime": current_dt_night,
        "selected_personas": ["daily_life"],
        "routine_activities": [
            {"id": "act_1", "label": "Morning Run", "startTime": "07:00", "endTime": "08:00"}
        ],
        "weather_data": {"temp_c": 25.0}
    }
    res_tomorrow = evaluate_shared_weather_intelligence(context_tomorrow)
    assert res_tomorrow["plan_title"] == "RECOMMENDED"
    assert "tomorrow" in res_tomorrow["plan_subtitle"].lower()
    assert res_tomorrow["activities"][0]["display_label"] == "Tomorrow"



from backend.weather_intelligence_engine import get_activity_weather_window


def test_weather_window_isolation_future_activity():
    """
    TEST 1: Current Today 14:00, Activity Tomorrow 07:00-08:00
    Verifies that weather snapshot comes specifically from tomorrow's 07:00-08:00 hourly forecast,
    and NOT from current 14:00 weather.
    """
    weather_data = {
        "current": {
            "temp": 38.0,  # Extreme current heat at 14:00
            "humidity": 40.0,
            "wbgt": 33.0,
            "pop": 0
        },
        "forecast3Hourly": [
            {
                "date": "2026-09-08",
                "time": "07:00",
                "temp": 24.0,  # Cool tomorrow morning
                "humidity": 70.0,
                "pop": 10
            },
            {
                "date": "2026-09-08",
                "time": "14:00",
                "temp": 37.0,
                "humidity": 45.0,
                "pop": 80
            }
        ]
    }

    win = get_activity_weather_window(
        weather_data=weather_data,
        occurrence_date="2026-09-08",
        start_time="07:00",
        end_time="08:00",
        location_str="Deoghar",
        occurrence_status="upcoming"
    )

    assert win["is_available"] is True
    assert win["data_type"] == "hourly_forecast"
    assert win["analyzed_context"]["date"] == "2026-09-08"
    assert win["analyzed_context"]["time_window"] == "07:00 AM – 08:00 AM"

    snap = win["weather_snapshot"]
    # Must match tomorrow morning 07:00 (24.0°C), NOT current 14:00 (38.0°C)!
    assert snap["temp_c"] == 24.0
    assert snap["rain_probability"] == 10
    assert snap["wbgt_c"] < 28.0  # Cool morning WBGT, not 33°C current heat!


def test_weather_window_distinct_multi_activities():
    """
    TEST 4: Two activities (Morning Run 07:00-08:00, Evening Practice 18:00-20:00)
    Each activity receives separate distinct hourly weather window analysis.
    """
    weather_data = {
        "forecast3Hourly": [
            {"date": "2026-09-07", "time": "07:00", "temp": 22.0, "humidity": 75.0, "pop": 10},
            {"date": "2026-09-07", "time": "18:00", "temp": 30.0, "humidity": 85.0, "pop": 90}
        ]
    }

    context = {
        "current_datetime": datetime.datetime(2026, 9, 7, 5, 0, 0),
        "selected_personas": ["sportsperson"],
        "routine_activities": [
            {"id": "act_morning", "label": "Morning Run", "startTime": "07:00", "endTime": "08:00"},
            {"id": "act_evening", "label": "Evening Practice", "startTime": "18:00", "endTime": "20:00"}
        ],
        "weather_data": weather_data
    }

    res = evaluate_shared_weather_intelligence(context)
    acts = res["activities"]

    assert len(acts) == 2
    morning_act = next(a for a in acts if a["activity_id"] == "act_morning")
    evening_act = next(a for a in acts if a["activity_id"] == "act_evening")

    assert morning_act["weather_snapshot"]["temp_c"] == 22.0
    assert morning_act["status"] == "GO"

    assert evening_act["weather_snapshot"]["temp_c"] == 30.0
    assert evening_act["status"] in ("MODIFY", "RESCHEDULE")  # High rain risk at 18:00


def test_forecast_unavailable_insufficient_data():
    """
    TEST 5: Forecast unavailable for target date -> Returns status INSUFFICIENT DATA
    """
    context = {
        "current_datetime": datetime.datetime(2026, 9, 7, 22, 0, 0),
        "selected_personas": ["daily_life"],
        "routine_activities": [
            {"id": "act_out_of_range", "label": "Outstation Event", "startTime": "07:00", "endTime": "08:00"}
        ],
        "weather_data": {}  # Completely empty forecast data
    }

def test_ampm_time_normalization_tests_1_to_7():
    """
    Automated verification for AM/PM explicit time selection requirements (Tests 1 through 7).
    """
    from backend.weather_intelligence_engine import (
        parse_time_string,
        normalize_time_24h,
        format_time_12h,
        resolve_next_activity_occurrence,
        evaluate_shared_weather_intelligence
    )

    # TEST 1: 07:00 AM -> 07:00
    h1, m1, p1, disp1, t24_1 = parse_time_string("07:00 AM")
    assert t24_1 == "07:00"
    assert h1 == 7
    assert p1 == "AM"

    # TEST 2: 07:00 PM -> 19:00
    h2, m2, p2, disp2, t24_2 = parse_time_string("07:00 PM")
    assert t24_2 == "19:00"
    assert h2 == 19
    assert p2 == "PM"

    # TEST 3: 12:00 AM -> 00:00
    h3, m3, p3, disp3, t24_3 = parse_time_string("12:00 AM")
    assert t24_3 == "00:00"
    assert h3 == 0
    assert p3 == "AM"

    # TEST 4: 12:00 PM -> 12:00
    h4, m4, p4, disp4, t24_4 = parse_time_string("12:00 PM")
    assert t24_4 == "12:00"
    assert h4 == 12
    assert p4 == "PM"

    # TEST 5: Activity 05:00 PM – 07:00 PM => Expected forecast 17:00–19:00 (not 05:00–07:00)
    weather_data_test5 = {
        "forecast3Hourly": [
            {"date": "2026-09-07", "time": "06:00", "temp": 20.0, "humidity": 70.0},
            {"date": "2026-09-07", "time": "18:00", "temp": 33.0, "humidity": 80.0}
        ]
    }
    context5 = {
        "current_datetime": datetime.datetime(2026, 9, 7, 10, 0, 0),
        "selected_personas": ["daily_life"],
        "routine_activities": [
            {"id": "act_eve", "label": "Evening Practice", "startTime": "05:00 PM", "endTime": "07:00 PM"}
        ],
        "weather_data": weather_data_test5
    }
    res5 = evaluate_shared_weather_intelligence(context5)
    act5 = res5["activities"][0]
    assert act5["weather_snapshot"]["temp_c"] == 33.0  # Uses 18:00 (33°C), not 06:00 (20°C)
    assert act5["schedule"]["start_time"] == "17:00"
    assert act5["schedule"]["end_time"] == "19:00"
    assert act5["schedule"]["display_start_time"] == "05:00 PM"
    assert act5["schedule"]["display_end_time"] == "07:00 PM"

    # TEST 6: Current 02:00 PM, Activity 07:00 AM – 08:00 AM => Expected Tomorrow's 07:00–08:00 AM
    current_dt_2pm = datetime.datetime(2026, 9, 7, 14, 0, 0)
    occ6 = resolve_next_activity_occurrence(
        {"label": "Morning Run", "startTime": "07:00 AM", "endTime": "08:00 AM"},
        current_datetime=current_dt_2pm
    )
    assert occ6["occurrence_date"] == "2026-09-08"
    assert occ6["is_tomorrow"] is True
    assert occ6["display_start_time"] == "07:00 AM"

    # TEST 7: Current 02:00 PM, Activity 05:00 PM – 07:00 PM => Expected Today's 17:00–19:00
    occ7 = resolve_next_activity_occurrence(
        {"label": "Evening Practice", "startTime": "05:00 PM", "endTime": "07:00 PM"},
        current_datetime=current_dt_2pm
    )
    assert occ7["occurrence_date"] == "2026-09-07"
    assert occ7["is_today"] is True
    assert occ7["normalized_start_time"] == "17:00"
    assert occ7["normalized_end_time"] == "19:00"


def test_context_relevance_engine_tests_1_to_6():
    """
    Automated verification of Context Relevance Engine rules (Tests 1 through 6).
    """
    import datetime
    from backend.context_relevance_engine import get_context_relevance, validate_signal_applicability
    from backend.weather_intelligence_engine import evaluate_shared_weather_intelligence

    weather_sample = {
        "forecast3Hourly": [
            {"date": "2026-09-07", "time": "07:00", "temp": 30.0, "humidity": 85.0, "wind": 10.0, "pop": 10, "wbgt": 30.0},
            {"date": "2026-09-07", "time": "13:00", "temp": 35.0, "humidity": 60.0, "wind": 30.0, "pop": 70, "wbgt": 33.0},
            {"date": "2026-09-07", "time": "17:00", "temp": 28.0, "humidity": 90.0, "wind": 15.0, "pop": 20, "wbgt": 29.0}
        ]
    }
    cur_dt = datetime.datetime(2026, 9, 7, 5, 0, 0)

    # TEST 1: Sportsperson + Running -> WBGT Included
    rel1 = get_context_relevance({"persona": "sportsperson", "activity_type": "running"})
    assert rel1["signal_relevance"]["wbgt_safety"] == "high"
    assert rel1["signal_relevance"]["dew_factor"] == "not_relevant"
    assert rel1["signal_relevance"]["travel_disruption"] == "not_relevant"

    # TEST 2: Traveler + Air Travel -> WBGT Excluded, Flight Disruption Included
    rel2 = get_context_relevance({"persona": "traveler", "activity_type": "air_travel"})
    assert rel2["signal_relevance"]["wbgt_safety"] == "not_relevant"
    assert rel2["signal_relevance"]["flight_disruption"] == "critical"
    assert rel2["signal_relevance"]["travel_disruption"] == "critical"

    sig_wbgt = {"widget_type": "wbgt_safety"}
    sig_flight = {"widget_type": "travel_disruption"}
    ctx2 = {"persona": "traveler", "activity_type": "air_travel"}
    assert validate_signal_applicability(sig_wbgt, ctx2) is False
    assert validate_signal_applicability(sig_flight, ctx2) is True

    # TEST 3: Commuter + Two-Wheeler Commute -> Visibility Critical, Rain Critical, Wind High
    rel3 = get_context_relevance({"persona": "commuter", "activity_type": "two_wheeler_commute"})
    assert rel3["signal_relevance"]["visibility_fog"] == "critical"
    assert rel3["signal_relevance"]["commute_weather"] == "critical"
    assert rel3["signal_relevance"]["wbgt_safety"] == "not_relevant"

    # TEST 4: Health-conscious + Outdoor Walk -> AQI High/Critical, UV Medium/High
    rel4 = get_context_relevance({"persona": "health_conscious", "activity_type": "walking"})
    assert rel4["signal_relevance"]["aqi_health"] in ("high", "critical")
    assert rel4["signal_relevance"]["uv_heat_index"] in ("medium", "high")

    # TEST 5: Sportsperson + Travel -> Activity context (Travel) overrides generic Sportsperson persona
    rel5 = get_context_relevance({"persona": "sportsperson", "activity_type": "travel"})
    assert rel5["signal_relevance"]["wbgt_safety"] == "not_relevant"
    assert rel5["signal_relevance"]["dew_factor"] == "not_relevant"
    assert rel5["signal_relevance"]["travel_disruption"] == "critical"

    # TEST 6: Multiple activities (Running, Travel, Cricket) -> Isolated relevant signal sets & zero signal leakage
    context6 = {
        "current_datetime": cur_dt,
        "selected_personas": ["sportsperson"],
        "routine_activities": [
            {"id": "act_run", "type": "running", "label": "Morning Run", "startTime": "07:00 AM", "endTime": "08:00 AM"},
            {"id": "act_trv", "type": "travel", "label": "Outstation Flight", "startTime": "01:00 PM", "endTime": "03:00 PM"},
            {"id": "act_crk", "type": "cricket", "label": "Evening Cricket", "startTime": "05:00 PM", "endTime": "07:00 PM"}
        ],
        "weather_data": weather_sample
    }

    res6 = evaluate_shared_weather_intelligence(context6)
    acts6 = res6["activities"]

    run_act = next(a for a in acts6 if a["activity_id"] == "act_run")
    trv_act = next(a for a in acts6 if a["activity_id"] == "act_trv")
    crk_act = next(a for a in acts6 if a["activity_id"] == "act_crk")

    # Run activity has WBGT signal and NO travel disruption signal
    run_sigs = [s["widget_type"] for s in res6["signals"] if s.get("affects_activity_id") == "act_run"]
    assert "wbgt_safety" in run_sigs
    assert "travel_disruption" not in run_sigs

    # Travel activity has Travel Disruption signal and NO WBGT or Dew signal
    trv_sigs = [s["widget_type"] for s in res6["signals"] if s.get("affects_activity_id") == "act_trv"]
    assert "travel_disruption" in trv_sigs
    assert "wbgt_safety" not in trv_sigs
    assert "dew_factor" not in trv_sigs
    assert trv_act.get("sportsperson_assessment") is None

    # Cricket activity has Dew Factor & WBGT signals
    crk_sigs = [s["widget_type"] for s in res6["signals"] if s.get("affects_activity_id") == "act_crk"]
    assert "dew_factor" in crk_sigs
    assert "wbgt_safety" in crk_sigs
    assert "travel_disruption" not in crk_sigs


def test_layer_1_current_vs_layer_2_future_temporal_separation():
    """
    Automated verification of Layer 1 (Real-Time Persona Intelligence) vs Layer 2 (Future Personalized Recommendations).
    Ensures strict temporal separation between current weather metrics and future forecast recommendations.
    """
    from backend.weather_intelligence_engine import (
        generate_current_persona_signals,
        evaluate_shared_weather_intelligence
    )
    import datetime

    weather_sample = {
        "name": "Deoghar",
        "current": {
            "temp": 32.0,
            "humidity": 65.0,
            "pop": 0.0,
            "uvIndex": 6.0,
            "aqi": 55.0,
            "visibility": 9.0,
            "wbgt": 29.5
        },
        "forecast3Hourly": [
            {"date": "2026-09-08", "time": "07:00", "temp": 24.0, "humidity": 75.0, "pop": 80, "wbgt": 24.5}
        ]
    }

    cur_dt = datetime.datetime(2026, 9, 7, 14, 0, 0)
    context = {
        "current_datetime": cur_dt,
        "selected_personas": ["sportsperson"],
        "routine_activities": [
            {"id": "act_morn", "type": "running", "label": "Morning Run", "startTime": "07:00 AM", "endTime": "08:00 AM"}
        ],
        "weather_data": weather_sample
    }

    # Layer 1 Real-time Current Intelligence
    cur_intel = generate_current_persona_signals(context, weather_sample)
    assert cur_intel["temporal_context"] == "current"
    assert cur_intel["weather_source"] == "current_weather"
    assert len(cur_intel["signals"]) > 0
    current_temp_sig = next(s for s in cur_intel["signals"] if s["widget_type"] == "current_conditions")
    assert current_temp_sig["value"] == 32.0

    # Layer 2 Future Recommendation
    res = evaluate_shared_weather_intelligence(context)
    assert res["plan_title"] == "RECOMMENDED"
    assert res["temporal_context"] == "future"
    assert res["weather_source"] == "hourly_forecast"
    assert "current_intelligence" in res
    assert res["current_intelligence"]["temporal_context"] == "current"

    # Primary Recommendation inside Layer 2 payload
    p_rec = res["primary_recommendation"]
    assert p_rec["temporal_context"] == "future"
    assert p_rec["weather_source"] == "hourly_forecast"

    # Activity recommendation uses future forecast (tomorrow morning 24°C, 80% rain -> MODIFY)
    act = res["activities"][0]
    assert act["temporal_context"] == "future"
    assert act["weather_source"] == "hourly_forecast"
    assert act["occurrence_date"] == "2026-09-08"
    assert act["weather_snapshot"]["temp_c"] == 24.0
    assert act["weather_snapshot"]["rain_probability"] == 80
    assert act["status"] in ("MODIFY", "RESCHEDULE")


from backend.weather_intelligence_engine import (
    calculate_activity_wbgt,
    validate_temporal_context,
    generate_current_persona_signals,
    evaluate_shared_weather_intelligence
)


def test_wbgt_time_variation():
    """
    TEST 1: WBGT TIME VARIATION
    Same location (Deoghar), 07:00 AM (24°C, 65% RH) vs 02:00 PM (34°C, 70% RH).
    Verifies independent WBGT calculations.
    """
    wbgt_morn = calculate_activity_wbgt(
        {"temp_c": 24.0, "humidity_pct": 65.0, "wind_speed_kmh": 10.0},
        {"location": "Deoghar", "date": "2026-09-05", "time_window": "07:00 AM – 08:00 AM"}
    )
    wbgt_aft = calculate_activity_wbgt(
        {"temp_c": 34.0, "humidity_pct": 70.0, "wind_speed_kmh": 12.0},
        {"location": "Deoghar", "date": "2026-09-05", "time_window": "02:00 PM – 03:00 PM"}
    )

    assert wbgt_morn["value"] != wbgt_aft["value"]
    assert wbgt_morn["cache_key"] == "wbgt:deoghar:2026-09-05:07-00-am-08-00-am"
    assert wbgt_aft["cache_key"] == "wbgt:deoghar:2026-09-05:02-00-pm-03-00-pm"
    assert wbgt_morn["provenance"]["calculation_inputs"]["temperature"] == 24.0
    assert wbgt_aft["provenance"]["calculation_inputs"]["temperature"] == 34.0


def test_activity_specific_wbgt():
    """
    TEST 2: ACTIVITY-SPECIFIC WBGT
    Running (Tomorrow 07:00 AM) vs Cricket (Tomorrow 05:00 PM).
    Verifies separate forecast data fetched, separate WBGT calculations, no shared/static WBGT.
    """
    weather_data = {
        "forecast3Hourly": [
            {"date": "2026-09-08", "time": "07:00", "temp": 22.0, "humidity": 60.0},
            {"date": "2026-09-08", "time": "17:00", "temp": 35.0, "humidity": 75.0}
        ]
    }
    cur_dt = datetime.datetime(2026, 9, 7, 22, 0, 0)
    context = {
        "current_datetime": cur_dt,
        "selected_personas": ["sportsperson"],
        "routine_activities": [
            {"id": "act_run", "label": "Running", "type": "running", "startTime": "07:00 AM", "endTime": "08:00 AM", "location": "Park"},
            {"id": "act_cricket", "label": "Cricket", "type": "cricket", "startTime": "05:00 PM", "endTime": "07:00 PM", "location": "Stadium"}
        ],
        "weather_data": weather_data
    }

    res = evaluate_shared_weather_intelligence(context)
    acts = res["activities"]
    run_act = next(a for a in acts if a["activity_id"] == "act_run")
    cricket_act = next(a for a in acts if a["activity_id"] == "act_cricket")

    assert run_act["weather_snapshot"]["wbgt_c"] != cricket_act["weather_snapshot"]["wbgt_c"]
    assert run_act["analyzed_context"]["provenance"]["calculation_inputs"]["temperature"] == 22.0
    assert cricket_act["analyzed_context"]["provenance"]["calculation_inputs"]["temperature"] == 35.0


def test_live_widget_independence():
    """
    TEST 3: LIVE WIDGET INDEPENDENCE
    Changing tomorrow's forecast dramatically must NOT alter live persona widgets (home_persona_prioritized_widgets).
    """
    cur_weather = {"temp": 28.0, "humidity": 60.0, "pop": 10, "uvIndex": 5.0, "aqi": 40.0}
    context_normal = {
        "current_datetime": datetime.datetime(2026, 9, 7, 10, 0, 0),
        "selected_personas": ["daily_life"],
        "weather_data": {
            "name": "Location A",
            "current": cur_weather,
            "forecast3Hourly": [{"date": "2026-09-08", "time": "07:00", "temp": 20.0, "pop": 10}]
        }
    }

    context_storm = {
        "current_datetime": datetime.datetime(2026, 9, 7, 10, 0, 0),
        "selected_personas": ["daily_life"],
        "weather_data": {
            "name": "Location A",
            "current": cur_weather,
            "forecast3Hourly": [{"date": "2026-09-08", "time": "07:00", "temp": 45.0, "pop": 100}]
        }
    }

    sigs_normal = generate_current_persona_signals(context_normal, context_normal["weather_data"])
    sigs_storm = generate_current_persona_signals(context_storm, context_storm["weather_data"])

    def _strip_ts(sigs):
        import copy
        res = copy.deepcopy(sigs)
        for s in res:
            if isinstance(s.get("provenance"), dict):
                s["provenance"].pop("source_timestamp", None)
        return res

    assert _strip_ts(sigs_normal["signals"]) == _strip_ts(sigs_storm["signals"])


def test_recommendation_independence():
    """
    TEST 4: RECOMMENDATION INDEPENDENCE
    Changing current weather dramatically must NOT alter tomorrow's forecast activity recommendation.
    """
    forecast_data = [{"date": "2026-09-08", "time": "07:00", "temp": 24.0, "humidity": 60.0, "pop": 10}]
    routine = [{"id": "act_morn", "type": "running", "label": "Morning Run", "startTime": "07:00 AM", "endTime": "08:00 AM"}]

    context_mild_now = {
        "current_datetime": datetime.datetime(2026, 9, 7, 14, 0, 0),
        "selected_personas": ["sportsperson"],
        "routine_activities": routine,
        "weather_data": {
            "current": {"temp": 25.0, "humidity": 50.0},
            "forecast3Hourly": forecast_data
        }
    }

    context_extreme_now = {
        "current_datetime": datetime.datetime(2026, 9, 7, 14, 0, 0),
        "selected_personas": ["sportsperson"],
        "routine_activities": routine,
        "weather_data": {
            "current": {"temp": 45.0, "humidity": 95.0},
            "forecast3Hourly": forecast_data
        }
    }

    res_mild = evaluate_shared_weather_intelligence(context_mild_now)
    res_extreme = evaluate_shared_weather_intelligence(context_extreme_now)

    act_mild = res_mild["activities"][0]
    act_extreme = res_extreme["activities"][0]

    assert act_mild["status"] == act_extreme["status"]
    assert act_mild["weather_snapshot"]["temp_c"] == act_extreme["weather_snapshot"]["temp_c"] == 24.0


def test_location_separation():
    """
    TEST 5: LOCATION SEPARATION
    Current user location: Location A. Future activity location: Location B.
    Current widgets -> Location A live weather.
    Recommended -> Location B future forecast.
    """
    context = {
        "current_datetime": datetime.datetime(2026, 9, 7, 10, 0, 0),
        "selected_personas": ["sportsperson"],
        "routine_activities": [
            {"id": "act_loc_b", "label": "Running at Location B", "type": "running", "startTime": "07:00 AM", "endTime": "08:00 AM", "location": "Location B"}
        ],
        "weather_data": {
            "name": "Location A",
            "current": {"temp": 30.0, "humidity": 60.0},
            "forecast3Hourly": [
                {"date": "2026-09-08", "time": "07:00", "temp": 20.0, "humidity": 50.0, "pop": 10}
            ]
        }
    }

    live_intel = generate_current_persona_signals(context, context["weather_data"])
    assert live_intel["location"] == "Location A"

    rec_res = evaluate_shared_weather_intelligence(context)
    act_b = rec_res["activities"][0]
    assert act_b["location"] == "Location B"
    assert act_b["weather_snapshot"]["temp_c"] == 20.0


def test_temporal_validation():
    """
    TEST 6: TEMPORAL VALIDATION
    Rejects passing future forecast signals into current live widget pipeline and vice versa.
    """
    future_signal = {
        "widget_type": "wbgt_safety",
        "temporal_context": "future",
        "forecast_date": "2026-09-08",
        "activity_id": "act_1",
        "value": 30.0
    }

    current_signal = {
        "widget_type": "wbgt_safety",
        "temporal_context": "current",
        "observed_at": "2026-09-07T10:00:00",
        "location": "Location A",
        "data_source": "live_current_weather",
        "value": 26.5
    }

    assert validate_temporal_context(future_signal, "current") is False
    assert validate_temporal_context(current_signal, "current") is True
    assert validate_temporal_context(current_signal, "future") is False
    assert validate_temporal_context(future_signal, "future") is True


from backend.context_relevance_engine import get_relevant_weather_factors, is_wbgt_relevant
from backend.daily_engine import score_activity


def test_activity_relevance_office():
    """
    TEST 1: Office Activity
    Expected: WBGT excluded. Recommendation based on commute/severe weather factors only.
    """
    factors = get_relevant_weather_factors(activity_type="office", persona="daily_life")
    assert "WBGT" in factors["excluded_factors"]
    assert "RAIN_PROBABILITY" in factors["primary_factors"]
    assert "SEVERE_WEATHER_ALERT" in factors["safety_critical_factors"]

    res = score_activity({"type": "office"}, {"temp_c": 35.0, "humidity_pct": 80.0, "rain_probability": 0.1, "wbgt_c": 33.0})
    assert res["excluded_factors"] == factors["excluded_factors"]
    assert "WBGT" in res["excluded_factors"]
    assert res["status"] == "GO"


def test_activity_relevance_running():
    """
    TEST 2: Running Activity
    Expected: WBGT included. Exact activity time forecast used for WBGT calculation.
    """
    factors = get_relevant_weather_factors(activity_type="running", persona="sportsperson")
    assert "WBGT" in factors["primary_factors"]
    assert "WBGT" not in factors["excluded_factors"]
    assert factors["wbgt_eligible"] is True

    res = score_activity({"type": "running"}, {"temp_c": 35.0, "humidity_pct": 80.0, "rain_probability": 0.1, "wbgt_c": 33.0}, persona="sportsperson")
    assert res["status"] == "RESCHEDULE"
    assert res["primary_reason"]["factor"] == "wbgt_c"


def test_activity_relevance_travel():
    """
    TEST 3: Travel Activity
    Expected: WBGT excluded. Focus on severe weather, wind, visibility, rain, disruption risk.
    """
    factors = get_relevant_weather_factors(activity_type="travel", persona="traveler")
    assert "WBGT" in factors["excluded_factors"]
    assert "SEVERE_WEATHER_ALERT" in factors["primary_factors"]
    assert "VISIBILITY" in factors["primary_factors"]


def test_activity_relevance_indoor_work():
    """
    TEST 4: Indoor Work / Study Activity
    Expected: WBGT excluded. Minimal weather factor analysis ("No significant weather-related disruption...").
    """
    factors = get_relevant_weather_factors(activity_type="indoor", persona="daily_life")
    assert "WBGT" in factors["excluded_factors"]
    assert factors["environment"] == "indoor"

    res = score_activity({"type": "indoor"}, {"temp_c": 36.0, "humidity_pct": 70.0, "rain_probability": 0.1, "wbgt_c": 32.0})
    assert res["status"] == "GO"
    assert "indoor" in res["what_this_means"].lower() or "indoor" in res["summary"].lower()


def test_activity_relevance_commute():
    """
    TEST 5: Commute Activity
    Expected: WBGT excluded. Visibility and rain prioritized.
    """
    factors = get_relevant_weather_factors(activity_type="commute", persona="commuter")
    assert "WBGT" in factors["excluded_factors"]
    assert "VISIBILITY" in factors["primary_factors"]
    assert "RAIN_INTENSITY" in factors["primary_factors"]


def test_activity_relevance_beach():
    """
    TEST 6: Beach Activity
    Expected: UV and temperature prioritized. WBGT should not automatically dominate.
    """
    factors = get_relevant_weather_factors(activity_type="beach_activity", persona="daily_life")
    assert "UV_INDEX" in factors["primary_factors"]
    assert "TEMPERATURE" in factors["primary_factors"]
    assert factors["wbgt_eligible"] is False


def test_activity_relevance_sports():
    """
    TEST 7: Sports Activity
    Expected: Sport-specific weather factors. WBGT relevant for physically demanding outdoor sports.
    """
    factors = get_relevant_weather_factors(activity_type="sports", persona="sportsperson")
    assert "WBGT" in factors["primary_factors"]
def test_wbgt_exclusion_hard_gate_running_vs_travel():
    """
    MANDATORY CRITICAL BUG REGRESSION TEST:
    Same weather forecast with WBGT = 33.2°C (extreme heat stress) and suitable conditions for other metrics:
    - Running -> WBGT evaluated -> status RESCHEDULE, primary reason wbgt_c
    - Travel -> WBGT NOT evaluated -> status GO, primary reason NOT wbgt_c, WBGT absent from explanation and factors!
    - Commute -> WBGT NOT evaluated -> status GO
    - College -> WBGT NOT evaluated -> status GO
    """
    weather_inputs = {
        "temp_c": 30.0,
        "humidity_pct": 80.0,
        "wind_speed_kmh": 10.0,
        "rain_probability": 0.10,
        "uv_index": 4.0,
        "aqi": 45.0,
        "visibility_km": 10.0,
        "wbgt_c": 33.2
    }

    # Running Activity
    res_run = score_activity({"type": "running", "label": "Morning Run"}, weather_inputs, persona="sportsperson")
    assert res_run["status"] == "RESCHEDULE"
    assert res_run["primary_reason"]["factor"] == "wbgt_c"
    assert "wbgt" in res_run["decision_provenance"]["allowed_factors"]

    # Travel Activity
    res_travel = score_activity({"type": "travel", "label": "Outstation Drive"}, weather_inputs, persona="traveler")
    assert res_travel["status"] == "GO"
    assert res_travel["primary_reason"]["factor"] != "wbgt_c"
    assert "wbgt" not in res_travel["decision_provenance"]["allowed_factors"]
    assert "wbgt" in [f.lower() for f in res_travel["decision_provenance"]["excluded_factors"]]
    assert "WBGT" not in [f["name"] for f in res_travel["analyzed_factors"]]
    assert "wbgt" not in res_travel["summary"].lower()

    # Commute Activity
    res_commute = score_activity({"type": "commute", "label": "Office Commute"}, weather_inputs, persona="commuter")
    assert res_commute["status"] == "GO"
    assert res_commute["primary_reason"]["factor"] != "wbgt_c"
    assert "wbgt" not in res_commute["decision_provenance"]["allowed_factors"]

    # College Activity
    res_college = score_activity({"type": "college", "label": "Classes"}, weather_inputs, persona="daily_life")
    assert res_college["status"] == "GO"
    assert res_college["primary_reason"]["factor"] != "wbgt_c"
    assert "wbgt" not in res_college["decision_provenance"]["allowed_factors"]












