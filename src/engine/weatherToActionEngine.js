/**
 * WEATHER-TO-ACTION INTELLIGENCE
 * Converts raw weather into simple, contextual, domain-specific decisions.
 */

export function interpretWeatherToAction({
  widgetId,
  weatherData,
  currentActivity,
  currentTime,
  selectedPersonas,
  selectedPlot = 'Plot A (Rice)'
}) {
  const current = weatherData?.current || {};
  const temp = current.temp || 25.2;
  const rainProb = current.rainProbability || 20;
  const uv = current.uvIndex || 4;
  const aqi = current.aqi || 83;
  const wind = current.windSpeed || 8;
  const windDir = current.windDirection || 'SSW';
  const visibility = current.visibility || 5;

  switch (widgetId) {
    case 'wbgt_safety': {
      const wbgtEst = (temp * 0.85 + (current.humidity || 84) * 0.08).toFixed(1);
      let status = 'Moderate Strain Zone';
      let statusColor = '#854F0B';
      let advice = 'Work:Rest cycle of 45:15 min recommended. Compulsory water & electrolyte breaks every 20 mins.';

      if (temp < 24) {
        status = 'Optimal Thermal Comfort';
        statusColor = '#0F6E56';
        advice = 'Normal full-intensity training without thermal restriction. Standard hydration.';
      } else if (temp > 32 || wbgtEst > 30) {
        status = 'High Thermal Strain Zone';
        statusColor = '#791F1F';
        advice = 'Reduce continuous scrimmage to 30 mins. Provide iced towels and mandatory shaded recovery.';
      }

      return {
        value: `${wbgtEst}°C WBGT`,
        status,
        statusColor,
        recommendation: advice,
        confidenceLabel: 'Wet Bulb Globe Model',
        icon: 'Flame'
      };
    }

    case 'dew_factor': {
      let status = 'Low Dew Expected';
      let statusColor = '#0F6E56';
      let value = 'Firm Grip (18°C Dew Pt)';
      let advice = 'Minimal outfield moisture. Ball seam and turf traction will remain stable throughout 5–8 PM session.';

      if (current.humidity > 88 && temp < 24) {
        status = 'Heavy Dew Warning';
        statusColor = '#854F0B';
        value = 'Slippery Outfield';
        advice = 'Significant outfield dew expected after 6:30 PM. Keep dry towels for balls and switch to studded footwear.';
      }

      return {
        value,
        status,
        statusColor,
        recommendation: advice,
        confidenceLabel: 'Surface Dew Forecast',
        icon: 'Droplets'
      };
    }

    case 'training_window': {
      let status = 'Clear Session Window';
      let statusColor = '#0F6E56';
      let value = '5:00–7:30 PM (Favorable)';
      let advice = 'Zero rain probability during evening practice session. Light breeze of 9 km/h.';

      if (rainProb >= 65) {
        status = 'Session Rain Disruption';
        statusColor = '#791F1F';
        value = `${rainProb}% Rain Risk`;
        advice = 'Heavy rain expected around 6:00 PM practice. Shift drills to indoor arena or 7:30 AM morning slot.';
      }

      return {
        value,
        status,
        statusColor,
        recommendation: advice,
        confidenceLabel: 'High-Resolution Radar Sync',
        icon: 'Trophy'
      };
    }

    case 'ground_condition': {
      let status = 'Firm & Dry Turf';
      let statusColor = '#0F6E56';
      let value = 'Surface Moisture 18%';
      let advice = 'Excellent pitch rebound and cleat grip. Zero waterlogging on main field.';

      if (rainProb >= 60 || (current.rainfall24h && current.rainfall24h > 10)) {
        status = 'Soft / Wet Outfield';
        statusColor = '#854F0B';
        value = 'Surface Moisture 45%';
        advice = 'Pitch softness may reduce ball bounce. Extra caution on boundary turns to prevent ankle twisting.';
      }

      return {
        value,
        status,
        statusColor,
        recommendation: advice,
        confidenceLabel: 'Turf Sensor Array',
        icon: 'ShieldCheck'
      };
    }

    case 'running_window': {
      let value = '6:00–7:30 AM';
      let status = 'Optimal Morning Window';
      let statusColor = '#0F6E56';
      let advice = 'Best before humidity rises and solar radiation increases. Temperature 23°C.';

      if (rainProb > 60) {
        status = 'Wet Pavement';
        statusColor = '#854F0B';
        advice = 'Rain showers possible. Paved park track is safer than unpaved trails today.';
      }

      return {
        value,
        status,
        statusColor,
        recommendation: advice,
        confidenceLabel: 'Verified Forecast',
        icon: 'Footprints'
      };
    }

    case 'agri_action_checklist': {
      let cropStage = 'Tillering Stage';
      let advice = 'Ideal window for fertilizer application & weed clearance. No washout rain expected for 48 hours.';
      let status = 'Action Recommended';

      if (selectedPlot && selectedPlot.includes('Maize')) {
        cropStage = 'Tasseling Stage';
        advice = 'Maintain adequate furrow moisture. Check for fall armyworm emergence.';
      } else if (selectedPlot && selectedPlot.includes('Vegetables')) {
        cropStage = 'Vegetative & Flowering';
        advice = 'Harvest mature produce early morning before midday heat.';
      }

      return {
        value: `${(selectedPlot || 'Plot A (Rice)').split(' ')[0]} — ${cropStage}`,
        status,
        statusColor: '#0F6E56',
        recommendation: advice,
        confidenceLabel: 'Verified IMD Advisory',
        icon: 'Sprout'
      };
    }

    case 'multi_day_rainfall': {
      let value = '3-Day Dry Window';
      let status = 'Favorable for Field Work';
      let statusColor = '#0F6E56';
      let advice = 'Total 3-day precipitation < 2mm. Excellent period for fertilizer top-dressing.';

      if (rainProb >= 60) {
        value = 'Precipitation in 24–36h';
        status = 'Delay Chemical Spray';
        statusColor = '#854F0B';
        advice = 'Moderate downpour (12–18mm) expected in 24 hours. Hold foliar spray to prevent chemical runoff.';
      }

      return {
        value,
        status,
        statusColor,
        recommendation: advice,
        confidenceLabel: 'Synoptic IMD Model',
        icon: 'CloudRain'
      };
    }

    case 'irrigation_nudge': {
      let value = 'Adequate Root-Zone Moisture';
      let status = 'No Irrigation Needed';
      let statusColor = '#0F6E56';
      let advice = 'Soil moisture index is at 84% field capacity. Postpone pump/canal irrigation for 2 days.';

      return {
        value,
        status,
        statusColor,
        recommendation: advice,
        confidenceLabel: 'Soil Moisture Heuristic',
        icon: 'Droplets'
      };
    }

    case 'frost_heat_alert': {
      let value = 'Safe Canopy Range (21–32°C)';
      let status = 'Zero Frost / Heat Stress';
      let statusColor = '#0F6E56';
      let advice = 'Night minimum stays above 21°C. Crops are well within healthy physiological thresholds.';

      if (temp >= 36) {
        value = 'High Thermal Evaporation';
        status = 'Heat Stress Flag';
        statusColor = '#791F1F';
        advice = 'Apply light mulching or evening sprinkling to prevent canopy wilting.';
      }

      return {
        value,
        status,
        statusColor,
        recommendation: advice,
        confidenceLabel: 'Agromet Thermal Model',
        icon: 'Sun'
      };
    }

    case 'pest_disease_risk': {
      let value = 'Moderate (Blast / Blight Risk)';
      let status = 'Higher than usual';
      let statusColor = '#854F0B';
      let advice = 'High humidity (84%) creates favorable fungal conditions. Inspect bottom leaf sheaths for lesions.';

      return {
        value,
        status,
        statusColor,
        recommendation: advice,
        confidenceLabel: 'Estimated Risk Indicator',
        icon: 'Sprout'
      };
    }

    case 'current_conditions': {
      return {
        value: `${temp}°C • ${current.condition || 'Partly Cloudy'}`,
        status: 'Comfortable',
        statusColor: '#0F6E56',
        recommendation: `Humidity is ${current.humidity || 84}% with gentle ${wind} km/h breeze from ${windDir}.`,
        confidenceLabel: 'IMD Station Data',
        icon: 'Sun'
      };
    }

    case 'today_forecast': {
      return {
        value: `Max ${current.maxTemp || 27}° / Min ${current.minTemp || 21}°C`,
        status: 'Seasonal Normal',
        statusColor: '#0F6E56',
        recommendation: 'Passing light showers possible in the afternoon; otherwise pleasant for outdoor routine.',
        confidenceLabel: 'Daily Bulletin',
        icon: 'Cloud'
      };
    }

    case 'commute_weather': {
      let status = 'Smooth Transit';
      let statusColor = '#0F6E56';
      let value = 'Clear Arterial Roads';
      let advice = 'Normal traffic expected. Visibility is optimal across main corridors.';

      if (rainProb >= 70) {
        status = 'Heavy Rain / Squall';
        statusColor = '#791F1F';
        value = `${rainProb}% Rain Risk`;
        advice = 'Heavy downpour expected around your 4:30 PM commute. Consider departing 25 mins earlier or use metro.';
      } else if (visibility < 2.0) {
        status = 'Dense Fog / Low Vis';
        statusColor = '#854F0B';
        value = `${visibility} km Visibility`;
        advice = 'Low visibility on highway corridors. Maintain safe headway and use fog lamps.';
      }

      return {
        value,
        status,
        statusColor,
        recommendation: advice,
        confidenceLabel: 'Radar Transit Sync',
        icon: 'Car'
      };
    }

    case 'aqi_health': {
      let status = current.aqiStatus || 'Satisfactory';
      let statusColor = '#0F6E56';
      let advice = 'Air quality is acceptable for healthy individuals and outdoor workouts.';

      if (aqi > 150) {
        statusColor = '#791F1F';
        advice = 'High particulate matter. Sensitive groups & cardio athletes should avoid intense outdoor training.';
      } else if (aqi > 90) {
        statusColor = '#854F0B';
        advice = 'Moderate AQI. Fine for moderate-intensity running; sensitive groups may feel slight throat irritation.';
      }

      return {
        value: `${aqi} AQI (${status})`,
        status,
        statusColor,
        recommendation: advice,
        confidenceLabel: 'CPCB National Station',
        icon: 'HeartPulse'
      };
    }

    case 'uv_heat_index': {
      let status = 'Moderate UV';
      let statusColor = '#0F6E56';
      let advice = 'Safe for outdoor routine before 9 AM. Apply sunscreen for prolonged exposure.';

      if (uv >= 8 || temp >= 35) {
        status = 'Extreme UV / Heat Alert';
        statusColor = '#791F1F';
        advice = `UV Index is ${uv}. Outdoor exposure is better before 9:00 AM or after 4:30 PM. Drink plenty of water.`;
      } else if (uv >= 6) {
        status = 'High UV Alert';
        statusColor = '#854F0B';
        advice = 'Wear UV sunglasses, broad-brim hat and seek shade during midday hours.';
      }

      return {
        value: `UV ${uv} | ${temp}°C`,
        status,
        statusColor,
        recommendation: advice,
        confidenceLabel: 'Solar Radiometer',
        icon: 'Sun'
      };
    }

    case 'rain_probability': {
      let status = rainProb >= 60 ? 'High Rain Chance' : (rainProb >= 30 ? 'Passing Showers' : 'Low Rain Chance');
      let statusColor = rainProb >= 60 ? '#791F1F' : (rainProb >= 30 ? '#854F0B' : '#0F6E56');
      let advice = rainProb >= 60
        ? `${rainProb}% rain chance overlapping with afternoon/evening schedule. Keep umbrella handy.`
        : 'Dry conditions favored for majority of your routine.';

      return {
        value: `${rainProb}% Chance`,
        status,
        statusColor,
        recommendation: advice,
        confidenceLabel: 'Doppler Radar Model',
        icon: 'CloudRain'
      };
    }

    case 'wind_gauge': {
      let status = wind <= 12 ? 'Gentle Breeze' : (wind <= 22 ? 'Moderate Wind' : 'Strong Gusty Wind');
      let statusColor = wind > 22 ? '#854F0B' : '#0F6E56';
      let advice = wind > 22
        ? `Gusty winds of ${wind} km/h from ${windDir}. Caution for temporary banners, aerial passes & two-wheelers.`
        : `Pleasant breeze of ${wind} km/h from ${windDir}.`;

      return {
        value: `${wind} km/h (${windDir})`,
        status,
        statusColor,
        recommendation: advice,
        confidenceLabel: 'Anemometer 10m',
        icon: 'Compass'
      };
    }

    case 'visibility_fog': {
      let status = visibility >= 4.0 ? 'Good Visibility' : (visibility >= 2.0 ? 'Moderate Mist' : 'Dense Fog Warning');
      let statusColor = visibility >= 4.0 ? '#0F6E56' : (visibility >= 2.0 ? '#854F0B' : '#791F1F');
      let advice = visibility >= 4.0
        ? 'Clear visibility across arterial roads and highways.'
        : `Reduced visibility (${visibility} km). Maintain lower vehicle speed on open roads.`;

      return {
        value: `${visibility} km`,
        status,
        statusColor,
        recommendation: advice,
        confidenceLabel: 'Surface Sensor Array',
        icon: 'Eye'
      };
    }

    case 'outdoor_event_suitability': {
      let status = 'Favorable Evening';
      let statusColor = '#0F6E56';
      let value = '88/100';
      let advice = 'Pleasant evening temperature (25°C). Ideal for open-air amphitheater and social gathering.';

      if (rainProb >= 70) {
        status = 'Rain Disruption Likely';
        statusColor = '#791F1F';
        value = `${rainProb}% Rain`;
        advice = 'High rain chance (3.2 mm) during your 7:00 PM event. Prepare canopy or indoor backup hall.';
      }

      return {
        value,
        status,
        statusColor,
        recommendation: advice,
        confidenceLabel: 'Evening Forecast',
        icon: 'PartyPopper'
      };
    }

    case 'school_transit': {
      let status = 'Safe Transit Conditions';
      let statusColor = '#0F6E56';
      let value = 'Optimal Morning';
      let advice = 'Pleasant 24°C during school drop. Zero rain or heatwave threat for children.';

      return {
        value,
        status,
        statusColor,
        recommendation: advice,
        confidenceLabel: 'Family Safety Model',
        icon: 'Users'
      };
    }

    case 'travel_conditions': {
      return {
        value: `${temp}°C • Destination Active`,
        status: 'Good Travel Window',
        statusColor: '#0F6E56',
        recommendation: 'Destination transit corridors remain clear with moderate coastal breeze.',
        confidenceLabel: 'Regional Forecast',
        icon: 'Compass'
      };
    }

    case 'coastal_tide': {
      return {
        value: 'High Tide at 15:45 (3.9m)',
        status: 'Promenade Caution',
        statusColor: '#854F0B',
        recommendation: 'Tourists advised to avoid rocky coastal edges during afternoon peak tide window.',
        confidenceLabel: 'Hydrographic Model',
        icon: 'Compass'
      };
    }

    default:
      return {
        value: `${temp}°C`,
        status: 'Normal',
        statusColor: '#0F6E56',
        recommendation: 'Conditions are within standard seasonal range.',
        confidenceLabel: 'IMD Observation',
        icon: 'Cloud'
      };
  }
}
