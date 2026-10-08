import type { ImageSourcePropType } from 'react-native';
import type { LngLat } from '@maplibre/maplibre-react-native';

import type { BroadcastActivityId } from './broadcast';

export type ActivityCategory = Exclude<BroadcastActivityId, 'other'>;

export interface User {
  id: string;
  name: string;
  age: number;
  avatar: ImageSourcePropType;
  /** Distance from the current user. */
  distanceKm: number;
  /** Minutes until free; 0 is free now, null is not available. */
  freeInMinutes: number | null;
  /** Short personal detail, e.g. their usual pace. */
  note: string;
  trust: number;
  activitiesCount: number;
  interests: ActivityCategory[];
  /** What they'd like to do while free, shown on Discover. */
  freeWish?: { category: ActivityCategory; text: string };
  /** Last known position; only shown on maps when `locationPublic` is set. */
  coordinate?: LngLat;
  locationPublic?: boolean;
}

export interface ActivityMember {
  userId: string;
  status: string;
  ready: boolean;
}

export interface ActivityInfoTile {
  kind: 'pace' | 'vibe';
  value: string;
  hint: string;
}

/** Where the activity is in time. Completed ones only appear in the user's history. */
export type ActivityStatus = 'upcoming' | 'ongoing' | 'completed';
/** The signed-in user's relation to an activity. */
export type ParticipationStatus = 'joined' | 'not_joined';
/** Full activities are hidden from Home and Discover. */
export type SlotStatus = 'available' | 'full';

export interface Activity {
  id: string;
  category: ActivityCategory;
  title: string;
  /** Short label shown on the map marker. */
  markerTitle: string;
  /** Shown after the category emoji, e.g. "Run • 5 km". */
  tag: string;
  description: string;
  longDescription: string;
  coordinate: LngLat;
  distanceKm: number;
  meetingPoint: string;
  routeLabel: string;
  routeName: string;
  /** Negative when it has already started. */
  startsInMinutes: number;
  durationMinutes: number;
  createdMinutesAgo: number;
  instantMatch: boolean;
  hostId: string;
  /** The host comes first. */
  members: ActivityMember[];
  capacity?: number;
  extraTile: ActivityInfoTile;
  /** Photo for the featured card on Discover. */
  cover?: ImageSourcePropType;
}

export interface Community {
  id: string;
  name: string;
  category: ActivityCategory;
  /** Ionicons name. */
  icon: string;
  tone: 'primary' | 'neutral' | 'success';
  membersCount: number;
  schedule: string;
}
