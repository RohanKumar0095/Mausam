# MAUSAM Recommendation System Module — API Documentation

This module provides real-time personalized recommendations, widget relevance ranking, daily activity suitability planning, and personalized sportsperson/coach team intelligence for the **MAUSAM Personalized Weather Application**.

---

## 1. Module Overview & Architecture

```text
┌─────────────────────────────────────────────────────────┐
│                    REACT FRONTEND                       │
│  - DailyPlanCard.jsx    (Today's Plan homepage card)     │
│  - CoachViewCard.jsx    (Squad & Coach Team View card)   │
│  - recommendationService.js (API Client + Client Fallback)│
└────────────────────────────┬────────────────────────────┘
                             │ REST API (HTTP GET)
                             ▼
┌─────────────────────────────────────────────────────────┐
│                 FASTAPI BACKEND SERVICE                 │
│  - main.py               (FastAPI Application Server)   │
│  - ranker.py             (GradientBoosting Ranker)      │
│  - daily_engine.py       (Diurnal Activity Engine)      │
│  - sportsperson_engine.py (Personalized WBGT + Coach)   │
└─────────────────────────────────────────────────────────┘
```

---

## 2. API Endpoints

### 2.1 Widget Relevance Ranker
Ranks homepage widgets for a user based on persona, live weather context, and prior engagement history. Includes a **rule-based persona default fallback** for cold-start users with zero engagement history so that an empty ranking is **never returned**.

* **Endpoint**: `GET /api/recommendations/widgets`
* **Query Parameters**:
  * `user_id` (string, default: `"usr_demo"`)
  * `persona` (string, default: `"sportsperson"`)
  * `location` (string, default: `"Gaya"`)
  * `time_of_day` (string: `morning` | `afternoon` | `evening` | `night`)
  * `temp_c`, `humidity_pct`, `wind_speed_kmh`, `uv_index`, `aqi`, `rain_probability`, `wbgt_c`
* **Sample Response**:
```json
{
  "user_id": "usr_demo",
  "persona": "sportsperson",
  "is_fallback": false,
  "ranked_widgets": [
    {
      "widget_id": "wbgt_tracker",
      "score": 0.95,
      "reason": "Prioritized based on active thermal stress (WBGT) relevance for your persona"
    },
    {
      "widget_id": "hydration_guide",
      "score": 0.88,
      "reason": "Electrolyte & fluid loss estimation based on thermal stress"
    },
    {
      "widget_id": "uv_forecast",
      "score": 0.81,
      "reason": "High UV index sun protection advisory for outdoor exposure"
    }
  ]
}
```

---

### 2.2 Daily Activity Recommendation Engine
Evaluates a user's recurring daily activities against diurnal time-of-day weather conditions (morning, afternoon, evening) and outputs a status (`Go` | `Modify` | `Reschedule` | `Insufficient Data`) with a plain-language reason string. Suggests alternative time blocks for flexible activities.

* **Endpoint**: `GET /api/recommendations/daily-plan`
* **Query Parameters**:
  * `user_id` (string, default: `"usr_demo"`)
  * `date` (string, format: `YYYY-MM-DD`)
  * `location_id` (string, default: `"loc_ranchi"`)
  * `temp_c`, `humidity_pct`, `wind_speed_kmh`, `uv_index`, `rain_probability`
* **Sample Response**:
```json
{
  "user_id": "usr_demo",
  "date": "2026-09-04",
  "location_id": "loc_ranchi",
  "activities": [
    {
      "activity_id": "act_001",
      "activity_type": "morning_run",
      "persona": "fitness",
      "preferred_block": "morning",
      "flexible": true,
      "status": "Reschedule",
      "reason": "Rain probability 70% during this window",
      "time_window": "06:00 – 09:00",
      "suggested_alternative_block": "evening",
      "suggested_alternative_window": "17:00 – 19:30 (Evening)"
    }
  ]
}
```

---

### 2.3 Individual Sportsperson Personalized Recommendation
Calculates custom WBGT safety thresholds adjusted by `age_group` (junior/adult/senior), `experience_level` (beginner/intermediate/elite), and `risk_tolerance` (conservative/balanced/aggressive). Checks sport-specific dew-risk (tennis/cricket) and wind sensitivity (cycling/rowing).

* **Endpoint**: `GET /api/recommendations/sportsperson/{athlete_id}`
* **Query Parameters**:
  * `age_group` (`junior` | `adult` | `senior`)
  * `experience_level` (`beginner` | `intermediate` | `elite`)
  * `risk_tolerance` (`conservative` | `balanced` | `aggressive`)
  * `sport` (string, e.g., `running`, `tennis`, `cycling`)
  * `session_block` (`morning` | `afternoon` | `evening`)
  * `temp_c`, `humidity_pct`, `wind_speed_kmh`, `rain_probability`
* **Sample Response**:
```json
{
  "athlete_id": "ath_jr_01",
  "sport": "running",
  "status": "Reschedule",
  "reason": "WBGT 31.0°C exceeds personalized extreme limit (28.7°C) for junior beginner athlete — postpone outdoor session",
  "wbgt_c": 31.0,
  "wbgt_clamped": 31.0,
  "wbgt_zone": "Extreme Risk",
  "dew_risk": false,
  "wind_sensitivity_flag": false,
  "rain_sensitivity_flag": false,
  "personalized_thresholds": {
    "low_limit": 20.5,
    "high_limit": 24.5,
    "very_high_limit": 27.5,
    "extreme_limit": 28.7,
    "shift": -3.5
  },
  "total_shift": -3.5
}
```

---

### 2.4 Coach & Team View Aggregate Recommendation
Groups squad members by location, sport, and session block. Returns an aggregate team call (`Proceed` | `Proceed with modifications` | `Reschedule entire session`) plus a list of individually flagged squad members.

* **Endpoint**: `GET /api/recommendations/sportsperson/team`
* **Query Parameters**:
  * `location` (string)
  * `sport` (string)
  * `session_block` (`morning` | `afternoon` | `evening`)
  * `temp_c`, `humidity_pct`, `wind_speed_kmh`, `rain_probability`
* **Sample Response**:
```json
{
  "location": "Ranchi Sports Complex",
  "sport": "running",
  "session_block": "evening",
  "time_window": "17:00 – 19:30",
  "aggregate_decision": "Proceed with modifications",
  "summary_reason": "1 athlete(s) require extra hydration/breaks or equipment adjustments",
  "total_athletes": 4,
  "flagged_count": 1,
  "flagged_athletes": [
    {
      "athlete_id": "ath_01",
      "name": "Aarav Sharma",
      "sport": "running",
      "age_group": "junior",
      "experience_level": "beginner",
      "risk_tolerance": "conservative",
      "individual_status": "Reschedule",
      "flag_reason": "WBGT 31.0°C exceeds personalized extreme limit (28.7°C) for junior beginner",
      "personalized_wbgt_limit": 28.7
    }
  ]
}
```

---

## 3. Explicitly Known Limitation: WBGT 34.5°C Clamp

> **Technical Note**: The simplified Australian Bureau of Meteorology (ABM) / Liljegren Wet-Bulb Globe Temperature approximation formula:
> $$\text{Vapor Pressure} = \left(\frac{\text{Humidity}}{100}\right) \times 6.105 \times \exp\left(\frac{17.27 \times T}{T + 237.7}\right)$$
> $$\text{WBGT} = 0.567 \times T + 0.393 \times \text{Vapor Pressure} + 3.94$$
> exhibits non-linear mathematical instability at extreme high humidity (>90%) and high ambient temperatures (>40°C), producing unphysically high temperature outputs.
>
> To ensure medical reliability and prevent inflated heat-risk warnings, all calculated WBGT values are strictly **clamped at 34.5°C** across both backend and frontend modules:
> ```python
> # Clamp WBGT at 34.5°C due to documented limitation of simplified formula at extreme humidity
> block_wbgt = min(34.5, calc_wbgt)
> ```

---

## 4. Running Backend Server & Unit Tests

### How to Run FastAPI Backend Server
```bash
python -m uvicorn backend.main:app --reload --port 8000
```

### How to Run Pytest Unit Test Suite
```bash
python -m pytest backend/test_recommendations.py
```
*(All 6 unit tests pass verified)*
