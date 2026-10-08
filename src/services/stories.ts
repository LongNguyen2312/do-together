import { isFriend } from '@/services/mockData';
import type { Story, StoryGroup } from '@/types/story';

const HOUR = 60 * 60 * 1000;

/** Stories disappear a day after they're posted. */
export const STORY_TTL_MS = 24 * HOUR;
/** How long each photo stays on screen. */
export const STORY_DURATION_MS = 5000;

// Timed from app start, like the seeded chat threads.
const startedAt = Date.now();

const seed = (
  id: string,
  userId: string,
  photo: Story['photo'],
  hoursAgo: number,
): Story => ({ id, userId, photo, postedAt: startedAt - hoursAgo * HOUR });

const FRIEND_STORIES: Story[] = [
  seed(
    'minh-sunset',
    'minh',
    require('@/assets/images/discover/sunset-run.jpg'),
    2.5,
  ),
  seed(
    'minh-crew',
    'minh',
    require('@/assets/images/home/avatar-minh-friends.jpg'),
    0.3,
  ),
  seed(
    'lan-meetup',
    'lan',
    require('@/assets/images/onboarding/find-people.jpg'),
    4,
  ),
  seed(
    'gia-han-run',
    'gia-han',
    require('@/assets/images/home/avatar-runner-2.jpg'),
    7,
  ),
  seed(
    'thao-vy-cowork',
    'thao-vy',
    require('@/assets/images/home/avatar-cowork-1.jpg'),
    19,
  ),
  seed(
    'thao-vy-coffee',
    'thao-vy',
    require('@/assets/images/home/avatar-cowork-2.jpg'),
    18,
  ),
  seed(
    'phuong-linh-walk',
    'phuong-linh',
    require('@/assets/images/onboarding/find-people.jpg'),
    1,
  ),
  seed(
    'bao-ngoc-brunch',
    'bao-ngoc',
    require('@/assets/images/home/avatar-cowork-2.jpg'),
    5,
  ),
].filter(story => isFriend(story.userId));

const latest = (group: StoryGroup) =>
  group.stories[group.stories.length - 1]?.postedAt ?? 0;

/** Not expired yet, oldest first. */
export const liveStories = (stories: Story[], now = Date.now()) =>
  stories
    .filter(story => now - story.postedAt < STORY_TTL_MS)
    .sort((a, b) => a.postedAt - b.postedAt);

/** Friends with live stories: unseen first, then the most recent. */
export function friendStoryGroups(
  seenIds: ReadonlySet<string>,
  now = Date.now(),
): StoryGroup[] {
  const byUser = new Map<string, Story[]>();
  for (const story of liveStories(FRIEND_STORIES, now)) {
    byUser.set(story.userId, [...(byUser.get(story.userId) ?? []), story]);
  }
  return [...byUser]
    .map(([userId, stories]) => ({
      userId,
      stories,
      unseen: stories.some(story => !seenIds.has(story.id)),
    }))
    .sort(
      (a, b) => Number(b.unseen) - Number(a.unseen) || latest(b) - latest(a),
    );
}

/** Where to start a group: its first unseen story, or the beginning. */
export function firstUnseenIndex(
  stories: Story[],
  seenIds: ReadonlySet<string>,
) {
  return Math.max(
    0,
    stories.findIndex(story => !seenIds.has(story.id)),
  );
}
