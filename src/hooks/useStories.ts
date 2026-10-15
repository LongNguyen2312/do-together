import { useMemo } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import {
  friendStoryGroups,
  liveStories,
  pinnedStories,
} from '@/services/stories';
import { useFriendIds } from '@/hooks/useFriends';
import { useAppSelector } from '@/store/hooks';
import type { RootStackParamList } from '@/types/navigation';

/**
 * The user's live stories and their friends', unseen friends first; and the
 * user's pinned ones, live or not, the latest pinned first.
 */
export function useStories() {
  const mine = useAppSelector(state => state.story.mine);
  const seenIdList = useAppSelector(state => state.story.seenIds);
  const pinnedIds = useAppSelector(state => state.story.pinnedIds);
  const friendIds = useFriendIds();

  return useMemo(() => {
    const seenIds = new Set(seenIdList);
    return {
      mine: liveStories(mine),
      pinned: pinnedStories(mine, pinnedIds),
      friends: friendStoryGroups(seenIds, Date.now(), friendIds),
      seenIds,
    };
  }, [mine, seenIdList, pinnedIds, friendIds]);
}

/** Starts a story: the camera and the latest photos and videos. */
export function useNewStory() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  return () => navigation.navigate('StoryGallery');
}
