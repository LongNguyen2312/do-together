import { StyleSheet } from 'react-native';
import { ms } from 'react-native-size-matters';

import { fonts, fs, type AppColors } from '@/theme';

const SCREEN_PADDING = ms(16);
const BUTTON = ms(40);
const GROUP_AVATAR = ms(96);
const MEMBER_AVATAR = ms(38);

export type GroupChatInfoStyles = ReturnType<typeof createStyles>;

export function createStyles(colors: AppColors) {
  const card = {
    borderRadius: ms(18),
    backgroundColor: colors.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    shadowColor: colors.black,
    shadowOpacity: 0.06,
    shadowRadius: ms(10),
    shadowOffset: { width: 0, height: ms(3) },
    elevation: 2,
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
      opacity: 0.7,
    },
    topBar: {
      height: ms(52),
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: SCREEN_PADDING,
    },
    topBarTitled: {
      gap: ms(12),
    },
    memberList: {
      paddingHorizontal: SCREEN_PADDING,
      paddingBottom: ms(32),
    },
    roundButton: {
      width: BUTTON,
      height: BUTTON,
      borderRadius: BUTTON / 2,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surfaceMuted,
    },
    scroll: {
      paddingHorizontal: SCREEN_PADDING,
      paddingBottom: ms(32),
      gap: ms(12),
    },

    identity: {
      alignItems: 'center',
      marginBottom: ms(4),
    },
    groupAvatar: {
      width: GROUP_AVATAR,
      height: GROUP_AVATAR,
      borderRadius: GROUP_AVATAR / 2,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primarySoft,
    },
    groupEmoji: {
      fontSize: fs(42),
    },
    statusDot: {
      position: 'absolute',
      right: ms(4),
      bottom: ms(4),
      width: ms(18),
      height: ms(18),
      borderRadius: ms(9),
      borderWidth: ms(3),
      borderColor: colors.background,
    },
    groupName: {
      marginTop: ms(14),
      textAlign: 'center',
      fontSize: fs(19),
      fontFamily: fonts.bold,
      letterSpacing: -0.3,
      color: colors.text,
    },
    statusText: {
      marginTop: ms(4),
      fontSize: fs(13),
      fontFamily: fonts.medium,
      color: colors.textSecondary,
    },

    stats: {
      flexDirection: 'row',
      gap: ms(8),
      marginTop: ms(8),
    },
    stat: {
      ...card,
      flex: 1,
      alignItems: 'center',
      paddingHorizontal: ms(8),
      paddingVertical: ms(12),
    },
    statLabel: {
      fontSize: fs(13),
      fontFamily: fonts.semibold,
      color: colors.textMuted,
    },
    statValue: {
      marginTop: ms(4),
      fontSize: fs(22),
      fontFamily: fonts.bold,
      color: colors.textSecondary,
    },
    seeAll: {
      fontSize: fs(13),
      fontFamily: fonts.semibold,
      color: colors.primary,
    },
    card: {
      ...card,
      padding: ms(12),
    },
    cardFlush: {
      ...card,
      paddingHorizontal: ms(14),
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: ms(10),
    },
    cardTitle: {
      fontSize: fs(14),
      fontFamily: fonts.semibold,
      color: colors.text,
    },
    emptyText: {
      fontSize: fs(13),
      fontFamily: fonts.regular,
      color: colors.textMuted,
    },

    thumbs: {
      flexDirection: 'row',
      gap: ms(6),
    },
    thumb: {
      flex: 1,
      aspectRatio: 0.82,
      borderRadius: ms(10),
      overflow: 'hidden',
      backgroundColor: colors.surfaceHigh,
    },
    thumbImage: {
      width: '100%',
      height: '100%',
    },
    thumbMore: {
      ...StyleSheet.absoluteFill,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: `${colors.black}66`,
    },
    thumbMoreText: {
      fontSize: fs(17),
      fontFamily: fonts.bold,
      color: colors.white,
    },

    memberRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: ms(12),
      paddingVertical: ms(8),
    },
    memberAvatar: {
      width: MEMBER_AVATAR,
      height: MEMBER_AVATAR,
      borderRadius: MEMBER_AVATAR / 2,
    },
    meAvatar: {
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primary,
    },
    meAvatarText: {
      fontSize: fs(13),
      fontFamily: fonts.bold,
      color: colors.white,
    },
    memberName: {
      flex: 1,
      fontSize: fs(14),
      fontFamily: fonts.medium,
      color: colors.text,
    },
    memberBadge: {
      paddingHorizontal: ms(8),
      paddingVertical: ms(3),
      borderRadius: ms(999),
      backgroundColor: colors.primarySoft,
    },
    memberBadgeText: {
      fontSize: fs(10.5),
      fontFamily: fonts.semibold,
      color: colors.primaryDark,
    },

    settingRow: {
      minHeight: ms(54),
      flexDirection: 'row',
      alignItems: 'center',
      gap: ms(12),
    },
    settingDivider: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
    },
    settingBody: {
      flex: 1,
      paddingVertical: ms(10),
    },
    settingLabel: {
      fontSize: fs(14),
      fontFamily: fonts.medium,
      color: colors.text,
    },
    settingHint: {
      marginTop: ms(2),
      fontSize: fs(11.5),
      fontFamily: fonts.regular,
      color: colors.textSecondary,
    },
  });
}
