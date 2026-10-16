import { setMe, setMyActivities } from '@/services/mockData';
import { toActivity, type CreatedActivity } from '@/services/myActivities';
import type { store as appStore } from '@/store';
import { ME } from '@/types/chat';
import type { UserProfile } from '@/types/user';

/**
 * Keeps the mock data in step with the store: the user's own activities
 * listed with the rest, and the user themselves known as their host.
 */
export function syncMyActivities(store: typeof appStore) {
  let created: CreatedActivity[] | undefined;
  let user: UserProfile | null | undefined;
  const sync = () => {
    const state = store.getState();
    if (
      state.auth.user !== user ||
      state.activity.createdActivities !== created
    ) {
      user = state.auth.user;
      setMe({
        id: ME,
        name: user?.displayName ?? '',
        age: 0,
        avatar: { uri: user?.avatarUri ?? '' },
        distanceKm: 0,
        freeInMinutes: 0,
        note: '',
        trust: 100,
        // Hosted so far: the ones they've made.
        activitiesCount: state.activity.createdActivities?.length ?? 0,
        interests: user?.interests ?? [],
      });
    }
    if (state.activity.createdActivities !== created) {
      created = state.activity.createdActivities;
      const now = Date.now();
      setMyActivities((created ?? []).map(item => toActivity(item, now)));
    }
  };
  sync();
  return store.subscribe(sync);
}
