export const ACTIVITY_TYPES = [
  { id: 'running', label: 'Running', icon: 'Footprints', defaultDuration: 60, personaAffinity: ['fitness', 'health'], sensitivities: { maxTemp: 32, maxUv: 7, maxRain: 15, maxAqi: 120 } },
  { id: 'walking', label: 'Walking', icon: 'Footprints', defaultDuration: 45, personaAffinity: ['fitness', 'health', 'family'], sensitivities: { maxTemp: 34, maxUv: 8, maxRain: 25, maxAqi: 150 } },
  { id: 'cycling', label: 'Cycling', icon: 'Bike', defaultDuration: 60, personaAffinity: ['fitness', 'commute'], sensitivities: { maxTemp: 33, maxWind: 25, maxRain: 20, maxAqi: 130 } },
  { id: 'college', label: 'College', icon: 'GraduationCap', defaultDuration: 300, personaAffinity: ['commute'], sensitivities: { commuteRain: 40, fogVis: 2.0 } },
  { id: 'school', label: 'School / Kids', icon: 'Baby', defaultDuration: 360, personaAffinity: ['family'], sensitivities: { maxTemp: 38, maxAqi: 100, rainTransit: 30 } },
  { id: 'office', label: 'Office', icon: 'Briefcase', defaultDuration: 480, personaAffinity: ['commute'], sensitivities: { commuteRain: 40, fogVis: 2.0 } },
  { id: 'commute', label: 'Commute / Transit', icon: 'Car', defaultDuration: 60, personaAffinity: ['commute'], sensitivities: { rainRisk: 50, fogVis: 1.5, windRisk: 40 } },
  { id: 'travel', label: 'Travel / Outstation', icon: 'Plane', defaultDuration: 180, personaAffinity: ['travel'], sensitivities: { destRain: 50, flightVis: 1.0 } },
  { id: 'outdoor_event', label: 'Outdoor Event', icon: 'PartyPopper', defaultDuration: 120, personaAffinity: ['events', 'family'], sensitivities: { rainRisk: 30, windRisk: 28, tempComfort: [18, 32] } },
  { id: 'farm_work', label: 'Agriculture / Farm Work', icon: 'Sprout', defaultDuration: 240, personaAffinity: ['agriculture'], sensitivities: { sprayWind: 18, soilMoisture: true, rainDelay: 60 } },
  { id: 'beach', label: 'Beach Activity', icon: 'Palmtree', defaultDuration: 120, personaAffinity: ['travel'], sensitivities: { tideRisk: true, uvAlert: 8, stormWind: 30 } },
  { id: 'sports', label: 'Sports', icon: 'Trophy', defaultDuration: 90, personaAffinity: ['fitness', 'events'], sensitivities: { wetField: 30, extremeHeat: 36 } },
  { id: 'indoor', label: 'Indoor Work / Study', icon: 'Building2', defaultDuration: 240, personaAffinity: ['health', 'family'], sensitivities: { aqiIndoor: 180, heatWave: 40 } },
  { id: 'other', label: 'Other Activity', icon: 'Clock', defaultDuration: 60, personaAffinity: [], sensitivities: {} }
];

export const ROUTE_BASED_ACTIVITY_TYPES = [
  'running',
  'walking',
  'cycling',
  'commute',
  'travel',
  'outdoor_event'
];

export function isRouteBasedActivity(type) {
  return ROUTE_BASED_ACTIVITY_TYPES.includes(type);
}

export const DEFAULT_ROUTINE = [
  {
    id: 'act-1',
    type: 'running',
    label: 'Morning Run',
    startTime: '06:30 AM',
    endTime: '07:30 AM',
    isRoute: true,
    startLocation: 'Home Base',
    endLocation: 'Local Park & Ground',
    location: 'Home Base → Local Park & Ground',
    locationId: 'user-primary-location',
    notes: 'Warmup & 5km aerobic run'
  },
  {
    id: 'act-2',
    type: 'college',
    label: 'College Classes & Lab',
    startTime: '09:00 AM',
    endTime: '03:00 PM',
    isRoute: false,
    location: 'Academic / Workplace Campus',
    locationId: 'user-primary-location',
    notes: 'Computer Science block'
  },
  {
    id: 'act-3',
    type: 'commute',
    label: 'Evening Commute',
    startTime: '04:30 PM',
    endTime: '05:30 PM',
    isRoute: true,
    startLocation: 'Academic Campus',
    endLocation: 'Home Base',
    location: 'Academic Campus → Home Base',
    locationId: 'user-primary-location',
    notes: 'Two-wheeler / Bus transit'
  },
  {
    id: 'act-4',
    type: 'outdoor_event',
    label: 'Community Outdoor Event',
    startTime: '07:00 PM',
    endTime: '09:00 PM',
    isRoute: true,
    startLocation: 'Home Base',
    endLocation: 'Community Outdoor Ground',
    location: 'Home Base → Community Outdoor Ground',
    locationId: 'user-primary-location',
    notes: 'Cultural gathering & sports meetup'
  },
  {
    id: 'act-5',
    type: 'indoor',
    label: 'Night Relaxation',
    startTime: '10:00 PM',
    endTime: '11:30 PM',
    isRoute: false,
    location: 'Home Base',
    locationId: 'user-primary-location',
    notes: 'Rest & review'
  }
];
