/**
 * Built-in sticker packs, rendered without a bubble. Animated stickers are
 * bundled dotLottie assets; emoji stickers are bundled Twemoji SVGs (regenerate
 * with `yarn twemoji`); text stickers are short, translated activity phrases on
 * a coloured badge.
 */

export type StickerTone = 'primary' | 'success' | 'violet' | 'sky';

export type Sticker =
  | { id: string; kind: 'emoji'; emoji: string }
  /** `source` is a `require`d .lottie asset. */
  | { id: string; kind: 'lottie'; source: number }
  | {
      id: string;
      kind: 'text';
      emoji: string;
      /** Key under `stickers.phrases`. */
      phrase: string;
      tone: StickerTone;
    };

export interface StickerPack {
  id: string;
  /** Shown on the pack tab. */
  icon: string;
  stickers: Sticker[];
}

const emojiPack = (
  id: string,
  icon: string,
  emojis: string[],
): StickerPack => ({
  id,
  icon,
  stickers: emojis.map((emoji, i) => ({
    id: `${id}-${i}`,
    kind: 'emoji',
    emoji,
  })),
});

export const STICKER_PACKS: StickerPack[] = [
  {
    id: 'animated',
    icon: '✨',
    stickers: [
      require('@/assets/stickers/sticker_2.lottie'),
      require('@/assets/stickers/sticker_3.lottie'),
      require('@/assets/stickers/sticker_4.lottie'),
      require('@/assets/stickers/sticker_5.lottie'),
      require('@/assets/stickers/sticker_6.lottie'),
      require('@/assets/stickers/sticker_7.lottie'),
      require('@/assets/stickers/sticker_8.lottie'),
    ].map((source: number, i) => ({
      id: `animated-${i}`,
      kind: 'lottie' as const,
      source,
    })),
  },
  {
    id: 'phrases',
    icon: '💬',
    stickers: [
      { phrase: 'letsGo', emoji: '🔥', tone: 'primary' },
      { phrase: 'onMyWay', emoji: '🏃', tone: 'sky' },
      { phrase: 'imHere', emoji: '📍', tone: 'success' },
      { phrase: 'wait5', emoji: '⏳', tone: 'violet' },
      { phrase: 'countMeIn', emoji: '🙋', tone: 'primary' },
      { phrase: 'goodGame', emoji: '🤝', tone: 'success' },
      { phrase: 'thanks', emoji: '🙏', tone: 'sky' },
      { phrase: 'nextTime', emoji: '📅', tone: 'violet' },
    ].map(sticker => ({
      ...sticker,
      id: `phrases-${sticker.phrase}`,
      kind: 'text' as const,
      tone: sticker.tone as StickerTone,
    })),
  },
  emojiPack('moves', '🏃', [
    '🏃‍♂️',
    '🏃‍♀️',
    '⚽',
    '🏸',
    '🚴',
    '🧘',
    '💪',
    '🏆',
    '🥇',
    '🎯',
    '🚶',
    '🏊',
  ]),
  emojiPack('feels', '😄', [
    '😂',
    '🥰',
    '😎',
    '🤩',
    '🥳',
    '😴',
    '😭',
    '🤔',
    '😤',
    '🫶',
    '👏',
    '👍',
  ]),
  emojiPack('hangout', '☕', [
    '☕',
    '🧋',
    '🍜',
    '🍕',
    '🍻',
    '🎮',
    '🎬',
    '📸',
    '🌅',
    '🌧️',
    '🎉',
    '❤️‍🔥',
  ]),
];

const BY_ID = new Map(
  STICKER_PACKS.flatMap(pack => pack.stickers).map(sticker => [
    sticker.id,
    sticker,
  ]),
);

export const getSticker = (id: string) => BY_ID.get(id);
