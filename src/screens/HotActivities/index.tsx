import { useCallback, useMemo } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';

import PagedListScreen from '@/components/PagedListScreen';
import { useJoinActivity } from '@/hooks/useJoinActivity';
import { usePagedList } from '@/hooks/usePagedList';
import { ActivityCard, FeaturedActivityCard } from '@/screens/Discover/cards';
import { createStyles as createCardStyles } from '@/screens/Discover/styles';
import { fetchUpcomingActivities } from '@/services/discover';
import { isJoined } from '@/services/mockData';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { joinActivity } from '@/store/slices/activitySlice';
import { useTheme } from '@/theme';
import type { Activity } from '@/types/activity';
import type { RootStackParamList } from '@/types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'HotActivities'>;

export default function HotActivitiesScreen({ navigation, route }: Props) {
  const { category } = route.params;
  const { t } = useTranslation();
  const { colors } = useTheme();
  const cardStyles = useMemo(() => createCardStyles(colors), [colors]);
  const dispatch = useAppDispatch();
  const joinedIds = useAppSelector(state => state.activity.joinedIds);

  const list = usePagedList(
    useCallback(
      (page: number) => fetchUpcomingActivities({ category, page }),
      [category],
    ),
  );

  const openActivity = useCallback(
    (activityId: string) =>
      navigation.navigate('ActivityDetail', { activityId }),
    [navigation],
  );
  const requestJoin = useJoinActivity();
  const join = useCallback(
    (activityId: string) =>
      requestJoin(activityId, () => dispatch(joinActivity(activityId))),
    [requestJoin, dispatch],
  );

  const renderItem = ({ item }: { item: Activity }) => {
    const Card = item.cover ? FeaturedActivityCard : ActivityCard;
    return (
      <Card
        activity={item}
        joined={isJoined(item, joinedIds)}
        styles={cardStyles}
        onOpen={openActivity}
        onJoin={join}
      />
    );
  };

  return (
    <PagedListScreen
      title={t('discover.hotUpcoming')}
      subtitle={
        category === 'all' ? undefined : t(`imFree.activities.${category}`)
      }
      onBack={navigation.goBack}
      list={list}
      renderItem={renderItem}
      keyExtractor={item => item.id}
      extraData={joinedIds}
      emptyText={t('discover.empty')}
    />
  );
}
