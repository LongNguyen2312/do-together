import { useMemo } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { ms } from 'react-native-size-matters';

import { fonts, fs, useTheme, type AppColors } from '@/theme';

interface AppHeaderProps {
  /** Replaces the app name beside the logo. */
  title?: string;
  /** Match the screen behind it; defaults to the theme background. `transparent` also drops the shadow. */
  backgroundColor?: string;
  /** The location and profile buttons only show when their handler is set. */
  onLocationPress?: () => void;
  onNotificationsPress: () => void;
  onProfilePress?: () => void;
}

/** Brand bar shared by the main tabs. */
export default function AppHeader({
  title,
  backgroundColor,
  onLocationPress,
  onNotificationsPress,
  onProfilePress,
}: AppHeaderProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(
    () => createStyles(colors, backgroundColor ?? colors.background),
    [colors, backgroundColor],
  );
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.header, { paddingTop: insets.top }]}>
      <View style={styles.brand}>
        <Image
          source={require('@/assets/images/logo-mark.png')}
          style={styles.brandLogo}
          tintColor={colors.primary}
          resizeMode="contain"
        />
        <Text style={styles.brandName}>{title ?? t('common.appName')}</Text>
      </View>
      <View style={styles.headerActions}>
        {onLocationPress ? (
          <Pressable
            onPress={onLocationPress}
            hitSlop={6}
            style={styles.headerButton}
            accessibilityRole="button"
            accessibilityLabel={t('home.myLocation')}
          >
            <Icon
              name="location-outline"
              size={ms(22)}
              color={colors.textSecondary}
            />
          </Pressable>
        ) : null}
        <Pressable
          onPress={onNotificationsPress}
          hitSlop={6}
          style={styles.headerButton}
          accessibilityRole="button"
          accessibilityLabel={t('home.notifications')}
        >
          <Icon
            name="notifications-outline"
            size={ms(22)}
            color={colors.textSecondary}
          />
          <View style={styles.notificationDot} />
        </Pressable>
        {onProfilePress ? (
          <Pressable
            onPress={onProfilePress}
            hitSlop={6}
            style={styles.profileButton}
            accessibilityRole="button"
            accessibilityLabel={t('tabs.profile')}
          >
            <Icon name="person" size={ms(13)} color={colors.white} />
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
    brand: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: ms(8),
    },
    brandLogo: {
      width: ms(20),
      height: ms(20),
    },
    brandName: {
      fontSize: fs(17),
      lineHeight: fs(22),
      fontFamily: fonts.bold,
      letterSpacing: -0.3,
      color: colors.primary,
    },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: ms(4),
    },
    headerButton: {
      width: ms(36),
      height: ms(32),
      alignItems: 'center',
      justifyContent: 'center',
    },
    notificationDot: {
      position: 'absolute',
      top: ms(5),
      right: ms(8),
      width: ms(8),
      height: ms(8),
      borderRadius: ms(4),
      borderWidth: 1.5,
      borderColor: transparent ? colors.background : background,
      backgroundColor: colors.primary,
    },
    profileButton: {
      width: ms(26),
      height: ms(26),
      marginLeft: ms(4),
      borderRadius: ms(13),
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primaryDark,
    },
  });
}
