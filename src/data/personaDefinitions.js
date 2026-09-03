export const PERSONAS = [
  {
    id: 'daily_life',
    label: 'Daily Life',
    color: '#1F5C8B',
    bg: '#EAF3FA',
    icon: 'Sun',
    description: 'Everyday weather, temperature trends, rain probability, AQI, and local warnings',
    keyMetrics: ['Current Conditions', 'Today Outlook', 'Rain Probability', 'Air Quality', 'Local Alerts'],
    priorityWeights: {
      current_conditions: 40,
      today_forecast: 35,
      rain_probability: 30,
      aqi_health: 25,
      uv_heat_index: 20,
    }
  },
  {
    id: 'sportsperson',
    label: 'Sportsperson',
    color: '#C84B20',
    bg: '#FAF0EB',
    icon: 'Trophy',
    description: 'WBGT training safety, dew factor, wind, training window forecast & pitch condition',
    keyMetrics: ['WBGT Training Safety', 'Dew Factor', 'Wind Speed/Direction', 'Training Window', 'Ground Condition'],
    priorityWeights: {
      wbgt_safety: 45,
      dew_factor: 35,
      training_window: 35,
      ground_condition: 30,
      wind_gauge: 25,
      rain_probability: 20,
    }
  },
  {
    id: 'fitness',
    label: 'Fitness',
    color: '#D85A30',
    bg: '#FAF0EB',
    icon: 'Activity',
    description: 'Running, cycling, workouts, best workout hours, AQI for exercise & comfort index',
    keyMetrics: ['Best Workout Hours', 'AQI for Exercise', 'Heat / Comfort Index', 'UV Index', 'Wind Comfort'],
    priorityWeights: {
      running_window: 40,
      aqi_health: 30,
      temperature_feels: 25,
      uv_heat_index: 25,
      wind_gauge: 15,
      rain_probability: 15,
    }
  },
  {
    id: 'agriculture',
    label: 'Agriculture',
    color: '#639922',
    bg: '#F0F6E8',
    icon: 'Sprout',
    description: 'Stage-aware crop checklist, frost/heat alert, multi-day rain, irrigation & disease risk',
    keyMetrics: ['Crop Action Checklist', 'Frost / Heat Alert', 'Multi-Day Rainfall', 'Irrigation Nudge', 'Disease Risk Flag'],
    priorityWeights: {
      agri_action_checklist: 45,
      multi_day_rainfall: 35,
      irrigation_nudge: 30,
      frost_heat_alert: 25,
      pest_disease_risk: 25,
      wind_gauge: 15,
    }
  },
  {
    id: 'health',
    label: 'Health',
    color: '#1D9E75',
    bg: '#E8F6F1',
    icon: 'HeartPulse',
    description: 'Air quality (AQI), allergens, respiratory risks, extreme temperature alerts',
    keyMetrics: ['Air Quality Index', 'Respiratory Risk', 'Thermal Comfort', 'UV Protection'],
    priorityWeights: {
      aqi_health: 45,
      uv_heat_index: 30,
      temperature_feels: 25,
      visibility_fog: 15,
    }
  },
  {
    id: 'commute',
    label: 'Commute',
    color: '#BA7517',
    bg: '#F9F3EA',
    icon: 'Car',
    description: 'Road visibility, rain timing on transit routes, waterlogging & storm safety',
    keyMetrics: ['Commute Weather', 'Visibility & Fog', 'Storm Probability', 'Road Status'],
    priorityWeights: {
      commute_weather: 45,
      visibility_fog: 30,
      rain_probability: 25,
      wind_gauge: 15,
    }
  },
  {
    id: 'family',
    label: 'Family',
    color: '#D4537E',
    bg: '#FAEDF2',
    icon: 'Users',
    description: 'Kids school transit, elderly comfort, weekend outings & household safety',
    keyMetrics: ['School Transit Safety', 'Elderly Heat Risk', 'Evening Rain', 'Outdoor Play'],
    priorityWeights: {
      school_transit: 40,
      aqi_health: 30,
      rain_probability: 30,
      uv_heat_index: 20,
    }
  },
  {
    id: 'events',
    label: 'Events',
    color: '#7F77DD',
    bg: '#F1F0FB',
    icon: 'CalendarDays',
    description: 'Outdoor gatherings, weddings, concerts, sports tournaments & backups',
    keyMetrics: ['Event Feasibility', 'Precipitation Probability', 'Evening Wind', 'Humidity'],
    priorityWeights: {
      outdoor_event_suitability: 45,
      rain_probability: 35,
      wind_gauge: 25,
      temperature_feels: 15,
    }
  },
  {
    id: 'travel',
    label: 'Beach & Travel',
    color: '#0F6E56',
    bg: '#E6F4F0',
    icon: 'Compass',
    description: 'Destination forecast, coastal conditions, flight/rail visibility, tide levels',
    keyMetrics: ['Destination Weather', 'Coastal High Tide', 'Travel Transit Safety', 'Severe Alert'],
    priorityWeights: {
      travel_conditions: 45,
      coastal_tide: 35,
      rain_probability: 25,
      visibility_fog: 20,
    }
  }
];

export const INACTIVE_PERSONA_STYLE = {
  bg: '#F1EFE8',
  text: '#5F5E5A',
  border: 'rgba(95, 94, 90, 0.25)',
};
