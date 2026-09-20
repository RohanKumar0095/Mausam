"""
MAUSAM Recommendation Engine REST API (FastAPI Service)

Exposes endpoints for Widget Relevance Ranking and Daily Activity Recommendation Engine.
Analyzes user's actual Daily Weather Routine activities.
"""

from typing import Optional, List, Dict, Any
from fastapi import FastAPI, Query, Body
from fastapi.middleware.cors import CORSMiddleware

from backend.models import (
    WidgetRelevanceResponse,
    DailyPlanResponse,
    DailyPlanRequest,
    DailyActivityItem,
    SportspersonRecommendationResponse
)
from backend.ranker import ranker_service
from backend.weather_intelligence_engine import evaluate_shared_weather_intelligence

app = FastAPI(
    title="MAUSAM Recommendation Engine API",
    description="Backend microservice for widget ranking and daily activity recommendation engine.",
    version="2.0.0"
)

# Enable CORS for Vite frontend server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health_check():
    return {"status": "ok", "service": "MAUSAM Recommendation Engine"}


@app.get("/api/recommendations/widgets", response_model=WidgetRelevanceResponse)
def get_widget_recommendations(
    user_id: Optional[str] = "usr_demo",
    persona: Optional[str] = "sportsperson",
    location: Optional[str] = "Gaya",
    time_of_day: Optional[str] = "morning",
    temp_c: Optional[float] = Query(28.5),
    humidity_pct: Optional[float] = Query(65.0),
    wind_speed_kmh: Optional[float] = Query(10.0),
    uv_index: Optional[float] = Query(5.0),
    aqi: Optional[float] = Query(45.0),
    rain_probability: Optional[float] = Query(0.15),
    wbgt_c: Optional[float] = Query(27.0)
):
    """
    Ranks widget grid for homepage based on user persona, live weather, and engagement history.
    Includes rule-based fallback for cold-start users with zero engagement history.
    """
    weather_dict = {
        "temp_c": temp_c,
        "humidity_pct": humidity_pct,
        "wind_speed_kmh": wind_speed_kmh,
        "uv_index": uv_index,
        "aqi": aqi,
        "rain_probability": rain_probability,
        "wbgt_c": wbgt_c
    }

    ranked_list, is_fallback = ranker_service.rank_widgets(
        user_id=user_id,
        persona=persona,
        weather=weather_dict,
        prior_engagement={},
        time_of_day=time_of_day
    )

    return WidgetRelevanceResponse(
        user_id=user_id,
        persona=persona,
        is_fallback=is_fallback,
        ranked_widgets=ranked_list
    )


@app.post("/api/recommendations/daily-plan", response_model=DailyPlanResponse)
def analyze_daily_plan(payload: DailyPlanRequest = Body(...)):
    """
    Analyzes the user's actual Daily Weather Routine activities via the Shared Weather Intelligence Engine.
    Outputs structured recommendations alongside unified Primary Decision Intelligence.
    """
    context = payload.dict()
    if payload.weather_data:
        context["weather_data"] = payload.weather_data.dict()

    res = evaluate_shared_weather_intelligence(context)
    return res

