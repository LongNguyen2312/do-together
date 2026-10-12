import { useWindowDimensions } from 'react-native';
import { usePanGesture } from 'react-native-gesture-handler';
import {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { ms } from 'react-native-size-matters';
import { scheduleOnRN } from 'react-native-worklets';

/** Downward travel before a touch starts closing the story. */
const DRAG_SLOP = 12;
/** Share of the screen height a slow pull down has to cover to close. */
const CLOSE_SHARE = 0.18;
/** px/s; a faster flick down closes whatever the distance. */
const CLOSE_VELOCITY = 800;
const CLOSE_MS = 260;
/** How much the story shrinks by the time it's pulled to the bottom. */
const CARD_SHRINK = 0.35;
const CARD_RADIUS = ms(24);
/** Settles back without wobbling past where it started. */
const SNAP_BACK = { damping: 22, stiffness: 260, mass: 0.8 };

interface Options {
  enabled: boolean;
  /** Pulls are ignored while the cube turns. */
  turning: SharedValue<boolean>;
  /** Sideways travel that gives the touch to the cube's swipe instead. */
  failOffsetX: number;
  /** As the pull starts: hold the story still. */
  onHold: () => void;
  /** After springing back: play on. */
  onResume: () => void;
  onClose: () => void;
}

/**
 * Pulling down shrinks the story under the finger and fades the backdrop, so
 * the screen beneath shows through; letting go far or fast enough slides it
 * away and closes, otherwise it springs back. The callbacks are called from
 * the UI thread, so they should be stable (or read refs).
 */
export function usePullToClose({
  enabled,
  turning,
  failOffsetX,
  onHold,
  onResume,
  onClose,
}: Options) {
  const { height } = useWindowDimensions();
  const dragX = useSharedValue(0);
  const dragY = useSharedValue(0);
  const dragging = useSharedValue(false);

  const gesture = usePanGesture({
    enabled,
    // One number: only a downward drag starts it.
    activeOffsetY: DRAG_SLOP,
    failOffsetX: [-failOffsetX, failOffsetX],
    onActivate: () => {
      'worklet';
      if (turning.value) {
        return;
      }
      dragging.value = true;
      scheduleOnRN(onHold);
    },
    onUpdate: event => {
      'worklet';
      if (!dragging.value) {
        return;
      }
      dragX.value = event.translationX;
      dragY.value = Math.max(event.translationY, 0);
    },
    onDeactivate: event => {
      'worklet';
      if (!dragging.value) {
        return;
      }
      dragging.value = false;
      if (
        dragY.value > height * CLOSE_SHARE ||
        event.velocityY > CLOSE_VELOCITY
      ) {
        const easing = Easing.out(Easing.cubic);
        dragX.value = withTiming(dragX.value * 1.5, {
          duration: CLOSE_MS,
          easing,
        });
        dragY.value = withTiming(
          height,
          { duration: CLOSE_MS, easing },
          finished => {
            if (finished) {
              scheduleOnRN(onClose);
            }
          },
        );
        return;
      }
      dragX.value = withSpring(0, SNAP_BACK);
      dragY.value = withSpring(0, SNAP_BACK);
      scheduleOnRN(onResume);
    },
  });

  /** For the story itself. */
  const cardStyle = useAnimatedStyle(() => {
    const pulled = Math.min(dragY.value / height, 1);
    return {
      // Rounds off within the first few points of the pull.
      borderRadius: Math.min(pulled * 10, 1) * CARD_RADIUS,
      transform: [
        { translateX: dragX.value },
        { translateY: dragY.value },
        { scale: 1 - CARD_SHRINK * pulled },
      ],
    };
  });
  /** For the black behind it. */
  const backdropStyle = useAnimatedStyle(() => ({
    opacity: interpolate(dragY.value / height, [0, 0.4], [1, 0], 'clamp'),
  }));

  return { gesture, cardStyle, backdropStyle };
}
