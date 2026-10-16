import { useCallback, useEffect } from 'react';
import {
  Platform,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import {
  GestureStateManager,
  usePanGesture,
} from 'react-native-gesture-handler';
import {
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { ms } from 'react-native-size-matters';
import { scheduleOnRN } from 'react-native-worklets';

/** About how far a list is pulled before letting go refreshes it. */
export const PULL_DISTANCE = ms(72);
/** Held open this far while refreshing (Android), room for the mark. */
const HOLD_OPEN = ms(60);
/** Movement before a touch counts as pulling (or as scrolling instead). */
const SLOP = 8;
/** The list follows the finger less and less the further it's pulled. */
const RESISTANCE = 0.5;
const SETTLE = { damping: 22, stiffness: 220, mass: 0.8 };

/**
 * Pull to refresh with the app's mark, the same on iOS and Android.
 *
 * iOS: the list keeps a RefreshControl (only there: `native`), its spinner
 * hidden with `refreshTint`, and bounces past its top on its own; how far
 * it's pulled comes from `onScroll`.
 *
 * Android has no pulling past the top, so a gesture does it: wrap the list's
 * box in a GestureDetector with `gesture`, make the box an Animated.View
 * with `boxStyle` (it slides down as it's pulled, held open while
 * refreshing), and give the list `onScroll`.
 *
 * Either way, put a PullRefreshMark over the list with `pull`.
 */
export function usePullRefresh({
  refreshing,
  onRefresh,
}: {
  refreshing: boolean;
  onRefresh: () => void;
}) {
  const android = Platform.OS === 'android';
  const scrollY = useSharedValue(0);
  /** Android: how far the list's box has slid down. */
  const offset = useSharedValue(0);
  const touchStartY = useSharedValue(0);

  const onScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      scrollY.value = event.nativeEvent.contentOffset.y;
    },
    [scrollY],
  );

  // Back up once refreshing's done; held open while it isn't.
  useEffect(() => {
    if (!android) {
      return;
    }
    offset.value = withSpring(refreshing ? HOLD_OPEN : 0, SETTLE);
  }, [android, refreshing, offset]);

  const gesture = usePanGesture({
    enabled: android,
    manualActivation: true,
    onTouchesDown: event => {
      'worklet';
      touchStartY.value = event.allTouches[0]?.absoluteY ?? 0;
    },
    // Only a drag down while the list is at its top pulls; anything else
    // is left to the list to scroll.
    onTouchesMove: event => {
      'worklet';
      const dy = (event.allTouches[0]?.absoluteY ?? 0) - touchStartY.value;
      if (scrollY.value > 0 || dy < -SLOP) {
        GestureStateManager.fail(event.handlerTag);
      } else if (dy > SLOP) {
        GestureStateManager.activate(event.handlerTag);
      }
    },
    onUpdate: event => {
      'worklet';
      offset.value = Math.max(event.translationY, 0) * RESISTANCE;
    },
    onDeactivate: () => {
      'worklet';
      const enough = offset.value >= PULL_DISTANCE * RESISTANCE * 1.4;
      offset.value = withSpring(enough ? HOLD_OPEN : 0, SETTLE);
      if (enough) {
        scheduleOnRN(onRefresh);
      }
    },
  });

  /** For the Animated.View round the list: fills its box, slides on Android. */
  const boxStyle = useAnimatedStyle(() => ({
    flex: 1,
    transform: [{ translateY: android ? offset.value : 0 }],
  }));

  /** 0–1: how much of the mark is lit as the list is pulled. */
  const pull = useDerivedValue(() =>
    Math.min(
      Math.max(
        android
          ? offset.value / (PULL_DISTANCE * RESISTANCE * 1.4)
          : -scrollY.value / PULL_DISTANCE,
        0,
      ),
      1,
    ),
  );

  return {
    scrollY,
    onScroll,
    scrollEventThrottle: 16,
    gesture,
    boxStyle,
    pull,
    /** iOS keeps the system RefreshControl; Android pulls with `gesture`. */
    native: !android,
    /** The RefreshControl's (iOS) spinner: hidden, the mark shows instead. */
    tint: 'transparent',
  };
}
