import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { useConfirm } from '@/components/ConfirmDialog';
import {
  CATEGORY_EMOJI,
  findTimeConflict,
  getActivity,
} from '@/services/mockData';
import { useAppSelector } from '@/store/hooks';
import { clockIn } from '@/utils/format';

/**
 * Runs `join` straight away, or after the user confirms when they've already
 * joined another activity at the same time.
 */
export function useJoinActivity() {
  const { t } = useTranslation();
  const confirm = useConfirm();
  const joinedIds = useAppSelector(state => state.activity.joinedIds);

  return useCallback(
    (activityId: string, join: () => void) => {
      const activity = getActivity(activityId);
      const conflict = activity && findTimeConflict(activity, joinedIds);
      if (!conflict) {
        join();
        return;
      }
      confirm({
        icon: 'calendar',
        title: t('join.conflictTitle'),
        message: t('join.conflictMessage'),
        highlight: {
          emoji: CATEGORY_EMOJI[conflict.category],
          title: conflict.title,
          subtitle: t('join.conflictTime', {
            start: clockIn(conflict.startsInMinutes),
            end: clockIn(conflict.startsInMinutes + conflict.durationMinutes),
          }),
        },
        confirmLabel: t('join.joinAnyway'),
        onConfirm: join,
      });
    },
    [confirm, joinedIds, t],
  );
}
