import { Image, PermissionsAndroid, Platform } from 'react-native';
import {
  CameraRoll,
  iosReadGalleryPermission,
  iosRequestAddOnlyGalleryPermission,
} from '@react-native-camera-roll/camera-roll';
import ReactNativeBlobUtil from 'react-native-blob-util';

import type { ChatPhoto } from '@/types/chat';

/**
 * `denied`: the user said no but can be asked again.
 * `blocked`: the system won't ask again; only Settings can change it.
 */
export type GalleryAccess = 'granted' | 'denied' | 'blocked';

/** Asks for permission to add photos when it hasn't been decided yet. */
export async function requestGalleryAccess(): Promise<GalleryAccess> {
  if (Platform.OS === 'ios') {
    let status = await iosReadGalleryPermission('addOnly');
    if (status === 'not-determined') {
      status = await iosRequestAddOnlyGalleryPermission();
    }
    return status === 'granted' || status === 'limited' ? 'granted' : 'blocked';
  }
  // Android 10+ adds to the gallery through MediaStore without a permission.
  if (Number(Platform.Version) >= 29) {
    return 'granted';
  }
  const result = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
  );
  return result === PermissionsAndroid.RESULTS.GRANTED
    ? 'granted'
    : result === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN
    ? 'blocked'
    : 'denied';
}

/**
 * Saves a photo to the device gallery once access is granted. Remote images
 * (and bundled ones served by Metro in debug) are downloaded to the cache
 * first, since the gallery only accepts local files.
 */
export async function savePhoto(
  source: ChatPhoto,
): Promise<'saved' | Exclude<GalleryAccess, 'granted'>> {
  const access = await requestGalleryAccess();
  if (access !== 'granted') {
    return access;
  }
  const uri =
    typeof source === 'number'
      ? Image.resolveAssetSource(source)?.uri
      : source.uri;
  if (!uri) {
    throw new Error('Unknown image source');
  }
  let localUri = uri;
  if (/^https?:\/\//.test(uri)) {
    const response = await ReactNativeBlobUtil.config({
      fileCache: true,
      appendExt: 'jpg',
    }).fetch('GET', uri);
    localUri = `file://${response.path()}`;
  }
  await CameraRoll.saveAsset(localUri, { type: 'photo' });
  return 'saved';
}
