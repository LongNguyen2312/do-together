import { useMemo, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  type ImageStyle,
  type StyleProp,
  Pressable,
  ScrollView,
  type LayoutRectangle,
  type ScrollViewInstance,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';
import { ms } from 'react-native-size-matters';
import Icon from 'react-native-vector-icons/Ionicons';

import AppHeader from '@/components/AppHeader';
import { useTabBarInset } from '@/components/LiquidTabBar';
import PulseDot from '@/components/PulseDot';
import { StoryThumb } from '@/components/StoryMedia';
import { useNewStory, useStories } from '@/hooks/useStories';
import { useMessagePreview } from '@/screens/GroupChat/MessageRow';
import { chatMemberIds } from '@/services/chat';
import { firstUnseenIndex } from '@/services/stories';
import { chatBackground } from '@/screens/GroupChat/styles';
import {
  activityStatus,
  CATEGORY_EMOJI,
  getActivity,
  getUser,
} from '@/services/mockData';
import { useAppSelector } from '@/store/hooks';
import { threadIn, unreadCountIn } from '@/store/slices/chatSlice';
import { useTheme } from '@/theme';
import type {
  Activity,
  ActivityCategory,
  ActivityStatus,
} from '@/types/activity';
import { ME, type ChatMessage } from '@/types/chat';
import type { MainTabParamList, RootStackParamList } from '@/types/navigation';
import { clockIn, initialsOf, normalizeSearch } from '@/utils/format';

import { createStyles, type ChatsStyles } from './styles';

const BASE_FILTERS = ['all', 'unread', 'group'] as const;
type Filter = (typeof BASE_FILTERS)[number] | ActivityCategory;
const CATEGORY_ORDER = Object.keys(CATEGORY_EMOJI) as ActivityCategory[];
/** More than a host and one guest. */
const GROUP_MIN_MEMBERS = 3;

const MINUTE = 60 * 1000;

interface ChatSummary {
  activity: Activity;
  status: ActivityStatus;
  last?: ChatMessage;
  unread: number;
  muted: boolean;
}

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Chats'>,
  NativeStackScreenProps<RootStackParamList>
>;

/** Group chats of every activity the user joined, latest first. */
export default function ChatsScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const tabBarInset = useTabBarInset();

  const joinedIds = useAppSelector(state => state.activity.joinedIds);
  const chat = useAppSelector(state => state.chat);
  const myName = useAppSelector(state => state.auth.user?.displayName);
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');

  const filterList = useRef<ScrollViewInstance>(null);
  const filterFrames = useRef<Partial<Record<Filter, LayoutRectangle>>>({});
  const filterViewport = useRef(0);
  const filterContent = useRef(0);

  // Centre the picked chip so its neighbours stay reachable on either side.
  const selectFilter = (id: Filter) => {
    setFilter(id);
    const frame = filterFrames.current[id];
    if (!frame) return;
    const maxX = Math.max(0, filterContent.current - filterViewport.current);
    const x = frame.x + frame.width / 2 - filterViewport.current / 2;
    filterList.current?.scrollTo({
      x: Math.min(maxX, Math.max(0, x)),
      animated: true,
    });
  };

  const chats = useMemo<ChatSummary[]>(
    () =>
      joinedIds
        .map(getActivity)
        .filter((activity): activity is Activity => !!activity)
        .map(activity => {
          const messages = threadIn(chat, activity.id);
          return {
            activity,
            status: activityStatus(activity),
            last: messages[messages.length - 1],
            unread: unreadCountIn(chat, activity.id),
            muted: chat.mutedIds.includes(activity.id),
          };
        })
        .sort((a, b) => (b.last?.sentAt ?? 0) - (a.last?.sentAt ?? 0)),
    [joinedIds, chat],
  );

  // Only categories the user actually has chats in.
  const filters = useMemo<Filter[]>(() => {
    const present = new Set(chats.map(item => item.activity.category));
    return [
      ...BASE_FILTERS,
      ...CATEGORY_ORDER.filter(category => present.has(category)),
    ];
  }, [chats]);
  // Falls back when leaving the last chat of the picked category.
  const current = filters.includes(filter) ? filter : 'all';

  const matchesFilter = ({ activity, unread }: ChatSummary) => {
    switch (current) {
      case 'all':
        return true;
      case 'unread':
        return unread > 0;
      case 'group':
        return activity.members.length >= GROUP_MIN_MEMBERS;
      default:
        return activity.category === current;
    }
  };

  // The group is named after its activity; friends match by any member's name.
  const searchIndex = useMemo(
    () =>
      new Map(
        chats.map(({ activity }) => [
          activity.id,
          [
            activity.title,
            activity.markerTitle,
            ...chatMemberIds(activity.id)
              .filter(id => id !== ME)
              .map(id => getUser(id)?.name ?? ''),
          ].map(normalizeSearch),
        ]),
      ),
    [chats],
  );
  const search = normalizeSearch(query);
  const visible = chats.filter(
    item =>
      matchesFilter(item) &&
      (!search ||
        searchIndex.get(item.activity.id)?.some(text => text.includes(search))),
  );
  const {
    mine: myStories,
    friends: friendStories,
    seenIds: seenStoryIds,
  } = useStories();
  const addStory = useNewStory();
  // One run through everyone's stories, the user's own first, so watching
  // goes on from one person to the next.
  const storyUserIds = [
    ...(myStories.length ? [ME] : []),
    ...friendStories.map(group => group.userId),
  ];
  const openStories = (userId: string) =>
    navigation.navigate('StoryViewer', {
      userIds: storyUserIds,
      startIndex: storyUserIds.indexOf(userId),
    });

  const openChat = (activityId: string) =>
    navigation.navigate('GroupChat', { activityId });

  const showComingSoon = () =>
    Alert.alert(t('auth.comingSoonTitle'), t('auth.comingSoonMessage'));

  const header = (
    <>
      <View style={styles.search}>
        <Icon
          name="search-outline"
          size={ms(17)}
          color={colors.textSecondary}
        />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={t('chats.searchPlaceholder')}
          placeholderTextColor={colors.textSecondary}
          cursorColor={colors.primary}
          selectionColor={colors.primary}
          style={styles.searchInput}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
      </View>

      <View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.storiesContent}
        >
          <Pressable
            onPress={addStory}
            style={styles.story}
            accessibilityRole="button"
            accessibilityLabel={t('stories.addTitle')}
          >
            <View style={[styles.storyTile, styles.storyAdd]}>
              <View style={styles.storyAddCircle}>
                <Icon name="add" size={ms(16)} color={colors.white} />
              </View>
            </View>
            <Text style={styles.storyLabel} numberOfLines={1}>
              {t('stories.add')}
            </Text>
          </Pressable>
          {/* Its own item once there's a story; new ones join it. */}
          {myStories.length ? (
            <Pressable
              onPress={() => openStories(ME)}
              style={styles.story}
              accessibilityRole="button"
              accessibilityLabel={t('stories.yourStory')}
            >
              <View style={styles.storyTile}>
                <StoryThumb
                  media={myStories[myStories.length - 1].media}
                  filter={myStories[myStories.length - 1].filter}
                  style={styles.storyImage}
                />
                {/* No profile photo yet: their initials, like a friend's face. */}
                <View style={[styles.storyAvatar, styles.storyAvatarMine]}>
                  <Text style={styles.storyAvatarInitials}>
                    {initialsOf(myName || t('chat.you'))}
                  </Text>
                </View>
              </View>
              <Text style={styles.storyLabel} numberOfLines={1}>
                {t('chat.you')}
              </Text>
            </Pressable>
          ) : null}
          {friendStories.length ? <View style={styles.storyDivider} /> : null}
          {friendStories.map(group => {
            const friend = getUser(group.userId);
            // The story the viewer opens on: the first unseen, else the first.
            const cover =
              group.stories[firstUnseenIndex(group.stories, seenStoryIds)];
            return (
              <Pressable
                key={group.userId}
                onPress={() => openStories(group.userId)}
                style={styles.story}
                accessibilityRole="button"
                accessibilityLabel={friend?.name}
              >
                <View style={styles.storyTile}>
                  <StoryThumb
                    media={cover.media}
                    filter={cover.filter}
                    style={styles.storyImage}
                  />
                  {/* Ringed in the brand colour while there's something new. */}
                  <Image
                    source={friend?.avatar}
                    style={[
                      styles.storyAvatar,
                      group.unseen && styles.storyAvatarUnseen,
                    ]}
                  />
                </View>
                <Text style={styles.storyLabel} numberOfLines={1}>
                  {friend?.name}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        ref={filterList}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filters}
        onLayout={e => {
          filterViewport.current = e.nativeEvent.layout.width;
        }}
        onContentSizeChange={width => {
          filterContent.current = width;
        }}
      >
        {filters.map(id => {
          const active = current === id;
          const category = (BASE_FILTERS as readonly string[]).includes(id)
            ? undefined
            : (id as ActivityCategory);
          return (
            <Pressable
              key={id}
              onPress={() => selectFilter(id)}
              onLayout={e => {
                filterFrames.current[id] = e.nativeEvent.layout;
              }}
              style={[styles.filter, active && styles.filterActive]}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
            >
              {category ? (
                <Text style={styles.filterEmoji}>
                  {CATEGORY_EMOJI[category]}
                </Text>
              ) : null}
              <Text
                style={[styles.filterText, active && styles.filterTextActive]}
              >
                {category
                  ? t(`imFree.activities.${category}`)
                  : t(`chats.filters.${id}`)}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </>
  );

  return (
    <View
      style={[styles.root, { backgroundImage: chatBackground(colors, isDark) }]}
    >
      <AppHeader
        title={t('tabs.chats')}
        backgroundColor="transparent"
        onNotificationsPress={showComingSoon}
      />

      <FlatList
        data={visible}
        keyExtractor={item => item.activity.id}
        renderItem={({ item }) => (
          <ChatRow
            item={item}
            styles={styles}
            onPress={() => openChat(item.activity.id)}
          />
        )}
        ListHeaderComponent={header}
        ListEmptyComponent={
          <Text style={styles.empty}>
            {t(chats.length ? 'chats.noMatch' : 'chats.empty')}
          </Text>
        }
        contentContainerStyle={{ paddingBottom: tabBarInset + ms(16) }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

/** The activity's cover photo, or its category emoji. */
function ActivityArt({
  activity,
  styles,
  imageStyle,
}: {
  activity: Activity;
  styles: ChatsStyles;
  imageStyle: StyleProp<ImageStyle>;
}) {
  return activity.cover ? (
    <Image source={activity.cover} style={imageStyle} />
  ) : (
    <View style={[imageStyle, styles.artEmoji]}>
      <Text style={styles.artEmojiText}>
        {CATEGORY_EMOJI[activity.category]}
      </Text>
    </View>
  );
}

function ChatRow({
  item,
  styles,
  onPress,
}: {
  item: ChatSummary;
  styles: ChatsStyles;
  onPress: () => void;
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const preview = useMessagePreview();
  const { activity, last, unread, muted, status } = item;
  const mine = last?.senderId === ME;
  const sender = last && !mine ? getUser(last.senderId) : undefined;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
      accessibilityRole="button"
    >
      <View>
        <ActivityArt
          activity={activity}
          styles={styles}
          imageStyle={styles.avatar}
        />
        {status === 'ongoing' ? (
          <View style={styles.liveDot}>
            <PulseDot color={colors.primary} size={ms(8)} />
          </View>
        ) : null}
      </View>
      <View style={styles.rowBody}>
        <View style={styles.rowTop}>
          <Text
            style={[styles.rowTitle, unread > 0 && styles.rowTitleUnread]}
            numberOfLines={1}
          >
            {activity.title}
          </Text>
          {last ? (
            <Text style={[styles.rowTime, unread > 0 && styles.rowTimeUnread]}>
              {sinceLabel(last.sentAt, t)}
            </Text>
          ) : null}
        </View>
        <View style={styles.rowBottom}>
          {mine ? (
            <Icon
              name="checkmark-done"
              size={ms(15)}
              color={colors.textMuted}
            />
          ) : null}
          <Text
            style={[styles.rowPreview, unread > 0 && styles.rowPreviewUnread]}
            numberOfLines={1}
          >
            {last
              ? sender
                ? `${sender.name.split(' ')[0]}: ${preview(last)}`
                : preview(last)
              : t('chats.noMessages')}
          </Text>
          {muted ? (
            <Icon
              name="notifications-off"
              size={ms(14)}
              color={colors.textMuted}
            />
          ) : null}
          {unread > 0 ? (
            <View style={[styles.unread, muted && styles.unreadMuted]}>
              <Text style={styles.unreadText}>{unread}</Text>
            </View>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

/** "Now", "12 min", "16:05" today, "05/10" before that. */
function sinceLabel(at: number, t: TFunction) {
  const now = new Date();
  const minutes = Math.floor((now.getTime() - at) / MINUTE);
  if (minutes < 1) {
    return t('chats.now');
  }
  if (minutes < 60) {
    return t('chats.minutesAgo', { count: minutes });
  }
  const date = new Date(at);
  if (date.toDateString() === now.toDateString()) {
    return clockIn((at - now.getTime()) / MINUTE, now);
  }
  return `${String(date.getDate()).padStart(2, '0')}/${String(
    date.getMonth() + 1,
  ).padStart(2, '0')}`;
}
