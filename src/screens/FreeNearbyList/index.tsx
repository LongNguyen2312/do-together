import { useCallback, useMemo } from 'react';
import { Alert } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';

import PagedListScreen from '@/components/PagedListScreen';
import { usePagedList } from '@/hooks/usePagedList';
import NearbyCard from '@/screens/ActivityDetail/NearbyCard';
import { createStyles } from '@/screens/ActivityDetail/styles';
import { fetchFreeUsersFor } from '@/services/discover';
import { canInviteTo, getActivity } from '@/services/mockData';
import { useTheme } from '@/theme';
import type { User } from '@/types/activity';
import type { RootStackParamList } from '@/types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'FreeNearbyList'>;

export default function FreeNearbyListScreen({ navigation, route }: Props) {
  const { activityId } = route.params;
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const activity = getActivity(activityId);
  const canInvite = !!activity && canInviteTo(activity);

  const list = usePagedList(
    useCallback(
      (page: number) => fetchFreeUsersFor(activityId, page),
      [activityId],
    ),
  );

  const showComingSoon = () =>
    Alert.alert(t('auth.comingSoonTitle'), t('auth.comingSoonMessage'));

  return (
    <PagedListScreen
      title={t('activityDetail.nearbyFree')}
      subtitle={activity?.title}
      onBack={navigation.goBack}
      list={list}
      renderItem={({ item }: { item: User }) => (
        <NearbyCard
          person={item}
          activityId={activityId}
          canInvite={canInvite}
          onMessage={showComingSoon}
          styles={styles}
        />
      )}
      keyExtractor={item => item.id}
      extraData={canInvite}
      emptyText={t('activityDetail.nearbyEmpty')}
    />
  );
}
