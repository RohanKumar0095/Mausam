"""
MAUSAM Recommendation Engine Data Models (Pydantic)
"""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class WeatherDataInput(BaseModel):
    temp_c: Optional[float] = Field(None, description="Temperature in Celsius")
    humidity_pct: Optional[float] = Field(None, description="Relative Humidity percentage")
    wind_speed_kmh: Optional[float] = Field(None, description="Wind speed in km/h")
    uv_index: Optional[float] = Field(None, description="UV Index")
    aqi: Optional[float] = Field(None, description="Air Quality Index")
    rain_probability: Optional[float] = Field(None, description="Rain probability (0.0 to 1.0 or 0-100%)")
    wbgt_c: Optional[float] = Field(None, description="Wet-Bulb Globe Temperature in Celsius")
    visibility_km: Optional[float] = Field(None, description="Visibility in km")
    condition: Optional[str] = Field(None, description="Weather condition description")


class WidgetRelevanceRequest(BaseModel):
    user_id: Optional[str] = "usr_demo"
    persona: Optional[str] = "daily_life"
    location: Optional[str] = "Default Area"
    time_of_day: Optional[str] = "morning"
    weather: Optional[WeatherDataInput] = None
    prior_engagement: Optional[Dict[str, int]] = Field(default_factory=dict)


class RankedWidget(BaseModel):
    widget_id: str
    score: float
    reason: str


class WidgetRelevanceResponse(BaseModel):
    user_id: str
    persona: str
    is_fallback: bool = False
    ranked_widgets: List[RankedWidget]


class PrimaryReason(BaseModel):
    factor: str
    observed_value: str
    assessment: str


class AnalyzedFactor(BaseModel):
    name: str
    value: str
    assessment: str
    impact: str  # positive, negative, neutral
    explanation: str


class AlternativeWindow(BaseModel):
    available: bool = False
    start: Optional[str] = None
    end: Optional[str] = None
    block_name: Optional[str] = None
    reason: Optional[str] = None


class SportspersonAssessment(BaseModel):
    estimated_wbgt: Optional[float] = None
    wbgt_clamped: Optional[float] = None
    personalized_limit: Optional[float] = None
    zone: str = "Low Risk"
    dew_risk: bool = False
    wind_flag: bool = False
    experience_level: str = "intermediate"
    risk_tolerance: str = "balanced"
    age_group: str = "adult"
    shift_breakdown: Dict[str, float] = Field(default_factory=dict)


class IntelligenceSignal(BaseModel):
    signal_id: str
    widget_type: str
    category: str
    severity: str  # critical, high, moderate, low, none
    impact: str    # negative, neutral, positive
    value: Any
    unit: Optional[str] = None
    decision_weight: float = 0.5
    affects_activity_id: Optional[str] = None
    affects_activity: Optional[str] = None
    location: Optional[str] = None
    time_window: Optional[str] = None
    occurrence_date: Optional[str] = None
    occurrence_status: Optional[str] = None
    display_label: Optional[str] = None
    threshold: Optional[float] = None
    threshold_exceeded: bool = False
    recommendation_constraints: List[str] = Field(default_factory=list)
    explanation: str


class AnalyzedContext(BaseModel):
    date: str
    time_window: str
    location: str
    data_type: str = "hourly_forecast"  # hourly_forecast, active_live, daily_forecast_diurnal


class WeatherSnapshot(BaseModel):
    temp_c: float
    humidity_pct: float
    wind_speed_kmh: float
    rain_probability: float
    rain_probability_frac: float = 0.15
    uv_index: float = 4.0
    aqi: float = 45.0
    visibility_km: float = 8.5
    wbgt_c: float = 27.0


class DailyActivityItem(BaseModel):
    activity_id: str
    activity_label: str
    activity_type: str
    persona: str
    preferred_block: str
    location: str
    time_window: str
    occurrence_date: Optional[str] = None
    occurrence_status: Optional[str] = "upcoming"
    display_label: Optional[str] = "Today"
    is_today: bool = True
    is_tomorrow: bool = False
    is_active: bool = False
    flexible: bool = True
    status: str  # GO, MODIFY, RESCHEDULE, INSUFFICIENT DATA
    summary: str
    primary_reason: Optional[PrimaryReason] = None
    supporting_signals: List[str] = Field(default_factory=list)
    analyzed_factors: List[AnalyzedFactor] = Field(default_factory=list)
    analyzed_context: Optional[AnalyzedContext] = None
    weather_snapshot: Optional[WeatherSnapshot] = None
    what_this_means: str
    recommended_action: str
    alternative_window: Optional[AlternativeWindow] = None
    sportsperson_assessment: Optional[SportspersonAssessment] = None
    conditions: Optional[Dict[str, Any]] = None


class PrimaryDecisionInsight(BaseModel):
    status: str
    headline: str
    recommendation: str
    primary_concern: str
    severity_level: str
    target_activity: Optional[str] = None
    target_occurrence_label: Optional[str] = None
    primary_signal: Optional[str] = None
    supporting_signals: List[str] = Field(default_factory=list)


class DailyPlanRequest(BaseModel):
    user_id: Optional[str] = "usr_demo"
    date: Optional[str] = "2026-09-04"
    selected_personas: List[str] = Field(default_factory=lambda: ["daily_life"])
    routine_activities: List[Dict[str, Any]] = Field(default_factory=list)
    athlete_profile: Optional[Dict[str, Any]] = None
    weather_data: Optional[WeatherDataInput] = None


class DailyPlanResponse(BaseModel):
    user_id: str
    date: str
    overall_risk: Optional[str] = "LOW"
    primary_concern: Optional[str] = "none"
    location_id: Optional[str] = "loc_home"
    plan_title: Optional[str] = "TODAY'S ACTIVITY PLAN"
    plan_subtitle: Optional[str] = "Weather suitability for your upcoming schedule"
    total_activities: int
    signals: List[IntelligenceSignal] = Field(default_factory=list)
    activities: List[DailyActivityItem]
    primary_decision_insight: Optional[PrimaryDecisionInsight] = None


