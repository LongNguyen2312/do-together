import { useCallback, useSyncExternalStore } from 'react';

import {
  getPlayback,
  subscribePlayback,
  type PlaybackState,
} from '@/services/audio';

const NOT_PLAYING: PlaybackState = {
  messageId: null,
  positionMs: 0,
  durationMs: 0,
  paused: false,
};

/** Whether this message's clip is playing, and how far along it is (0-1). */
export function useVoicePlayback(messageId: string, fallbackMs: number) {
  // Other clips keep a stable snapshot, so only the playing one re-renders per tick.
  const getSnapshot = useCallback(() => {
    const playback = getPlayback();
    return playback.messageId === messageId ? playback : NOT_PLAYING;
  }, [messageId]);
  const playback = useSyncExternalStore(subscribePlayback, getSnapshot);
  const current = playback.messageId === messageId;
  const duration = playback.durationMs || fallbackMs;
  return {
    playing: current && !playback.paused,
    progress:
      current && duration > 0 ? Math.min(playback.positionMs / duration, 1) : 0,
    positionMs: current ? playback.positionMs : 0,
  };
}
