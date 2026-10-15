import { StyleSheet } from 'react-native';
import { ms } from 'react-native-size-matters';

import { fonts, fs, type AppColors } from '@/theme';

const SCREEN_PADDING = ms(16);
export const AVATAR_SIZE = ms(104);
const CAMERA_BADGE = ms(32);
const PLACE_ICON = ms(36);
/** The round count of picked interests, and so each card header's height. */
const COUNT_SIZE = ms(22);

export type EditProfileStyles = ReturnType<typeof createStyles>;

export function createStyles(colors: AppColors) {
  const softShadow = {
    shadowColor: colors.black,
    shadowOpacity: 0.05,
    shadowRadius: ms(4),
    shadowOffset: { width: 0, height: ms(1) },
    elevation: 1,
  };

  return StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: colors.background,
    },
    flex: {
      flex: 1,
    },
    pressed: {
      opacity: 0.7,
    },
    content: {
      gap: ms(14),
      paddingHorizontal: SCREEN_PADDING,
      paddingTop: ms(20),
      paddingBottom: ms(32),
    },

    // The photo, centred, with a camera on it.
    photoBlock: {
      alignItems: 'center',
      gap: ms(12),
    },
    cameraBadge: {
      position: 'absolute',
      right: 0,
      bottom: 0,
      width: CAMERA_BADGE,
      height: CAMERA_BADGE,
      borderRadius: CAMERA_BADGE / 2,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: ms(3),
      borderColor: colors.background,
      backgroundColor: colors.primary,
    },
    photoAction: {
      fontSize: fs(14),
      fontFamily: fonts.semibold,
      color: colors.primary,
    },

    // A titled group of fields.
    // A field that heads its own section, titled like the sections.

    // One white card per thing, as on the free screen.
    card: {
      gap: ms(10),
      padding: ms(16),
      borderRadius: ms(18),
      backgroundColor: colors.card,
      ...softShadow,
    },
    cardHeader: {
      // As tall as the count, so it showing up doesn't move anything.
      minHeight: COUNT_SIZE,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: ms(8),
    },
    cardTitleRow: {
      flexShrink: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: ms(6),
    },
    cardTitle: {
      flexShrink: 1,
      fontSize: fs(14.5),
      lineHeight: fs(20),
      fontFamily: fonts.semibold,
      color: colors.text,
    },
    cardLead: {
      marginTop: -ms(4),
    },
    hint: {
      fontSize: fs(11),
      lineHeight: fs(14),
      fontFamily: fonts.medium,
      color: colors.textSecondary,
    },
    countBadge: {
      width: COUNT_SIZE,
      height: COUNT_SIZE,
      borderRadius: COUNT_SIZE / 2,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primarySoft,
    },
    countBadgeText: {
      fontSize: fs(11.5),
      fontFamily: fonts.bold,
      color: colors.primaryDark,
      fontVariant: ['tabular-nums'],
    },

    // Grey boxes, as for the free screen's note.
    input: {
      paddingHorizontal: ms(12),
      borderRadius: ms(12),
      borderWidth: 1,
      borderColor: 'transparent',
      fontSize: fs(13.5),
      fontFamily: fonts.medium,
      color: colors.text,
      backgroundColor: colors.surface,
    },
    // One line: a set height and no line height, so the text sits in the
    // middle and doesn't shift as it's typed.
    inputLine: {
      height: ms(40),
      paddingVertical: 0,
    },
    inputFocused: {
      borderColor: colors.primary,
    },
    bioInput: {
      minHeight: ms(84),
      paddingTop: ms(11),
      paddingBottom: ms(11),
      lineHeight: fs(19),
      fontFamily: fonts.regular,
    },
    counterBelow: {
      marginTop: -ms(4),
      textAlign: 'right',
    },

    // Where they live, where they're from.
    placeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: ms(12),
    },
    placeIcon: {
      width: PLACE_ICON,
      height: PLACE_ICON,
      borderRadius: PLACE_ICON / 2,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primarySoft,
    },
    placeBody: {
      flex: 1,
      minHeight: ms(62),
      flexDirection: 'row',
      alignItems: 'center',
      gap: ms(8),
    },
    placeDivided: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
    },
    placeText: {
      flex: 1,
      gap: ms(2),
    },
    placeLabel: {
      fontSize: fs(12),
      fontFamily: fonts.medium,
      color: colors.textSecondary,
    },
    placeValue: {
      fontSize: fs(15),
      fontFamily: fonts.semibold,
      color: colors.text,
    },
    placeEmpty: {
      fontFamily: fonts.regular,
      color: colors.textMuted,
    },

    // The same look as FormField, for the one field that wraps.
    // Plain grey boxes, as in the sheet for making an activity.
    inputError: {
      borderColor: colors.danger,
    },
    error: {
      marginTop: ms(2),
      fontSize: fs(12),
      fontFamily: fonts.regular,
      color: colors.danger,
    },
    chips: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: ms(8),
    },
    // Not picked: soft grey; picked: the brand colour, with a tick.
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: ms(5),
      paddingHorizontal: ms(14),
      paddingVertical: ms(8),
      borderRadius: ms(999),
      borderWidth: 1,
      borderColor: 'transparent',
      backgroundColor: colors.surfaceMuted,
    },
    chipOn: {
      backgroundColor: colors.primary,
    },
    chipEmoji: {
      fontSize: fs(12.5),
      lineHeight: fs(16),
    },
    chipText: {
      fontSize: fs(12.5),
      lineHeight: fs(16),
      fontFamily: fonts.medium,
      color: colors.text,
    },
    chipTextOn: {
      color: colors.white,
    },
    chipAdd: {
      borderStyle: 'dashed',
      borderColor: colors.primary,
      backgroundColor: 'transparent',
    },
    chipAddText: {
      fontSize: fs(12.5),
      lineHeight: fs(16),
      fontFamily: fonts.semibold,
      color: colors.primary,
    },
    chipPhoto: {
      width: ms(16),
      height: ms(16),
      borderRadius: ms(8),
    },
    footer: {
      paddingHorizontal: SCREEN_PADDING,
      paddingTop: ms(10),
    },
    saveButton: {
      height: ms(50),
    },
  });
}
