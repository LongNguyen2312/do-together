import { useMemo } from 'react';
import { Image, Text, View } from 'react-native';
import { Marker, type LngLat } from '@maplibre/maplibre-react-native';

import { boundsOf } from '@/screens/Home/data';
import { CATEGORY_EMOJI } from '@/services/mockData';
import type { Activity } from '@/types/activity';
import { initialsOf } from '@/utils/format';

import type { ActivityDetailStyles } from './styles';
import type { LiveMember } from './useLiveMembers';

/** Fits the meeting point and everyone once; later moves all head inwards. */
export function useLiveBounds(
  activity: Activity,
  members: LiveMember[],
  myPosition: LngLat | null,
) {
  return useMemo(
    () =>
      boundsOf([
        activity.coordinate,
        ...members.map(member => member.coordinate),
        ...(myPosition ? [myPosition] : []),
      ]),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activity.id, !!myPosition],
  );
}

/** Meeting point, members and the user, as children of a map. */
export function LiveMapMarkers({
  activity,
  members,
  myPosition,
  myName,
  styles,
}: {
  activity: Activity;
  members: LiveMember[];
  myPosition: LngLat | null;
  myName: string;
  styles: ActivityDetailStyles;
}) {
  return (
    <>
      <Marker id="meeting-point" lngLat={activity.coordinate} anchor="bottom">
        <View style={styles.pin}>
          <View style={styles.pinHead}>
            <Text style={styles.pinEmoji}>
              {CATEGORY_EMOJI[activity.category]}
            </Text>
          </View>
          <View style={styles.pinTail} />
        </View>
      </Marker>
      {members.map(member => (
        <Marker
          key={member.user.id}
          id={`member-${member.user.id}`}
          lngLat={member.coordinate}
          anchor="center"
        >
          <View
            style={[
              styles.memberMarker,
              member.arrived && styles.memberMarkerArrived,
            ]}
          >
            <Image
              source={member.user.avatar}
              style={styles.memberMarkerAvatar}
            />
          </View>
        </Marker>
      ))}
      {myPosition ? (
        <Marker id="me" lngLat={myPosition} anchor="center">
          <View style={[styles.memberMarker, styles.memberMarkerMe]}>
            <Text style={styles.memberMarkerInitials}>
              {initialsOf(myName)}
            </Text>
          </View>
        </Marker>
      ) : null}
    </>
  );
}
