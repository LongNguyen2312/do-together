import { useMemo, useRef, useState } from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type ViewStyle,
} from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  type SharedValue,
  useAnimatedStyle,
} from 'react-native-reanimated';
import {
  Camera,
  type CameraRef,
  Map as MapView,
  Marker,
} from '@maplibre/maplibre-react-native';
import {
  isLiquidGlassSupported,
  LiquidGlassView,
} from '@callstack/liquid-glass';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { Carousel, type CarouselRef } from 'react-native-reanimated-carousel';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { ms } from 'react-native-size-matters';

import { FreePersonCard, SocialActions } from '@/screens/Discover/cards';
import { MAPPABLE_FREE_PEOPLE } from '@/screens/Discover/data';
import { createStyles as createCardStyles } from '@/screens/Discover/styles';
import { boundsOf } from '@/screens/Home/data';
import { CATEGORY_EMOJI } from '@/services/mockData';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { sendFriendRequest, toggleFollow } from '@/store/slices/activitySlice';
import { darkColors, lightColors, useTheme } from '@/theme';
import type { User } from '@/types/activity';
import type { RootStackParamList } from '@/types/navigation';
import {
  defaultMapStyle,
  isDarkMapStyle,
  mapStyleUrl,
} from '@/utils/mapStyles';

import { createStyles, MAP_CARD_BOTTOM_GAP, MAP_CARD_WIDTH } from './styles';

const FOCUS_ZOOM = 15.5;
const ADJACENT_SCALE = 0.84;
/** How much the neighbours fade into the map (scrim opacity at one card away). */
const NEIGHBOUR_DIM = 0.55;
/** Visible gap between the centre card and its (scaled-down) neighbours. */
const NEIGHBOUR_GAP = ms(14);
/** Centre-to-centre distance that leaves exactly NEIGHBOUR_GAP between the cards. */
const NEIGHBOUR_DISTANCE =
  (MAP_CARD_WIDTH * (1 + ADJACENT_SCALE)) / 2 + NEIGHBOUR_GAP;
/** Until the card row is measured; roughly one free-person card. */
const CAROUSEL_ESTIMATE = ms(220);
const CARD_HEIGHT_ESTIMATE = ms(190);
/** Room above the cards so their shadows aren't clipped. */
const SHADOW_ROOM = ms(18);
const PEOPLE_BOUNDS = MAPPABLE_FREE_PEOPLE.length
  ? boundsOf(MAPPABLE_FREE_PEOPLE.map(person => person.coordinate))
  : undefined;

type Props = NativeStackScreenProps<RootStackParamList, 'FreeNearbyMap'>;

/**
 * Parallax ring whose neighbours shrink towards their bottom edge, so all the
 * cards stay level with the same gap above the bottom of the screen.
 */
function ringItemAnimation(progress: number): ViewStyle {
  'worklet';
  const scale = interpolate(
    progress,
    [-1, 0, 1],
    [ADJACENT_SCALE, 1, ADJACENT_SCALE],
    Extrapolation.CLAMP,
  );
  return {
    transform: [{ translateX: progress * NEIGHBOUR_DISTANCE }, { scale }],
    transformOrigin: 'bottom',
    zIndex: Math.round(
      interpolate(progress, [-1, 0, 1], [0, 100, 0], Extrapolation.CLAMP),
    ),
  };
}

/**
 * Fades a card into the map as it leaves the centre. A scrim rather than
 * opacity, since lowering the opacity of a glass view breaks its effect.
 */
function NeighbourScrim({
  progress,
  style,
}: {
  progress: SharedValue<number>;
  style: ViewStyle[];
}) {
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      Math.abs(progress.value),
      [0, 1],
      [0, NEIGHBOUR_DIM],
      Extrapolation.CLAMP,
    ),
  }));
  return (
    <Animated.View pointerEvents="none" style={[...style, animatedStyle]} />
  );
}

export default function FreeNearbyMapScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const mapStyle =
    useAppSelector(state => state.app.mapStyle) ?? defaultMapStyle(isDark);
  const dispatch = useAppDispatch();
  const followedIds = useAppSelector(state => state.activity.followedUserIds);
  const friendRequestIds = useAppSelector(
    state => state.activity.friendRequestIds,
  );
  const follow = (person: User) => dispatch(toggleFollow(person.id));
  const addFriend = (person: User) => dispatch(sendFriendRequest(person.id));
  // Glass and its text follow the map, which can be dark in a light app theme.
  const mapColors = isDarkMapStyle(mapStyle) ? darkColors : lightColors;
  const glassScheme = isDarkMapStyle(mapStyle) ? 'dark' : 'light';
  // Cards sit on the map too, so their text follows the map rather than the app theme.
  const cardStyles = useMemo(() => createCardStyles(mapColors), [mapColors]);
  const glassFallback = !isLiquidGlassSupported && [
    styles.glassFallback,
    { backgroundColor: mapColors.card },
  ];
  const scrimStyle = useMemo(
    () => [
      StyleSheet.absoluteFill,
      styles.mapCardScrim,
      { backgroundColor: mapColors.background },
    ],
    [styles, mapColors],
  );

  const cameraRef = useRef<CameraRef>(null);
  const carouselRef = useRef<CarouselRef>(null);
  const [carouselHeight, setCarouselHeight] = useState(CAROUSEL_ESTIMATE);
  const [cardHeight, setCardHeight] = useState(0);
  const [selectedId, setSelectedId] = useState(MAPPABLE_FREE_PEOPLE[0]?.id);

  const topInset = insets.top + ms(72);
  const bottomInset = carouselHeight;

  const focus = (index: number, moveCarousel: boolean) => {
    const person = MAPPABLE_FREE_PEOPLE[index];
    if (!person) {
      return;
    }
    setSelectedId(person.id);
    cameraRef.current?.flyTo({
      center: person.coordinate,
      zoom: FOCUS_ZOOM,
      padding: { top: topInset, bottom: bottomInset },
      duration: 600,
    });
    if (moveCarousel) {
      carouselRef.current?.scrollTo({ index, animated: true });
    }
  };

  const onSnapToItem = (index: number) => {
    if (MAPPABLE_FREE_PEOPLE[index]?.id !== selectedId) {
      focus(index, false);
    }
  };

  return (
    <View style={styles.root}>
      <MapView
        style={styles.map}
        mapStyle={mapStyleUrl(mapStyle)}
        compass={false}
        logo={false}
        attribution={false}
      >
        <Camera
          ref={cameraRef}
          initialViewState={
            PEOPLE_BOUNDS
              ? {
                  bounds: PEOPLE_BOUNDS,
                  padding: {
                    top: topInset,
                    right: ms(56),
                    bottom: CAROUSEL_ESTIMATE,
                    left: ms(56),
                  },
                }
              : undefined
          }
        />
        {MAPPABLE_FREE_PEOPLE.map((person, index) => {
          const selected = person.id === selectedId;
          return (
            <Marker
              key={person.id}
              id={person.id}
              lngLat={person.coordinate}
              anchor="bottom"
              onPress={() => focus(index, true)}
            >
              <View style={[styles.marker, selected && styles.markerSelected]}>
                <View
                  style={[
                    styles.markerRing,
                    selected && styles.markerRingSelected,
                  ]}
                >
                  <Image source={person.avatar} style={styles.markerAvatar} />
                  {person.freeWish ? (
                    <View style={styles.markerBadge}>
                      <Text style={styles.markerEmoji}>
                        {CATEGORY_EMOJI[person.freeWish.category]}
                      </Text>
                    </View>
                  ) : null}
                </View>
                <View
                  style={[
                    styles.markerTip,
                    selected && styles.markerTipSelected,
                  ]}
                />
              </View>
            </Marker>
          );
        })}
      </MapView>

      <View style={[styles.topBar, { paddingTop: insets.top + ms(8) }]}>
        <LiquidGlassView
          interactive
          colorScheme={glassScheme}
          style={[styles.backButton, glassFallback]}
        >
          <Pressable
            onPress={navigation.goBack}
            hitSlop={6}
            style={styles.glassPressable}
            accessibilityRole="button"
            accessibilityLabel={t('auth.back')}
          >
            <Icon name="chevron-back" size={ms(20)} color={mapColors.text} />
          </Pressable>
        </LiquidGlassView>
        <LiquidGlassView
          colorScheme={glassScheme}
          style={[styles.titlePill, glassFallback]}
        >
          <Text
            style={[styles.title, { color: mapColors.text }]}
            numberOfLines={1}
          >
            {t('discover.freeNearby')}
          </Text>
          <View style={styles.sharingRow}>
            <View style={styles.sharingDot} />
            <Text
              style={[styles.sharingText, { color: mapColors.textSecondary }]}
              numberOfLines={1}
            >
              {t('discover.sharingLocation', {
                count: MAPPABLE_FREE_PEOPLE.length,
              })}
            </Text>
          </View>
        </LiquidGlassView>
      </View>

      <View
        style={styles.bottom}
        onLayout={event => setCarouselHeight(event.nativeEvent.layout.height)}
        pointerEvents="box-none"
      >
        {MAPPABLE_FREE_PEOPLE.length ? (
          <Carousel
            ref={carouselRef}
            data={MAPPABLE_FREE_PEOPLE}
            keyExtractor={person => person.id}
            loop={MAPPABLE_FREE_PEOPLE.length > 2}
            style={{
              width: screenWidth,
              height:
                (cardHeight || CARD_HEIGHT_ESTIMATE) +
                SHADOW_ROOM +
                MAP_CARD_BOTTOM_GAP,
            }}
            itemAnimation={ringItemAnimation}
            onSnapToItem={onSnapToItem}
            onConfigurePanGesture={gesture => {
              // Leave vertical drags to the screen; only horizontal swipes turn the ring.
              gesture.activeOffsetX([-10, 10]);
            }}
            renderItem={({ item, relativeProgress }) => (
              <View style={styles.carouselItem}>
                <View
                  onLayout={event => {
                    const { height } = event.nativeEvent.layout;
                    setCardHeight(prev =>
                      Math.abs(prev - height) < 1 ? prev : height,
                    );
                  }}
                >
                  <FreePersonCard
                    person={item}
                    styles={cardStyles}
                    glassScheme={glassScheme}
                    style={styles.mapCard}
                    actions={
                      <SocialActions
                        person={item}
                        following={followedIds.includes(item.id)}
                        requested={friendRequestIds.includes(item.id)}
                        styles={cardStyles}
                        onToggleFollow={follow}
                        onAddFriend={addFriend}
                      />
                    }
                  />
                  <NeighbourScrim
                    progress={relativeProgress}
                    style={scrimStyle}
                  />
                </View>
              </View>
            )}
          />
        ) : (
          <View style={styles.empty}>
            <Icon
              name="eye-off-outline"
              size={ms(22)}
              color={colors.textSecondary}
            />
            <Text style={styles.emptyText}>{t('discover.mapEmpty')}</Text>
          </View>
        )}
      </View>
    </View>
  );
}
