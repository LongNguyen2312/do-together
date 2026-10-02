import { useEffect, useRef } from 'react';

import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setLanguage } from '@/store/slices/appSlice';
import i18n from '@/translations';
import {
  getDeviceLanguage,
  isLanguageCode,
  resolveLanguage,
} from '@/utils/language';

/**
 * Keeps i18n in sync with Redux. On first launch (language === null), seeds
 * and persists the device language once — same pattern as theme.
 */
export function useI18nSync() {
  const dispatch = useAppDispatch();
  const savedLanguage = useAppSelector(state => state.app.language);
  const seededRef = useRef(false);

  useEffect(() => {
    if (seededRef.current || isLanguageCode(savedLanguage)) {
      return;
    }
    seededRef.current = true;
    const deviceLanguage = getDeviceLanguage();
    dispatch(setLanguage(deviceLanguage));
    if (i18n.language !== deviceLanguage) {
      i18n.changeLanguage(deviceLanguage);
    }
  }, [dispatch, savedLanguage]);

  const language = resolveLanguage(savedLanguage);

  useEffect(() => {
    if (isLanguageCode(savedLanguage) && i18n.language !== language) {
      i18n.changeLanguage(language);
    }
  }, [language, savedLanguage]);

  return language;
}
