import { useEffect, useMemo, useRef, useState } from 'react';
import { Image, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import {
  Camera,
  type CameraRef,
  Map as MapView,
  type LngLat,
} from '@maplibre/maplibre-react-native';
import {
  isLiquidGlassSupported,
  LiquidGlassView,
} from '@callstack/liquid-glass';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ms } from 'react-native-size-matters';
import Icon from 'react-native-vector-icons/Ionicons';

import PulseDot from '@/components/PulseDot';
import MapStylePicker from '@/screens/Home/MapStylePicker';
import { CATEGORY_EMOJI } from '@/services/mockData';
import { useAppDispatch } from '@/store/hooks';
import { setMapStyle } from '@/store/slices/appSlice';
import { darkColors, lightColors } from '@/theme';
import type { Activity } from '@/types/activity';
import type { MapStyleId } from '@/types/map';
import { clockIn, formatDistance, initialsOf } from '@/utils/format';
import { distanceMeters } from '@/utils/geo';
import { isDarkMapStyle, mapStyleUrl } from '@/utils/mapStyles';

import { LiveMapMarkers, useLiveBounds } from './LiveMap';
import { createLiveMapStyles } from './liveMapStyles';
import type { ActivityDetailStyles } from './styles';
import type { LiveMember } from './useLiveMembers';

const SHEET_ESTIMATE = ms(250);
const FOLLOW_ZOOM = 16;

/**
 * Full-screen live map: the activity and where every member is right now.
 * Members only, as positions are shared with the group alone.
 */
export default function LiveMapModal({
  visible,
  onClose,
  activity,
  members,
  myPosition,
  myReady,
  myCourse,
  myName,
  mapStyle,
  markerStyles,
}: {
  visible: boolean;
  onClose: () => void;
  activity: Activity;
  members: LiveMember[];
  myPosition: LngLat | null;
  /** The user counts as ready once checked in. */
  myReady: boolean;
  /** GPS course in degrees, or null when standing still. */
  myCourse: number | null;
  myName: string;
  mapStyle: MapStyleId;
  markerStyles: ActivityDetailStyles;
}) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  // Glass and its text follow the map, which can be dark in a light app theme.
  const mapDark = isDarkMapStyle(mapStyle);
  const colors = mapDark ? darkColors : lightColors;
  const glassScheme = mapDark ? 'dark' : 'light';
  const styles = useMemo(() => createLiveMapStyles(colors), [colors]);
  const glassFallback = !isLiquidGlassSupported && styles.glassFallback;

  const bounds = useLiveBounds(activity, members, myPosition);
  const endsAt = clockIn(activity.startsInMinutes + activity.durationMinutes);
  const myMeters = myPosition
    ? distanceMeters(myPosition, activity.coordinate)
    : null;
  // Everyone in the activity: the host and other members, plus the user.
  const totalCount = members.length + 1;
  const readyCount =
    members.filter(member => member.ready).length + (myReady ? 1 : 0);

  const dispatch = useAppDispatch();
  const cameraRef = useRef<CameraRef>(null);
  const [stylePickerOpen, setStylePickerOpen] = useState(false);
  const [tracking, setTracking] = useState(false);
  const [sheetHeight, setSheetHeight] = useState(SHEET_ESTIMATE);
  const sheetBottom = Math.max(insets.bottom, ms(16));
  const topPadding = insets.top + ms(80);
  const bottomPadding = sheetBottom + sheetHeight + ms(24);

  const close = () => {
    setTracking(false);
    onClose();
  };

  const toggleTracking = () => {
    if (tracking) {
      setTracking(false);
      cameraRef.current?.setStop({ bearing: 0, duration: 400 });
      return;
    }
    if (!myPosition) {
      cameraRef.current?.fitBounds(bounds, {
        padding: {
          top: topPadding,
          right: ms(48),
          bottom: bottomPadding,
          left: ms(48),
        },
        duration: 600,
      });
      return;
    }
    setTracking(true);
    cameraRef.current?.flyTo({
      center: myPosition,
      zoom: FOLLOW_ZOOM,
      bearing: myCourse ?? 0,
      padding: { top: topPadding, bottom: bottomPadding },
      duration: 800,
    });
  };

  useEffect(() => {
    if (!tracking || !myPosition) {
      return;
    }
    cameraRef.current?.easeTo({
      center: myPosition,
      bearing: myCourse ?? undefined,
      padding: { top: topPadding, bottom: bottomPadding },
      duration: 400,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tracking, myPosition?.[0], myPosition?.[1], myCourse]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={close}
    >
      <View style={styles.root}>
        <MapView
          style={styles.map}
          mapStyle={mapStyleUrl(mapStyle)}
          compass={false}
          logo={false}
          attribution={false}
          touchPitch={false}
        >
          <Camera
            ref={cameraRef}
            initialViewState={{
              bounds,
              padding: {
                top: topPadding,
                right: ms(48),
                bottom: bottomPadding,
                left: ms(48),
              },
            }}
          />
          <LiveMapMarkers
            activity={activity}
            members={members}
            myPosition={myPosition}
            myName={myName}
            styles={markerStyles}
          />
        </MapView>

        <View
          style={[styles.topBar, { top: insets.top + ms(8) }]}
          pointerEvents="box-none"
        >
          <LiquidGlassView
            interactive
            effect="clear"
            colorScheme={glassScheme}
            style={[styles.closeButton, glassFallback]}
          >
            <Pressable
              onPress={close}
              hitSlop={6}
              style={styles.glassPressable}
              accessibilityRole="button"
              accessibilityLabel={t('common.close')}
            >
              <Icon name="close" size={ms(20)} color={colors.text} />
            </Pressable>
          </LiquidGlassView>
          <LiquidGlassView
            effect="clear"
            colorScheme={glassScheme}
            style={[styles.titlePill, glassFallback]}
          >
            <Text style={styles.title} numberOfLines={1}>
              {activity.title}
            </Text>
            <View style={styles.statusRow}>
              <PulseDot color={colors.success} size={ms(6)} />
              <Text style={styles.statusText} numberOfLines={1}>
                {t('home.whenNow', { time: endsAt })}
              </Text>
            </View>
          </LiquidGlassView>
        </View>

        <View
          style={[styles.hud, { bottom: bottomPadding - ms(12) }]}
          pointerEvents="box-none"
        >
          <LiquidGlassView
            interactive
            effect="clear"
            colorScheme={glassScheme}
            style={[styles.closeButton, glassFallback]}
          >
            <Pressable
              onPress={() => setStylePickerOpen(true)}
              style={styles.glassPressable}
              accessibilityRole="button"
              accessibilityLabel={t('home.mapStyle')}
            >
              <Icon name="layers-outline" size={ms(18)} color={colors.text} />
            </Pressable>
          </LiquidGlassView>
          <LiquidGlassView
            interactive
            effect="clear"
            tintColor={tracking ? colors.primary : undefined}
            colorScheme={glassScheme}
            style={[
              styles.closeButton,
              !isLiquidGlassSupported &&
                (tracking ? styles.hudButtonActive : styles.glassFallback),
            ]}
          >
            <Pressable
              onPress={toggleTracking}
              style={styles.glassPressable}
              accessibilityRole="button"
              accessibilityLabel={t('home.followHeading')}
              accessibilityState={{ selected: tracking }}
            >
              <Icon
                name={tracking ? 'navigate' : 'navigate-outline'}
                size={ms(18)}
                color={tracking ? colors.white : colors.text}
              />
            </Pressable>
          </LiquidGlassView>
        </View>

        <LiquidGlassView
          effect="clear"
          colorScheme={glassScheme}
          style={[styles.sheet, glassFallback, { bottom: sheetBottom }]}
          onLayout={event => setSheetHeight(event.nativeEvent.layout.height)}
        >
          <View style={styles.placeRow}>
            <View style={styles.placeIcon}>
              <Text style={styles.placeEmoji}>
                {CATEGORY_EMOJI[activity.category]}
              </Text>
            </View>
            <View style={styles.placeBody}>
              <Text style={styles.placeName} numberOfLines={1}>
                {activity.meetingPoint}
              </Text>
              <Text style={styles.placeMeta} numberOfLines={1}>
                {`${activity.tag} • ${activity.routeName}`}
              </Text>
            </View>
            <Text style={styles.arrivedText}>
              {t('activityDetail.liveMap.readyCount', {
                count: readyCount,
                total: totalCount,
              })}
            </Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.members}
          >
            <View style={styles.member}>
              <View
                style={[
                  styles.memberAvatar,
                  styles.memberMe,
                  myReady && styles.memberAvatarArrived,
                ]}
              >
                <Text style={styles.memberInitials}>{initialsOf(myName)}</Text>
              </View>
              <Text style={styles.memberName} numberOfLines={1}>
                {t('activityDetail.you')}
              </Text>
              <Text
                style={[
                  styles.memberStatus,
                  myReady && styles.memberStatusArrived,
                ]}
                numberOfLines={1}
              >
                {myReady
                  ? t('activityDetail.liveMap.ready')
                  : myMeters === null
                  ? '—'
                  : formatDistance(myMeters / 1000)}
              </Text>
            </View>
            {members.map(member => (
              <View key={member.user.id} style={styles.member}>
                <Image
                  source={member.user.avatar}
                  style={[
                    styles.memberAvatar,
                    member.ready && styles.memberAvatarArrived,
                  ]}
                />
                <Text style={styles.memberName} numberOfLines={1}>
                  {member.user.name.split(' ').pop()}
                </Text>
                {member.user.id === activity.hostId ? (
                  <Text style={styles.hostTag}>
                    {t('activityDetail.hostBadge')}
                  </Text>
                ) : null}
                <Text
                  style={[
                    styles.memberStatus,
                    member.ready && styles.memberStatusArrived,
                  ]}
                  numberOfLines={1}
                >
                  {member.ready
                    ? t('activityDetail.liveMap.ready')
                    : formatDistance(member.metersAway / 1000)}
                </Text>
              </View>
            ))}
          </ScrollView>

          <View style={styles.hintRow}>
            <Icon
              name="lock-closed-outline"
              size={ms(12)}
              color={colors.textSecondary}
            />
            <Text style={styles.hint} numberOfLines={2}>
              {t('activityDetail.liveMap.privacy')}
            </Text>
          </View>
        </LiquidGlassView>
      </View>
      <MapStylePicker
        visible={stylePickerOpen}
        selected={mapStyle}
        center={activity.coordinate}
        onSelect={id => {
          dispatch(setMapStyle(id));
          setStylePickerOpen(false);
        }}
        onClose={() => setStylePickerOpen(false)}
      />
    </Modal>
  );
}
