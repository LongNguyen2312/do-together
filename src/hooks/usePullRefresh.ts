import { useCallback } from 'react';
import {
  Platform,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { useSharedValue } from 'react-native-reanimated';

/**
 * Pull to refresh with the app's mark instead of the system spinner (iOS;
 * Android keeps its own). The list keeps its RefreshControl, which does the
 * work, with `refreshTint` hiding its spinner; give the list `onScroll` and
 * `scrollEventThrottle`, and put a PullRefreshMark over it, in a box that
 * starts where the list does.
 */
export function usePullRefresh() {
  const scrollY = useSharedValue(0);
  const onScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      scrollY.value = event.nativeEvent.contentOffset.y;
    },
    [scrollY],
  );
  return {
    scrollY,
    onScroll,
    scrollEventThrottle: 16,
    /** For the RefreshControl's tint: on iOS the mark shows instead. */
    refreshTint: (color: string) =>
      Platform.OS === 'ios' ? 'transparent' : color,
  };
}
