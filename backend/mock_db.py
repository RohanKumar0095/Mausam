"""
MAUSAM In-Memory Synthetic Data Store for Recommendation Backend
"""

# Sample Users Database
MOCK_USERS = {
    "usr_demo": {
        "user_id": "usr_demo",
        "name": "Alex Smith",
        "primary_persona": "sportsperson",
        "secondary_personas": ["fitness", "commuter"],
        "home_location_id": "loc_ranchi",
        "is_coach": True
    },
    "usr_farmer": {
        "user_id": "usr_farmer",
        "name": "Ramesh Kumar",
        "primary_persona": "agriculture",
        "secondary_personas": ["daily_life"],
        "home_location_id": "loc_gaya_rural",
        "is_coach": False
    },
    "usr_parent": {
        "user_id": "usr_parent",
        "name": "Priya Sharma",
        "primary_persona": "parent",
        "secondary_personas": ["commuter"],
        "home_location_id": "loc_patna",
        "is_coach": False
    }
}

# Sample Recurring Activities per User
MOCK_RECURRING_ACTIVITIES = {
    "usr_demo": [
        {
            "activity_id": "act_001",
            "activity_type": "morning_run",
            "persona": "fitness",
            "preferred_block": "morning",
            "flexible": True,
            "time_window": "06:00 – 09:00"
        },
        {
            "activity_id": "act_002",
            "activity_type": "evening_practice",
            "persona": "sportsperson",
            "preferred_block": "evening",
            "flexible": True,
            "time_window": "17:00 – 19:30"
        }
    ],
    "usr_farmer": [
        {
            "activity_id": "act_003",
            "activity_type": "irrigation_check",
            "persona": "agriculture",
            "preferred_block": "morning",
            "flexible": True,
            "time_window": "06:00 – 09:00"
        }
    ],
    "usr_parent": [
        {
            "activity_id": "act_004",
            "activity_type": "school_pickup",
            "persona": "parent",
            "preferred_block": "afternoon",
            "flexible": False,
            "time_window": "12:00 – 15:00"
        },
        {
            "activity_id": "act_005",
            "activity_type": "office_commute",
            "persona": "commuter",
            "preferred_block": "morning",
            "flexible": False,
            "time_window": "06:00 – 09:00"
        }
    ]
}

# Squad / Team Athlete Profiles for Coach View
MOCK_TEAM_ATHLETES = [
    {
        "athlete_id": "ath_01",
        "name": "Aarav Sharma",
        "age_group": "junior",          # -1.5°C threshold shift
        "experience_level": "beginner",  # -1.0°C threshold shift
        "risk_tolerance": "conservative",# -1.0°C threshold shift => Total shift: -3.5°C
        "sport": "running",
        "preferred_block": "evening"
    },
    {
        "athlete_id": "ath_02",
        "name": "Rohan Verma",
        "age_group": "adult",           # 0.0°C shift
        "experience_level": "elite",     # +1.0°C shift
        "risk_tolerance": "aggressive",  # +0.5°C shift => Total shift: +1.5°C
        "sport": "running",
        "preferred_block": "evening"
    },
    {
        "athlete_id": "ath_03",
        "name": "Vikram Singh",
        "age_group": "senior",          # -1.0°C shift
        "experience_level": "intermediate", # 0.0°C shift
        "risk_tolerance": "balanced",   # 0.0°C shift => Total shift: -1.0°C
        "sport": "tennis",
        "preferred_block": "evening"
    },
    {
        "athlete_id": "ath_04",
        "name": "Kavya Patel",
        "age_group": "junior",          # -1.5°C shift
        "experience_level": "intermediate", # 0.0°C shift
        "risk_tolerance": "balanced",   # 0.0°C shift => Total shift: -1.5°C
        "sport": "cycling",
        "preferred_block": "evening"
    }
]

# Widget Engagement Counts per User (Synthetic click history)
MOCK_ENGAGEMENT_LOGS = {
    "usr_demo": {
        "wbgt_tracker": 12,
        "hydration_guide": 8,
        "rain_radar": 5
    },
    "usr_farmer": {
        "soil_moisture": 15,
        "crop_disease": 11,
        "rain_radar": 7
    }
}
