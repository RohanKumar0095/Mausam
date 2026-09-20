/**
 * PREDEFINED MAUSAM LOCATIONS
 * Contains accurate geographical coordinates (latitude & longitude)
 * for live weather and UV API data retrieval.
 */

export const PREDEFINED_LOCATIONS = [
  {
    id: 'loc-gaya',
    name: 'Gaya — Civil Lines (Home / Base)',
    district: 'Gaya',
    state: 'Bihar',
    latitude: 24.7955,
    longitude: 85.0002,
    purpose: 'Home & Daily Life',
    purposes: ['Home', 'Daily Life'],
    personaDefault: ['family', 'fitness', 'health']
  },
  {
    id: 'loc-gaya-farm',
    name: 'Gaya Rural — Agricultural Belt',
    district: 'Gaya',
    state: 'Bihar',
    latitude: 24.7500,
    longitude: 84.9500,
    purpose: 'Agriculture & Farm Operations',
    purposes: ['Agriculture', 'Farm Operations'],
    personaDefault: ['agriculture', 'health']
  },
  {
    id: 'loc-patna',
    name: 'Patna — Bailey Road (Office Hub)',
    district: 'Patna',
    state: 'Bihar',
    latitude: 25.5941,
    longitude: 85.1376,
    purpose: 'Office & Commute Route',
    purposes: ['Office', 'Commute'],
    personaDefault: ['commute', 'health']
  },
  {
    id: 'loc-ranchi-bit',
    name: 'Birla Institute of Technology, circular road',
    district: 'Ranchi',
    state: 'Jharkhand',
    latitude: 23.4123,
    longitude: 85.4399,
    purpose: 'Academic & Tech Hub',
    purposes: ['Academic', 'Tech Hub'],
    personaDefault: ['fitness', 'commute', 'health']
  },
  {
    id: 'loc-mumbai',
    name: 'Mumbai — Marine Drive (Travel Destination)',
    district: 'Mumbai',
    state: 'Maharashtra',
    latitude: 18.9438,
    longitude: 72.8232,
    purpose: 'Coastal Travel & Leisure',
    purposes: ['Coastal Travel', 'Leisure'],
    personaDefault: ['travel', 'events']
  },
  {
    id: 'loc-delhi',
    name: 'New Delhi — Mausam Bhawan, Lodhi Road',
    district: 'New Delhi',
    state: 'Delhi',
    latitude: 28.5892,
    longitude: 77.2250,
    purpose: 'Capital HQ & Urban Life',
    purposes: ['Capital HQ', 'Urban Life'],
    personaDefault: ['health', 'commute', 'family']
  }
];

export const DEFAULT_USER_LOCATION = {
  id: 'user-primary-location',
  name: 'My Primary Location',
  district: 'Local Area',
  state: 'India',
  latitude: 28.6139,
  longitude: 77.2090,
  purpose: 'Home & Daily Life',
  purposes: ['Home', 'Daily Life'],
  personaDefault: ['family', 'fitness', 'health']
};

export const DEFAULT_LOCATION = DEFAULT_USER_LOCATION;

