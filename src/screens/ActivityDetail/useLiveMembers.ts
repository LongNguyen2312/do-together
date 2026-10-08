import { useEffect, useMemo, useState } from 'react';
import type { LngLat } from '@maplibre/maplibre-react-native';

import { getUser } from '@/services/mockData';
import type { Activity, User } from '@/types/activity';
import { distanceMeters } from '@/utils/geo';

export interface LiveMember {
  user: User;
  coordinate: LngLat;
  metersAway: number;
  arrived: boolean;
  /** Checked in, or simply at the meeting point. */
  ready: boolean;
}

/** Within this distance of the meeting point a member counts as arrived. */
export const ARRIVED_RADIUS_M = 30;
const TICK_MS = 4000;
/** Share of the remaining distance covered each tick. */
const STEP = 0.2;
const METERS_PER_DEGREE = 111_320;

function offset([lng, lat]: LngLat, meters: number, angle: number): LngLat {
  const dLat = (Math.sin(angle) * meters) / METERS_PER_DEGREE;
  const dLng =
    (Math.cos(angle) * meters) /
    (METERS_PER_DEGREE * Math.cos((lat * Math.PI) / 180));
  return [lng + dLng, lat + dLat];
}

/** Stable pseudo-random start so a member doesn't jump between visits. */
function startFor(userId: string, center: LngLat, ready: boolean): LngLat {
  const hash = Array.from(userId).reduce(
    (sum, char, i) => sum + char.charCodeAt(0) * (i + 7),
    0,
  );
  const angle = ((hash % 360) * Math.PI) / 180;
  const meters = ready ? 8 + (hash % 12) : 220 + (hash % 480);
  return offset(center, meters, angle);
}

/** Everyone taking part, host first, whether or not they're listed as a member. */
function participantsOf(activity: Activity) {
  const others = activity.members.filter(
    member => member.userId !== activity.hostId,
  );
  const host = activity.members.find(
    member => member.userId === activity.hostId,
  ) ?? { userId: activity.hostId, ready: true };
  return [host, ...others];
}

/**
 * Members' positions while an activity is live. Simulated until the realtime
 * location API exists: everyone not yet there walks towards the meeting point.
 */
export function useLiveMembers(
  activity: Activity,
  enabled: boolean,
): LiveMember[] {
  const center = activity.coordinate;
  const participants = useMemo(() => participantsOf(activity), [activity]);
  const [positions, setPositions] = useState<Record<string, LngLat>>(() =>
    Object.fromEntries(
      participants.map(member => [
        member.userId,
        startFor(member.userId, center, member.ready),
      ]),
    ),
  );

  useEffect(() => {
    if (!enabled) {
      return;
    }
    const timer = setInterval(() => {
      setPositions(prev => {
        let moved = false;
        const next: Record<string, LngLat> = {};
        for (const [id, point] of Object.entries(prev)) {
          if (distanceMeters(point, center) <= ARRIVED_RADIUS_M) {
            next[id] = point;
            continue;
          }
          moved = true;
          next[id] = [
            point[0] + (center[0] - point[0]) * STEP,
            point[1] + (center[1] - point[1]) * STEP,
          ];
        }
        return moved ? next : prev;
      });
    }, TICK_MS);
    return () => clearInterval(timer);
  }, [enabled, center]);

  return useMemo(
    () =>
      participants.map(member => {
        const coordinate = positions[member.userId];
        const metersAway = distanceMeters(coordinate, center);
        return {
          user: getUser(member.userId),
          coordinate,
          metersAway,
          arrived: metersAway <= ARRIVED_RADIUS_M,
          ready: member.ready || metersAway <= ARRIVED_RADIUS_M,
        };
      }),
    [participants, positions, center],
  );
}
