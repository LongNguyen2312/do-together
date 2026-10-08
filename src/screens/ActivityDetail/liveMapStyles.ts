import { StyleSheet } from 'react-native';
import { ms } from 'react-native-size-matters';

import { fonts, fs, type AppColors } from '@/theme';

const SCREEN_PADDING = ms(16);
const BUTTON_SIZE = ms(40);
const MEMBER_AVATAR = ms(36);

/** `colors` follow the map style, since everything here floats on the map. */
export function createLiveMapStyles(colors: AppColors) {
  const floating = {
    backgroundColor: colors.card,
    shadowColor: colors.black,
    shadowOpacity: 0.12,
    shadowRadius: ms(10),
    shadowOffset: { width: 0, height: ms(3) },
    elevation: 4,
  };

  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.background,
    },
    map: {
      ...StyleSheet.absoluteFill,
    },
    pressed: {
      opacity: 0.85,
      transform: [{ scale: 0.97 }],
    },
    /** Without system glass: an opaque floating surface instead. */
    glassFallback: {
      ...floating,
      overflow: 'visible',
    },

    topBar: {
      position: 'absolute',
      left: SCREEN_PADDING,
      right: SCREEN_PADDING,
      flexDirection: 'row',
      alignItems: 'center',
      gap: ms(10),
    },
    // Clipping hides the shadow the system glass draws outside its bounds.
    closeButton: {
      width: BUTTON_SIZE,
      height: BUTTON_SIZE,
      borderRadius: BUTTON_SIZE / 2,
      overflow: 'hidden',
    },
    glassPressable: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    hud: {
      position: 'absolute',
      right: SCREEN_PADDING,
      gap: ms(8),
    },
    hudButtonActive: {
      backgroundColor: colors.primary,
    },
    titlePill: {
      flex: 1,
      minHeight: BUTTON_SIZE,
      justifyContent: 'center',
      paddingHorizontal: ms(14),
      paddingVertical: ms(5),
      borderRadius: ms(999),
      overflow: 'hidden',
    },
    title: {
      fontSize: fs(13.5),
      lineHeight: fs(17),
      fontFamily: fonts.semibold,
      letterSpacing: -0.2,
      color: colors.text,
    },
    statusRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: ms(5),
    },
    statusText: {
      flexShrink: 1,
      fontSize: fs(10.5),
      lineHeight: fs(13),
      fontFamily: fonts.medium,
      color: colors.textSecondary,
    },

    sheet: {
      position: 'absolute',
      left: SCREEN_PADDING,
      right: SCREEN_PADDING,
      padding: ms(16),
      gap: ms(12),
      borderRadius: ms(24),
      overflow: 'hidden',
    },
    placeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: ms(10),
    },
    placeIcon: {
      width: ms(36),
      height: ms(36),
      borderRadius: ms(18),
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primary,
    },
    placeEmoji: {
      fontSize: fs(16),
    },
    placeBody: {
      flex: 1,
    },
    placeName: {
      fontSize: fs(15),
      lineHeight: fs(19),
      fontFamily: fonts.bold,
      color: colors.text,
    },
    placeMeta: {
      fontSize: fs(11.5),
      lineHeight: fs(15),
      fontFamily: fonts.medium,
      color: colors.textSecondary,
    },

    arrivedText: {
      fontSize: fs(12),
      fontFamily: fonts.bold,
      color: colors.success,
    },
    hostTag: {
      fontSize: fs(9),
      fontFamily: fonts.bold,
      color: colors.primary,
    },

    members: {
      gap: ms(12),
    },
    member: {
      width: ms(64),
      alignItems: 'center',
      gap: ms(4),
    },
    memberAvatar: {
      width: MEMBER_AVATAR,
      height: MEMBER_AVATAR,
      borderRadius: MEMBER_AVATAR / 2,
      borderWidth: 2,
      borderColor: 'transparent',
    },
    memberAvatarArrived: {
      borderColor: colors.success,
    },
    memberMe: {
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primary,
    },
    memberInitials: {
      fontSize: fs(12),
      fontFamily: fonts.bold,
      color: colors.white,
    },
    memberName: {
      fontSize: fs(11),
      fontFamily: fonts.semibold,
      color: colors.text,
    },
    memberStatus: {
      fontSize: fs(10),
      fontFamily: fonts.medium,
      color: colors.textSecondary,
    },
    memberStatusArrived: {
      color: colors.success,
    },

    hintRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: ms(5),
    },
    hint: {
      flexShrink: 1,
      fontSize: fs(10.5),
      lineHeight: fs(14),
      fontFamily: fonts.medium,
      color: colors.textSecondary,
    },
  });
}
