import { Platform, StyleSheet } from 'react-native';
import { ms } from 'react-native-size-matters';

import { fonts, type AppColors } from '@/theme';
import { MAX_CONTENT_WIDTH } from '@/utils/constants';

export const SCREEN_PADDING = ms(24);
const CARD_RADIUS = ms(24);
const AVATAR_SIZE = ms(24);

const softShadow = (color: string) => ({
  shadowColor: color,
  shadowOpacity: 0.08,
  shadowRadius: ms(8),
  shadowOffset: { width: 0, height: ms(2) },
  elevation: 2,
});

export function createStyles(colors: AppColors) {
  return StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      height: ms(40),
      marginTop: ms(8),
      paddingHorizontal: SCREEN_PADDING,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    brand: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: ms(8),
    },
    brandLogo: {
      width: ms(18),
      height: ms(18),
    },
    brandName: {
      fontSize: ms(18),
      fontFamily: fonts.bold,
      letterSpacing: -0.3,
      color: colors.primary,
    },
    skipBtn: {
      paddingHorizontal: ms(14),
      paddingVertical: ms(6),
      borderRadius: ms(999),
      backgroundColor: colors.surface,
    },
    skipBtnPressed: {
      opacity: 0.7,
    },
    skipText: {
      fontSize: ms(13),
      fontFamily: fonts.semibold,
      color: colors.textSecondary,
    },
    body: {
      flex: 1,
      justifyContent: 'center',
      // Sit the block a little above true centre.
      paddingBottom: ms(56),
    },
    pager: {
      flexGrow: 0,
    },
    page: {
      paddingHorizontal: SCREEN_PADDING,
      alignItems: 'center',
    },
    cardShadow: {
      borderRadius: CARD_RADIUS,
      backgroundColor: colors.surface,
      ...softShadow(colors.black),
    },
    card: {
      flex: 1,
      borderRadius: CARD_RADIUS,
      overflow: 'hidden',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surface,
    },
    heroImage: {
      width: '100%',
      height: '100%',
    },
    badge: {
      position: 'absolute',
      left: ms(16),
      bottom: ms(12),
      flexDirection: 'row',
      alignItems: 'center',
      gap: ms(6),
      paddingHorizontal: ms(12),
      paddingVertical: ms(6),
      borderRadius: ms(999),
      backgroundColor: colors.card,
      ...softShadow(colors.black),
    },
    badgeText: {
      fontSize: ms(10),
      lineHeight: ms(12),
      fontFamily: fonts.bold,
      letterSpacing: 0.6,
      textTransform: 'uppercase',
      color: colors.text,
    },
    dots: {
      flexDirection: 'row',
      alignSelf: 'center',
      alignItems: 'center',
      gap: ms(8),
      marginTop: ms(20),
      marginBottom: ms(48),
    },
    dot: {
      height: ms(6),
      borderRadius: ms(3),
    },
    copyLayer: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      alignItems: 'center',
      paddingHorizontal: SCREEN_PADDING + ms(8),
    },
    title: {
      fontSize: ms(26),
      lineHeight: ms(32),
      fontFamily: fonts.bold,
      letterSpacing: -0.65,
      color: colors.text,
      textAlign: 'center',
    },
    description: {
      marginTop: ms(8),
      maxWidth: ms(320),
      fontSize: ms(14),
      fontFamily: fonts.regular,
      lineHeight: ms(22),
      color: colors.textSecondary,
      textAlign: 'center',
    },
    highlights: {
      marginTop: ms(16),
      flexDirection: 'row',
      alignItems: 'center',
      gap: ms(8),
      paddingVertical: ms(6),
      paddingLeft: ms(8),
      paddingRight: ms(14),
      borderRadius: ms(999),
      backgroundColor: colors.surfaceMuted,
    },
    avatars: {
      flexDirection: 'row',
    },
    avatar: {
      width: AVATAR_SIZE,
      height: AVATAR_SIZE,
      borderRadius: AVATAR_SIZE / 2,
      borderWidth: 2,
      borderColor: colors.surfaceMuted,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarOverlap: {
      marginLeft: -ms(8),
    },
    avatarEmoji: {
      fontSize: ms(11),
      fontFamily: fonts.regular,
    },
    highlightsText: {
      fontSize: ms(11),
      lineHeight: ms(14),
      fontFamily: fonts.semibold,
      color: colors.text,
    },
    footer: {
      width: '100%',
      maxWidth: MAX_CONTENT_WIDTH,
      alignSelf: 'center',
      paddingHorizontal: SCREEN_PADDING,
      paddingTop: ms(8),
      paddingBottom: ms(12),
    },

    // "Together" hero
    freeCard: {
      width: '70%',
      padding: ms(14),
      borderRadius: ms(20),
      backgroundColor: colors.card,
      gap: ms(10),
      ...softShadow(colors.black),
    },
    freeHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: ms(10),
    },
    freeAvatar: {
      width: ms(36),
      height: ms(36),
      borderRadius: ms(18),
      backgroundColor: colors.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    freeAvatarEmoji: {
      fontSize: ms(18),
      fontFamily: fonts.regular,
    },
    freeName: {
      fontSize: ms(14),
      fontFamily: fonts.bold,
      color: colors.text,
    },
    freeStatus: {
      fontSize: ms(11),
      fontFamily: fonts.regular,
      color: colors.textMuted,
    },
    freeActivity: {
      fontSize: ms(17),
      fontFamily: fonts.bold,
      letterSpacing: -0.3,
      color: colors.text,
    },
    chips: {
      flexDirection: 'row',
      gap: ms(6),
    },
    chip: {
      paddingHorizontal: ms(8),
      paddingVertical: ms(4),
      borderRadius: ms(999),
      backgroundColor: colors.surface,
    },
    chipText: {
      fontSize: ms(11),
      fontFamily: fonts.semibold,
      color: colors.textSecondary,
    },
    broadcasting: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: ms(8),
    },
    broadcastingText: {
      flexShrink: 1,
      fontSize: ms(11),
      fontFamily: fonts.semibold,
      color: colors.primary,
    },
    floatingEmoji: {
      position: 'absolute',
      width: ms(34),
      height: ms(34),
      borderRadius: ms(17),
      backgroundColor: colors.card,
      alignItems: 'center',
      justifyContent: 'center',
      ...softShadow(colors.black),
    },
    floatingEmojiText: {
      fontSize: ms(16),
      fontFamily: fonts.regular,
    },

    // Matching hero
    radarRing: {
      position: 'absolute',
      borderWidth: 1,
      borderColor: colors.primary,
    },
    pin: {
      position: 'absolute',
      width: ms(52),
      height: ms(52),
      borderRadius: ms(26),
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: colors.primary,
      shadowOpacity: 0.35,
      shadowRadius: ms(10),
      shadowOffset: { width: 0, height: ms(4) },
      elevation: 6,
    },
    person: {
      position: 'absolute',
      width: ms(44),
      height: ms(44),
      borderRadius: ms(22),
      borderWidth: 3,
      borderColor: colors.card,
      alignItems: 'center',
      justifyContent: 'center',
      ...softShadow(colors.black),
    },
    personEmoji: {
      fontSize: ms(20),
      fontFamily: fonts.regular,
      ...(Platform.OS === 'android' ? { includeFontPadding: false } : null),
    },
    personTag: {
      position: 'absolute',
      paddingHorizontal: ms(8),
      paddingVertical: ms(4),
      borderRadius: ms(999),
      backgroundColor: colors.card,
      ...softShadow(colors.black),
    },
    personTagText: {
      fontSize: ms(10),
      fontFamily: fonts.bold,
      color: colors.text,
    },
  });
}

export type OnboardingStyles = ReturnType<typeof createStyles>;
