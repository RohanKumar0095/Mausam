export function buildChatbotContext({
  user = {},
  language = 'en',
  selectedPersonas = ['daily_life'],
  currentLocation = {},
  currentTime = '06:30',
  currentActivity = null,
  routine = [],
  savedLocations = [],
  weatherData = {},
  safetyInfo = {}
}) {
  return {
    user: {
      userId: user?.userId || 'rohan_weather',
      language,
      personas: selectedPersonas
    },
    currentContext: {
      time: currentTime,
      activity: currentActivity?.label || 'General Routine',
      activityType: currentActivity?.type || 'other',
      location: currentLocation?.name || 'Gaya — Civil Lines',
      locationPurpose: currentLocation?.purpose || 'Home'
    },
    routine,
    savedLocations,
    weather: {
      temp: weatherData.current?.temp || 25.2,
      condition: weatherData.current?.condition || 'Partly Cloudy',
      rainProbability: weatherData.current?.rainProbability || 20,
      aqi: weatherData.current?.aqi || 83,
      aqiStatus: weatherData.current?.aqiStatus || 'Satisfactory',
      humidity: weatherData.current?.humidity || 84,
      windSpeed: weatherData.current?.windSpeed || 8,
      windDirection: weatherData.current?.windDirection || 'SSW',
      uvIndex: weatherData.current?.uvIndex || 4,
      visibility: weatherData.current?.visibility || 5.0,
      forecast3Hourly: weatherData.forecast3Hourly || [],
      dailyForecast: weatherData.dailyForecast || [],
      warning: weatherData.warning || { level: 'GREEN', text: 'No warning' }
    },
    safetyInfo
  };
}
