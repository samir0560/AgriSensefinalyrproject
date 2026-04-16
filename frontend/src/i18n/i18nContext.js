import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import translations from './translations';

const I18nContext = createContext();

/** BCP 47 tags for dates and Intl */
const LOCALE_DATE_MAP = {
  en: 'en-US',
  es: 'es',
  hi: 'hi-IN',
  ne: 'ne-NP',
  te: 'te-IN',
};

export const useI18n = () => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within I18nProvider');
  }
  return context;
};

export const I18nProvider = ({ children }) => {
  const [locale, setLocale] = useState(() => {
    return localStorage.getItem('locale') || 'en';
  });

  const messages = useMemo(() => {
    const base = translations.en || {};
    const override = translations[locale] || {};
    return { ...base, ...override };
  }, [locale]);

  const t = useCallback((key) => messages[key] ?? key, [messages]);

  const dateLocale = LOCALE_DATE_MAP[locale] || locale || 'en-US';

  const changeLocale = (newLocale) => {
    setLocale(newLocale);
    localStorage.setItem('locale', newLocale);
  };

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const value = {
    t,
    locale,
    dateLocale,
    changeLocale,
    availableLocales: Object.keys(translations),
  };

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};
