/**
 * Stories pinned to the profile: pinned and unpinned from the viewer, kept
 * after their day is up, gone with the story when it's deleted.
 */
import { liveStories, pinnedStories, STORY_TTL_MS } from '@/services/stories';
import reducer, {
  deleteStory,
  setPinnedTitle,
  togglePinStory,
} from '@/store/slices/storySlice';
import type { Story } from '@/types/story';

const story = (id: string, postedAt: number): Story => ({
  id,
  userId: 'me',
  media: { type: 'photo', source: { uri: `${id}.jpg` } },
  postedAt,
});

const initial = reducer(undefined, { type: 'init' });

test('pinning twice unpins', () => {
  const pinned = reducer(initial, togglePinStory('a'));
  expect(pinned.pinnedIds).toEqual(['a']);
  expect(reducer(pinned, togglePinStory('a')).pinnedIds).toEqual([]);
});

test('deleting a story unpins it', () => {
  const state = reducer(
    { ...initial, mine: [story('a', 0)], pinnedIds: ['a'] },
    deleteStory('a'),
  );
  expect(state.pinnedIds).toEqual([]);
});

test('pinned stories outlast their day, the latest pinned first', () => {
  const now = 10 * STORY_TTL_MS;
  const mine = [story('old', 0), story('new', now - 1000)];
  expect(liveStories(mine, now).map(s => s.id)).toEqual(['new']);
  expect(pinnedStories(mine, ['new', 'old']).map(s => s.id)).toEqual([
    'old',
    'new',
  ]);
});

test('a pinned id with no story left is skipped', () => {
  expect(pinnedStories([story('a', 0)], ['gone', 'a'])).toHaveLength(1);
});

test('a pinned story can be titled, or left blank; unpinning forgets it', () => {
  const pinned = reducer(initial, togglePinStory('a'));
  const titled = reducer(pinned, setPinnedTitle({ id: 'a', title: 'Cà phê' }));
  expect(titled.pinnedTitles.a).toBe('Cà phê');
  expect(
    reducer(titled, setPinnedTitle({ id: 'a', title: '' })).pinnedTitles.a,
  ).toBe('');
  expect(reducer(titled, togglePinStory('a')).pinnedTitles.a).toBeUndefined();
  // Only pinned stories have one.
  expect(
    reducer(initial, setPinnedTitle({ id: 'b', title: 'x' })).pinnedTitles.b,
  ).toBeUndefined();
});
