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

import { LOCATIONS } from './data/mockWeatherData';
import { PRESET_PROFILES } from './data/presetProfiles';
import { DEFAULT_ROUTINE } from './data/routineData';
import { customLocationStore } from './data/customLocationStore';
import { getRankedWidgets } from './engine/personalizationEngine';
import { generateDailyBriefing } from './engine/briefingEngine';
import { generateContextualNudge } from './engine/nudgeEngine';
import { evaluateSafetyOverride } from './engine/safetyOverrideSystem';
import { derivePersonasFromPreferences } from './engine/personaDerivationEngine';
import { authService } from './auth/authService';

export default function App() {
  // Navigation & Screen Router
  const [currentScreen, setCurrentScreen] = useState('welcome');

  // User Profile & Authentication State
  const [currentUser, setCurrentUser] = useState(() => authService.getCurrentUser());
  const [currentLanguage, setCurrentLanguage] = useState(() => authService.getLanguage());
  const [signupContact, setSignupContact] = useState('');
  const [collectedPreferences, setCollectedPreferences] = useState(null);
  const [derivedPersonas, setDerivedPersonas] = useState(['daily_life']);

  // Main Weather App State
  const [activeTab, setActiveTab] = useState('home');
  const [currentLocationId, setCurrentLocationId] = useState('loc-gaya');
  const [selectedPersonas, setSelectedPersonas] = useState(['daily_life']);
  const [currentTime, setCurrentTime] = useState('06:30');
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
  const [explainingWidget, setExplainingWidget] = useState(null);
  const [dismissedNudgeId, setDismissedNudgeId] = useState(null);

  // Check saved session on startup
  useEffect(() => {
    const user = authService.getCurrentUser();
    const auth = authService.getAuthState();
    const savedPersonas = authService.getSavedPersonas();
    const savedRoutine = authService.getSavedRoutine();

    if (savedPersonas && savedPersonas.length > 0) {
      setSelectedPersonas(savedPersonas);
      setDerivedPersonas(savedPersonas);
    }
    if (savedRoutine && savedRoutine.length > 0) {
      setRoutine(savedRoutine);
    }

    if (auth.isAuthenticated && user && user.step === 'completed') {
      setCurrentUser(user);
      setCurrentScreen('main');
    }
  }, []);

  // Current Weather Data for selected location (resolving from both preset and custom locations)
  const weatherData = useMemo(() => {
    const all = customLocationStore.getAllLocations();
    return all.find(l => l.id === currentLocationId) || LOCATIONS[0];
  }, [currentLocationId]);

  // Determine current active activity based on time
  const currentActivity = useMemo(() => {
    const [currH, currM] = currentTime.split(':').map(Number);
    const currMin = (currH || 0) * 60 + (currM || 0);

    return routine.find(act => {
      const [startH, startM] = act.startTime.split(':').map(Number);
      const [endH, endM] = act.endTime.split(':').map(Number);
      const startMin = (startH || 0) * 60 + (startM || 0);
      const endMin = (endH || 0) * 60 + (endM || 0);
      return currMin >= startMin && currMin < endMin;
    }) || routine[0];
  }, [routine, currentTime]);

  // Compute Ranked Widgets via Rule-Based Personalization Engine
  const rankedWidgets = useMemo(() => {
    return getRankedWidgets({
      selectedPersonas,
      currentActivity,
      currentTime,
      weatherData,
      locationPurpose: weatherData.purpose,
      severeWarningActive: simulatedSeverity === 'RED',
      selectedPlot
    });
  }, [selectedPersonas, currentActivity, currentTime, weatherData, simulatedSeverity, selectedPlot]);

  // Generate Daily Briefing
  const briefingText = useMemo(() => {
    return generateDailyBriefing({
      currentTime,
      currentActivity,
      weatherData,
      selectedPersonas,
      selectedPlot
    });
  }, [currentTime, currentActivity, weatherData, selectedPersonas, selectedPlot]);

  // Generate Contextual Nudge
  const nudge = useMemo(() => {
    const rawNudge = generateContextualNudge({
      currentTime,
      currentActivity,
      weatherData,
      selectedPersonas,
      selectedPlot
    });
    if (rawNudge && rawNudge.id === dismissedNudgeId) return null;
    return rawNudge;
  }, [currentTime, currentActivity, weatherData, selectedPersonas, dismissedNudgeId, selectedPlot]);

  // Evaluate Safety Hierarchy (Green / Amber / Red)
  const safetyInfo = useMemo(() => {
    return evaluateSafetyOverride({
      weatherData,
      simulatedSeverity,
      currentActivity,
      selectedPersonas
    });
  }, [weatherData, simulatedSeverity, currentActivity, selectedPersonas]);

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
    setCurrentLocationId(profile.locationId);
    setCurrentTime(profile.timeSimulation);
    if (profile.routine) setRoutine(profile.routine);
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
    const derived = derivePersonasFromPreferences(answers);
    setDerivedPersonas(derived);
    setSelectedPersonas(derived);
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
        currentTime={currentTime}
        onTimeChange={setCurrentTime}
        activeProfileId={activeProfileId}
        onSelectProfile={handleSelectProfile}
        simulatedSeverity={simulatedSeverity}
        onToggleSevereAlert={handleToggleSevereAlert}
        isMobileFramed={isMobileFramed}
        onToggleFrame={() => setIsMobileFramed(!isMobileFramed)}
        onResetOnboarding={() => setCurrentScreen('language')}
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
            currentTime={currentTime}
            onOpenSearch={() => setIsLocationPickerOpen(true)}
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
                currentTime={currentTime}
                safetyInfo={safetyInfo}
                nudge={nudge}
                onExplainWidget={(w) => setExplainingWidget(w)}
                onEditRoutine={() => setIsRoutineEditorOpen(true)}
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
                routine={routine}
              />
            )}

            {activeTab === 'alerts' && (
              <AlertsView
                safetyInfo={safetyInfo}
                weatherData={weatherData}
                routine={routine}
              />
            )}

            {activeTab === 'locations' && (
              <LocationsView
                currentLocationId={currentLocationId}
                onSelectLocation={(locId) => {
                  setCurrentLocationId(locId);
                  setActiveTab('home');
                }}
              />
            )}

            {activeTab === 'radar' && (
              <RadarMapView
                weatherData={weatherData}
              />
            )}
          </main>

          {/* Bottom Navigation */}
          <BottomNav
            activeTab={activeTab === 'radar' ? 'forecast' : activeTab}
            onTabChange={setActiveTab}
            alertCount={safetyInfo.isSevere ? 1 : 0}
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

      <OnboardingModal
        isOpen={isOnboardingOpen}
        onComplete={handleOnboardingComplete}
      />
    </div>
  );
}
