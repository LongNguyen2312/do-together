import { useEffect, useMemo, useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { ms } from 'react-native-size-matters';

import BrandTitle from '@/components/BrandTitle';
import {
  BARE_BUTTON,
  BARE_ICON,
  HeaderButton,
} from '@/components/ScreenHeader';
import UserAvatar from '@/components/UserAvatar';
import { useAppSelector } from '@/store/hooks';
import { selectUnreadCount } from '@/store/slices/notificationSlice';
import { fonts, fs, useTheme, type AppColors } from '@/theme';
import type { RootStackParamList } from '@/types/navigation';

/** Past this, the badge just says "9+". */
const MAX_BADGE = 9;
const PROFILE_BUTTON = ms(28);
/** The empty room either side of a bare icon in its button. */
const ICON_ROOM = (BARE_BUTTON - BARE_ICON) / 2;
const PIN_ICON = BARE_ICON * 0.94;
/**
 * The pin's point hangs low: raised a little, its top lines up with the
 * bell's, its round head level with the bell's body.
 */
const PIN_LIFT = ms(1);
/** Measured on screen: what evens the bell–photo gap with the pin–bell one. */
const ACCOUNT_EVEN = 5;
/** A bell's swing, side to side, dying away (degrees). */
const RING_SWINGS = [16, -14, 10, -8, 4, 0];
const RING_SWING_MS = 90;

interface AppHeaderProps {
  /** Replaces the app name beside the logo. */
  title?: string;
  /** Match the screen behind it; defaults to the theme background. `transparent` also drops the shadow. */
  backgroundColor?: string;
  /** The location and profile buttons only show when their handler is set. */
  onLocationPress?: () => void;
  onProfilePress?: () => void;
}

/** Brand bar shared by the main tabs. */
export default function AppHeader({
  title,
  backgroundColor,
  onLocationPress,
  onProfilePress,
}: AppHeaderProps) {
  const { t } = useTranslation();
  const appName = t('common.appName');
  const { colors } = useTheme();
  const styles = useMemo(
    () => createStyles(colors, backgroundColor ?? colors.background),
    [colors, backgroundColor],
  );
  const insets = useSafeAreaInsets();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const unread = useAppSelector(selectUnreadCount);
  const avatarUri = useAppSelector(state => state.auth.user?.avatarUri);
  const paused = useAppSelector(state => state.notification.settings.paused);

  // Something new: the bell rings, swinging from its top.
  const swing = useSharedValue(0);
  const lastUnread = useRef(0);
  useEffect(() => {
    if (unread > lastUnread.current && !paused) {
      swing.value = withSequence(
        ...RING_SWINGS.map(angle =>
          withTiming(angle, {
            duration: RING_SWING_MS,
            easing: Easing.inOut(Easing.quad),
          }),
        ),
      );
    }
    lastUnread.current = unread;
  }, [unread, paused, swing]);
  const bellStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${swing.value}deg` }],
  }));

  return (
    <View style={[styles.header, { paddingTop: insets.top }]}>
      <BrandTitle text={title ?? appName} />
      <View style={styles.headerActions}>
        {onLocationPress ? (
          <HeaderButton
            bare
            // A pin fills its box more than the bell does: a little smaller
            // looks the same size.
            icon={
              <Icon
                name="location-outline"
                size={PIN_ICON}
                color={colors.text}
                style={styles.pin}
              />
            }
            label={t('home.myLocation')}
            onPress={onLocationPress}
          />
        ) : null}
        <HeaderButton
          bare
          icon={paused ? 'notifications-off-outline' : 'notifications-outline'}
          label={
            unread > 0
              ? t('notifications.bellUnread', { count: unread })
              : t('home.notifications')
          }
          onPress={() => navigation.navigate('Notifications')}
          iconStyle={[styles.bell, bellStyle]}
        >
          {unread > 0 ? (
            <View style={styles.badge} pointerEvents="none">
              <Text style={styles.badgeText}>
                {unread > MAX_BADGE ? `${MAX_BADGE}+` : unread}
              </Text>
            </View>
          ) : null}
        </HeaderButton>
        {onProfilePress ? (
          <Pressable
            onPress={onProfilePress}
            hitSlop={6}
            style={styles.profileButton}
            accessibilityRole="button"
            accessibilityLabel={t('tabs.profile')}
          >
            {/* Their photo once they've set one. */}
            {avatarUri ? (
              <UserAvatar size={PROFILE_BUTTON} name="" uri={avatarUri} />
            ) : (
              <Icon name="person" size={ms(13)} color={colors.white} />
            )}
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

function createStyles(colors: AppColors, background: string) {
  const transparent = background === 'transparent';
  return StyleSheet.create({
    header: {
      paddingBottom: ms(6),
      zIndex: 1,
      backgroundColor: background,
      shadowColor: colors.black,
      // On a see-through header iOS would shadow the icons and text instead.
      shadowOpacity: transparent ? 0 : 0.04,
      shadowRadius: ms(8),
      shadowOffset: { width: 0, height: ms(1) },
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: ms(16),
    },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: ms(2),
    },
    // Swings from where a bell hangs.
    bell: {
      transformOrigin: 'top',
    },
    // The unread count, on the button's corner.
    badge: {
      position: 'absolute',
      top: -ms(2),
      right: -ms(5),
      minWidth: ms(18),
      height: ms(18),
      paddingHorizontal: ms(4),
      borderRadius: ms(9),
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1.5,
      borderColor: transparent ? colors.background : background,
      backgroundColor: colors.primary,
    },
    badgeText: {
      fontSize: fs(10),
      lineHeight: fs(12),
      fontFamily: fonts.bold,
      color: colors.white,
      fontVariant: ['tabular-nums'],
    },
    pin: {
      transform: [{ translateY: -PIN_LIFT }],
    },
    profileButton: {
      width: PROFILE_BUTTON,
      height: PROFILE_BUTTON,
      // As far from the bell as the bell is from the pin: the bell's button
      // has room round its icon, the photo doesn't, so it makes it up (and
      // the pin's outline sits a little in from its box).
      marginLeft: ICON_ROOM + ACCOUNT_EVEN,
      borderRadius: PROFILE_BUTTON / 2,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primaryDark,
    },
  });
}
