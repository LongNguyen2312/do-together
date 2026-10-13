import { Image as RNImage } from 'react-native';
import { createVideoThumbnail, Image, Video } from 'react-native-compressor';

import type { ChatPhoto, ChatPick, ChatVideo } from '@/types/chat';

/*
 * Every photo, video and voice note is shrunk on the phone before it goes
 * anywhere: the servers can't re-encode media (Cloudflare Workers have no
 * ffmpeg), and it saves storage, data and loading time. Targets follow
 * docs/BACKEND_SPEC.md, section 1.4.
 */

/** Long edge of photos in stories and chats. */
export const PHOTO_MAX_SIZE = 1600;
/** Long edge of small pictures: avatars, custom activity photos. */
export const SMALL_PHOTO_MAX_SIZE = 800;
const POSTER_MAX_SIZE = 720;
const PHOTO_QUALITY = 0.8;
/** 720p on the long edge, about 2.5 Mbps: 5–10 MB for a 30 s story. */
const VIDEO_MAX_SIZE = 1280;
const VIDEO_BITRATE = 2_500_000;

const photoOptions = (maxSize: number) =>
  ({
    compressionMethod: 'manual',
    maxWidth: maxSize,
    maxHeight: maxSize,
    quality: PHOTO_QUALITY,
    // Re-encoding to JPEG also turns HEIC / PNG into JPEG and drops EXIF,
    // including where the photo was taken.
    output: 'jpg',
  } as const);

/** A JPEG at most `maxSize` on its long edge; resolves to its file uri. */
export const compressPhoto = (uri: string, maxSize = PHOTO_MAX_SIZE) =>
  Image.compress(uri, photoOptions(maxSize));

/** The same, as a `data:` uri, for pictures kept in the store. */
export async function compressPhotoToDataUri(
  uri: string,
  maxSize = SMALL_PHOTO_MAX_SIZE,
) {
  const base64 = await Image.compress(uri, {
    ...photoOptions(maxSize),
    returnableOutputType: 'base64',
  });
  return `data:image/jpeg;base64,${base64}`;
}

/**
 * H.264 at 720p and about 2.5 Mbps. `onProgress` gets 0–1; `onCancelId`
 * gets an id for `cancelVideoCompression`.
 */
export const compressVideo = (
  uri: string,
  onProgress?: (progress: number) => void,
  onCancelId?: (id: string) => void,
) =>
  Video.compress(
    uri,
    {
      compressionMethod: 'manual',
      maxSize: VIDEO_MAX_SIZE,
      bitrate: VIDEO_BITRATE,
      getCancellationId: onCancelId,
    },
    onProgress,
  );

export const cancelVideoCompression = (id: string) =>
  Video.cancelCompression(id);

/** The first frame, as a small JPEG for tiles. */
export async function videoPoster(uri: string) {
  const { path } = await createVideoThumbnail(uri);
  return compressPhoto(path, POSTER_MAX_SIZE);
}

/** A picture's size in pixels; undefined if it can't be read. */
const sizeOf = (uri: string) =>
  new Promise<{ width: number; height: number } | undefined>(resolve =>
    RNImage.getSize(
      uri,
      (width, height) => resolve({ width, height }),
      () => resolve(undefined),
    ),
  );

/**
 * A chat pick, ready to send: photos as JPEGs, a clip at 720p with its
 * poster. Never the originals.
 */
export async function prepareChatMedia(pick: ChatPick): Promise<{
  photos?: ChatPhoto[];
  video?: ChatVideo;
}> {
  if (pick.video) {
    const { width, height, durationMs } = pick.video;
    const uri = await compressVideo(pick.video.uri);
    const posterUri = await videoPoster(uri);
    // Its shape for the tile: from the pick, else from the first frame.
    const size = width && height ? { width, height } : await sizeOf(posterUri);
    return { video: { uri, durationMs, posterUri, ...size } };
  }
  // Sized for a lone photo's tile, which takes its shape.
  const photos = await Promise.all(
    (pick.photos ?? []).map(async original => {
      const uri = await compressPhoto(original);
      return { uri, ...(await sizeOf(uri)) };
    }),
  );
  return { photos };
}
