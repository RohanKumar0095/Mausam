import React, { createContext, useContext, useState, useEffect } from 'react';
import { TRANSLATIONS } from './translations';
import { authService } from '../auth/authService';

const I18nContext = createContext({
  language: 'en',
  setLanguage: () => {},
  t: (key) => key
});

export function I18nProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    const saved = localStorage.getItem('mausam_language') || authService.getLanguage();
    if (saved === 'Hindi' || saved === 'hi') return 'hi';
    return 'en';
  });

  const setLanguage = (lang) => {
    const code = (lang === 'Hindi' || lang === 'hi') ? 'hi' : 'en';
    setLanguageState(code);
    localStorage.setItem('mausam_language', code);
    authService.setLanguage(code === 'hi' ? 'Hindi' : 'English');
  };

  const t = (key, defaultText = '') => {
    const dict = TRANSLATIONS[language] || TRANSLATIONS.en;
    if (dict && dict[key] !== undefined) {
      return dict[key];
    }
    const fallback = TRANSLATIONS.en[key];
    return fallback !== undefined ? fallback : (defaultText || key);
  };

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
