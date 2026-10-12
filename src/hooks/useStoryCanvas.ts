import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ms } from 'react-native-size-matters';

/** Room under a story for the message field: its height and padding. */
export const STORY_FOOTER = ms(58);
/** Under a story with no message field (the user's own): just a sliver. */
const BARE_FOOTER = ms(6);

export interface StoryCanvas {
  /** Screen y of the story's top edge: the top of the safe area. */
  top: number;
  width: number;
  height: number;
}

/**
 * Where a story's photo or video sits: from the top of the safe area down to
 * just above the message field, like the usual story apps. The editor uses
 * the same frame, so text and stickers land where they were put. Without the
 * field (`withFooter` false, for the user's own stories) it goes nearly to
 * the bottom; text and stickers keep their places, as shares of the frame.
 */
export function useStoryCanvas(withFooter = true): StoryCanvas {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  return {
    top: insets.top,
    width,
    height:
      height -
      insets.top -
      insets.bottom -
      (withFooter ? STORY_FOOTER : BARE_FOOTER),
  };
}
