import type { LngLat } from '@maplibre/maplibre-react-native';

import {
  ACTIVITIES,
  activityStatus,
  CATEGORY_EMOJI,
  freeUsersWithin,
  isBrowsable,
} from '@/services/mockData';
import type { ActivityCategory } from '@/types/activity';

export type DiscoverCategory = 'all' | ActivityCategory;

export const DISCOVER_CATEGORIES: DiscoverCategory[] = [
  'all',
  ...(Object.keys(CATEGORY_EMOJI).filter(
    id => id !== 'other',
  ) as ActivityCategory[]),
];

export const HOT_PREVIEW_COUNT = 3;
export const COMMUNITY_PREVIEW_COUNT = 3;
export const MAX_AVATARS = 3;

/** Soonest first; ones already running live on Home's "happening now". */
export const UPCOMING_ACTIVITIES = ACTIVITIES.filter(
  activity => activityStatus(activity) === 'upcoming' && isBrowsable(activity),
).sort((a, b) => a.startsInMinutes - b.startsInMinutes);

export const NEARBY_RADIUS_KM = 2;

export const FREE_PEOPLE = freeUsersWithin(NEARBY_RADIUS_KM).filter(
  user => user.freeWish,
);

/** Free people who share where they are, so they can go on the map. */
export const MAPPABLE_FREE_PEOPLE = FREE_PEOPLE.filter(
  (user): user is typeof user & { coordinate: LngLat } =>
    !!user.locationPublic && !!user.coordinate,
);
