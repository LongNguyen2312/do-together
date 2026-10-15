import { useCallback, useMemo } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ms } from 'react-native-size-matters';

import ActivityHistoryCard from '@/components/ActivityHistoryCard';
import ScreenHeader from '@/components/ScreenHeader';
import { activityHistory } from '@/services/mockData';
import { useAppSelector } from '@/store/hooks';
import { fonts, fs, useTheme, type AppColors } from '@/theme';
import type { RootStackParamList } from '@/types/navigation';

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
    <View style={[styles.safe, { paddingTop: insets.top }]}>
      <ScreenHeader title={t('history.title')} onBack={navigation.goBack} />
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
