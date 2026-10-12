export const API_BASE_URL = 'https://api.example.com';
/**
 * Public URL of the Cloudflare R2 bucket with the story music, no trailing
 * slash. Songs and their list go in its music/ folder; the list's source is
 * scripts/music/manifest.json, uploaded by hand along with new songs.
 */
export const MUSIC_BASE_URL =
  'https://pub-cf44691d4c52430289ab0192fb092766.r2.dev';
export const DEBOUNCE_DELAY = 400;

/** Forms and CTAs stop stretching past this width on tablets. */
export const MAX_CONTENT_WIDTH = 480;
/** Below this window height, screens drop decorative blocks to fit. */
export const COMPACT_HEIGHT = 740;

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PASSWORD_MIN_LENGTH = 6;

export function isValidEmail(value: string): boolean {
  return EMAIL_REGEX.test(value.trim());
}

export function isValidPassword(value: string): boolean {
  return value.length >= PASSWORD_MIN_LENGTH;
}

/** Dev only: reset onboarding and sign out on every launch. */
export const FORCE_ONBOARDING = __DEV__ && true;
