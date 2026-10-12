import { useEffect, useRef, useState } from 'react';

import {
  cancelVideoCompression,
  compressPhoto,
  compressVideo,
  videoPoster,
} from '@/services/media';
import type { StoryMedia } from '@/types/story';

export type Prepared =
  /** `percent` only moves for videos. */
  | { status: 'working'; percent: number }
  | { status: 'ready'; media: StoryMedia }
  | { status: 'failed' };

/**
 * Shrinks the picked photo or video for sharing, in the background while the
 * story is being made: photos to a smaller JPEG, videos to 720p with a poster
 * frame. Leaving the editor cancels it.
 */
export function usePreparedMedia(media: StoryMedia) {
  const [prepared, setPrepared] = useState<Prepared>({
    status: 'working',
    percent: 0,
  });
  const [attempt, setAttempt] = useState(0);
  const lastPercent = useRef(0);

  useEffect(() => {
    let cancelled = false;
    let cancelId: string | undefined;
    lastPercent.current = 0;
    setPrepared({ status: 'working', percent: 0 });

    // Progress ticks often; only whole percents re-render the editor.
    const onProgress = (progress: number) => {
      const percent = Math.round(progress * 100);
      if (!cancelled && percent !== lastPercent.current) {
        lastPercent.current = percent;
        setPrepared({ status: 'working', percent });
      }
    };

    const prepare = async (): Promise<StoryMedia> => {
      if (media.type === 'photo') {
        // Bundled photos ship already sized.
        return typeof media.source === 'number'
          ? media
          : {
              type: 'photo',
              source: { uri: await compressPhoto(media.source.uri) },
            };
      }
      const uri = await compressVideo(media.uri, onProgress, id => {
        cancelId = id;
      });
      return { ...media, uri, posterUri: await videoPoster(uri) };
    };

    prepare().then(
      ready => {
        if (!cancelled) {
          setPrepared({ status: 'ready', media: ready });
        }
      },
      () => {
        if (!cancelled) {
          setPrepared({ status: 'failed' });
        }
      },
    );

    return () => {
      cancelled = true;
      if (cancelId) {
        cancelVideoCompression(cancelId);
      }
    };
  }, [media, attempt]);

  return { prepared, retry: () => setAttempt(count => count + 1) };
}
