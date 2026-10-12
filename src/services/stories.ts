import { isFriend } from '@/services/mockData';
import type { Story, StoryGroup, StoryPhoto } from '@/types/story';

const HOUR = 60 * 60 * 1000;

/** Stories disappear a day after they're posted. */
export const STORY_TTL_MS = 24 * HOUR;
/** How long a photo without music stays on screen. */
const STORY_DURATION_MS = 5000;
/** Longer clips are turned away when picked. */
export const MAX_VIDEO_MS = 30000;

/**
 * How long a story stays on screen:
 * - a video, its own length (music or not), at most 30 seconds;
 * - a photo with music, the length of the song;
 * - a photo alone, 5 seconds.
 * A length that's missing counts as the most a video can be.
 */
export function storyDurationMs(story: Story) {
  if (story.media.type === 'video') {
    return Math.min(story.media.durationMs || MAX_VIDEO_MS, MAX_VIDEO_MS);
  }
  if (story.music) {
    return story.music.durationMs || MAX_VIDEO_MS;
  }
  return STORY_DURATION_MS;
}

// Timed from app start, like the seeded chat threads.
const startedAt = Date.now();

const seed = (
  id: string,
  userId: string,
  photo: StoryPhoto,
  hoursAgo: number,
): Story => ({
  id,
  userId,
  media: { type: 'photo', source: photo },
  postedAt: startedAt - hoursAgo * HOUR,
});

// Remote photos, until stories come from the API.
const PHOTOS = {
  hikeCollage:
    'https://template.canva.com/EAEMvWLXXFo/1/0/450w-1IGUGTNfeAw.jpg',
  fieldCollage:
    'https://template.canva.com/EAEMvPE8BYc/1/0/450w--zhnQigMOrY.jpg',
  fashionCollage:
    'https://template.canva.com/EAEMvX_2c5s/1/0/450w-KY9AfK-FUv0.jpg',
  dslr: 'https://media.istockphoto.com/id/610259354/vi/anh/ng%C6%B0%E1%BB%9Di-ph%E1%BB%A5-n%E1%BB%AF-tr%E1%BA%BB-s%E1%BB%AD-d%E1%BB%A5ng-m%C3%A1y-%E1%BA%A3nh-dslr.jpg?s=612x612&w=0&k=20&c=AdTtAj1Lo46Mz7ZuCC9VpmzEMp3SjNh8bPzntmnGArI=',
  cameraInHand:
    'https://img.magnific.com/hinh-chup-mien-phi/ban-tay-cam-may-anh_23-2150630970.jpg?semt=ais_hybrid&w=740&q=80',
};

const FRIEND_STORIES: Story[] = [
  seed('phuong-linh-hike', 'phuong-linh', { uri: PHOTOS.hikeCollage }, 3.5),
  seed('phuong-linh-field', 'phuong-linh', { uri: PHOTOS.fieldCollage }, 1),
  seed('thao-vy-style', 'thao-vy', { uri: PHOTOS.fashionCollage }, 6),
  seed('gia-han-camera', 'gia-han', { uri: PHOTOS.dslr }, 2),
  seed('minh-camera', 'minh', { uri: PHOTOS.cameraInHand }, 0.5),
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
