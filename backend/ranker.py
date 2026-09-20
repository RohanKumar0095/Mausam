"""
MAUSAM Widget Relevance Ranker Service

Ports GradientBoostingClassifier model approach from train_ranker.py.
Includes rule-based persona default fallback for cold-start users with no engagement history.
"""

import numpy as np
from typing import Dict, Any, List, Tuple
from sklearn.ensemble import GradientBoostingClassifier

# All Widget IDs supported in MAUSAM app
ALL_WIDGETS = [
    "wbgt_tracker",
    "uv_forecast",
    "aqi_health",
    "rain_radar",
    "soil_moisture",
    "crop_disease",
    "transit_corridor",
    "event_planner",
    "parent_routine",
    "travel_weather",
    "hydration_guide",
]

# Rule-Based Fallback Persona Default Rankings
PERSONA_DEFAULT_RANKINGS = {
    "sportsperson": ["wbgt_tracker", "hydration_guide", "uv_forecast", "rain_radar", "aqi_health", "transit_corridor"],
    "fitness": ["uv_forecast", "hydration_guide", "aqi_health", "wbgt_tracker", "rain_radar", "transit_corridor"],
    "agriculture": ["soil_moisture", "crop_disease", "rain_radar", "uv_forecast", "aqi_health", "wbgt_tracker"],
    "commuter": ["transit_corridor", "rain_radar", "aqi_health", "uv_forecast", "wbgt_tracker", "event_planner"],
    "parent": ["parent_routine", "aqi_health", "rain_radar", "uv_forecast", "transit_corridor", "wbgt_tracker"],
    "event_planner": ["event_planner", "rain_radar", "uv_forecast", "aqi_health", "wbgt_tracker", "transit_corridor"],
    "traveler": ["travel_weather", "rain_radar", "uv_forecast", "aqi_health", "transit_corridor", "wbgt_tracker"],
    "health_conscious": ["aqi_health", "uv_forecast", "hydration_guide", "wbgt_tracker", "rain_radar", "transit_corridor"],
    "daily_life": ["aqi_health", "uv_forecast", "rain_radar", "wbgt_tracker", "transit_corridor", "hydration_guide"],
}

WIDGET_REASON_MAP = {
    "wbgt_tracker": "Prioritized based on active thermal stress (WBGT) relevance for your persona",
    "uv_forecast": "High UV index sun protection advisory for outdoor exposure",
    "aqi_health": "Air quality index monitoring prioritized for respiratory health",
    "rain_radar": "Live Doppler rain probability forecast for scheduled outdoor windows",
    "soil_moisture": "Agronomic soil moisture & evapotranspiration index for irrigation check",
    "crop_disease": "Humidity & temperature pathogen risk indicator for field crops",
    "transit_corridor": "Road visibility and traffic grip index for morning/evening commute",
    "event_planner": "Outdoor gathering weather suitability & wind exposure index",
    "parent_routine": "Child comfort & clothing advisory for school pickup window",
    "travel_weather": "Regional travel forecast and corridor weather alerts",
    "hydration_guide": "Electrolyte & fluid loss estimation based on thermal stress",
}


class WidgetRelevanceRanker:
    """
    ML Ranker + Rule-Based Fallback Engine for MAUSAM Homepage Grid.
    """

    def __init__(self):
        self._model = None
        self._initialize_synthetic_model()

    def _initialize_synthetic_model(self):
        """
        Fits a lightweight GradientBoostingClassifier on synthetic training samples
        to simulate model predictions.
        """
        np.random.seed(42)
        # Synthetic feature vector: [persona_idx, temp, humidity, rain_prob, engagement_count]
        X_train = np.random.rand(200, 5) * 10
        y_train = (X_train[:, 0] + X_train[:, 4] > 8).astype(int)

        self._model = GradientBoostingClassifier(n_estimators=20, random_state=42)
        self._model.fit(X_train, y_train)

    def rank_widgets(
        self,
        user_id: str,
        persona: str,
        weather: Dict[str, Any],
        prior_engagement: Dict[str, int] = None,
        time_of_day: str = "morning"
    ) -> Tuple[List[Dict[str, Any]], bool]:
        """
        Ranks homepage widgets for user.
        If prior_engagement is empty or 0 total clicks, triggers rule-based fallback.
        Never returns an empty ranking.
        """
        persona_key = (persona or "daily_life").lower()
        prior_engagement = prior_engagement or {}
        total_clicks = sum(prior_engagement.values())

        # Check for Cold-Start / Empty engagement history
        is_fallback = total_clicks == 0

        if is_fallback:
            default_list = PERSONA_DEFAULT_RANKINGS.get(persona_key, PERSONA_DEFAULT_RANKINGS["daily_life"])
            ranked = []
            score = 0.95
            for widget_id in default_list:
                reason = WIDGET_REASON_MAP.get(widget_id, f"Persona default priority for {persona_key}")
                ranked.append({
                    "widget_id": widget_id,
                    "score": round(score, 3),
                    "reason": reason
                })
                score -= 0.07

            # Add remaining widgets at lower scores
            for widget_id in ALL_WIDGETS:
                if widget_id not in default_list:
                    ranked.append({
                        "widget_id": widget_id,
                        "score": round(max(0.1, score), 3),
                        "reason": f"Secondary widget option"
                    })
                    score -= 0.05

            return ranked, True

        # ML-Based Ranking for users with engagement history
        temp = weather.get("temp_c", 28.0) or 28.0
        humidity = weather.get("humidity_pct", 60.0) or 60.0
        rain = weather.get("rain_probability", 0.2) or 0.2

        ranked = []
        for widget_id in ALL_WIDGETS:
            clicks = prior_engagement.get(widget_id, 0)

            # Feature vector: [persona_hash % 10, temp/5, humidity/10, rain*10, clicks]
            feat = np.array([[
                hash(persona_key) % 10,
                temp / 5.0,
                humidity / 10.0,
                rain * 10.0,
                float(clicks)
            ]])

            if self._model is not None:
                prob = float(self._model.predict_proba(feat)[0][1])
            else:
                prob = 0.5

            # Combine ML probability with engagement score boost
            final_score = round(min(0.99, max(0.05, prob * 0.4 + (clicks * 0.12) + 0.3)), 3)

            # Give top persona widgets a baseline boost
            default_list = PERSONA_DEFAULT_RANKINGS.get(persona_key, PERSONA_DEFAULT_RANKINGS["daily_life"])
            if widget_id in default_list[:3]:
                final_score = round(min(0.99, final_score + 0.15), 3)

            reason = f"Personalized ML relevance (clicks: {clicks}, score: {final_score})"
            ranked.append({
                "widget_id": widget_id,
                "score": final_score,
                "reason": reason
            })

        # Sort descending by score
        ranked.sort(key=lambda x: x["score"], reverse=True)
        return ranked, False


ranker_service = WidgetRelevanceRanker()
