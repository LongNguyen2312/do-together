import { StyleSheet } from 'react-native';
import { ms } from 'react-native-size-matters';

import { fonts, type AppColors } from '@/theme';
import { MAX_CONTENT_WIDTH } from '@/utils/constants';

export const SCREEN_PADDING = ms(20);
const CARD_RADIUS = ms(24);

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
      height: ms(40),
      marginTop: ms(8),
      marginBottom: ms(8),
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

    cardShadow: {
      borderRadius: CARD_RADIUS,
      backgroundColor: colors.surface,
      shadowColor: colors.black,
      shadowOpacity: 0.08,
      shadowRadius: ms(8),
      shadowOffset: { width: 0, height: ms(2) },
      elevation: 2,
    },
    card: {
      flex: 1,
      borderRadius: CARD_RADIUS,
      overflow: 'hidden',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surface,
    },
    badge: {
      position: 'absolute',
      left: ms(14),
      bottom: ms(10),
      flexDirection: 'row',
      alignItems: 'center',
      gap: ms(6),
      paddingHorizontal: ms(12),
      paddingVertical: ms(6),
      borderRadius: ms(999),
      backgroundColor: colors.card,
      ...softShadow,
    },
    badgeText: {
      fontSize: ms(10),
      lineHeight: ms(12),
      fontFamily: fonts.bold,
      letterSpacing: 0.6,
      textTransform: 'uppercase',
      color: colors.text,
    },

    form: {
      marginTop: ms(24),
      gap: ms(16),
    },
    formCompact: {
      marginTop: ms(8),
    },
    inputAction: {
      width: ms(40),
      height: ms(40),
      marginRight: ms(4),
      alignItems: 'center',
      justifyContent: 'center',
    },
    optionsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: ms(4),
    },
    rememberRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: ms(8),
      paddingVertical: ms(4),
    },
    checkbox: {
      width: ms(20),
      height: ms(20),
      borderRadius: ms(6),
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.card,
      ...softShadow,
    },
    checkboxChecked: {
      backgroundColor: colors.primary,
    },
    rememberText: {
      fontSize: ms(12),
      fontFamily: fonts.regular,
      lineHeight: ms(16),
      color: colors.textWarm,
    },
    forgotText: {
      fontSize: ms(13),
      lineHeight: ms(16),
      fontFamily: fonts.semibold,
      color: colors.primary,
    },
    submit: {
      marginTop: ms(4),
    },

    footer: {
      marginTop: 'auto',
      paddingVertical: ms(14),
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

export type LoginStyles = ReturnType<typeof createStyles>;
