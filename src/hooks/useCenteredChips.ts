import { useRef } from 'react';
import type {
  LayoutChangeEvent,
  LayoutRectangle,
  ScrollViewInstance,
} from 'react-native';

/**
 * For a sideways row of filter chips: `center(id)` scrolls the picked chip to
 * the middle, so its neighbours stay reachable on either side (as far as the
 * row's ends allow). Spread `scrollProps` on the ScrollView and give each
 * chip `onLayout={chipLayout(id)}`.
 */
export function useCenteredChips<Id extends string>() {
  const listRef = useRef<ScrollViewInstance>(null);
  const frames = useRef<Partial<Record<Id, LayoutRectangle>>>({});
  const viewport = useRef(0);
  const content = useRef(0);

  const center = (id: Id) => {
    const frame = frames.current[id];
    if (!frame) {
      return;
    }
    const maxX = Math.max(0, content.current - viewport.current);
    const x = frame.x + frame.width / 2 - viewport.current / 2;
    listRef.current?.scrollTo({
      x: Math.min(maxX, Math.max(0, x)),
      animated: true,
    });
  };

  const chipLayout = (id: Id) => (event: LayoutChangeEvent) => {
    frames.current[id] = event.nativeEvent.layout;
  };

  const scrollProps = {
    ref: listRef,
    onLayout: (event: LayoutChangeEvent) => {
      viewport.current = event.nativeEvent.layout.width;
    },
    onContentSizeChange: (width: number) => {
      content.current = width;
    },
  };

  return { center, chipLayout, scrollProps };
}
