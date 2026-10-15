import { useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { ChatCircleDotsIcon } from 'phosphor-react-native/src/icons/ChatCircleDots';
import { CheckCircleIcon } from 'phosphor-react-native/src/icons/CheckCircle';
import { PaperPlaneTiltIcon } from 'phosphor-react-native/src/icons/PaperPlaneTilt';
import { MinusCircleIcon } from 'phosphor-react-native/src/icons/MinusCircle';
import { PlusCircleIcon } from 'phosphor-react-native/src/icons/PlusCircle';
import { UserCircleMinusIcon } from 'phosphor-react-native/src/icons/UserCircleMinus';
import { UserCircleCheckIcon } from 'phosphor-react-native/src/icons/UserCircleCheck';
import { UserCirclePlusIcon } from 'phosphor-react-native/src/icons/UserCirclePlus';
import { useTranslation } from 'react-i18next';
import { ms } from 'react-native-size-matters';

import { useConfirm } from '@/components/ConfirmDialog';
import { useFriendIds } from '@/hooks/useFriends';
import { getUser } from '@/services/mockData';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  cancelFriendRequest,
  sendFriendRequest,
  toggleFollow,
  unfriend,
} from '@/store/slices/activitySlice';
import { useTheme } from '@/theme';

import OptionSheet from './OptionSheet';
import type { ProfileStyles } from './styles';

/** One size and the filled weight for all, so they look alike side by side. */
export const RELATION_ICON = ms(17);
const ICON = RELATION_ICON;

/**
 * Under someone else's name: with a friend, that they're friends (a tap
 * offers unfriending, once confirmed, and following or unfollowing) and a
 * way to message them; otherwise
 * adding them (or the request sent, a tap takes it back) and following them
 * (or unfollowing).
 */
export default function RelationActions({
  userId,
  styles,
}: {
  userId: string;
  styles: ProfileStyles;
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const dispatch = useAppDispatch();
  const confirm = useConfirm();
  const friend = useFriendIds().has(userId);
  const [friendSheet, setFriendSheet] = useState(false);
  const requested = useAppSelector(state =>
    state.activity.friendRequestIds.includes(userId),
  );
  const following = useAppSelector(state =>
    state.activity.followedUserIds.includes(userId),
  );

  // No direct messages yet.
  const message = () =>
    Alert.alert(t('auth.comingSoonTitle'), t('auth.comingSoonMessage'));

  const askUnfriend = () =>
    confirm({
      icon: 'person-remove-outline',
      title: t('profile.relation.unfriendTitle'),
      message: t('profile.relation.unfriendMessage', {
        name: getUser(userId)?.name ?? '',
      }),
      confirmLabel: t('profile.relation.unfriend'),
      onConfirm: () => dispatch(unfriend(userId)),
    });

  if (friend) {
    return (
      <View style={styles.actions}>
        <Pressable
          onPress={() => setFriendSheet(true)}
          style={({ pressed }) => [styles.action, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityHint={t('profile.relation.friendOptions')}
        >
          <UserCircleCheckIcon size={ICON} color={colors.text} weight="fill" />
          <Text style={styles.actionText} numberOfLines={1}>
            {t('profile.relation.friends')}
          </Text>
        </Pressable>
        <Pressable
          onPress={message}
          style={({ pressed }) => [
            styles.action,
            styles.actionPrimary,
            styles.actionEven,
            pressed && styles.pressed,
          ]}
          accessibilityRole="button"
        >
          <ChatCircleDotsIcon size={ICON} color={colors.white} weight="fill" />
          <Text style={[styles.actionText, styles.actionTextPrimary]}>
            {t('activityDetail.message')}
          </Text>
        </Pressable>
        <OptionSheet
          visible={friendSheet}
          options={[
            {
              id: 'follow',
              icon: following ? (
                <MinusCircleIcon size={ms(22)} color={colors.text} />
              ) : (
                <PlusCircleIcon size={ms(22)} color={colors.text} />
              ),
              label: following
                ? t('profile.relation.unfollow')
                : t('activityDetail.follow'),
            },
            {
              id: 'unfriend',
              icon: <UserCircleMinusIcon size={ms(22)} color={colors.danger} />,
              label: t('profile.relation.unfriend'),
              danger: true,
            },
          ]}
          styles={styles}
          onClose={() => setFriendSheet(false)}
          onPick={id =>
            id === 'unfriend' ? askUnfriend() : dispatch(toggleFollow(userId))
          }
        />
      </View>
    );
  }

  return (
    <View style={styles.actions}>
      <Pressable
        onPress={() =>
          dispatch(
            requested ? cancelFriendRequest(userId) : sendFriendRequest(userId),
          )
        }
        style={({ pressed }) => [
          styles.action,
          !requested && styles.actionPrimary,
          styles.actionEven,
          pressed && styles.pressed,
        ]}
        accessibilityRole="button"
        accessibilityState={{ selected: requested }}
        accessibilityHint={
          requested ? t('activityDetail.cancelFriendRequest') : undefined
        }
      >
        {requested ? (
          <PaperPlaneTiltIcon size={ICON} color={colors.text} weight="fill" />
        ) : (
          <UserCirclePlusIcon size={ICON} color={colors.white} weight="fill" />
        )}
        <Text
          style={[styles.actionText, !requested && styles.actionTextPrimary]}
          numberOfLines={1}
        >
          {requested
            ? t('activityDetail.friendRequested')
            : t('activityDetail.addFriend')}
        </Text>
      </Pressable>
      <Pressable
        onPress={() => dispatch(toggleFollow(userId))}
        style={({ pressed }) => [styles.action, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityState={{ selected: following }}
      >
        {following ? (
          <CheckCircleIcon size={ICON} color={colors.text} weight="fill" />
        ) : (
          <PlusCircleIcon size={ICON} color={colors.text} weight="fill" />
        )}
        <Text style={styles.actionText} numberOfLines={1}>
          {following
            ? t('activityDetail.following')
            : t('activityDetail.follow')}
        </Text>
      </Pressable>
    </View>
  );
}
