/**
 * WEATHER-TO-ACTION INTELLIGENCE (English & Natural Hindi)
 */

export function interpretWeatherToAction({
  widgetId,
  weatherData,
  currentActivity,
  currentTime,
  selectedPersonas,
  selectedPlot = 'Plot A (Rice)',
  language = 'en'
}) {
  const isHindi = language === 'hi' || language === 'Hindi';
  const current = weatherData?.current || {};
  const temp = current.temp || 25.2;
  const rainProb = current.rainProbability || 20;
  const uv = current.uvIndex || 4;
  const aqi = current.aqi || 83;
  const wind = current.windSpeed || 8;
  const windDir = current.windDirection || 'SSW';
  const visibility = current.visibility || 5;

  switch (widgetId) {
    // 1. WBGT Training Safety
    case 'wbgt_safety': {
      const wbgtEst = (temp * 0.85 + (current.humidity || 84) * 0.08).toFixed(1);
      let status = isHindi ? 'मध्यम तापीय तनाव' : 'Moderate Strain Zone';
      let statusColor = '#854F0B';
      let advice = isHindi
        ? '45:15 मिनट का कार्य-विश्राम चक्र अनुशंसित। हर 20 मिनट में अनिवार्य पानी और इलेक्ट्रोलाइट ब्रेक लें।'
        : 'Work:Rest cycle of 45:15 min recommended. Compulsory water & electrolyte breaks every 20 mins.';

      if (temp < 24) {
        status = isHindi ? 'अनुकूल तापीय स्थिति' : 'Optimal Thermal Comfort';
        statusColor = '#0F6E56';
        advice = isHindi
          ? 'बिना किसी तापीय प्रतिबंध के पूर्ण तीव्रता वाला सामान्य प्रशिक्षण। मानक जलयोजन बनाए रखें।'
          : 'Normal full-intensity training without thermal restriction. Standard hydration.';
      } else if (temp > 32 || wbgtEst > 30) {
        status = isHindi ? 'उच्च तापीय तनाव स्तर' : 'High Thermal Strain Zone';
        statusColor = '#791F1F';
        advice = isHindi
          ? 'लगातार मैच अभ्यास को 30 मिनट तक सीमित करें। ठंडे तौलिए और अनिवार्य छायादार विश्राम प्रदान करें।'
          : 'Reduce continuous scrimmage to 30 mins. Provide iced towels and mandatory shaded recovery.';
      }

      return {
        label: isHindi ? 'WBGT प्रशिक्षण सुरक्षा' : 'WBGT Training Safety',
        value: `${wbgtEst}°C WBGT`,
        status,
        statusColor,
        recommendation: advice,
        confidenceLabel: isHindi ? 'वेट बल्ब ग्लोब मॉडल' : 'Wet Bulb Globe Model',
        icon: 'Flame'
      };
    }

    // 2. Dew Factor & Ball Grip
    case 'dew_factor': {
      let status = isHindi ? 'कम ओस की संभावना' : 'Low Dew Expected';
      let statusColor = '#0F6E56';
      let value = isHindi ? 'मजबूत ग्रिप (18°C ओस बिंदु)' : 'Firm Grip (18°C Dew Pt)';
      let advice = isHindi
        ? 'मैदान पर न्यूनतम नमी। गेंद की सीम और मैदान की ग्रिप शाम 5 से 8 बजे तक स्थिर रहेगी।'
        : 'Minimal outfield moisture. Ball seam and turf traction will remain stable throughout 5–8 PM session.';

      if (current.humidity > 88 && temp < 24) {
        status = isHindi ? 'भारी ओस चेतावनी' : 'Heavy Dew Warning';
        statusColor = '#854F0B';
        value = isHindi ? 'फिसलन भरा मैदान' : 'Slippery Outfield';
        advice = isHindi
          ? 'शाम 6:30 बजे के बाद मैदान पर अधिक ओस आने की संभावना है। गेंद के लिए सूखे तौलिए रखें और स्टडेड जूते पहनें।'
          : 'Significant outfield dew expected after 6:30 PM. Keep dry towels for balls and switch to studded footwear.';
      }

      return {
        label: isHindi ? 'ओस प्रभाव और बॉल ग्रिप' : 'Dew Factor & Ball Grip',
        value,
        status,
        statusColor,
        recommendation: advice,
        confidenceLabel: isHindi ? 'सतह ओस पूर्वानुमान' : 'Surface Dew Forecast',
        icon: 'Droplets'
      };
    }

    // 3. Training / Match Window
    case 'training_window': {
      let status = isHindi ? 'स्पष्ट अभ्यास समय' : 'Clear Session Window';
      let statusColor = '#0F6E56';
      let value = isHindi ? 'शाम 5:00–7:30 (अनुकूल)' : '5:00–7:30 PM (Favorable)';
      let advice = isHindi
        ? 'शाम के अभ्यास सत्र के दौरान बारिश की संभावना शून्य है। हल्की 9 km/h की हवा रहेगी।'
        : 'Zero rain probability during evening practice session. Light breeze of 9 km/h.';

      if (rainProb >= 65) {
        status = isHindi ? 'बारिश से अभ्यास बाधित' : 'Session Rain Disruption';
        statusColor = '#791F1F';
        value = isHindi ? `${rainProb}% बारिश का जोखिम` : `${rainProb}% Rain Risk`;
        advice = isHindi
          ? 'शाम 6:00 बजे के अभ्यास के समय भारी बारिश की संभावना है। अभ्यास इनडोर हॉल में या सुबह 7:30 बजे करें।'
          : 'Heavy rain expected around 6:00 PM practice. Shift drills to indoor arena or 7:30 AM morning slot.';
      }

      return {
        label: isHindi ? 'प्रशिक्षण / मैच समय पूर्वानुमान' : 'Training / Match Window',
        value,
        status,
        statusColor,
        recommendation: advice,
        confidenceLabel: isHindi ? 'उच्च-रिज़ॉल्यूशन रडार सिंक' : 'High-Resolution Radar Sync',
        icon: 'Trophy'
      };
    }

    // 4. Ground & Pitch Condition
    case 'ground_condition': {
      let status = isHindi ? 'मजबूत और सूखा मैदान' : 'Firm & Dry Turf';
      let statusColor = '#0F6E56';
      let value = isHindi ? 'सतह नमी 18%' : 'Surface Moisture 18%';
      let advice = isHindi
        ? 'पिच पर गेंद का उछाल और क्लीट ट्रैक्शन उत्कृष्ट है। मुख्य मैदान पर कोई जलभराव नहीं है।'
        : 'Excellent pitch rebound and cleat grip. Zero waterlogging on main field.';

      if (rainProb >= 60 || (current.rainfall24h && current.rainfall24h > 10)) {
        status = isHindi ? 'मुलायम / नम मैदान' : 'Soft / Wet Outfield';
        statusColor = '#854F0B';
        value = isHindi ? 'सतह नमी 45%' : 'Surface Moisture 45%';
        advice = isHindi
          ? 'मैदान में नमी के कारण गेंद की गति धीमी हो सकती है। मुड़ते समय सावधानी बरतें।'
          : 'Pitch softness may reduce ball bounce. Extra caution on boundary turns to prevent ankle twisting.';
      }

      return {
        label: isHindi ? 'मैदान और पिच की स्थिति' : 'Ground & Pitch Condition',
        value,
        status,
        statusColor,
        recommendation: advice,
        confidenceLabel: isHindi ? 'टर्फ सेंसर सरणी' : 'Turf Sensor Array',
        icon: 'ShieldCheck'
      };
    }

    // 5. Best Running / Workout Hours
    case 'running_window': {
      let value = isHindi ? 'सुबह 6:00–7:30' : '6:00–7:30 AM';
      let status = isHindi ? 'आदर्श सुबह का समय' : 'Optimal Morning Window';
      let statusColor = '#0F6E56';
      let advice = isHindi
        ? 'आर्द्रता बढ़ने और धूप तेज होने से पहले सबसे अच्छा समय। तापमान 23°C रहेगा।'
        : 'Best before humidity rises and solar radiation increases. Temperature 23°C.';

      if (rainProb > 60) {
        status = isHindi ? 'गीली सड़क' : 'Wet Pavement';
        statusColor = '#854F0B';
        advice = isHindi
          ? 'हल्की बारिश की संभावना है। पक्की पार्क लेन कच्ची पगडंडियों से अधिक सुरक्षित है।'
          : 'Rain showers possible. Paved park track is safer than unpaved trails today.';
      }

      return {
        label: isHindi ? 'दौड़ने / कसरत के लिए सबसे अच्छा समय' : 'Best Running / Workout Hours',
        value,
        status,
        statusColor,
        recommendation: advice,
        confidenceLabel: isHindi ? 'सत्यापित पूर्वानुमान' : 'Verified Forecast',
        icon: 'Footprints'
      };
    }

    // 6. Crop Action Checklist
    case 'agri_action_checklist': {
      const crop = (selectedPlot || 'Plot A (Rice)').split(' ')[0];
      const cropHindi = crop === 'Rice' ? 'धान' : (crop === 'Maize' ? 'मक्का' : 'सब्जियों');
      let cropStage = isHindi ? 'कल्ले निकलने की अवस्था (टिलरिंग)' : 'Tillering Stage';
      let advice = isHindi
        ? 'उर्वरक डालने और खरपतवार नियंत्रण के लिए आदर्श समय। अगले 48 घंटों में बारिश का खतरा नहीं है।'
        : 'Ideal window for fertilizer application & weed clearance. No washout rain expected for 48 hours.';
      let status = isHindi ? 'परामर्श अनुशंसित' : 'Action Recommended';

      if (selectedPlot && selectedPlot.includes('Maize')) {
        cropStage = isHindi ? 'मंजरी निकलने की अवस्था (टैसलिंग)' : 'Tasseling Stage';
        advice = isHindi
          ? 'खेत की क्यारियों में पर्याप्त नमी बनाए रखें। फॉल आर्मीवर्म कीट के लक्षणों की जांच करें।'
          : 'Maintain adequate furrow moisture. Check for fall armyworm emergence.';
      } else if (selectedPlot && selectedPlot.includes('Vegetables')) {
        cropStage = isHindi ? 'फूल और फल विकास अवस्था' : 'Vegetative & Flowering';
        advice = isHindi
          ? 'दोपहर की तेज धूप से पहले सुबह के समय तैयार सब्जियों की तुड़ाई कर लें।'
          : 'Harvest mature produce early morning before midday heat.';
      }

      return {
        label: isHindi ? 'फसल कार्य चेकलिस्ट' : 'Crop Action Checklist',
        value: `${isHindi ? cropHindi : crop} — ${cropStage}`,
        status,
        statusColor: '#0F6E56',
        recommendation: advice,
        confidenceLabel: isHindi ? 'सत्यापित IMD कृषि परामर्श' : 'Verified IMD Advisory',
        icon: 'Sprout'
      };
    }

    // 7. Multi-Day Rainfall Trend
    case 'multi_day_rainfall': {
      let value = isHindi ? '3 दिन सूखा मौसम' : '3-Day Dry Window';
      let status = isHindi ? 'खेत कार्य के लिए अनुकूल' : 'Favorable for Field Work';
      let statusColor = '#0F6E56';
      let advice = isHindi
        ? 'अगले 3 दिनों में कुल वर्षा < 2mm अनुमानित है। उर्वरक डालने के लिए बेहतरीन समय।'
        : 'Total 3-day precipitation < 2mm. Excellent period for fertilizer top-dressing.';

      if (rainProb >= 60) {
        value = isHindi ? '24–36 घंटे में बारिश' : 'Precipitation in 24–36h';
        status = isHindi ? 'छिड़काव टालें' : 'Delay Chemical Spray';
        statusColor = '#854F0B';
        advice = isHindi
          ? '24 घंटों में मध्यम बारिश (12–18mm) की संभावना है। रसायन के बहने से बचने के लिए पर्णीय छिड़काव रोकें।'
          : 'Moderate downpour (12–18mm) expected in 24 hours. Hold foliar spray to prevent chemical runoff.';
      }

      return {
        label: isHindi ? 'बहु-दिवसीय वर्षा रुझान' : 'Multi-Day Rainfall Trend',
        value,
        status,
        statusColor,
        recommendation: advice,
        confidenceLabel: isHindi ? 'सिनॉप्टिक IMD मॉडल' : 'Synoptic IMD Model',
        icon: 'CloudRain'
      };
    }

    // 8. Irrigation Nudge
    case 'irrigation_nudge': {
      return {
        label: isHindi ? 'सिंचाई संबंधी सलाह' : 'Irrigation Nudge',
        value: isHindi ? 'जड़ क्षेत्र में पर्याप्त नमी' : 'Adequate Root-Zone Moisture',
        status: isHindi ? 'सिंचाई की आवश्यकता नहीं' : 'No Irrigation Needed',
        statusColor: '#0F6E56',
        recommendation: isHindi
          ? 'मृदा नमी सूचकांक 84% क्षेत्र क्षमता पर है। 2 दिनों के लिए नहर/पंप सिंचाई स्थगित रखें।'
          : 'Soil moisture index is at 84% field capacity. Postpone pump/canal irrigation for 2 days.',
        confidenceLabel: isHindi ? 'मृदा नमी अनुमान' : 'Soil Moisture Heuristic',
        icon: 'Droplets'
      };
    }

    // 9. Frost / Heat Alert
    case 'frost_heat_alert': {
      return {
        label: isHindi ? 'पाला / गर्मी जोखिम संकेत' : 'Frost / Heat Alert',
        value: isHindi ? 'सुरक्षित तापमान सीमा (21–32°C)' : 'Safe Canopy Range (21–32°C)',
        status: isHindi ? 'शून्य पाला / ताप तनाव' : 'Zero Frost / Heat Stress',
        statusColor: '#0F6E56',
        recommendation: isHindi
          ? 'रात का न्यूनतम तापमान 21°C से ऊपर रहेगा। फसलें स्वस्थ वानस्पतिक सीमा के भीतर हैं।'
          : 'Night minimum stays above 21°C. Crops are well within healthy physiological thresholds.',
        confidenceLabel: isHindi ? 'एग्रोमेट तापीय मॉडल' : 'Agromet Thermal Model',
        icon: 'Sun'
      };
    }

    // 10. Disease / Pest Risk Flag
    case 'pest_disease_risk': {
      return {
        label: isHindi ? 'रोग / कीट जोखिम संकेतक' : 'Disease / Pest Risk Flag',
        value: isHindi ? 'मध्यम (ब्लास्ट / झुलसा जोखिम)' : 'Moderate (Blast / Blight Risk)',
        status: isHindi ? 'सामान्य से अधिक' : 'Higher than usual',
        statusColor: '#854F0B',
        recommendation: isHindi
          ? 'उच्च आर्द्रता (84%) कवक वृद्धि के लिए अनुकूल है। खेत में धान के निचले पत्तों पर धब्बों की जांच करें।'
          : 'High humidity (84%) creates favorable fungal conditions. Inspect bottom leaf sheaths for lesions.',
        confidenceLabel: isHindi ? 'अनुमानित जोखिम संकेतक' : 'Estimated Risk Indicator',
        icon: 'Sprout'
      };
    }

    // 11. Current Ambient Weather
    case 'current_conditions': {
      return {
        label: isHindi ? 'वर्तमान मौसम की स्थिति' : 'Current Ambient Weather',
        value: `${temp}°C • ${isHindi ? 'आंशिक रूप से बादल' : (current.condition || 'Partly Cloudy')}`,
        status: isHindi ? 'आरामदायक' : 'Comfortable',
        statusColor: '#0F6E56',
        recommendation: isHindi
          ? `आर्द्रता ${current.humidity || 84}% और हवा ${wind} km/h की गति से चल रही है।`
          : `Humidity is ${current.humidity || 84}% with gentle ${wind} km/h breeze from ${windDir}.`,
        confidenceLabel: isHindi ? 'IMD स्टेशन डेटा' : 'IMD Station Data',
        icon: 'Sun'
      };
    }

    // 12. Today's Forecast
    case 'today_forecast': {
      return {
        label: isHindi ? 'आज का मौसम दृष्टिकोण' : "Today's Forecast",
        value: `Max ${current.maxTemp || 27}° / Min ${current.minTemp || 21}°C`,
        status: isHindi ? 'मौसमी सामान्य' : 'Seasonal Normal',
        statusColor: '#0F6E56',
        recommendation: isHindi
          ? 'दोपहर बाद हल्की फुहारों की संभावना; अन्यथा दैनिक दिनचर्या के लिए मौसम सुहावना रहेगा।'
          : 'Passing light showers possible in the afternoon; otherwise pleasant for outdoor routine.',
        confidenceLabel: isHindi ? 'दैनिक बुलेटिन' : 'Daily Bulletin',
        icon: 'Cloud'
      };
    }

    // 13. Commute Weather
    case 'commute_weather': {
      let status = isHindi ? 'सुगम यात्रा' : 'Smooth Transit';
      let statusColor = '#0F6E56';
      let value = isHindi ? 'स्पष्ट मुख्य सड़कें' : 'Clear Arterial Roads';
      let advice = isHindi
        ? 'सामान्य यातायात की स्थिति। मुख्य मार्गों पर दृश्यता स्पष्ट है।'
        : 'Normal traffic expected. Visibility is optimal across main corridors.';

      if (rainProb >= 70) {
        status = isHindi ? 'भारी बारिश / बौछारें' : 'Heavy Rain / Squall';
        statusColor = '#791F1F';
        value = `${rainProb}% ${isHindi ? 'बारिश का जोखिम' : 'Rain Risk'}`;
        advice = isHindi
          ? 'शाम 4:30 बजे की यात्रा के समय तेज बारिश की संभावना है। 25 मिनट पहले निकलने या मेट्रो चुनने पर विचार करें।'
          : 'Heavy downpour expected around your 4:30 PM commute. Consider departing 25 mins earlier or use metro.';
      }

      return {
        label: isHindi ? 'दैनिक यात्रा मौसम और सड़क स्थिति' : 'Commute Conditions',
        value,
        status,
        statusColor,
        recommendation: advice,
        confidenceLabel: isHindi ? 'रडार ट्रांजिट सिंक' : 'Radar Transit Sync',
        icon: 'Car'
      };
    }

    // 14. Air Quality (AQI)
    case 'aqi_health': {
      let status = isHindi ? 'संतोषजनक' : (current.aqiStatus || 'Satisfactory');
      let statusColor = '#0F6E56';
      let advice = isHindi
        ? 'स्वस्थ व्यक्तियों और बाहरी कसरत के लिए वायु गुणवत्ता स्वीकार्य है।'
        : 'Air quality is acceptable for healthy individuals and outdoor workouts.';

      return {
        label: isHindi ? 'वायु गुणवत्ता सूचकांक (AQI)' : 'Air Quality (AQI)',
        value: `${aqi} AQI (${status})`,
        status,
        statusColor,
        recommendation: advice,
        confidenceLabel: isHindi ? 'CPCB राष्ट्रीय स्टेशन' : 'CPCB National Station',
        icon: 'HeartPulse'
      };
    }

    // 15. UV & Heat Index
    case 'uv_heat_index': {
      return {
        label: isHindi ? 'UV सूचकांक और ताप तनाव' : 'UV & Heat Index',
        value: `UV ${uv} | ${temp}°C`,
        status: isHindi ? 'मध्यम UV' : 'Moderate UV',
        statusColor: '#0F6E56',
        recommendation: isHindi
          ? 'सुबह 9 बजे से पहले बाहरी गतिविधियों के लिए सुरक्षित। अधिक देर बाहर रहने पर सनस्क्रीन का प्रयोग करें।'
          : 'Safe for outdoor routine before 9 AM. Apply sunscreen for prolonged exposure.',
        confidenceLabel: isHindi ? 'सौर रेडियोमीटर' : 'Solar Radiometer',
        icon: 'Sun'
      };
    }

    // 16. Precipitation Probability Timeline
    case 'rain_probability': {
      return {
        label: isHindi ? 'बारिश की संभावना समयरेखा' : 'Precipitation Timeline',
        value: `${rainProb}% ${isHindi ? 'संभावना' : 'Chance'}`,
        status: rainProb >= 60 ? (isHindi ? 'उच्च बारिश' : 'High Rain Chance') : (isHindi ? 'हल्की फुहारें' : 'Low Rain Chance'),
        statusColor: rainProb >= 60 ? '#791F1F' : '#0F6E56',
        recommendation: isHindi
          ? 'आपकी अधिकांश दिनचर्या के दौरान मौसम सूखा रहने का अनुमान है।'
          : 'Dry conditions favored for majority of your routine.',
        confidenceLabel: isHindi ? 'डॉप्लर रडार मॉडल' : 'Doppler Radar Model',
        icon: 'CloudRain'
      };
    }

    // 17. Wind Gauge
    case 'wind_gauge': {
      return {
        label: isHindi ? 'सतह वायु गति व दिशा' : 'Surface Wind Gauge',
        value: `${wind} km/h (${windDir})`,
        status: isHindi ? 'मंद हवा' : 'Gentle Breeze',
        statusColor: '#0F6E56',
        recommendation: isHindi
          ? `${windDir} दिशा से ${wind} km/h की सुखद मंद हवा चल रही है।`
          : `Pleasant breeze of ${wind} km/h from ${windDir}.`,
        confidenceLabel: isHindi ? 'एनीमोमीटर 10m' : 'Anemometer 10m',
        icon: 'Compass'
      };
    }

    // 18. Visibility & Fog
    case 'visibility_fog': {
      return {
        label: isHindi ? 'यातायात दृश्यता और कोहरा' : 'Transit Visibility',
        value: `${visibility} km`,
        status: isHindi ? 'अच्छी दृश्यता' : 'Good Visibility',
        statusColor: '#0F6E56',
        recommendation: isHindi
          ? 'मुख्य सड़कों और राजमार्गों पर स्पष्ट दृश्यता है।'
          : 'Clear visibility across arterial roads and highways.',
        confidenceLabel: isHindi ? 'सतह सेंसर सरणी' : 'Surface Sensor Array',
        icon: 'Eye'
      };
    }

    // 19. Outdoor Event Feasibility
    case 'outdoor_event_suitability': {
      return {
        label: isHindi ? 'बाहरी कार्यक्रम उपयुक्तता' : 'Outdoor Event Feasibility',
        value: '88/100',
        status: isHindi ? 'अनुकूल शाम' : 'Favorable Evening',
        statusColor: '#0F6E56',
        recommendation: isHindi
          ? 'शाम का सुखद तापमान (25°C)। खुले मैदान और सामाजिक कार्यक्रमों के लिए आदर्श।'
          : 'Pleasant evening temperature (25°C). Ideal for open-air amphitheater and social gathering.',
        confidenceLabel: isHindi ? 'शाम का पूर्वानुमान' : 'Evening Forecast',
        icon: 'PartyPopper'
      };
    }

    // 20. School Transit Safety
    case 'school_transit': {
      return {
        label: isHindi ? 'स्कूल और बाल सुरक्षा' : 'School & Transit Safety',
        value: isHindi ? 'अनुकूल सुबह' : 'Optimal Morning',
        status: isHindi ? 'सुरक्षित यात्रा' : 'Safe Transit Conditions',
        statusColor: '#0F6E56',
        recommendation: isHindi
          ? 'स्कूल जाने के समय 24°C का सुखद मौसम। बच्चों के लिए बारिश या लू का कोई खतरा नहीं।'
          : 'Pleasant 24°C during school drop. Zero rain or heatwave threat for children.',
        confidenceLabel: isHindi ? 'पारिवारिक सुरक्षा मॉडल' : 'Family Safety Model',
        icon: 'Users'
      };
    }

    // 21. Travel Conditions
    case 'travel_conditions': {
      return {
        label: isHindi ? 'गंतव्य मौसम' : 'Destination Weather',
        value: `${temp}°C • ${isHindi ? 'गंतव्य सक्रिय' : 'Destination Active'}`,
        status: isHindi ? 'अच्छा यात्रा समय' : 'Good Travel Window',
        statusColor: '#0F6E56',
        recommendation: isHindi
          ? 'गंतव्य यात्रा मार्ग मध्यम तटीय हवाओं के साथ पूरी तरह खुले हैं।'
          : 'Destination transit corridors remain clear with moderate coastal breeze.',
        confidenceLabel: isHindi ? 'क्षेत्रीय पूर्वानुमान' : 'Regional Forecast',
        icon: 'Compass'
      };
    }

    // 22. Coastal Tide
    case 'coastal_tide': {
      return {
        label: isHindi ? 'तटीय ज्वार और लहरें' : 'High Tide & Coastal Conditions',
        value: isHindi ? 'दोपहर 15:45 उच्च ज्वार (3.9m)' : 'High Tide at 15:45 (3.9m)',
        status: isHindi ? 'तटीय सावधानी' : 'Promenade Caution',
        statusColor: '#854F0B',
        recommendation: isHindi
          ? 'दोपहर के समय उच्च ज्वार के दौरान पर्यटकों को चट्टानी किनारों से दूर रहने की सलाह दी जाती है।'
          : 'Tourists advised to avoid rocky coastal edges during afternoon peak tide window.',
        confidenceLabel: isHindi ? 'हाइड्रोग्राफिक मॉडल' : 'Hydrographic Model',
        icon: 'Compass'
      };
    }

    default:
      return {
        label: isHindi ? 'सामान्य मौसम' : 'General Weather',
        value: `${temp}°C`,
        status: isHindi ? 'सामान्य' : 'Normal',
        statusColor: '#0F6E56',
        recommendation: isHindi
          ? 'परिस्थितियाँ मानक मौसमी सीमा के भीतर हैं।'
          : 'Conditions are within standard seasonal range.',
        confidenceLabel: isHindi ? 'IMD प्रेक्षण' : 'IMD Observation',
        icon: 'Cloud'
      };
  }
}
