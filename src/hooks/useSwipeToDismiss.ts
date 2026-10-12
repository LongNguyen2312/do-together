import { useEffect } from 'react';
import { useWindowDimensions } from 'react-native';
import { usePanGesture } from 'react-native-gesture-handler';
import {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

/** Vertical travel before a touch starts dragging the picture away. */
const DRAG_SLOP = 12;
/** Sideways travel that leaves the touch to paging instead. */
const SIDEWAYS_SLOP = 18;
/** Share of the screen height a slow drag has to cover to close. */
const CLOSE_SHARE = 0.15;
/** pt/s; a faster flick closes whatever the distance. */
const CLOSE_VELOCITY = 800;
const CLOSE_MS = 220;
/** How much the picture shrinks by the time it's dragged a screen away. */
const SHRINK = 0.25;
/** Settles back without wobbling past where it started. */
const SNAP_BACK = { damping: 22, stiffness: 260, mass: 0.8 };

/**
 * Drag a full-screen photo or video up or down to close it, like the photo
 * apps: it follows the finger and shrinks as the backdrop fades; let go far or
 * fast enough and it slides off and `onClose` runs, otherwise it springs back.
 * Sideways drags are left alone, for paging between photos.
 *
 * `open` resets it for the next time the viewer shows; `enabled` false
 * leaves drags alone (e.g. while a photo is zoomed in, for moving it).
 */
export function useSwipeToDismiss(
  open: boolean,
  onClose: () => void,
  enabled = true,
) {
  const { height } = useWindowDimensions();
  const dragY = useSharedValue(0);

  useEffect(() => {
    if (open) {
      dragY.value = 0;
    }
  }, [open, dragY]);

  const gesture = usePanGesture({
    enabled,
    // One finger: two are for zooming.
    maxPointers: 1,
    activeOffsetY: [-DRAG_SLOP, DRAG_SLOP],
    failOffsetX: [-SIDEWAYS_SLOP, SIDEWAYS_SLOP],
    onUpdate: event => {
      'worklet';
      dragY.value = event.translationY;
    },
    onDeactivate: event => {
      'worklet';
      const away =
        Math.abs(dragY.value) > height * CLOSE_SHARE ||
        Math.abs(event.velocityY) > CLOSE_VELOCITY;
      if (!away) {
        dragY.value = withSpring(0, SNAP_BACK);
        return;
      }
      // Off the way it was going.
      const direction =
        Math.sign(event.velocityY) || Math.sign(dragY.value) || 1;
      dragY.value = withTiming(
        direction * height,
        { duration: CLOSE_MS, easing: Easing.out(Easing.cubic) },
        finished => {
          if (finished) {
            scheduleOnRN(onClose);
          }
        },
      );
    },
  });

  /** For the photo or video. */
  const contentStyle = useAnimatedStyle(() => {
    const pulled = Math.min(Math.abs(dragY.value) / height, 1);
    return {
      transform: [{ translateY: dragY.value }, { scale: 1 - SHRINK * pulled }],
    };
  });
  /** For the black behind it. */
  const backdropStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      Math.abs(dragY.value) / height,
      [0, 0.5],
      [1, 0],
      'clamp',
    ),
  }));
  /** For the buttons over it, which step aside while dragging. */
  const chromeStyle = useAnimatedStyle(() => ({
    opacity: interpolate(Math.abs(dragY.value), [0, 60], [1, 0], 'clamp'),
  }));

  return { gesture, contentStyle, backdropStyle, chromeStyle };
}
