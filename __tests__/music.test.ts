/**
 * Story music: a song played with `onEnd` reports when it has played through,
 * once, and not when it was stopped or replaced first; muting silences it
 * without stopping it.
 */
const mockSound = {
  endListener: null as null | (() => void),
  startPlayer: jest.fn(() => Promise.resolve('')),
  stopPlayer: jest.fn(() => Promise.resolve('')),
  pausePlayer: jest.fn(() => Promise.resolve('')),
  resumePlayer: jest.fn(() => Promise.resolve('')),
  setVolume: jest.fn((_volume: number) => Promise.resolve('')),
  addPlaybackEndListener: jest.fn((listener: () => void) => {
    mockSound.endListener = listener;
  }),
  removePlaybackEndListener: jest.fn(() => {
    mockSound.endListener = null;
  }),
};

jest.mock('react-native-nitro-sound', () => ({
  createSound: () => mockSound,
}));

import { playMusic, setMusicMuted, stopMusic } from '@/services/music';

const SONG_MS = 30000;

beforeEach(async () => {
  jest.useFakeTimers();
  await stopMusic();
  setMusicMuted(false);
  jest.clearAllMocks();
});

afterEach(() => {
  jest.useRealTimers();
});

test('reports the end when the player finishes on time', async () => {
  const onEnd = jest.fn();
  await playMusic('a.mp3', { durationMs: SONG_MS, onEnd });
  jest.advanceTimersByTime(SONG_MS);
  mockSound.endListener?.();
  expect(onEnd).toHaveBeenCalledTimes(1);
  // The fallback timer doesn't report it a second time.
  jest.advanceTimersByTime(5000);
  expect(onEnd).toHaveBeenCalledTimes(1);
});

test('ignores an early end event and falls back on the timer', async () => {
  const onEnd = jest.fn();
  await playMusic('a.mp3', { durationMs: SONG_MS, onEnd });
  jest.advanceTimersByTime(10000);
  mockSound.endListener?.();
  expect(onEnd).not.toHaveBeenCalled();
  jest.advanceTimersByTime(SONG_MS);
  expect(onEnd).toHaveBeenCalledTimes(1);
});

test("doesn't report a song that was stopped first", async () => {
  const onEnd = jest.fn();
  await playMusic('a.mp3', { durationMs: SONG_MS, onEnd });
  await stopMusic();
  jest.advanceTimersByTime(SONG_MS * 2);
  expect(onEnd).not.toHaveBeenCalled();
});

test("doesn't report a song another one replaced", async () => {
  const first = jest.fn();
  const second = jest.fn();
  await playMusic('a.mp3', { durationMs: SONG_MS, onEnd: first });
  jest.advanceTimersByTime(5000);
  await playMusic('b.mp3', { durationMs: SONG_MS, onEnd: second });
  jest.advanceTimersByTime(SONG_MS * 2);
  expect(first).not.toHaveBeenCalled();
  expect(second).toHaveBeenCalledTimes(1);
});

test('mutes the song playing and the next one, without stopping them', async () => {
  await playMusic('a.mp3');
  setMusicMuted(true);
  expect(mockSound.setVolume).toHaveBeenLastCalledWith(0);
  expect(mockSound.stopPlayer).not.toHaveBeenCalled();
  await playMusic('b.mp3');
  expect(mockSound.setVolume).toHaveBeenLastCalledWith(0);
  setMusicMuted(false);
  expect(mockSound.setVolume).toHaveBeenLastCalledWith(1);
});
