import { PermissionsAndroid, Platform, type Permission } from 'react-native';
import {
  CameraRoll,
  cameraRollEventEmitter,
  iosReadGalleryPermission,
  iosRefreshGallerySelection,
  iosRequestReadWriteGalleryPermission,
} from '@react-native-camera-roll/camera-roll';

import type {
  GalleryAlbum,
  GalleryPage,
  GalleryReadAccess,
} from '@/types/story';

/** About three screens of the story gallery's grid. */
const PAGE_SIZE = 60;

const { PERMISSIONS, RESULTS } = PermissionsAndroid;

/** Whether photos and videos can be read, without asking. */
export async function readGalleryAccess(): Promise<GalleryReadAccess> {
  if (Platform.OS === 'ios') {
    const status = await iosReadGalleryPermission('readWrite');
    return status === 'granted' || status === 'limited'
      ? status
      : status === 'not-determined'
      ? 'denied'
      : 'blocked';
  }
  if (Number(Platform.Version) < 33) {
    return (await PermissionsAndroid.check(PERMISSIONS.READ_EXTERNAL_STORAGE))
      ? 'granted'
      : 'denied';
  }
  const [images, videos, selected] = await Promise.all([
    PermissionsAndroid.check(PERMISSIONS.READ_MEDIA_IMAGES),
    PermissionsAndroid.check(PERMISSIONS.READ_MEDIA_VIDEO),
    PermissionsAndroid.check(PERMISSIONS.READ_MEDIA_VISUAL_USER_SELECTED),
  ]);
  return images && videos ? 'granted' : selected ? 'limited' : 'denied';
}

/** Reading photos and videos, asking first if it hasn't been decided. */
export async function requestGalleryReadAccess(): Promise<GalleryReadAccess> {
  if (Platform.OS === 'ios') {
    let status = await iosReadGalleryPermission('readWrite');
    if (status === 'not-determined') {
      status = await iosRequestReadWriteGalleryPermission();
    }
    // iOS asks once; after a no, only Settings can change it.
    return status === 'granted' || status === 'limited' ? status : 'blocked';
  }
  const version = Number(Platform.Version);
  if (version < 33) {
    const result = await PermissionsAndroid.request(
      PERMISSIONS.READ_EXTERNAL_STORAGE,
    );
    return androidAccess(result === RESULTS.GRANTED, [result]);
  }
  const wanted: Permission[] = [
    PERMISSIONS.READ_MEDIA_IMAGES,
    PERMISSIONS.READ_MEDIA_VIDEO,
  ];
  // Android 14 lets people share just some photos, like iOS.
  if (version >= 34) {
    wanted.push(PERMISSIONS.READ_MEDIA_VISUAL_USER_SELECTED);
  }
  const results = await PermissionsAndroid.requestMultiple(wanted);
  const all =
    results[PERMISSIONS.READ_MEDIA_IMAGES] === RESULTS.GRANTED &&
    results[PERMISSIONS.READ_MEDIA_VIDEO] === RESULTS.GRANTED;
  if (
    !all &&
    results[PERMISSIONS.READ_MEDIA_VISUAL_USER_SELECTED] === RESULTS.GRANTED
  ) {
    return 'limited';
  }
  return androidAccess(all, Object.values(results));
}

function androidAccess(granted: boolean, results: string[]): GalleryReadAccess {
  if (granted) {
    return 'granted';
  }
  return results.includes(RESULTS.NEVER_ASK_AGAIN) ? 'blocked' : 'denied';
}

/**
 * The latest photos and videos, newest first, from `after` on: the whole
 * library, or one album.
 */
export async function fetchGalleryPage(
  after?: string,
  album?: GalleryAlbum,
  first = PAGE_SIZE,
): Promise<GalleryPage> {
  const page = await CameraRoll.getPhotos({
    first,
    after,
    assetType: 'All',
    // Sizes are free on iOS but would make Android open every file.
    include:
      Platform.OS === 'ios'
        ? ['playableDuration', 'imageSize']
        : ['playableDuration'],
    ...(album ? { groupTypes: album.type, groupName: album.title } : {}),
  });
  return {
    assets: page.edges.map(({ node }) => ({
      uri: node.image.uri,
      // iOS says `video`, Android gives the MIME type, e.g. `video/mp4`.
      type: node.type.startsWith('video') ? 'video' : 'photo',
      durationMs: Math.round((node.image.playableDuration ?? 0) * 1000),
      width: node.image.width || undefined,
      height: node.image.height || undefined,
    })),
    next: page.page_info.has_next_page ? page.page_info.end_cursor : undefined,
  };
}

/** The albums that have something in them, each with its newest item. */
export async function fetchGalleryAlbums(): Promise<GalleryAlbum[]> {
  const found = await CameraRoll.getAlbums({
    assetType: 'All',
    albumType: 'All',
  });
  const albums = found.map(album => ({
    title: album.title,
    count: album.count,
    type: album.type === 'SmartAlbum' ? 'SmartAlbum' : 'Album',
  })) as GalleryAlbum[];
  // iOS lists the whole library as a smart album too (Recents, in the
  // phone's language); the gallery has its own for that. It's the largest.
  const largest = Math.max(...albums.map(album => album.count));
  const library = albums.find(
    album => album.type === 'SmartAlbum' && album.count === largest,
  );
  return Promise.all(
    albums
      .filter(album => album !== library)
      .map(async album => {
        const cover = await fetchGalleryPage(undefined, album, 1).catch(
          () => null,
        );
        return { ...album, coverUri: cover?.assets[0]?.uri };
      }),
  );
}

/**
 * With limited access, lets the user change which photos the app sees: iOS
 * shows its picker for that, Android asks again.
 */
export async function changeGallerySelection() {
  if (Platform.OS === 'ios') {
    await iosRefreshGallerySelection();
    return;
  }
  await requestGalleryReadAccess();
}

/**
 * Calls back when the library changes, or which photos the app may see does
 * (iOS; Android has no such notice).
 */
export function onGalleryChange(listener: () => void) {
  if (Platform.OS !== 'ios') {
    return () => {};
  }
  const subscription = cameraRollEventEmitter.addListener(
    'onLibrarySelectionChange',
    listener,
  );
  return () => subscription.remove();
}
