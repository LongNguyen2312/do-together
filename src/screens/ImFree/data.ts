import { CATEGORY_EMOJI } from '@/services/mockData';
import type {
  BroadcastActivity,
  BroadcastActivityId,
  BroadcastDuration,
  BroadcastTime,
  BroadcastWhen,
} from '@/types/broadcast';

export const ACTIVITIES: BroadcastActivity[] = (
  Object.keys(CATEGORY_EMOJI) as BroadcastActivityId[]
).map(id => ({ id, emoji: CATEGORY_EMOJI[id] }));

export const WHEN_OPTIONS: BroadcastWhen[] = ['now', 'in30', 'tonight'];

export const MINUTE_STEP = 5;

export const formatClock = (hour: number, minute: number) =>
  `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;

/** One hour from now, rounded up to the next MINUTE_STEP. */
export const defaultPickTime = (now = new Date()): BroadcastTime => {
  const target = new Date(now.getTime() + 60 * 60 * 1000);
  const rounded = Math.ceil(target.getMinutes() / MINUTE_STEP) * MINUTE_STEP;
  target.setMinutes(rounded, 0, 0);
  const tomorrow = target.getDate() !== now.getDate();
  return {
    day: tomorrow ? 'tomorrow' : 'today',
    hour: target.getHours(),
    minute: target.getMinutes(),
  };
};

export const isPastTime = (time: BroadcastTime, now = new Date()) =>
  time.day === 'today' &&
  time.hour * 60 + time.minute <= now.getHours() * 60 + now.getMinutes();

export const DURATIONS: BroadcastDuration[] = ['30m', '1h', '2h', '3h'];

export const RADIUS_KM = { min: 0.5, max: 10, step: 0.5, initial: 3 };

export const NOTE_MAX_LENGTH = 200;

export const CUSTOM_ACTIVITY_MAX_LENGTH = 30;

/** Two full rows in the custom activity sheet. */
export const CUSTOM_EMOJIS_PER_ROW = 7;

export const DEFAULT_CUSTOM_EMOJIS = [
  '🎱',
  '🏸',
  '🎳',
  '🏓',
  '🎾',
  '🏀',
  '🏐',
  '♟️',
  '🎲',
  '🎤',
  '🎸',
  '🧘',
  '🏊',
  '🧗',
];

export const NEARBY_PREVIEW_COUNT = 3;
