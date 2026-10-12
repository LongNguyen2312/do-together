/**
 * How long a story stays up: a photo alone 5 seconds, a photo with music as
 * long as the song, a video as long as itself but no more than 30 seconds.
 */
import { MAX_VIDEO_MS, storyDurationMs } from '@/services/stories';
import type { MusicTrack, Story, StoryMedia } from '@/types/story';

const photo: StoryMedia = { type: 'photo', source: { uri: 'a.jpg' } };
const video = (durationMs: number): StoryMedia => ({
  type: 'video',
  uri: 'a.mp4',
  durationMs,
});
const song: MusicTrack = {
  id: 'song',
  title: 'Song',
  url: 'song.mp3',
  durationMs: 32313,
};
const story = (media: StoryMedia, music?: MusicTrack): Story => ({
  id: 's',
  userId: 'u',
  media,
  music,
  postedAt: 0,
});

test('a photo alone stays 5 seconds', () => {
  expect(storyDurationMs(story(photo))).toBe(5000);
});

test('a photo with music stays as long as the song', () => {
  expect(storyDurationMs(story(photo, song))).toBe(32313);
});

test('a video stays as long as itself, music or not', () => {
  expect(storyDurationMs(story(video(12000)))).toBe(12000);
  expect(storyDurationMs(story(video(12000), song))).toBe(12000);
});

test('a video stays no more than 30 seconds', () => {
  expect(storyDurationMs(story(video(45000)))).toBe(MAX_VIDEO_MS);
});

test('a missing length counts as 30 seconds', () => {
  expect(storyDurationMs(story(video(0)))).toBe(MAX_VIDEO_MS);
  expect(storyDurationMs(story(photo, { ...song, durationMs: 0 }))).toBe(
    MAX_VIDEO_MS,
  );
});
