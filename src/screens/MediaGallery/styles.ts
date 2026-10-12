import { StyleSheet } from 'react-native';
import { ms } from 'react-native-size-matters';

import { fonts, fs, type AppColors } from '@/theme';

/** Space between tiles. */
export const GRID_GAP = ms(2);
export const GRID_COLUMNS = 3;
/** Tiles are tall, the shape of the story they'd make. */
export const TILE_ASPECT = 16 / 9;
const ALBUM_COVER = ms(64);

/** Dark whatever the app's theme, like the camera and the story editor. */
export const createStyles = (colors: AppColors) => {
  const surface = `${colors.white}1F`;
  const muted = `${colors.white}99`;
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.black,
    },
    header: {
      height: ms(52),
      alignItems: 'center',
      justifyContent: 'center',
    },
    close: {
      position: 'absolute',
      left: ms(10),
      width: ms(44),
      height: ms(44),
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: {
      fontSize: fs(18),
      fontFamily: fonts.bold,
      color: colors.white,
    },
    pressed: {
      opacity: 0.6,
    },

    // "Recents ⌄": which album the grid shows.
    albumBar: {
      height: ms(52),
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: ms(16),
    },
    albumButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: ms(6),
      maxWidth: '80%',
    },
    // What a chat takes, beside the album name.
    limitHint: {
      marginLeft: 'auto',
      fontSize: fs(12),
      fontFamily: fonts.regular,
      color: muted,
    },
    albumName: {
      fontSize: fs(20),
      fontFamily: fonts.bold,
      color: colors.white,
    },

    // Grid
    row: {
      gap: GRID_GAP,
      marginBottom: GRID_GAP,
    },
    tile: {
      overflow: 'hidden',
      backgroundColor: surface,
    },
    tileImage: {
      width: '100%',
      height: '100%',
    },
    tooLong: {
      opacity: 0.4,
    },
    duration: {
      position: 'absolute',
      right: ms(6),
      bottom: ms(6),
      fontSize: fs(12),
      fontFamily: fonts.semibold,
      color: colors.white,
      textShadowColor: `${colors.black}99`,
      textShadowRadius: ms(3),
    },
    // A chosen tile (for a chat): framed, with its number in the round.
    chosenFrame: {
      ...StyleSheet.absoluteFill,
      borderWidth: ms(3),
      borderColor: colors.primary,
    },
    pickRound: {
      position: 'absolute',
      top: ms(6),
      right: ms(6),
      width: ms(24),
      height: ms(24),
      borderRadius: ms(12),
      borderWidth: ms(1.5),
      borderColor: colors.white,
      backgroundColor: `${colors.black}33`,
      alignItems: 'center',
      justifyContent: 'center',
    },
    pickRoundOn: {
      borderColor: colors.primary,
      backgroundColor: colors.primary,
    },
    pickNumber: {
      fontSize: fs(12),
      fontFamily: fonts.bold,
      color: colors.white,
    },
    camera: {
      alignItems: 'center',
      justifyContent: 'center',
    },

    // Albums
    albumRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: ms(14),
      paddingHorizontal: ms(16),
      paddingVertical: ms(6),
    },
    albumCover: {
      width: ALBUM_COVER,
      height: ALBUM_COVER,
      borderRadius: ms(8),
      backgroundColor: surface,
    },
    albumText: {
      flex: 1,
      gap: ms(2),
    },
    albumTitle: {
      fontSize: fs(16),
      fontFamily: fonts.semibold,
      color: colors.white,
    },
    albumCount: {
      fontSize: fs(13),
      fontFamily: fonts.regular,
      color: muted,
    },

    // Only some photos shared with the app.
    limited: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: ms(10),
      marginHorizontal: ms(12),
      marginBottom: ms(10),
      padding: ms(12),
      borderRadius: ms(12),
      backgroundColor: surface,
    },
    limitedText: {
      flex: 1,
      fontSize: fs(13),
      fontFamily: fonts.regular,
      color: muted,
    },
    link: {
      fontSize: fs(14),
      fontFamily: fonts.bold,
      color: colors.primary,
    },

    // Below the grid: loading, empty, or no access.
    footer: {
      alignItems: 'center',
      paddingHorizontal: ms(32),
      paddingVertical: ms(32),
      gap: ms(10),
    },
    footerTitle: {
      fontSize: fs(16),
      fontFamily: fonts.bold,
      color: colors.white,
      textAlign: 'center',
    },
    footerText: {
      fontSize: fs(14),
      fontFamily: fonts.regular,
      color: muted,
      textAlign: 'center',
    },
    button: {
      marginTop: ms(6),
      paddingHorizontal: ms(22),
      paddingVertical: ms(11),
      borderRadius: ms(22),
      backgroundColor: colors.primary,
    },
    buttonText: {
      fontSize: fs(14),
      fontFamily: fonts.bold,
      color: colors.white,
    },

    // For a chat, once something's chosen.
    sendBar: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      paddingTop: ms(10),
      paddingHorizontal: ms(16),
      backgroundColor: `${colors.black}E6`,
    },
    sendButton: {
      height: ms(48),
      borderRadius: ms(24),
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: ms(8),
      backgroundColor: colors.primary,
    },
    sendText: {
      fontSize: fs(15),
      fontFamily: fonts.bold,
      color: colors.white,
    },

    // While a camera shot or a picked file is being read.
    busy: {
      ...StyleSheet.absoluteFill,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: `${colors.black}80`,
    },
  });
};

export type StoryGalleryStyles = ReturnType<typeof createStyles>;
