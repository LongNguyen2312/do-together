import {
  useCallback,
  useMemo,
  useState,
  type ComponentType,
  type ReactNode,
} from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import {
  isLiquidGlassSupported,
  LiquidGlassView,
} from '@callstack/liquid-glass';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { GearSixIcon } from 'phosphor-react-native/src/icons/GearSix';
import { PencilSimpleLineIcon } from 'phosphor-react-native/src/icons/PencilSimpleLine';
import { BookmarkSimpleIcon } from 'phosphor-react-native/src/icons/BookmarkSimple';
import { CircleIcon } from 'phosphor-react-native/src/icons/Circle';
import { CircleDashedIcon } from 'phosphor-react-native/src/icons/CircleDashed';
import { PulseIcon } from 'phosphor-react-native/src/icons/Pulse';
import { PlusIcon } from 'phosphor-react-native/src/icons/Plus';
import { HouseIcon } from 'phosphor-react-native/src/icons/House';
import { MapPinIcon } from 'phosphor-react-native/src/icons/MapPin';
import { PlusCircleIcon } from 'phosphor-react-native/src/icons/PlusCircle';
import { PencilSimpleIcon } from 'phosphor-react-native/src/icons/PencilSimple';
import { SparkleIcon } from 'phosphor-react-native/src/icons/Sparkle';
import { Trans, useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ms } from 'react-native-size-matters';
import Animated, {
  Easing,
  FadeInLeft,
  FadeInRight,
  interpolate,
  useAnimatedReaction,
  scrollTo,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/Ionicons';
import { scheduleOnRN } from 'react-native-worklets';

import { useTabBarInset } from '@/components/LiquidTabBar';
import BrandTitle from '@/components/BrandTitle';
import { HeaderButton } from '@/components/ScreenHeader';
import { StoryThumb } from '@/components/StoryMedia';
import PhotoViewer from '@/components/PhotoViewer';
import UserAvatar from '@/components/UserAvatar';
import { usePickAvatar } from '@/hooks/usePickAvatar';
import { useFriends } from '@/hooks/useFriends';
import { useProvinces } from '@/hooks/useProvinces';
import { useNewStory, useStories } from '@/hooks/useStories';
import {
  activityHistory,
  activityStatus,
  CATEGORY_EMOJI,
  getActivity,
  getUser,
  userHistory,
} from '@/services/mockData';
import {
  activityPhoto,
  categoryPhoto,
  commonGround,
  profileStats,
  friendsInCommon,
  type CommonGround,
} from '@/services/profile';
import { provinceName } from '@/services/places';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { updateProfile } from '@/store/slices/authSlice';
import { setPinnedTitle, togglePinStory } from '@/store/slices/storySlice';
import { useTheme } from '@/theme';
import type { Activity } from '@/types/activity';
import { ME, type ChatPhoto } from '@/types/chat';
import type { RootStackParamList } from '@/types/navigation';
import type { Story } from '@/types/story';
import { dateTimeIn } from '@/utils/format';

import {
  AVATAR_GAP,
  AVATAR_SIZE,
  TOP_BAR_HEIGHT,
  COVER_HEIGHT,
  createStyles,
  GRID_GAP,
  SCREEN_PADDING,
  AVATAR_DROP,
  TOP_BUTTON,
  iconStyles,
  type ProfileStyles,
} from './styles';
import AvatarSheet, { type AvatarAction } from './AvatarSheet';
import PinnedStorySheet from './PinnedStorySheet';
import RelationActions, { RELATION_ICON } from './RelationActions';

const COLUMNS = 3;
/** Tiles are a little taller than wide, like the photos in them. */
const TILE_RATIO = 4 / 3;
/** Kinds shown in the round picks, past the ones the user chose. */
/** Friends in common shown by face; more than that, a "…" after them. */
const COMMON_FACES = 2;
/** Before where they live and where they're from: outlines, one size. */
const PLACE_ICON = ms(17);
/** Enough to soften the cover photo while still making it out. */
const COVER_BLUR = 2;
/** Share of the scroll the cover moves back by, so it trails the page. */
const PARALLAX = 0.5;
/** The icons in the header's buttons, glass or not. */
const TOP_ICON = ms(17);
/** Scrolled this far, the header starts filling in; by this, it's solid. */
const SOLID_FROM = ms(60);
const SOLID_AT = ms(130);

type Tab = 'joined' | 'story' | 'saved';
/** Each with an icon of the tab bar's set: filled while showing. */
/** What a tab's icon takes: Phosphor's, or a few of them put together. */
type TabIconType = ComponentType<{
  size: number;
  color: string;
  weight?: 'regular' | 'fill';
}>;
/** What they've taken part in: a pulse line (Phosphor's), bolder on its tab. */
function JoinedTabIcon({
  size,
  color,
  weight,
}: {
  size: number;
  color: string;
  weight?: 'regular' | 'fill';
}) {
  return (
    <PulseIcon
      size={size}
      color={color}
      weight={weight === 'fill' ? 'bold' : 'regular'}
    />
  );
}
/**
 * Stories: a ring, solid on the right and dashed on the left, with a plus,
 * like adding to a story; Phosphor's ring and dashed ring, half of each.
 * Bolder on its tab.
 */
function StoryTabIcon({
  size,
  color,
  weight,
}: {
  size: number;
  color: string;
  weight?: 'regular' | 'fill';
}) {
  const stroke = weight === 'fill' ? 'bold' : 'regular';
  const half = { width: size / 2, height: size };
  return (
    <View style={[iconStyles.stack, { width: size, height: size }]}>
      <View style={[iconStyles.half, half]}>
        <CircleDashedIcon size={size} color={color} weight={stroke} />
      </View>
      <View style={[iconStyles.half, half]}>
        <View style={{ marginLeft: -size / 2 }}>
          <CircleIcon size={size} color={color} weight={stroke} />
        </View>
      </View>
      <View style={iconStyles.middle}>
        <PlusIcon size={size * 0.5} color={color} weight={stroke} />
      </View>
    </View>
  );
}
type TabDef = { id: Tab; Icon: TabIconType };
const TABS: TabDef[] = [
  { id: 'joined', Icon: JoinedTabIcon },
  { id: 'story', Icon: StoryTabIcon },
  { id: 'saved', Icon: BookmarkSimpleIcon },
];
/** Someone else's saved activities are theirs alone. */
const OTHER_TABS = TABS.filter(item => item.id !== 'saved');
/** The line sliding to a tab, and its page coming in. */
const TAB_MS = 260;
/** Scrolling back up to the tabs, from however far down. */
const SCROLL_BACK_MS = 380;
/** The line under a tab, in from each side of it. */
const TAB_LINE_INSET = ms(18);

/** The add-story and edit-profile buttons' icons, as someone else's buttons. */
const ACTION_ICON = RELATION_ICON;

/** Story tiles are tall, like the stories. */
const STORY_RATIO = 16 / 9;

/** The signed-in user's own profile, as its tab. */
export default function ProfileScreen() {
  return <ProfileView />;
}

/**
 * The user as others would see them: a blurred cover, their picture, name
 * and numbers, the kinds of things they do (tap one to narrow the grid), and
 * tabs of what they've joined, what they've saved and the stories they've
 * group chats. Settings sit behind the gear.
 */
export function ProfileView({ userId }: { userId?: string }) {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const tabBarInset = useTabBarInset();
  const focused = useIsFocused();
  const dispatch = useAppDispatch();
  const pickAvatar = usePickAvatar();
  const newStory = useNewStory();

  const user = useAppSelector(state => state.auth.user);
  // Someone else's profile, or, without a `userId`, the user's own.
  const person = userId ? getUser(userId) : undefined;
  const own = !person;
  const joinedIds = useAppSelector(state => state.activity.joinedIds);
  const myHistory = useMemo(() => activityHistory(joinedIds), [joinedIds]);
  const history = useMemo(
    () => (person ? userHistory(person.id) : myHistory),
    [person, myHistory],
  );
  const savedIds = useAppSelector(state => state.activity.savedIds);
  // Saved, the latest first.
  const saved = useMemo(
    () =>
      [...savedIds]
        .reverse()
        .map(getActivity)
        .filter((activity): activity is Activity => !!activity),
    [savedIds],
  );
  // Their stories still up, the latest first (a friend's, oldest first, as
  // they play).
  const { mine: myStories, pinned, friends: friendStories } = useStories();
  const theirStories = useMemo(
    () =>
      person
        ? friendStories.find(group => group.userId === person.id)?.stories ?? []
        : myStories,
    [person, friendStories, myStories],
  );
  const stories = useMemo(() => [...theirStories].reverse(), [theirStories]);
  const friends = useFriends();
  const stats = profileStats(history, friends.length);
  const tabs = own ? TABS : OTHER_TABS;

  /** The tab picked; its page shows once the page is back up at the tabs. */
  const [selected, setSelected] = useState<Tab>('joined');
  /** The tab whose page shows. */
  const [tab, setTab] = useState<Tab>('joined');
  /** Which tab the line is under, sliding between them. */
  const tabPos = useSharedValue(0);
  /** Which way the new tab's page comes in from. */
  const [tabFrom, setTabFrom] = useState<'left' | 'right'>('right');
  const scrollRef = useAnimatedRef<Animated.ScrollView>();
  /** Where the page is being scrolled back to, step by step; -1 when not. */
  const scrollBack = useSharedValue(-1);
  useAnimatedReaction(
    () => scrollBack.value,
    y => {
      if (y >= 0) {
        scrollTo(scrollRef, 0, y, false);
      }
    },
  );
  // Room below the tabs for any page, however short, to scroll up under
  // them, so a shorter one never cuts the page off.
  const [pageHeight, setPageHeight] = useState(0);
  const [tabsHeight, setTabsHeight] = useState(0);
  // Scrolled past the tabs: they hold on under the status bar.
  const scrollY = useSharedValue(0);
  const tabsY = useSharedValue(Infinity);
  const [stuck, setStuck] = useState(false);
  const onScroll = useAnimatedScrollHandler(event => {
    scrollY.value = event.contentOffset.y;
  });

  // Parallax: scrolled up, the cover drifts at half the page's pace and
  // fades; pulled down past the top, it stretches, its top kept at the edge.
  const coverHeight = insets.top + COVER_HEIGHT;
  const coverStyle = useAnimatedStyle(() => {
    const y = scrollY.value;
    if (y < 0) {
      return {
        opacity: 1,
        transform: [{ translateY: y / 2 }, { scale: 1 - y / coverHeight }],
      };
    }
    return {
      opacity: interpolate(y, [0, coverHeight], [1, 0.4], 'clamp'),
      transform: [{ translateY: y * PARALLAX }, { scale: 1 }],
    };
  });
  // Past the cover, the header fills in with the page's colour.
  const [solid, setSolid] = useState(false);
  const headerSolidStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      scrollY.value,
      [SOLID_FROM, SOLID_AT],
      [0, 1],
      'clamp',
    ),
  }));
  useAnimatedReaction(
    () => scrollY.value > (SOLID_FROM + SOLID_AT) / 2,
    (now, before) => {
      if (now !== before) {
        scheduleOnRN(setSolid, now);
      }
    },
  );
  useAnimatedReaction(
    () => scrollY.value >= tabsY.value - insets.top - TOP_BAR_HEIGHT,
    (past, before) => {
      if (past !== before) {
        scheduleOnRN(setStuck, past);
      }
    },
  );
  const name = person?.name ?? (user?.displayName || t('chat.you'));
  const interests = person ? person.interests : user?.interests ?? [];
  // Their own, made on the edit screen, after the app's kinds.
  const customInterests = person
    ? person.customInterests ?? []
    : user?.customInterests ?? [];
  const anyInterests = interests.length + customInterests.length > 0;
  const bio = person ? person.bio : user?.bio;

  const inCommon = useMemo(
    () =>
      friendsInCommon(
        user?.interests ?? [],
        friends,
        user?.customInterests ?? [],
      ),
    [user?.interests, user?.customInterests, friends],
  );
  // On someone else's: what they and the user have in common.
  const ground = useMemo(
    () =>
      person
        ? commonGround(
            person,
            user?.interests ?? [],
            myHistory,
            user?.customInterests ?? [],
          )
        : null,
    [person, user?.interests, user?.customInterests, myHistory],
  );

  const shown = tab === 'saved' ? saved : history;
  const cover = person
    ? (history[0] && activityPhoto(history[0])) ??
      (person.interests[0] && categoryPhoto(person.interests[0])) ??
      person.avatar
    : user?.avatarUri
    ? { uri: user.avatarUri }
    : (history[0] && activityPhoto(history[0])) ?? categoryPhoto('running');

  // Someone else's opens over the tabs, so no tab bar to clear.
  const bottomInset = (own ? tabBarInset : insets.bottom) + ms(24);
  const contentMinHeight =
    pageHeight - insets.top - TOP_BAR_HEIGHT - tabsHeight - bottomInset;

  // Scrolled down into a tab, the page first scrolls back up to the tabs,
  // then the other tab's page comes in, from its top: no jump when it's
  // shorter.
  const changeTab = (next: Tab) => {
    if (next === selected) {
      return;
    }
    const ids = tabs.map(item => item.id);
    const to = ids.indexOf(next);
    setSelected(next);
    setTabFrom(to > ids.indexOf(selected) ? 'right' : 'left');
    tabPos.value = withTiming(to, {
      duration: TAB_MS,
      easing: Easing.out(Easing.cubic),
    });
    const tabsTop = tabsY.value - insets.top - TOP_BAR_HEIGHT;
    if (scrollY.value <= tabsTop + 1) {
      scrollBack.value = -1;
      setTab(next);
      return;
    }
    scrollBack.value = scrollY.value;
    scrollBack.value = withTiming(
      tabsTop,
      { duration: SCROLL_BACK_MS, easing: Easing.inOut(Easing.cubic) },
      finished => {
        if (finished) {
          scrollBack.value = -1;
          scheduleOnRN(setTab, next);
        }
      },
    );
  };

  const tileWidth =
    (width - SCREEN_PADDING * 2 - GRID_GAP * (COLUMNS - 1)) / COLUMNS;

  const openActivity = useCallback(
    (activityId: string) =>
      navigation.navigate('ActivityDetail', { activityId }),
    [navigation],
  );
  const changePhoto = async () => {
    const uri = await pickAvatar();
    if (uri) {
      dispatch(updateProfile({ avatarUri: uri }));
    }
  };

  // The photo: with a story or a photo to see, a choice; otherwise just
  // picking one.
  const hasStory = theirStories.length > 0;
  const openStories = () =>
    navigation.navigate('StoryViewer', {
      userIds: [person ? person.id : ME],
      startIndex: 0,
    });

  // Under each pinned story: the title given it ('' for none), else its day.
  const pinnedTitles = useAppSelector(state => state.story.pinnedTitles);
  const pinnedLabel = (story: Story) =>
    pinnedTitles[story.id] ?? postedDay(story);
  const [editingPinned, setEditingPinned] = useState<Story | null>(null);
  const [avatarSheet, setAvatarSheet] = useState(false);
  const [viewingPhoto, setViewingPhoto] = useState(false);
  const avatarPhoto: ChatPhoto | undefined = person
    ? (person.avatar as ChatPhoto)
    : user?.avatarUri
    ? { uri: user.avatarUri }
    : undefined;
  const tapAvatar = () => {
    // Someone else's: with a story up, a choice of it or their photo;
    // without, straight to the photo.
    if (person) {
      if (hasStory) {
        setAvatarSheet(true);
      } else {
        setViewingPhoto(true);
      }
    } else if (hasStory || user?.avatarUri) {
      setAvatarSheet(true);
    } else {
      changePhoto();
    }
  };
  const onAvatarAction = (action: AvatarAction) => {
    if (action === 'story') {
      openStories();
    } else if (action === 'photo') {
      setViewingPhoto(true);
    } else {
      changePhoto();
    }
  };

  return (
    <View style={styles.root}>
      {/* Light text on the dark cover while this tab's in front. */}
      {/* Light on the dark cover; once the header fills in, the page's own. */}
      {focused ? (
        <StatusBar
          barStyle={!solid || isDark ? 'light-content' : 'dark-content'}
        />
      ) : null}
      <Animated.ScrollView
        ref={scrollRef}
        onScroll={onScroll}
        scrollEventThrottle={16}
        onLayout={event => setPageHeight(event.nativeEvent.layout.height)}
        contentContainerStyle={{ paddingBottom: bottomInset }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerBlock}>
          <Animated.View
            style={[styles.cover, { height: coverHeight }, coverStyle]}
            pointerEvents="none"
          >
            {/* Sized by its box, not by the photo: a bundled photo would
                otherwise keep its own height and stop short. */}
            <View style={styles.coverImage}>
              <Image
                source={cover}
                style={styles.coverPhoto}
                blurRadius={COVER_BLUR}
                resizeMode="cover"
              />
            </View>
            <View style={styles.coverShade} />
          </Animated.View>

          {/* Room for the header, which stays put above the page. */}
          <View style={{ height: insets.top + TOP_BAR_HEIGHT + AVATAR_DROP }} />

          <View style={styles.identity}>
            <Pressable
              onPress={tapAvatar}
              style={({ pressed }) => pressed && styles.pressed}
              accessibilityRole="button"
              accessibilityLabel={
                hasStory
                  ? t('profile.avatar.withStory')
                  : own
                  ? t('profile.changePhoto')
                  : t('profile.avatar.viewPhoto')
              }
            >
              {/* With a story up, ringed in the brand colour, as in Chats. */}
              <View
                style={[styles.avatarRing, hasStory && styles.avatarRingStory]}
              >
                {hasStory ? (
                  <View style={styles.avatarGap}>
                    <UserAvatar
                      size={AVATAR_SIZE - AVATAR_GAP * 2}
                      name={name}
                      uri={own ? user?.avatarUri : undefined}
                      source={person?.avatar}
                    />
                  </View>
                ) : (
                  <UserAvatar
                    size={AVATAR_SIZE}
                    name={name}
                    uri={own ? user?.avatarUri : undefined}
                    source={person?.avatar}
                  />
                )}
              </View>
              {own ? (
                <View style={styles.cameraBadge}>
                  <Icon name="camera" size={ms(13)} color={colors.background} />
                </View>
              ) : null}
            </Pressable>
            <Text style={styles.name} numberOfLines={2}>
              {name}
            </Text>
            {person ? (
              <Text
                style={[styles.counts, styles.countsLine]}
                numberOfLines={1}
              >
                {[
                  t('profile.age', { count: person.age }),
                  t('profile.activityCount', {
                    count: person.activitiesCount,
                  }),
                ].join(' · ')}
              </Text>
            ) : (
              // Each number opens its list.
              <View style={styles.countsRow}>
                {[
                  {
                    label: t('profile.friendCount', { count: stats.friends }),
                    open: () =>
                      navigation.navigate('People', { kind: 'friends' }),
                  },
                  {
                    label: t('profile.followerCount', {
                      count: stats.followers,
                    }),
                    open: () =>
                      navigation.navigate('People', { kind: 'followers' }),
                  },
                  {
                    label: t('profile.activityCount', {
                      count: stats.activities,
                    }),
                    open: () => navigation.navigate('ActivityHistory'),
                  },
                ].map((item, index) => (
                  <View key={item.label} style={styles.countsItem}>
                    {index > 0 ? <Text style={styles.counts}> · </Text> : null}
                    <Pressable
                      onPress={item.open}
                      hitSlop={{ top: ms(8), bottom: ms(8) }}
                      style={({ pressed }) => pressed && styles.pressed}
                      accessibilityRole="button"
                    >
                      <Text style={styles.counts}>{item.label}</Text>
                    </Pressable>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/*
            What they're into, as they picked them, in one line that scrolls
            once it's full; none yet, a way to add some.
          */}
          {own || anyInterests ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.interestsRow}
              contentContainerStyle={styles.interests}
            >
              {anyInterests ? (
                <>
                  {interests.map(category => (
                    <View key={category} style={styles.interest}>
                      <Text style={styles.interestEmoji}>
                        {CATEGORY_EMOJI[category]}
                      </Text>
                      <Text style={styles.interestText}>
                        {t(`imFree.activities.${category}`)}
                      </Text>
                    </View>
                  ))}
                  {customInterests.map(interest => (
                    <View key={interest.id} style={styles.interest}>
                      {interest.image ? (
                        <Image
                          source={{ uri: interest.image }}
                          style={styles.interestPhoto}
                        />
                      ) : (
                        <Text style={styles.interestEmoji}>
                          {interest.emoji}
                        </Text>
                      )}
                      <Text style={styles.interestText}>{interest.name}</Text>
                    </View>
                  ))}
                </>
              ) : (
                <Pressable
                  onPress={() => navigation.navigate('EditProfile')}
                  style={({ pressed }) => [
                    styles.interest,
                    styles.interestAdd,
                    pressed && styles.pressed,
                  ]}
                  accessibilityRole="button"
                >
                  <Icon name="add" size={ms(13)} color={colors.textSecondary} />
                  <Text style={styles.interestAddText}>
                    {t('profile.addInterests')}
                  </Text>
                </Pressable>
              )}
            </ScrollView>
          ) : null}

          {/* A few words about them, under what they're into. */}
          <View style={styles.bioBlock}>
            {/* Someone else's: their words, or nothing. */}
            {bio ? (
              <Text style={styles.bio}>{bio}</Text>
            ) : person ? null : (
              <Pressable
                onPress={() => navigation.navigate('EditProfile')}
                hitSlop={6}
              >
                <View style={styles.addBio}>
                  <PencilSimpleLineIcon
                    size={ms(14)}
                    color={colors.textSecondary}
                  />
                  <Text style={styles.addBioText}>{t('profile.addBio')}</Text>
                </View>
              </Pressable>
            )}
          </View>

          {/* Someone else's: how the user stands with them, over what they
              have in common. */}
          {person ? (
            <RelationActions userId={person.id} styles={styles} />
          ) : null}

          {ground ? <CommonGroundRow ground={ground} styles={styles} /> : null}

          {own && inCommon.length ? (
            <Pressable
              onPress={() => navigation.navigate('FriendsInCommon')}
              style={({ pressed }) => [
                styles.inCommon,
                pressed && styles.pressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel={`${t('profile.friendsInCommon')}: ${inCommon
                .map(({ friend }) => friend.name)
                .join(', ')}`}
            >
              <View style={styles.inCommonFaces}>
                {inCommon.slice(0, COMMON_FACES).map(({ friend }, index) => (
                  <Image
                    key={friend.id}
                    source={friend.avatar}
                    style={[
                      styles.inCommonFace,
                      index > 0 && styles.faceOverlap,
                    ]}
                  />
                ))}
                {inCommon.length > COMMON_FACES ? (
                  <View
                    style={[
                      styles.inCommonFace,
                      styles.faceOverlap,
                      styles.inCommonMore,
                    ]}
                  >
                    <Icon
                      name="ellipsis-horizontal"
                      size={ms(13)}
                      color={colors.white}
                    />
                  </View>
                ) : null}
              </View>
              <Text style={styles.inCommonText}>
                {t('profile.friendsInCommon')}
              </Text>
            </Pressable>
          ) : null}

          {/* Where they live and are from, under who they have in common. */}
          <PlacesInfo
            currentCity={person ? person.currentCity : user?.currentCity}
            hometown={person ? person.hometown : user?.hometown}
            styles={styles}
          />

          {/* The user's own, after what they're into: adding a story and
              editing the profile (when no stories are pinned; those come
              with their own "add"). */}
          {person || pinned.length ? null : (
            <View style={[styles.actions, styles.actionsOverTabs]}>
              <Pressable
                onPress={newStory}
                style={({ pressed }) => [
                  styles.action,
                  styles.actionPrimary,
                  pressed && styles.pressed,
                ]}
                accessibilityRole="button"
              >
                <PlusCircleIcon
                  size={ACTION_ICON}
                  color={colors.white}
                  weight="fill"
                />
                <Text style={[styles.actionText, styles.actionTextPrimary]}>
                  {t('profile.addStory')}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => navigation.navigate('EditProfile')}
                style={({ pressed }) => [
                  styles.action,
                  pressed && styles.pressed,
                ]}
                accessibilityRole="button"
              >
                <PencilSimpleIcon
                  size={ACTION_ICON}
                  color={colors.text}
                  weight="fill"
                />
                <Text style={styles.actionText} numberOfLines={1}>
                  {t('profile.editProfileButton')}
                </Text>
              </Pressable>
            </View>
          )}

          {/* Their stories up, or the user's own pinned ones after a way to
              add one. */}
          {person ? (
            theirStories.length ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.highlights}
              >
                {theirStories.map((story, index) => (
                  <PinnedStory
                    key={story.id}
                    story={story}
                    label={postedDay(story)}
                    onPress={() =>
                      navigation.navigate('StoryViewer', {
                        userIds: [person.id],
                        startIndex: 0,
                        storyIndex: index,
                      })
                    }
                    styles={styles}
                  />
                ))}
              </ScrollView>
            ) : null
          ) : pinned.length ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.highlights}
            >
              <Pressable
                onPress={newStory}
                style={styles.highlight}
                accessibilityRole="button"
              >
                <View style={styles.highlightRing}>
                  <View style={styles.highlightAdd}>
                    <Icon name="add" size={ms(26)} color={colors.white} />
                  </View>
                </View>
                <Text style={styles.highlightLabel} numberOfLines={1}>
                  {t('profile.newStory')}
                </Text>
              </Pressable>
              {pinned.map((story, index) => (
                <PinnedStory
                  key={story.id}
                  story={story}
                  label={pinnedLabel(story)}
                  onEditTitle={() => setEditingPinned(story)}
                  onPress={() =>
                    navigation.navigate('StoryViewer', {
                      userIds: [ME],
                      startIndex: 0,
                      pinned: true,
                      storyIndex: index,
                    })
                  }
                  styles={styles}
                />
              ))}
            </ScrollView>
          ) : null}
        </View>

        {/* Its place in the page; once scrolled past, a copy holds on at
            the top (below). */}
        <View
          onLayout={event => {
            tabsY.value = event.nativeEvent.layout.y;
            setTabsHeight(event.nativeEvent.layout.height);
          }}
        >
          <TabsRow
            tabs={tabs}
            tab={selected}
            pos={tabPos}
            onChange={changeTab}
            styles={styles}
          />
        </View>

        <View style={{ minHeight: contentMinHeight }}>
          <Animated.View
            key={tab}
            entering={(tabFrom === 'right' ? FadeInRight : FadeInLeft)
              .duration(TAB_MS)
              .easing(Easing.out(Easing.cubic))}
          >
            {tab === 'story' ? (
              stories.length ? (
                <View style={styles.grid}>
                  {stories.map(story => (
                    <StoryTile
                      key={story.id}
                      story={story}
                      width={tileWidth}
                      onPress={openStories}
                      styles={styles}
                    />
                  ))}
                </View>
              ) : (
                <Empty
                  Icon={StoryTabIcon}
                  text={
                    own
                      ? t('profile.empty.story')
                      : t('profile.emptyOther.story', { name })
                  }
                  styles={styles}
                />
              )
            ) : shown.length ? (
              <View style={styles.grid}>
                {shown.map(activity => (
                  <ActivityTile
                    key={activity.id}
                    activity={activity}
                    width={tileWidth}
                    onPress={openActivity}
                    styles={styles}
                  />
                ))}
              </View>
            ) : (
              <Empty
                Icon={tab === 'saved' ? BookmarkSimpleIcon : JoinedTabIcon}
                text={
                  own
                    ? t(`profile.empty.${tab}`)
                    : t('profile.emptyOther.joined', { name })
                }
                styles={styles}
              />
            )}
          </Animated.View>
        </View>
      </Animated.ScrollView>

      <View style={[styles.header, { paddingTop: insets.top }]}>
        <Animated.View style={[styles.headerSolid, headerSolidStyle]} />
        <TopBar
          solid={solid}
          name={person?.name}
          onBack={person ? navigation.goBack : undefined}
          onEdit={() => navigation.navigate('EditProfile')}
          onSettings={() => navigation.navigate('Settings')}
          styles={styles}
        />
      </View>

      <AvatarSheet
        visible={avatarSheet}
        hasStory={hasStory}
        hasPhoto={!!avatarPhoto}
        canChange={own}
        styles={styles}
        onClose={() => setAvatarSheet(false)}
        onAction={onAvatarAction}
      />
      {own ? (
        <>
          <PinnedStorySheet
            story={editingPinned}
            title={editingPinned ? pinnedLabel(editingPinned) : ''}
            styles={styles}
            onClose={() => setEditingPinned(null)}
            onSave={title => {
              if (editingPinned) {
                dispatch(setPinnedTitle({ id: editingPinned.id, title }));
              }
              setEditingPinned(null);
            }}
            onUnpin={() => {
              if (editingPinned) {
                dispatch(togglePinStory(editingPinned.id));
              }
              setEditingPinned(null);
            }}
          />
        </>
      ) : null}
      <PhotoViewer
        photos={avatarPhoto ? [avatarPhoto] : []}
        bare
        startIndex={viewingPhoto && avatarPhoto ? 0 : null}
        onClose={() => setViewingPhoto(false)}
      />

      {stuck ? (
        <View style={[styles.stuckTabs, { top: insets.top + TOP_BAR_HEIGHT }]}>
          <TabsRow
            tabs={tabs}
            tab={selected}
            pos={tabPos}
            onChange={changeTab}
            styles={styles}
          />
        </View>
      ) : null}
    </View>
  );
}

/** Where they live and where they're from, each when it's known. */
function PlacesInfo({
  currentCity,
  hometown,
  styles,
}: {
  currentCity?: string;
  hometown?: string;
  styles: ProfileStyles;
}) {
  const { colors } = useTheme();
  const { provinces } = useProvinces();
  const lives = provinceName(currentCity, provinces);
  const from = provinceName(hometown, provinces);
  if (!lives && !from) {
    return null;
  }
  return (
    <View style={styles.places}>
      {lives ? (
        <View style={styles.place}>
          <HouseIcon size={PLACE_ICON} color={colors.text} />
          <Text style={styles.placeText}>
            <Trans
              i18nKey="profile.places.livesIn"
              values={{ place: lives }}
              components={{ b: <Text style={styles.placeName} /> }}
            />
          </Text>
        </View>
      ) : null}
      {from ? (
        <View style={styles.place}>
          <MapPinIcon size={PLACE_ICON} color={colors.text} />
          <Text style={styles.placeText}>
            <Trans
              i18nKey="profile.places.from"
              values={{ place: from }}
              components={{ b: <Text style={styles.placeName} /> }}
            />
          </Text>
        </View>
      ) : null}
    </View>
  );
}

/**
 * On someone else's profile: what they have in common with the user, the
 * interests they share and how many activities they've done together.
 */
function CommonGroundRow({
  ground,
  styles,
}: {
  ground: CommonGround;
  styles: ProfileStyles;
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const liked = [
    ...ground.interests.map(category =>
      `${CATEGORY_EMOJI[category] ?? ''} ${t(
        `imFree.activities.${category}`,
      )}`.trim(),
    ),
    ...ground.customInterests.map(item => `${item.emoji} ${item.name}`),
  ];
  if (!liked.length && !ground.activities) {
    return null;
  }
  const parts = [
    ...(liked.length
      ? [t('profile.common.interests', { list: liked.join(', ') })]
      : []),
    ...(ground.activities
      ? [t('profile.common.activities', { count: ground.activities })]
      : []),
  ];
  return (
    <View style={styles.common}>
      <SparkleIcon size={ms(16)} color={colors.primary} weight="fill" />
      <Text style={styles.commonText}>
        <Text style={styles.commonLead}>{t('profile.common.title')} </Text>
        {parts.join(' · ')}
      </Text>
    </View>
  );
}

/**
 * Over the cover: just edit and settings, as glass buttons. Once the header's
 * solid: the app's mark and the tab's name, as on the other tabs, and the
 * round buttons the other screens use.
 */
function TopBar({
  solid,
  name,
  onBack,
  onEdit,
  onSettings,
  styles,
}: {
  solid: boolean;
  /** Someone else's profile: theirs, beside the way back once solid. */
  name?: string;
  /** Someone else's profile: back, and no editing or settings. */
  onBack?: () => void;
  onEdit: () => void;
  onSettings: () => void;
  styles: ProfileStyles;
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const editLabel = t('profile.editProfile');
  const settingsLabel = t('profile.settings');
  if (onBack) {
    return (
      <View style={styles.topBar}>
        <View style={styles.backRow}>
          {solid ? (
            <HeaderButton
              icon="chevron-back"
              label={t('auth.back')}
              onPress={onBack}
              size={TOP_BUTTON}
            />
          ) : (
            <GlassButton
              label={t('auth.back')}
              onPress={onBack}
              styles={styles}
            >
              <Icon name="chevron-back" size={TOP_ICON} color={colors.white} />
            </GlassButton>
          )}
          {solid ? (
            <Text
              style={styles.headerName}
              numberOfLines={1}
              accessibilityRole="header"
            >
              {name}
            </Text>
          ) : null}
        </View>
      </View>
    );
  }
  return (
    <View style={styles.topBar}>
      <View style={styles.brand}>
        {solid ? <BrandTitle text={t('tabs.profile')} /> : null}
      </View>
      <View style={styles.topActions}>
        {solid ? (
          <>
            <HeaderButton
              icon={
                <PencilSimpleLineIcon size={TOP_ICON} color={colors.text} />
              }
              label={editLabel}
              onPress={onEdit}
              size={TOP_BUTTON}
            />
            <HeaderButton
              icon={<GearSixIcon size={TOP_ICON} color={colors.text} />}
              label={settingsLabel}
              onPress={onSettings}
              size={TOP_BUTTON}
            />
          </>
        ) : (
          <>
            <GlassButton label={editLabel} onPress={onEdit} styles={styles}>
              <PencilSimpleLineIcon size={TOP_ICON} color={colors.white} />
            </GlassButton>
            <GlassButton
              label={settingsLabel}
              onPress={onSettings}
              styles={styles}
            >
              <GearSixIcon size={TOP_ICON} color={colors.white} />
            </GlassButton>
          </>
        )}
      </View>
    </View>
  );
}

/** A round liquid-glass button over the cover (frosted where there's no glass). */
function GlassButton({
  label,
  onPress,
  styles,
  children,
}: {
  label: string;
  onPress: () => void;
  styles: ProfileStyles;
  children: ReactNode;
}) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => pressed && styles.pressed}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <LiquidGlassView
        interactive
        effect="clear"
        style={[
          styles.glassButton,
          !isLiquidGlassSupported && styles.glassButtonFallback,
        ]}
      >
        {children}
      </LiquidGlassView>
    </Pressable>
  );
}

/** Joined, story, saved: icon and name, a line sliding to the one showing. */
function TabsRow({
  tabs,
  tab,
  pos,
  onChange,
  styles,
}: {
  /** All three on the user's own; someone else's has no saved. */
  tabs: readonly TabDef[];
  tab: Tab;
  /** The line's place, by tab, as it slides. */
  pos: SharedValue<number>;
  onChange: (tab: Tab) => void;
  styles: ProfileStyles;
}) {
  const { width } = useWindowDimensions();
  const tabWidth = (width - SCREEN_PADDING * 2) / tabs.length;
  const lineStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: pos.value * tabWidth }],
  }));
  const { t } = useTranslation();
  const { colors } = useTheme();
  return (
    <View style={styles.tabs} accessibilityRole="tablist">
      {tabs.map(({ id, Icon: TabIcon }) => {
        const on = tab === id;
        return (
          <Pressable
            key={id}
            onPress={() => onChange(id)}
            style={styles.tab}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
          >
            <TabIcon
              size={ms(18)}
              weight={on ? 'fill' : 'regular'}
              color={on ? colors.text : colors.textMuted}
            />
            <Text style={[styles.tabText, on && styles.tabTextOn]}>
              {t(`profile.tabs.${id}`)}
            </Text>
          </Pressable>
        );
      })}
      <Animated.View
        style={[
          styles.tabLine,
          { width: tabWidth - TAB_LINE_INSET * 2 },
          lineStyle,
        ]}
        pointerEvents="none"
      />
    </View>
  );
}

/** When a pinned story was posted, under it until it's given a title. */
const postedDay = (story: Story) => {
  const posted = new Date(story.postedAt);
  return `${posted.getDate()}/${posted.getMonth() + 1}`;
};

/**
 * A story pinned to the profile, as a round picture that opens it, with its
 * title (one line, cut short) or nothing under it, which a tap changes; so
 * does a long press on the picture.
 */
function PinnedStory({
  story,
  label,
  onPress,
  onEditTitle,
  styles,
}: {
  story: Story;
  label: string;
  onPress: () => void;
  /** The user's own pinned ones: changing what's under them. */
  onEditTitle?: () => void;
  styles: ProfileStyles;
}) {
  const { t } = useTranslation();
  return (
    <View style={styles.highlight}>
      <Pressable
        onPress={onPress}
        onLongPress={onEditTitle}
        style={({ pressed }) => [
          styles.highlightRing,
          styles.highlightRingPinned,
          pressed && styles.pressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel={label || postedDay(story)}
      >
        <StoryThumb
          media={story.media}
          filter={story.filter}
          style={styles.highlightImage}
        />
      </Pressable>
      {/* Blank keeps its line, so the circles stay level, and it can still
          be tapped. */}
      <Pressable
        onPress={onEditTitle}
        disabled={!onEditTitle}
        hitSlop={{ top: ms(4), bottom: ms(8) }}
        style={({ pressed }) => [
          styles.highlightTitle,
          pressed && styles.pressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel={t('profile.pinned.title')}
      >
        <Text style={styles.highlightLabel} numberOfLines={1}>
          {label || ' '}
        </Text>
      </Pressable>
    </View>
  );
}

/** An activity as a picture, its name and when over the bottom of it. */
function ActivityTile({
  activity,
  width,
  onPress,
  styles,
}: {
  activity: Activity;
  width: number;
  onPress: (activityId: string) => void;
  styles: ProfileStyles;
}) {
  const { t } = useTranslation();
  const photo = activityPhoto(activity);
  const live = activityStatus(activity) === 'ongoing';
  return (
    <Pressable
      onPress={() => onPress(activity.id)}
      style={({ pressed }) => [
        styles.tile,
        { width, height: width * TILE_RATIO },
        pressed && styles.pressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={activity.title}
    >
      {photo ? (
        <Image source={photo} style={styles.tileImage} />
      ) : (
        <View style={[styles.tileImage, styles.tileEmpty]}>
          <Text style={styles.tileEmoji}>
            {CATEGORY_EMOJI[activity.category]}
          </Text>
        </View>
      )}
      <View style={styles.tileShade}>
        <Text style={styles.tileTitle} numberOfLines={2}>
          {activity.title}
        </Text>
        <Text style={styles.tileMeta} numberOfLines={1}>
          {dateTimeIn(activity.startsInMinutes)}
        </Text>
      </View>
      {live ? (
        <View style={styles.tileLive}>
          <View style={styles.tileLiveDot} />
          <Text style={styles.tileLiveText}>{t('profile.now')}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

/** One of their stories, as its picture; a clip shows a play mark. */
function StoryTile({
  story,
  width,
  onPress,
  styles,
}: {
  story: Story;
  width: number;
  onPress: () => void;
  styles: ProfileStyles;
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.tile,
        { width, height: width * STORY_RATIO },
        pressed && styles.pressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={t('stories.yourStory')}
    >
      <StoryThumb
        media={story.media}
        filter={story.filter}
        style={styles.tileImage}
      />
      {story.media.type === 'video' ? (
        <View style={styles.storyPlay}>
          <Icon name="play" size={ms(12)} color={colors.white} />
        </View>
      ) : null}
    </Pressable>
  );
}

function Empty({
  Icon: EmptyIcon,
  text,
  styles,
}: {
  Icon: TabIconType;
  text: string;
  styles: ProfileStyles;
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.empty}>
      <EmptyIcon size={ms(30)} color={colors.textMuted} />
      <Text style={styles.emptyText}>{text}</Text>
    </View>
  );
}
