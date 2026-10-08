import {
  memo,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Alert,
  Animated,
  Easing,
  Image,
  Keyboard,
  Linking,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  type ScrollViewInstance,
  type TextInputInstance,
} from 'react-native';
import {
  Camera,
  type CameraRef,
  LocationManager,
  type LngLat,
  Map as MapView,
  Marker,
  useCurrentPosition,
} from '@maplibre/maplibre-react-native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps } from '@react-navigation/native';
import type {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import Reanimated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/Ionicons';
import { ms } from 'react-native-size-matters';

import {
  isLiquidGlassSupported,
  LiquidGlassView,
} from '@callstack/liquid-glass';
import AppHeader from '@/components/AppHeader';
import BottomSheet from '@/components/BottomSheet';
import { useTabBarInset } from '@/components/LiquidTabBar';
import PulseDot from '@/components/PulseDot';
import { useCompassHeading } from '@/hooks/useCompassHeading';
import { useJoinActivity } from '@/hooks/useJoinActivity';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { joinActivity } from '@/store/slices/activitySlice';
import { setMapStyle } from '@/store/slices/appSlice';
import { darkColors, lightColors, useTheme } from '@/theme';
import type { MapStyleId } from '@/types/map';
import type { MainTabParamList, RootStackParamList } from '@/types/navigation';
import {
  defaultMapStyle,
  isDarkMapStyle,
  mapStyleUrl,
} from '@/utils/mapStyles';

import {
  ACTIVITIES,
  activityStatus,
  CATEGORY_EMOJI,
  getUser,
  isBrowsable,
  isJoined,
} from '@/services/mockData';
import type { Activity } from '@/types/activity';
import { clockIn, formatDistance } from '@/utils/format';

import {
  CATEGORY_IDS,
  boundsOf,
  centerOf,
  createClusterer,
  pixelOffset,
  type CategoryId,
  type MarkerEntry,
} from './data';
import MapStylePicker from './MapStylePicker';
import MarkerAppear from './MarkerAppear';
import UserPuck from './UserPuck';
import { createStyles, type HomeStyles } from './styles';

const COLLAPSED_RATIO = 0.4;
const COLLAPSED_PEEK = ms(150);
const FIT_PADDING = {
  top: ms(56),
  right: ms(96),
  bottom: ms(24),
  left: ms(80),
};
const SHEET_GAP = ms(6);
const OSM_COPYRIGHT_URL = 'https://www.openstreetmap.org/copyright';
const LOCATE_ZOOM = 15.5;
const FOCUS_ZOOM = 16.5;
/** Until the first region event reports the real zoom. */
const INITIAL_ZOOM = 13;
const MAX_CLUSTER_EMOJIS = 3;
/** Slightly longer than the native stack's pop animation. */
const FOCUS_FALLBACK_MS = 600;
/** m/s; below this the GPS course is too noisy to use as a heading. */
const MIN_COURSE_SPEED = 0.5;
const ROTATION_RANGE = 36000;
/** Roughly 5 km; farther positions would zoom the overview out too much. */
const NEARBY_DEGREES = 0.05;
/** Completed and full activities never appear on Home. */
const BROWSABLE = ACTIVITIES.filter(isBrowsable);
const SPOTS: LngLat[] = BROWSABLE.map(activity => activity.coordinate);
const SPOTS_BOUNDS = boundsOf(SPOTS);
const SPOTS_CENTER = centerOf(SPOTS);
const MAX_AVATARS = 3;

interface ChipLayout {
  x: number;
  width: number;
}

function ActivityMarker({
  activity,
  joined,
  focused,
  styles,
}: {
  activity: Activity;
  joined: boolean;
  focused: boolean;
  styles: HomeStyles;
}) {
  const { t } = useTranslation();
  const live = activityStatus(activity) === 'ongoing';
  const people = activity.members.length;

  return (
    <View style={[styles.markerWrap, focused && styles.markerFocused]}>
      <View
        style={[
          styles.markerPill,
          joined && styles.markerPillJoined,
          focused && styles.markerPillFocused,
        ]}
      >
        <View>
          <Image
            source={getUser(activity.hostId).avatar}
            style={styles.markerAvatar}
          />
          <View style={[styles.markerEmoji, live && styles.markerEmojiLive]}>
            <Text style={styles.markerEmojiText}>
              {CATEGORY_EMOJI[activity.category]}
            </Text>
          </View>
        </View>
        <View>
          <Text
            style={[
              styles.markerStatus,
              live ? styles.liveText : styles.soonText,
            ]}
          >
            {live && joined
              ? t('home.markerJoinedNow', { people })
              : live
              ? t('home.markerNow', { people })
              : t('home.markerSoon', {
                  minutes: activity.startsInMinutes,
                  people,
                })}
          </Text>
          <Text style={styles.markerTitle} numberOfLines={1}>
            {activity.markerTitle}
          </Text>
        </View>
      </View>
      <View style={[styles.markerTip, focused && styles.markerTipFocused]} />
    </View>
  );
}

const ActivityCard = memo(function ActivityCardView({
  activity,
  joined,
  styles,
  onPress,
  onJoin,
}: {
  activity: Activity;
  joined: boolean;
  styles: HomeStyles;
  onPress: (activityId: string) => void;
  onJoin: (activityId: string) => void;
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const live = activityStatus(activity) === 'ongoing';
  const host = getUser(activity.hostId);
  const memberCount = activity.members.length + (joined ? 1 : 0);

  return (
    <Pressable
      onPress={() => onPress(activity.id)}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      accessibilityRole="button"
      accessibilityLabel={activity.title}
    >
      <View style={styles.cardTop}>
        <View style={styles.cardHost}>
          <Image source={host.avatar} style={styles.hostAvatar} />
          <View style={styles.flexShrink}>
            <Text style={styles.hostName}>{host.name}</Text>
            <View style={styles.whenRow}>
              <Icon
                name={live ? 'pulse-outline' : 'time-outline'}
                size={ms(13)}
                color={colors.textSecondary}
              />
              <Text
                style={[
                  styles.whenText,
                  live ? styles.liveText : styles.soonText,
                ]}
              >
                {live
                  ? t('home.whenNow', {
                      time: clockIn(
                        activity.startsInMinutes + activity.durationMinutes,
                      ),
                    })
                  : t('home.whenSoon', {
                      time: clockIn(activity.startsInMinutes),
                      minutes: activity.startsInMinutes,
                    })}
              </Text>
            </View>
          </View>
        </View>
        <View style={[styles.tag, !joined && styles.tagHighlight]}>
          <Text style={styles.tagEmoji}>
            {CATEGORY_EMOJI[activity.category]}
          </Text>
          <Text style={[styles.tagText, !joined && styles.tagTextHighlight]}>
            {activity.tag}
          </Text>
        </View>
      </View>

      <View>
        <Text style={styles.cardTitle}>{activity.title}</Text>
        <Text style={styles.cardDescription} numberOfLines={1}>
          {activity.description}
        </Text>
      </View>

      <View style={styles.cardBottom}>
        <View style={styles.cardMeta}>
          <View style={styles.avatarStack}>
            {activity.members.slice(0, MAX_AVATARS).map((member, i) => (
              <Image
                key={member.userId}
                source={getUser(member.userId).avatar}
                style={[styles.participant, i > 0 && styles.participantOverlap]}
              />
            ))}
          </View>
          <View style={styles.metaInfo}>
            <Text style={styles.metaText} numberOfLines={1}>
              {activity.capacity
                ? t('home.joinedOf', {
                    count: memberCount,
                    capacity: activity.capacity,
                  })
                : t('home.joined', { count: memberCount })}
            </Text>
            <View style={styles.distanceRow}>
              <Icon
                name="location-outline"
                size={ms(11)}
                color={colors.textSecondary}
              />
              <Text style={styles.distanceText} numberOfLines={1}>
                {t('home.distanceAway', {
                  distance: formatDistance(activity.distanceKm),
                })}
              </Text>
            </View>
          </View>
        </View>
        {joined ? (
          <Pressable
            onPress={() => onPress(activity.id)}
            style={({ pressed }) => [
              styles.joinedButton,
              pressed && styles.pressed,
            ]}
            accessibilityRole="button"
          >
            {live ? (
              <PulseDot color={colors.white} size={ms(6)} />
            ) : (
              <Icon
                name="checkmark-circle"
                size={ms(14)}
                color={colors.white}
              />
            )}
            <Text style={styles.joinedText}>
              {live ? t('home.joinedLiveBadge') : t('home.joinedBadge')}
            </Text>
          </Pressable>
        ) : live ? (
          <View style={styles.ongoingPill}>
            <PulseDot color={colors.success} size={ms(6)} />
            <Text style={styles.ongoingText}>{t('home.ongoingBadge')}</Text>
          </View>
        ) : (
          <Pressable
            onPress={() => onJoin(activity.id)}
            style={({ pressed }) => [
              styles.joinButton,
              pressed && styles.pressed,
            ]}
            accessibilityRole="button"
          >
            <Text style={styles.joinText}>{t('home.join')}</Text>
          </Pressable>
        )}
      </View>
    </Pressable>
  );
});

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Home'>,
  NativeStackScreenProps<RootStackParamList>
>;

export default function HomeScreen({ navigation, route }: Props) {
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const tabBarInset = useTabBarInset();
  const [bodyHeight, setBodyHeight] = useState(0);
  const [overlayHeight, setOverlayHeight] = useState(0);
  const expandedHeight = Math.max(bodyHeight - overlayHeight - SHEET_GAP, 0);
  const collapsedHeight = Math.min(
    Math.max(bodyHeight * COLLAPSED_RATIO, tabBarInset + COLLAPSED_PEEK),
    expandedHeight,
  );
  const collapsedOffset = expandedHeight - collapsedHeight;
  const layoutReady = bodyHeight > 0 && overlayHeight > 0;
  const sheetY = useSharedValue(0);
  const [sheetReady, setSheetReady] = useState(false);

  useLayoutEffect(() => {
    if (layoutReady && !sheetReady) {
      sheetY.value = collapsedOffset;
      setSheetReady(true);
    }
  }, [layoutReady, sheetReady, sheetY, collapsedOffset]);
  // Liquid glass stops rendering under a translucent ancestor, so the HUD
  // shrinks away as the sheet expands instead of fading.
  const hudStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: sheetY.value - collapsedOffset },
      {
        scale: interpolate(
          sheetY.value,
          [0, collapsedOffset * 0.6, collapsedOffset || 1],
          [0, 0, 1],
          Extrapolation.CLAMP,
        ),
      },
    ],
  }));

  const cameraRef = useRef<CameraRef>(null);
  const dispatch = useAppDispatch();
  const mapStyle =
    useAppSelector(state => state.app.mapStyle) ?? defaultMapStyle(isDark);
  const joinedIds = useAppSelector(state => state.activity.joinedIds);
  const [stylePickerOpen, setStylePickerOpen] = useState(false);
  const mapDark = isDarkMapStyle(mapStyle);
  const mapColors = mapDark ? darkColors : lightColors;
  const hudScheme = mapDark ? 'dark' : 'light';
  const [tracking, setTracking] = useState(false);
  const position = useCurrentPosition();
  const userLngLat = useMemo<LngLat | undefined>(
    () =>
      position
        ? [position.coords.longitude, position.coords.latitude]
        : undefined,
    [position],
  );
  const compassHeading = useCompassHeading();
  const course =
    position?.coords.heading != null &&
    (position.coords.speed ?? 0) > MIN_COURSE_SPEED
      ? position.coords.heading
      : null;
  const heading = compassHeading ?? course;

  const headingAnim = useRef(new Animated.Value(0)).current;
  const bearingAnim = useRef(new Animated.Value(0)).current;
  const lastHeading = useRef<number | null>(null);
  const puckRotation = useMemo(
    () =>
      Animated.subtract(headingAnim, bearingAnim).interpolate({
        inputRange: [-ROTATION_RANGE, ROTATION_RANGE],
        outputRange: [`-${ROTATION_RANGE}deg`, `${ROTATION_RANGE}deg`],
      }),
    [headingAnim, bearingAnim],
  );

  useEffect(() => {
    if (heading == null) {
      return;
    }
    const previous = lastHeading.current;
    // Turn through the shortest arc so 359° → 1° doesn't spin a full circle.
    const next =
      previous == null
        ? heading
        : previous + ((((heading - previous) % 360) + 540) % 360) - 180;
    lastHeading.current = next;
    Animated.timing(headingAnim, {
      toValue: next,
      duration: 200,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [heading, headingAnim]);
  const userNearby =
    !!userLngLat &&
    Math.abs(userLngLat[0] - SPOTS_BOUNDS[0]) < NEARBY_DEGREES &&
    Math.abs(userLngLat[1] - SPOTS_BOUNDS[1]) < NEARBY_DEGREES;

  useEffect(() => {
    LocationManager.requestPermissions();
  }, []);
  const [category, setCategory] = useState<CategoryId>('all');
  /** Activity opened from Activity Detail's map; highlighted until another chip is picked. */
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const chipsRef = useRef<ScrollViewInstance>(null);
  const chipsViewport = useRef(0);
  const chipsContent = useRef(0);
  const chipLayouts = useRef<Partial<Record<CategoryId, ChipLayout>>>({});

  const selectCategory = (id: CategoryId) => {
    setCategory(id);
    setFocusedId(null);
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
  const searchRef = useRef<TextInputInstance>(null);
  // Set by the input's own touch, which bubbles before the screen's handler.
  const touchingSearch = useRef(false);

  const activities = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return BROWSABLE.filter(
      activity =>
        (category === 'all' || activity.category === category) &&
        (!needle || activity.title.toLowerCase().includes(needle)),
    );
  }, [category, query]);
  /** Whole zoom level: clusters only change when the map crosses a level. */
  const [zoomLevel, setZoomLevel] = useState(INITIAL_ZOOM);
  // The focused activity always keeps its own marker.
  const focusedActivity = activities.find(
    activity => activity.id === focusedId,
  );
  const clusterer = useMemo(
    () =>
      createClusterer(activities.filter(activity => activity.id !== focusedId)),
    [activities, focusedId],
  );
  const markerEntries = useMemo<MarkerEntry<Activity>[]>(
    () => [
      ...clusterer.entriesAt(zoomLevel),
      ...(focusedActivity
        ? [{ kind: 'single' as const, item: focusedActivity }]
        : []),
    ],
    [clusterer, zoomLevel, focusedActivity],
  );

  // Markers that just split out of a cluster glide out from where that cluster was.
  const exactZoom = useRef(INITIAL_ZOOM);
  const previousClusterOf = useRef(new Map<string, LngLat>());
  const appearOrigins = useMemo(() => {
    const origins = new Map<string, { x: number; y: number }>();
    for (const entry of markerEntries) {
      const clusterCenter =
        entry.kind === 'single'
          ? previousClusterOf.current.get(entry.item.id)
          : undefined;
      if (entry.kind === 'single' && clusterCenter) {
        origins.set(
          entry.item.id,
          pixelOffset(clusterCenter, entry.item.coordinate, exactZoom.current),
        );
      }
    }
    return origins;
  }, [markerEntries]);
  useEffect(() => {
    const next = new Map<string, LngLat>();
    for (const entry of markerEntries) {
      if (entry.kind === 'cluster') {
        entry.items.forEach(item => next.set(item.id, entry.center));
      }
    }
    previousClusterOf.current = next;
  }, [markerEntries]);

  const expandCluster = (clusterId: number, center: LngLat) => {
    setTracking(false);
    cameraRef.current?.flyTo({
      center,
      zoom: clusterer.expansionZoom(clusterId),
      padding: { top: overlayHeight, bottom: collapsedHeight },
      duration: 600,
    });
  };

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

  const showSpots = useCallback(() => {
    setTracking(false);
    cameraRef.current?.fitBounds(
      userNearby && userLngLat
        ? boundsOf([...SPOTS, userLngLat])
        : SPOTS_BOUNDS,
      {
        padding: {
          top: overlayHeight + FIT_PADDING.top,
          right: FIT_PADDING.right,
          bottom: collapsedHeight + FIT_PADDING.bottom,
          left: FIT_PADDING.left,
        },
        duration: 600,
      },
    );
  }, [userNearby, userLngLat, overlayHeight, collapsedHeight]);

  const locateMe = () => {
    if (!userLngLat) {
      showSpots();
      return;
    }
    setTracking(false);
    cameraRef.current?.flyTo({
      center: userLngLat,
      zoom: LOCATE_ZOOM,
      padding: { top: overlayHeight, bottom: collapsedHeight },
      duration: 800,
    });
  };

  const selectMapStyle = (id: MapStyleId) => {
    dispatch(setMapStyle(id));
    setStylePickerOpen(false);
  };

  const toggleHeading = () => {
    if (tracking) {
      setTracking(false);
      cameraRef.current?.setStop({ bearing: 0, duration: 400 });
      return;
    }
    if (!userLngLat) {
      return;
    }
    setTracking(true);
    cameraRef.current?.flyTo({
      center: userLngLat,
      zoom: LOCATE_ZOOM,
      bearing: heading ?? 0,
      padding: { top: overlayHeight, bottom: collapsedHeight },
      duration: 800,
    });
  };

  useEffect(() => {
    if (!tracking || !userLngLat) {
      return;
    }
    cameraRef.current?.easeTo({
      center: userLngLat,
      bearing: heading ?? undefined,
      padding: { top: overlayHeight, bottom: collapsedHeight },
      duration: 400,
    });
  }, [tracking, userLngLat, heading, overlayHeight, collapsedHeight]);

  const focusKey = route.params?.focusKey;
  useEffect(() => {
    const target = BROWSABLE.find(
      activity => activity.id === route.params?.focusActivityId,
    );
    if (!focusKey || !target) {
      return;
    }
    if (category !== 'all' && category !== target.category) {
      selectCategory('all');
    }
    if (!target.title.toLowerCase().includes(query.trim().toLowerCase())) {
      setQuery('');
    }
    setFocusedId(target.id);
    setTracking(false);
    sheetY.value = withTiming(collapsedOffset, { duration: 250 });
    // The map ignores camera moves while the detail screen is still popping off,
    // so wait for the stack transition (or a fallback when there is none).
    let done = false;
    const flyToTarget = () => {
      if (done) {
        return;
      }
      done = true;
      cameraRef.current?.flyTo({
        center: target.coordinate,
        zoom: FOCUS_ZOOM,
        padding: { top: overlayHeight, bottom: collapsedHeight },
        duration: 900,
      });
    };
    const unsubscribe = navigation
      .getParent<NativeStackNavigationProp<RootStackParamList>>()
      ?.addListener('transitionEnd', flyToTarget);
    const timer = setTimeout(flyToTarget, FOCUS_FALLBACK_MS);
    return () => {
      done = true;
      unsubscribe?.();
      clearTimeout(timer);
    };
    // Run once per focus request; the rest is read at that moment.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusKey]);

  useEffect(() => {
    if (overlayHeight && collapsedHeight) {
      showSpots();
    }
    // Refit only when the visible map area changes, not when the GPS moves.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [overlayHeight, collapsedHeight]);

  return (
    <View
      style={styles.safe}
      onTouchStart={() => {
        if (touchingSearch.current) {
          touchingSearch.current = false;
        } else if (searchRef.current?.isFocused()) {
          Keyboard.dismiss();
        }
      }}
    >
      <AppHeader
        onLocationPress={showSpots}
        onNotificationsPress={showComingSoon}
        onProfilePress={() => navigation.navigate('Profile')}
      />

      <View
        style={styles.body}
        onLayout={event => setBodyHeight(event.nativeEvent.layout.height)}
      >
        <MapView
          style={styles.map}
          mapStyle={mapStyleUrl(mapStyle)}
          tintColor={colors.primary}
          compass={false}
          logo={false}
          attribution={false}
          touchPitch={false}
          onDidFinishLoadingMap={showSpots}
          onRegionWillChange={event => {
            if (event.nativeEvent.userInteraction) {
              setTracking(false);
            }
          }}
          onRegionIsChanging={event =>
            bearingAnim.setValue(event.nativeEvent.bearing)
          }
          onRegionDidChange={event => {
            bearingAnim.setValue(event.nativeEvent.bearing);
            exactZoom.current = event.nativeEvent.zoom;
            setZoomLevel(Math.floor(event.nativeEvent.zoom));
          }}
        >
          <Camera
            ref={cameraRef}
            initialViewState={{ bounds: SPOTS_BOUNDS, padding: FIT_PADDING }}
          />
          {markerEntries.map(entry => {
            if (entry.kind === 'single') {
              const activity = entry.item;
              return (
                <Marker
                  key={activity.id}
                  id={activity.id}
                  lngLat={activity.coordinate}
                  anchor="bottom"
                  onPress={() => {
                    setFocusedId(activity.id);
                    openActivity(activity.id);
                  }}
                >
                  <MarkerAppear from={appearOrigins.get(activity.id)}>
                    <ActivityMarker
                      activity={activity}
                      joined={isJoined(activity, joinedIds)}
                      focused={activity.id === focusedId}
                      styles={styles}
                    />
                  </MarkerAppear>
                </Marker>
              );
            }
            const emojis = [
              ...new Set(
                entry.items.map(item => CATEGORY_EMOJI[item.category]),
              ),
            ].slice(0, MAX_CLUSTER_EMOJIS);
            return (
              <Marker
                key={`cluster-${entry.clusterId}`}
                id={`cluster-${entry.clusterId}`}
                lngLat={entry.center}
                anchor="bottom"
                onPress={() => expandCluster(entry.clusterId, entry.center)}
              >
                <MarkerAppear>
                  <View style={styles.markerWrap}>
                    <View style={styles.cluster}>
                      <Text style={styles.clusterEmoji}>{emojis.join('')}</Text>
                      <Text style={styles.clusterText}>
                        {t('home.spots', { count: entry.items.length })}
                      </Text>
                    </View>
                    <View style={[styles.markerTip, styles.clusterTip]} />
                  </View>
                </MarkerAppear>
              </Marker>
            );
          })}
          {userLngLat ? (
            <Marker id="user-location" lngLat={userLngLat} anchor="center">
              <UserPuck
                color={colors.primary}
                rotation={heading == null ? null : puckRotation}
              />
            </Marker>
          ) : null}
        </MapView>

        <View
          style={styles.mapOverlay}
          pointerEvents="box-none"
          onLayout={event => setOverlayHeight(event.nativeEvent.layout.height)}
        >
          <LiquidGlassView
            colorScheme={hudScheme}
            style={[
              styles.search,
              !isLiquidGlassSupported && [
                styles.floatingFallback,
                { backgroundColor: mapColors.card },
              ],
            ]}
          >
            <Icon name="search" size={ms(20)} color={mapColors.textSecondary} />
            <View style={styles.searchBody}>
              <TextInput
                ref={searchRef}
                onTouchStart={() => {
                  touchingSearch.current = true;
                }}
                value={query}
                onChangeText={setQuery}
                placeholder={t('home.searchPlaceholder')}
                placeholderTextColor={mapColors.text}
                selectionColor={colors.primary}
                style={[styles.searchInput, { color: mapColors.text }]}
                returnKeyType="search"
                accessibilityLabel={t('home.searchPlaceholder')}
              />
              <View style={styles.locationRow}>
                <View style={styles.locationDot} />
                <Text
                  style={[
                    styles.locationText,
                    { color: mapColors.textSecondary },
                  ]}
                  numberOfLines={1}
                >
                  {t('home.currentLocation', { place: 'West Lake, Hanoi' })}
                </Text>
              </View>
            </View>
            <Pressable
              onPress={locateMe}
              hitSlop={6}
              style={[
                styles.locateButton,
                { backgroundColor: `${mapColors.text}14` },
              ]}
              accessibilityRole="button"
              accessibilityLabel={t('home.myLocation')}
            >
              <Icon
                name="locate-outline"
                size={ms(18)}
                color={mapColors.text}
              />
              <View
                style={[styles.locateDot, { backgroundColor: mapColors.text }]}
              />
            </Pressable>
          </LiquidGlassView>

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
            {CATEGORY_IDS.map(id => {
              const selected = id === category;
              const emoji = id === 'all' ? undefined : CATEGORY_EMOJI[id];
              return (
                <LiquidGlassView
                  key={id}
                  onLayout={event => {
                    const { x, width } = event.nativeEvent.layout;
                    chipLayouts.current[id] = { x, width };
                  }}
                  interactive
                  tintColor={selected ? colors.primary : undefined}
                  colorScheme={hudScheme}
                  style={[
                    styles.chip,
                    !isLiquidGlassSupported &&
                      (selected
                        ? styles.chipSelected
                        : { backgroundColor: mapColors.card }),
                  ]}
                >
                  <Pressable
                    onPress={() => selectCategory(id)}
                    style={styles.chipPressable}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                  >
                    {emoji ? (
                      <Text style={styles.chipEmoji}>{emoji}</Text>
                    ) : null}
                    <Text
                      style={[
                        styles.chipText,
                        { color: mapColors.text },
                        selected && styles.chipTextSelected,
                      ]}
                    >
                      {t(`home.categories.${id}`)}
                    </Text>
                    {selected && id === 'all' ? (
                      <View style={styles.chipDot} />
                    ) : null}
                  </Pressable>
                </LiquidGlassView>
              );
            })}
          </ScrollView>
        </View>

        <Text
          style={[
            styles.attribution,
            {
              bottom: collapsedHeight + ms(2),
              color: mapColors.textSecondary,
            },
          ]}
          onPress={() => Linking.openURL(OSM_COPYRIGHT_URL)}
          accessibilityRole="link"
        >
          © OpenStreetMap
        </Text>

        {sheetReady ? (
          <Reanimated.View
            style={[styles.hud, { bottom: collapsedHeight + ms(12) }, hudStyle]}
          >
            <LiquidGlassView
              interactive
              colorScheme={hudScheme}
              style={[
                styles.hudButton,
                !isLiquidGlassSupported && [
                  styles.hudFallback,
                  { backgroundColor: mapColors.card },
                ],
              ]}
            >
              <Pressable
                onPress={() => setStylePickerOpen(true)}
                style={styles.hudPressable}
                accessibilityRole="button"
                accessibilityLabel={t('home.mapStyle')}
              >
                <Icon
                  name="layers-outline"
                  size={ms(18)}
                  color={mapColors.text}
                />
              </Pressable>
            </LiquidGlassView>
            <LiquidGlassView
              interactive
              tintColor={tracking ? colors.primary : undefined}
              colorScheme={hudScheme}
              style={[
                styles.hudButton,
                !isLiquidGlassSupported &&
                  (tracking
                    ? styles.hudButtonActive
                    : [
                        styles.hudFallback,
                        { backgroundColor: mapColors.card },
                      ]),
              ]}
            >
              <Pressable
                onPress={toggleHeading}
                style={styles.hudPressable}
                accessibilityRole="button"
                accessibilityLabel={t('home.followHeading')}
                accessibilityState={{ selected: !!tracking }}
              >
                <Icon
                  name={tracking ? 'navigate' : 'navigate-outline'}
                  size={ms(18)}
                  color={tracking ? colors.white : mapColors.text}
                />
              </Pressable>
            </LiquidGlassView>
          </Reanimated.View>
        ) : null}

        {layoutReady ? (
          <BottomSheet
            expandedHeight={expandedHeight}
            collapsedHeight={collapsedHeight}
            translateY={sheetY}
            contentContainerStyle={[
              styles.cards,
              { paddingBottom: tabBarInset + ms(16) },
            ]}
            header={
              <View style={styles.sheetHeader}>
                <View style={styles.sheetTitleRow}>
                  <PulseDot color={colors.primary} size={ms(10)} />
                  <Text style={styles.sheetTitle}>
                    {t('home.happeningNow')}
                  </Text>
                </View>
                <View style={styles.nearbyPill}>
                  <Text style={styles.nearbyText}>
                    {t('home.nearby', { count: activities.length })}
                  </Text>
                </View>
              </View>
            }
          >
            {activities.length ? (
              activities.map(activity => (
                <ActivityCard
                  key={activity.id}
                  activity={activity}
                  joined={isJoined(activity, joinedIds)}
                  styles={styles}
                  onPress={openActivity}
                  onJoin={join}
                />
              ))
            ) : (
              <Text style={styles.empty}>{t('home.empty')}</Text>
            )}
          </BottomSheet>
        ) : null}
      </View>
      <MapStylePicker
        visible={stylePickerOpen}
        selected={mapStyle}
        center={SPOTS_CENTER}
        onSelect={selectMapStyle}
        onClose={() => setStylePickerOpen(false)}
      />
    </View>
  );
}
