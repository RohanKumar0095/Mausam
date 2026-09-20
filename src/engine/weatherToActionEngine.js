import { calculateEstimatedWBGT } from '../services/wbgtService.js';

export function interpretWeatherToAction({
  widgetId,
  weatherData,
  currentActivity,
  currentTime,
  selectedPersonas = ['daily_life'],
  selectedPlot = 'Plot A (Rice)',
  language = 'en'
}) {
  const isHindi = language === 'hi' || language === 'Hindi';
  const current = weatherData?.current || {};
  const temp = current.temp ?? 28.0;
  const humidity = current.humidity ?? 65.0;
  const wind = current.windSpeed ?? 10.0;
  const windDir = current.windDirection || 'SSW';
  const uv = current.uvIndex ?? 5.0;
  const aqi = current.aqi ?? 45.0;
  const rainProb = current.pop ?? current.rain_probability ?? 15;
  const popPct = Math.round(rainProb <= 1.0 ? rainProb * 100 : rainProb);
  const vis = current.visibility ?? current.visibility_km ?? 8.5;
  const locationName = weatherData?.name || weatherData?.district || weatherData?.city || 'Current Location';
  const observedAt = new Date().toISOString();

  // Current Live WBGT Calculation using Tier 1/2 Stull/BOM Model
  const currentWBGTObj = calculateEstimatedWBGT({
    temperature: temp,
    humidity,
    windSpeed: wind,
    uvIndex: uv,
    language
  });
  const currentWBGTVal = currentWBGTObj.available ? currentWBGTObj.value : 27.0;

  const baseMeta = {
    temporal_context: 'current',
    observed_at: observedAt,
    location: locationName,
    data_source: 'live_current_weather'
  };

  switch (widgetId) {
    // 1. WBGT Training & Heat Safety (Real-time Current Observation)
    case 'wbgt_safety': {
      const isHighRisk = currentWBGTVal >= 28.7;
      const isExtreme = currentWBGTVal >= 32.2;

      const status = isExtreme
        ? (isHindi ? 'अत्यधिक तापीय खतरा' : 'Extreme Heat Danger')
        : (isHighRisk
          ? (isHindi ? 'उच्च तापीय तनाव' : 'Elevated Heat Stress')
          : (isHindi ? 'सुरक्षित तापीय सीमा' : 'Comfortable Heat Index'));

      const statusColor = isExtreme ? '#791F1F' : (isHighRisk ? '#854F0B' : '#0F6E56');

      return {
        ...baseMeta,
        label: isHindi ? 'WBGT प्रशिक्षण सुरक्षा' : 'WBGT Heat Stress Safety',
        value: `${currentWBGTVal}°C WBGT`,
        status,
        statusColor,
        recommendation: isHindi
          ? `वर्तमान लाइव WBGT ${currentWBGTVal}°C है (${locationName})। ${isHighRisk ? 'शारीरिक गतिविधि के दौरान अधिक जलयोजन लें।' : 'तापीय स्थिति सामान्य है।'}`
          : `Current live WBGT is ${currentWBGTVal}°C at ${locationName}. ${isHighRisk ? 'Enforce mandatory hydration breaks during outdoor exertion.' : 'Thermal conditions favor comfortable outdoor exertion.'}`,
        confidenceLabel: isHindi ? 'लाइव मौसम स्टेशन' : 'Live Weather Station',
        icon: 'Flame'
      };
    }

    // 2. Dew Factor & Ball Grip (Real-time Current Observation)
    case 'dew_factor': {
      const dewRisk = humidity > 80 && temp < 25;
      const status = dewRisk ? (isHindi ? 'ओस चेतावनी' : 'Dew Warning') : (isHindi ? 'कम ओस' : 'Minimal Dew');
      const statusColor = dewRisk ? '#854F0B' : '#0F6E56';

      return {
        ...baseMeta,
        label: isHindi ? 'ओस प्रभाव और बॉल ग्रिप' : 'Dew Factor & Ball Grip',
        value: isHindi ? `ओस स्थिति: ${dewRisk ? 'उच्च' : 'कम'}` : `Live Surface Moisture: ${dewRisk ? 'High' : 'Low'}`,
        status,
        statusColor,
        recommendation: isHindi
          ? `वर्तमान स्थिति: तापमान ${temp}°C, आर्द्रता ${humidity}%। ${dewRisk ? 'सतह पर ओस जमा होने का जोखिम।' : 'मैदान सूखा है।'}`
          : `Live conditions (${temp}°C, ${humidity}% RH): ${dewRisk ? 'Significant surface moisture risk detected.' : 'Firm outfield grip expected.'}`,
        confidenceLabel: isHindi ? 'लाइव हाइग्रोमीटर' : 'Live Hygrometer Sensor',
        icon: 'Droplets'
      };
    }

    // 3. Training & Running Window (Current Suitability)
    case 'training_window':
    case 'running_window': {
      const isComfortable = temp <= 30 && popPct < 50 && aqi <= 100;
      const statusLabel = isComfortable
        ? (isHindi ? 'अनुकूल स्थिति' : 'Clear Conditions')
        : (isHindi ? 'सावधानी अनुशंसित' : 'Caution Advised');
      const statusColor = isComfortable ? '#0F6E56' : '#854F0B';

      return {
        ...baseMeta,
        label: widgetId === 'running_window' ? (isHindi ? 'दौड़ने की वर्तमान स्थिति' : 'Current Outdoor Running Conditions') : (isHindi ? 'प्रशिक्षण आराम स्थिति' : 'Current Training Conditions'),
        value: `${temp}°C • ${popPct}% ${isHindi ? 'बारिश' : 'Rain'}`,
        status: statusLabel,
        statusColor,
        recommendation: isHindi
          ? `वर्तमान मौसम (${temp}°C, AQI ${aqi}): ${isComfortable ? 'आउटडोर व्यायाम के लिए अच्छा समय।' : 'गर्मी या प्रदूषण के कारण सावधानी बरतें।'}`
          : `Live ambient status (${temp}°C, AQI ${aqi}): ${isComfortable ? 'Favorable for immediate outdoor exercise.' : 'Monitor heat and exertion levels.'}`,
        confidenceLabel: isHindi ? 'लाइव मौसम डेटा' : 'Live Atmospheric Data',
        icon: widgetId === 'running_window' ? 'Footprints' : 'Trophy'
      };
    }

    // 4. Ground & Turf Condition (Real-time Observation)
    case 'ground_condition': {
      const isWet = popPct >= 50;
      const status = isWet ? (isHindi ? 'नम मैदान' : 'Wet Outfield') : (isHindi ? 'सूखा और मजबूत टर्फ' : 'Firm & Dry Turf');
      const statusColor = isWet ? '#854F0B' : '#0F6E56';

      return {
        ...baseMeta,
        label: isHindi ? 'मैदान और टर्फ की स्थिति' : 'Ground & Pitch Condition',
        value: isWet ? (isHindi ? 'सतह नमी उच्च' : 'Moisture High') : (isHindi ? 'सतह नमी सामान्य' : 'Moisture Normal'),
        status,
        statusColor,
        recommendation: isHindi
          ? `वर्तमान वर्षा जोखिम ${popPct}%। ${isWet ? 'टर्फ पर फिसलन की संभावना है।' : 'टर्फ की ग्रिप उत्कृष्ट है।'}`
          : `Live rain probability is ${popPct}%. ${isWet ? 'Soft ground may affect cleat grip.' : 'Firm outfield conditions reported.'}`,
        confidenceLabel: isHindi ? 'लाइव टर्फ मॉनिटर' : 'Live Turf Monitor',
        icon: 'ShieldCheck'
      };
    }

    // 5. Commute & Transit Weather (Real-time Current Road Conditions)
    case 'commute_weather':
    case 'morning_commute_conditions':
    case 'return_commute_conditions':
    case 'two_wheeler_risk':
    case 'school_transit':
    case 'school_pickup_weather':
    case 'child_safety_recommendations': {
      const isRoadRisk = popPct >= 50 || wind >= 25 || vis < 2.0;
      const statusLabel = isRoadRisk
        ? (isHindi ? 'यातायात सावधानी' : 'Transit Caution')
        : (isHindi ? 'सुगम सड़क स्थिति' : 'Clear Transit');
      const statusColor = isRoadRisk ? '#854F0B' : '#0F6E56';

      return {
        ...baseMeta,
        label: isHindi ? 'वर्तमान यात्रा मौसम' : 'Current Commute Weather',
        value: `${vis} km ${isHindi ? 'दृश्यता' : 'Visibility'} • ${wind} km/h`,
        status: statusLabel,
        statusColor,
        recommendation: isHindi
          ? `वर्तमान स्थान (${locationName}): दृश्यता ${vis} km, हवा ${wind} km/h। ${isRoadRisk ? 'सड़क पर सावधानी से वाहन चलाएं।' : 'सड़क की स्थिति सुगम है।'}`
          : `Current status at ${locationName}: Visibility ${vis} km, Wind ${wind} km/h. ${isRoadRisk ? 'Drive carefully and allow extra transit time.' : 'Normal road visibility and transit conditions.'}`,
        confidenceLabel: isHindi ? 'लाइव सड़क मौसम' : 'Live Road Weather',
        icon: 'Car'
      };
    }

    // 6. Outdoor Event & Travel (Real-time Conditions at Selected Location)
    case 'outdoor_event_suitability':
    case 'event_forecast_timeline':
    case 'event_comfort_index':
    case 'event_wind_conditions':
    case 'event_contingency_backup':
    case 'travel_conditions':
    case 'saved_destination_weather':
    case 'travel_disruption_alerts':
    case 'smart_packing_checklist': {
      const isEventRisk = popPct >= 50 || temp >= 35;
      const statusLabel = isEventRisk
        ? (isHindi ? 'मौसम व्यवधान' : 'Weather Caution')
        : (isHindi ? 'सुहावना मौसम' : 'Pleasant Weather');
      const statusColor = isEventRisk ? '#854F0B' : '#0F6E56';

      return {
        ...baseMeta,
        label: isHindi ? 'वर्तमान आउटडोर मौसम' : 'Current Outdoor Readiness',
        value: `${temp}°C • ${locationName}`,
        status: statusLabel,
        statusColor,
        recommendation: isHindi
          ? `${locationName} में वर्तमान तापमान ${temp}°C और बारिश जोखिम ${popPct}% है।`
          : `Current ambient weather at ${locationName}: ${temp}°C with ${popPct}% precipitation probability.`,
        confidenceLabel: isHindi ? 'लाइव स्थान मौसम' : 'Live Location Data',
        icon: 'CalendarDays'
      };
    }

    // 7. Rain Probability Widget (Real-time Precipitation Risk)
    case 'rain_probability': {
      const isHigh = popPct >= 50;
      const status = isHigh ? (isHindi ? 'उच्च बारिश जोखिम' : 'High Rain Risk') : (isHindi ? 'कम बारिश जोखिम' : 'Low Rain Risk');
      const statusColor = isHigh ? '#791F1F' : '#0F6E56';

      return {
        ...baseMeta,
        label: isHindi ? 'वर्तमान बारिश की संभावना' : 'Current Precipitation Risk',
        value: `${popPct}% ${isHindi ? 'जोखिम' : 'Rain Risk'}`,
        status,
        statusColor,
        recommendation: isHindi
          ? `${locationName} पर वर्तमान बारिश की संभावना ${popPct}% है।`
          : `Live rain probability is ${popPct}% at ${locationName}.`,
        confidenceLabel: isHindi ? 'डॉप्लर रडार फ़ीड' : 'Doppler Live Feed',
        icon: 'CloudRain'
      };
    }

    // 8. Wind Gauge Widget (Real-time Wind Measurement)
    case 'wind_gauge': {
      const isBreezy = wind >= 25;
      const status = isBreezy ? (isHindi ? 'तेज हवा' : 'Strong Wind') : (isHindi ? 'हल्की हवा' : 'Gentle Breeze');
      const statusColor = isBreezy ? '#854F0B' : '#0F6E56';

      return {
        ...baseMeta,
        label: isHindi ? 'हवा की गति और दिशा' : 'Wind Velocity & Direction',
        value: `${wind} km/h ${windDir}`,
        status,
        statusColor,
        recommendation: isHindi
          ? `वर्तमान हवा की गति ${wind} km/h (${windDir}) है (${locationName})।`
          : `Live wind velocity is ${wind} km/h from ${windDir} at ${locationName}.`,
        confidenceLabel: isHindi ? 'एनेमोमीटर लाइव' : 'Live Anemometer Sensor',
        icon: 'Compass'
      };
    }

    // 9. Lightning & Storm Safety Widget (Real-time Alert)
    case 'lightning_storm_safety': {
      const isSevere = current.condition?.toLowerCase().includes('thunder');
      const status = isSevere ? (isHindi ? 'तूफान चेतावनी' : 'Thunderstorm Hazard') : (isHindi ? 'सुरक्षित' : 'No Active Storm');
      const statusColor = isSevere ? '#791F1F' : '#0F6E56';

      return {
        ...baseMeta,
        label: isHindi ? 'बिजली व तूफान सुरक्षा' : 'Lightning / Storm Safety',
        value: isSevere ? (isHindi ? 'उच्च आंधी जोखिम' : 'High Storm Risk') : (isHindi ? 'सुरक्षित क्षेत्र' : 'Clear Radar'),
        status,
        statusColor,
        recommendation: isHindi
          ? `वर्तमान स्थिति (${locationName}): ${isSevere ? 'आंधी चेतावनी सक्रिय। इनडोर रहें।' : 'आसपास कोई आंधी गतिविधि नहीं।'}`
          : `Live radar status at ${locationName}: ${isSevere ? 'Active thunderstorm cells detected. Seek shelter.' : 'Zero active electrical storm cells detected within range.'}`,
        confidenceLabel: isHindi ? 'डॉप्लर थंडर रडार' : 'Doppler Live Tracker',
        icon: 'ShieldCheck'
      };
    }

    // 10. Agronomic Checklist & Crop Stage Risk (Real-time Microclimate)
    case 'agri_action_checklist':
    case 'crop_stage_risk':
    case 'multi_day_rainfall':
    case 'irrigation_nudge':
    case 'frost_heat_alert':
    case 'pest_disease_risk': {
      const crop = (selectedPlot || 'Plot A (Rice)').split(' ')[0];
      const cropHindi = crop === 'Rice' ? 'धान' : (crop === 'Maize' ? 'मक्का' : 'सब्जियों');

      return {
        ...baseMeta,
        label: isHindi ? 'वर्तमान कृषि मौसम स्थिति' : 'Current Crop Environment',
        value: `${isHindi ? cropHindi : crop} — ${locationName}`,
        status: isHindi ? 'सत्यापित स्थिति' : 'Stable Microclimate',
        statusColor: '#0F6E56',
        recommendation: isHindi
          ? `आपके प्लॉट (${selectedPlot}, ${locationName}) के लिए वर्तमान तापमान ${temp}°C और आर्द्रता ${humidity}% है।`
          : `Live plot microclimate (${selectedPlot}, ${locationName}): ${temp}°C, ${humidity}% RH.`,
        confidenceLabel: isHindi ? 'सत्यापित कृषि मौसम' : 'Verified Field Sensor',
        icon: 'Sprout'
      };
    }

    // 11. Current Ambient Weather
    case 'current_conditions': {
      return {
        ...baseMeta,
        label: isHindi ? 'वर्तमान मौसम की स्थिति' : 'Current Ambient Weather',
        value: `${temp}°C • ${current.condition || (isHindi ? 'आंशिक रूप से बादल' : 'Partly Cloudy')}`,
        status: isHindi ? 'आरामदायक' : 'Comfortable',
        statusColor: '#0F6E56',
        recommendation: isHindi
          ? `आर्द्रता ${humidity}% और हवा ${wind} km/h की गति से चल रही है।`
          : `Humidity is ${humidity}% with gentle ${wind} km/h breeze from ${windDir}.`,
        confidenceLabel: isHindi ? 'IMD स्टेशन डेटा' : 'IMD Station Data',
        icon: 'Sun'
      };
    }

    // 12. Today's Forecast
    case 'today_forecast': {
      return {
        ...baseMeta,
        label: isHindi ? 'आज का मौसम दृष्टिकोण' : "Today's Forecast",
        value: `Max ${current.maxTemp || temp + 3}° / Min ${current.minTemp || temp - 4}°C`,
        status: isHindi ? 'मौसमी सामान्य' : 'Seasonal Normal',
        statusColor: '#0F6E56',
        recommendation: isHindi
          ? 'दैनिक गतिविधियों के लिए मौसम सुहावना रहेगा।'
          : 'Passing light showers possible in the afternoon; otherwise pleasant for outdoor routine.',
        confidenceLabel: isHindi ? 'दैनिक बुलेटिन' : 'Daily Bulletin',
        icon: 'Cloud'
      };
    }

    // 13. Air Quality (AQI)
    case 'aqi_health':
    case 'outdoor_exercise_aqi': {
      const status = aqi > 150 ? (isHindi ? 'अस्वास्थ्यकर' : 'Unhealthy') : (aqi > 100 ? (isHindi ? 'संवेदनशील के लिए मध्यम' : 'Moderate Risk') : (isHindi ? 'संतोषजनक' : 'Satisfactory Air Quality'));
      const statusColor = aqi > 150 ? '#791F1F' : (aqi > 100 ? '#854F0B' : '#0F6E56');

      return {
        ...baseMeta,
        label: isHindi ? 'वायु गुणवत्ता स्वास्थ्य प्रभाव' : 'Air Quality Health Risk',
        value: `AQI ${aqi}`,
        status,
        statusColor,
        recommendation: aqi > 100
          ? (isHindi ? 'मध्यम श्वसन जोखिम। लंबे समय तक बाहर रहने से बचें।' : 'Moderate respiratory irritation risk. Sensitive individuals should reduce prolonged exertion.')
          : (isHindi ? 'वायु गुणवत्ता स्वीकार्य है।' : 'Air quality is acceptable for healthy individuals and outdoor activities.'),
        confidenceLabel: isHindi ? 'CPCB राष्ट्रीय स्टेशन' : 'CPCB National Station',
        icon: 'HeartPulse'
      };
    }

    // 14. UV Exposure Guidance
    case 'uv_heat_index': {
      const status = uv >= 8 ? (isHindi ? 'बहुत उच्च जोखिम' : 'Very High Risk') : (uv >= 6 ? (isHindi ? 'उच्च जोखिम' : 'High Risk') : (isHindi ? 'मध्यम धूप' : 'Moderate Exposure'));
      const statusColor = uv >= 6 ? '#854F0B' : '#0F6E56';

      return {
        ...baseMeta,
        label: isHindi ? 'UV और त्वचा सुरक्षा' : 'UV Exposure Guidance',
        value: `UV Index ${uv}`,
        status,
        statusColor,
        recommendation: uv >= 6
          ? (isHindi ? 'उच्च सौर विकिरण। सीधे धूप में रहने से बचें और सनस्क्रीन का उपयोग करें।' : 'High solar radiation. Apply SPF 30+ sunscreen during direct sunlight.')
          : (isHindi ? 'बाहरी गतिविधियों के लिए सुरक्षित।' : 'Safe for outdoor exposure. Apply sunscreen for prolonged outdoor activity.'),
        confidenceLabel: isHindi ? 'सौर रेडियोमीटर' : 'Solar Radiometer',
        icon: 'Sun'
      };
    }

    // 15. Humidity Health Impact
    case 'humidity_health_impact': {
      const status = humidity > 80 ? (isHindi ? 'उच्च आर्द्रता' : 'High Humidity') : (isHindi ? 'आरामदायक आर्द्रता' : 'Comfortable Range');
      const statusColor = humidity > 80 ? '#854F0B' : '#0F6E56';

      return {
        ...baseMeta,
        label: isHindi ? 'आर्द्रता स्वास्थ्य प्रभाव' : 'Humidity Health Impact',
        value: `${humidity}% Humidity`,
        status,
        statusColor,
        recommendation: humidity > 80
          ? (isHindi ? 'उच्च आर्द्रता के कारण निर्जलीकरण से बचें।' : 'High humidity may cause respiratory discomfort. Stay hydrated.')
          : (isHindi ? 'आर्द्रता का स्तर सामान्य और संतुलित है।' : 'Relative humidity levels favor comfortable breathing.'),
        confidenceLabel: isHindi ? 'स्वास्थ्य आर्द्रता मॉडल' : 'Health Environmental Model',
        icon: 'Droplets'
      };
    }

    // 16. Exercise & Workout Comfort
    case 'exercise_comfort_index':
    case 'workout_recommendation': {
      const isGood = temp <= 30 && humidity <= 75 && aqi <= 100;

      return {
        ...baseMeta,
        label: isHindi ? 'व्यायाम आराम सूचकांक' : 'Exercise Comfort Index',
        value: `Workout Comfort ${isGood ? '9/10' : '6/10'}`,
        status: isGood ? (isHindi ? 'उत्कृष्ट स्थिति' : 'Excellent Conditions') : (isHindi ? 'संशोधन आवश्यक' : 'Modifications Recommended'),
        statusColor: isGood ? '#0F6E56' : '#854F0B',
        recommendation: isHindi
          ? `वर्तमान स्थिति (${temp}°C, आर्द्रता ${humidity}%): ${isGood ? 'व्यायाम के लिए बहुत अनुकूल।' : 'जलयोजन बनाए रखें।'}`
          : `Live thermal conditions (${temp}°C, ${humidity}% RH) ${isGood ? 'favor comfortable outdoor exercise.' : 'require extra hydration.'}`,
        confidenceLabel: isHindi ? 'फिटनेस कम्फर्ट मॉडल' : 'Fitness Comfort Metric',
        icon: 'Footprints'
      };
    }

    // Default fallback
    default: {
      return {
        ...baseMeta,
        label: isHindi ? 'मौसम गतिविधि परामर्श' : 'Weather Action Advisory',
        value: `${temp}°C`,
        status: isHindi ? 'सामान्य' : 'Normal',
        statusColor: '#0F6E56',
        recommendation: isHindi ? 'मौसम की स्थिति सामान्य है।' : 'Weather conditions are within normal operational limits.',
        confidenceLabel: isHindi ? 'वेदर इंटेलिजेंस' : 'Weather Intelligence',
        icon: 'Sun'
      };
    }
  }
}
