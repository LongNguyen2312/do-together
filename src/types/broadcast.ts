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

/** A user-made "Other" activity, kept in history so it can be picked again. */
export interface CustomActivity {
  id: string;
  name: string;
  /** Fallback artwork when no photo was uploaded. */
  emoji: string;
  /** Downscaled photo as a data URI, so it survives app restarts. */
  image: string | null;
}

export interface BroadcastActivity {
  id: BroadcastActivityId;
  /** Omitted for "other", which renders an icon instead. */
  emoji?: string;
}
