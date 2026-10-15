import { memo } from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import type { TFunction } from 'i18next';
import { Trans, useTranslation } from 'react-i18next';
import Animated, { FadeOut } from 'react-native-reanimated';
import { ms } from 'react-native-size-matters';
import Icon from 'react-native-vector-icons/Ionicons';

import SwipeToDelete from '@/components/SwipeToDelete';
import { CATEGORY_EMOJI, getActivity, getUser } from '@/services/mockData';
import { useTheme, type AppColors } from '@/theme';
import type {
  AppNotification,
  FriendRequestAnswer,
  NotificationKind,
} from '@/types/notification';

import type { NotificationsStyles } from './styles';

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const WEEK_DAYS = 7;

/** The small badge on the picture: what happened, at a glance. */
function kindBadge(
  kind: NotificationKind,
  colors: AppColors,
): { icon: string; color: string } {
  switch (kind) {
    case 'join':
      return { icon: 'person-add', color: colors.success };
    case 'leave':
      return { icon: 'log-out', color: colors.textMuted };
    case 'starting':
      return { icon: 'alarm', color: colors.primary };
    case 'checkIn':
      return { icon: 'location', color: colors.success };
    case 'invite':
      return { icon: 'paper-plane', color: colors.primary };
    case 'mention':
      return { icon: 'at', color: colors.primaryDark };
    case 'reply':
      return { icon: 'arrow-undo', color: colors.primaryDark };
    case 'friendRequest':
      return { icon: 'people', color: colors.primary };
    case 'friendAccepted':
      return { icon: 'checkmark', color: colors.success };
    case 'follow':
      return { icon: 'sparkles', color: colors.primary };
    case 'storyReaction':
    case 'storyReply':
      return { icon: 'chatbubble', color: colors.primaryDark };
    case 'friendStory':
      return { icon: 'images', color: colors.primary };
  }
}

/** Calendar days between `at` and today: 0 today, 1 yesterday… */
export function daysAgo(at: number, now = new Date()) {
  const startOf = (date: Date) =>
    new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  return Math.round((startOf(now) - startOf(new Date(at))) / (24 * HOUR));
}

/** "Just now", "12 min ago", "3 h ago", "Yesterday", "4 days ago", "05/10". */
export function notificationTime(at: number, t: TFunction, now = new Date()) {
  const elapsed = now.getTime() - at;
  const days = daysAgo(at, now);
  if (elapsed < MINUTE) {
    return t('notifications.time.now');
  }
  if (days === 0) {
    return elapsed < HOUR
      ? t('notifications.time.minutes', { count: Math.floor(elapsed / MINUTE) })
      : t('notifications.time.hours', { count: Math.floor(elapsed / HOUR) });
  }
  if (days === 1) {
    return t('notifications.time.yesterday');
  }
  if (days < WEEK_DAYS) {
    return t('notifications.time.days', { count: days });
  }
  const date = new Date(at);
  return `${String(date.getDate()).padStart(2, '0')}/${String(
    date.getMonth() + 1,
  ).padStart(2, '0')}`;
}

interface Props {
  item: AppNotification;
  /** Set once a friend request's been answered here. */
  answer?: FriendRequestAnswer;
  styles: NotificationsStyles;
  onPress: (item: AppNotification) => void;
  onAnswer: (item: AppNotification, answer: FriendRequestAnswer) => void;
  onDelete: (item: AppNotification) => void;
}

/**
 * One notification: who (or which activity) with a badge for what happened,
 * the sentence, any quoted message, and when. Unread ones are tinted and
 * dotted; friend requests can be answered right here. Swipe left to delete.
 */
function NotificationRow({
  item,
  answer,
  styles,
  onPress,
  onAnswer,
  onDelete,
}: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const actor = item.actorId ? getUser(item.actorId) : undefined;
  const activity = item.activityId ? getActivity(item.activityId) : undefined;
  const badge = kindBadge(item.kind, colors);
  const textKey =
    item.kind === 'friendRequest' && answer
      ? answer === 'accepted'
        ? 'friendRequestAccepted'
        : 'friendRequestDeclined'
      : item.kind;

  return (
    <Animated.View exiting={FadeOut.duration(180)}>
      <SwipeToDelete
        label={t('notifications.delete')}
        onDelete={() => onDelete(item)}
      >
        <Pressable
          onPress={() => onPress(item)}
          style={({ pressed }) => [
            styles.row,
            !item.read && styles.rowUnread,
            pressed && styles.rowPressed,
          ]}
          accessibilityRole="button"
          accessibilityActions={[
            { name: 'delete', label: t('notifications.delete') },
          ]}
          onAccessibilityAction={event =>
            event.nativeEvent.actionName === 'delete' && onDelete(item)
          }
        >
          <View>
            {actor ? (
              <Image source={actor.avatar} style={styles.avatar} />
            ) : activity?.photo ?? activity?.cover ? (
              <Image
                source={activity.photo ?? activity.cover}
                style={styles.avatar}
              />
            ) : (
              <View style={styles.art}>
                <Text style={styles.artEmoji}>
                  {activity ? CATEGORY_EMOJI[activity.category] : '🔔'}
                </Text>
              </View>
            )}
            {item.kind === 'storyReaction' && item.emoji ? (
              <View
                style={[styles.kindBadge, { backgroundColor: colors.card }]}
              >
                <Text style={styles.kindBadgeEmoji}>{item.emoji}</Text>
              </View>
            ) : (
              <View
                style={[styles.kindBadge, { backgroundColor: badge.color }]}
              >
                <Icon name={badge.icon} size={ms(11)} color={colors.white} />
              </View>
            )}
          </View>

          <View style={styles.body}>
            <Text style={styles.text} numberOfLines={3}>
              <Trans
                i18nKey={`notifications.kinds.${textKey}`}
                values={{
                  name: actor?.name ?? '',
                  activity: activity?.title ?? '',
                  minutes: item.minutes,
                  emoji: item.emoji,
                }}
                components={{ b: <Text style={styles.bold} /> }}
              />
            </Text>
            {item.quote ? (
              <Text style={styles.quote} numberOfLines={2}>
                {item.quote}
              </Text>
            ) : null}
            <Text style={[styles.time, !item.read && styles.timeUnread]}>
              {notificationTime(item.createdAt, t)}
            </Text>
            {item.kind === 'friendRequest' && !answer ? (
              <View style={styles.answers}>
                <Pressable
                  onPress={() => onAnswer(item, 'accepted')}
                  style={({ pressed }) => [
                    styles.answer,
                    styles.answerPrimary,
                    pressed && styles.pressed,
                  ]}
                  accessibilityRole="button"
                >
                  <Text style={[styles.answerText, styles.answerTextPrimary]}>
                    {t('notifications.accept')}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => onAnswer(item, 'declined')}
                  style={({ pressed }) => [
                    styles.answer,
                    pressed && styles.pressed,
                  ]}
                  accessibilityRole="button"
                >
                  <Text style={styles.answerText}>
                    {t('notifications.decline')}
                  </Text>
                </Pressable>
              </View>
            ) : null}
          </View>

          {item.read ? null : <View style={styles.unreadDot} />}
        </Pressable>
      </SwipeToDelete>
    </Animated.View>
  );
}

export default memo(NotificationRow);
