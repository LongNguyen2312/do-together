import { StyleSheet } from 'react-native';
import { ms } from 'react-native-size-matters';

import { fonts, fs, type AppColors } from '@/theme';

const SCREEN_PADDING = ms(16);
const GRID_GAP = ms(10);
const AVATAR = ms(24);

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
    pressed: {
      opacity: 0.85,
      transform: [{ scale: 0.97 }],
    },

    header: {
      height: ms(56),
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: ms(8),
    },
    headerLeft: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: ms(4),
    },
    iconButton: {
      width: ms(40),
      height: ms(40),
      borderRadius: ms(20),
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitle: {
      flexShrink: 1,
      fontSize: fs(17),
      lineHeight: fs(22),
      fontFamily: fonts.semibold,
      letterSpacing: -0.3,
      color: colors.text,
    },
    scroll: {
      paddingHorizontal: SCREEN_PADDING,
      paddingTop: ms(8),
      paddingBottom: ms(16),
      gap: ms(14),
    },
    heading: {
      marginBottom: -ms(10),
      fontSize: fs(21),
      lineHeight: fs(26),
      fontFamily: fonts.bold,
      letterSpacing: -0.4,
      color: colors.text,
    },
    subheading: {
      fontSize: fs(13.5),
      lineHeight: fs(19),
      fontFamily: fonts.regular,
      color: colors.textSecondary,
    },

    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: GRID_GAP,
    },
    // Three per row: 30% leaves room for the gaps, flexGrow fills the rest.
    tile: {
      flexBasis: '30%',
      flexGrow: 1,
      minHeight: ms(88),
      alignItems: 'center',
      justifyContent: 'center',
      gap: ms(6),
      paddingHorizontal: ms(6),
      borderRadius: ms(14),
      backgroundColor: colors.card,
      ...softShadow,
    },
    tileSelected: {
      backgroundColor: colors.primarySoft,
    },
    tileCheck: {
      position: 'absolute',
      top: ms(6),
      right: ms(6),
      width: ms(16),
      height: ms(16),
      borderRadius: ms(8),
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primary,
    },
    tileEmoji: {
      fontSize: fs(22),
      lineHeight: fs(28),
    },
    tileLabel: {
      fontSize: fs(12.5),
      lineHeight: fs(16),
      fontFamily: fonts.semibold,
      color: colors.text,
    },
    tileLabelOn: {
      color: colors.primaryDark,
    },

    card: {
      gap: ms(10),
      padding: ms(16),
      borderRadius: ms(18),
      backgroundColor: colors.card,
      ...softShadow,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: ms(8),
    },
    cardTitleRow: {
      flexShrink: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: ms(6),
    },
    cardTitle: {
      flexShrink: 1,
      fontSize: fs(14.5),
      lineHeight: fs(20),
      fontFamily: fonts.semibold,
      color: colors.text,
    },
    hint: {
      fontSize: fs(11),
      lineHeight: fs(14),
      fontFamily: fonts.medium,
      color: colors.textSecondary,
    },
    instantRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: ms(6),
    },
    instantText: {
      fontSize: fs(11),
      lineHeight: fs(14),
      fontFamily: fonts.semibold,
      color: colors.primary,
    },

    pillWrap: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: ms(8),
    },
    pill: {
      paddingHorizontal: ms(14),
      paddingVertical: ms(8),
      borderRadius: ms(999),
      backgroundColor: colors.surfaceMuted,
    },
    pillRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: ms(4),
    },
    pillOn: {
      backgroundColor: colors.primary,
    },
    pillText: {
      fontSize: fs(12.5),
      lineHeight: fs(16),
      fontFamily: fonts.medium,
      color: colors.text,
    },
    pillTextOn: {
      fontFamily: fonts.semibold,
      color: colors.white,
    },
    durationRow: {
      flexDirection: 'row',
      gap: ms(8),
    },
    durationPill: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: ms(8),
      borderRadius: ms(12),
      backgroundColor: colors.surfaceMuted,
    },

    noteInput: {
      minHeight: ms(84),
      padding: ms(12),
      borderRadius: ms(12),
      fontSize: fs(13.5),
      lineHeight: fs(19),
      fontFamily: fonts.regular,
      color: colors.text,
      backgroundColor: colors.surface,
    },
    noteCounter: {
      marginTop: -ms(4),
      textAlign: 'right',
    },

    radiusBadge: {
      paddingHorizontal: ms(8),
      paddingVertical: ms(2),
      borderRadius: ms(8),
      backgroundColor: colors.surfaceHigh,
    },
    radiusBadgeText: {
      fontSize: fs(12.5),
      lineHeight: fs(17),
      fontFamily: fonts.bold,
      color: colors.text,
    },
    scaleRow: {
      marginTop: -ms(8),
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    nearbyRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: ms(8),
      paddingHorizontal: ms(12),
      paddingVertical: ms(8),
      borderRadius: ms(12),
      backgroundColor: `${colors.primarySoft}99`,
    },
    nearbyInfo: {
      flexShrink: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: ms(8),
    },
    nearbyEmoji: {
      fontSize: fs(15),
      lineHeight: fs(20),
    },
    nearbyText: {
      flexShrink: 1,
      fontSize: fs(12.5),
      lineHeight: fs(16),
      fontFamily: fonts.semibold,
      color: colors.primaryDark,
    },
    avatarStack: {
      flexDirection: 'row',
    },
    avatar: {
      width: AVATAR,
      height: AVATAR,
      borderRadius: AVATAR / 2,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1.5,
      borderColor: colors.card,
      backgroundColor: colors.surfaceHigh,
    },
    avatarOverlap: {
      marginLeft: -ms(6),
    },
    avatarText: {
      fontSize: fs(8.5),
      fontFamily: fonts.bold,
      color: colors.textSecondary,
    },

    footer: {
      paddingHorizontal: SCREEN_PADDING,
      paddingTop: ms(10),
      backgroundColor: colors.background,
      shadowColor: colors.black,
      shadowOpacity: 0.04,
      shadowRadius: ms(12),
      shadowOffset: { width: 0, height: -ms(4) },
      elevation: 8,
    },
  });
}
