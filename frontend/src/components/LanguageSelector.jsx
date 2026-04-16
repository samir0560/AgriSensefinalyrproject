import React from 'react';
import { useI18n } from '../i18n/i18nContext';

const LanguageSelector = () => {
  const { locale, changeLocale, availableLocales } = useI18n();

  const getLanguageName = (localeCode) => {
    switch (localeCode) {
      case 'en':
        return 'English';
      case 'es':
        return 'Español';
      case 'hi':
        return 'हिंदी';
      case 'ne':
        return 'नेपाली';
      case 'te':
        return 'తెలుగు';
      default:
        return localeCode;
    }
  };

  const handleLocaleChange = (e) => {
    changeLocale(e.target.value);
  };

  return (
    <div className="language-selector">
      <select
        value={locale}
        onChange={handleLocaleChange}
        className="language-select"
      >
        {availableLocales.map((loc) => (
          <option key={loc} value={loc}>
            {getLanguageName(loc)}
          </option>
        ))}
      </select>
    </div>
  );
};

export default LanguageSelector;