import { createSound } from 'react-native-nitro-sound';

import { http } from '@/services/api';
import type { MusicTrack } from '@/types/story';
import { MUSIC_BASE_URL } from '@/utils/constants';

/** One song in music/manifest.json (see scripts/music/manifest.json). */
interface ManifestEntry {
  id: string;
  title: string;
  file: string;
  durationMs: number;
}

let tracks: Promise<MusicTrack[]> | null = null;

/**
 * The music library, fetched once per session; `refresh` fetches it again.
 * A failed fetch isn't kept, so the next call retries.
 */
export function fetchMusicTracks(refresh = false) {
  if (refresh) {
    tracks = null;
  }
  // R2 sends no Cache-Control, so the phone would keep an old list for hours
  // (going by Last-Modified); a fresh query skips its HTTP cache. The list
  // is tiny, and the songs themselves still cache.
  tracks ??= http
    .get<ManifestEntry[]>(`${MUSIC_BASE_URL}/music/manifest.json`, {
      params: { t: Date.now() },
      headers: { 'Cache-Control': 'no-cache' },
    })
    .then(({ data: entries }) =>
      entries.map(entry => ({
        id: entry.id,
        title: entry.title,
        durationMs: entry.durationMs,
        url: `${MUSIC_BASE_URL}/music/${encodeURIComponent(entry.file)}`,
      })),
    )
    .catch(error => {
      tracks = null;
      throw error;
    });
  return tracks;
}

/*
 * Story music has its own player, apart from voice messages, so previewing a
 * song or watching a story never cuts a voice clip off mid-way (or the other
 * way round). One song plays at a time.
 */
type Sound = ReturnType<typeof createSound>;
let player: Sound | null = null;
let playing: string | null = null;
/** Bumped by every start and stop, so a stale end can tell it's stale. */
let session = 0;
let muted = false;
let endTimer: ReturnType<typeof setTimeout> | null = null;
const getPlayer = () => (player ??= createSound());

/*
 * The native end event can fire early (see services/audio.ts), so one more
 * than a second before the expected end is ignored, and a timer stands in if
 * it never comes.
 */
const EARLY_END_MS = 1000;
const END_GRACE_MS = 1500;

const clearEnd = () => {
  if (endTimer) {
    clearTimeout(endTimer);
    endTimer = null;
  }
  player?.removePlaybackEndListener();
};

interface PlayOptions {
  /** Told once the song has played to the end on its own. */
  onEnd?: () => void;
  /** The song's length, for spotting the end. */
  durationMs?: number;
}

/** Starts a song from the top, replacing whatever was playing. */
export async function playMusic(
  url: string,
  { onEnd, durationMs = 0 }: PlayOptions = {},
) {
  const sound = getPlayer();
  clearEnd();
  if (playing) {
    await sound.stopPlayer().catch(() => {});
  }
  playing = url;
  session += 1;
  const mine = session;
  try {
    await sound.startPlayer(url);
  } catch {
    if (session === mine) {
      playing = null;
    }
    return;
  }
  // Stopped while it was still loading. (If another song replaced it, that
  // one has already taken the player over.)
  if (playing === null) {
    await sound.stopPlayer().catch(() => {});
    return;
  }
  sound.setVolume(muted ? 0 : 1).catch(() => {});
  if (!onEnd || session !== mine) {
    return;
  }
  const startedAt = Date.now();
  const finish = () => {
    if (session !== mine) {
      return;
    }
    clearEnd();
    playing = null;
    session += 1;
    onEnd();
  };
  sound.addPlaybackEndListener(() => {
    if (Date.now() - startedAt >= durationMs - EARLY_END_MS) {
      finish();
    }
  });
  endTimer = setTimeout(finish, durationMs + END_GRACE_MS);
}

/**
 * Silences story music without stopping it (the story viewer's mute button),
 * so unmuting picks up wherever the song has got to.
 */
export function setMusicMuted(next: boolean) {
  muted = next;
  if (playing) {
    getPlayer()
      .setVolume(next ? 0 : 1)
      .catch(() => {});
  }
}

export async function pauseMusic() {
  if (playing) {
    await getPlayer()
      .pausePlayer()
      .catch(() => {});
  }
}

export async function resumeMusic() {
  if (playing) {
    await getPlayer()
      .resumePlayer()
      .catch(() => {});
  }
}

export async function stopMusic() {
  if (!playing) {
    return;
  }
  clearEnd();
  playing = null;
  session += 1;
  await getPlayer()
    .stopPlayer()
    .catch(() => {});
}
