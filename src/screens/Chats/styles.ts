import { StyleSheet } from 'react-native';
import { ms } from 'react-native-size-matters';

import { fonts, fs, type AppColors } from '@/theme';

const SCREEN_PADDING = ms(16);
// Portrait, like the photos they open.
const STORY_WIDTH = ms(70);
const STORY_HEIGHT = ms(94);
const AVATAR_SIZE = ms(52);

export type ChatsStyles = ReturnType<typeof createStyles>;

export function createStyles(colors: AppColors) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.background,
    },
    pressed: {
      opacity: 0.7,
    },

    search: {
      height: ms(36),
      flexDirection: 'row',
      alignItems: 'center',
      gap: ms(7),
      marginHorizontal: SCREEN_PADDING,
      marginTop: ms(10),
      marginBottom: ms(8),
      paddingHorizontal: ms(13),
      borderRadius: ms(999),
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: `${colors.text}1A`,
      backgroundColor: `${colors.text}0A`,
    },
    searchInput: {
      flex: 1,
      padding: 0,
      fontSize: fs(13),
      fontFamily: fonts.regular,
      color: colors.text,
    },

    storiesContent: {
      alignItems: 'flex-start',
      paddingTop: ms(8),
      gap: ms(8),
      paddingHorizontal: SCREEN_PADDING,
    },
    story: {
      width: STORY_WIDTH,
      alignItems: 'center',
      gap: ms(6),
    },
    storyTile: {
      width: STORY_WIDTH,
      height: STORY_HEIGHT,
      borderRadius: ms(11),
      overflow: 'hidden',
      borderWidth: ms(0.3),
      borderColor: `${colors.text}1A`,
    },
    storyAdd: {
      alignItems: 'center',
      justifyContent: 'center',
      borderColor: `${colors.text}1A`,
      backgroundColor: `${colors.text}24`,
    },
    storyAddCircle: {
      width: ms(24),
      height: ms(24),
      borderRadius: ms(12),
      borderWidth: ms(2),
      borderColor: colors.white,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: `${colors.primary}D9`,
    },
    storyAddBadge: {
      position: 'absolute',
      right: ms(5),
      bottom: ms(5),
      width: ms(20),
      height: ms(20),
      borderRadius: ms(10),
    },
    // Bundled images otherwise keep their full pixel size.
    storyImage: {
      width: '100%',
      height: '100%',
    },
    storyDivider: {
      alignSelf: 'stretch',
      width: StyleSheet.hairlineWidth,
      marginVertical: ms(10),
      backgroundColor: colors.border,
    },
    storyLabel: {
      alignSelf: 'stretch',
      fontSize: fs(11),
      fontFamily: fonts.medium,
      textAlign: 'center',
      color: colors.text,
    },
    artEmoji: {
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primarySoft,
    },
    artEmojiText: {
      fontSize: fs(22),
    },

    filters: {
      gap: ms(8),
      paddingHorizontal: SCREEN_PADDING,
      paddingTop: ms(16),
      paddingBottom: ms(11),
    },
    filter: {
      height: ms(28),
      flexDirection: 'row',
      alignItems: 'center',
      gap: ms(4),
      paddingHorizontal: ms(12),
      borderRadius: ms(999),
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: `${colors.text}1A`,
      backgroundColor: `${colors.text}0A`,
    },
    filterEmoji: {
      fontSize: fs(12),
    },
    filterActive: {
      borderColor: colors.primary,
      backgroundColor: colors.primary,
    },
    filterText: {
      fontSize: fs(11.5),
      lineHeight: fs(14),
      fontFamily: fonts.semibold,
      color: colors.text,
    },
    filterTextActive: {
      color: colors.white,
    },

    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: ms(12),
      paddingHorizontal: SCREEN_PADDING,
      paddingVertical: ms(10),
    },
    rowPressed: {
      backgroundColor: colors.surface,
    },
    avatar: {
      width: AVATAR_SIZE,
      height: AVATAR_SIZE,
      borderRadius: AVATAR_SIZE / 2,
    },
    liveDot: {
      position: 'absolute',
      top: 0,
      right: 0,
      padding: ms(2),
      borderRadius: ms(8),
      backgroundColor: colors.background,
    },
    rowBody: {
      flex: 1,
      gap: ms(3),
    },
    rowTop: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: ms(8),
    },
    rowTitle: {
      flex: 1,
      fontSize: fs(14.5),
      lineHeight: fs(19),
      fontFamily: fonts.semibold,
      color: colors.text,
    },
    rowTitleUnread: {
      fontFamily: fonts.bold,
    },
    rowTime: {
      fontSize: fs(11.5),
      fontFamily: fonts.medium,
      color: colors.textMuted,
    },
    rowTimeUnread: {
      fontFamily: fonts.semibold,
      color: colors.primary,
    },
    rowBottom: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: ms(6),
    },
    rowPreview: {
      flex: 1,
      fontSize: fs(13),
      lineHeight: fs(18),
      fontFamily: fonts.regular,
      color: colors.textSecondary,
    },
    rowPreviewUnread: {
      fontFamily: fonts.medium,
      color: colors.text,
    },
    unread: {
      minWidth: ms(20),
      height: ms(20),
      paddingHorizontal: ms(6),
      borderRadius: ms(10),
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primary,
    },
    unreadMuted: {
      backgroundColor: colors.textMuted,
    },
    unreadText: {
      fontSize: fs(11),
      fontFamily: fonts.bold,
      color: colors.white,
    },

    empty: {
      marginTop: ms(48),
      paddingHorizontal: ms(32),
      fontSize: fs(13.5),
      lineHeight: fs(19),
      fontFamily: fonts.regular,
      textAlign: 'center',
      color: colors.textSecondary,
    },
  });
}
