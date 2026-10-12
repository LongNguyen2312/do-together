import { Alert } from 'react-native';
import {
  launchImageLibrary,
  type ImagePickerResponse,
} from 'react-native-image-picker';
import { useTranslation } from 'react-i18next';

import { PHOTO_MAX_SIZE } from '@/services/media';
import { MAX_VIDEO_MS } from '@/services/stories';
import type { GalleryAsset, StoryMedia } from '@/types/story';

/** Small overshoots from rounding still count as 30 seconds. */
export const VIDEO_GRACE_MS = 500;

/** Picked photos are already shrunk to about what's shared. */
export const PHOTO_OPTIONS = {
  maxWidth: PHOTO_MAX_SIZE,
  maxHeight: PHOTO_MAX_SIZE,
  quality: 0.8,
} as const;

/**
 * Turns a photo or a video of up to 30 seconds into a story's media, from the
 * gallery or the system photo picker. Each resolves to null when
 * cancelled or refused (after saying why).
 */
export function usePickMedia() {
  const { t } = useTranslation();

  const toMedia = (asset: GalleryAsset): StoryMedia | null => {
    if (asset.type === 'photo') {
      return { type: 'photo', source: { uri: asset.uri } };
    }
    if (asset.durationMs > MAX_VIDEO_MS + VIDEO_GRACE_MS) {
      Alert.alert(
        t('stories.videoTooLongTitle'),
        t('stories.videoTooLong', { seconds: MAX_VIDEO_MS / 1000 }),
      );
      return null;
    }
    return {
      type: 'video',
      uri: asset.uri,
      durationMs: Math.min(asset.durationMs || MAX_VIDEO_MS, MAX_VIDEO_MS),
    };
  };

  const fromResponse = (result: ImagePickerResponse): StoryMedia | null => {
    if (result.didCancel) {
      return null;
    }
    if (result.errorCode) {
      Alert.alert(
        t('chat.photoErrorTitle'),
        result.errorCode === 'permission'
          ? t('chat.photoPermission')
          : result.errorMessage,
      );
      return null;
    }
    const asset = result.assets?.[0];
    if (!asset?.uri) {
      return null;
    }
    return toMedia({
      uri: asset.uri,
      type: asset.type?.startsWith('video') ? 'video' : 'photo',
      durationMs: Math.round((asset.duration ?? 0) * 1000),
    });
  };

  return {
    fromGallery: toMedia,

    /** The system's picker, which needs no library access. */
    fromLibrary: async () =>
      fromResponse(
        await launchImageLibrary({
          mediaType: 'mixed',
          selectionLimit: 1,
          // As stored, without iOS converting it first (HEVC to H.264 can take
          // seconds): the compressor re-encodes it anyway.
          assetRepresentationMode: 'current',
          ...PHOTO_OPTIONS,
        }),
      ),
  };
}
