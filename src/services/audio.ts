import { PermissionsAndroid, Platform } from 'react-native';
import {
  AudioEncoderAndroidType,
  createSound,
  OutputFormatAndroidType,
  type AudioSet,
} from 'react-native-nitro-sound';

type Sound = ReturnType<typeof createSound>;

/**
 * Voice notes as AAC in .m4a, mono at 64 kbps: about 0.5 MB a minute, plenty
 * for speech (docs/BACKEND_SPEC.md, section 1.4).
 */
const VOICE_FORMAT: AudioSet = {
  AVFormatIDKeyIOS: 'aac',
  AVNumberOfChannelsKeyIOS: 1,
  AVSampleRateKeyIOS: 44100,
  OutputFormatAndroid: OutputFormatAndroidType.MPEG_4,
  AudioEncoderAndroid: AudioEncoderAndroidType.AAC,
  AudioChannels: 1,
  AudioSamplingRate: 44100,
  AudioEncodingBitRate: 64000,
};

/**
 * Voice messages: one recorder and one player for the whole app, so starting
 * a clip stops whatever was playing. Positions are in milliseconds.
 */

let recorder: Sound | null = null;
let player: Sound | null = null;
const getRecorder = () => (recorder ??= createSound());
const getPlayer = () => (player ??= createSound());

/** iOS asks on first record; Android needs an explicit request. */
export async function canRecord() {
  if (Platform.OS !== 'android') {
    return true;
  }
  const result = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
  );
  return result === PermissionsAndroid.RESULTS.GRANTED;
}

/** A voice note's waveform: this many bars, each 0–1. */
export const WAVEFORM_BARS = 32;
/** Quieter than this (dB) draws as silence; 0 dB is the loudest. */
const SILENCE_DB = -50;

/** Loudness in dB (both platforms report it so) as 0–1. */
const levelOf = (db: number | undefined) =>
  db === undefined
    ? 0
    : Math.min(Math.max((db - SILENCE_DB) / -SILENCE_DB, 0), 1);

/** How loud the recording's been, every tick since it started. */
let levels: number[] = [];

/**
 * Starts recording. `onTick` gets the time so far and how loud it is right
 * now (0–1), about ten times a second.
 */
export async function startRecording(
  onTick: (elapsedMs: number, level: number) => void,
) {
  await stopVoice();
  const sound = getRecorder();
  levels = [];
  sound.setSubscriptionDuration(0.1);
  sound.addRecordBackListener(meta => {
    const level = levelOf(meta.currentMetering);
    levels.push(level);
    onTick(meta.currentPosition, level);
  });
  await sound.startRecorder(undefined, VOICE_FORMAT, true);
}

/**
 * The levels squeezed into `bars` bars (each the loudest of its slice),
 * scaled so the loudest bar is full height.
 */
export function waveformOf(heard: number[], bars = WAVEFORM_BARS) {
  if (!heard.length) {
    return [];
  }
  const wave = Array.from({ length: bars }, (_, i) => {
    const start = Math.floor((i * heard.length) / bars);
    const end = Math.max(
      start + 1,
      Math.floor(((i + 1) * heard.length) / bars),
    );
    return Math.max(...heard.slice(start, end));
  });
  const peak = Math.max(...wave, 0.01);
  return wave.map(level => Math.round((level / peak) * 100) / 100);
}

/** Resolves with the recorded file's uri and its waveform. */
export async function stopRecording() {
  const sound = getRecorder();
  sound.removeRecordBackListener();
  const uri = await sound.stopRecorder();
  return { uri, waveform: waveformOf(levels) };
}

export interface PlaybackState {
  messageId: string | null;
  positionMs: number;
  durationMs: number;
  paused: boolean;
}

const IDLE: PlaybackState = {
  messageId: null,
  positionMs: 0,
  durationMs: 0,
  paused: false,
};

let playback = IDLE;
const listeners = new Set<() => void>();

const update = (next: Partial<PlaybackState>) => {
  playback = { ...playback, ...next };
  listeners.forEach(listener => listener());
};

export const getPlayback = () => playback;

export function subscribePlayback(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/*
 * The native player's progress ticks stall, lag behind the audio and can
 * report an early end while the clip keeps playing, so the position runs on a
 * JS clock. Native events only supply the real duration and an end that lands
 * near it.
 */
const TICK_MS = 80;
const END_GRACE_MS = 600;
/** Native end events earlier than this before the expected end are ignored. */
const EARLY_END_MS = 1000;
let ticker: ReturnType<typeof setInterval> | null = null;
/** Date.now() at which the current clip would have been at position 0. */
let startedAt = 0;

const stopTicker = () => {
  if (ticker) {
    clearInterval(ticker);
    ticker = null;
  }
};

const finish = () => {
  stopTicker();
  player?.removePlayBackListener();
  player?.removePlaybackEndListener();
  update(IDLE);
};

const startTicker = () => {
  stopTicker();
  startedAt = Date.now() - playback.positionMs;
  ticker = setInterval(() => {
    const elapsed = Date.now() - startedAt;
    const { durationMs } = playback;
    if (durationMs > 0 && elapsed >= durationMs + END_GRACE_MS) {
      finish();
      return;
    }
    update({
      positionMs: durationMs > 0 ? Math.min(elapsed, durationMs) : elapsed,
    });
  }, TICK_MS);
};

/**
 * Plays a clip, or pauses / resumes it if it is the current one.
 * `durationMs` is the recorded length, used until the player reports its own.
 */
export async function toggleVoice(
  messageId: string,
  uri: string,
  durationMs: number,
) {
  const sound = getPlayer();
  if (playback.messageId === messageId) {
    if (playback.paused) {
      await sound.resumePlayer();
      update({ paused: false });
      startTicker();
    } else {
      stopTicker();
      await sound.pausePlayer();
      update({ paused: true });
    }
    return;
  }
  await stopVoice();
  update({ ...IDLE, messageId, durationMs });
  sound.setSubscriptionDuration(0.1);
  sound.addPlayBackListener(meta => {
    if (
      playback.messageId === messageId &&
      meta.duration > 0 &&
      Math.abs(meta.duration - playback.durationMs) > TICK_MS
    ) {
      update({ durationMs: meta.duration });
    }
  });
  sound.addPlaybackEndListener(() => {
    const elapsed = Date.now() - startedAt;
    if (
      playback.messageId === messageId &&
      !playback.paused &&
      elapsed >= playback.durationMs - EARLY_END_MS
    ) {
      finish();
    }
  });
  try {
    await sound.startPlayer(uri);
  } catch (error) {
    finish();
    throw error;
  }
  if (playback.messageId === messageId) {
    startTicker();
  }
}

export async function stopVoice() {
  if (!playback.messageId || !player) {
    return;
  }
  finish();
  await player.stopPlayer();
}
