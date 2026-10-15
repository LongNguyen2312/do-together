import { useMemo } from 'react';

import { FRIEND_IDS, USERS } from '@/services/mockData';
import { useAppSelector } from '@/store/hooks';
import type { User } from '@/types/activity';

/** Who the user is friends with now: the mock list, less anyone unfriended. */
export function useFriendIds(): ReadonlySet<string> {
  const unfriended = useAppSelector(state => state.activity.unfriendedIds);
  return useMemo(
    () => new Set(FRIEND_IDS.filter(id => !unfriended.includes(id))),
    [unfriended],
  );
}

/** The user's friends, in the mock list's order. */
export function useFriends(): User[] {
  const ids = useFriendIds();
  return useMemo(() => [...ids].map(id => USERS[id]).filter(Boolean), [ids]);
}
