import { useCallback, useMemo, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import Animated, { LinearTransition } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ms } from 'react-native-size-matters';
import Icon from 'react-native-vector-icons/Ionicons';

import PrimaryButton from '@/components/PrimaryButton';
import ScreenHeader, { HeaderButton } from '@/components/ScreenHeader';
import { closeSwipedRow } from '@/components/SwipeToDelete';
import { useCenteredChips } from '@/hooks/useCenteredChips';
import { useStories } from '@/hooks/useStories';
import { NOTIFICATION_GROUP } from '@/services/notifications';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  answerFriendRequest,
  deleteNotification,
  markAllNotificationsRead,
  markNotificationRead,
  refreshNotifications,
  selectNotifications,
  selectUnreadCount,
  setNotificationsPaused,
} from '@/store/slices/notificationSlice';
import { useTheme } from '@/theme';
import { ME } from '@/types/chat';
import type { RootStackParamList } from '@/types/navigation';
import type {
  AppNotification,
  FriendRequestAnswer,
  NotificationGroup,
} from '@/types/notification';

import NotificationRow, { daysAgo } from './NotificationRow';
import { createStyles, type NotificationsStyles } from './styles';

const FILTERS = [
  'all',
  'unread',
  'activity',
  'chat',
  'friends',
  'story',
] as const;
type Filter = (typeof FILTERS)[number];

const WEEK_DAYS = 7;
type Section = 'today' | 'yesterday' | 'thisWeek' | 'earlier';

const sectionOf = (at: number): Section => {
  const days = daysAgo(at);
  return days === 0
    ? 'today'
    : days === 1
    ? 'yesterday'
    : days < WEEK_DAYS
    ? 'thisWeek'
    : 'earlier';
};

/** A flat list with a heading before each day group, so rows can animate. */
type Row =
  | { type: 'section'; key: string; section: Section }
  | { type: 'item'; key: string; item: AppNotification };

type Props = NativeStackScreenProps<RootStackParamList, 'Notifications'>;

/**
 * Everything the user's been notified of, newest first and grouped by day:
 * filters by kind or unread, pull to check for new ones, tap to open what
 * it's about, swipe to delete. Opening it clears the bell's count.
 */
export default function NotificationsScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const dispatch = useAppDispatch();

  const notifications = useAppSelector(selectNotifications);
  const unread = useAppSelector(selectUnreadCount);
  const answers = useAppSelector(state => state.notification.answers);
  const paused = useAppSelector(state => state.notification.settings.paused);
  const joinedIds = useAppSelector(state => state.activity.joinedIds);
  const { mine: myStories, friends: friendStories } = useStories();
  const [filter, setFilter] = useState<Filter>('all');
  const chips = useCenteredChips<Filter>();
  const selectFilter = (id: Filter) => {
    setFilter(id);
    chips.center(id);
  };
  const [refreshing, setRefreshing] = useState(false);

  const rows = useMemo<Row[]>(() => {
    const shown = notifications.filter(item =>
      filter === 'all'
        ? true
        : filter === 'unread'
        ? !item.read
        : NOTIFICATION_GROUP[item.kind] === (filter as NotificationGroup),
    );
    const list: Row[] = [];
    let last: Section | null = null;
    shown.forEach(item => {
      const section = sectionOf(item.createdAt);
      if (section !== last) {
        list.push({ type: 'section', key: `section-${section}`, section });
        last = section;
      }
      list.push({ type: 'item', key: item.id, item });
    });
    return list;
  }, [notifications, filter]);

  const refresh = async () => {
    setRefreshing(true);
    await dispatch(refreshNotifications());
    setRefreshing(false);
  };

  /** Read, then on to what it's about. */
  const open = useCallback(
    (item: AppNotification) => {
      dispatch(markNotificationRead(item.id));
      const { kind, activityId, actorId } = item;
      if (activityId && (kind === 'mention' || kind === 'reply')) {
        // Their group chat, if the user's still in it.
        if (joinedIds.includes(activityId)) {
          navigation.navigate('GroupChat', { activityId });
          return;
        }
      }
      if (activityId) {
        navigation.navigate('ActivityDetail', { activityId });
        return;
      }
      if (
        (kind === 'storyReaction' || kind === 'storyReply') &&
        myStories.length
      ) {
        navigation.navigate('StoryViewer', { userIds: [ME], startIndex: 0 });
        return;
      }
      if (
        kind === 'friendStory' &&
        actorId &&
        friendStories.some(group => group.userId === actorId)
      ) {
        navigation.navigate('StoryViewer', {
          userIds: [actorId],
          startIndex: 0,
        });
      }
    },
    [dispatch, navigation, joinedIds, myStories.length, friendStories],
  );

  const answer = useCallback(
    (item: AppNotification, reply: FriendRequestAnswer) =>
      dispatch(answerFriendRequest({ id: item.id, answer: reply })),
    [dispatch],
  );
  const remove = useCallback(
    (item: AppNotification) => dispatch(deleteNotification(item.id)),
    [dispatch],
  );

  const header = (
    <>
      {paused ? (
        <View style={styles.paused}>
          <Icon
            name="notifications-off-outline"
            size={ms(22)}
            color={colors.textSecondary}
          />
          <View style={styles.pausedBody}>
            <Text style={styles.pausedTitle}>
              {t('notifications.paused.title')}
            </Text>
            <Text style={styles.pausedText}>
              {t('notifications.paused.message')}
            </Text>
          </View>
          <Pressable
            onPress={() => dispatch(setNotificationsPaused(false))}
            style={({ pressed }) => [
              styles.pausedButton,
              pressed && styles.pressed,
            ]}
            accessibilityRole="button"
          >
            <Text style={styles.pausedButtonText}>
              {t('notifications.paused.resume')}
            </Text>
          </Pressable>
        </View>
      ) : null}

      {/* Nothing at all: no filters to pick from. */}
      {notifications.length ? (
        <ScrollView
          {...chips.scrollProps}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filters}
        >
          {FILTERS.map(id => {
            const active = filter === id;
            return (
              <Pressable
                key={id}
                onPress={() => selectFilter(id)}
                onLayout={chips.chipLayout(id)}
                style={[styles.filter, active && styles.filterActive]}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
              >
                <Text
                  style={[styles.filterText, active && styles.filterTextActive]}
                >
                  {t(`notifications.filters.${id}`)}
                </Text>
                {id === 'unread' && unread > 0 && !active ? (
                  <Text style={styles.filterCount}>{unread}</Text>
                ) : null}
              </Pressable>
            );
          })}
        </ScrollView>
      ) : null}
    </>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader
        title={t('notifications.title')}
        titleAccessory={
          unread > 0 ? (
            <View
              style={styles.countBadge}
              accessibilityLabel={t('notifications.unreadCount', {
                count: unread,
              })}
            >
              <Text style={styles.countBadgeText}>{unread}</Text>
            </View>
          ) : null
        }
        onBack={navigation.goBack}
        actions={
          <>
            <HeaderButton
              icon="checkmark-done"
              label={t('notifications.markAllRead')}
              onPress={() => dispatch(markAllNotificationsRead())}
              disabled={unread === 0}
            />
            <HeaderButton
              icon="settings-outline"
              label={t('notifications.settings')}
              onPress={() => navigation.navigate('NotificationSettings')}
            />
          </>
        }
      />

      <Animated.FlatList
        data={rows}
        keyExtractor={row => row.key}
        // Rows below close the gap a deleted one leaves.
        itemLayoutAnimation={LinearTransition.duration(220)}
        renderItem={({ item: row }) =>
          row.type === 'section' ? (
            <Text style={styles.section} accessibilityRole="header">
              {t(`notifications.sections.${row.section}`)}
            </Text>
          ) : (
            <NotificationRow
              item={row.item}
              answer={answers[row.item.id]}
              styles={styles}
              onPress={open}
              onAnswer={answer}
              onDelete={remove}
            />
          )
        }
        ListHeaderComponent={header}
        ListEmptyComponent={
          notifications.length ? (
            <FilterEmpty filter={filter} styles={styles} />
          ) : (
            <Empty
              styles={styles}
              onExplore={() =>
                navigation.navigate('Main', { screen: 'Discover' })
              }
            />
          )
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        contentContainerStyle={styles.list}
        onScrollBeginDrag={closeSwipedRow}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

/** Nothing ever sent (or everything deleted). */
function Empty({
  styles,
  onExplore,
}: {
  styles: NotificationsStyles;
  onExplore: () => void;
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  return (
    <View style={styles.empty}>
      <View style={styles.emptyArt}>
        <View style={styles.emptyArtInner}>
          <Icon name="notifications" size={ms(44)} color={colors.primary} />
        </View>
      </View>
      <Text style={styles.emptyTitle}>{t('notifications.empty.title')}</Text>
      <Text style={styles.emptyText}>{t('notifications.empty.message')}</Text>
      <PrimaryButton
        title={t('notifications.empty.explore')}
        trailingIcon="arrow-forward"
        onPress={onExplore}
        style={styles.emptyButton}
      />
    </View>
  );
}

/** There are notifications, just none under this filter. */
function FilterEmpty({
  filter,
  styles,
}: {
  filter: Filter;
  styles: NotificationsStyles;
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const caughtUp = filter === 'unread';
  return (
    <View style={styles.emptySmall}>
      <View style={styles.emptySmallArt}>
        <Icon
          name={caughtUp ? 'checkmark-done' : 'file-tray-outline'}
          size={ms(26)}
          color={colors.textSecondary}
        />
      </View>
      <Text style={styles.emptyText}>
        {t(
          caughtUp
            ? 'notifications.emptyFilter.unread'
            : 'notifications.emptyFilter.other',
        )}
      </Text>
    </View>
  );
}
