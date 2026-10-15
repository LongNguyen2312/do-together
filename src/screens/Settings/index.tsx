import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ms } from 'react-native-size-matters';
import Icon from 'react-native-vector-icons/Ionicons';

import { useConfirm } from '@/components/ConfirmDialog';
import ScreenHeader from '@/components/ScreenHeader';
import Toggle from '@/components/Toggle';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setLanguage, setThemeMode } from '@/store/slices/appSlice';
import { clearUser } from '@/store/slices/authSlice';
import { fonts, fs, useTheme, type AppColors } from '@/theme';
import type { RootStackParamList } from '@/types/navigation';
import { LANGUAGE_OPTIONS } from '@/utils/language';

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;

/** Notifications, language, light or dark, and logging out. */
export default function SettingsScreen({ navigation }: Props) {
  const { t, i18n } = useTranslation();
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const dispatch = useAppDispatch();
  const confirm = useConfirm();
  const notificationsPaused = useAppSelector(
    state => state.notification.settings.paused,
  );

  const logOut = () =>
    confirm({
      icon: 'log-out-outline',
      title: t('profile.logOutTitle'),
      message: t('profile.logOutMessage'),
      confirmLabel: t('profile.logOut'),
      onConfirm: () => dispatch(clearUser()),
    });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader title={t('profile.settings')} onBack={navigation.goBack} />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <Pressable
            onPress={() => navigation.navigate('NotificationSettings')}
            style={({ pressed }) => [styles.row, pressed && styles.pressed]}
            accessibilityRole="button"
          >
            <Icon
              name="notifications-outline"
              size={ms(20)}
              color={colors.textSecondary}
            />
            <Text style={styles.label}>{t('profile.notifications')}</Text>
            {notificationsPaused ? (
              <Text style={styles.value}>
                {t('profile.notificationsPaused')}
              </Text>
            ) : null}
            <Icon
              name="chevron-forward"
              size={ms(16)}
              color={colors.textMuted}
            />
          </Pressable>

          <View style={[styles.row, styles.divider]}>
            <Icon
              name="language-outline"
              size={ms(20)}
              color={colors.textSecondary}
            />
            <Text style={styles.label}>{t('profile.language')}</Text>
            {/* Two languages: both in view rather than behind a menu. */}
            <View style={styles.segment} accessibilityRole="radiogroup">
              {LANGUAGE_OPTIONS.map(option => {
                const on = i18n.language === option.code;
                return (
                  <Pressable
                    key={option.code}
                    onPress={() => dispatch(setLanguage(option.code))}
                    style={[styles.segmentOption, on && styles.segmentOptionOn]}
                    accessibilityRole="radio"
                    accessibilityLabel={option.label}
                    accessibilityState={{ selected: on }}
                  >
                    <Text
                      style={[styles.segmentText, on && styles.segmentTextOn]}
                    >
                      {option.code.toUpperCase()}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={[styles.row, styles.divider]}>
            <Icon
              name="moon-outline"
              size={ms(20)}
              color={colors.textSecondary}
            />
            <Text style={styles.label}>{t('profile.darkMode')}</Text>
            <Toggle
              value={isDark}
              onValueChange={on =>
                dispatch(setThemeMode(on ? 'dark' : 'light'))
              }
              accessibilityLabel={t('profile.darkMode')}
            />
          </View>
        </View>

        <Pressable
          onPress={logOut}
          style={({ pressed }) => [styles.logOut, pressed && styles.pressed]}
          accessibilityRole="button"
        >
          <Icon name="log-out-outline" size={ms(18)} color={colors.danger} />
          <Text style={styles.logOutText}>{t('profile.logOut')}</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      paddingHorizontal: ms(16),
      paddingTop: ms(16),
      paddingBottom: ms(32),
    },
    pressed: {
      opacity: 0.7,
    },
    card: {
      paddingHorizontal: ms(14),
      borderRadius: ms(16),
      borderCurve: 'continuous',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      backgroundColor: colors.card,
    },
    row: {
      minHeight: ms(52),
      flexDirection: 'row',
      alignItems: 'center',
      gap: ms(12),
    },
    divider: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
    },
    label: {
      flex: 1,
      fontSize: fs(14.5),
      fontFamily: fonts.medium,
      color: colors.text,
    },
    value: {
      fontSize: fs(13),
      fontFamily: fonts.regular,
      color: colors.textMuted,
    },
    segment: {
      flexDirection: 'row',
      padding: ms(2),
      borderRadius: ms(9),
      backgroundColor: colors.surfaceMuted,
    },
    segmentOption: {
      paddingHorizontal: ms(10),
      paddingVertical: ms(5),
      borderRadius: ms(7),
    },
    segmentOptionOn: {
      backgroundColor: colors.card,
      shadowColor: colors.black,
      shadowOpacity: 0.08,
      shadowRadius: ms(2),
      shadowOffset: { width: 0, height: ms(1) },
    },
    segmentText: {
      fontSize: fs(12),
      fontFamily: fonts.semibold,
      color: colors.textSecondary,
    },
    segmentTextOn: {
      color: colors.text,
    },
    logOut: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: ms(8),
      marginTop: ms(16),
      paddingVertical: ms(14),
    },
    logOutText: {
      fontSize: fs(14.5),
      fontFamily: fonts.semibold,
      color: colors.danger,
    },
  });
}
