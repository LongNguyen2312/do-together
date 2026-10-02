import type { ImageSourcePropType } from 'react-native';
import type { LngLat, LngLatBounds } from '@maplibre/maplibre-react-native';

/** Placeholder content until the activities API exists. */

export type CategoryId =
  | 'all'
  | 'running'
  | 'coffee'
  | 'food'
  | 'football'
  | 'badminton'
  | 'walking';

export const CATEGORIES: { id: CategoryId; emoji?: string }[] = [
  { id: 'all' },
  { id: 'running', emoji: '🏃' },
  { id: 'coffee', emoji: '☕' },
  { id: 'food', emoji: '🍔' },
  { id: 'football', emoji: '⚽' },
  { id: 'badminton', emoji: '🏸' },
  { id: 'walking', emoji: '🚶' },
];

export interface Activity {
  id: string;
  category: Exclude<CategoryId, 'all'>;
  coordinate: LngLat;
  host: string;
  hostAvatar: ImageSourcePropType;
  /** True when it is happening right now rather than starting soon. */
  live: boolean;
  when: string;
  tag: string;
  title: string;
  description: string;
  participants: ImageSourcePropType[];
  joined: number;
  capacity?: number;
  distance?: string;
  marker: {
    avatar: ImageSourcePropType;
    status: string;
    title: string;
  };
}

export const ACTIVITIES: Activity[] = [
  {
    id: 'lakeside-run',
    category: 'running',
    coordinate: [105.833, 21.0515],
    host: 'Minh & Friends',
    hostAvatar: require('@/assets/images/home/avatar-minh-friends.jpg'),
    live: false,
    when: 'Today • 18:30 (in 25m)',
    tag: '🏃 Run • 5 km',
    title: 'Sunset Lakeside Run & Stretch',
    description:
      'Pacing 6:00/km easy conversational jog around Tran Quoc Pagoda track.',
    participants: [
      require('@/assets/images/home/avatar-runner-1.jpg'),
      require('@/assets/images/home/avatar-runner-2.jpg'),
      require('@/assets/images/home/avatar-runner-3.jpg'),
    ],
    joined: 3,
    capacity: 5,
    distance: '1.2 km away',
    marker: {
      avatar: require('@/assets/images/home/avatar-minh.jpg'),
      status: 'IN 20M • 3 JOINED',
      title: 'Lakeside Jog',
    },
  },
  {
    id: 'coffee-cowork',
    category: 'coffee',
    coordinate: [105.8335, 21.0585],
    host: 'Lan Anh',
    hostAvatar: require('@/assets/images/home/avatar-lan-anh.jpg'),
    live: true,
    when: 'Right now • 700m away',
    tag: '☕ Coffee & Work',
    title: 'Coffee & Casual Co-work',
    description:
      'Highlands Coffee Boat terrace, plenty of outdoor seating and quiet shade.',
    participants: [
      require('@/assets/images/home/avatar-cowork-1.jpg'),
      require('@/assets/images/home/avatar-cowork-2.jpg'),
    ],
    joined: 2,
    marker: {
      avatar: require('@/assets/images/home/avatar-lan.jpg'),
      status: 'NOW • 2 PEOPLE',
      title: 'Highlands Chill',
    },
  },
];

export const FOOTBALL_CLUSTER: { coordinate: LngLat; count: number } = {
  coordinate: [105.818, 21.0572],
  count: 4,
};

export function boundsOf(points: LngLat[]): LngLatBounds {
  const lngs = points.map(([lng]) => lng);
  const lats = points.map(([, lat]) => lat);
  return [
    Math.min(...lngs),
    Math.min(...lats),
    Math.max(...lngs),
    Math.max(...lats),
  ];
}
