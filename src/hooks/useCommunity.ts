import { useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { communityChatId } from '@/services/mockData';
import { useAppDispatch } from '@/store/hooks';
import { joinCommunity } from '@/store/slices/activitySlice';
import { rejoinChat } from '@/store/slices/chatSlice';
import type { RootStackParamList } from '@/types/navigation';

/**
 * Joining a community puts its group chat on the Chats tab (back again if
 * the user had left it); once joined, its row opens that chat. Tapping the
 * row itself opens the community's page.
 */
export function useCommunityActions() {
  const dispatch = useAppDispatch();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const join = useCallback(
    (communityId: string) => {
      dispatch(joinCommunity(communityId));
      dispatch(rejoinChat(communityChatId(communityId)));
    },
    [dispatch],
  );

  const openChat = useCallback(
    (communityId: string) =>
      navigation.navigate('GroupChat', {
        activityId: communityChatId(communityId),
      }),
    [navigation],
  );

  const openDetail = useCallback(
    (communityId: string) =>
      navigation.navigate('CommunityDetail', { communityId }),
    [navigation],
  );

  return { join, openChat, openDetail };
}
