export type BroadcastActivityId =
  | 'running'
  | 'coffee'
  | 'food'
  | 'football'
  | 'badminton'
  | 'gaming'
  | 'movie'
  | 'walking'
  | 'photography'
  | 'coworking'
  | 'language'
  | 'other';

export type BroadcastWhen = 'now' | 'in30' | 'tonight' | 'custom';

export type BroadcastDay = 'today' | 'tomorrow';

export interface BroadcastTime {
  day: BroadcastDay;
  hour: number;
  minute: number;
}

export type BroadcastDuration = '30m' | '1h' | '2h' | '3h';

export interface BroadcastActivity {
  id: BroadcastActivityId;
  /** Omitted for "other", which renders an icon instead. */
  emoji?: string;
}
