import { StyleSheet } from 'react-native';
import { ms } from 'react-native-size-matters';

import { fonts, fs, type AppColors } from '@/theme';

const AVATAR_SIZE = ms(34);

export type StoryViewerStyles = ReturnType<typeof createStyles>;

export function createStyles(colors: AppColors) {
  return StyleSheet.create({
    // See-through, so the chats show once a pull down fades the backdrop.
    root: {
      flex: 1,
    },
    layer: {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
    },
    faceBackground: {
      backgroundColor: colors.black,
    },
    // The story's frame: top of the safe area to just above the message field.
    canvas: {
      position: 'absolute',
      left: 0,
      width: '100%',
      overflow: 'hidden',
      borderRadius: ms(12),
    },
    sideDim: {
      backgroundColor: colors.black,
    },
    // Keeps the bars and names readable on bright photos.
    shade: {
      position: 'absolute',
      top: 0,
      right: 0,
      left: 0,
      height: ms(180),
      backgroundImage: `linear-gradient(to bottom, ${colors.black}8C 0%, ${colors.black}00 100%)`,
    },

    // Keeps the reply bar readable at the bottom.
    footShade: {
      position: 'absolute',
      right: 0,
      bottom: 0,
      left: 0,
      height: ms(220),
      backgroundImage: `linear-gradient(to top, ${colors.black}99 0%, ${colors.black}00 100%)`,
    },

    top: {
      position: 'absolute',
      top: 0,
      right: 0,
      left: 0,
      paddingHorizontal: ms(10),
      gap: ms(12),
    },
    bars: {
      flexDirection: 'row',
      gap: ms(4),
    },
    bar: {
      flex: 1,
      height: ms(2.5),
      borderRadius: ms(2),
      overflow: 'hidden',
      backgroundColor: `${colors.white}59`,
    },
    barFill: {
      height: '100%',
      backgroundColor: colors.white,
    },

    meta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: ms(8),
      paddingHorizontal: ms(4),
    },
    avatar: {
      width: AVATAR_SIZE,
      height: AVATAR_SIZE,
      borderRadius: AVATAR_SIZE / 2,
    },
    avatarInitials: {
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primary,
    },
    avatarText: {
      fontSize: fs(12),
      fontFamily: fonts.bold,
      color: colors.white,
    },
    name: {
      flexShrink: 1,
      fontSize: fs(14),
      fontFamily: fonts.semibold,
      color: colors.white,
    },
    time: {
      fontSize: fs(13),
      fontFamily: fonts.regular,
      color: `${colors.white}B3`,
    },
    spacer: {
      flex: 1,
    },
    // As in the editor: the song, on see-through dark.
    musicChip: {
      alignSelf: 'flex-start',
      maxWidth: '70%',
      flexDirection: 'row',
      alignItems: 'center',
      gap: ms(6),
      marginLeft: ms(4),
      marginTop: -ms(4),
      paddingHorizontal: ms(10),
      paddingVertical: ms(5),
      borderRadius: ms(14),
      backgroundColor: `${colors.black}59`,
    },
    musicChipText: {
      flexShrink: 1,
      fontSize: fs(12),
      fontFamily: fonts.semibold,
      color: colors.white,
    },
    iconButton: {
      padding: ms(4),
    },

    // Behind the cube; fades out as a downward swipe shrinks the story.
    backdrop: {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: colors.black,
    },
    card: {
      flex: 1,
      overflow: 'hidden',
    },
    replyDim: {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: `${colors.black}BF`,
    },

    replyGridArea: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    replyGrid: {
      width: ms(270),
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      rowGap: ms(20),
    },
    replyGridItem: {
      width: ms(90),
      alignItems: 'center',
    },
    replyGridEmoji: {
      fontSize: fs(46),
    },
    // Under the user's own story: pin it to their profile.
    pinBar: {
      position: 'absolute',
      right: 0,
      bottom: 0,
      left: 0,
      alignItems: 'flex-end',
      paddingHorizontal: ms(12),
    },
    pinButton: {
      height: ms(32),
      flexDirection: 'row',
      alignItems: 'center',
      gap: ms(5),
      paddingHorizontal: ms(12),
      borderRadius: ms(16),
      backgroundColor: `${colors.white}2E`,
    },
    pinButtonOn: {
      backgroundColor: colors.white,
    },
    pinPressed: {
      opacity: 0.7,
    },
    pinText: {
      fontSize: fs(12.5),
      fontFamily: fonts.semibold,
      color: colors.white,
    },
    pinTextOn: {
      color: colors.black,
    },
    replyFooter: {
      gap: ms(12),
    },
    quickReplies: {
      gap: ms(8),
      paddingHorizontal: ms(12),
    },
    quickReply: {
      paddingHorizontal: ms(14),
      paddingVertical: ms(8),
      borderRadius: ms(18),
      backgroundColor: `${colors.white}38`,
    },
    quickReplyPressed: {
      backgroundColor: `${colors.white}59`,
    },
    quickReplyText: {
      fontSize: fs(14),
      fontFamily: fonts.semibold,
      color: colors.white,
    },
    replyHint: {
      textAlign: 'center',
      fontSize: fs(13),
      fontFamily: fonts.regular,
      color: `${colors.white}B3`,
    },
    // Runs to the screen edges, so the row scrolls out from under them.
    replyRow: {
      flexGrow: 1,
      alignItems: 'center',
      gap: ms(6),
      paddingHorizontal: ms(10),
    },
    replyField: {
      height: ms(42),
      justifyContent: 'center',
      paddingHorizontal: ms(16),
      borderRadius: ms(21),
      backgroundColor: `${colors.white}2E`,
    },
    replyFieldOpen: {
      flex: 1,
    },
    replyInput: {
      padding: 0,
      fontSize: fs(15),
      fontFamily: fonts.regular,
      color: colors.white,
    },
    replyPlaceholder: {
      color: `${colors.white}B3`,
    },
    replySend: {
      padding: ms(6),
    },
    replySendIdle: {
      opacity: 0.4,
    },
    reaction: {
      width: ms(44),
      height: ms(44),
      alignItems: 'center',
      justifyContent: 'center',
    },
    reactionPressed: {
      transform: [{ scale: 1.25 }],
    },
    reactionEmoji: {
      fontSize: fs(30),
    },

    toast: {
      position: 'absolute',
      alignSelf: 'center',
      paddingHorizontal: ms(16),
      paddingVertical: ms(8),
      borderRadius: ms(20),
      backgroundColor: `${colors.black}B3`,
    },
    toastText: {
      fontSize: fs(14),
      fontFamily: fonts.semibold,
      color: colors.white,
    },
    burstEmoji: {
      position: 'absolute',
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
}
