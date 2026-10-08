import { useCallback, useMemo } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ms } from 'react-native-size-matters';
import Icon from 'react-native-vector-icons/Ionicons';

import ActivityHistoryCard from '@/components/ActivityHistoryCard';
import { activityHistory } from '@/services/mockData';
import { useAppSelector } from '@/store/hooks';
import { fonts, fs, useTheme, type AppColors } from '@/theme';
import type { RootStackParamList } from '@/types/navigation';

const BACK_SIZE = ms(38);

type Props = NativeStackScreenProps<RootStackParamList, 'ActivityHistory'>;

/** The user's history: completed activities they took part in. */
export default function ActivitiesScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const joinedIds = useAppSelector(state => state.activity.joinedIds);
  const history = useMemo(() => activityHistory(joinedIds), [joinedIds]);

  const openActivity = useCallback(
    (activityId: string) =>
      navigation.navigate('ActivityDetail', { activityId }),
    [navigation],
  );

  return (
    <View style={styles.safe}>
      <View style={[styles.header, { paddingTop: insets.top + ms(8) }]}>
        <Pressable
          onPress={navigation.goBack}
          hitSlop={6}
          style={({ pressed }) => [
            styles.backButton,
            pressed && styles.pressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel={t('auth.back')}
        >
          <Icon name="chevron-back" size={ms(20)} color={colors.text} />
        </Pressable>
        <Text style={styles.title} numberOfLines={1}>
          {t('history.title')}
        </Text>
      </View>
      <FlatList
        data={history}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <ActivityHistoryCard activity={item} onPress={openActivity} />
        )}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: insets.bottom + ms(16) },
        ]}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          history.length ? (
            <Text style={styles.count}>
              {t('history.completed', { count: history.length })}
            </Text>
          ) : undefined
        }
        ListEmptyComponent={
          <Text style={styles.empty}>{t('history.empty')}</Text>
        }
      />
    </View>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: ms(10),
      paddingHorizontal: ms(16),
      paddingBottom: ms(8),
    },
    backButton: {
      width: BACK_SIZE,
      height: BACK_SIZE,
      borderRadius: BACK_SIZE / 2,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.card,
      shadowColor: colors.black,
      shadowOpacity: 0.08,
      shadowRadius: ms(8),
      shadowOffset: { width: 0, height: ms(2) },
      elevation: 3,
    },
    pressed: {
      opacity: 0.7,
    },
    title: {
      flex: 1,
      fontSize: fs(15.5),
      lineHeight: fs(20),
      fontFamily: fonts.bold,
      color: colors.text,
    },
    list: {
      flexGrow: 1,
      gap: ms(12),
      paddingTop: ms(8),
      paddingHorizontal: ms(16),
    },
    count: {
      fontSize: fs(13),
      fontFamily: fonts.medium,
      color: colors.textSecondary,
    },
    empty: {
      marginTop: ms(48),
      paddingHorizontal: ms(24),
      fontSize: fs(14),
      lineHeight: fs(20),
      fontFamily: fonts.regular,
      textAlign: 'center',
      color: colors.textSecondary,
    },
  });
}
