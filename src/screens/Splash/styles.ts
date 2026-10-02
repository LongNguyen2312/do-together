import { Platform, StyleSheet } from 'react-native';
import { ms } from 'react-native-size-matters';

import { fonts } from '@/theme';

/** Must match LaunchScreen.storyboard, colors.xml and the AppDelegate window. */
export const SPLASH_BACKGROUND = '#F9F9F7';
export const SPLASH_ACCENT = '#FF5A36';
export const SPLASH_GLOW_SOFT = '#FFDAD2';

const WORD_COLOR = '#5B403A';
const TAGLINE_COLOR = '#5F5E5E';

export const LOGO_SIZE = ms(88);
const LOGO_RADIUS = ms(22);
const HALO_INSET = ms(5);

export const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: SPLASH_BACKGROUND,
    overflow: 'hidden',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: ms(16),
  },
  logoWrap: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoHalo: {
    position: 'absolute',
    top: -HALO_INSET,
    left: -HALO_INSET,
    right: -HALO_INSET,
    bottom: -HALO_INSET,
    borderRadius: LOGO_RADIUS + HALO_INSET,
    backgroundColor: SPLASH_ACCENT,
    opacity: 0.12,
  },
  logoCard: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
    borderRadius: LOGO_RADIUS,
    backgroundColor: '#FFFFFF',
    shadowColor: SPLASH_ACCENT,
    shadowOpacity: 0.2,
    shadowRadius: ms(12),
    shadowOffset: { width: 0, height: ms(6) },
    elevation: 10,
  },
  logo: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
    borderRadius: LOGO_RADIUS,
  },
  wordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: ms(22),
  },
  letter: {
    color: WORD_COLOR,
    fontSize: ms(26),
    fontFamily: fonts.bold,
    letterSpacing: -0.6,
    ...(Platform.OS === 'android' ? { includeFontPadding: false } : null),
  },
  letterAccent: {
    color: SPLASH_ACCENT,
  },
  tagline: {
    marginTop: ms(8),
    color: TAGLINE_COLOR,
    fontSize: ms(14),
    lineHeight: ms(20),
    fontFamily: fonts.medium,
    textAlign: 'center',
  },
});
