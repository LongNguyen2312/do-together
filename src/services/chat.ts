import type { ImageRequireSource } from 'react-native';

import { activityStatus, getActivity, getUser } from '@/services/mockData';
import type { ChatMessage } from '@/types/chat';

/**
 * Placeholder group chats until the API exists. Each activity gets a short
 * scripted thread between its members. Live and upcoming ones end with two
 * unread messages so the unread badge has something to show; finished ones
 * wrap up after the activity and are mostly read.
 */

const MINUTE = 60 * 1000;
const APP_START = Date.now();

const PHOTOS: ImageRequireSource[] = [
  require('@/assets/images/discover/sunset-run.jpg'),
  require('@/assets/images/onboarding/find-people.jpg'),
];

const REPLIES = [
  'Sounds good 👍',
  'See you there!',
  'Haha nice 😄',
  'Got it, thanks!',
  "I'm in 🙌",
  'Leaving in a few minutes',
];

const INCOMING = [
  'Anyone up for a drink after? 🧋',
  "I'm already near the meeting point",
  'Running 5 min late, wait for me 🙏',
];

/** Closing lines for finished activities: [first member, host, second member]. */
const WRAP_UPS: [string, string, string][] = [
  ['Thanks everyone, that was so fun 🙌', 'Same time next week? 😄', "I'm in!"],
  [
    'Great session today 💪',
    'Thanks for coming! Photos are in the album',
    'Love them ❤️',
  ],
  [
    'Home safe, thanks all!',
    'Thanks for joining 🙏 See you next time',
    'Count me in next time',
  ],
  [
    'That was exactly what I needed today',
    "Glad you liked it! Let's do it again soon",
    '+1 for next week',
  ],
];

const hashOf = (value: string) =>
  [...value].reduce((hash, char) => (hash * 31 + char.charCodeAt(0)) % 9973, 7);

interface SeedThread {
  messages: ChatMessage[];
  /** Messages from others sent after this count as unread until the chat is opened. */
  readUntil: number;
}

const seeds = new Map<string, SeedThread>();

export const newMessageId = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

/** Members other than the signed-in user, host first. */
export function chatMemberIds(activityId: string): string[] {
  const activity = getActivity(activityId);
  if (!activity) {
    return [];
  }
  const memberIds = activity.members.map(member => member.userId);
  return [activity.hostId, ...memberIds.filter(id => id !== activity.hostId)];
}

const escapeRegExp = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Splits text around the given names; odd indexes are the names. */
export function splitMentions(text: string, names: readonly string[]) {
  if (names.length === 0) {
    return [text];
  }
  const pattern = [...names]
    .sort((a, b) => b.length - a.length)
    .map(escapeRegExp)
    .join('|');
  return text.split(new RegExp(`(${pattern})`));
}

export function seedThread(activityId: string): SeedThread {
  const cached = seeds.get(activityId);
  if (cached) {
    return cached;
  }
  const activity = getActivity(activityId);
  const [host, second = host, third = second] = chatMemberIds(activityId);
  if (!activity || !host) {
    const empty = { messages: [], readUntil: APP_START };
    seeds.set(activityId, empty);
    return empty;
  }

  const finished = activityStatus(activity) === 'completed';
  const hash = hashOf(activityId);
  // Minutes ago the activity starts and ends; plans are timed before the start.
  const startAgo = finished ? -activity.startsInMinutes : 0;
  const endAgo = startAgo - activity.durationMinutes;
  const at = (minutesAgo: number) =>
    APP_START - Math.max(minutesAgo, 1) * MINUTE;
  const before = (minutes: number) => at(startAgo + minutes);
  const cover = typeof activity.cover === 'number' ? activity.cover : PHOTOS[0];
  const photos = [cover, PHOTOS[1], PHOTOS[0], PHOTOS[1], PHOTOS[0]];
  const [thanks, closing, reply] = WRAP_UPS[hash % WRAP_UPS.length];
  const ending: Omit<ChatMessage, 'id'>[] = finished
    ? [
        { senderId: second, sentAt: at(endAgo - 12), text: thanks },
        {
          senderId: host,
          sentAt: at(endAgo - 20 - (hash % 30)),
          text: closing,
          reactions: [{ emoji: '❤️', count: 2 }],
        },
        {
          senderId: third,
          sentAt: at(endAgo - 25 - (hash % 40)),
          text: reply,
        },
      ]
    : [
        {
          senderId: second,
          sentAt: before(4 + (hash % 9)),
          text: `${getUser(third)?.name ?? ''} save me a spot!`,
          mentionIds: [third],
        },
        {
          senderId: third,
          sentAt: before(1 + (hash % 3)),
          text: 'On my way 🏃',
        },
      ];
  const script: Omit<ChatMessage, 'id'>[] = [
    {
      senderId: host,
      sentAt: before(96),
      text: `Hey everyone 👋 Welcome to "${activity.title}". We meet at ${activity.meetingPoint}.`,
    },
    {
      senderId: second,
      sentAt: before(62),
      text: 'Do we need to bring anything?',
    },
    {
      senderId: host,
      sentAt: before(61),
      text: 'Just water and good vibes 😄',
    },
    {
      senderId: third,
      sentAt: before(60),
      text: "Nice, I'll come a bit early",
    },
    {
      senderId: host,
      sentAt: before(31),
      photos,
      reactions: [
        { emoji: '🔥', count: 3 },
        { emoji: '❤️', count: 2 },
      ],
    },
    {
      senderId: host,
      sentAt: before(30),
      text: 'Here is the spot so you can find us easily',
    },
    ...ending,
  ];

  const messages = script.map((message, i) => ({
    ...message,
    id: `${activityId}-seed-${i}`,
  }));
  // Every third finished chat keeps its last reply unread.
  const unread = finished ? (hash % 3 === 0 ? 1 : 0) : 2;
  const seed = {
    messages,
    readUntil: messages[messages.length - 1 - unread].sentAt,
  };
  seeds.set(activityId, seed);
  return seed;
}

/** Every photo in a thread, oldest first. */
export const photosIn = (messages: readonly ChatMessage[]) =>
  messages.flatMap(message => message.photos ?? []);

const pick = <T>(items: readonly T[]) =>
  items[Math.floor(Math.random() * items.length)];

/** A member's message, for simulated replies and incoming chatter. */
export function memberMessage(
  activityId: string,
  kind: 'reply' | 'incoming',
  replyToId?: string,
): ChatMessage | null {
  const members = chatMemberIds(activityId);
  if (members.length === 0) {
    return null;
  }
  return {
    id: newMessageId(),
    senderId: pick(members),
    sentAt: Date.now(),
    text: pick(kind === 'reply' ? REPLIES : INCOMING),
    replyToId,
  };
}
