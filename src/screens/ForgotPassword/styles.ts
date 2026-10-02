import { StyleSheet } from 'react-native';
import { ms } from 'react-native-size-matters';

import { fonts, type AppColors } from '@/theme';
import { MAX_CONTENT_WIDTH } from '@/utils/constants';

const SCREEN_PADDING = ms(20);
const CARD_RADIUS = ms(20);
const RING_SIZE = ms(72);
const AVATAR_SIZE = ms(28);

export function createStyles(colors: AppColors) {
  const softShadow = {
    shadowColor: colors.black,
    shadowOpacity: 0.05,
    shadowRadius: ms(4),
    shadowOffset: { width: 0, height: ms(1) },
    elevation: 1,
  };

  return StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: colors.background,
    },
    flex: {
      flex: 1,
    },
    header: {
      width: '100%',
      maxWidth: MAX_CONTENT_WIDTH,
      alignSelf: 'center',
      paddingHorizontal: SCREEN_PADDING,
      paddingVertical: ms(8),
    },
    backButton: {
      width: ms(32),
      height: ms(32),
      borderRadius: ms(16),
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surfaceMuted,
    },
    backButtonPressed: {
      transform: [{ scale: 0.95 }],
    },
    scroll: {
      flexGrow: 1,
      paddingHorizontal: SCREEN_PADDING,
    },
    content: {
      flexGrow: 1,
      width: '100%',
      maxWidth: MAX_CONTENT_WIDTH - SCREEN_PADDING * 2,
      alignSelf: 'center',
      paddingTop: ms(4),
    },

    heroCard: {
      marginTop: ms(8),
      alignItems: 'center',
      paddingHorizontal: ms(20),
      paddingVertical: ms(16),
      borderRadius: CARD_RADIUS,
      overflow: 'hidden',
      backgroundColor: colors.card,
      ...softShadow,
    },
    lockRing: {
      width: RING_SIZE,
      height: RING_SIZE,
      borderRadius: RING_SIZE / 2,
      padding: ms(4),
      marginBottom: ms(12),
      backgroundColor: colors.primarySoft,
    },
    lockInner: {
      flex: 1,
      borderRadius: RING_SIZE / 2,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.card,
    },
    keyBadge: {
      position: 'absolute',
      top: -ms(2),
      right: -ms(2),
      width: ms(22),
      height: ms(22),
      borderRadius: ms(11),
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primary,
    },
    badge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: ms(6),
      paddingHorizontal: ms(10),
      paddingVertical: ms(4),
      borderRadius: ms(999),
      backgroundColor: colors.primarySoft,
    },
    badgeText: {
      fontSize: ms(10),
      lineHeight: ms(12),
      fontFamily: fonts.bold,
      letterSpacing: 0.6,
      textTransform: 'uppercase',
      color: colors.primaryDark,
    },
    title: {
      marginTop: ms(8),
      fontSize: ms(26),
      lineHeight: ms(32),
      fontFamily: fonts.bold,
      letterSpacing: -0.6,
      textAlign: 'center',
      color: colors.text,
    },
    description: {
      marginTop: ms(6),
      fontSize: ms(14),
      fontFamily: fonts.regular,
      lineHeight: ms(20),
      textAlign: 'center',
      color: colors.textWarm,
    },

    formCard: {
      marginTop: ms(16),
      padding: ms(16),
      gap: ms(14),
      borderRadius: CARD_RADIUS,
      backgroundColor: colors.card,
      ...softShadow,
    },
    infoStrip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: ms(10),
      padding: ms(10),
      borderRadius: ms(12),
      backgroundColor: colors.surface,
    },
    infoIcon: {
      width: ms(32),
      height: ms(32),
      borderRadius: ms(16),
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primarySoft,
    },
    infoText: {
      flex: 1,
      fontSize: ms(12),
      fontFamily: fonts.regular,
      lineHeight: ms(16),
      color: colors.textWarm,
    },
    required: {
      fontSize: ms(11),
      lineHeight: ms(14),
      fontFamily: fonts.semibold,
      color: colors.primary,
    },
    clearButton: {
      width: ms(22),
      height: ms(22),
      marginRight: ms(12),
      borderRadius: ms(11),
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surfaceHigh,
    },
    hint: {
      paddingLeft: ms(4),
      fontSize: ms(12),
      fontFamily: fonts.regular,
      lineHeight: ms(16),
      color: colors.textSecondary,
    },

    successBanner: {
      marginTop: ms(16),
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: ms(10),
      padding: ms(14),
      borderRadius: ms(16),
      backgroundColor: colors.mint,
    },
    successTitle: {
      fontSize: ms(15),
      lineHeight: ms(20),
      fontFamily: fonts.semibold,
      color: colors.text,
    },
    successText: {
      marginTop: ms(2),
      fontSize: ms(12),
      fontFamily: fonts.regular,
      lineHeight: ms(16),
      color: colors.textWarm,
    },

    communityCard: {
      alignSelf: 'stretch',
      marginBottom: ms(14),
      flexDirection: 'row',
      alignItems: 'center',
      gap: ms(12),
      padding: ms(14),
      borderRadius: ms(16),
      backgroundColor: colors.surface,
    },
    avatarStack: {
      flexDirection: 'row',
    },
    avatar: {
      width: AVATAR_SIZE,
      height: AVATAR_SIZE,
      borderRadius: AVATAR_SIZE / 2,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: colors.surface,
    },
    avatarOverlap: {
      marginLeft: -ms(8),
    },
    avatarText: {
      fontSize: ms(9),
      fontFamily: fonts.bold,
    },
    communityTitle: {
      fontSize: ms(12),
      lineHeight: ms(16),
      fontFamily: fonts.bold,
      color: colors.text,
    },
    communitySubtitle: {
      fontSize: ms(12),
      fontFamily: fonts.regular,
      lineHeight: ms(16),
      color: colors.textSecondary,
    },

    footer: {
      marginTop: 'auto',
      paddingTop: ms(16),
      paddingBottom: ms(8),
      alignItems: 'center',
      gap: ms(4),
    },
    noAccess: {
      fontSize: ms(12),
      fontFamily: fonts.regular,
      lineHeight: ms(16),
      color: colors.textSecondary,
    },
    supportRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: ms(4),
      paddingVertical: ms(2),
    },
    supportText: {
      fontSize: ms(12),
      lineHeight: ms(16),
      fontFamily: fonts.semibold,
      color: colors.primaryDark,
    },
  });
}
