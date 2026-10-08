import {
  ACTIVITIES,
  activityStatus,
  COMMUNITIES,
  freeUsersFor,
  getActivity,
  isBrowsable,
} from '@/services/mockData';
import type {
  Activity,
  ActivityCategory,
  Community,
  User,
} from '@/types/activity';

export const PAGE_SIZE = 5;
/** Simulated network round-trip until the API exists. */
const LATENCY_MS = 700;

export interface Page<T> {
  items: T[];
  hasMore: boolean;
}

export interface PageRequest {
  category: 'all' | ActivityCategory;
  /** Starts at 0. */
  page: number;
}

async function paginate<T>(all: T[], page: number): Promise<Page<T>> {
  await new Promise<void>(resolve => setTimeout(resolve, LATENCY_MS));
  const start = page * PAGE_SIZE;
  return {
    items: all.slice(start, start + PAGE_SIZE),
    hasMore: start + PAGE_SIZE < all.length,
  };
}

/** Upcoming activities, soonest first. */
export function fetchUpcomingActivities({
  category,
  page,
}: PageRequest): Promise<Page<Activity>> {
  const upcoming = ACTIVITIES.filter(
    activity =>
      activityStatus(activity) === 'upcoming' &&
      isBrowsable(activity) &&
      (category === 'all' || activity.category === category),
  ).sort((a, b) => a.startsInMinutes - b.startsInMinutes);
  return paginate(upcoming, page);
}

/** Free people nearby who'd fit this activity, soonest free first. */
export function fetchFreeUsersFor(
  activityId: string,
  page: number,
): Promise<Page<User>> {
  const activity = getActivity(activityId);
  return paginate(activity ? freeUsersFor(activity) : [], page);
}

/** Communities, largest first. */
export function fetchCommunities({
  category,
  page,
}: PageRequest): Promise<Page<Community>> {
  const communities = COMMUNITIES.filter(
    community => category === 'all' || community.category === category,
  ).sort((a, b) => b.membersCount - a.membersCount);
  return paginate(communities, page);
}
