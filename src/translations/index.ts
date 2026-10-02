import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import { getDeviceLanguage } from '@/utils/language';

import en from './en.json';
import vi from './vi.json';

i18n.use(initReactI18next).init({
  compatibilityJSON: 'v4',
  resources: {
    en: { translation: en },
    vi: { translation: vi },
  },
  lng: getDeviceLanguage(),
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
