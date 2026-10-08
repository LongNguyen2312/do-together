import { useMemo } from 'react';
import { Alert } from 'react-native';
import {
  launchCamera,
  launchImageLibrary,
  type ImagePickerResponse,
} from 'react-native-image-picker';
import { useTranslation } from 'react-i18next';

import { friendStoryGroups, liveStories } from '@/services/stories';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { postStory } from '@/store/slices/storySlice';

const PHOTO_MAX_SIZE = 1600;

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

/** Asks for a camera shot or a library photo, then posts it as a story. */
export function usePostStory() {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();

  const onPicked = (result: ImagePickerResponse) => {
    if (result.didCancel) {
      return;
    }
    if (result.errorCode) {
      Alert.alert(
        t('chat.photoErrorTitle'),
        result.errorCode === 'camera_unavailable'
          ? t('chat.cameraUnavailable')
          : result.errorCode === 'permission'
          ? t('chat.photoPermission')
          : result.errorMessage,
      );
      return;
    }
    const uri = result.assets?.[0]?.uri;
    if (uri) {
      dispatch(postStory(uri));
    }
  };

  const options = {
    mediaType: 'photo',
    maxWidth: PHOTO_MAX_SIZE,
    maxHeight: PHOTO_MAX_SIZE,
    quality: 0.8,
  } as const;

  return () =>
    Alert.alert(t('stories.addTitle'), undefined, [
      {
        text: t('chat.camera'),
        onPress: async () => onPicked(await launchCamera(options)),
      },
      {
        text: t('chat.attach'),
        onPress: async () =>
          onPicked(await launchImageLibrary({ ...options, selectionLimit: 1 })),
      },
      { text: t('common.cancel'), style: 'cancel' },
    ]);
}
