import { Image, Pressable, Text, View } from 'react-native';
import { ChatTeardropDotsIcon } from 'phosphor-react-native/src/icons/ChatTeardropDots';
import { useTranslation } from 'react-i18next';
import { ms } from 'react-native-size-matters';
import Icon from 'react-native-vector-icons/Ionicons';

import { CATEGORY_EMOJI, isFriend } from '@/services/mockData';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  cancelFriendRequest,
  sendFriendRequest,
  toggleActivityInvite,
  toggleFollow,
} from '@/store/slices/activitySlice';
import { useTheme } from '@/theme';
import type { User } from '@/types/activity';
import { formatDistance } from '@/utils/format';

import type { ActivityDetailStyles } from './styles';

/**
 * A free person who'd fit the activity. Friends get Message and Invite (Follow
 * when `canInvite` is off); everyone else gets Add friend and Follow.
 */
export default function NearbyCard({
  person,
  activityId,
  canInvite,
  onMessage,
  styles,
}: {
  person: User;
  activityId: string;
  canInvite: boolean;
  onMessage: (person: User) => void;
  styles: ActivityDetailStyles;
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const dispatch = useAppDispatch();
  const friend = isFriend(person.id);
  const following = useAppSelector(state =>
    state.activity.followedUserIds.includes(person.id),
  );
  const requested = useAppSelector(state =>
    state.activity.friendRequestIds.includes(person.id),
  );
  const invited = useAppSelector(
    state =>
      state.activity.activityInvites[activityId]?.includes(person.id) ?? false,
  );
  const freeNow = person.freeInMinutes === 0;

  return (
    <View style={styles.nearbyCard}>
      <View style={styles.nearbyTop}>
        <View style={styles.hostInfo}>
          <View>
            <Image source={person.avatar} style={styles.hostAvatar} />
            <View style={[styles.onlineDot, !freeNow && styles.awayDot]} />
          </View>
          <View style={styles.flexShrink}>
            <View style={styles.hostNameRow}>
              <Text style={styles.hostName} numberOfLines={1}>
                {`${person.name}, ${person.age}`}
              </Text>
              <View style={[styles.freeBadge, !freeNow && styles.soonBadge]}>
                <Text style={[styles.freeText, !freeNow && styles.soonText]}>
                  {freeNow
                    ? t('activityDetail.freeNow')
                    : t('activityDetail.freeIn', {
                        count: person.freeInMinutes ?? 0,
                      })}
                </Text>
              </View>
            </View>
            <Text style={[styles.mutedText, styles.subline]} numberOfLines={1}>
              {`${formatDistance(person.distanceKm)} • ${person.note}`}
            </Text>
          </View>
        </View>
        <View style={styles.nearbyStats}>
          <Text style={styles.trustValue}>
            {t('activityDetail.trust', { value: person.trust })}
          </Text>
          <Text style={styles.tileHint}>
            {t('activityDetail.activitiesCount', {
              count: person.activitiesCount,
            })}
          </Text>
        </View>
      </View>

      <View style={styles.interests}>
        {person.interests.map(interest => (
          <View key={interest} style={styles.interest}>
            <Text style={styles.interestText}>
              {`${CATEGORY_EMOJI[interest]} ${t(
                `imFree.activities.${interest}`,
              )}`}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.nearbyActions}>
        {friend ? (
          <Pressable
            onPress={() => onMessage(person)}
            style={({ pressed }) => [
              styles.nearbyButton,
              pressed && styles.pressed,
            ]}
            accessibilityRole="button"
          >
            <ChatTeardropDotsIcon
              size={ms(15)}
              weight="fill"
              color={colors.textMuted}
            />
            <Text style={styles.nearbyButtonText}>
              {t('activityDetail.message')}
            </Text>
          </Pressable>
        ) : (
          <Pressable
            onPress={() =>
              dispatch(
                requested
                  ? cancelFriendRequest(person.id)
                  : sendFriendRequest(person.id),
              )
            }
            style={({ pressed }) => [
              styles.nearbyButton,
              pressed && styles.pressed,
            ]}
            accessibilityRole="button"
            accessibilityState={{ selected: requested }}
            accessibilityHint={
              requested ? t('activityDetail.cancelFriendRequest') : undefined
            }
          >
            <Icon
              name={requested ? 'time-outline' : 'person-add-outline'}
              size={ms(14)}
              color={requested ? colors.textSecondary : colors.text}
            />
            <Text
              style={[
                styles.nearbyButtonText,
                requested && styles.nearbyButtonTextMuted,
              ]}
            >
              {requested
                ? t('activityDetail.friendRequested')
                : t('activityDetail.addFriend')}
            </Text>
          </Pressable>
        )}

        {friend && canInvite ? (
          <Pressable
            onPress={() =>
              dispatch(toggleActivityInvite({ activityId, userId: person.id }))
            }
            style={({ pressed }) => [
              styles.nearbyButton,
              invited ? styles.invitedButton : styles.inviteButton,
              pressed && styles.pressed,
            ]}
            accessibilityRole="button"
            accessibilityState={{ selected: invited }}
          >
            <Icon
              name={invited ? 'checkmark' : 'paper-plane-outline'}
              size={ms(14)}
              color={invited ? colors.success : colors.primaryDark}
            />
            <Text
              style={[
                styles.nearbyButtonText,
                invited ? styles.invitedText : styles.inviteText,
              ]}
            >
              {invited
                ? t('activityDetail.invited')
                : t('activityDetail.invite')}
            </Text>
          </Pressable>
        ) : (
          <Pressable
            onPress={() => dispatch(toggleFollow(person.id))}
            style={({ pressed }) => [
              styles.nearbyButton,
              following ? styles.invitedButton : styles.inviteButton,
              pressed && styles.pressed,
            ]}
            accessibilityRole="button"
            accessibilityState={{ selected: following }}
          >
            <Icon
              name={following ? 'checkmark' : 'add'}
              size={ms(15)}
              color={following ? colors.success : colors.primaryDark}
            />
            <Text
              style={[
                styles.nearbyButtonText,
                following ? styles.invitedText : styles.inviteText,
              ]}
            >
              {following
                ? t('activityDetail.following')
                : t('activityDetail.follow')}
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}
