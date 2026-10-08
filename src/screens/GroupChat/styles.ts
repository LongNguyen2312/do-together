import { StyleSheet } from 'react-native';
import { ms } from 'react-native-size-matters';

import { fonts, fs, type AppColors } from '@/theme';

const SCREEN_PADDING = ms(16);
const HEADER_AVATAR = ms(38);
const AVATAR = ms(30);
const INPUT_HEIGHT = ms(46);
const PHOTO_WIDTH = ms(108);
const PHOTO_HEIGHT = ms(136);
const STICKER_PANEL_HEIGHT = ms(300);
export const STICKER_GRID_PADDING = ms(8);

export type GroupChatStyles = ReturnType<typeof createStyles>;

/** Soft glow rising from the bottom, shared by the chat list and group chats. */
export const chatBackground = (colors: AppColors, isDark: boolean) =>
  `linear-gradient(to bottom, ${colors.background} 35%, ${colors.primarySoft}${
    isDark ? 'E6' : 'B3'
  } 100%)`;

export function createStyles(colors: AppColors) {
  return StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: colors.background,
    },
    flex: {
      flex: 1,
    },
    hidden: {
      display: 'none',
    },
    pressed: {
      opacity: 0.7,
    },

    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: ms(10),
      height: ms(58),
      paddingHorizontal: ms(8),
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    iconButton: {
      width: ms(36),
      height: ms(36),
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerAvatar: {
      width: HEADER_AVATAR,
      height: HEADER_AVATAR,
      borderRadius: HEADER_AVATAR / 2,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primarySoft,
    },
    headerEmoji: {
      fontSize: fs(18),
    },
    headerBody: {
      flex: 1,
    },
    headerTitle: {
      fontSize: fs(15),
      fontFamily: fonts.semibold,
      letterSpacing: -0.2,
      color: colors.text,
    },
    headerSubtitle: {
      marginTop: ms(1),
      fontSize: fs(11.5),
      fontFamily: fonts.regular,
      color: colors.textSecondary,
    },
    headerIdentity: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: ms(10),
    },

    list: {
      paddingHorizontal: SCREEN_PADDING,
      paddingVertical: ms(12),
    },
    timeLabel: {
      marginTop: ms(14),
      marginBottom: ms(6),
      marginLeft: AVATAR + ms(8),
      fontSize: fs(11),
      fontFamily: fonts.medium,
      color: colors.textMuted,
    },
    timeLabelMine: {
      marginLeft: 0,
      textAlign: 'right',
    },

    row: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: ms(8),
      marginTop: ms(4),
    },
    rowMine: {
      justifyContent: 'flex-end',
    },
    rowGroupStart: {
      marginTop: ms(10),
    },
    avatarSlot: {
      width: AVATAR,
    },
    avatar: {
      width: AVATAR,
      height: AVATAR,
      borderRadius: AVATAR / 2,
    },
    content: {
      maxWidth: '78%',
      alignItems: 'flex-start',
    },
    contentMine: {
      alignItems: 'flex-end',
    },
    bubble: {
      paddingHorizontal: ms(14),
      paddingVertical: ms(9),
      borderRadius: ms(20),
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: `${colors.border}B3`,
      backgroundColor: `${colors.card}C7`,
    },
    bubbleMine: {
      borderColor: 'transparent',
      backgroundColor: `${colors.text}F2`,
    },
    bubbleGlassed: {
      overflow: 'hidden',
      borderColor: 'transparent',
      backgroundColor: 'transparent',
    },
    bubbleGlass: {
      position: 'absolute',
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
    },
    senderName: {
      marginBottom: ms(2),
      fontSize: fs(11.5),
      fontFamily: fonts.semibold,
    },
    messageText: {
      fontSize: fs(14.5),
      lineHeight: fs(20),
      fontFamily: fonts.regular,
      color: colors.text,
    },
    messageTextMine: {
      color: colors.background,
    },
    mention: {
      fontFamily: fonts.semibold,
      color: colors.primary,
    },

    photoStack: {
      width: PHOTO_WIDTH * 2,
      height: PHOTO_HEIGHT + ms(16),
      alignItems: 'center',
      justifyContent: 'center',
    },
    photo: {
      position: 'absolute',
      width: PHOTO_WIDTH,
      height: PHOTO_HEIGHT,
      borderRadius: ms(14),
      borderWidth: ms(2),
      borderColor: colors.background,
      backgroundColor: colors.surfaceHigh,
    },
    photoBack: {
      overflow: 'hidden',
    },
    photoLeft: {
      left: ms(4),
      transform: [{ rotate: '-9deg' }],
    },
    photoRight: {
      right: ms(4),
      transform: [{ rotate: '9deg' }],
    },
    photoFront: {
      overflow: 'hidden',
      shadowColor: colors.black,
      shadowOpacity: 0.25,
      shadowRadius: ms(10),
      shadowOffset: { width: 0, height: ms(4) },
      elevation: 6,
    },
    photoFill: {
      width: '100%',
      height: '100%',
    },
    morePhotos: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      paddingVertical: ms(8),
      alignItems: 'center',
      backgroundColor: `${colors.black}59`,
    },
    morePhotosText: {
      fontSize: fs(12),
      fontFamily: fonts.semibold,
      color: colors.white,
    },
    reactions: {
      flexDirection: 'row',
      gap: ms(4),
      marginTop: -ms(6),
      alignSelf: 'flex-end',
    },
    reaction: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: ms(3),
      paddingHorizontal: ms(7),
      paddingVertical: ms(3),
      borderRadius: ms(999),
      borderWidth: ms(1.5),
      borderColor: colors.background,
      backgroundColor: colors.surfaceMuted,
    },
    reactionText: {
      fontSize: fs(11),
      fontFamily: fonts.semibold,
      color: colors.text,
    },
    reactionMine: {
      backgroundColor: colors.primarySoft,
    },
    reportedRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: ms(4),
      marginTop: ms(4),
    },
    reportedText: {
      fontSize: fs(11),
      fontFamily: fonts.medium,
      color: colors.textMuted,
    },

    quote: {
      marginTop: ms(2),
      marginBottom: ms(6),
      paddingVertical: ms(5),
      paddingHorizontal: ms(9),
      borderLeftWidth: ms(3),
      borderLeftColor: colors.primary,
      borderRadius: ms(8),
      backgroundColor: `${colors.text}0F`,
    },
    quoteMine: {
      borderLeftColor: colors.primarySoft,
      backgroundColor: `${colors.background}24`,
    },
    quoteName: {
      fontSize: fs(11.5),
      fontFamily: fonts.semibold,
      color: colors.primary,
    },
    quoteNameMine: {
      color: colors.background,
    },
    quoteText: {
      marginTop: ms(1),
      fontSize: fs(12.5),
      fontFamily: fonts.regular,
      color: colors.textSecondary,
    },
    quoteTextMine: {
      color: colors.background,
      opacity: 0.8,
    },
    bubbleHighlighted: {
      borderWidth: ms(2),
      borderColor: colors.primary,
    },
    senderNameOutside: {
      marginLeft: ms(4),
    },

    voice: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: ms(10),
      minWidth: ms(190),
      paddingVertical: ms(2),
    },
    voiceButton: {
      width: ms(34),
      height: ms(34),
      borderRadius: ms(17),
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primary,
    },
    voiceButtonMine: {
      backgroundColor: colors.background,
    },
    wave: {
      flex: 1,
      height: ms(26),
      flexDirection: 'row',
      alignItems: 'center',
      gap: ms(2),
    },
    waveBar: {
      flex: 1,
      borderRadius: ms(2),
    },
    waveBarIdle: {
      opacity: 0.35,
    },
    voiceTime: {
      minWidth: ms(30),
      fontSize: fs(12),
      fontFamily: fonts.medium,
      fontVariant: ['tabular-nums'],
      textAlign: 'right',
      color: colors.textSecondary,
    },

    sticker: {
      paddingVertical: ms(4),
      borderRadius: ms(16),
    },
    stickerHighlighted: {
      backgroundColor: colors.primarySoft,
    },
    stickerPanel: {
      height: STICKER_PANEL_HEIGHT,
      marginTop: ms(8),
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
      backgroundColor: colors.card,
    },
    stickerTabs: {
      flexDirection: 'row',
      gap: ms(6),
      paddingHorizontal: SCREEN_PADDING,
      paddingVertical: ms(8),
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    stickerTab: {
      width: ms(40),
      height: ms(36),
      borderRadius: ms(12),
      alignItems: 'center',
      justifyContent: 'center',
    },
    stickerTabActive: {
      backgroundColor: colors.surfaceMuted,
    },
    stickerCredit: {
      marginTop: ms(24),
      paddingHorizontal: SCREEN_PADDING,
      textAlign: 'center',
      fontSize: fs(10.5),
      fontFamily: fonts.regular,
      color: colors.textMuted,
    },
    stickerCreditLink: {
      color: colors.primary,
      textDecorationLine: 'underline',
    },
    stickerGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      paddingHorizontal: STICKER_GRID_PADDING,
      paddingTop: ms(8),
    },
    stickerCell: {
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: ms(16),
    },
    stickerCellPressed: {
      transform: [{ scale: 0.88 }],
    },

    photoSingle: {
      width: PHOTO_WIDTH * 1.7,
      height: PHOTO_HEIGHT * 1.3,
      borderRadius: ms(16),
      overflow: 'hidden',
      backgroundColor: colors.surfaceHigh,
      marginBottom: ms(4),
    },

    sheetBackdrop: {
      flex: 1,
      backgroundColor: `${colors.black}66`,
    },
    sheet: {
      paddingHorizontal: SCREEN_PADDING,
      paddingTop: ms(8),
      borderTopLeftRadius: ms(24),
      borderTopRightRadius: ms(24),
      backgroundColor: colors.card,
    },
    sheetHandle: {
      alignSelf: 'center',
      width: ms(38),
      height: ms(4),
      borderRadius: ms(2),
      marginBottom: ms(12),
      backgroundColor: colors.surfaceHigh,
    },
    sheetPreview: {
      padding: ms(12),
      borderRadius: ms(14),
      backgroundColor: colors.surface,
    },
    sheetPreviewName: {
      fontSize: fs(12),
      fontFamily: fonts.semibold,
      color: colors.textSecondary,
    },
    sheetPreviewText: {
      marginTop: ms(2),
      fontSize: fs(14),
      fontFamily: fonts.regular,
      color: colors.text,
    },
    quickReactions: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginVertical: ms(14),
    },
    quickReaction: {
      width: ms(46),
      height: ms(46),
      borderRadius: ms(23),
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surface,
    },
    quickReactionActive: {
      backgroundColor: colors.primarySoft,
      borderWidth: ms(1.5),
      borderColor: colors.primary,
    },
    quickReactionEmoji: {
      fontSize: fs(22),
    },
    sheetAction: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: ms(14),
      paddingVertical: ms(14),
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
    },
    sheetActionText: {
      fontSize: fs(15),
      fontFamily: fonts.medium,
    },
    reportHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: ms(8),
    },
    reportTitle: {
      fontSize: fs(17),
      fontFamily: fonts.bold,
      color: colors.text,
    },
    reportSubtitle: {
      marginTop: ms(6),
      marginBottom: ms(8),
      fontSize: fs(13),
      lineHeight: fs(18),
      fontFamily: fonts.regular,
      color: colors.textSecondary,
    },
    reasonRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: ms(13),
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    reasonText: {
      fontSize: fs(14.5),
      fontFamily: fonts.medium,
      color: colors.text,
    },
    reportButton: {
      height: ms(50),
      marginTop: ms(16),
      borderRadius: ms(14),
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.danger,
    },
    reportButtonDisabled: {
      opacity: 0.4,
    },
    reportButtonText: {
      fontSize: fs(15),
      fontFamily: fonts.bold,
      color: colors.white,
    },

    composerWrap: {
      paddingTop: ms(8),
    },
    endedNotice: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: ms(8),
      marginHorizontal: SCREEN_PADDING,
      marginTop: ms(8),
      paddingHorizontal: ms(16),
      paddingVertical: ms(12),
      borderRadius: ms(14),
      backgroundColor: colors.surfaceMuted,
    },
    endedNoticeText: {
      flexShrink: 1,
      fontSize: fs(13),
      lineHeight: fs(18),
      fontFamily: fonts.medium,
      color: colors.textSecondary,
    },
    replyBar: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: ms(10),
      marginHorizontal: SCREEN_PADDING,
      marginBottom: ms(8),
      paddingVertical: ms(8),
      paddingRight: ms(12),
      borderRadius: ms(14),
      overflow: 'hidden',
      backgroundColor: colors.card,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    replyBarAccent: {
      alignSelf: 'stretch',
      width: ms(4),
      backgroundColor: colors.primary,
    },
    replyBarTitle: {
      fontSize: fs(12),
      fontFamily: fonts.semibold,
      color: colors.primary,
    },
    replyBarText: {
      marginTop: ms(1),
      fontSize: fs(13),
      fontFamily: fonts.regular,
      color: colors.textSecondary,
    },
    mentions: {
      marginHorizontal: SCREEN_PADDING,
      marginBottom: ms(8),
      paddingVertical: ms(4),
      borderRadius: ms(18),
    },
    mentionsFallback: {
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      backgroundColor: colors.card,
      shadowColor: colors.black,
      shadowOpacity: 0.06,
      shadowRadius: ms(8),
      shadowOffset: { width: 0, height: ms(2) },
      elevation: 2,
    },
    mentionOption: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: ms(10),
      marginHorizontal: ms(4),
      paddingHorizontal: ms(8),
      paddingVertical: ms(7),
      borderRadius: ms(14),
    },
    mentionOptionPressed: {
      backgroundColor: `${colors.text}0F`,
    },
    inputMention: {
      fontFamily: fonts.semibold,
      color: colors.primary,
    },
    mentionAvatar: {
      width: ms(30),
      height: ms(30),
      borderRadius: ms(15),
    },
    mentionName: {
      flex: 1,
      fontSize: fs(14),
      fontFamily: fonts.semibold,
      color: colors.text,
    },
    mentionHost: {
      paddingHorizontal: ms(7),
      paddingVertical: ms(2),
      borderRadius: ms(999),
      overflow: 'hidden',
      fontSize: fs(10.5),
      fontFamily: fonts.semibold,
      color: colors.primaryDark,
      backgroundColor: colors.primarySoft,
    },
    recording: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: ms(8),
      paddingVertical: ms(10),
    },
    recordingText: {
      fontSize: fs(14),
      fontFamily: fonts.medium,
      color: colors.text,
    },
    sendButtonRecording: {
      backgroundColor: colors.danger,
      shadowColor: colors.danger,
    },

    composer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: ms(10),
      paddingHorizontal: SCREEN_PADDING,
    },
    inputPill: {
      flex: 1,
      minHeight: INPUT_HEIGHT,
      flexDirection: 'row',
      alignItems: 'center',
      gap: ms(8),
      paddingHorizontal: ms(14),
      borderRadius: INPUT_HEIGHT / 2,
    },
    inputFallback: {
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      backgroundColor: colors.card,
      shadowColor: colors.black,
      shadowOpacity: 0.06,
      shadowRadius: ms(8),
      shadowOffset: { width: 0, height: ms(2) },
      elevation: 2,
    },
    input: {
      flex: 1,
      maxHeight: ms(110),
      paddingVertical: ms(10),
      fontSize: fs(14.5),
      fontFamily: fonts.regular,
      color: colors.text,
    },
    sendButton: {
      width: INPUT_HEIGHT,
      height: INPUT_HEIGHT,
      borderRadius: INPUT_HEIGHT / 2,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primary,
      shadowColor: colors.primary,
      shadowOpacity: 0.35,
      shadowRadius: ms(8),
      shadowOffset: { width: 0, height: ms(4) },
      elevation: 4,
    },
  });
}
