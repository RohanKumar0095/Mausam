/**
 * MAUSAM Location Service
 * Handles browser GPS geolocation, forward geocoding autocomplete, 
 * reverse geocoding, and full location hierarchy parsing (Area, City, District, State, Country, PIN Code).
 */

import { safeFetch } from './apiClient';

const WEATHER_API_KEY = import.meta.env.VITE_WEATHER_API_KEY || '';

/**
 * Parses address components into Indian Location Hierarchy standard:
 * Area -> City -> District -> State -> Country -> PIN Code
 */
function parseAddressHierarchy(addressObj = {}, displayName = '', lat = null, lon = null) {
  // 1. Area / Locality
  const area = addressObj.suburb || 
               addressObj.neighbourhood || 
               addressObj.locality || 
               addressObj.residential || 
               addressObj.quarter || 
               addressObj.road || 
               addressObj.subdistrict || 
               addressObj.industrial || 
               addressObj.commercial || 
               '';

  // 2. City
  const city = addressObj.city || 
              addressObj.town || 
              addressObj.village || 
              addressObj.municipality || 
              addressObj.city_district || 
              '';

  // 3. District
  const district = addressObj.state_district || 
                   addressObj.county || 
                   addressObj.district || 
                   city || 
                   '';

  // 4. State
  const state = addressObj.state || 
                addressObj.region || 
                '';

  // 5. Country
  const country = addressObj.country || 'India';

  // 6. PIN Code
  const pincode = addressObj.postcode || '';

  // Constructed short address line
  const parts = [];
  if (area) parts.push(area);
  if (city && city !== area) parts.push(city);
  if (district && district !== city && district !== area) parts.push(district);
  if (state) parts.push(state);

  const formattedAddress = parts.length > 0 ? parts.join(', ') : displayName;

  return {
    area: area.trim(),
    city: city.trim(),
    district: district.trim(),
    state: state.trim(),
    country: country.trim(),
    pincode: pincode.trim(),
    latitude: lat != null ? Number(lat) : null,
    longitude: lon != null ? Number(lon) : null,
    formattedAddress
  };
}

export const locationService = {
  /**
   * Get current position via Browser Geolocation API and automatically reverse-geocode full hierarchy
   */
  async getCurrentPosition() {
    if (!navigator.geolocation) {
      return {
        success: false,
        error: 'NOT_SUPPORTED',
        message: 'Geolocation is not supported by your browser.',
        messageHi: 'आपका ब्राउज़र जियोलोकेशन का समर्थन नहीं करता है।'
      };
    }

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;

          // Perform reverse geocoding to resolve location hierarchy
          const reverseRes = await this.reverseGeocode(lat, lon);
          
          if (reverseRes.success) {
            resolve({
              success: true,
              latitude: lat,
              longitude: lon,
              accuracy: position.coords.accuracy,
              hierarchy: reverseRes.hierarchy
            });
          } else {
            // Fallback if reverse geocode service is unreachable
            resolve({
              success: true,
              latitude: lat,
              longitude: lon,
              accuracy: position.coords.accuracy,
              hierarchy: {
                area: 'Current Location',
                city: '',
                district: '',
                state: '',
                country: 'India',
                pincode: '',
                latitude: lat,
                longitude: lon,
                formattedAddress: `${lat.toFixed(4)}°N, ${lon.toFixed(4)}°E`
              }
            });
          }
        },
        (error) => {
          let msg = 'Unable to retrieve location.';
          let msgHi = 'स्थान की जानकारी प्राप्त करने में असमर्थ।';
          let errType = 'UNKNOWN_ERROR';

          if (error.code === error.PERMISSION_DENIED) {
            errType = 'PERMISSION_DENIED';
            msg = 'Location permission was denied. Please allow location access in your browser settings.';
            msgHi = 'स्थान अनुमति अस्वीकृत कर दी गई थी। कृपया अपने ब्राउज़र में अनुमति दें।';
          } else if (error.code === error.POSITION_UNAVAILABLE) {
            errType = 'POSITION_UNAVAILABLE';
            msg = 'Location information is currently unavailable.';
            msgHi = 'स्थान की जानकारी वर्तमान में उपलब्ध नहीं है।';
          } else if (error.code === error.TIMEOUT) {
            errType = 'TIMEOUT';
            msg = 'Location request timed out. Please try again.';
            msgHi = 'स्थान अनुरोध का समय समाप्त हो गया। कृपया पुनः प्रयास करें।';
          }

          resolve({
            success: false,
            error: errType,
            message: msg,
            messageHi: msgHi
          });
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    });
  },

  /**
   * Search locations (Autocomplete / Forward Geocoding)
   */
  async searchLocations(query, signal = null) {
    if (!query || !query.trim()) {
      return { success: true, suggestions: [] };
    }

    const cleanQuery = query.trim();

    try {
      // 1. Primary provider: OpenStreetMap Nominatim
      const nominatimUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(cleanQuery)}&format=json&addressdetails=1&limit=6&accept-language=en,hi`;
      
      const results = await safeFetch(nominatimUrl, { 
        signal, 
        timeout: 7000,
        headers: { 'Accept-Language': 'en' }
      });

      if (Array.isArray(results) && results.length > 0) {
        const suggestions = results.map(item => {
          const hierarchy = parseAddressHierarchy(
            item.address, 
            item.display_name, 
            parseFloat(item.lat), 
            parseFloat(item.lon)
          );

          return {
            id: `geo-${item.place_id || Math.random()}`,
            name: hierarchy.area || hierarchy.city || item.display_name.split(',')[0],
            displayName: item.display_name,
            hierarchy
          };
        });

        return { success: true, suggestions };
      }

      // 2. Secondary Fallback: WeatherAPI search endpoint if key is available
      if (WEATHER_API_KEY && !WEATHER_API_KEY.includes('your_')) {
        try {
          const wUrl = `https://api.weatherapi.com/v1/search.json?key=${encodeURIComponent(WEATHER_API_KEY)}&q=${encodeURIComponent(cleanQuery)}`;
          const wResults = await safeFetch(wUrl, { signal, timeout: 5000 });
          if (Array.isArray(wResults) && wResults.length > 0) {
            const suggestions = wResults.map(item => {
              const hierarchy = {
                area: item.name || '',
                city: item.name || '',
                district: item.region || item.name || '',
                state: item.region || '',
                country: item.country || 'India',
                pincode: '',
                latitude: item.lat,
                longitude: item.lon,
                formattedAddress: `${item.name}, ${item.region}, ${item.country}`
              };

              return {
                id: `wgeo-${item.id || Math.random()}`,
                name: item.name,
                displayName: `${item.name}, ${item.region}, ${item.country}`,
                hierarchy
              };
            });

            return { success: true, suggestions };
          }
        } catch (e) {
          // WeatherAPI fallback failed silently
        }
      }

      return { success: true, suggestions: [] };
    } catch (err) {
      if (err.name === 'AbortError' || err.errorType === 'TIMEOUT_OR_CANCEL') {
        return { success: false, isCancelled: true, message: 'Search cancelled.' };
      }

      // 3. Fallback to Open-Meteo Geocoding API if Nominatim fails
      try {
        const omUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cleanQuery)}&count=6&language=en&format=json`;
        const omRes = await safeFetch(omUrl, { signal, timeout: 5000 });
        if (omRes && Array.isArray(omRes.results) && omRes.results.length > 0) {
          const suggestions = omRes.results.map(item => {
            const hierarchy = {
              area: item.name || '',
              city: item.name || '',
              district: item.admin2 || item.admin1 || '',
              state: item.admin1 || '',
              country: item.country || 'India',
              pincode: item.postcode || '',
              latitude: item.latitude,
              longitude: item.longitude,
              formattedAddress: `${item.name}${item.admin1 ? ', ' + item.admin1 : ''}, ${item.country || 'India'}`
            };

            return {
              id: `omgeo-${item.id || Math.random()}`,
              name: item.name,
              displayName: `${item.name}, ${item.admin1 || ''}, ${item.country || 'India'}`,
              hierarchy
            };
          });

          return { success: true, suggestions };
        }
      } catch (omErr) {
        // Fallback failed
      }

      return {
        success: false,
        error: err.errorType || 'SEARCH_FAILED',
        message: 'Unable to fetch location suggestions. Please check your network.',
        messageHi: 'स्थान सुझाव लाने में असमर्थ। कृपया अपना नेटवर्क जांचें।'
      };
    }
  },

  /**
   * Reverse Geocode (Coordinates -> Full Hierarchy)
   */
  async reverseGeocode(latitude, longitude, signal = null) {
    if (latitude == null || longitude == null) {
      return { success: false, message: 'Invalid coordinates' };
    }

    try {
      const url = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1&accept-language=en,hi`;
      const data = await safeFetch(url, { signal, timeout: 7000 });

      if (data && data.address) {
        const hierarchy = parseAddressHierarchy(data.address, data.display_name, latitude, longitude);
        return { success: true, hierarchy };
      }

      return {
        success: false,
        message: 'Could not resolve address hierarchy for coordinates.'
      };
    } catch (err) {
      return {
        success: false,
        error: err.errorType || 'REVERSE_GEOCODE_FAILED',
        message: 'Failed to detect location address details.'
      };
    }
  }
};

