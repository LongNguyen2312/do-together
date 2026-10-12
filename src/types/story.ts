/** A bundled asset, or a picked file. */
export type StoryPhoto = number | { uri: string };

export type StoryMedia =
  | { type: 'photo'; source: StoryPhoto }
  /**
   * A picked clip, at most MAX_VIDEO_MS long. `posterUri` (its first frame)
   * is made when the clip is compressed for sharing.
   */
  | { type: 'video'; uri: string; durationMs: number; posterUri?: string };

/** Text or a sticker laid over a story's photo or video. */
export interface StoryOverlay {
  id: string;
  kind: 'text' | 'sticker';
  text?: string;
  color?: string;
  /** From the built-in sticker packs. */
  stickerId?: string;
  /** Centre, as a share of the story's width and height. */
  x: number;
  y: number;
  scale: number;
  /** Radians. */
  rotation: number;
}

/** A song from the music library, streamed while the story shows. */
export interface MusicTrack {
  id: string;
  title: string;
  url: string;
  durationMs: number;
}

/** A colour look laid over a story's photo or video wherever it shows. */
export type StoryFilterId =
  | 'normal'
  | 'vivid'
  | 'warm'
  | 'cool'
  | 'rose'
  | 'vintage'
  | 'fade'
  | 'mono';

/** A photo or video shared to the user's friends for a day. */
export interface Story {
  id: string;
  userId: string;
  media: StoryMedia;
  /** None is the same as `normal`. */
  filter?: StoryFilterId;
  overlays?: StoryOverlay[];
  /** Plays instead of a video's own sound. */
  music?: MusicTrack;
  postedAt: number;
}

/** What the editor hands over; the store fills in the rest. */
export type StoryDraft = Pick<Story, 'media' | 'filter' | 'overlays' | 'music'>;

/** One person's live stories, oldest first. */
export interface StoryGroup {
  userId: string;
  stories: Story[];
  /** Has at least one story the user hasn't opened yet. */
  unseen: boolean;
}

/** A message or reaction sent back to a friend about one of their stories. */
export interface StoryReply {
  id: string;
  storyId: string;
  /** Who posted the story. */
  toUserId: string;
  sentAt: number;
  text?: string;
  emoji?: string;
}

/** A photo or video in the phone's library, as listed in the story gallery. */
export interface GalleryAsset {
  /** `ph://` on iOS, `content://` on Android: readable without a copy. */
  uri: string;
  type: 'photo' | 'video';
  /** 0 for photos. */
  durationMs: number;
}

/** An album in the phone's library, to narrow the story gallery to. */
export interface GalleryAlbum {
  title: string;
  /** Photos and videos in it. */
  count: number;
  /** iOS keeps the albums it makes itself (Videos, Selfies…) apart. */
  type: 'Album' | 'SmartAlbum';
  /** Its newest photo or video. */
  coverUri?: string;
}

/** One batch of the library, newest first. */
export interface GalleryPage {
  assets: GalleryAsset[];
  /** Where the next batch starts; none at the end. */
  next?: string;
}

/**
 * `limited`: only the photos the user chose are visible (iOS 14+, Android 14+).
 * `blocked`: the system won't ask again; only Settings can change it.
 */
export type GalleryReadAccess = 'granted' | 'limited' | 'denied' | 'blocked';
