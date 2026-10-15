import { StyleSheet } from 'react-native';
import { ms } from 'react-native-size-matters';

import { STORY_FOOTER } from '@/hooks/useStoryCanvas';
import { fonts, fs, type AppColors } from '@/theme';

const TOOL_SIZE = ms(44);
/** The share buttons match the tool buttons. */
export const SEND_SIZE = TOOL_SIZE;
const TRASH_SIZE = ms(56);
const SWATCH_SIZE = ms(28);

/** Cover colours for the songs in the music sheet, in turn. */
export const ART_GRADIENTS = [
  ['#FF8A5B', '#FF3D77'],
  ['#7F5AF0', '#2CB1FF'],
  ['#00C9A7', '#0077FF'],
  ['#FFB443', '#FF5A36'],
  ['#F15BB5', '#9B5DE5'],
  ['#2BD9A0', '#1FA2FF'],
  ['#FA709A', '#FEC140'],
  ['#4FACFE', '#5B4BDB'],
];

/** Colours offered for text, like the usual story apps. */
export const TEXT_COLORS = [
  '#FFFFFF',
  '#111111',
  '#FF5A36',
  '#FFC93C',
  '#3DD68C',
  '#3B8FE0',
  '#9B6CF2',
  '#FF6FAE',
];

export type StoryEditorStyles = ReturnType<typeof createStyles>;

export function createStyles(colors: AppColors) {
  /** The ✕'s see-through dark as it looks over a photo, on plain black. */
  const shareButton = `${colors.white}33`;
  return StyleSheet.create({
    flex: {
      flex: 1,
    },
    root: {
      flex: 1,
      backgroundColor: colors.black,
    },
    fill: {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
    },

    // The story's frame, as in the viewer (see useStoryCanvas).
    canvas: {
      position: 'absolute',
      left: 0,
      width: '100%',
      overflow: 'hidden',
      borderRadius: ms(12),
    },

    top: {
      position: 'absolute',
      top: 0,
      right: 0,
      left: 0,
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      paddingHorizontal: ms(12),
    },
    tools: {
      gap: ms(12),
    },
    tool: {
      width: TOOL_SIZE,
      height: TOOL_SIZE,
      borderRadius: TOOL_SIZE / 2,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: `${colors.black}59`,
    },
    toolActive: {
      backgroundColor: colors.primary,
    },
    toolText: {
      fontSize: fs(17),
      fontFamily: fonts.bold,
      color: colors.white,
    },
    pressed: {
      opacity: 0.7,
    },

    musicChipWrap: {
      flexShrink: 1,
      marginTop: ms(6),
      marginHorizontal: ms(10),
    },
    // The same see-through dark as the tool buttons around it.
    musicChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: ms(7),
      paddingLeft: ms(12),
      paddingRight: ms(6),
      paddingVertical: ms(7),
      borderRadius: ms(18),
      backgroundColor: `${colors.black}59`,
    },
    musicChipText: {
      flexShrink: 1,
      fontSize: fs(13),
      fontFamily: fonts.semibold,
      color: colors.white,
    },

    bottom: {
      position: 'absolute',
      right: 0,
      bottom: 0,
      left: 0,
      paddingHorizontal: ms(12),
    },
    shareBar: {
      height: STORY_FOOTER,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: ms(12),
    },
    // "Your story": who'll see it, and the main way to share.
    yourStory: {
      flexShrink: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: ms(8),
      height: SEND_SIZE,
      paddingLeft: ms(6),
      paddingRight: ms(14),
      borderRadius: SEND_SIZE / 2,
      backgroundColor: shareButton,
    },
    yourStoryAvatar: {
      width: ms(30),
      height: ms(30),
      borderRadius: ms(15),
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primary,
    },
    yourStoryInitials: {
      fontSize: fs(13),
      fontFamily: fonts.bold,
      color: colors.white,
    },
    yourStoryText: {
      flexShrink: 1,
      fontSize: fs(14),
      fontFamily: fonts.semibold,
      color: colors.white,
    },
    send: {
      width: SEND_SIZE,
      height: SEND_SIZE,
      borderRadius: SEND_SIZE / 2,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: shareButton,
    },
    sendFailed: {
      backgroundColor: colors.danger,
    },
    sendIcon: {
      marginLeft: ms(2),
    },
    // Fills clockwise from the top.
    sendRing: {
      position: 'absolute',
      transform: [{ rotate: '-90deg' }],
    },
    sendPercent: {
      fontSize: fs(12),
      fontFamily: fonts.bold,
      color: colors.white,
    },

    trash: {
      position: 'absolute',
      alignSelf: 'center',
      width: TRASH_SIZE,
      height: TRASH_SIZE,
      borderRadius: TRASH_SIZE / 2,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1.5,
      borderColor: `${colors.white}CC`,
      backgroundColor: `${colors.black}59`,
    },

    overlayItem: {
      position: 'absolute',
      top: 0,
      left: 0,
    },

    // Text composer
    composer: {
      backgroundColor: `${colors.black}99`,
    },
    composerBody: {
      flex: 1,
    },
    composerTop: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      paddingHorizontal: ms(16),
    },
    done: {
      paddingHorizontal: ms(16),
      paddingVertical: ms(8),
      borderRadius: ms(18),
      backgroundColor: colors.white,
    },
    doneText: {
      fontSize: fs(14),
      fontFamily: fonts.semibold,
      color: colors.black,
    },
    composerField: {
      flex: 1,
      justifyContent: 'center',
      paddingHorizontal: ms(24),
    },
    composerInput: {
      fontSize: fs(30),
      fontFamily: fonts.bold,
      textAlign: 'center',
    },
    swatches: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: ms(12),
      paddingVertical: ms(14),
    },
    swatch: {
      width: SWATCH_SIZE,
      height: SWATCH_SIZE,
      borderRadius: SWATCH_SIZE / 2,
      borderWidth: 2,
      borderColor: `${colors.white}99`,
    },
    swatchActive: {
      borderColor: colors.white,
      transform: [{ scale: 1.2 }],
    },

    // Bottom sheets
    // Clear: the story stays in full view above the panel.
    sheetBackdrop: {
      flex: 1,
      justifyContent: 'flex-end',
    },
    sheet: {
      height: '70%',
      overflow: 'hidden',
      borderTopLeftRadius: ms(26),
      borderTopRightRadius: ms(26),
    },
    sheetGlass: {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
    },
    // Without liquid glass (before iOS 26, Android): a slightly see-through fill.
    sheetGlassFallback: {
      backgroundColor: `${colors.surface}EB`,
    },
    sheetHandle: {
      alignSelf: 'center',
      width: ms(40),
      height: ms(4),
      marginTop: ms(8),
      borderRadius: ms(2),
      backgroundColor: colors.border,
    },
    sheetHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: ms(12),
      paddingHorizontal: ms(18),
      paddingTop: ms(10),
      paddingBottom: ms(12),
    },
    sheetHeading: {
      flex: 1,
      gap: ms(2),
    },
    sheetTitle: {
      fontSize: fs(18),
      fontFamily: fonts.bold,
      color: colors.text,
    },
    sheetSubtitle: {
      fontSize: fs(12.5),
      fontFamily: fonts.regular,
      color: colors.textSecondary,
    },
    sheetClose: {
      width: ms(32),
      height: ms(32),
      borderRadius: ms(16),
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: `${colors.text}14`,
    },
    sheetContent: {
      paddingHorizontal: ms(12),
    },
    packTitle: {
      paddingHorizontal: ms(6),
      paddingTop: ms(14),
      paddingBottom: ms(6),
      fontSize: fs(13),
      fontFamily: fonts.semibold,
      color: colors.textSecondary,
    },
    stickerGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    stickerCell: {
      width: '25%',
      minHeight: ms(84),
      alignItems: 'center',
      justifyContent: 'center',
    },
    credit: {
      paddingHorizontal: ms(6),
      paddingTop: ms(16),
      fontSize: fs(11),
      fontFamily: fonts.regular,
      color: colors.textSecondary,
    },
    creditLink: {
      textDecorationLine: 'underline',
    },

    // Music
    musicList: {
      gap: ms(6),
      paddingHorizontal: ms(14),
      paddingBottom: ms(16),
    },
    track: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: ms(10),
      padding: ms(8),
      borderRadius: ms(14),
      borderWidth: 1.5,
      borderColor: 'transparent',
      // See-through, so the glass behind still shows.
      backgroundColor: `${colors.card}99`,
    },
    // Solid brand orange with white on it: unmissable on the glass.
    trackSelected: {
      borderColor: colors.primary,
      backgroundColor: colors.primary,
    },
    trackArtOn: {
      backgroundColor: `${colors.white}33`,
    },
    textOn: {
      color: colors.white,
    },
    metaOn: {
      color: `${colors.white}D9`,
    },
    trackPreviewOn: {
      backgroundColor: colors.white,
    },
    trackArt: {
      width: ms(44),
      height: ms(44),
      borderRadius: ms(12),
      overflow: 'hidden',
      alignItems: 'center',
      justifyContent: 'center',
    },
    trackArtPlain: {
      backgroundColor: `${colors.text}14`,
    },
    trackBody: {
      flex: 1,
      gap: ms(2),
    },
    trackTitle: {
      fontSize: fs(14),
      fontFamily: fonts.semibold,
      color: colors.text,
    },
    trackMetaRow: {
      flexDirection: 'row',
    },
    trackMeta: {
      fontSize: fs(12),
      fontFamily: fonts.regular,
      color: colors.textSecondary,
    },
    trackMetaLive: {
      fontFamily: fonts.semibold,
      color: colors.primary,
    },
    trackPreview: {
      width: ms(34),
      height: ms(34),
      borderRadius: ms(17),
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: `${colors.text}14`,
    },
    trackPreviewLive: {
      backgroundColor: colors.primary,
    },
    selectedTag: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: ms(4),
    },
    // Only ever on the selected row's orange.
    selectedTagText: {
      fontSize: fs(12),
      fontFamily: fonts.semibold,
      color: colors.white,
    },
    sheetState: {
      alignItems: 'center',
      gap: ms(12),
      paddingTop: ms(40),
      paddingHorizontal: ms(24),
    },
    sheetStateText: {
      textAlign: 'center',
      fontSize: fs(14),
      fontFamily: fonts.regular,
      color: colors.textSecondary,
    },
    retry: {
      paddingHorizontal: ms(18),
      paddingVertical: ms(9),
      borderRadius: ms(18),
      backgroundColor: colors.primary,
    },
    retryText: {
      fontSize: fs(14),
      fontFamily: fonts.semibold,
      color: colors.white,
    },
  });
}
