import { ACTIVITIES } from '@/services/mockData';
import type { Activity, ActivityCategory } from '@/types/activity';
import { ME } from '@/types/chat';

const MINUTE = 60 * 1000;

/**
 * An activity the user made by sending an "I'm free" signal: kept in the
 * store with real times, and turned into an Activity (times relative to
 * now) wherever activities are listed.
 */
export interface CreatedActivity {
  id: string;
  /** Epoch ms. */
  createdAt: number;
  startsAt: number;
  durationMinutes: number;
  /** One of the app's kinds, or `other` for one of the user's own. */
  category: ActivityCategory | 'other';
  /** As it shows on cards: the kind (or the user's own), and the note. */
  title: string;
  /** Short label after the emoji, e.g. "Chạy bộ • 1 giờ". */
  tag: string;
  note: string;
  /** The photo they posted with it, as a data: uri; none, as before. */
  photo?: string;
  radiusKm: number;
}

/** Where the user's own activities are placed until there's real location. */
const MY_SPOT = ACTIVITIES[0].coordinate;
/** Its name, as Home shows the user's whereabouts, until there's real location. */
const MY_AREA = 'West Lake, Hanoi';

/** A created activity as an Activity, its times relative to `now`. */
export function toActivity(
  created: CreatedActivity,
  now = Date.now(),
): Activity {
  const startsInMinutes = Math.round((created.startsAt - now) / MINUTE);
  return {
    id: created.id,
    mine: true,
    // `other` isn't a kind to browse by, but it has its emoji and name, and
    // the lists and filters simply don't match it to a kind.
    category: created.category as ActivityCategory,
    title: created.title,
    markerTitle: created.title,
    tag: created.tag,
    description: created.note || created.tag,
    longDescription: created.note || created.tag,
    coordinate: MY_SPOT,
    distanceKm: 0,
    meetingPoint: MY_AREA,
    routeLabel: '',
    routeName: '',
    startsInMinutes,
    durationMinutes: created.durationMinutes,
    createdMinutesAgo: Math.max(
      Math.round((now - created.createdAt) / MINUTE),
      0,
    ),
    instantMatch: true,
    hostId: ME,
    // The user's place comes from having joined it, not from here.
    members: [],
    extraTile: { kind: 'vibe', value: created.tag, hint: created.tag },
    photo: created.photo ? { uri: created.photo } : undefined,
  };
}
