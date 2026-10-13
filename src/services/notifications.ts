import type {
  AppNotification,
  NotificationGroup,
  NotificationKind,
  NotificationSettingKey,
} from '@/types/notification';

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** The filter each kind falls under. */
export const NOTIFICATION_GROUP: Record<NotificationKind, NotificationGroup> = {
  join: 'activity',
  leave: 'activity',
  starting: 'activity',
  checkIn: 'activity',
  invite: 'activity',
  mention: 'chat',
  reply: 'chat',
  friendRequest: 'friends',
  friendAccepted: 'friends',
  follow: 'friends',
  storyReaction: 'story',
  storyReply: 'story',
  friendStory: 'story',
};

/** The settings switch that turns each kind off. */
export const NOTIFICATION_SETTING: Record<
  NotificationKind,
  NotificationSettingKey
> = {
  join: 'members',
  leave: 'members',
  starting: 'starting',
  checkIn: 'checkIns',
  invite: 'invites',
  mention: 'mentions',
  reply: 'replies',
  friendRequest: 'friendRequests',
  friendAccepted: 'friendRequests',
  follow: 'follows',
  storyReaction: 'storyActivity',
  storyReply: 'storyActivity',
  friendStory: 'friendStories',
};

/** The settings screen, section by section, in order. */
export const NOTIFICATION_SETTING_SECTIONS: {
  group: NotificationGroup;
  keys: NotificationSettingKey[];
}[] = [
  { group: 'activity', keys: ['members', 'starting', 'checkIns', 'invites'] },
  { group: 'chat', keys: ['mentions', 'replies'] },
  { group: 'friends', keys: ['friendRequests', 'follows'] },
  { group: 'story', keys: ['storyActivity', 'friendStories'] },
];

type Seed = Omit<AppNotification, 'id' | 'createdAt'> & { ago: number };

// Timed from app start, like the chat threads, until the server sends them.
const SEEDS: Seed[] = [
  {
    kind: 'mention',
    actorId: 'huy',
    activityId: 'sunset-lake-run',
    quote: "Don't forget water, it'll be hot",
    ago: 4 * MINUTE,
    read: false,
  },
  { kind: 'friendRequest', actorId: 'duc-anh', ago: 25 * MINUTE, read: false },
  {
    kind: 'starting',
    activityId: 'quang-an-doubles',
    minutes: 30,
    ago: 40 * MINUTE,
    read: false,
  },
  {
    kind: 'storyReaction',
    actorId: 'lan',
    emoji: '😍',
    ago: 2 * HOUR,
    read: false,
  },
  {
    kind: 'join',
    actorId: 'mai',
    activityId: 'tay-ho-coffee-chat',
    ago: 3 * HOUR,
    read: true,
  },
  {
    kind: 'reply',
    actorId: 'linh',
    activityId: 'quang-an-doubles',
    quote: "I'll be there 10 minutes early",
    ago: 5 * HOUR,
    read: true,
  },
  {
    kind: 'invite',
    actorId: 'gia-han',
    activityId: 'board-game-night',
    ago: DAY + 2 * HOUR,
    read: false,
  },
  {
    kind: 'friendAccepted',
    actorId: 'thao-vy',
    ago: DAY + 6 * HOUR,
    read: true,
  },
  {
    kind: 'checkIn',
    actorId: 'tuan',
    activityId: 'my-dinh-badminton',
    ago: 2 * DAY,
    read: true,
  },
  { kind: 'follow', actorId: 'an', ago: 3 * DAY, read: true },
  {
    kind: 'storyReply',
    actorId: 'bao-ngoc',
    quote: 'This place looks amazing!',
    ago: 4 * DAY,
    read: true,
  },
  { kind: 'friendStory', actorId: 'minh', ago: 5 * DAY, read: true },
  {
    kind: 'leave',
    actorId: 'hai-long',
    activityId: 'old-quarter-pho-crawl',
    ago: 9 * DAY,
    read: true,
  },
  {
    kind: 'join',
    actorId: 'phuong-linh',
    activityId: 'hoan-kiem-sunrise',
    ago: 12 * DAY,
    read: true,
  },
];

/** What the user has been sent so far, newest first. */
export function seedNotifications(now = Date.now()): AppNotification[] {
  return SEEDS.map(({ ago, ...seed }, index) => ({
    ...seed,
    id: `notification-seed-${index}`,
    createdAt: now - ago,
  }));
}

// What a pull to refresh brings in, one at a time, until the server does.
const ARRIVALS: Omit<AppNotification, 'id' | 'createdAt' | 'read'>[] = [
  { kind: 'join', actorId: 'lan', activityId: 'sunset-lake-run' },
  { kind: 'follow', actorId: 'huy' },
  { kind: 'checkIn', actorId: 'minh', activityId: 'hoan-kiem-sunrise' },
];

/** The `index`th new notification a refresh finds, if there's one left. */
export function arrivingNotification(
  index: number,
  now = Date.now(),
): AppNotification | undefined {
  const arrival = ARRIVALS[index];
  return arrival
    ? {
        ...arrival,
        id: `notification-new-${index}`,
        createdAt: now,
        read: false,
      }
    : undefined;
}
