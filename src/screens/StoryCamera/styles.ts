import { StyleSheet } from 'react-native';
import { ms } from 'react-native-size-matters';

import { STORY_FOOTER } from '@/hooks/useStoryCanvas';
import { fonts, fs, type AppColors } from '@/theme';

/** A filter in the strip beside the shutter. */
export const FILTER_SIZE = ms(56);
export const FILTER_GAP = ms(14);
/** The shutter: a ring round the filter in the middle, in a ring of dots. */
export const SHUTTER_SIZE = ms(90);
export const SHUTTER_RING = ms(4);
const SHUTTER_INNER = SHUTTER_SIZE - ms(18);
export const SHUTTER_DOTS = 40;
export const SHUTTER_DOT = ms(3);
/** The shutter's pale yellow-white. */
export const SHUTTER_TINT = '#F4F2C4';
/** Recording red, the same in either theme: the camera is always dark. */
export const RECORD_RED = '#FF3B30';
const ROUND_BUTTON = ms(40);
const ZOOM_CHIP = ms(36);

export const createStyles = (colors: AppColors) => {
  const glass = `${colors.black}59`;
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.black,
    },
    fill: StyleSheet.absoluteFill,
    pressed: {
      opacity: 0.6,
    },

    // The preview, in the same frame a story is watched in.
    preview: {
      position: 'absolute',
      left: 0,
      width: '100%',
      overflow: 'hidden',
      borderRadius: ms(12),
      backgroundColor: `${colors.white}14`,
    },
    // Shown instead of the preview: no camera, or no access to it.
    notice: {
      ...StyleSheet.absoluteFill,
      alignItems: 'center',
      justifyContent: 'center',
      gap: ms(12),
      paddingHorizontal: ms(40),
    },
    noticeText: {
      fontSize: fs(15),
      fontFamily: fonts.medium,
      color: colors.white,
      textAlign: 'center',
    },
    noticeButton: {
      paddingHorizontal: ms(20),
      paddingVertical: ms(10),
      borderRadius: ms(20),
      backgroundColor: colors.white,
    },
    noticeButtonText: {
      fontSize: fs(14),
      fontFamily: fonts.bold,
      color: colors.black,
    },
    // The white blink of a photo being taken.
    blink: {
      ...StyleSheet.absoluteFill,
      backgroundColor: colors.white,
    },

    // Top: close, timer, flash and flip.
    top: {
      position: 'absolute',
      left: 0,
      right: 0,
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      paddingHorizontal: ms(12),
    },
    topRight: {
      gap: ms(12),
    },
    round: {
      width: ROUND_BUTTON,
      height: ROUND_BUTTON,
      borderRadius: ROUND_BUTTON / 2,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: glass,
    },
    timer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: ms(6),
      marginTop: ms(8),
      paddingHorizontal: ms(10),
      paddingVertical: ms(4),
      borderRadius: ms(12),
      backgroundColor: RECORD_RED,
    },
    timerDot: {
      width: ms(6),
      height: ms(6),
      borderRadius: ms(3),
      backgroundColor: colors.white,
    },
    timerText: {
      fontSize: fs(13),
      fontFamily: fonts.semibold,
      color: colors.white,
      fontVariant: ['tabular-nums'],
    },

    // A filter's name, briefly, when it changes.
    filterName: {
      position: 'absolute',
      alignSelf: 'center',
      fontSize: fs(22),
      fontFamily: fonts.bold,
      color: colors.white,
      textShadowColor: `${colors.black}80`,
      textShadowRadius: ms(6),
    },

    // Bottom of the preview: zoom, then the shutter among the filters.
    controls: {
      position: 'absolute',
      left: 0,
      right: 0,
      alignItems: 'center',
      gap: ms(14),
    },
    zoomRow: {
      flexDirection: 'row',
      gap: ms(8),
      padding: ms(4),
      borderRadius: ms(24),
      backgroundColor: glass,
    },
    zoomChip: {
      minWidth: ZOOM_CHIP,
      height: ZOOM_CHIP,
      paddingHorizontal: ms(4),
      borderRadius: ZOOM_CHIP / 2,
      alignItems: 'center',
      justifyContent: 'center',
    },
    zoomChipActive: {
      backgroundColor: glass,
    },
    zoomText: {
      fontSize: fs(12),
      fontFamily: fonts.semibold,
      color: colors.white,
    },
    zoomTextActive: {
      color: colors.primary,
    },

    // Filters
    strip: {
      height: SHUTTER_SIZE,
      width: '100%',
    },
    stripContent: {
      alignItems: 'center',
      gap: FILTER_GAP,
    },
    filter: {
      width: FILTER_SIZE,
      height: FILTER_SIZE,
      borderRadius: FILTER_SIZE / 2,
      overflow: 'hidden',
      borderWidth: ms(1.5),
      borderColor: `${colors.white}CC`,
    },
    filterPicture: {
      width: '100%',
      height: '100%',
    },
    shutter: {
      position: 'absolute',
      alignSelf: 'center',
      width: SHUTTER_SIZE,
      height: SHUTTER_SIZE,
    },
    shutterBody: {
      ...StyleSheet.absoluteFill,
      alignItems: 'center',
      justifyContent: 'center',
    },
    shutterDots: {
      position: 'absolute',
    },
    shutterRing: {
      position: 'absolute',
      width: SHUTTER_INNER,
      height: SHUTTER_INNER,
      borderRadius: SHUTTER_INNER / 2,
      borderWidth: SHUTTER_RING,
      borderColor: SHUTTER_TINT,
    },
    shutterRingRecord: {
      borderColor: RECORD_RED,
    },
    // While recording: tap it to stop.
    stopSquare: {
      width: ms(26),
      height: ms(26),
      borderRadius: ms(6),
      backgroundColor: RECORD_RED,
    },

    // Below the preview: photo or video.
    modes: {
      position: 'absolute',
      left: 0,
      right: 0,
      height: STORY_FOOTER,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: ms(6),
    },
    mode: {
      paddingHorizontal: ms(18),
      paddingVertical: ms(8),
      borderRadius: ms(18),
    },
    modeActive: {
      backgroundColor: colors.white,
    },
    modeText: {
      fontSize: fs(14),
      fontFamily: fonts.semibold,
      color: `${colors.white}B3`,
    },
    modeTextActive: {
      color: colors.black,
    },
  });
};

export type StoryCameraStyles = ReturnType<typeof createStyles>;
