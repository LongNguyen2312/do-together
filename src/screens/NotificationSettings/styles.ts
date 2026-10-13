import { StyleSheet } from 'react-native';
import { ms } from 'react-native-size-matters';

import { fonts, fs, type AppColors } from '@/theme';

const SCREEN_PADDING = ms(16);
const ICON_TILE = ms(34);

export type NotificationSettingsStyles = ReturnType<typeof createStyles>;

export function createStyles(colors: AppColors) {
  return StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scroll: {
      paddingHorizontal: SCREEN_PADDING,
      paddingTop: ms(16),
      paddingBottom: ms(40),
    },
    sectionTitle: {
      marginTop: ms(24),
      marginBottom: ms(8),
      marginLeft: ms(4),
      fontSize: fs(13),
      fontFamily: fonts.semibold,
      letterSpacing: 0.2,
      textTransform: 'uppercase',
      color: colors.textMuted,
    },
    card: {
      paddingHorizontal: ms(14),
      borderRadius: ms(18),
      borderCurve: 'continuous',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      backgroundColor: colors.card,
    },
    // Switched off as a whole while everything's paused.
    cardOff: {
      opacity: 0.45,
    },
    row: {
      minHeight: ms(60),
      flexDirection: 'row',
      alignItems: 'center',
      gap: ms(12),
    },
    divider: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
    },
    iconTile: {
      width: ICON_TILE,
      height: ICON_TILE,
      borderRadius: ms(10),
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primarySoft,
    },
    iconTilePaused: {
      backgroundColor: colors.surfaceMuted,
    },
    body: {
      flex: 1,
      paddingVertical: ms(10),
    },
    label: {
      fontSize: fs(14),
      fontFamily: fonts.medium,
      color: colors.text,
    },
    hint: {
      marginTop: ms(2),
      fontSize: fs(12),
      lineHeight: fs(16),
      fontFamily: fonts.regular,
      color: colors.textSecondary,
    },
    note: {
      marginTop: ms(16),
      marginHorizontal: ms(4),
      fontSize: fs(12),
      lineHeight: fs(17),
      fontFamily: fonts.regular,
      color: colors.textMuted,
    },
  });
}
