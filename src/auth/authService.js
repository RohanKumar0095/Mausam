/**
 * MAUSAM Authentication & Session Service (Local Prototype with Future Backend API Hook)
 */

const STORAGE_KEYS = {
  USER: 'mausam_user',
  AUTH: 'mausam_auth',
  PREFERENCES: 'mausam_preferences',
  PERSONAS: 'mausam_personas',
  LOCATIONS: 'mausam_locations',
  ROUTINE: 'mausam_routine',
  LANGUAGE: 'mausam_language'
};

export const authService = {
  getCurrentUser() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.USER);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  },

  getAuthState() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.AUTH);
      return data ? JSON.parse(data) : { isAuthenticated: false };
    } catch (e) {
      return { isAuthenticated: false };
    }
  },

  getLanguage() {
    return localStorage.getItem(STORAGE_KEYS.LANGUAGE) || 'English';
  },

  setLanguage(lang) {
    localStorage.setItem(STORAGE_KEYS.LANGUAGE, lang);
  },

  getSavedPreferences() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PREFERENCES);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  },

  getSavedPersonas() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PERSONAS);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  },

  getSavedLocations() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.LOCATIONS);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  },

  getSavedRoutine() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ROUTINE);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  },

  signup({ emailOrPhone, password, language = 'English' }) {
    const tempUser = {
      emailOrPhone,
      passwordHash: btoa(password), // simulated hash
      language,
      createdAt: new Date().toISOString(),
      step: 'otp_pending'
    };
    localStorage.setItem('mausam_temp_signup', JSON.stringify(tempUser));
    return { success: true, message: 'OTP sent successfully' };
  },

  verifyOtp(otp) {
    // Accepts mock OTP '123456' or any 6-digit number in demo
    if (otp === '123456' || otp.length === 6) {
      return { success: true };
    }
    return { success: false, error: 'Invalid verification code. Please try 123456.' };
  },

  saveUserId(userId) {
    let temp = {};
    try {
      temp = JSON.parse(localStorage.getItem('mausam_temp_signup') || '{}');
    } catch (e) {}

    const user = {
      ...temp,
      userId: userId.trim().toLowerCase(),
      step: 'onboarding_pending'
    };
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    localStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify({ isAuthenticated: true }));
    return { success: true, user };
  },

  savePersonalization({ personas, preferences, locations, routine }) {
    if (personas) localStorage.setItem(STORAGE_KEYS.PERSONAS, JSON.stringify(personas));
    if (preferences) localStorage.setItem(STORAGE_KEYS.PREFERENCES, JSON.stringify(preferences));
    if (locations) localStorage.setItem(STORAGE_KEYS.LOCATIONS, JSON.stringify(locations));
    if (routine) localStorage.setItem(STORAGE_KEYS.ROUTINE, JSON.stringify(routine));

    const currentUser = this.getCurrentUser() || { userId: 'mausam_user' };
    currentUser.step = 'completed';
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(currentUser));
    localStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify({ isAuthenticated: true }));
  },

  login({ userIdOrPhone, password }) {
    const user = this.getCurrentUser();
    // In prototype, allow login if user matches or provide demo login
    if (user && (user.userId === userIdOrPhone.toLowerCase() || user.emailOrPhone === userIdOrPhone)) {
      localStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify({ isAuthenticated: true }));
      return { success: true, user };
    }

    // Default mock user if logging in directly in prototype
    const mockUser = {
      userId: userIdOrPhone.toLowerCase() || 'rohan_weather',
      emailOrPhone: userIdOrPhone,
      language: this.getLanguage(),
      step: 'completed',
      createdAt: new Date().toISOString()
    };
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(mockUser));
    localStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify({ isAuthenticated: true }));
    return { success: true, user: mockUser };
  },

  logout() {
    localStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify({ isAuthenticated: false }));
  },

  resetAll() {
    localStorage.clear();
  }
};
