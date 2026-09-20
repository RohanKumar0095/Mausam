import React, { useState, useMemo, useEffect } from 'react';
import Header from './components/common/Header';
import BottomNav from './components/common/BottomNav';
import DemoControlBar from './components/common/DemoControlBar';
import SideDrawer from './components/common/SideDrawer';
import ExplainModal from './components/common/ExplainModal';
import RoutineEditorModal from './components/routine/RoutineEditorModal';
import LocationSelector from './components/locations/LocationSelector';
import OnboardingModal from './components/onboarding/OnboardingModal';
import ProfileModal from './components/profile/ProfileModal';
import RouteWeatherDetailModal from './components/routine/RouteWeatherDetailModal';
import MausamAssistant from './chatbot/MausamAssistant';
import { useI18n } from './i18n/i18nContext';
import { parseTime } from './utils/timeUtils';

// Auth & Onboarding Flow Screens
import WelcomeScreen from './auth/WelcomeScreen';
import LanguageSelection from './onboarding/LanguageSelection';
import Signup from './auth/Signup';
import OTPVerification from './auth/OTPVerification';
import CreateUserId from './auth/CreateUserId';
import PersonalizationIntro from './onboarding/PersonalizationIntro';
import PreferenceQuestions from './onboarding/PreferenceQuestions';
import LocationSetup from './onboarding/LocationSetup';
import RoutineSetup from './onboarding/RoutineSetup';
import PersonalizationComplete from './onboarding/PersonalizationComplete';
import Login from './auth/Login';

import HomeView from './components/views/HomeView';
import ForecastView from './components/views/ForecastView';
import AlertsView from './components/views/AlertsView';
import LocationsView from './components/views/LocationsView';
import RadarMapView from './components/views/RadarMapView';

import { PREDEFINED_LOCATIONS } from './data/locationsData';
import { PRESET_PROFILES } from './data/presetProfiles';
import { DEFAULT_ROUTINE } from './data/routineData';
import { customLocationStore } from './data/customLocationStore';
import { useWeatherData } from './hooks/useWeatherData';
import { normalizeWeatherResponse } from './services/weatherNormalizer';
import { getRankedWidgets } from './engine/personalizationEngine';
import { evaluateSharedWeatherIntelligence } from './engine/sharedWeatherIntelligence';
import { generateDailyBriefing } from './engine/briefingEngine';
import { generateContextualNudge } from './engine/nudgeEngine';
import { evaluateSafetyOverride } from './engine/safetyOverrideSystem';
import { derivePersonasFromPreferences, getStep1Personas } from './engine/personaDerivationEngine';
import { authService } from './auth/authService';
import { useTimeContext } from './hooks/useTimeContext';
import { alertIntelligenceService } from './services/alertIntelligenceService';
import AlertDetailModal from './components/alerts/AlertDetailModal';
import AlertCenterModal from './components/alerts/AlertCenterModal';

export default function App() {
  const { language, setLanguage } = useI18n();

  // Navigation & Screen Router
  const [currentScreen, setCurrentScreen] = useState('welcome');

  // User Profile & Authentication State
  const [currentUser, setCurrentUser] = useState(() => authService.getCurrentUser());
  const [currentLanguage, setCurrentLanguage] = useState(() => authService.getLanguage());
  const [signupContact, setSignupContact] = useState('');
  const [collectedPreferences, setCollectedPreferences] = useState(() => authService.getSavedPreferences());
  const [derivedPersonas, setDerivedPersonas] = useState(() => getStep1Personas());

  // Authoritative Time Context
  const liveTimeContext = useTimeContext();
  const [simulatedTime, setSimulatedTime] = useState(null);
  const activeCurrentTime = simulatedTime || liveTimeContext.time12h;

  // Alert Intelligence State
  const [alerts, setAlerts] = useState([]);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [isAlertCenterOpen, setIsAlertCenterOpen] = useState(false);

  // Main Weather App State
  const [activeTab, setActiveTab] = useState('home');
  const [currentLocationId, setCurrentLocationId] = useState(() => customLocationStore.getAllLocations()[0]?.id || 'user-primary-location');
  const [selectedPersonas, setSelectedPersonas] = useState(() => getStep1Personas());
  const [routine, setRoutine] = useState(DEFAULT_ROUTINE);
  const [activeProfileId, setActiveProfileId] = useState('daily_life');
  const [selectedPlot, setSelectedPlot] = useState('Plot A (Rice)');

  // Overrides & Modals
  const [simulatedSeverity, setSimulatedSeverity] = useState(null);
  const [isMobileFramed, setIsMobileFramed] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isLocationPickerOpen, setIsLocationPickerOpen] = useState(false);
  const [isRoutineEditorOpen, setIsRoutineEditorOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  const [selectedRouteActivity, setSelectedRouteActivity] = useState(null);
  const [explainingWidget, setExplainingWidget] = useState(null);
  const [dismissedNudgeId, setDismissedNudgeId] = useState(null);

  // Check saved session on startup
  useEffect(() => {
    const user = authService.getCurrentUser();
    const auth = authService.getAuthState();
    const savedPref = authService.getSavedPreferences();
    const savedPersonas = authService.getSavedPersonas();
    const savedRoutine = authService.getSavedRoutine();

    const activeStep1Personas = getStep1Personas(savedPref) || savedPersonas;

    if (activeStep1Personas && activeStep1Personas.length > 0) {
      setSelectedPersonas(activeStep1Personas);
      setDerivedPersonas(activeStep1Personas);
    }
    if (savedRoutine && savedRoutine.length > 0) {
      setRoutine(savedRoutine);
    }

    const allLocs = customLocationStore.getAllLocations();
    if (allLocs && allLocs.length > 0) {
      setCurrentLocationId(prev => allLocs.some(l => l.id === prev) ? prev : allLocs[0].id);
    }

    if (auth.isAuthenticated && user && user.step === 'completed') {
      setCurrentUser(user);
      setCurrentScreen('main');
    }
  }, []);

  // Selected Location metadata - Single Source of Truth from User Location Store
  const selectedLocation = useMemo(() => {
    const all = customLocationStore.getAllLocations();
    return all.find(l => l.id === currentLocationId) || all[0];
  }, [currentLocationId]);

  // Live Weather API Hook
  const {
    weatherData: liveWeatherData,
    isLoading: isWeatherLoading,
    isError: isWeatherError,
    errorInfo: weatherErrorInfo,
    isUVLive,
    refresh: refreshWeather
  } = useWeatherData(selectedLocation);

  // Normalized weather model - uses live API data if available, or location skeleton
  const weatherData = useMemo(() => {
    if (liveWeatherData) return liveWeatherData;
    return normalizeWeatherResponse(null, selectedLocation);
  }, [liveWeatherData, selectedLocation]);

  // Determine current active activity based on time (null-safe if routine is empty)
  const currentActivity = useMemo(() => {
    if (!routine || routine.length === 0) return null;
    const parsedNow = parseTime(activeCurrentTime);
    const currMin = parsedNow.hour24 * 60 + parsedNow.minute;

    return routine.find(act => {
      if (!act || !act.startTime || !act.endTime) return false;
      const startP = parseTime(act.startTime);
      const endP = parseTime(act.endTime);
      const startMin = startP.hour24 * 60 + startP.minute;
      const endMin = endP.hour24 * 60 + endP.minute;
      return currMin >= startMin && currMin < endMin;
    }) || null;
  }, [routine, activeCurrentTime]);

  // Single Source of Truth for Shared Weather Intelligence
  const sharedIntelligence = useMemo(() => {
    return evaluateSharedWeatherIntelligence({
      userId: currentUser?.id || 'usr_demo',
      date: new Date().toISOString().split('T')[0],
      selectedPersonas,
      routine,
      athleteProfile: currentUser,
      weatherData
    });
  }, [weatherData, routine, selectedPersonas, currentUser]);

  // Compute Ranked Widgets via Rule-Based Personalization Engine
  const rankedWidgets = useMemo(() => {
    return getRankedWidgets({
      selectedPersonas,
      currentActivity,
      currentTime: activeCurrentTime,
      weatherData,
      routine,
      sharedIntelligence,
      locationPurpose: weatherData.purpose,
      severeWarningActive: simulatedSeverity === 'RED',
      selectedPlot,
      language
    });
  }, [selectedPersonas, currentActivity, activeCurrentTime, weatherData, routine, sharedIntelligence, simulatedSeverity, selectedPlot, language]);

  // Generate Daily Briefing
  const briefingText = useMemo(() => {
    return generateDailyBriefing({
      currentTime: activeCurrentTime,
      currentActivity,
      weatherData,
      selectedPersonas,
      selectedPlot,
      language,
      routine
    });
  }, [activeCurrentTime, currentActivity, weatherData, selectedPersonas, selectedPlot, language, routine]);

  // Generate Contextual Nudge
  const nudge = useMemo(() => {
    const rawNudge = generateContextualNudge({
      currentTime: activeCurrentTime,
      currentActivity,
      weatherData,
      selectedPersonas,
      selectedPlot,
      language
    });
    if (rawNudge && rawNudge.id === dismissedNudgeId) return null;
    return rawNudge;
  }, [activeCurrentTime, currentActivity, weatherData, selectedPersonas, dismissedNudgeId, selectedPlot, language]);

  // Evaluate Safety Hierarchy (Green / Amber / Red)
  const safetyInfo = useMemo(() => {
    return evaluateSafetyOverride({
      weatherData,
      simulatedSeverity,
      currentActivity,
      selectedPersonas,
      language
    });
  }, [weatherData, simulatedSeverity, currentActivity, selectedPersonas, language]);

  // Evaluate Context-Aware Alert Intelligence Engine
  useEffect(() => {
    const evaluated = alertIntelligenceService.evaluateAlerts({
      weatherData,
      routine,
      selectedPersonas,
      safetyInfo,
      selectedLocation,
      userProfile: currentUser
    });
    setAlerts(evaluated || []);
  }, [weatherData, routine, selectedPersonas, safetyInfo, selectedLocation, currentUser]);

  // Handlers
  const handleTogglePersona = (personaId) => {
    if (selectedPersonas.includes(personaId)) {
      if (selectedPersonas.length > 1) {
        setSelectedPersonas(selectedPersonas.filter(p => p !== personaId));
      }
    } else {
      setSelectedPersonas([...selectedPersonas, personaId]);
    }
  };

  const handleSelectProfile = (profileId) => {
    const profile = PRESET_PROFILES[profileId];
    if (!profile) return;
    setActiveProfileId(profileId);
    setSelectedPersonas(profile.personas);
    const userLocs = customLocationStore.getAllLocations();
    const userPrimary = userLocs[0];
    if (userPrimary) {
      setCurrentLocationId(userPrimary.id);
    }
    setCurrentTime(profile.timeSimulation);
    if (profile.routine) {
      const adaptedRoutine = profile.routine.map(act => ({
        ...act,
        location: userPrimary ? userPrimary.name : act.location,
        locationId: userPrimary ? userPrimary.id : act.locationId
      }));
      setRoutine(adaptedRoutine);
    }
  };

  const handleToggleSevereAlert = () => {
    setSimulatedSeverity(prev => prev === 'RED' ? null : 'RED');
  };

  const handleOnboardingComplete = (data) => {
    setCurrentLocationId(data.locationId);
    setSelectedPersonas(data.personas);
    if (data.routine) setRoutine(data.routine);
    setIsOnboardingOpen(false);
  };

  // Auth & Onboarding Flow Transitions
  const handleQuestionsComplete = (answers) => {
    setCollectedPreferences(answers);
    const step1Personas = getStep1Personas(answers);
    setDerivedPersonas(step1Personas);
    setSelectedPersonas(step1Personas);
    authService.savePersonalization({
      personas: step1Personas,
      preferences: answers
    });
    setCurrentScreen('location_setup');
  };

  const handleLocationsComplete = (locations) => {
    if (locations && locations.length > 0) {
      setCurrentLocationId(locations[0]);
    }
    setCurrentScreen('routine_setup');
  };

  const handleRoutineComplete = (configuredRoutine) => {
    setRoutine(configuredRoutine);
    authService.savePersonalization({
      personas: derivedPersonas,
      preferences: collectedPreferences,
      routine: configuredRoutine
    });
    setCurrentScreen('personalization_complete');
  };

  const handleOpenMausamFromOnboarding = () => {
    setCurrentUser(authService.getCurrentUser());
    setCurrentScreen('main');
  };

  const handleLogout = () => {
    authService.logout();
    setCurrentUser(null);
    setIsProfileModalOpen(false);
    setCurrentScreen('welcome');
  };

  // RENDER SCREEN ROUTER
  if (currentScreen === 'welcome') {
    return (
      <WelcomeScreen
        onGetStarted={() => setCurrentScreen('language')}
        onLogin={() => setCurrentScreen('login')}
        onTryDemo={() => {
          setCurrentUser({ userId: 'demo_judge', emailOrPhone: 'judge@sih.gov.in' });
          setCurrentScreen('main');
        }}
      />
    );
  }

  if (currentScreen === 'language') {
    return (
      <LanguageSelection
        selectedLanguage={currentLanguage}
        onSelectLanguage={(lang) => {
          setCurrentLanguage(lang);
          authService.setLanguage(lang);
        }}
        onContinue={() => setCurrentScreen('signup')}
        onBack={() => setCurrentScreen('welcome')}
      />
    );
  }

  if (currentScreen === 'signup') {
    return (
      <Signup
        onSendOtp={(contact) => {
          setSignupContact(contact);
          setCurrentScreen('otp');
        }}
        onNavigateLogin={() => setCurrentScreen('login')}
        onBack={() => setCurrentScreen('language')}
      />
    );
  }

  if (currentScreen === 'otp') {
    return (
      <OTPVerification
        emailOrPhone={signupContact}
        onVerifySuccess={() => setCurrentScreen('create_userid')}
        onBack={() => setCurrentScreen('signup')}
      />
    );
  }

  if (currentScreen === 'create_userid') {
    return (
      <CreateUserId
        onUserIdCreated={(uid) => {
          setCurrentUser(authService.getCurrentUser());
          setCurrentScreen('personalization_intro');
        }}
        onBack={() => setCurrentScreen('otp')}
      />
    );
  }

  if (currentScreen === 'personalization_intro') {
    return (
      <PersonalizationIntro
        onStartQuestions={() => setCurrentScreen('questions')}
        onBack={() => setCurrentScreen('create_userid')}
      />
    );
  }

  if (currentScreen === 'questions') {
    return (
      <PreferenceQuestions
        onCompleteQuestions={handleQuestionsComplete}
        onBack={() => setCurrentScreen('personalization_intro')}
      />
    );
  }

  if (currentScreen === 'location_setup') {
    return (
      <LocationSetup
        onContinueLocations={handleLocationsComplete}
        onBack={() => setCurrentScreen('questions')}
      />
    );
  }

  if (currentScreen === 'routine_setup') {
    return (
      <RoutineSetup
        onContinueRoutine={handleRoutineComplete}
        onBack={() => setCurrentScreen('location_setup')}
      />
    );
  }

  if (currentScreen === 'personalization_complete') {
    return (
      <PersonalizationComplete
        derivedPersonas={derivedPersonas}
        preferences={collectedPreferences}
        routine={routine}
        onOpenMausam={handleOpenMausamFromOnboarding}
      />
    );
  }

  if (currentScreen === 'login') {
    return (
      <Login
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          setCurrentScreen('main');
        }}
        onNavigateSignup={() => setCurrentScreen('signup')}
        onTryDemo={() => {
          setCurrentUser({ userId: 'demo_judge', emailOrPhone: 'judge@sih.gov.in' });
          setCurrentScreen('main');
        }}
        onBack={() => setCurrentScreen('welcome')}
      />
    );
  }

  // MAIN ADAPTIVE PERSONALIZED MAUSAM HOMEPAGE
  return (
    <div className="min-h-screen bg-slate-950 text-slate-900 font-sans flex flex-col">
      {/* 1. TOP JUDGE DEMO BAR */}
      <DemoControlBar
        currentTime={activeCurrentTime}
        onTimeChange={setSimulatedTime}
        activeProfileId={activeProfileId}
        onSelectProfile={handleSelectProfile}
        simulatedSeverity={simulatedSeverity}
        onToggleSevereAlert={handleToggleSevereAlert}
        isMobileFramed={isMobileFramed}
        onToggleFrame={() => setIsMobileFramed(!isMobileFramed)}
        onResetOnboarding={() => setCurrentScreen('language')}
        onOpenChat={() => setIsChatbotOpen(true)}
      />

      {/* 2. MAIN APP VIEWPORT */}
      <div className="flex-1 flex justify-center items-start p-0 sm:py-4">
        <div className={`w-full transition-all duration-300 ${
          isMobileFramed 
            ? 'max-w-md bg-gradient-to-b from-[#0e4a7b] via-[#1F5C8B] to-[#0a355c] min-h-screen sm:min-h-[860px] sm:rounded-3xl sm:border-[6px] sm:border-slate-800 sm:shadow-2xl overflow-hidden relative' 
            : 'max-w-2xl bg-gradient-to-b from-[#0e4a7b] via-[#1F5C8B] to-[#0a355c] min-h-screen shadow-2xl relative'
        }`}>
          {/* Header */}
          <Header
            locationData={weatherData}
            currentLocationId={currentLocationId}
            onOpenLocationPicker={() => setIsLocationPickerOpen(true)}
            onOpenDrawer={() => setIsDrawerOpen(true)}
            briefingText={briefingText}
            currentTime={activeCurrentTime}
            onOpenSearch={() => setIsLocationPickerOpen(true)}
            activeAlertCount={alerts.filter(a => a.status === 'ACTIVE').length}
            onOpenAlertCenter={() => setIsAlertCenterOpen(true)}
          />

          {/* Tab Views */}
          <main className="mt-1">
            {activeTab === 'home' && (
              <HomeView
                weatherData={weatherData}
                rankedWidgets={rankedWidgets}
                selectedPersonas={selectedPersonas}
                onTogglePersona={handleTogglePersona}
                routine={routine}
                currentTime={activeCurrentTime}
                safetyInfo={safetyInfo}
                alerts={alerts}
                onSelectAlert={(a) => setSelectedAlert(a)}
                onOpenAlertCenter={() => setIsAlertCenterOpen(true)}
                nudge={nudge}
                isWeatherLoading={isWeatherLoading}
                isWeatherError={isWeatherError}
                weatherErrorInfo={weatherErrorInfo}
                isUVLive={isUVLive}
                onRefresh={refreshWeather}
                onExplainWidget={(w) => setExplainingWidget(w)}
                onEditRoutine={() => setIsRoutineEditorOpen(true)}
                onSelectRoutine={(act) => setSelectedRouteActivity(act)}
                onOpenAlerts={() => setActiveTab('alerts')}
                onOpenRadar={() => setActiveTab('radar')}
                onNudgeAction={(tab) => tab && setActiveTab(tab)}
                selectedPlot={selectedPlot}
                onSelectPlot={setSelectedPlot}
              />
            )}

            {activeTab === 'forecast' && (
              <ForecastView
                weatherData={weatherData}
                selectedLocation={selectedLocation}
              />
            )}

            {activeTab === 'alerts' && (
              <AlertsView
                safetyInfo={safetyInfo}
                weatherData={weatherData}
                routine={routine}
                alerts={alerts}
                onSelectAlert={(a) => setSelectedAlert(a)}
              />
            )}

            {activeTab === 'locations' && (
              <LocationsView
                currentLocationId={currentLocationId}
                onSelectLocation={(locId) => {
                  setCurrentLocationId(locId);
                  setActiveTab('home');
                }}
                onOpenChat={() => setIsChatbotOpen(true)}
              />
            )}

            {activeTab === 'radar' && (
              <RadarMapView
                location={selectedLocation}
              />
            )}
          </main>

          {/* Bottom Navigation */}
          <BottomNav
            activeTab={activeTab === 'radar' ? 'forecast' : activeTab}
            onTabChange={setActiveTab}
            alertCount={alerts.filter(a => a.status === 'ACTIVE').length}
            onOpenChat={() => setIsChatbotOpen(true)}
          />
        </div>
      </div>

      {/* 3. MODALS & DRAWERS */}
      <SideDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        currentLocation={weatherData}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          setIsDrawerOpen(false);
        }}
        currentUser={currentUser}
        currentLanguage={currentLanguage}
        onOpenProfile={() => setIsProfileModalOpen(true)}
        onOpenLogin={() => setCurrentScreen('login')}
        onLogout={handleLogout}
      />

      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        currentUser={currentUser}
        currentLanguage={currentLanguage}
        selectedPersonas={selectedPersonas}
        routine={routine}
        onEditPersonalization={() => {
          setIsProfileModalOpen(false);
          setCurrentScreen('questions');
        }}
        onEditRoutine={() => {
          setIsProfileModalOpen(false);
          setIsRoutineEditorOpen(true);
        }}
        onManageLocations={() => {
          setIsProfileModalOpen(false);
          setIsLocationPickerOpen(true);
        }}
        onChangeLanguage={() => {
          setIsProfileModalOpen(false);
          setCurrentScreen('language');
        }}
        onLogout={handleLogout}
      />

      <ExplainModal
        widget={explainingWidget}
        isOpen={!!explainingWidget}
        onClose={() => setExplainingWidget(null)}
        weatherData={weatherData}
        selectedPersonas={selectedPersonas}
      />

      <RoutineEditorModal
        isOpen={isRoutineEditorOpen}
        onClose={() => setIsRoutineEditorOpen(false)}
        routine={routine}
        onSaveRoutine={(newRoutine) => {
          setRoutine(newRoutine);
          authService.savePersonalization({ routine: newRoutine });
        }}
      />

      <LocationSelector
        isOpen={isLocationPickerOpen}
        onClose={() => setIsLocationPickerOpen(false)}
        currentLocationId={currentLocationId}
        onSelectLocation={(locId) => setCurrentLocationId(locId)}
      />

      {/* Daily Routine Journey & Route Weather Modal */}
      <RouteWeatherDetailModal
        isOpen={!!selectedRouteActivity}
        onClose={() => setSelectedRouteActivity(null)}
        activity={selectedRouteActivity}
        baseLocation={selectedLocation}
        weatherData={weatherData}
        safetyInfo={safetyInfo}
        selectedPersonas={selectedPersonas}
        allLocations={customLocationStore.getAllLocations()}
      />

      <OnboardingModal
        isOpen={isOnboardingOpen}
        onComplete={handleOnboardingComplete}
      />

      {/* MAUSAM Weather Assistant Chatbot Modal */}
      <MausamAssistant
        isOpen={isChatbotOpen}
        onClose={() => setIsChatbotOpen(false)}
        user={currentUser}
        selectedPersonas={selectedPersonas}
        currentLocation={weatherData}
        currentTime={activeCurrentTime}
        currentActivity={currentActivity}
        routine={routine}
        savedLocations={customLocationStore.getAllLocations()}
        weatherData={weatherData}
        safetyInfo={safetyInfo}
        isWeatherError={isWeatherError}
      />
    </div>
  );
}
