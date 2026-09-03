import { LOCATIONS } from './mockWeatherData';

const STORAGE_KEY = 'mausam_custom_locations';

export const customLocationStore = {
  getCustomLocations() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  },

  saveCustomLocation({ name, address, purposes = [], personas = [] }) {
    const customList = this.getCustomLocations();
    const cleanAddress = address.trim();
    const parts = cleanAddress.split(',');
    const district = parts[0] ? parts[0].trim() : 'Local Area';
    const state = parts[1] ? parts[1].trim() : 'India';

    const newLoc = {
      id: `custom-loc-${Date.now()}`,
      name: name.trim(),
      address: cleanAddress,
      district,
      state,
      purpose: Array.isArray(purposes) ? purposes.join(' • ') : purposes,
      purposes: Array.isArray(purposes) ? purposes : [purposes],
      personaDefault: personas.length > 0 ? personas : ['daily_life'],
      custom: true,
      current: {
        temp: 25.4,
        updatedAt: '11:30 AM',
        feelsLike: 25.8,
        maxTemp: 27.2,
        minTemp: 21.0,
        humidity: 82,
        windSpeed: 8,
        windDirection: 'SSW',
        windDegree: 205,
        pressure: 1012,
        visibility: 5.0,
        uvIndex: 4,
        aqi: 80,
        aqiStatus: 'Satisfactory',
        aqiColor: '#639922',
        condition: 'Partly Cloudy with Mild Sun',
        conditionCode: 'partly_cloudy',
        rainfall24h: 1.2,
        rainProbability: 20
      },
      forecast3Hourly: LOCATIONS[0].forecast3Hourly,
      dailyForecast: LOCATIONS[0].dailyForecast,
      astronomy: LOCATIONS[0].astronomy,
      warning: { level: 'GREEN', code: 'no_warning', text: 'No severe weather warning active' }
    };

    const updated = [newLoc, ...customList];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return newLoc;
  },

  getAllLocations() {
    const custom = this.getCustomLocations();
    return [...custom, ...LOCATIONS];
  }
};
