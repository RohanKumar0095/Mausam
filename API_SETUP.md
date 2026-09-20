# MAUSAM — Live Weather & UV API Integration Guide

This guide explains how to configure, test, and maintain the live external weather and UV API data layer in the MAUSAM Personalized Weather Application.

---

## 1. Where to Enter API Keys

Open the .env file in the root folder of the project (Desktop/mausam/.env):

`ash
# Weather API Key (e.g., WeatherAPI.com, OpenWeatherMap, or compatible REST provider)
VITE_WEATHER_API_KEY=your_actual_weather_api_key_here

# UV API Key (e.g., OpenUV, WeatherAPI, or compatible REST UV provider)
VITE_UV_API_KEY=your_actual_uv_api_key_here

# Optional Base URLs (defaults are pre-configured)
VITE_WEATHER_API_BASE_URL=https://api.weatherapi.com/v1
VITE_UV_API_BASE_URL=https://api.openuv.io/api/v1
`

> **IMPORTANT**: Never commit the .env file to Git. The .gitignore file is already configured to keep .env and .env.local strictly local.

---

## 2. Restart Vite Server After Changing .env

Vite reads environment variables only when the development server boots. After adding or editing .env:

`ash
# Stop current server (Ctrl+C), then restart:
npm run dev
`

---

## 3. Data Flow Architecture

`
USER / SAVED LOCATION
        ↓
LOCATION COORDINATES (Latitude & Longitude)
        ↓
┌─────────────────────────────────────────┐
│  weatherService.js    +   uvService.js  │
│  (Safe HTTP client + Cache + Abort Ctrl)│
└─────────────────────────────────────────┘
        ↓
┌─────────────────────────────────────────┐
│  weatherNormalizer.js + uvNormalizer.js │
│  (Adapts external payloads into standard│
│   Common MAUSAM Weather Data Model)     │
└─────────────────────────────────────────┘
        ↓
COMMON MAUSAM WEATHER DATA MODEL
        ↓
┌─────────────────────────────────────────┐
│  EXISTING PERSONALIZATION ENGINE        │
│  - Multi-Persona Blending               │
│  - Daily Activity Routine Alignment     │
│  - Relevance & Action Scoring           │
│  - Safety Hierarchy (Green/Amber/Red)   │
│  - Dynamic Hindi/English Briefings      │
└─────────────────────────────────────────┘
        ↓
PERSONALIZED MAUSAM HOMEPAGE & CHATBOT
`

---

## 4. Location Coordinates

The application automatically resolves geographical coordinates before issuing API requests:
- **Gaya — Civil Lines**: 24.7955°N, 85.0002°E
- **Gaya Rural — Agricultural Belt**: 24.7500°N, 84.9500°E
- **Patna — Bailey Road**: 25.5941°N, 85.1376°E
- **Birla Institute of Technology (Ranchi)**: 23.4123°N, 85.4399°E
- **Mumbai — Marine Drive**: 18.9438°N, 72.8232°E
- **New Delhi — Mausam Bhawan**: 28.5892°N, 77.2250°E
- **Custom Locations**: Supports user-entered coordinates or browser GPS detection (
avigator.geolocation).

---

## 5. Normalized MAUSAM Weather Model

Downstream personalization engines and UI components consume a standardized contract:

`js
{
  id: "loc-gaya",
  name: "Gaya — Civil Lines",
  district: "Gaya",
  state: "Bihar",
  latitude: 24.7955,
  longitude: 85.0002,
  purpose: "Home & Daily Life",
  current: {
    temp: 28.4,
    feelsLike: 31.0,
    maxTemp: 33.5,
    minTemp: 22.8,
    humidity: 78,
    windSpeed: 9,
    windDirection: "SSW",
    windDegree: 200,
    pressure: 1009,
    visibility: 5.2,
    uvIndex: 6,
    aqi: 68,
    aqiStatus: "Satisfactory",
    condition: "Partly Cloudy",
    conditionCode: "partly_cloudy",
    rainfall24h: 1.2,
    rainProbability: 25,
    updatedAt: "12:00 PM"
  },
  uv: {
    index: 6,
    category: "High",
    isLive: true
  },
  forecast3Hourly: [ ... ],
  dailyForecast: [ ... ],
  astronomy: { sunrise, sunset, moonrise, moonset, moonPhase },
  warning: { level: "GREEN" | "AMBER" | "RED", headline, description },
  metadata: {
    source: "Live Weather API",
    isLive: true,
    fetchedAt: 1725379200000
  }
}
`

---

## 6. Error & Offline Handling

- **Missing / Unconfigured Key**: Shows an informative setup banner in English/Hindi without crashing.
- **UV Failure**: If the UV API fails or reaches limit while Weather API succeeds, the application renders weather normally and marks UV as unavailable.
- **Network Outage**: Displays friendly connection error message ("Weather data unavailable. Please check your connection.").
- **Zero Mock Fallback at Runtime**: The application never reverts to fake mock data on failure.

---

## 7. Security Note on Frontend VITE_* Variables

Variables prefixed with VITE_ are injected into the client bundle by Vite. In this prototype architecture:
- Keys are treated as demonstration credentials.
- API keys are never printed to console, never displayed in UI, and never included in error logs.
- In future production deployment with official IMD/MoES APIs, API calls will route through a backend proxy sidecar.

---

## 8. Future Migration to Official IMD / MoES APIs

To switch to official IMD/MoES data in the future:
1. Update src/services/weatherService.js to point to the IMD endpoint.
2. Update src/services/weatherNormalizer.js to map IMD's response format to the **same** Common MAUSAM Weather Data Model.
3. The UI components, personalization engine, scoring algorithms, widget ranking, and bilingual translations require **zero changes**.
