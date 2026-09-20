import { PREDEFINED_LOCATIONS } from './locationsData';

const STORAGE_KEY = 'mausam_custom_locations';

export const DEFAULT_USER_LOCATION = {
  id: 'user-primary-location',
  name: 'My Primary Location',
  district: 'Local Area',
  state: 'India',
  latitude: 28.6139,
  longitude: 77.2090,
  purpose: 'Home & Daily Life',
  purposes: ['Home', 'Daily Life'],
  personaDefault: ['daily_life', 'health']
};

export const customLocationStore = {
  getCustomLocations() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  },

  saveCustomLocation({ name, address, area = '', city = '', district = '', state = '', country = '', pincode = '', latitude, longitude, purposes = [], personas = [] }) {
    const customList = this.getCustomLocations();
    const cleanAddress = (address || '').trim();
    
    // Fallbacks for legacy/simple callers
    const parts = cleanAddress.split(',');
    const resolvedDistrict = (district || parts[0] || 'Custom Area').trim();
    const resolvedState = (state || parts[1] || 'India').trim();
    const resolvedCity = (city || resolvedDistrict).trim();

    const newLoc = {
      id: `custom-loc-${Date.now()}`,
      name: (name || resolvedCity || resolvedDistrict || 'My Location').trim(),
      address: cleanAddress,
      area: (area || '').trim(),
      city: resolvedCity,
      district: resolvedDistrict,
      state: resolvedState,
      country: (country || 'India').trim(),
      pincode: (pincode || '').trim(),
      latitude: latitude != null && latitude !== '' ? Number(latitude) : null,
      longitude: longitude != null && longitude !== '' ? Number(longitude) : null,
      purpose: Array.isArray(purposes) ? purposes.join(' • ') : (purposes || 'Home'),
      purposes: Array.isArray(purposes) ? purposes : [purposes || 'Home'],
      personaDefault: personas.length > 0 ? personas : ['daily_life'],
      custom: true
    };

    const updated = [newLoc, ...customList];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return newLoc;
  },

  updateCustomLocation(id, { name, address, area = '', city = '', district = '', state = '', country = '', pincode = '', latitude, longitude, purposes = [], personas = [] }) {
    const customList = this.getCustomLocations();
    const cleanAddress = (address || '').trim();
    const parts = cleanAddress.split(',');
    const resolvedDistrict = (district || parts[0] || 'Custom Area').trim();
    const resolvedState = (state || parts[1] || 'India').trim();
    const resolvedCity = (city || resolvedDistrict).trim();

    const updated = customList.map(loc => {
      if (loc.id === id) {
        return {
          ...loc,
          name: (name || loc.name || 'My Location').trim(),
          address: cleanAddress || loc.address,
          area: area !== '' ? area.trim() : (loc.area || ''),
          city: resolvedCity || loc.city,
          district: resolvedDistrict || loc.district,
          state: resolvedState || loc.state,
          country: (country || loc.country || 'India').trim(),
          pincode: pincode !== '' ? pincode.trim() : (loc.pincode || ''),
          latitude: latitude != null && latitude !== '' ? Number(latitude) : loc.latitude,
          longitude: longitude != null && longitude !== '' ? Number(longitude) : loc.longitude,
          purpose: Array.isArray(purposes) ? purposes.join(' • ') : (purposes || loc.purpose),
          purposes: Array.isArray(purposes) ? purposes : [purposes],
          personaDefault: personas && personas.length > 0 ? personas : loc.personaDefault
        };
      }
      return loc;
    });

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated.find(l => l.id === id);
  },

  deleteCustomLocation(id) {
    const customList = this.getCustomLocations();
    const updated = customList.filter(l => l.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  },

  getAllLocations() {
    const custom = this.getCustomLocations();
    if (custom && custom.length > 0) {
      return custom;
    }
    return [DEFAULT_USER_LOCATION];
  }
};

