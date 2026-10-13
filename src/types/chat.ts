import type { ImageRequireSource } from 'react-native';

/** `senderId` is this id for messages the signed-in user sent. */
export const ME = 'me';

export interface ChatReaction {
  emoji: string;
  count: number;
  /** The signed-in user is one of `count`. */
  mine?: boolean;
}

/** A bundled image, or a local / remote file. */
export type ChatPhoto =
  | ImageRequireSource
  /** Sized once compressed, for a lone photo's tile; unknown on old ones. */
  | { uri: string; width?: number; height?: number };

export interface ChatVoice {
  uri: string;
  durationMs: number;
  /** How loud it is along its length, as bars 0–1; unknown on old ones. */
  waveform?: number[];
}

/** A clip of up to 10 seconds, sent on its own. */
export interface ChatVideo {
  uri: string;
  durationMs: number;
  /** Its first frame; made when it's compressed. */
  posterUri?: string;
  /** As shown (rotation applied), for the tile's shape; unknown on old ones. */
  width?: number;
  height?: number;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  /** Epoch milliseconds. */
  sentAt: number;
  text?: string;
  photos?: ChatPhoto[];
  video?: ChatVideo;
  voice?: ChatVoice;
  /** Id from the built-in sticker packs. */
  stickerId?: string;
  replyToId?: string;
  /** Members tagged in `text`, which holds their full names. */
  mentionIds?: string[];
  reactions?: ChatReaction[];
  /**
   * The user's own photos or video, shown at once while they're compressed
   * (`sending`), or if that failed.
   */
  status?: 'sending' | 'failed';
}

/** What the composer sends; the rest is filled in by the store. */
export type ChatDraft = Pick<
  ChatMessage,
  | 'text'
  | 'photos'
  | 'video'
  | 'voice'
  | 'stickerId'
  | 'replyToId'
  | 'mentionIds'
  | 'status'
>;

/**
 * What the chat gallery hands back: up to 5 photos, or one clip. Files as
 * picked (`ph://`, `content://` or a camera file), not yet compressed.
 */
export interface ChatPick {
  /** New for every pick, so the same one isn't sent twice. */
  key: number;
  photos?: string[];
  video?: { uri: string; durationMs: number; width?: number; height?: number };
}

export type ReportReason =
  | 'spam'
  | 'harassment'
  | 'inappropriate'
  | 'scam'
  | 'other';
