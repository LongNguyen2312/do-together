import { I18nManager, Platform, Settings } from 'react-native';

import type { LanguageOption } from '@/types/language';

export const LANGUAGE_OPTIONS: LanguageOption[] = [
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'vi', label: 'Tiếng Việt', flag: '🇻🇳' },
];

export function getLanguageOption(
  code: LanguageOption['code'],
): LanguageOption {
  return (
    LANGUAGE_OPTIONS.find(option => option.code === code) ?? LANGUAGE_OPTIONS[0]
  );
}

function pushLocale(out: string[], value: unknown) {
  if (typeof value === 'string' && value.trim()) {
    out.push(value.trim());
  } else if (Array.isArray(value)) {
    for (const item of value) {
      pushLocale(out, item);
    }
  }
}

/** Collect preferred locale tags from every native/JS source we can reach. */
function collectDeviceLocales(): string[] {
  const locales: string[] = [];

  // NativeModules.* is empty under bridgeless (new architecture), so read the
  // TurboModule-backed APIs instead.
  try {
    if (Platform.OS === 'ios') {
      // Preferred languages first — AppleLocale is often missing on modern iOS.
      pushLocale(locales, Settings.get('AppleLanguages'));
      pushLocale(locales, Settings.get('AppleLocale'));
    } else {
      pushLocale(locales, I18nManager.getConstants().localeIdentifier);
    }
  } catch {
    // fall through
  }

  try {
    pushLocale(locales, Intl.DateTimeFormat().resolvedOptions().locale);
  } catch {
    // ignore
  }

  return locales;
}

function primaryLanguageTag(locale: string): string {
  return locale.replace(/_/g, '-').toLowerCase().split('-')[0] ?? '';
}

/**
 * Map device locale → app language.
 * Vietnamese tags: vi, vi-VN, vi_VN, vie, …
 */
export function getDeviceLanguage(): LanguageOption['code'] {
  // Locales are in the user's preference order: the first one we support
  // wins, so ["en-VN", "vi-VN"] resolves to English.
  for (const locale of collectDeviceLocales()) {
    const primary = primaryLanguageTag(locale);
    if (primary === 'vi' || primary === 'vie') {
      return 'vi';
    }
    if (primary === 'en' || primary === 'eng') {
      return 'en';
    }
  }

  return 'en';
}

export function resolveLanguage(
  saved: LanguageOption['code'] | null | undefined,
): LanguageOption['code'] {
  // Until first-launch seed persists, fall back to the device language.
  return saved ?? getDeviceLanguage();
}

export function isLanguageCode(
  value: unknown,
): value is LanguageOption['code'] {
  return value === 'en' || value === 'vi';
}
