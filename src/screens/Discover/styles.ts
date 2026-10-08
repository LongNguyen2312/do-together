import { StyleSheet } from 'react-native';
import { ms } from 'react-native-size-matters';

import { fonts, fs, lightColors, type AppColors } from '@/theme';

const SCREEN_PADDING = ms(16);
export const FREE_CARD_WIDTH = ms(240);
export const FREE_CARD_GAP = ms(12);
const FREE_AVATAR = ms(40);
const COMMUNITY_ICON = ms(42);
const CARD_SHADOW_RADIUS = ms(14);
const CARD_SHADOW_OFFSET = ms(4);
/** Space the card shadow spills into, below the card (radius + offset). */
const CARD_SHADOW_ROOM = CARD_SHADOW_RADIUS + CARD_SHADOW_OFFSET;
const CONTROL_SHADOW_RADIUS = ms(10);
const CONTROL_SHADOW_OFFSET = ms(3);
const CONTROL_SHADOW_ROOM = CONTROL_SHADOW_RADIUS + CONTROL_SHADOW_OFFSET;

export function createStyles(colors: AppColors) {
  /** Search bar and chips: lighter than the cards so content stays on top. */
  const controlShadow = {
    shadowColor: colors.black,
    shadowOpacity: 0.08,
    shadowRadius: CONTROL_SHADOW_RADIUS,
    shadowOffset: { width: 0, height: CONTROL_SHADOW_OFFSET },
    elevation: 3,
  };
  const card = {
    borderRadius: ms(16),
    backgroundColor: colors.card,
    shadowColor: colors.black,
    shadowOpacity: 0.09,
    shadowRadius: CARD_SHADOW_RADIUS,
    shadowOffset: { width: 0, height: CARD_SHADOW_OFFSET },
    elevation: 4,
  };
  const smallLabel = {
    fontSize: fs(10),
    lineHeight: fs(13),
    fontFamily: fonts.bold,
    includeFontPadding: false,
  };

  return StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      paddingTop: ms(12),
      gap: ms(24),
    },
    pressed: {
      opacity: 0.85,
      transform: [{ scale: 0.97 }],
    },
    flexShrink: {
      flexShrink: 1,
    },

    searchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: ms(8),
      paddingHorizontal: SCREEN_PADDING,
    },
    search: {
      flex: 1,
      height: ms(42),
      flexDirection: 'row',
      alignItems: 'center',
      gap: ms(8),
      paddingLeft: ms(16),
      paddingRight: ms(8),
      borderRadius: ms(999),
      backgroundColor: colors.card,
      ...controlShadow,
    },
    searchInput: {
      flex: 1,
      padding: 0,
      fontSize: fs(13.5),
      fontFamily: fonts.regular,
      color: colors.text,
    },
    searchAction: {
      width: ms(30),
      height: ms(30),
      alignItems: 'center',
      justifyContent: 'center',
    },
    // Vertical room so the horizontal list doesn't clip the chip shadows.
    chips: {
      gap: ms(8),
      paddingHorizontal: SCREEN_PADDING,
      paddingVertical: CONTROL_SHADOW_ROOM,
    },
    chipsScroll: {
      marginVertical: -CONTROL_SHADOW_ROOM + ms(4),
    },
    chip: {
      height: ms(32),
      flexDirection: 'row',
      alignItems: 'center',
      gap: ms(5),
      paddingHorizontal: ms(13),
      borderRadius: ms(999),
      backgroundColor: colors.card,
      ...controlShadow,
    },
    chipSelected: {
      backgroundColor: colors.primary,
    },
    // Own box so the glyph centers against the label instead of sitting on its baseline.
    chipEmoji: {
      width: fs(14),
      height: fs(14),
      fontSize: fs(11.5),
      lineHeight: fs(14),
      textAlign: 'center',
      includeFontPadding: false,
    },
    chipText: {
      fontSize: fs(12),
      lineHeight: fs(15),
      fontFamily: fonts.semibold,
      color: colors.text,
      includeFontPadding: false,
    },
    chipTextSelected: {
      color: colors.white,
    },
    filters: {
      gap: ms(8),
    },

    section: {
      gap: ms(12),
    },
    // Above the free-people list, whose shadow room overlaps the header.
    sectionHeader: {
      zIndex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: ms(12),
      paddingHorizontal: SCREEN_PADDING,
    },
    sectionTitleRow: {
      flexShrink: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: ms(8),
    },
    sectionTitle: {
      flexShrink: 1,
      fontSize: fs(16),
      lineHeight: fs(21),
      fontFamily: fonts.semibold,
      letterSpacing: -0.3,
      color: colors.text,
    },
    sectionLink: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: ms(2),
    },
    sectionLinkText: {
      fontSize: fs(12),
      lineHeight: fs(16),
      fontFamily: fonts.semibold,
      color: colors.primary,
    },
    onlinePill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: ms(6),
      paddingHorizontal: ms(8),
      paddingVertical: ms(3),
      borderRadius: ms(999),
      backgroundColor: `${colors.success}1F`,
    },
    onlineText: {
      ...smallLabel,
      letterSpacing: 0.4,
      textTransform: 'uppercase',
      color: colors.success,
    },
    sectionList: {
      gap: ms(12),
      paddingHorizontal: SCREEN_PADDING,
    },
    communityList: {
      gap: ms(10),
      paddingHorizontal: SCREEN_PADDING,
    },
    empty: {
      paddingVertical: ms(24),
      paddingHorizontal: SCREEN_PADDING,
      fontSize: fs(13),
      fontFamily: fonts.regular,
      textAlign: 'center',
      color: colors.textSecondary,
    },

    // Vertical room so the horizontal list doesn't clip the card shadows.
    freeList: {
      gap: FREE_CARD_GAP,
      paddingHorizontal: SCREEN_PADDING,
      paddingTop: CARD_SHADOW_ROOM,
      paddingBottom: CARD_SHADOW_ROOM,
    },
    freeScroll: {
      marginVertical: -CARD_SHADOW_ROOM,
    },
    freeCard: {
      ...card,
      width: FREE_CARD_WIDTH,
      gap: ms(10),
      padding: ms(14),
    },
    // The glass is the surface: no fill, and clipping hides the shadow the system glass draws outside its bounds.
    freeCardGlass: {
      backgroundColor: 'transparent',
      shadowOpacity: 0,
      elevation: 0,
      overflow: 'hidden',
    },
    freeTop: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: ms(12),
    },
    freeAvatar: {
      width: FREE_AVATAR,
      height: FREE_AVATAR,
      borderRadius: FREE_AVATAR / 2,
    },
    onlineDot: {
      position: 'absolute',
      right: 0,
      bottom: 0,
      width: ms(12),
      height: ms(12),
      borderRadius: ms(6),
      borderWidth: 2,
      borderColor: colors.card,
      backgroundColor: colors.success,
    },
    freeName: {
      fontSize: fs(14),
      lineHeight: fs(18),
      fontFamily: fonts.semibold,
      color: colors.text,
    },
    distanceRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: ms(4),
    },
    distanceText: {
      flexShrink: 1,
      fontSize: fs(11.5),
      lineHeight: fs(15),
      fontFamily: fonts.regular,
      color: colors.textSecondary,
    },
    wish: {
      minHeight: ms(40),
      justifyContent: 'center',
      padding: ms(8),
      borderRadius: ms(8),
      backgroundColor: colors.surface,
    },
    wishGlass: {
      backgroundColor: `${colors.text}0F`,
    },
    wishText: {
      fontSize: fs(11.5),
      lineHeight: fs(15),
      fontFamily: fonts.regular,
      color: colors.text,
    },
    inviteButton: {
      height: ms(34),
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: ms(6),
      borderRadius: ms(10),
      backgroundColor: colors.primary,
    },
    invitedButton: {
      backgroundColor: `${colors.success}1F`,
    },
    inviteText: {
      flexShrink: 1,
      fontSize: fs(12.5),
      fontFamily: fonts.semibold,
      color: colors.white,
    },
    invitedText: {
      color: colors.success,
    },
    socialRow: {
      flexDirection: 'row',
      gap: ms(8),
    },
    socialButton: {
      flex: 1,
      paddingHorizontal: ms(8),
    },
    followButton: {
      backgroundColor: `${colors.primary}1F`,
    },
    followingButton: {
      backgroundColor: `${colors.text}0F`,
    },
    followText: {
      color: colors.primary,
    },
    followingText: {
      color: colors.textSecondary,
    },

    activityCard: {
      ...card,
      gap: ms(10),
      padding: ms(14),
    },
    featuredCard: {
      ...card,
    },
    cardPressed: {
      opacity: 0.92,
      transform: [{ scale: 0.99 }],
    },
    // Only the photo is clipped: clipping the whole card would cut off its shadow on iOS.
    hero: {
      height: ms(160),
      borderTopLeftRadius: ms(16),
      borderTopRightRadius: ms(16),
      overflow: 'hidden',
      backgroundColor: colors.surfaceMuted,
    },
    heroImage: {
      ...StyleSheet.absoluteFill,
      width: '100%',
      height: '100%',
    },
    heroTop: {
      position: 'absolute',
      top: ms(12),
      left: ms(12),
      right: ms(12),
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: ms(6),
    },
    heroChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: ms(4),
      paddingHorizontal: ms(10),
      paddingVertical: ms(5),
      borderRadius: ms(999),
      backgroundColor: `${lightColors.white}E6`,
    },
    heroChipText: {
      ...smallLabel,
      fontSize: fs(11),
      lineHeight: fs(14),
      fontFamily: fonts.semibold,
      color: lightColors.text,
    },
    heroChipTime: {
      color: lightColors.primary,
    },
    heroBottom: {
      position: 'absolute',
      left: ms(12),
      right: ms(12),
      bottom: ms(12),
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: ms(8),
    },
    heroBadge: {
      flexShrink: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: ms(4),
      paddingHorizontal: ms(8),
      paddingVertical: ms(3),
      borderRadius: ms(6),
      backgroundColor: `${lightColors.black}66`,
    },
    heroBadgeText: {
      flexShrink: 1,
      fontSize: fs(11),
      lineHeight: fs(14),
      fontFamily: fonts.semibold,
      color: lightColors.white,
    },
    featuredBody: {
      gap: ms(10),
      padding: ms(14),
    },
    cardTitle: {
      fontSize: fs(15.5),
      lineHeight: fs(20),
      fontFamily: fonts.semibold,
      letterSpacing: -0.3,
      color: colors.text,
    },
    cardTitleBelowTags: {
      marginTop: ms(6),
    },
    locationRow: {
      marginTop: ms(4),
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: ms(4),
    },
    locationText: {
      flexShrink: 1,
      fontSize: fs(11.5),
      lineHeight: fs(15),
      fontFamily: fonts.regular,
      color: colors.textWarm,
    },
    capacity: {
      gap: ms(6),
    },
    capacityLabels: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    capacityCount: {
      ...smallLabel,
      fontSize: fs(11),
      lineHeight: fs(14),
      fontFamily: fonts.semibold,
      color: colors.text,
    },
    capacityLeft: {
      ...smallLabel,
      fontSize: fs(11),
      lineHeight: fs(14),
      color: colors.primaryDark,
    },
    capacityTrack: {
      height: ms(8),
      borderRadius: ms(4),
      overflow: 'hidden',
      backgroundColor: colors.surfaceMuted,
    },
    capacityFill: {
      height: '100%',
      borderRadius: ms(4),
      backgroundColor: colors.primary,
    },
    tags: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: ms(6),
    },
    tag: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: ms(3),
      paddingHorizontal: ms(8),
      paddingVertical: ms(3),
      borderRadius: ms(6),
      backgroundColor: colors.surfaceHigh,
    },
    tagSuccess: {
      backgroundColor: `${colors.success}1F`,
    },
    tagEmoji: {
      width: fs(12),
      height: fs(12),
      fontSize: fs(9.5),
      lineHeight: fs(12),
      textAlign: 'center',
      includeFontPadding: false,
    },
    tagText: {
      ...smallLabel,
      letterSpacing: 0.3,
      color: colors.text,
    },
    tagTextSuccess: {
      color: colors.success,
    },
    cardBottom: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: ms(12),
    },
    cardMeta: {
      flex: 1,
      minWidth: 0,
      flexDirection: 'row',
      alignItems: 'center',
      gap: ms(8),
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
    participantLarge: {
      width: ms(32),
      height: ms(32),
      borderRadius: ms(16),
    },
    participantOverlap: {
      marginLeft: -ms(8),
    },
    moreParticipants: {
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surfaceMuted,
    },
    moreText: {
      ...smallLabel,
      color: colors.textWarm,
    },
    metaText: {
      flexShrink: 1,
      fontSize: fs(11.5),
      lineHeight: fs(15),
      fontFamily: fonts.regular,
      color: colors.textSecondary,
    },
    primaryButton: {
      flexShrink: 0,
      height: ms(32),
      justifyContent: 'center',
      paddingHorizontal: ms(14),
      borderRadius: ms(10),
      backgroundColor: colors.primary,
    },
    primaryText: {
      fontSize: fs(12.5),
      fontFamily: fonts.semibold,
      color: colors.white,
    },
    secondaryButton: {
      flexShrink: 0,
      height: ms(32),
      justifyContent: 'center',
      paddingHorizontal: ms(12),
      borderRadius: ms(10),
      backgroundColor: colors.surfaceMuted,
    },
    secondaryText: {
      fontSize: fs(12.5),
      fontFamily: fonts.semibold,
      color: colors.text,
    },
    joinedButton: {
      flexShrink: 0,
      height: ms(32),
      flexDirection: 'row',
      alignItems: 'center',
      gap: ms(4),
      paddingHorizontal: ms(12),
      borderRadius: ms(10),
      // Light-theme green in both modes: dark mode's success is too pale for white text.
      backgroundColor: lightColors.success,
    },
    joinedText: {
      fontSize: fs(12.5),
      fontFamily: fonts.semibold,
      color: colors.white,
    },

    communityRow: {
      ...card,
      flexDirection: 'row',
      alignItems: 'center',
      gap: ms(12),
      padding: ms(14),
    },
    communityIcon: {
      width: COMMUNITY_ICON,
      height: COMMUNITY_ICON,
      borderRadius: ms(12),
      alignItems: 'center',
      justifyContent: 'center',
    },
    communityInfo: {
      flex: 1,
      minWidth: 0,
      gap: ms(2),
    },
    communityName: {
      fontSize: fs(14),
      lineHeight: fs(18),
      fontFamily: fonts.semibold,
      color: colors.text,
    },
    communityMeta: {
      fontSize: fs(11.5),
      lineHeight: fs(15),
      fontFamily: fonts.regular,
      color: colors.textSecondary,
    },
  });
}

export type DiscoverStyles = ReturnType<typeof createStyles>;
