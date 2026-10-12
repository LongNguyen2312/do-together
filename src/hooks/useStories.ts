import { useMemo } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { friendStoryGroups, liveStories } from '@/services/stories';
import { useAppSelector } from '@/store/hooks';
import type { RootStackParamList } from '@/types/navigation';

/** The user's live stories and their friends', unseen friends first. */
export function useStories() {
  const mine = useAppSelector(state => state.story.mine);
  const seenIdList = useAppSelector(state => state.story.seenIds);

  return useMemo(() => {
    const seenIds = new Set(seenIdList);
    return {
      mine: liveStories(mine),
      friends: friendStoryGroups(seenIds),
      seenIds,
    };
  }, [mine, seenIdList]);
}

/** Starts a story: the camera and the latest photos and videos. */
export function useNewStory() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  return () => navigation.navigate('StoryGallery');
}
