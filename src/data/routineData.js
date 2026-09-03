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

export const DEFAULT_ROUTINE = [
  {
    id: 'act-1',
    type: 'running',
    label: 'Morning Run',
    startTime: '06:30',
    endTime: '07:30',
    location: 'Park — Gaya',
    locationId: 'loc-gaya-park',
    notes: 'Warmup & 5km aerobic run'
  },
  {
    id: 'act-2',
    type: 'college',
    label: 'College Classes & Lab',
    startTime: '09:00',
    endTime: '15:00',
    location: 'Gaya College',
    locationId: 'loc-gaya',
    notes: 'Computer Science block'
  },
  {
    id: 'act-3',
    type: 'commute',
    label: 'Evening Commute',
    startTime: '16:30',
    endTime: '17:30',
    location: 'Home → College Transit',
    locationId: 'loc-gaya-commute',
    notes: 'Two-wheeler / Bus transit'
  },
  {
    id: 'act-4',
    type: 'outdoor_event',
    label: 'Community Outdoor Event',
    startTime: '19:00',
    endTime: '21:00',
    location: 'Gaya Gandhi Maidan',
    locationId: 'loc-gaya',
    notes: 'Cultural gathering & sports meetup'
  },
  {
    id: 'act-5',
    type: 'indoor',
    label: 'Night Relaxation',
    startTime: '22:00',
    endTime: '23:30',
    location: 'Home — Gaya',
    locationId: 'loc-gaya',
    notes: 'Rest & review'
  }
];
