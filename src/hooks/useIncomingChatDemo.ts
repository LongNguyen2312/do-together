import { useEffect } from 'react';

import { useAppDispatch } from '@/store/hooks';
import { receiveChatMessage } from '@/store/slices/chatSlice';

const DELAY_MS = 6000;
const delivered = new Set<string>();

/**
 * Stand-in for realtime: once per session, a member posts in the group chat
 * a few seconds after the activity is opened, so the unread badge can be seen.
 */
export function useIncomingChatDemo(activityId: string, enabled: boolean) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (!enabled || delivered.has(activityId)) {
      return;
    }
    const timer = setTimeout(() => {
      delivered.add(activityId);
      dispatch(receiveChatMessage(activityId));
    }, DELAY_MS);
    return () => clearTimeout(timer);
  }, [activityId, enabled, dispatch]);
}
