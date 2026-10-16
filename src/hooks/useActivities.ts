import { useSyncExternalStore } from 'react';

import { getActivitiesVersion, onActivitiesChange } from '@/services/mockData';

/**
 * Changes whenever the activities do (the user made one): something for
 * lists of them to recompute by.
 */
export function useActivitiesVersion() {
  return useSyncExternalStore(onActivitiesChange, getActivitiesVersion);
}
