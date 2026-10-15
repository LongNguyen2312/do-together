import { useMemo, type ComponentProps, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import Animated from 'react-native-reanimated';
import { ms } from 'react-native-size-matters';
import Icon from 'react-native-vector-icons/Ionicons';

import { fonts, fs, useTheme, type AppColors } from '@/theme';

export const HEADER_BUTTON = ms(38);
/** The tap area of a bare icon, tighter than the round button. */
export const BARE_BUTTON = ms(32);
/** A bare button's icon: room either side is (BARE_BUTTON - this) / 2. */
export const BARE_ICON = ms(23);
/** The icon in a round header button. */
export const HEADER_ICON = ms(19);
const SCREEN_PADDING = ms(16);
/** Room kept clear on each side of the title, for up to two buttons. */
const SIDE_BUTTONS = 2;

interface HeaderButtonProps {
  /** Ionicons name, or an icon of another set (sized ICON_SIZE) to draw. */
  icon: string | ReactNode;
  label: string;
  onPress: () => void;
  /** Defaults to the text colour. */
  color?: string;
  disabled?: boolean;
  /** Just the icon, a little bigger, with no round button behind it. */
  bare?: boolean;
  /** The round button's width and height, if not HEADER_BUTTON. */
  size?: number;
  /** On the icon alone, e.g. an animated swing. */
  iconStyle?: ComponentProps<typeof Animated.View>['style'];
  /** Over the button's corner, e.g. a count. */
  children?: ReactNode;
}

/** The round button of the app's screen headers. */
export function HeaderButton({
  icon,
  label,
  onPress,
  color,
  disabled = false,
  bare = false,
  size,
  iconStyle,
  children,
}: HeaderButtonProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={6}
      style={({ pressed }) => [
        bare ? styles.bareButton : styles.button,
        size !== undefined &&
          !bare && { width: size, height: size, borderRadius: size / 2 },
        disabled && styles.disabled,
        pressed && styles.pressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
    >
      <Animated.View style={iconStyle}>
        {typeof icon === 'string' ? (
          <Icon
            name={icon}
            size={bare ? BARE_ICON : HEADER_ICON}
            color={color ?? colors.text}
          />
        ) : (
          icon
        )}
      </Animated.View>
      {children}
    </Pressable>
  );
}

interface ScreenHeaderProps {
  title: string;
  /** Beside the title, e.g. an unread count. */
  titleAccessory?: ReactNode;
  onBack: () => void;
  /** The app's name, small, over the title. */
  showBrand?: boolean;
  /** Up to two `HeaderButton`s on the right. */
  actions?: ReactNode;
}

/**
 * A pushed screen's header, as on the activity details: back on the left,
 * the title in the middle (with the app's name over it if asked), round
 * buttons on the right.
 */
export default function ScreenHeader({
  title,
  titleAccessory,
  onBack,
  showBrand = false,
  actions,
}: ScreenHeaderProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <View style={styles.header}>
      <HeaderButton
        icon="chevron-back"
        label={t('auth.back')}
        onPress={onBack}
      />
      <View style={styles.center} pointerEvents="box-none">
        {showBrand ? (
          <Text style={styles.brand}>{t('common.appName')}</Text>
        ) : null}
        <View style={styles.titleRow}>
          <Text
            style={styles.title}
            numberOfLines={1}
            accessibilityRole="header"
          >
            {title}
          </Text>
          {titleAccessory}
        </View>
      </View>
      <View style={styles.actions}>{actions}</View>
    </View>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    header: {
      height: ms(50),
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: SCREEN_PADDING,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    center: {
      position: 'absolute',
      left: SCREEN_PADDING + HEADER_BUTTON * SIDE_BUTTONS,
      right: SCREEN_PADDING + HEADER_BUTTON * SIDE_BUTTONS,
      alignItems: 'center',
    },
    brand: {
      fontSize: fs(10),
      fontFamily: fonts.semibold,
      letterSpacing: 1.6,
      textTransform: 'uppercase',
      color: colors.textSecondary,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: ms(6),
      maxWidth: '100%',
    },
    title: {
      flexShrink: 1,
      fontSize: fs(15.5),
      fontFamily: fonts.bold,
      letterSpacing: -0.3,
      color: colors.text,
    },
    actions: {
      flexDirection: 'row',
      gap: ms(6),
    },
    button: {
      width: HEADER_BUTTON,
      height: HEADER_BUTTON,
      borderRadius: HEADER_BUTTON / 2,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.surfaceMuted,
      backgroundColor: colors.card,
      shadowColor: colors.black,
      shadowOpacity: 0.05,
      shadowRadius: ms(4),
      shadowOffset: { width: 0, height: ms(1) },
      elevation: 1,
    },
    bareButton: {
      width: BARE_BUTTON,
      height: BARE_BUTTON,
      alignItems: 'center',
      justifyContent: 'center',
    },
    disabled: {
      opacity: 0.4,
    },
    pressed: {
      opacity: 0.85,
      transform: [{ scale: 0.97 }],
    },
  });
}
