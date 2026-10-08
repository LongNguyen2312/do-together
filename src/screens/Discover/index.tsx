import { useCallback, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  type ScrollViewInstance,
} from 'react-native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import Icon from 'react-native-vector-icons/Ionicons';
import { ms } from 'react-native-size-matters';

import AppHeader from '@/components/AppHeader';
import { useTabBarInset } from '@/components/LiquidTabBar';
import PulseDot from '@/components/PulseDot';
import {
  ACTIVITIES,
  CATEGORY_EMOJI,
  COMMUNITIES,
  isBrowsable,
  isJoined,
} from '@/services/mockData';
import { useDebounce } from '@/hooks/useDebounce';
import { useJoinActivity } from '@/hooks/useJoinActivity';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { joinActivity, toggleCommunity } from '@/store/slices/activitySlice';
import { useTheme } from '@/theme';
import type { MainTabParamList, RootStackParamList } from '@/types/navigation';
import { normalizeSearch } from '@/utils/format';

import {
  ActivityCard,
  CommunityRow,
  FeaturedActivityCard,
  FreePersonCard,
  InviteButton,
} from './cards';
import {
  COMMUNITY_PREVIEW_COUNT,
  DISCOVER_CATEGORIES,
  FREE_PEOPLE,
  HOT_PREVIEW_COUNT,
  UPCOMING_ACTIVITIES,
  type DiscoverCategory,
} from './data';
import { createStyles } from './styles';
import { useInvite } from './useInvite';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Discover'>,
  NativeStackScreenProps<RootStackParamList>
>;

export default function DiscoverScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const tabBarInset = useTabBarInset();

  const dispatch = useAppDispatch();
  const joinedIds = useAppSelector(state => state.activity.joinedIds);
  const joinedCommunityIds = useAppSelector(
    state => state.activity.joinedCommunityIds,
  );

  const [category, setCategory] = useState<DiscoverCategory>('all');
  const chipsRef = useRef<ScrollViewInstance>(null);
  const chipsViewport = useRef(0);
  const chipsContent = useRef(0);
  const chipLayouts = useRef<
    Partial<Record<DiscoverCategory, { x: number; width: number }>>
  >({});

  const selectCategory = (id: DiscoverCategory) => {
    setCategory(id);
    const chip = chipLayouts.current[id];
    if (!chip) {
      return;
    }
    // Center the chip, so tapping one near an edge reveals its neighbours.
    const maxX = Math.max(chipsContent.current - chipsViewport.current, 0);
    const x = chip.x + chip.width / 2 - chipsViewport.current / 2;
    chipsRef.current?.scrollTo({
      x: Math.min(Math.max(x, 0), maxX),
      animated: true,
    });
  };
  const [query, setQuery] = useState('');
  const { invitedIds, invite } = useInvite();

  const search = normalizeSearch(useDebounce(query));
  const searching = search.length > 0;
  const inCategory = (value: DiscoverCategory) =>
    category === 'all' || value === category;
  const categoryLabel = (value: DiscoverCategory) =>
    t(`imFree.activities.${value}`);

  // While searching, only activities whose name matches are listed.
  const searchResults = searching
    ? ACTIVITIES.filter(
        activity =>
          isBrowsable(activity) &&
          inCategory(activity.category) &&
          normalizeSearch(activity.title).includes(search),
      )
    : [];
  const freePeople = searching
    ? []
    : FREE_PEOPLE.filter(
        person => category === 'all' || person.interests.includes(category),
      );
  const hotActivities = searching
    ? []
    : UPCOMING_ACTIVITIES.filter(activity => inCategory(activity.category));
  const communities = searching
    ? []
    : COMMUNITIES.filter(community => inCategory(community.category));
  const nothingFound =
    !searchResults.length &&
    !freePeople.length &&
    !hotActivities.length &&
    !communities.length;

  const showComingSoon = useCallback(() => {
    Alert.alert(t('auth.comingSoonTitle'), t('auth.comingSoonMessage'));
  }, [t]);

  const openActivity = useCallback(
    (activityId: string) =>
      navigation.navigate('ActivityDetail', { activityId }),
    [navigation],
  );

  const requestJoin = useJoinActivity();
  const join = useCallback(
    (activityId: string) =>
      requestJoin(activityId, () => dispatch(joinActivity(activityId))),
    [requestJoin, dispatch],
  );

  const toggleGroup = useCallback(
    (communityId: string) => dispatch(toggleCommunity(communityId)),
    [dispatch],
  );

  return (
    <View style={styles.safe}>
      <AppHeader
        title={t('tabs.discover')}
        backgroundColor={colors.background}
        onNotificationsPress={showComingSoon}
      />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: tabBarInset + ms(24) },
        ]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.filters}>
          <View style={styles.searchRow}>
            <View style={styles.search}>
              <Icon
                name="search-outline"
                size={ms(20)}
                color={colors.textSecondary}
              />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder={t('discover.searchPlaceholder')}
                placeholderTextColor={colors.textSecondary}
                style={styles.searchInput}
                returnKeyType="search"
                clearButtonMode="while-editing"
              />
              <Pressable
                onPress={showComingSoon}
                hitSlop={6}
                style={styles.searchAction}
                accessibilityRole="button"
                accessibilityLabel={t('discover.voiceSearch')}
              >
                <Icon
                  name="mic-outline"
                  size={ms(20)}
                  color={colors.textSecondary}
                />
              </Pressable>
            </View>
          </View>

          <ScrollView
            ref={chipsRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chips}
            style={styles.chipsScroll}
            onLayout={event => {
              chipsViewport.current = event.nativeEvent.layout.width;
            }}
            onContentSizeChange={width => {
              chipsContent.current = width;
            }}
          >
            {DISCOVER_CATEGORIES.map(id => {
              const selected = id === category;
              const emoji = id === 'all' ? undefined : CATEGORY_EMOJI[id];
              return (
                <Pressable
                  key={id}
                  onLayout={event => {
                    const { x, width } = event.nativeEvent.layout;
                    chipLayouts.current[id] = { x, width };
                  }}
                  onPress={() => selectCategory(id)}
                  style={({ pressed }) => [
                    styles.chip,
                    selected && styles.chipSelected,
                    pressed && styles.pressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                >
                  {emoji ? <Text style={styles.chipEmoji}>{emoji}</Text> : null}
                  <Text
                    style={[
                      styles.chipText,
                      selected && styles.chipTextSelected,
                    ]}
                  >
                    {id === 'all'
                      ? t('home.categories.all')
                      : categoryLabel(id)}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {searchResults.length ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                {t('discover.searchResults', { count: searchResults.length })}
              </Text>
            </View>
            <View style={styles.sectionList}>
              {searchResults.map(activity => (
                <ActivityCard
                  key={activity.id}
                  activity={activity}
                  joined={isJoined(activity, joinedIds)}
                  styles={styles}
                  onOpen={openActivity}
                  onJoin={join}
                />
              ))}
            </View>
          </View>
        ) : null}

        {freePeople.length ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Text style={styles.sectionTitle}>
                  {t('discover.freeNearby')}
                </Text>
                <View style={styles.onlinePill}>
                  <PulseDot color={colors.success} size={ms(6)} />
                  <Text style={styles.onlineText}>
                    {t('discover.online', { count: freePeople.length })}
                  </Text>
                </View>
              </View>
              <SectionLink
                label={t('discover.map')}
                onPress={() => navigation.navigate('FreeNearbyMap')}
                styles={styles}
                color={colors.primary}
              />
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.freeList}
              style={styles.freeScroll}
            >
              {freePeople.map(person => (
                <FreePersonCard
                  key={person.id}
                  person={person}
                  styles={styles}
                  actions={
                    <InviteButton
                      person={person}
                      invited={invitedIds.includes(person.id)}
                      styles={styles}
                      onInvite={invite}
                    />
                  }
                />
              ))}
            </ScrollView>
          </View>
        ) : null}

        {hotActivities.length ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                {t('discover.hotUpcoming')}
              </Text>
              <SectionLink
                label={t('discover.seeAll', { count: hotActivities.length })}
                onPress={() =>
                  navigation.navigate('HotActivities', { category })
                }
                styles={styles}
                color={colors.primary}
              />
            </View>
            <View style={styles.sectionList}>
              {hotActivities
                .slice(0, HOT_PREVIEW_COUNT)
                .map((activity, index) => {
                  const Card =
                    index === 0 && activity.cover
                      ? FeaturedActivityCard
                      : ActivityCard;
                  return (
                    <Card
                      key={activity.id}
                      activity={activity}
                      joined={isJoined(activity, joinedIds)}
                      styles={styles}
                      onOpen={openActivity}
                      onJoin={join}
                    />
                  );
                })}
            </View>
          </View>
        ) : null}

        {communities.length ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                {t('discover.communities')}
              </Text>
              <SectionLink
                label={t('discover.seeMore')}
                onPress={() => navigation.navigate('Communities', { category })}
                styles={styles}
                color={colors.primary}
              />
            </View>
            <View style={styles.communityList}>
              {communities.slice(0, COMMUNITY_PREVIEW_COUNT).map(community => (
                <CommunityRow
                  key={community.id}
                  community={community}
                  joined={joinedCommunityIds.includes(community.id)}
                  styles={styles}
                  onToggle={toggleGroup}
                />
              ))}
            </View>
          </View>
        ) : null}

        {nothingFound ? (
          <Text style={styles.empty}>{t('discover.empty')}</Text>
        ) : null}
      </ScrollView>
    </View>
  );
}

function SectionLink({
  label,
  onPress,
  styles,
  color,
}: {
  label: string;
  onPress: () => void;
  styles: ReturnType<typeof createStyles>;
  color: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => [styles.sectionLink, pressed && styles.pressed]}
      accessibilityRole="link"
    >
      <Text style={styles.sectionLinkText}>{label}</Text>
      <Icon name="chevron-forward" size={ms(14)} color={color} />
    </Pressable>
  );
}
