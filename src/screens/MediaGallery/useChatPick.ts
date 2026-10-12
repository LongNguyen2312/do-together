import { Alert, PermissionsAndroid, Platform } from 'react-native';
import {
  launchCamera,
  launchImageLibrary,
  type ImagePickerResponse,
} from 'react-native-image-picker';
import { useTranslation } from 'react-i18next';

import { MAX_CHAT_PHOTOS, MAX_CHAT_VIDEO_MS } from '@/services/chat';
import type { ChatPick } from '@/types/chat';

import { PHOTO_OPTIONS, VIDEO_GRACE_MS } from './usePickMedia';

/**
 * Picking for a group chat, besides the gallery grid: the camera, the system
 * picker (which needs no library access), and the reasons a pick won't go,
 * said out loud.
 */
export function useChatPick() {
  const { t } = useTranslation();

  const tooLong = () =>
    Alert.alert(
      t('stories.videoTooLongTitle'),
      t('stories.videoTooLong', { seconds: MAX_CHAT_VIDEO_MS / 1000 }),
    );
  const oneVideo = () =>
    Alert.alert(
      t('chatGallery.oneVideoTitle'),
      t('chatGallery.oneVideo', { count: MAX_CHAT_PHOTOS }),
    );
  const tooMany = () =>
    Alert.alert(
      t('chatGallery.tooManyTitle'),
      t('chatGallery.tooMany', { count: MAX_CHAT_PHOTOS }),
    );

  const fromResponse = (result: ImagePickerResponse): ChatPick | null => {
    if (result.didCancel) {
      return null;
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
      return null;
    }
    const assets = (result.assets ?? []).filter(asset => asset.uri);
    const video = assets.find(asset => asset.type?.startsWith('video'));
    if (video) {
      if (assets.length > 1) {
        oneVideo();
        return null;
      }
      const durationMs = Math.round((video.duration ?? 0) * 1000);
      if (durationMs > MAX_CHAT_VIDEO_MS + VIDEO_GRACE_MS) {
        tooLong();
        return null;
      }
      return {
        key: Date.now(),
        video: {
          uri: video.uri!,
          durationMs: Math.min(
            durationMs || MAX_CHAT_VIDEO_MS,
            MAX_CHAT_VIDEO_MS,
          ),
        },
      };
    }
    return assets.length
      ? {
          key: Date.now(),
          photos: assets.slice(0, MAX_CHAT_PHOTOS).map(asset => asset.uri!),
        }
      : null;
  };

  return {
    tooLong,
    oneVideo,
    tooMany,

    /** A photo, or a clip that stops by itself at 10 seconds. */
    fromCamera: async () => {
      // The app declares the camera permission (for the story camera), so on
      // Android the system camera needs it granted first.
      if (
        Platform.OS === 'android' &&
        (await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
        )) !== PermissionsAndroid.RESULTS.GRANTED
      ) {
        Alert.alert(t('chat.photoErrorTitle'), t('chat.photoPermission'));
        return null;
      }
      return fromResponse(
        await launchCamera({
          mediaType: 'mixed',
          durationLimit: MAX_CHAT_VIDEO_MS / 1000,
          saveToPhotos: false,
          presentationStyle: 'fullScreen',
          ...PHOTO_OPTIONS,
        }),
      );
    },

    /** The system's picker, which needs no library access. */
    fromLibrary: async () =>
      fromResponse(
        await launchImageLibrary({
          mediaType: 'mixed',
          selectionLimit: MAX_CHAT_PHOTOS,
          assetRepresentationMode: 'current',
          ...PHOTO_OPTIONS,
        }),
      ),
  };
}
