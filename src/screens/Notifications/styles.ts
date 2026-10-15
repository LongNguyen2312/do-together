import { StyleSheet } from 'react-native';
import { ms } from 'react-native-size-matters';

import { fonts, fs, type AppColors } from '@/theme';

const SCREEN_PADDING = ms(16);
const AVATAR = ms(50);
const KIND_BADGE = ms(22);
const UNREAD_DOT = ms(9);
const EMPTY_ART = ms(132);

export type NotificationsStyles = ReturnType<typeof createStyles>;

export function createStyles(colors: AppColors) {
  return StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: colors.background,
    },
    pressed: {
      opacity: 0.7,
    },
    // Beside the title in the header: the unread count.
    countBadge: {
      minWidth: ms(20),
      height: ms(20),
      paddingHorizontal: ms(6),
      borderRadius: ms(10),
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primary,
    },
    countBadgeText: {
      fontSize: fs(11.5),
      fontFamily: fonts.bold,
      color: colors.white,
      fontVariant: ['tabular-nums'],
    },

    // The same chips as the chat list.
    filters: {
      gap: ms(8),
      paddingHorizontal: SCREEN_PADDING,
      paddingTop: ms(12),
      paddingBottom: ms(6),
    },
    filter: {
      height: ms(30),
      flexDirection: 'row',
      alignItems: 'center',
      gap: ms(5),
      paddingHorizontal: ms(13),
      borderRadius: ms(999),
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: `${colors.text}1A`,
      backgroundColor: `${colors.text}0A`,
    },
    filterActive: {
      borderColor: colors.primary,
      backgroundColor: colors.primary,
    },
    filterText: {
      fontSize: fs(12),
      fontFamily: fonts.semibold,
      color: colors.text,
    },
    filterTextActive: {
      color: colors.white,
    },
    filterCount: {
      fontSize: fs(11),
      fontFamily: fonts.bold,
      color: colors.primary,
    },

    paused: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: ms(12),
      marginHorizontal: SCREEN_PADDING,
      marginTop: ms(12),
      padding: ms(14),
      borderRadius: ms(18),
      borderCurve: 'continuous',
      backgroundColor: colors.surface,
    },
    pausedBody: {
      flex: 1,
      gap: ms(2),
    },
    pausedTitle: {
      fontSize: fs(14),
      fontFamily: fonts.semibold,
      color: colors.text,
    },
    pausedText: {
      fontSize: fs(12.5),
      lineHeight: fs(17),
      fontFamily: fonts.regular,
      color: colors.textSecondary,
    },
    pausedButton: {
      height: ms(32),
      paddingHorizontal: ms(14),
      borderRadius: ms(16),
      justifyContent: 'center',
      backgroundColor: colors.primary,
    },
    pausedButtonText: {
      fontSize: fs(12.5),
      fontFamily: fonts.semibold,
      color: colors.white,
    },

    section: {
      paddingHorizontal: SCREEN_PADDING,
      paddingTop: ms(20),
      paddingBottom: ms(6),
      fontSize: fs(15),
      fontFamily: fonts.bold,
      color: colors.text,
    },

    row: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: ms(12),
      paddingHorizontal: SCREEN_PADDING,
      paddingVertical: ms(12),
    },
    // Unread: lightly tinted, like the reference designs.
    rowUnread: {
      backgroundColor: `${colors.primary}0F`,
    },
    rowPressed: {
      backgroundColor: colors.surface,
    },
    avatar: {
      width: AVATAR,
      height: AVATAR,
      borderRadius: AVATAR / 2,
    },
    art: {
      width: AVATAR,
      height: AVATAR,
      borderRadius: AVATAR / 2,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primarySoft,
    },
    artEmoji: {
      fontSize: fs(22),
    },
    kindBadge: {
      position: 'absolute',
      right: -ms(3),
      bottom: -ms(3),
      width: KIND_BADGE,
      height: KIND_BADGE,
      borderRadius: KIND_BADGE / 2,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: ms(2),
      borderColor: colors.background,
    },
    kindBadgeEmoji: {
      fontSize: fs(11),
    },
    body: {
      flex: 1,
      gap: ms(4),
    },
    text: {
      fontSize: fs(14),
      lineHeight: fs(20),
      fontFamily: fonts.regular,
      color: colors.text,
    },
    bold: {
      fontFamily: fonts.semibold,
    },
    quote: {
      paddingLeft: ms(8),
      borderLeftWidth: ms(2),
      borderLeftColor: colors.border,
      fontSize: fs(13),
      lineHeight: fs(18),
      fontFamily: fonts.regular,
      color: colors.textSecondary,
    },
    time: {
      fontSize: fs(12),
      fontFamily: fonts.medium,
      color: colors.textMuted,
    },
    timeUnread: {
      fontFamily: fonts.semibold,
      color: colors.primary,
    },
    unreadDot: {
      width: UNREAD_DOT,
      height: UNREAD_DOT,
      marginTop: ms(6),
      borderRadius: UNREAD_DOT / 2,
      backgroundColor: colors.primary,
    },
    answers: {
      flexDirection: 'row',
      gap: ms(8),
      marginTop: ms(6),
    },
    answer: {
      flex: 1,
      height: ms(34),
      borderRadius: ms(12),
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surfaceMuted,
    },
    answerPrimary: {
      backgroundColor: colors.primary,
    },
    answerText: {
      fontSize: fs(13),
      fontFamily: fonts.semibold,
      color: colors.text,
    },
    answerTextPrimary: {
      color: colors.white,
    },

    empty: {
      alignItems: 'center',
      paddingHorizontal: ms(36),
      paddingTop: ms(56),
    },
    // Soft rings round the bell.
    emptyArt: {
      width: EMPTY_ART,
      height: EMPTY_ART,
      borderRadius: EMPTY_ART / 2,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: `${colors.primary}10`,
    },
    emptyArtInner: {
      width: EMPTY_ART * 0.7,
      height: EMPTY_ART * 0.7,
      borderRadius: EMPTY_ART * 0.35,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primarySoft,
    },
    emptyTitle: {
      marginTop: ms(22),
      fontSize: fs(19),
      fontFamily: fonts.bold,
      letterSpacing: -0.3,
      color: colors.text,
      textAlign: 'center',
    },
    emptyText: {
      marginTop: ms(8),
      fontSize: fs(14),
      lineHeight: fs(20),
      fontFamily: fonts.regular,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    emptyButton: {
      alignSelf: 'stretch',
      marginTop: ms(24),
      height: ms(50),
    },
    emptySmall: {
      alignItems: 'center',
      gap: ms(12),
      paddingTop: ms(56),
    },
    emptySmallArt: {
      width: ms(64),
      height: ms(64),
      borderRadius: ms(32),
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surfaceMuted,
    },
    list: {
      paddingBottom: ms(32),
    },
    listBox: {
      flex: 1,
    },
  });
}
