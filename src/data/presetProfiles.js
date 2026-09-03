export const PRESET_PROFILES = {
  daily_life: {
    id: 'daily_life',
    name: 'Daily Life (Default / Fallback)',
    shortLabel: 'Daily Life',
    personas: ['daily_life'],
    locationId: 'loc-gaya',
    timeSimulation: '09:00',
    routine: [
      {
        id: 'dl-1',
        type: 'school',
        label: 'Morning Chores & Transit',
        startTime: '08:00',
        endTime: '09:30',
        location: 'Civil Lines, Gaya',
        locationId: 'loc-gaya',
        notes: 'Daily routine'
      },
      {
        id: 'dl-2',
        type: 'office',
        label: 'Work & Errands',
        startTime: '10:00',
        endTime: '17:00',
        location: 'Market Road, Gaya',
        locationId: 'loc-gaya',
        notes: 'Normal schedule'
      },
      {
        id: 'dl-3',
        type: 'indoor',
        label: 'Home & Family Time',
        startTime: '18:00',
        endTime: '22:00',
        location: 'Home — Gaya',
        locationId: 'loc-gaya',
        notes: 'Evening rest'
      }
    ]
  },
  sportsperson_only: {
    id: 'sportsperson_only',
    name: 'Sportsperson (Training & Match Conditions)',
    shortLabel: 'Sportsperson',
    personas: ['sportsperson'],
    locationId: 'loc-ranchi-bit',
    timeSimulation: '17:00',
    routine: [
      {
        id: 'sp-1',
        type: 'sports',
        label: 'Morning Warmup & Agility',
        startTime: '06:00',
        endTime: '07:30',
        location: 'Sports Complex Track',
        locationId: 'loc-ranchi-bit',
        notes: 'Sprint drills'
      },
      {
        id: 'sp-2',
        type: 'indoor',
        label: 'Tactical Video & Recovery',
        startTime: '11:00',
        endTime: '14:00',
        location: 'Team Clubhouse',
        locationId: 'loc-ranchi-bit',
        notes: 'Hydration & strategy'
      },
      {
        id: 'sp-3',
        type: 'sports',
        label: 'Main Football Practice & Scrimmage',
        startTime: '17:00',
        endTime: '19:30',
        location: 'Main Stadium Turf',
        locationId: 'loc-ranchi-bit',
        notes: 'Full match simulation'
      }
    ]
  },
  fitness_only: {
    id: 'fitness_only',
    name: 'Fitness (Running & Cardio)',
    shortLabel: 'Fitness',
    personas: ['fitness'],
    locationId: 'loc-gaya',
    timeSimulation: '06:30',
    routine: [
      {
        id: 'fit-1',
        type: 'running',
        label: 'Morning 5km Aerobic Run',
        startTime: '06:00',
        endTime: '07:15',
        location: 'Gaya Riverside Park',
        locationId: 'loc-gaya',
        notes: 'Cardio workout'
      },
      {
        id: 'fit-2',
        type: 'indoor',
        label: 'Office Shift',
        startTime: '09:00',
        endTime: '17:00',
        location: 'Office Hub',
        locationId: 'loc-gaya',
        notes: 'Indoor work'
      },
      {
        id: 'fit-3',
        type: 'walking',
        label: 'Evening Cool-down Walk',
        startTime: '18:30',
        endTime: '19:30',
        location: 'Civil Lines Park',
        locationId: 'loc-gaya',
        notes: 'Light stroll'
      }
    ]
  },
  agriculture_only: {
    id: 'agriculture_only',
    name: 'Agriculture (Paddy & Crop Monitoring)',
    shortLabel: 'Agriculture',
    personas: ['agriculture'],
    locationId: 'loc-gaya-farm',
    timeSimulation: '07:00',
    routine: [
      {
        id: 'ag-1',
        type: 'farm_work',
        label: 'Morning Field Scouting & Moisture Check',
        startTime: '06:00',
        endTime: '09:00',
        location: 'Paddy Field — Plot A',
        locationId: 'loc-gaya-farm',
        notes: 'Rice tillering observation'
      },
      {
        id: 'ag-2',
        type: 'farm_work',
        label: 'Foliar Nutrient Spraying',
        startTime: '09:30',
        endTime: '12:00',
        location: 'Plot A & B',
        locationId: 'loc-gaya-farm',
        notes: 'Optimum wind window'
      },
      {
        id: 'ag-3',
        type: 'farm_work',
        label: 'Canal Irrigation Gate Maintenance',
        startTime: '16:30',
        endTime: '18:30',
        location: 'Drainage Channel 2',
        locationId: 'loc-gaya-farm',
        notes: 'Water level control'
      }
    ]
  },
  fitness_health: {
    id: 'fitness_health',
    name: 'Fitness + Health',
    shortLabel: 'Fitness + Health',
    personas: ['fitness', 'health'],
    locationId: 'loc-delhi',
    timeSimulation: '06:30',
    routine: [
      {
        id: 'fh-1',
        type: 'running',
        label: 'Morning Park Jog',
        startTime: '06:00',
        endTime: '07:30',
        location: 'Lodhi Gardens, Delhi',
        locationId: 'loc-delhi',
        notes: 'Check AQI before cardio'
      },
      {
        id: 'fh-2',
        type: 'indoor',
        label: 'Office & Lab',
        startTime: '09:30',
        endTime: '17:30',
        location: 'Lodhi Road Complex',
        locationId: 'loc-delhi',
        notes: 'Indoor air filtered'
      }
    ]
  },
  sport_fitness_health: {
    id: 'sport_fitness_health',
    name: 'Sportsperson + Fitness + Health',
    shortLabel: 'Sport + Fit + Health',
    personas: ['sportsperson', 'fitness', 'health'],
    locationId: 'loc-ranchi-bit',
    timeSimulation: '17:00',
    routine: [
      {
        id: 'sfh-1',
        type: 'running',
        label: 'Morning Endurance Run',
        startTime: '06:30',
        endTime: '07:30',
        location: 'BIT Athletic Track',
        locationId: 'loc-ranchi-bit',
        notes: 'Early morning cardio'
      },
      {
        id: 'sfh-2',
        type: 'sports',
        label: 'Evening Competitive Match',
        startTime: '17:00',
        endTime: '19:30',
        location: 'Main BIT Sports Ground',
        locationId: 'loc-ranchi-bit',
        notes: 'Monitor WBGT and hydration'
      }
    ]
  },
  agri_health: {
    id: 'agri_health',
    name: 'Agriculture + Health',
    shortLabel: 'Agri + Health',
    personas: ['agriculture', 'health'],
    locationId: 'loc-gaya-farm',
    timeSimulation: '11:30',
    routine: [
      {
        id: 'ah-1',
        type: 'farm_work',
        label: 'Field Weed Control',
        startTime: '07:00',
        endTime: '11:00',
        location: 'Plot A — Gaya Farm',
        locationId: 'loc-gaya-farm',
        notes: 'Crop action checklist'
      },
      {
        id: 'ah-2',
        type: 'indoor',
        label: 'Heat Avoidance Rest',
        startTime: '11:30',
        endTime: '15:30',
        location: 'Farm Shaded Shed',
        locationId: 'loc-gaya-farm',
        notes: 'High midday UV protection'
      }
    ]
  },
  fitness_commute: {
    id: 'fitness_commute',
    name: 'Fitness + Commute',
    shortLabel: 'Fitness + Commute',
    personas: ['fitness', 'commute'],
    locationId: 'loc-patna',
    timeSimulation: '16:30',
    routine: [
      {
        id: 'fc-1',
        type: 'running',
        label: 'Morning Riverfront Jog',
        startTime: '06:00',
        endTime: '07:15',
        location: 'Ganga Pathway, Patna',
        locationId: 'loc-patna',
        notes: 'Comfort index optimal'
      },
      {
        id: 'fc-2',
        type: 'office',
        label: 'Office Shift',
        startTime: '09:00',
        endTime: '16:30',
        location: 'Bailey Road',
        locationId: 'loc-patna',
        notes: 'Corporate office'
      },
      {
        id: 'fc-3',
        type: 'commute',
        label: 'Evening Rush Hour Transit',
        startTime: '16:30',
        endTime: '17:45',
        location: 'Bailey Road → Kankarbagh',
        locationId: 'loc-patna',
        notes: 'Rain and road waterlogging check'
      }
    ]
  },
  travel_events: {
    id: 'travel_events',
    name: 'Beach & Travel + Events',
    shortLabel: 'Travel + Events',
    personas: ['travel', 'events'],
    locationId: 'loc-mumbai',
    timeSimulation: '15:00',
    routine: [
      {
        id: 'te-1',
        type: 'beach',
        label: 'Marine Drive Coastal Stroll',
        startTime: '14:30',
        endTime: '17:00',
        location: 'Marine Drive Promenade',
        locationId: 'loc-mumbai',
        notes: 'Check high tide (15:45)'
      },
      {
        id: 'te-2',
        type: 'outdoor_event',
        label: 'Outdoor Music & Dinner Gathering',
        startTime: '19:00',
        endTime: '22:00',
        location: 'Gateway Waterfront Lawn',
        locationId: 'loc-mumbai',
        notes: 'Evening wind and rain risk'
      }
    ]
  },
  sih_primary: {
    id: 'sih_primary',
    name: 'SIH Scenario (Fitness + Health + Commute)',
    shortLabel: 'SIH Scenario',
    personas: ['fitness', 'health', 'commute'],
    locationId: 'loc-gaya',
    timeSimulation: '06:30',
    routine: [
      {
        id: 'sih-1',
        type: 'running',
        label: 'Morning Run',
        startTime: '06:30',
        endTime: '07:30',
        location: 'Park — Gaya',
        locationId: 'loc-gaya',
        notes: 'Aerobic park run'
      },
      {
        id: 'sih-2',
        type: 'college',
        label: 'College Classes & Lab',
        startTime: '09:00',
        endTime: '15:00',
        location: 'Gaya College Campus',
        locationId: 'loc-gaya',
        notes: 'Academic sessions'
      },
      {
        id: 'sih-3',
        type: 'commute',
        label: 'Evening Commute',
        startTime: '16:30',
        endTime: '17:30',
        location: 'Home → College Corridor',
        locationId: 'loc-gaya',
        notes: 'Transit window'
      },
      {
        id: 'sih-4',
        type: 'outdoor_event',
        label: 'Outdoor Cultural Event',
        startTime: '19:00',
        endTime: '21:00',
        location: 'Gandhi Maidan, Gaya',
        locationId: 'loc-gaya',
        notes: 'Community gathering'
      }
    ]
  }
};
