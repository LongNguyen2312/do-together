import { StyleSheet } from 'react-native';
import { ms } from 'react-native-size-matters';

import { fonts, fs, type AppColors } from '@/theme';

export const SCREEN_PADDING = ms(14);
export const AVATAR_SIZE = ms(104);
const AVATAR_RING = ms(2.5);
/** With a story up: between the ring, in the brand colour, and the photo. */
/** Below a bottom sheet's last row, over the home indicator. */
export const SHEET_BOTTOM = ms(28);
/**
 * How far the blurred cover photo reaches past its frame each way. Small
 * photos (an avatar) are scaled up a lot, and their faded edges with them.
 */
const COVER_BLEED = ms(140);
export const AVATAR_GAP = ms(3);
const CAMERA_BADGE = ms(28);
/** The header's buttons, glass or not: the same size either way. */
export const TOP_BUTTON = ms(34);
export const TOP_BAR_HEIGHT = ms(48);
/** Room between the header and the avatar under it. */
export const AVATAR_DROP = ms(60);
/** How far the cover runs on past the middle of the avatar before it fades out. */
const COVER_TAIL = ms(36);
/**
 * Below the status bar, on past the middle of the avatar, so the avatar
 * sits well inside the cover and its (softened) bottom edge falls below it.
 */
export const COVER_HEIGHT =
  TOP_BAR_HEIGHT + AVATAR_DROP + AVATAR_RING + AVATAR_SIZE / 2 + COVER_TAIL;
export const HIGHLIGHT_SIZE = ms(62);
export const GRID_GAP = ms(6);

/**
 * A linear gradient from `from` to `to` opacity of `color` between two
 * points (in %), eased in and out with many stops, so it has no visible edge.
 */
function easedFade(
  color: string,
  from: number,
  to: number,
  start: number,
  end: number,
) {
  const STEPS = 12;
  const stops = Array.from({ length: STEPS + 1 }, (_, i) => {
    const t = i / STEPS;
    const eased = t * t * (3 - 2 * t);
    const alpha = Math.round((from + (to - from) * eased) * 255)
      .toString(16)
      .padStart(2, '0');
    return `${color}${alpha} ${(start + (end - start) * t).toFixed(1)}%`;
  });
  return `linear-gradient(to bottom, ${stops.join(', ')})`;
}

export type ProfileStyles = ReturnType<typeof createStyles>;

/** For the story tab's icon: a plus laid in the middle of a dashed ring. */
export const iconStyles = StyleSheet.create({
  stack: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  half: {
    overflow: 'hidden',
  },
  middle: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export function createStyles(colors: AppColors) {
  return StyleSheet.create({
    // Everything over the tabs, with room before them.
    headerBlock: {
      paddingBottom: 0,
    },
    root: {
      flex: 1,
      backgroundColor: colors.background,
    },
    pressed: {
      opacity: 0.7,
    },

    // The cover: a blurred picture, dark at the top for the bar over it and
    // fading into the page at the bottom.
    cover: {
      position: 'absolute',
      left: 0,
      right: 0,
      top: 0,
      overflow: 'hidden',
    },
    // Bigger than the cover all round: blurring fades a picture's edges to
    // see-through, which would show as a pale line along the top; these are
    // cut off instead.
    coverImage: {
      position: 'absolute',
      top: -COVER_BLEED,
      left: -COVER_BLEED,
      right: -COVER_BLEED,
      bottom: -COVER_BLEED,
    },
    coverPhoto: {
      width: '100%',
      height: '100%',
    },
    // Darker at the top, for the header over it; fading into the page at
    // the bottom, round the avatar.
    // Two eased fades (no corners in either, which read as a line): dark
    // under the header, easing off by two thirds down; the page's colour
    // rising from the middle to cover the foot.
    coverShade: {
      ...StyleSheet.absoluteFill,
      backgroundImage: [
        easedFade(colors.black, 0.35, 0, 0, 70),
        easedFade(colors.background, 0, 1, 58, 100),
      ].join(', '),
    },
    // Stays above the page: see-through on the cover, then filled in.
    header: {
      position: 'absolute',
      left: 0,
      right: 0,
      top: 0,
    },
    headerSolid: {
      ...StyleSheet.absoluteFill,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
      backgroundColor: colors.background,
    },
    topBar: {
      height: TOP_BAR_HEIGHT,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: SCREEN_PADDING,
    },
    // As in AppHeader on the other tabs, once the header's solid.
    brand: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: ms(8),
    },
    topActions: {
      flexDirection: 'row',
      gap: ms(8),
    },
    // Over the cover; the same size as the round buttons it turns into.
    glassButton: {
      width: TOP_BUTTON,
      height: TOP_BUTTON,
      borderRadius: TOP_BUTTON / 2,
      alignItems: 'center',
      justifyContent: 'center',
    },
    // Without liquid glass (before iOS 26, Android): a frosted fill.
    glassButtonFallback: {
      backgroundColor: `${colors.white}26`,
    },

    identity: {
      alignItems: 'center',
      paddingHorizontal: SCREEN_PADDING * 2,
    },
    avatarRing: {
      padding: AVATAR_RING,
      borderRadius: (AVATAR_SIZE + AVATAR_RING * 2) / 2,
      backgroundColor: colors.background,
    },
    avatarRingStory: {
      backgroundColor: colors.primary,
    },
    avatarGap: {
      padding: AVATAR_GAP,
      borderRadius: AVATAR_SIZE / 2,
      backgroundColor: colors.background,
    },
    cameraBadge: {
      position: 'absolute',
      right: AVATAR_RING,
      bottom: AVATAR_RING,
      width: CAMERA_BADGE,
      height: CAMERA_BADGE,
      borderRadius: CAMERA_BADGE / 2,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: ms(2),
      borderColor: colors.background,
      backgroundColor: colors.text,
    },
    name: {
      marginTop: ms(5),
      marginBottom: ms(4),
      fontSize: fs(21),
      lineHeight: fs(27),
      fontFamily: fonts.bold,
      letterSpacing: -0.3,
      color: colors.text,
      textAlign: 'center',
    },
    // Friends and activities, under the name.
    countsRow: {
      flexDirection: 'row',
      marginTop: ms(2),
    },
    countsItem: {
      flexDirection: 'row',
    },
    countsLine: {
      marginTop: ms(2),
    },
    counts: {
      fontSize: fs(12.5),
      fontFamily: fonts.bold,
      color: colors.text,
    },
    // Under the interests, centred like the name above.
    bioBlock: {
      alignItems: 'center',
      marginHorizontal: SCREEN_PADDING,
    },
    // A few words about them: smaller and softer than the name, kept to a
    // comfortable width so long ones wrap evenly.
    bio: {
      maxWidth: '88%',
      marginTop: ms(12),
      fontSize: fs(13),
      lineHeight: fs(19),
      fontFamily: fonts.regular,
      letterSpacing: 0.1,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    // In grey, with a pen: a nudge, not a call to action.
    addBio: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: ms(5),
      marginTop: ms(14),
    },
    addBioText: {
      fontSize: fs(13.5),
      fontFamily: fonts.medium,
      color: colors.textSecondary,
    },

    // What they're into, under the bio: one line, centred while it fits.
    interestsRow: {
      flexGrow: 0,
      marginTop: ms(16),
    },
    interests: {
      flexGrow: 1,
      justifyContent: 'center',
      gap: ms(5),
      paddingHorizontal: SCREEN_PADDING,
    },
    interest: {
      height: ms(26),
      flexDirection: 'row',
      alignItems: 'center',
      gap: ms(4),
      paddingHorizontal: ms(9),
      borderRadius: ms(13),
      backgroundColor: colors.surface,
    },
    interestPhoto: {
      width: ms(15),
      height: ms(15),
      borderRadius: ms(7.5),
    },
    interestEmoji: {
      fontSize: fs(11.5),
    },
    interestText: {
      fontSize: fs(11.5),
      fontFamily: fonts.semibold,
      color: colors.text,
    },
    // Friends who like the same things: a few faces, then the words.
    inCommon: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      gap: ms(8),
      marginTop: ms(16),
      marginHorizontal: SCREEN_PADDING,
    },
    inCommonFaces: {
      flexDirection: 'row',
    },
    inCommonFace: {
      width: ms(26),
      height: ms(26),
      borderRadius: ms(13),
      borderWidth: ms(2),
      borderColor: colors.background,
      backgroundColor: colors.surfaceHigh,
    },
    faceOverlap: {
      marginLeft: -ms(8),
    },
    inCommonMore: {
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.text,
    },
    inCommonText: {
      fontSize: fs(13),
      fontFamily: fonts.medium,
      color: colors.text,
    },
    interestAdd: {
      borderStyle: 'dashed',
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: 'transparent',
    },
    interestAddText: {
      fontSize: fs(11.5),
      fontFamily: fonts.medium,
      color: colors.textSecondary,
    },

    // What tapping the photo offers.
    sheetRoot: {
      flex: 1,
    },
    sheetBackdrop: {
      flex: 1,
      backgroundColor: `${colors.black}66`,
    },
    sheet: {
      paddingHorizontal: SCREEN_PADDING,
      paddingTop: ms(10),
      borderTopLeftRadius: ms(24),
      borderTopRightRadius: ms(24),
      backgroundColor: colors.card,
    },
    sheetHandle: {
      alignSelf: 'center',
      width: ms(38),
      height: ms(4),
      borderRadius: ms(2),
      marginBottom: ms(10),
      backgroundColor: colors.surfaceHigh,
    },
    sheetAction: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: ms(14),
      paddingVertical: ms(18),
    },
    sheetActionDivided: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
    },
    sheetActionText: {
      fontSize: fs(15),
      fontFamily: fonts.medium,
      color: colors.text,
    },

    // A pinned story's title, in its sheet.
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: ms(10),
      paddingTop: ms(10),
    },
    titleThumb: {
      width: ms(44),
      height: ms(44),
      borderRadius: ms(22),
      overflow: 'hidden',
      backgroundColor: colors.surfaceHigh,
    },
    titleField: {
      flex: 1,
      height: ms(44),
      flexDirection: 'row',
      alignItems: 'center',
      gap: ms(8),
      paddingHorizontal: ms(14),
      borderRadius: ms(12),
      backgroundColor: colors.surface,
    },
    titleInput: {
      flex: 1,
      padding: 0,
      fontSize: fs(15),
      fontFamily: fonts.medium,
      color: colors.text,
    },
    titleSave: {
      height: ms(44),
      justifyContent: 'center',
      paddingHorizontal: ms(16),
      borderRadius: ms(12),
      backgroundColor: colors.primary,
    },
    titleSaveText: {
      fontSize: fs(14),
      fontFamily: fonts.semibold,
      color: colors.white,
    },
    titleHint: {
      marginTop: ms(10),
      marginBottom: ms(10),
      fontSize: fs(12),
      fontFamily: fonts.regular,
      color: colors.textMuted,
    },

    // Where they live and where they're from: worded and spaced like the
    // friends-in-common row above.
    places: {
      alignSelf: 'stretch',
      gap: ms(10),
      marginTop: ms(14),
      marginHorizontal: SCREEN_PADDING,
    },
    place: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: ms(8),
    },
    placeText: {
      flexShrink: 1,
      fontSize: fs(13),
      fontFamily: fonts.medium,
      color: colors.text,
    },
    placeName: {
      fontFamily: fonts.bold,
      color: colors.text,
    },

    // Someone else's name, once the header's solid: like a screen title.
    headerName: {
      flexShrink: 1,
      fontSize: fs(17),
      lineHeight: fs(22),
      fontFamily: fonts.bold,
      letterSpacing: -0.3,
      color: colors.text,
    },
    // Someone else's: the way back and, once solid, their name.
    backRow: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: ms(10),
    },
    // Someone else's: what they have in common with the user.
    common: {
      alignSelf: 'stretch',
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: ms(8),
      marginTop: ms(16),
      marginHorizontal: SCREEN_PADDING,
      paddingHorizontal: ms(12),
      paddingVertical: ms(10),
      borderRadius: ms(12),
      borderCurve: 'continuous',
      backgroundColor: colors.primarySoft,
    },
    commonText: {
      flex: 1,
      fontSize: fs(13),
      lineHeight: fs(18),
      fontFamily: fonts.regular,
      color: colors.text,
    },
    commonLead: {
      fontFamily: fonts.semibold,
    },
    // The user's own two buttons, last before the tabs: room under them.
    actionsOverTabs: {
      marginBottom: ms(8),
    },
    // Someone else's two buttons share the row evenly.
    actionEven: {
      flex: 1,
    },

    // No stories pinned yet: add one, or edit the profile.
    actions: {
      alignSelf: 'stretch',
      flexDirection: 'row',
      gap: ms(8),
      marginTop: ms(18),
      marginHorizontal: SCREEN_PADDING,
    },
    // Edit takes what adding a story leaves.
    action: {
      flex: 1,
      height: ms(36),
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: ms(5),
      paddingHorizontal: ms(12),
      borderRadius: ms(10),
      borderCurve: 'continuous',
      backgroundColor: colors.surfaceMuted,
    },
    actionPrimary: {
      flex: 0,
      backgroundColor: colors.primary,
    },
    actionText: {
      flexShrink: 1,
      fontSize: fs(13),
      fontFamily: fonts.semibold,
      color: colors.text,
    },
    actionTextPrimary: {
      color: colors.white,
    },

    // "New story", then the stories pinned to the profile.
    highlights: {
      gap: ms(14),
      paddingHorizontal: SCREEN_PADDING,
      paddingTop: ms(14),
    },
    highlight: {
      width: HIGHLIGHT_SIZE + ms(4),
      alignItems: 'center',
      gap: ms(4),
    },
    highlightRing: {
      padding: ms(2),
      borderRadius: HIGHLIGHT_SIZE,
      borderWidth: ms(2),
      borderColor: 'transparent',
    },
    highlightRingPinned: {
      borderColor: colors.border,
    },
    highlightImage: {
      width: HIGHLIGHT_SIZE - ms(4),
      height: HIGHLIGHT_SIZE - ms(4),
      borderRadius: HIGHLIGHT_SIZE,
      backgroundColor: colors.surfaceHigh,
    },
    highlightAdd: {
      width: HIGHLIGHT_SIZE - ms(4),
      height: HIGHLIGHT_SIZE - ms(4),
      borderRadius: HIGHLIGHT_SIZE,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primary,
    },
    highlightTitle: {
      alignSelf: 'stretch',
    },
    highlightLabel: {
      textAlign: 'center',
      fontSize: fs(11.5),
      fontFamily: fonts.medium,
      color: colors.textSecondary,
    },

    // Over the page once it's scrolled past the tabs, under the header.
    stuckTabs: {
      position: 'absolute',
      left: 0,
      right: 0,
      backgroundColor: colors.background,
    },
    tabs: {
      flexDirection: 'row',
      paddingHorizontal: SCREEN_PADDING,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
      backgroundColor: colors.background,
    },
    tab: {
      flex: 1,
      height: ms(42),
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: ms(6),
    },
    tabText: {
      fontSize: fs(13.5),
      fontFamily: fonts.medium,
      color: colors.textMuted,
    },
    tabTextOn: {
      fontFamily: fonts.semibold,
      color: colors.text,
    },
    // Its width and place are the tab's; it slides along.
    tabLine: {
      position: 'absolute',
      left: SCREEN_PADDING + ms(18),
      bottom: -StyleSheet.hairlineWidth,
      height: ms(2),
      borderRadius: ms(1),
      backgroundColor: colors.primary,
    },

    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: GRID_GAP,
      paddingHorizontal: SCREEN_PADDING,
      paddingTop: ms(12),
    },
    tile: {
      borderRadius: ms(14),
      borderCurve: 'continuous',
      overflow: 'hidden',
      backgroundColor: colors.surfaceHigh,
    },
    tileImage: {
      width: '100%',
      height: '100%',
    },
    tileEmpty: {
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primarySoft,
    },
    tileEmoji: {
      fontSize: fs(30),
    },
    // Dark only at the bottom, under the words.
    tileShade: {
      ...StyleSheet.absoluteFill,
      justifyContent: 'flex-end',
      padding: ms(8),
      backgroundImage: `linear-gradient(to bottom, ${colors.black}00 45%, ${colors.black}B3 100%)`,
    },
    tileTitle: {
      fontSize: fs(12),
      lineHeight: fs(15),
      fontFamily: fonts.semibold,
      color: colors.white,
    },
    tileMeta: {
      marginTop: ms(2),
      fontSize: fs(10.5),
      fontFamily: fonts.medium,
      color: `${colors.white}CC`,
    },
    tileLive: {
      position: 'absolute',
      top: ms(8),
      left: ms(8),
      flexDirection: 'row',
      alignItems: 'center',
      gap: ms(4),
      paddingHorizontal: ms(7),
      paddingVertical: ms(3),
      borderRadius: ms(10),
      backgroundColor: colors.success,
    },
    tileLiveDot: {
      width: ms(5),
      height: ms(5),
      borderRadius: ms(2.5),
      backgroundColor: colors.white,
    },
    tileLiveText: {
      fontSize: fs(10),
      fontFamily: fonts.bold,
      color: colors.white,
    },
    // A clip, in the corner of its story tile.
    storyPlay: {
      position: 'absolute',
      top: ms(8),
      right: ms(8),
      width: ms(22),
      height: ms(22),
      borderRadius: ms(11),
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: `${colors.black}66`,
    },
    empty: {
      alignItems: 'center',
      gap: ms(10),
      paddingTop: ms(40),
      paddingHorizontal: ms(40),
    },
    emptyText: {
      fontSize: fs(13.5),
      lineHeight: fs(19),
      fontFamily: fonts.regular,
      color: colors.textSecondary,
      textAlign: 'center',
    },
  });
}
