import { StyleSheet } from 'react-native';
import { ms } from 'react-native-size-matters';

import { fonts, fs, type AppColors } from '@/theme';

const AVATAR_SIZE = ms(34);

export type StoryViewerStyles = ReturnType<typeof createStyles>;

export function createStyles(colors: AppColors) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.black,
    },
    face: {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backfaceVisibility: 'hidden',
    },
    layer: {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
    },
    // Bundled images otherwise keep their pixel size despite the insets.
    photo: {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
    },
    backdropDim: {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: `${colors.black}73`,
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
    barDone: {
      width: '100%',
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
    iconButton: {
      padding: ms(4),
    },
  });
}
