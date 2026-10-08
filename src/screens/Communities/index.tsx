import { useCallback, useMemo } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { ms } from 'react-native-size-matters';

import PagedListScreen from '@/components/PagedListScreen';
import { usePagedList } from '@/hooks/usePagedList';
import { CommunityRow } from '@/screens/Discover/cards';
import { createStyles as createCardStyles } from '@/screens/Discover/styles';
import { fetchCommunities } from '@/services/discover';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { toggleCommunity } from '@/store/slices/activitySlice';
import { useTheme } from '@/theme';
import type { Community } from '@/types/activity';
import type { RootStackParamList } from '@/types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Communities'>;

export default function CommunitiesScreen({ navigation, route }: Props) {
  const { category } = route.params;
  const { t } = useTranslation();
  const { colors } = useTheme();
  const cardStyles = useMemo(() => createCardStyles(colors), [colors]);
  const dispatch = useAppDispatch();
  const joinedIds = useAppSelector(state => state.activity.joinedCommunityIds);

  const list = usePagedList(
    useCallback(
      (page: number) => fetchCommunities({ category, page }),
      [category],
    ),
  );

  const toggle = useCallback(
    (communityId: string) => dispatch(toggleCommunity(communityId)),
    [dispatch],
  );

  const renderItem = ({ item }: { item: Community }) => (
    <CommunityRow
      community={item}
      joined={joinedIds.includes(item.id)}
      styles={cardStyles}
      onToggle={toggle}
    />
  );

  return (
    <PagedListScreen
      title={t('discover.communities')}
      subtitle={
        category === 'all' ? undefined : t(`imFree.activities.${category}`)
      }
      onBack={navigation.goBack}
      list={list}
      renderItem={renderItem}
      keyExtractor={item => item.id}
      extraData={joinedIds}
      itemGap={ms(10)}
      emptyText={t('discover.empty')}
    />
  );
}
