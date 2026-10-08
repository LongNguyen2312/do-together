import { useCallback } from 'react';
import { Alert } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { inviteUser } from '@/store/slices/activitySlice';
import type { User } from '@/types/activity';

/** Invite state shared by the Discover list and the free-people map. */
export function useInvite() {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const invitedIds = useAppSelector(state => state.activity.invitedUserIds);

  const invite = useCallback(
    (person: User) => {
      dispatch(inviteUser(person.id));
      Alert.alert(
        t('discover.inviteSentTitle'),
        t('discover.inviteSentMessage', { name: person.name }),
      );
    },
    [dispatch, t],
  );

  return { invitedIds, invite };
}
