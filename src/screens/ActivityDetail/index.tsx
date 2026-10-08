import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  Share,
  Text,
  View,
} from 'react-native';
import {
  Camera,
  LocationManager,
  Map as MapView,
  Marker,
  useCurrentPosition,
  type LngLat,
} from '@maplibre/maplibre-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ChatTeardropDotsIcon } from 'phosphor-react-native/src/icons/ChatTeardropDots';
import { useTranslation } from 'react-i18next';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { ms } from 'react-native-size-matters';
import Icon from 'react-native-vector-icons/Ionicons';

import { useConfirm } from '@/components/ConfirmDialog';
import PulseDot from '@/components/PulseDot';
import { useIncomingChatDemo } from '@/hooks/useIncomingChatDemo';
import { useJoinActivity } from '@/hooks/useJoinActivity';
import {
  ACTIVITIES,
  activityStatus,
  canInviteTo,
  CATEGORY_EMOJI,
  freeUsersFor,
  getActivity,
  getUser,
  participationStatus,
  spotsLeft as spotsLeftOf,
} from '@/services/mockData';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  checkIn,
  joinActivity,
  leaveActivity,
} from '@/store/slices/activitySlice';
import { selectUnreadCount } from '@/store/slices/chatSlice';
import { useTheme } from '@/theme';
import type { ActivityInfoTile } from '@/types/activity';
import type { RootStackParamList } from '@/types/navigation';
import { openDirections } from '@/utils/directions';
import { distanceMeters } from '@/utils/geo';
import {
  clockIn,
  dateTimeIn,
  formatDistance,
  initialsOf,
} from '@/utils/format';
import { defaultMapStyle, mapStyleUrl } from '@/utils/mapStyles';

import { LiveMapMarkers, useLiveBounds } from './LiveMap';
import LiveMapModal from './LiveMapModal';
import NearbyCard from './NearbyCard';
import { createStyles, type ActivityDetailStyles } from './styles';
import { ARRIVED_RADIUS_M, useLiveMembers } from './useLiveMembers';

/** Simulated join round-trip until the API exists. */
const JOIN_MS = 900;
/** Check-in only unlocks this close to the meeting point. */
const CHECK_IN_RADIUS_M = 50;
const HERO_ZOOM = 14.5;
/** m/s; below this the GPS course is too noisy to use as a heading. */
const MIN_COURSE_SPEED = 0.5;
/** Free people shown inline; the rest are behind "See more". */
const NEARBY_PREVIEW = 2;

type TileKind = 'time' | ActivityInfoTile['kind'] | 'meetingPoint';

const TILE_ICONS: Record<TileKind, string> = {
  time: 'time-outline',
  pace: 'speedometer-outline',
  vibe: 'sparkles-outline',
  meetingPoint: 'navigate-outline',
};

type Props = NativeStackScreenProps<RootStackParamList, 'ActivityDetail'>;

export default function ActivityDetailScreen({ navigation, route }: Props) {
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const mapStyle =
    useAppSelector(state => state.app.mapStyle) ?? defaultMapStyle(isDark);

  const activity = getActivity(route.params.activityId) ?? ACTIVITIES[0];
  const host = getUser(activity.hostId);
  const status = activityStatus(activity);
  const upcoming = status === 'upcoming';
  const live = status === 'ongoing';
  const completed = status === 'completed';
  // Opened from a group chat's info page: details only, no footer.
  const viewOnly = !!route.params.viewOnly;
  // Joining, leaving, saving, sharing and inviting only make sense before it starts.
  const readOnly = status !== 'upcoming' || viewOnly;
  const nearby = completed || viewOnly ? [] : freeUsersFor(activity);
  const startsAt = clockIn(activity.startsInMinutes);
  const endsAt = clockIn(activity.startsInMinutes + activity.durationMinutes);

  const dispatch = useAppDispatch();
  const joinedIds = useAppSelector(state => state.activity.joinedIds);
  const joined = participationStatus(activity, joinedIds) === 'joined';
  const checkedIn = useAppSelector(state =>
    state.activity.checkedInIds.includes(activity.id),
  );
  const me = useAppSelector(state => state.auth.user);
  const myName = me?.displayName || t('activityDetail.you');
  const unreadChat = useAppSelector(state =>
    selectUnreadCount(state, activity.id),
  );
  const chatMuted = useAppSelector(state =>
    state.chat.mutedIds.includes(activity.id),
  );
  // Members keep their tools while it's live; everyone else only gets details.
  const liveMember = live && joined;
  const canNavigate = !viewOnly && (status === 'upcoming' || liveMember);
  const chatOpen = joined && !viewOnly && !completed;
  useIncomingChatDemo(activity.id, chatOpen);
  const liveMembers = useLiveMembers(activity, liveMember);

  const showCheckIn =
    joined && !checkedIn && !viewOnly && status === 'upcoming';
  useEffect(() => {
    if (showCheckIn || liveMember) {
      LocationManager.requestPermissions();
    }
  }, [showCheckIn, liveMember]);
  const position = useCurrentPosition();
  const myPosition: LngLat | null = position
    ? [position.coords.longitude, position.coords.latitude]
    : null;
  const myCourse =
    position?.coords.heading != null &&
    (position.coords.speed ?? 0) > MIN_COURSE_SPEED
      ? position.coords.heading
      : null;
  const metersAway = myPosition
    ? distanceMeters(myPosition, activity.coordinate)
    : null;
  const myArrived = metersAway !== null && metersAway <= ARRIVED_RADIUS_M;
  const nearMeetingPoint =
    metersAway !== null && metersAway <= CHECK_IN_RADIUS_M;
  const liveById = new Map(liveMembers.map(item => [item.user.id, item]));
  const liveBounds = useLiveBounds(activity, liveMembers, myPosition);
  const [mapExpanded, setMapExpanded] = useState(false);

  const [saved, setSaved] = useState(false);
  const [joining, setJoining] = useState(false);

  const joinedCount = activity.members.length + (joined ? 1 : 0);
  const baseSpots = spotsLeftOf(activity);
  const spotsLeft =
    baseSpots === null ? null : Math.max(baseSpots - (joined ? 1 : 0), 0);
  const full = spotsLeft === 0 && !joined;

  const tiles: { kind: TileKind; value: string; hint: string }[] = [
    completed
      ? {
          kind: 'time',
          value: dateTimeIn(activity.startsInMinutes),
          hint: t('activityDetail.endedAt', { time: endsAt }),
        }
      : live
      ? {
          kind: 'time',
          value: t('activityDetail.timeNow'),
          hint: t('activityDetail.timeUntil', { time: endsAt }),
        }
      : {
          kind: 'time',
          value: t('activityDetail.timeToday', { time: startsAt }),
          hint: t('activityDetail.timeLeft', {
            minutes: activity.startsInMinutes,
          }),
        },
    activity.extraTile,
    {
      kind: 'meetingPoint',
      value: activity.meetingPoint,
      hint: t('home.distanceAway', {
        distance: formatDistance(activity.distanceKm),
      }),
    },
  ];

  const tileColors: Record<TileKind, string> = {
    time: colors.primary,
    pace: colors.success,
    vibe: colors.success,
    meetingPoint: colors.primaryDark,
  };

  const showComingSoon = () =>
    Alert.alert(t('auth.comingSoonTitle'), t('auth.comingSoonMessage'));

  const onShare = () => {
    Share.share({
      message: `${activity.title} • ${activity.meetingPoint} • ${startsAt}`,
    });
  };

  const requestJoin = useJoinActivity();
  const onJoin = () =>
    requestJoin(activity.id, () => {
      setJoining(true);
      setTimeout(() => {
        setJoining(false);
        dispatch(joinActivity(activity.id));
        Alert.alert(
          t('activityDetail.joinedTitle'),
          t('activityDetail.joinedMessage', { title: activity.title }),
        );
      }, JOIN_MS);
    });

  const showOnMap = () => {
    navigation.navigate('Main', {
      screen: 'Home',
      params: { focusActivityId: activity.id, focusKey: Date.now() },
    });
  };

  const onDirections = () => {
    openDirections(activity.coordinate, activity.meetingPoint).catch(() =>
      Alert.alert(t('activityDetail.directionsErrorTitle')),
    );
  };

  const confirm = useConfirm();
  const onLeave = () => {
    confirm({
      icon: 'exit-outline',
      title: t('activityDetail.leaveTitle'),
      message: t('activityDetail.leaveMessage'),
      highlight: {
        emoji: CATEGORY_EMOJI[activity.category],
        title: activity.title,
        subtitle: t('join.conflictTime', { start: startsAt, end: endsAt }),
      },
      cancelLabel: t('activityDetail.leaveStay'),
      confirmLabel: t('activityDetail.leave'),
      onConfirm: () => dispatch(leaveActivity(activity.id)),
    });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <HeaderButton
          icon="chevron-back"
          label={t('auth.back')}
          onPress={navigation.goBack}
          styles={styles}
          color={colors.text}
        />
        <View style={styles.headerCenter}>
          <Text style={styles.headerBrand}>{t('common.appName')}</Text>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {t('activityDetail.title')}
          </Text>
        </View>
        <View style={styles.headerActions}>
          {readOnly ? null : (
            <>
              <HeaderButton
                icon={saved ? 'bookmark' : 'bookmark-outline'}
                label={t(
                  saved ? 'activityDetail.saved' : 'activityDetail.save',
                )}
                onPress={() => setSaved(prev => !prev)}
                styles={styles}
                color={saved ? colors.primary : colors.text}
              />
              <HeaderButton
                icon="share-social-outline"
                label={t('activityDetail.share')}
                onPress={onShare}
                styles={styles}
                color={colors.text}
              />
            </>
          )}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          viewOnly && { paddingBottom: Math.max(insets.bottom, ms(24)) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <MapView
            style={styles.heroMap}
            mapStyle={mapStyleUrl(mapStyle)}
            compass={false}
            logo={false}
            attribution={false}
            dragPan={false}
            touchZoom={false}
            touchRotate={false}
            touchPitch={false}
            doubleTapZoom={false}
          >
            {liveMember ? (
              <>
                <Camera
                  initialViewState={{
                    bounds: liveBounds,
                    padding: {
                      top: ms(56),
                      right: ms(32),
                      bottom: ms(72),
                      left: ms(32),
                    },
                  }}
                />
                <LiveMapMarkers
                  activity={activity}
                  members={liveMembers}
                  myPosition={myPosition}
                  myName={myName}
                  styles={styles}
                />
              </>
            ) : (
              <>
                <Camera
                  initialViewState={{
                    center: activity.coordinate,
                    zoom: HERO_ZOOM,
                  }}
                />
                <Marker
                  id="meeting-point"
                  lngLat={activity.coordinate}
                  anchor="bottom"
                >
                  <View style={styles.pin}>
                    <View style={styles.pinHead}>
                      <Text style={styles.pinEmoji}>
                        {CATEGORY_EMOJI[activity.category]}
                      </Text>
                    </View>
                    <View style={styles.pinTail} />
                  </View>
                </Marker>
              </>
            )}
          </MapView>
          <View style={styles.heroShade} pointerEvents="none" />
          {liveMember || !readOnly ? (
            <Pressable
              style={styles.heroTapArea}
              onPress={liveMember ? () => setMapExpanded(true) : showOnMap}
              accessibilityRole="button"
              accessibilityLabel={
                liveMember
                  ? t('activityDetail.liveMap.expand')
                  : t('activityDetail.viewMap')
              }
            />
          ) : null}

          <View style={styles.heroTop} pointerEvents="none">
            <View style={styles.liveBadge}>
              {completed ? (
                <Icon
                  name="checkmark-done"
                  size={ms(13)}
                  color={colors.textSecondary}
                />
              ) : (
                <PulseDot color={colors.primary} size={ms(7)} />
              )}
              <Text style={styles.liveBadgeText}>
                {completed
                  ? t('activityDetail.completed')
                  : live
                  ? t('activityDetail.happeningNow')
                  : t('activityDetail.startsIn', {
                      count: activity.startsInMinutes,
                    })}
              </Text>
            </View>
            <View style={styles.tagBadge}>
              <Text style={styles.tagBadgeText}>
                {`${CATEGORY_EMOJI[activity.category]} ${activity.tag}`}
              </Text>
            </View>
          </View>

          <View style={styles.heroBottom} pointerEvents="box-none">
            <View style={styles.flexShrink} pointerEvents="none">
              <View style={styles.routeLabelRow}>
                <Icon
                  name="git-branch-outline"
                  size={ms(13)}
                  color={colors.primarySoft}
                />
                <Text style={styles.routeLabel} numberOfLines={1}>
                  {activity.routeLabel}
                </Text>
              </View>
              <Text style={styles.routeName} numberOfLines={2}>
                {activity.routeName}
              </Text>
            </View>
            {canNavigate ? (
              <View style={styles.heroActions}>
                {readOnly ? null : (
                  <Pressable
                    onPress={showOnMap}
                    style={({ pressed }) => [
                      styles.viewMap,
                      pressed && styles.pressed,
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={t('activityDetail.viewMap')}
                  >
                    <Icon
                      name="map-outline"
                      size={ms(16)}
                      color={colors.white}
                    />
                  </Pressable>
                )}
                {liveMember ? (
                  <Pressable
                    onPress={() => setMapExpanded(true)}
                    style={({ pressed }) => [
                      styles.directions,
                      pressed && styles.pressed,
                    ]}
                    accessibilityRole="button"
                  >
                    <Icon name="expand" size={ms(14)} color={colors.white} />
                    <Text style={styles.directionsText}>
                      {t('activityDetail.liveMap.expand')}
                    </Text>
                  </Pressable>
                ) : (
                  <Pressable
                    onPress={onDirections}
                    style={({ pressed }) => [
                      styles.directions,
                      pressed && styles.pressed,
                    ]}
                    accessibilityRole="button"
                  >
                    <Icon name="navigate" size={ms(14)} color={colors.white} />
                    <Text style={styles.directionsText}>
                      {t('activityDetail.directions')}
                    </Text>
                  </Pressable>
                )}
              </View>
            ) : null}
          </View>
        </View>

        {joined ? (
          <View style={styles.joinedBanner}>
            <View style={styles.joinedBannerIcon}>
              <Icon
                name={checkedIn || completed ? 'checkmark' : 'location'}
                size={ms(16)}
                color={colors.white}
              />
            </View>
            <View style={styles.flex}>
              <Text style={styles.joinedBannerTitle}>
                {completed
                  ? t('activityDetail.tookPartTitle')
                  : checkedIn
                  ? t('activityDetail.checkedInTitle')
                  : t('activityDetail.joinedBannerTitle')}
              </Text>
              <Text style={styles.joinedBannerText} numberOfLines={2}>
                {completed
                  ? t('activityDetail.tookPartText', {
                      place: activity.meetingPoint,
                    })
                  : checkedIn
                  ? t('activityDetail.checkedInText', {
                      place: activity.meetingPoint,
                    })
                  : live
                  ? t('activityDetail.joinedBannerLive', {
                      place: activity.meetingPoint,
                    })
                  : t('activityDetail.joinedBannerSoon', {
                      place: activity.meetingPoint,
                      time: startsAt,
                    })}
              </Text>
              {showCheckIn && !nearMeetingPoint ? (
                <Text style={styles.checkInHint} numberOfLines={2}>
                  {metersAway === null
                    ? t('activityDetail.checkInLocating')
                    : t('activityDetail.checkInTooFar', {
                        distance: formatDistance(metersAway / 1000),
                        radius: CHECK_IN_RADIUS_M,
                      })}
                </Text>
              ) : null}
            </View>
            {showCheckIn ? (
              <Pressable
                onPress={() => dispatch(checkIn(activity.id))}
                disabled={!nearMeetingPoint}
                style={({ pressed }) => [
                  styles.checkInButton,
                  !nearMeetingPoint && styles.checkInButtonDisabled,
                  pressed && styles.pressed,
                ]}
                accessibilityRole="button"
                accessibilityState={{ disabled: !nearMeetingPoint }}
              >
                <Icon
                  name="checkmark-done"
                  size={ms(15)}
                  color={colors.white}
                />
                <Text style={styles.checkInText}>
                  {t('activityDetail.checkIn')}
                </Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}

        <View style={styles.card}>
          <View style={styles.titleBlock}>
            <View style={styles.metaRow}>
              {activity.instantMatch ? (
                <View style={styles.instantBadge}>
                  <Icon name="flash" size={ms(11)} color={colors.primary} />
                  <Text style={styles.instantText}>
                    {t('activityDetail.instantMatch')}
                  </Text>
                </View>
              ) : null}
              <Text style={styles.mutedText}>
                {t('activityDetail.createdAt', {
                  time: clockIn(-activity.createdMinutesAgo),
                })}
              </Text>
            </View>
            <Text style={styles.title}>{activity.title}</Text>
          </View>

          <View style={styles.hostStrip}>
            <View style={styles.hostInfo}>
              <View>
                <Image source={host.avatar} style={styles.hostAvatar} />
                <View style={styles.onlineDot} />
              </View>
              <View style={styles.flexShrink}>
                <View style={styles.hostNameRow}>
                  <Text style={styles.hostName} numberOfLines={1}>
                    {t('activityDetail.hostName', { name: host.name })}
                  </Text>
                  <View style={styles.trustBadge}>
                    <Icon
                      name="shield-checkmark"
                      size={ms(10)}
                      color={colors.card}
                    />
                    <Text style={styles.trustText}>
                      {t('activityDetail.trust', { value: host.trust })}
                    </Text>
                  </View>
                </View>
                <Text
                  style={[styles.mutedText, styles.subline]}
                  numberOfLines={1}
                >
                  {t('activityDetail.activitiesLed', {
                    count: host.activitiesCount,
                  })}
                </Text>
              </View>
            </View>
            {readOnly ? null : (
              <Pressable
                onPress={showComingSoon}
                style={({ pressed }) => [
                  styles.messageButton,
                  pressed && styles.pressed,
                ]}
                accessibilityRole="button"
              >
                <ChatTeardropDotsIcon
                  size={ms(15)}
                  weight="fill"
                  color={colors.textMuted}
                />
                <Text style={styles.messageText}>
                  {t('activityDetail.message')}
                </Text>
              </Pressable>
            )}
          </View>

          <View style={styles.tiles}>
            {tiles.map(tile => (
              <View key={tile.kind} style={styles.tile}>
                <View style={styles.tileLabelRow}>
                  <Icon
                    name={TILE_ICONS[tile.kind]}
                    size={ms(14)}
                    color={tileColors[tile.kind]}
                  />
                  <Text
                    style={[styles.tileLabel, { color: tileColors[tile.kind] }]}
                    numberOfLines={1}
                  >
                    {t(`activityDetail.tiles.${tile.kind}`)}
                  </Text>
                </View>
                <Text style={styles.tileValue} numberOfLines={1}>
                  {tile.value}
                </Text>
                <Text style={styles.tileHint} numberOfLines={1}>
                  {tile.hint}
                </Text>
              </View>
            ))}
          </View>

          <Text style={styles.description}>{activity.longDescription}</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Text style={styles.sectionTitle}>
                {t('activityDetail.participants')}
              </Text>
              <View style={styles.countPill}>
                <Text style={styles.countPillText}>
                  {activity.capacity && upcoming
                    ? t('activityDetail.peopleOf', {
                        count: joinedCount,
                        capacity: activity.capacity,
                      })
                    : t('activityDetail.people', { count: joinedCount })}
                </Text>
              </View>
            </View>
            {spotsLeft !== null && upcoming ? (
              <Text style={styles.spotsText}>
                {spotsLeft > 0
                  ? t('activityDetail.spotsLeft', { count: spotsLeft })
                  : t('activityDetail.full')}
              </Text>
            ) : null}
          </View>

          {activity.capacity && upcoming ? (
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${Math.min(
                      (joinedCount / activity.capacity) * 100,
                      100,
                    )}%`,
                  },
                ]}
              />
            </View>
          ) : null}

          <View>
            {activity.members.map((member, i) => {
              const person = getUser(member.userId);
              const tracked = liveMember ? liveById.get(member.userId) : null;
              const statusLine = completed
                ? t('activityDetail.youTookPart')
                : tracked
                ? tracked.arrived
                  ? t('activityDetail.liveMap.arrived')
                  : t('activityDetail.liveMap.away', {
                      distance: formatDistance(tracked.metersAway / 1000),
                    })
                : member.status;
              const ready = tracked ? tracked.ready : member.ready;
              return (
                <View
                  key={member.userId}
                  style={[styles.personRow, i > 0 && styles.personDivider]}
                >
                  <Image source={person.avatar} style={styles.personAvatar} />
                  <View style={styles.personBody}>
                    <View style={styles.personNameRow}>
                      <Text style={styles.personName} numberOfLines={1}>
                        {person.name}
                      </Text>
                      {member.userId === activity.hostId ? (
                        <View style={styles.hostBadge}>
                          <Text style={styles.hostBadgeText}>
                            {t('activityDetail.hostBadge')}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                    <Text style={styles.mutedText} numberOfLines={1}>
                      {statusLine}
                    </Text>
                  </View>
                  {ready && !completed ? (
                    <View style={styles.readyRow}>
                      <Icon
                        name="checkmark-circle-outline"
                        size={ms(14)}
                        color={colors.success}
                      />
                      <Text style={styles.readyText}>
                        {t('activityDetail.ready')}
                      </Text>
                    </View>
                  ) : null}
                </View>
              );
            })}
            {joined ? (
              <View style={[styles.personRow, styles.personDivider]}>
                <View style={[styles.personAvatar, styles.meAvatar]}>
                  <Text style={styles.meAvatarText}>{initialsOf(myName)}</Text>
                </View>
                <View style={styles.personBody}>
                  <View style={styles.personNameRow}>
                    <Text style={styles.personName} numberOfLines={1}>
                      {myName}
                    </Text>
                    <View style={styles.meBadge}>
                      <Text style={styles.meBadgeText}>
                        {t('activityDetail.you')}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.mutedText} numberOfLines={1}>
                    {completed
                      ? t('activityDetail.youTookPart')
                      : checkedIn
                      ? t('activityDetail.youCheckedIn')
                      : live && myArrived
                      ? t('activityDetail.liveMap.arrived')
                      : live && metersAway !== null
                      ? t('activityDetail.liveMap.away', {
                          distance: formatDistance(metersAway / 1000),
                        })
                      : t('activityDetail.youJustJoined')}
                  </Text>
                </View>
                {completed || (live && !checkedIn) ? null : (
                  <View style={styles.readyRow}>
                    <Icon
                      name="checkmark-circle-outline"
                      size={ms(14)}
                      color={colors.success}
                    />
                    <Text style={styles.readyText}>
                      {t('activityDetail.ready')}
                    </Text>
                  </View>
                )}
              </View>
            ) : null}
          </View>
        </View>

        {nearby.length > 0 ? (
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Text style={styles.sectionTitleLarge}>
                {t('activityDetail.nearbyFree')}
              </Text>
              <View style={styles.mutedPill}>
                <Text style={styles.mutedPillText}>
                  {t('activityDetail.matches', { count: nearby.length })}
                </Text>
              </View>
            </View>
            <Pressable
              onPress={() =>
                navigation.navigate('FreeNearbyList', {
                  activityId: activity.id,
                })
              }
              hitSlop={8}
              accessibilityRole="button"
            >
              <Text style={styles.seeMore}>{t('activityDetail.seeMore')}</Text>
            </Pressable>
          </View>
        ) : null}

        {nearby.slice(0, NEARBY_PREVIEW).map(person => (
          <NearbyCard
            key={person.id}
            person={person}
            activityId={activity.id}
            canInvite={canInviteTo(activity)}
            onMessage={showComingSoon}
            styles={styles}
          />
        ))}
      </ScrollView>

      {viewOnly ? null : (
        <View
          style={[
            styles.footer,
            { paddingBottom: Math.max(insets.bottom, ms(12)) },
          ]}
        >
          {joined ? (
            <>
              {readOnly ? null : (
                <Pressable
                  onPress={onLeave}
                  style={({ pressed }) => [
                    styles.leaveButton,
                    pressed && styles.pressed,
                  ]}
                  accessibilityRole="button"
                >
                  <Icon
                    name="exit-outline"
                    size={ms(18)}
                    color={colors.danger}
                  />
                  <Text style={styles.leaveText}>
                    {t('activityDetail.leave')}
                  </Text>
                </Pressable>
              )}
              <Pressable
                onPress={() =>
                  navigation.navigate('GroupChat', { activityId: activity.id })
                }
                style={({ pressed }) => [
                  styles.joinButton,
                  styles.joinButtonDone,
                  pressed && styles.pressed,
                ]}
                accessibilityRole="button"
                accessibilityHint={
                  unreadChat > 0
                    ? t('chat.unread', { count: unreadChat })
                    : undefined
                }
              >
                <ChatTeardropDotsIcon
                  size={ms(20)}
                  weight="fill"
                  color={colors.white}
                />
                <Text style={styles.joinText} numberOfLines={1}>
                  {completed
                    ? t('activityDetail.reviewGroupChat')
                    : t('activityDetail.openGroupChat')}
                </Text>
                {unreadChat > 0 && !completed ? (
                  <View
                    style={[
                      styles.chatBadge,
                      chatMuted && styles.chatBadgeMuted,
                    ]}
                  >
                    <Text style={styles.chatBadgeText}>
                      {unreadChat > 99 ? '99+' : unreadChat}
                    </Text>
                  </View>
                ) : null}
              </Pressable>
            </>
          ) : readOnly ? (
            <View style={styles.statusNote}>
              <Icon
                name={completed ? 'checkmark-done' : 'pulse-outline'}
                size={ms(18)}
                color={completed ? colors.textSecondary : colors.success}
              />
              <Text style={styles.statusNoteText}>
                {completed
                  ? t('activityDetail.completedNote')
                  : t('activityDetail.ongoingNote')}
              </Text>
            </View>
          ) : (
            <Pressable
              onPress={onJoin}
              disabled={joining || full}
              style={({ pressed }) => [
                styles.joinButton,
                full && styles.joinButtonDisabled,
                pressed && styles.pressed,
              ]}
              accessibilityRole="button"
              accessibilityState={{ busy: joining, disabled: full }}
            >
              <View style={styles.joinLabel}>
                <Icon name="person-add" size={ms(18)} color={colors.white} />
                <Text style={styles.joinText} numberOfLines={1}>
                  {joining
                    ? t('activityDetail.joining')
                    : t('activityDetail.joinNow')}
                </Text>
              </View>
              {spotsLeft !== null && spotsLeft > 0 ? (
                <View style={styles.joinPill}>
                  <Text style={styles.joinPillText}>
                    {t('activityDetail.lastSpots', { count: spotsLeft })}
                  </Text>
                </View>
              ) : null}
            </Pressable>
          )}
        </View>
      )}

      {liveMember ? (
        <LiveMapModal
          visible={mapExpanded}
          onClose={() => setMapExpanded(false)}
          activity={activity}
          members={liveMembers}
          myPosition={myPosition}
          myReady={checkedIn}
          myCourse={myCourse}
          myName={myName}
          mapStyle={mapStyle}
          markerStyles={styles}
        />
      ) : null}
    </SafeAreaView>
  );
}

function HeaderButton({
  icon,
  label,
  onPress,
  color,
  styles,
}: {
  icon: string;
  label: string;
  onPress: () => void;
  color: string;
  styles: ActivityDetailStyles;
}) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => [styles.headerButton, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Icon name={icon} size={ms(19)} color={color} />
    </Pressable>
  );
}
