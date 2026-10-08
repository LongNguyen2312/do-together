import { StyleSheet } from 'react-native';
import { ms } from 'react-native-size-matters';

import { fonts, fs, type AppColors } from '@/theme';

const SCREEN_PADDING = ms(16);
const MARKER_AVATAR = ms(40);
const BACK_SIZE = ms(38);
export const MAP_CARD_WIDTH = ms(276);
const MAP_CARD_RADIUS = ms(20);
/** Space between the cards and the bottom edge of the screen. */
export const MAP_CARD_BOTTOM_GAP = ms(10);

export function createStyles(colors: AppColors) {
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
    topBar: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      flexDirection: 'row',
      alignItems: 'center',
      gap: ms(10),
      paddingHorizontal: SCREEN_PADDING,
    },
    // Clipping hides the shadow the system glass draws outside its bounds.
    backButton: {
      width: BACK_SIZE,
      height: BACK_SIZE,
      borderRadius: BACK_SIZE / 2,
      overflow: 'hidden',
    },
    glassPressable: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    titlePill: {
      flexShrink: 1,
      minHeight: BACK_SIZE,
      justifyContent: 'center',
      paddingHorizontal: ms(14),
      paddingVertical: ms(4),
      borderRadius: ms(999),
      overflow: 'hidden',
    },
    /** Without system glass: an opaque floating surface instead. */
    glassFallback: {
      ...floating,
      overflow: 'visible',
    },
    title: {
      fontSize: fs(13.5),
      lineHeight: fs(17),
      fontFamily: fonts.semibold,
      letterSpacing: -0.2,
      color: colors.text,
    },
    sharingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: ms(5),
    },
    sharingDot: {
      width: ms(6),
      height: ms(6),
      borderRadius: ms(3),
      backgroundColor: colors.success,
    },
    sharingText: {
      flexShrink: 1,
      fontSize: fs(10.5),
      lineHeight: fs(13),
      fontFamily: fonts.medium,
      color: colors.textSecondary,
    },

    marker: {
      alignItems: 'center',
    },
    markerSelected: {
      // Grow from the tip so it stays on the coordinate.
      transformOrigin: 'bottom',
      transform: [{ scale: 1.15 }],
      zIndex: 1,
    },
    markerRing: {
      padding: ms(3),
      borderRadius: ms(999),
      backgroundColor: colors.success,
      shadowColor: colors.black,
      shadowOpacity: 0.2,
      shadowRadius: ms(4),
      shadowOffset: { width: 0, height: ms(2) },
      elevation: 3,
    },
    markerRingSelected: {
      backgroundColor: colors.primary,
    },
    markerAvatar: {
      width: MARKER_AVATAR,
      height: MARKER_AVATAR,
      borderRadius: MARKER_AVATAR / 2,
      borderWidth: 2,
      borderColor: colors.white,
    },
    markerBadge: {
      position: 'absolute',
      right: -ms(4),
      bottom: -ms(2),
      width: ms(20),
      height: ms(20),
      borderRadius: ms(10),
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1.5,
      borderColor: colors.white,
      backgroundColor: colors.card,
    },
    // Fixed box with matching lineHeight keeps the glyph centered on both platforms.
    markerEmoji: {
      width: fs(14),
      height: fs(14),
      fontSize: fs(10),
      lineHeight: fs(14),
      textAlign: 'center',
      includeFontPadding: false,
    },
    markerTip: {
      width: ms(10),
      height: ms(10),
      marginTop: -ms(6),
      transform: [{ rotate: '45deg' }],
      backgroundColor: colors.success,
      zIndex: -1,
    },
    markerTipSelected: {
      backgroundColor: colors.primary,
    },

    bottom: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
    },
    carouselItem: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'flex-end',
      paddingBottom: MAP_CARD_BOTTOM_GAP,
    },
    mapCard: {
      width: MAP_CARD_WIDTH,
      borderRadius: MAP_CARD_RADIUS,
    },
    mapCardScrim: {
      borderRadius: MAP_CARD_RADIUS,
    },
    empty: {
      ...floating,
      marginHorizontal: SCREEN_PADDING,
      marginBottom: ms(16),
      flexDirection: 'row',
      alignItems: 'center',
      gap: ms(10),
      padding: ms(16),
      borderRadius: ms(16),
    },
    emptyText: {
      flex: 1,
      fontSize: fs(13),
      lineHeight: fs(18),
      fontFamily: fonts.regular,
      color: colors.textSecondary,
    },
  });
}
