import type { ImageSourcePropType } from 'react-native';

import { followerCount } from '@/services/mockData';
import { normalizeSearch } from '@/utils/format';
import type { Activity, ActivityCategory, User } from '@/types/activity';
import type { CustomActivity } from '@/types/broadcast';

/**
 * A photo for each kind of activity, for those without a cover of their own
 * (see assets/images/activities/CREDITS.md), until the server has theirs.
 */
const CATEGORY_PHOTOS: Partial<Record<ActivityCategory, ImageSourcePropType>> =
  {
    running: require('@/assets/images/activities/running.jpg'),
    coffee: require('@/assets/images/activities/coffee.jpg'),
    food: require('@/assets/images/activities/food.jpg'),
    football: require('@/assets/images/activities/football.jpg'),
    badminton: require('@/assets/images/activities/badminton.jpg'),
    gaming: require('@/assets/images/activities/gaming.jpg'),
    movie: require('@/assets/images/activities/movie.jpg'),
    walking: require('@/assets/images/activities/walking.jpg'),
    photography: require('@/assets/images/activities/photography.jpg'),
    language: require('@/assets/images/activities/language.jpg'),
  };

export const categoryPhoto = (category: ActivityCategory) =>
  CATEGORY_PHOTOS[category];

/** The photo posted with an activity, else its cover, else its kind's photo. */
export const activityPhoto = (activity: Activity) =>
  activity.photo ?? activity.cover ?? CATEGORY_PHOTOS[activity.category];

export interface ProfileStats {
  /** Activities taken part in and finished. */
  activities: number;
  friends: number;
  followers: number;
}

/** The numbers under a profile's name. */
export function profileStats(
  history: readonly Activity[],
  friendCount: number,
): ProfileStats {
  return {
    activities: history.length,
    friends: friendCount,
    followers: followerCount(),
  };
}

/** What the user goes to most, by how many times, most first. */
export function usualCategories(
  history: readonly Activity[],
  limit = 3,
): { category: ActivityCategory; count: number }[] {
  const counts = new Map<ActivityCategory, number>();
  history.forEach(activity =>
    counts.set(activity.category, (counts.get(activity.category) ?? 0) + 1),
  );
  return [...counts]
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

/** Their own interests that share a name (accents and case aside) with one of `mine`. */
const sameNamed = (
  theirs: readonly CustomActivity[] | undefined,
  mine: readonly CustomActivity[],
) => {
  const names = new Set(mine.map(item => normalizeSearch(item.name)));
  return (theirs ?? []).filter(item => names.has(normalizeSearch(item.name)));
};

export interface FriendInCommon {
  friend: User;
  /** What they both like, in the friend's order. */
  shared: ActivityCategory[];
  /** Interests of their own the friend has too, as the friend has them. */
  sharedCustom: CustomActivity[];
}

/**
 * Friends who like some of the same things, the app's kinds or ones they've
 * made with the same name, those with the most in common first; none for a
 * user who hasn't picked any.
 */
export function friendsInCommon(
  interests: readonly ActivityCategory[],
  friends: readonly User[],
  customInterests: readonly CustomActivity[] = [],
): FriendInCommon[] {
  const total = (item: FriendInCommon) =>
    item.shared.length + item.sharedCustom.length;
  return friends
    .map(friend => ({
      friend,
      shared: friend.interests.filter(category => interests.includes(category)),
      sharedCustom: sameNamed(friend.customInterests, customInterests),
    }))
    .filter(item => total(item) > 0)
    .sort((a, b) => total(b) - total(a));
}

export interface CommonGround {
  /** What they both like, in the other person's order. */
  interests: ActivityCategory[];
  /** Interests of their own with the same name, as the other person has them. */
  customInterests: CustomActivity[];
  /** Finished activities they were both in. */
  activities: number;
}

/** What someone has in common with the user: interests, activities done together. */
export function commonGround(
  person: Pick<User, 'id' | 'interests' | 'customInterests'>,
  myInterests: readonly ActivityCategory[],
  myHistory: readonly Activity[],
  myCustomInterests: readonly CustomActivity[] = [],
): CommonGround {
  return {
    interests: person.interests.filter(category =>
      myInterests.includes(category),
    ),
    customInterests: sameNamed(person.customInterests, myCustomInterests),
    activities: myHistory.filter(activity =>
      activity.members.some(member => member.userId === person.id),
    ).length,
  };
}

/** How long a typed-in interest can be, and how many there can be. */
export const CUSTOM_INTEREST_MAX_LENGTH = 30;
export const CUSTOM_INTERESTS_MAX = 10;

/**
 * The user's own interests with one more, its name tidied (spaces
 * squeezed); the same list when the name is empty, already there (accents
 * and case aside, or one of `taken`, e.g. the app's own kinds) or there are
 * enough already.
 */
export function addCustomInterest(
  list: readonly CustomActivity[],
  interest: CustomActivity,
  taken: readonly string[] = [],
): readonly CustomActivity[] {
  const name = interest.name
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, CUSTOM_INTEREST_MAX_LENGTH);
  const key = normalizeSearch(name);
  if (
    !key ||
    list.length >= CUSTOM_INTERESTS_MAX ||
    [...list.map(item => item.name), ...taken].some(
      item => normalizeSearch(item) === key,
    )
  ) {
    return list;
  }
  return [...list, { ...interest, name }];
}
