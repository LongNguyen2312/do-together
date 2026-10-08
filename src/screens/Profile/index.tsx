import { useCallback, useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ms } from 'react-native-size-matters';

import ActivityHistoryCard from '@/components/ActivityHistoryCard';
import { useTabBarInset } from '@/components/LiquidTabBar';
import { activityHistory } from '@/services/mockData';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { clearUser } from '@/store/slices/authSlice';
import { fonts, fs, useTheme, type AppColors } from '@/theme';
import type { MainTabParamList, RootStackParamList } from '@/types/navigation';
import { initialsOf } from '@/utils/format';

const HISTORY_PREVIEW_COUNT = 3;
const AVATAR_SIZE = ms(84);

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Profile'>,
  NativeStackScreenProps<RootStackParamList>
>;

export default function ProfileScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const tabBarInset = useTabBarInset();
  const user = useAppSelector(state => state.auth.user);
  const joinedIds = useAppSelector(state => state.activity.joinedIds);
  const history = useMemo(() => activityHistory(joinedIds), [joinedIds]);
  const name = user?.displayName || t('tabs.profile');

  const openActivity = useCallback(
    (activityId: string) =>
      navigation.navigate('ActivityDetail', { activityId }),
    [navigation],
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: tabBarInset + ms(24) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.identity}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initialsOf(name)}</Text>
          </View>
          <Text style={styles.name}>{name}</Text>
          {user?.email ? <Text style={styles.email}>{user.email}</Text> : null}
          <View style={styles.statPill}>
            <Text style={styles.statText}>
              {t('history.completed', { count: history.length })}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('history.title')}</Text>
            {history.length > HISTORY_PREVIEW_COUNT ? (
              <Pressable
                onPress={() => navigation.navigate('ActivityHistory')}
                hitSlop={8}
                accessibilityRole="button"
              >
                <Text style={styles.seeAll}>{t('history.seeAll')}</Text>
              </Pressable>
            ) : null}
          </View>
          {history.length ? (
            history
              .slice(0, HISTORY_PREVIEW_COUNT)
              .map(activity => (
                <ActivityHistoryCard
                  key={activity.id}
                  activity={activity}
                  onPress={openActivity}
                />
              ))
          ) : (
            <Text style={styles.empty}>{t('history.empty')}</Text>
          )}
        </View>

        <Pressable
          onPress={() => dispatch(clearUser())}
          hitSlop={8}
          style={({ pressed }) => [styles.logOut, pressed && styles.pressed]}
          accessibilityRole="button"
        >
          <Text style={styles.logOutText}>{t('home.logOut')}</Text>
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
      gap: ms(28),
      paddingTop: ms(24),
      paddingHorizontal: ms(16),
    },
    identity: {
      alignItems: 'center',
      gap: ms(4),
    },
    avatar: {
      width: AVATAR_SIZE,
      height: AVATAR_SIZE,
      borderRadius: AVATAR_SIZE / 2,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: ms(8),
      backgroundColor: colors.primary,
    },
    avatarText: {
      fontSize: fs(28),
      fontFamily: fonts.bold,
      color: colors.white,
    },
    name: {
      fontSize: fs(20),
      lineHeight: fs(26),
      fontFamily: fonts.bold,
      color: colors.text,
    },
    email: {
      fontSize: fs(13),
      fontFamily: fonts.regular,
      color: colors.textSecondary,
    },
    statPill: {
      marginTop: ms(8),
      paddingHorizontal: ms(12),
      paddingVertical: ms(5),
      borderRadius: ms(999),
      backgroundColor: colors.surfaceMuted,
    },
    statText: {
      fontSize: fs(12),
      fontFamily: fonts.semibold,
      color: colors.textSecondary,
    },
    section: {
      gap: ms(12),
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    sectionTitle: {
      fontSize: fs(17),
      fontFamily: fonts.bold,
      color: colors.text,
    },
    seeAll: {
      fontSize: fs(13),
      fontFamily: fonts.semibold,
      color: colors.primary,
    },
    empty: {
      fontSize: fs(13),
      lineHeight: fs(18),
      fontFamily: fonts.regular,
      color: colors.textSecondary,
    },
    logOut: {
      alignSelf: 'center',
      paddingHorizontal: ms(20),
      paddingVertical: ms(10),
      borderRadius: ms(999),
      backgroundColor: colors.surfaceMuted,
    },
    pressed: {
      opacity: 0.8,
    },
    logOutText: {
      fontSize: ms(14),
      fontFamily: fonts.semibold,
      color: colors.primary,
    },
  });
}
