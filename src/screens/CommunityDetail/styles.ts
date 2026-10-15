import { StyleSheet } from 'react-native';
import { ms } from 'react-native-size-matters';

import { fonts, fs, type AppColors } from '@/theme';

const SCREEN_PADDING = ms(16);
const HERO_HEIGHT = ms(190);
const HERO_ICON = ms(44);
const FACE = ms(34);
const THUMB = ms(48);

export type CommunityDetailStyles = ReturnType<typeof createStyles>;

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
    content: {
      gap: ms(14),
      paddingHorizontal: SCREEN_PADDING,
      paddingTop: ms(12),
    },
    pressed: {
      opacity: 0.8,
    },

    // Its kind's photo, with the name over a darkened foot.
    hero: {
      height: HERO_HEIGHT,
      borderRadius: ms(20),
      borderCurve: 'continuous',
      overflow: 'hidden',
      backgroundColor: colors.surfaceHigh,
    },
    heroImage: {
      ...StyleSheet.absoluteFill,
      width: '100%',
      height: '100%',
    },
    heroPlain: {
      backgroundColor: colors.primarySoft,
    },
    heroShade: {
      ...StyleSheet.absoluteFill,
      backgroundImage: `linear-gradient(to bottom, ${colors.black}00 30%, ${colors.black}B3 100%)`,
    },
    heroBody: {
      position: 'absolute',
      left: ms(16),
      right: ms(16),
      bottom: ms(16),
      flexDirection: 'row',
      alignItems: 'center',
      gap: ms(12),
    },
    heroIcon: {
      width: HERO_ICON,
      height: HERO_ICON,
      borderRadius: ms(14),
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primary,
    },
    heroText: {
      flex: 1,
      gap: ms(2),
    },
    heroName: {
      fontSize: fs(19),
      lineHeight: fs(24),
      fontFamily: fonts.bold,
      color: colors.white,
    },
    heroMeta: {
      fontSize: fs(12.5),
      lineHeight: fs(16),
      fontFamily: fonts.medium,
      color: `${colors.white}E6`,
    },

    // Join, or once joined: the chat and a way out.
    actions: {
      flexDirection: 'row',
      gap: ms(10),
    },
    action: {
      flex: 1,
      height: ms(46),
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: ms(6),
      borderRadius: ms(14),
      backgroundColor: colors.surfaceMuted,
    },
    actionPrimary: {
      backgroundColor: colors.primary,
    },
    actionWide: {
      flex: 0,
      alignSelf: 'stretch',
    },
    actionText: {
      fontSize: fs(14),
      fontFamily: fonts.semibold,
      color: colors.text,
    },
    actionTextPrimary: {
      color: colors.white,
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
    link: {
      fontSize: fs(12.5),
      fontFamily: fonts.semibold,
      color: colors.primary,
    },
    body: {
      fontSize: fs(13.5),
      lineHeight: fs(20),
      fontFamily: fonts.regular,
      color: colors.textSecondary,
    },
    infoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: ms(8),
    },
    infoText: {
      flex: 1,
      fontSize: fs(13.5),
      lineHeight: fs(19),
      fontFamily: fonts.medium,
      color: colors.text,
    },

    // Who's in it: a few faces, how many, which friends.
    membersRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: ms(12),
    },
    faces: {
      flexDirection: 'row',
    },
    face: {
      width: FACE,
      height: FACE,
      borderRadius: FACE / 2,
      borderWidth: ms(2),
      borderColor: colors.card,
      backgroundColor: colors.surfaceHigh,
    },
    faceOverlap: {
      marginLeft: -ms(10),
    },
    membersText: {
      flex: 1,
      gap: ms(2),
    },
    membersCount: {
      fontSize: fs(13.5),
      fontFamily: fonts.semibold,
      color: colors.text,
    },
    membersFriends: {
      fontSize: fs(12),
      fontFamily: fonts.regular,
      color: colors.textSecondary,
    },

    // What's coming up of its kind.
    upcoming: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: ms(12),
      paddingVertical: ms(8),
    },
    divided: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
    },
    upcomingThumb: {
      width: THUMB,
      height: THUMB,
      borderRadius: ms(12),
      backgroundColor: colors.surfaceHigh,
    },
    upcomingThumbPlain: {
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primarySoft,
    },
    upcomingEmoji: {
      fontSize: fs(20),
    },
    upcomingText: {
      flex: 1,
      gap: ms(2),
    },
    upcomingTitle: {
      fontSize: fs(14),
      fontFamily: fonts.semibold,
      color: colors.text,
    },
    upcomingMeta: {
      fontSize: fs(12),
      fontFamily: fonts.regular,
      color: colors.textSecondary,
    },
    upcomingLive: {
      fontFamily: fonts.semibold,
      color: colors.success,
    },
    empty: {
      fontSize: fs(13),
      fontFamily: fonts.regular,
      color: colors.textMuted,
    },
  });
}
