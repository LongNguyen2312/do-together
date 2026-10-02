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
  Linking,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
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
import { useTranslation } from 'react-i18next';
import Reanimated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { ms } from 'react-native-size-matters';

import {
  isLiquidGlassSupported,
  LiquidGlassView,
} from '@callstack/liquid-glass';
import BottomSheet from '@/components/BottomSheet';
import { useTabBarInset } from '@/components/LiquidTabBar';
import PulseDot from '@/components/PulseDot';
import { useCompassHeading } from '@/hooks/useCompassHeading';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setMapStyle } from '@/store/slices/appSlice';
import { darkColors, lightColors, useTheme } from '@/theme';
import type { MapStyleId } from '@/types/map';
import type { MainTabParamList } from '@/types/navigation';
import {
  defaultMapStyle,
  isDarkMapStyle,
  mapStyleUrl,
} from '@/utils/mapStyles';

import {
  ACTIVITIES,
  CATEGORIES,
  FOOTBALL_CLUSTER,
  boundsOf,
  type Activity,
  type CategoryId,
} from './data';
import MapStylePicker from './MapStylePicker';
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
/** m/s; below this the GPS course is too noisy to use as a heading. */
const MIN_COURSE_SPEED = 0.5;
const ROTATION_RANGE = 36000;
/** Roughly 5 km; farther positions would zoom the overview out too much. */
const NEARBY_DEGREES = 0.05;
const SPOTS: LngLat[] = [
  FOOTBALL_CLUSTER.coordinate,
  ...ACTIVITIES.map(activity => activity.coordinate),
];
const SPOTS_BOUNDS = boundsOf(SPOTS);
const SPOTS_CENTER: LngLat = [
  (SPOTS_BOUNDS[0] + SPOTS_BOUNDS[2]) / 2,
  (SPOTS_BOUNDS[1] + SPOTS_BOUNDS[3]) / 2,
];
const CATEGORY_EMOJI = Object.fromEntries(
  CATEGORIES.map(c => [c.id, c.emoji]),
) as Record<CategoryId, string | undefined>;

function ActivityMarker({
  activity,
  styles,
}: {
  activity: Activity;
  styles: HomeStyles;
}) {
  return (
    <View style={styles.markerWrap}>
      <View style={styles.markerPill}>
        <View>
          <Image source={activity.marker.avatar} style={styles.markerAvatar} />
          <View
            style={[
              styles.markerEmoji,
              activity.live && styles.markerEmojiLive,
            ]}
          >
            <Text style={styles.markerEmojiText}>
              {CATEGORY_EMOJI[activity.category]}
            </Text>
          </View>
        </View>
        <View>
          <Text
            style={[
              styles.markerStatus,
              activity.live ? styles.liveText : styles.soonText,
            ]}
          >
            {activity.marker.status}
          </Text>
          <Text style={styles.markerTitle} numberOfLines={1}>
            {activity.marker.title}
          </Text>
        </View>
      </View>
      <View style={styles.markerTip} />
    </View>
  );
}

const ActivityCard = memo(function ActivityCardView({
  activity,
  styles,
  onPress,
}: {
  activity: Activity;
  styles: HomeStyles;
  onPress: () => void;
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const joinable = !activity.live;

  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={styles.cardHost}>
          <Image source={activity.hostAvatar} style={styles.hostAvatar} />
          <View style={styles.flexShrink}>
            <Text style={styles.hostName}>{activity.host}</Text>
            <View style={styles.whenRow}>
              <Icon
                name={activity.live ? 'cafe-outline' : 'time-outline'}
                size={ms(13)}
                color={colors.textSecondary}
              />
              <Text
                style={[
                  styles.whenText,
                  activity.live ? styles.liveText : styles.soonText,
                ]}
              >
                {activity.when}
              </Text>
            </View>
          </View>
        </View>
        <View style={[styles.tag, joinable && styles.tagHighlight]}>
          <Text style={[styles.tagText, joinable && styles.tagTextHighlight]}>
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
            {activity.participants.map((source, i) => (
              <Image
                key={i}
                source={source}
                style={[styles.participant, i > 0 && styles.participantOverlap]}
              />
            ))}
          </View>
          <View style={styles.metaInfo}>
            <Text style={styles.metaText} numberOfLines={1}>
              {activity.capacity
                ? t('home.joinedOf', {
                    count: activity.joined,
                    capacity: activity.capacity,
                  })
                : t('home.joined', { count: activity.joined })}
            </Text>
            {activity.distance ? (
              <View style={styles.distanceRow}>
                <Icon
                  name="location-outline"
                  size={ms(11)}
                  color={colors.textSecondary}
                />
                <Text style={styles.distanceText} numberOfLines={1}>
                  {activity.distance}
                </Text>
              </View>
            ) : null}
          </View>
        </View>
        <Pressable
          onPress={onPress}
          style={({ pressed }) => [
            joinable ? styles.joinButton : styles.detailsButton,
            pressed && styles.pressed,
          ]}
          accessibilityRole="button"
        >
          <Text style={joinable ? styles.joinText : styles.detailsText}>
            {joinable ? t('home.join') : t('home.details')}
          </Text>
        </Pressable>
      </View>
    </View>
  );
});

type Props = BottomTabScreenProps<MainTabParamList, 'Home'>;

export default function HomeScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const tabBarInset = useTabBarInset();
  const insets = useSafeAreaInsets();

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
  const [query, setQuery] = useState('');

  const activities = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return ACTIVITIES.filter(
      activity =>
        (category === 'all' || activity.category === category) &&
        (!needle || activity.title.toLowerCase().includes(needle)),
    );
  }, [category, query]);
  const showCluster = category === 'all' || category === 'football';

  const showComingSoon = useCallback(() => {
    Alert.alert(t('auth.comingSoonTitle'), t('auth.comingSoonMessage'));
  }, [t]);

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

  useEffect(() => {
    if (overlayHeight && collapsedHeight) {
      showSpots();
    }
    // Refit only when the visible map area changes, not when the GPS moves.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [overlayHeight, collapsedHeight]);

  return (
    <View style={styles.safe}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <View style={styles.brand}>
          <Image
            source={require('@/assets/images/logo-mark.png')}
            style={styles.brandLogo}
            tintColor={colors.primary}
            resizeMode="contain"
          />
          <Text style={styles.brandName}>{t('common.appName')}</Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable
            onPress={showSpots}
            hitSlop={6}
            style={styles.headerButton}
            accessibilityRole="button"
            accessibilityLabel={t('home.myLocation')}
          >
            <Icon
              name="location-outline"
              size={ms(22)}
              color={colors.textSecondary}
            />
          </Pressable>
          <Pressable
            onPress={showComingSoon}
            hitSlop={6}
            style={styles.headerButton}
            accessibilityRole="button"
            accessibilityLabel={t('home.notifications')}
          >
            <Icon
              name="notifications-outline"
              size={ms(22)}
              color={colors.textSecondary}
            />
            <View style={styles.notificationDot} />
          </Pressable>
          <Pressable
            onPress={() => navigation.navigate('Profile')}
            hitSlop={6}
            style={styles.profileButton}
            accessibilityRole="button"
            accessibilityLabel={t('tabs.profile')}
          >
            <Icon name="person" size={ms(13)} color={colors.white} />
          </Pressable>
        </View>
      </View>

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
          onRegionDidChange={event =>
            bearingAnim.setValue(event.nativeEvent.bearing)
          }
        >
          <Camera
            ref={cameraRef}
            initialViewState={{ bounds: SPOTS_BOUNDS, padding: FIT_PADDING }}
          />
          {activities.map(activity => (
            <Marker
              key={activity.id}
              id={activity.id}
              lngLat={activity.coordinate}
              anchor="bottom"
              onPress={showComingSoon}
            >
              <ActivityMarker activity={activity} styles={styles} />
            </Marker>
          ))}
          {showCluster ? (
            <Marker
              id="football-cluster"
              lngLat={FOOTBALL_CLUSTER.coordinate}
              anchor="bottom"
              onPress={showComingSoon}
            >
              <View style={styles.markerWrap}>
                <View style={styles.cluster}>
                  <Text style={styles.clusterText}>
                    ⚽ {t('home.spots', { count: FOOTBALL_CLUSTER.count })}
                  </Text>
                </View>
                <View style={[styles.markerTip, styles.clusterTip]} />
              </View>
            </Marker>
          ) : null}
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
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chips}
            style={styles.chipsScroll}
          >
            {CATEGORIES.map(item => {
              const selected = item.id === category;
              return (
                <LiquidGlassView
                  key={item.id}
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
                    onPress={() => setCategory(item.id)}
                    style={styles.chipPressable}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                  >
                    {item.emoji ? (
                      <Text style={styles.chipEmoji}>{item.emoji}</Text>
                    ) : null}
                    <Text
                      style={[
                        styles.chipText,
                        { color: mapColors.text },
                        selected && styles.chipTextSelected,
                      ]}
                    >
                      {t(`home.categories.${item.id}`)}
                    </Text>
                    {selected && item.id === 'all' ? (
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
                  <PulseDot color={colors.success} size={ms(10)} />
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
                  styles={styles}
                  onPress={showComingSoon}
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
