import { StyleSheet } from 'react-native';
import { ms } from 'react-native-size-matters';

import { fonts, type AppColors } from '@/theme';
import { MAX_CONTENT_WIDTH } from '@/utils/constants';

const SCREEN_PADDING = ms(20);
const AVATAR_SIZE = ms(28);

export function createStyles(colors: AppColors) {
  const softShadow = {
    shadowColor: colors.black,
    shadowOpacity: 0.05,
    shadowRadius: ms(3),
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
    scroll: {
      flexGrow: 1,
      paddingHorizontal: SCREEN_PADDING,
    },
    content: {
      flexGrow: 1,
      width: '100%',
      maxWidth: MAX_CONTENT_WIDTH - SCREEN_PADDING * 2,
      alignSelf: 'center',
    },

    header: {
      width: '100%',
      maxWidth: MAX_CONTENT_WIDTH,
      alignSelf: 'center',
      flexDirection: 'row',
      alignItems: 'center',
      gap: ms(12),
      paddingHorizontal: SCREEN_PADDING,
      paddingVertical: ms(8),
      backgroundColor: colors.background,
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
    communityBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: ms(6),
      paddingHorizontal: ms(10),
      paddingVertical: ms(5),
      borderRadius: ms(999),
      backgroundColor: colors.primarySoft,
    },
    communityBadgeText: {
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
      color: colors.text,
    },
    subtitle: {
      marginTop: ms(4),
      fontSize: ms(14),
      fontFamily: fonts.regular,
      lineHeight: ms(20),
      color: colors.textWarm,
    },

    proofBanner: {
      marginTop: ms(12),
      flexDirection: 'row',
      alignItems: 'center',
      gap: ms(8),
      padding: ms(8),
      paddingRight: ms(12),
      borderRadius: ms(12),
      backgroundColor: colors.surfaceMuted,
    },
    avatarStack: {
      flexDirection: 'row',
    },
    avatar: {
      width: AVATAR_SIZE,
      height: AVATAR_SIZE,
      borderRadius: AVATAR_SIZE / 2,
      borderWidth: 2,
      borderColor: colors.card,
    },
    avatarOverlap: {
      marginLeft: -ms(8),
    },
    proofText: {
      flex: 1,
      fontSize: ms(11),
      lineHeight: ms(14),
      fontFamily: fonts.semibold,
      letterSpacing: 0.2,
      color: colors.text,
    },

    form: {
      marginTop: ms(16),
      gap: ms(12),
    },
    formCompact: {
      marginTop: ms(12),
      gap: ms(10),
    },
    inputAction: {
      width: ms(40),
      height: ms(40),
      marginRight: ms(4),
      alignItems: 'center',
      justifyContent: 'center',
    },
    strength: {
      marginTop: ms(2),
      paddingHorizontal: ms(4),
      gap: ms(4),
    },
    strengthBars: {
      flexDirection: 'row',
      gap: ms(4),
    },
    strengthBar: {
      flex: 1,
      height: ms(4),
      borderRadius: ms(2),
      backgroundColor: colors.border,
    },
    strengthRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    strengthMax: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: ms(4),
    },
    strengthText: {
      fontSize: ms(11),
      lineHeight: ms(14),
      fontFamily: fonts.semibold,
      letterSpacing: 0.2,
    },

    termsRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: ms(10),
    },
    checkbox: {
      width: ms(20),
      height: ms(20),
      marginTop: ms(1),
      borderRadius: ms(6),
      borderWidth: 1,
      borderColor: 'transparent',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.card,
      ...softShadow,
    },
    checkboxChecked: {
      backgroundColor: colors.primary,
    },
    checkboxError: {
      borderColor: colors.danger,
    },
    termsText: {
      flex: 1,
      fontSize: ms(12),
      fontFamily: fonts.regular,
      lineHeight: ms(20),
      color: colors.textWarm,
    },
    termsLink: {
      fontFamily: fonts.semibold,
      color: colors.text,
      textDecorationLine: 'underline',
    },
    termsError: {
      marginTop: ms(4),
      marginLeft: ms(30),
      fontSize: ms(12),
      fontFamily: fonts.regular,
      lineHeight: ms(16),
      color: colors.danger,
    },
    submit: {
      marginTop: ms(4),
    },

    footer: {
      marginTop: 'auto',
      paddingTop: ms(16),
      paddingBottom: ms(12),
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: ms(4),
    },
    footerText: {
      fontSize: ms(14),
      fontFamily: fonts.regular,
      lineHeight: ms(20),
      color: colors.textSecondary,
    },
    footerLink: {
      fontSize: ms(15),
      lineHeight: ms(20),
      fontFamily: fonts.semibold,
      color: colors.primary,
    },
  });
}
