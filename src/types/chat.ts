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
export type ChatPhoto = ImageRequireSource | { uri: string };

export interface ChatVoice {
  uri: string;
  durationMs: number;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  /** Epoch milliseconds. */
  sentAt: number;
  text?: string;
  photos?: ChatPhoto[];
  voice?: ChatVoice;
  /** Id from the built-in sticker packs. */
  stickerId?: string;
  replyToId?: string;
  /** Members tagged in `text`, which holds their full names. */
  mentionIds?: string[];
  reactions?: ChatReaction[];
}

/** What the composer sends; the rest is filled in by the store. */
export type ChatDraft = Pick<
  ChatMessage,
  'text' | 'photos' | 'voice' | 'stickerId' | 'replyToId' | 'mentionIds'
>;

export type ReportReason =
  | 'spam'
  | 'harassment'
  | 'inappropriate'
  | 'scam'
  | 'other';
