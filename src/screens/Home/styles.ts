import { StyleSheet } from 'react-native';
import { ms } from 'react-native-size-matters';

import { fonts, fs, lightColors, type AppColors } from '@/theme';

const SCREEN_PADDING = ms(16);
const MARKER_AVATAR = ms(32);

export function createStyles(colors: AppColors) {
  const softShadow = {
    shadowColor: colors.black,
    shadowOpacity: 0.08,
    shadowRadius: ms(6),
    shadowOffset: { width: 0, height: ms(2) },
    elevation: 2,
  };
  const floating = {
    backgroundColor: colors.card,
    ...softShadow,
  };

  return StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: colors.background,
    },
    flexShrink: {
      flexShrink: 1,
    },
    pressed: {
      opacity: 0.85,
      transform: [{ scale: 0.97 }],
    },

    body: {
      flex: 1,
      overflow: 'hidden',
      backgroundColor: colors.surface,
    },
    map: {
      ...StyleSheet.absoluteFill,
    },
    mapOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      paddingTop: ms(8),
      gap: ms(8),
    },
    search: {
      marginHorizontal: SCREEN_PADDING,
      flexDirection: 'row',
      alignItems: 'center',
      gap: ms(10),
      paddingLeft: ms(16),
      paddingRight: ms(8),
      paddingVertical: ms(8),
      borderRadius: ms(999),
    },
    floatingFallback: {
      ...floating,
    },
    searchBody: {
      flex: 1,
    },
    searchInput: {
      padding: 0,
      fontSize: fs(13),
      fontFamily: fonts.medium,
      lineHeight: fs(17),
      color: colors.text,
    },
    locationRow: {
      marginTop: ms(2),
      flexDirection: 'row',
      alignItems: 'center',
      gap: ms(4),
    },
    locationDot: {
      width: ms(6),
      height: ms(6),
      borderRadius: ms(3),
      backgroundColor: colors.success,
    },
    locationText: {
      flexShrink: 1,
      fontSize: fs(10.5),
      lineHeight: fs(13),
      fontFamily: fonts.semibold,
      color: colors.textSecondary,
    },
    locateButton: {
      width: ms(34),
      height: ms(34),
      borderRadius: ms(17),
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surfaceMuted,
    },
    locateDot: {
      position: 'absolute',
      width: ms(5),
      height: ms(5),
      borderRadius: ms(2.5),
      backgroundColor: colors.text,
    },
    chipsScroll: {
      flexGrow: 0,
    },
    chips: {
      gap: ms(6),
      paddingHorizontal: SCREEN_PADDING,
      paddingVertical: ms(4),
    },
    // Clipping hides the shadow the system glass draws outside its bounds.
    chip: {
      borderRadius: ms(999),
      overflow: 'hidden',
    },
    chipPressable: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: ms(4),
      paddingHorizontal: ms(11),
      paddingVertical: ms(5),
    },
    chipSelected: {
      backgroundColor: colors.primary,
    },
    chipEmoji: {
      width: fs(14),
      height: fs(14),
      fontSize: fs(11),
      lineHeight: fs(14),
      textAlign: 'center',
      includeFontPadding: false,
    },
    chipText: {
      fontSize: fs(11.5),
      lineHeight: fs(14),
      fontFamily: fonts.semibold,
      color: colors.text,
    },
    chipTextSelected: {
      color: colors.white,
    },
    chipDot: {
      width: ms(6),
      height: ms(6),
      borderRadius: ms(3),
      backgroundColor: colors.white,
    },
    hud: {
      position: 'absolute',
      right: SCREEN_PADDING,
      gap: ms(8),
    },
    hudButton: {
      width: ms(38),
      height: ms(38),
      borderRadius: ms(19),
      overflow: 'hidden',
    },
    hudFallback: {
      ...floating,
    },
    hudPressable: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    attribution: {
      position: 'absolute',
      left: SCREEN_PADDING,
      fontSize: fs(9),
      lineHeight: fs(12),
      fontFamily: fonts.medium,
      color: colors.textSecondary,
      opacity: 0.7,
    },
    hudButtonActive: {
      backgroundColor: colors.primary,
    },

    markerWrap: {
      alignItems: 'center',
    },
    markerPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: ms(6),
      padding: ms(4),
      paddingRight: ms(12),
      borderRadius: ms(999),
      ...floating,
    },
    markerAvatar: {
      width: MARKER_AVATAR,
      height: MARKER_AVATAR,
      borderRadius: MARKER_AVATAR / 2,
    },
    markerEmoji: {
      position: 'absolute',
      right: -ms(2),
      bottom: -ms(2),
      width: ms(15),
      height: ms(15),
      borderRadius: ms(8),
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primary,
    },
    markerEmojiLive: {
      backgroundColor: colors.text,
    },
    markerEmojiText: {
      fontSize: fs(8),
      fontFamily: fonts.regular,
    },
    markerStatus: {
      fontSize: fs(8.5),
      lineHeight: fs(11),
      fontFamily: fonts.bold,
      letterSpacing: 0.5,
    },
    markerTitle: {
      fontSize: fs(10.5),
      lineHeight: fs(13),
      fontFamily: fonts.semibold,
      color: colors.text,
    },
    markerTip: {
      width: ms(8),
      height: ms(8),
      marginTop: -ms(4),
      transform: [{ rotate: '45deg' }],
      backgroundColor: colors.card,
    },
    markerFocused: {
      // Grow from the tip so it stays on the coordinate.
      transformOrigin: 'bottom',
      transform: [{ scale: 1.15 }],
      zIndex: 1,
    },
    markerPillJoined: {
      borderWidth: 2,
      borderColor: colors.success,
    },
    markerPillFocused: {
      borderWidth: 2,
      borderColor: colors.primary,
    },
    markerTipFocused: {
      backgroundColor: colors.primary,
    },
    cluster: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: ms(4),
      paddingHorizontal: ms(10),
      paddingVertical: ms(5),
      borderRadius: ms(999),
      backgroundColor: colors.primary,
      ...softShadow,
    },
    clusterEmoji: {
      fontSize: fs(10),
      lineHeight: fs(13),
    },
    clusterText: {
      // letterSpacing trails the last glyph; pull it back so the label stays centered.
      marginRight: -0.5,
      fontSize: fs(9),
      lineHeight: fs(11),
      fontFamily: fonts.bold,
      letterSpacing: 0.5,
      textTransform: 'uppercase',
      color: colors.white,
    },
    clusterTip: {
      width: ms(6),
      height: ms(6),
      marginTop: -ms(3),
      backgroundColor: colors.primary,
    },
    liveText: {
      color: colors.success,
    },
    soonText: {
      color: colors.primary,
    },

    sheetHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: SCREEN_PADDING,
      paddingTop: ms(10),
      paddingBottom: ms(14),
    },
    sheetTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: ms(10),
    },
    sheetTitle: {
      fontSize: fs(16),
      lineHeight: fs(21),
      fontFamily: fonts.semibold,
      letterSpacing: -0.3,
      color: colors.text,
    },
    nearbyPill: {
      paddingHorizontal: ms(8),
      paddingVertical: ms(3),
      borderRadius: ms(999),
      backgroundColor: colors.surfaceHigh,
    },
    nearbyText: {
      fontSize: fs(9.5),
      lineHeight: fs(12),
      fontFamily: fonts.bold,
      letterSpacing: 0.5,
      textTransform: 'uppercase',
      color: colors.text,
    },
    cards: {
      paddingHorizontal: SCREEN_PADDING,
      gap: ms(12),
    },
    empty: {
      paddingVertical: ms(24),
      fontSize: fs(13),
      fontFamily: fonts.regular,
      textAlign: 'center',
      color: colors.textSecondary,
    },

    card: {
      gap: ms(10),
      padding: ms(16),
      borderRadius: ms(16),
      backgroundColor: colors.card,
      shadowColor: colors.black,
      shadowOpacity: 0.05,
      shadowRadius: ms(4),
      shadowOffset: { width: 0, height: ms(1) },
      elevation: 1,
    },
    cardPressed: {
      opacity: 0.92,
      transform: [{ scale: 0.99 }],
    },
    cardTop: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: ms(8),
    },
    cardHost: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: ms(10),
    },
    hostAvatar: {
      width: ms(36),
      height: ms(36),
      borderRadius: ms(18),
    },
    hostName: {
      fontSize: fs(12.5),
      lineHeight: fs(16),
      fontFamily: fonts.semibold,
      color: colors.text,
    },
    whenRow: {
      marginTop: ms(2),
      flexDirection: 'row',
      alignItems: 'center',
      gap: ms(4),
    },
    whenText: {
      flexShrink: 1,
      fontSize: fs(11.5),
      lineHeight: fs(15),
      fontFamily: fonts.semibold,
    },
    tag: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: ms(3),
      paddingHorizontal: ms(8),
      paddingVertical: ms(4),
      borderRadius: ms(999),
      backgroundColor: colors.surfaceHigh,
    },
    // Own box so the glyph centers against the label instead of sitting on its baseline.
    tagEmoji: {
      width: fs(12),
      height: fs(12),
      fontSize: fs(9.5),
      lineHeight: fs(12),
      textAlign: 'center',
      includeFontPadding: false,
    },
    tagHighlight: {
      backgroundColor: colors.primarySoft,
    },
    tagText: {
      fontSize: fs(9.5),
      lineHeight: fs(12),
      fontFamily: fonts.bold,
      color: colors.text,
      includeFontPadding: false,
    },
    tagTextHighlight: {
      color: colors.primaryDark,
    },
    cardTitle: {
      fontSize: fs(15),
      lineHeight: fs(20),
      fontFamily: fonts.bold,
      letterSpacing: -0.3,
      color: colors.text,
    },
    cardDescription: {
      marginTop: ms(2),
      fontSize: fs(13),
      fontFamily: fonts.regular,
      lineHeight: fs(18),
      color: colors.textSecondary,
    },
    cardBottom: {
      marginTop: ms(4),
      flexDirection: 'row',
      alignItems: 'center',
      gap: ms(12),
    },
    cardMeta: {
      flex: 1,
      minWidth: 0,
      flexDirection: 'row',
      alignItems: 'center',
      gap: ms(8),
    },
    metaInfo: {
      flexShrink: 1,
      gap: ms(2),
    },
    distanceRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: ms(3),
    },
    distanceText: {
      flexShrink: 1,
      fontSize: fs(10.5),
      lineHeight: fs(13),
      fontFamily: fonts.regular,
      color: colors.textSecondary,
    },
    avatarStack: {
      flexDirection: 'row',
    },
    participant: {
      width: ms(28),
      height: ms(28),
      borderRadius: ms(14),
      borderWidth: 2,
      borderColor: colors.card,
    },
    participantOverlap: {
      marginLeft: -ms(8),
    },
    metaText: {
      fontSize: fs(10.5),
      lineHeight: fs(13),
      fontFamily: fonts.semibold,
      color: colors.textSecondary,
    },
    joinButton: {
      flexShrink: 0,
      height: ms(30),
      justifyContent: 'center',
      paddingHorizontal: ms(14),
      borderRadius: ms(999),
      backgroundColor: colors.primary,
    },
    joinText: {
      fontSize: fs(11.5),
      fontFamily: fonts.bold,
      color: colors.white,
    },
    joinedButton: {
      flexShrink: 0,
      height: ms(30),
      flexDirection: 'row',
      alignItems: 'center',
      gap: ms(4),
      paddingHorizontal: ms(12),
      borderRadius: ms(999),
      // Light-theme green in both modes: dark mode's success is too pale for white text.
      backgroundColor: lightColors.success,
    },
    joinedText: {
      fontSize: fs(11.5),
      fontFamily: fonts.bold,
      color: colors.white,
    },
    // A label, not a button: ongoing activities can't be joined.
    ongoingPill: {
      flexShrink: 0,
      height: ms(30),
      flexDirection: 'row',
      alignItems: 'center',
      gap: ms(6),
      paddingHorizontal: ms(12),
      borderRadius: ms(999),
      backgroundColor: `${colors.success}1F`,
    },
    ongoingText: {
      fontSize: fs(11.5),
      fontFamily: fonts.bold,
      color: colors.success,
    },
  });
}

export type HomeStyles = ReturnType<typeof createStyles>;
