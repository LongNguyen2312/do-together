import { memo, useState } from 'react';
import {
  Image,
  StyleSheet,
  View,
  type ImageSourcePropType,
} from 'react-native';
import {
  GestureDetector,
  useLongPressGesture,
  usePanGesture,
  usePinchGesture,
  useSimultaneousGestures,
  useTapGesture,
} from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

const MAX_SCALE = 4;
/** Held this long, a photo offers its menu. */
const LONG_PRESS_MS = 450;
/** Where a double tap zooms to. */
const DOUBLE_TAP_SCALE = 2.5;
/** Settles without wobbling past where it's going. */
const SETTLE = { damping: 24, stiffness: 260, mass: 0.8 };

interface Props {
  source: ImageSourcePropType;
  width: number;
  height: number;
  /** Zoomed in or back out, once a gesture's done. */
  onZoomChange: (zoomed: boolean) => void;
  /** Held down: e.g. a menu to save it. None, nothing happens. */
  onLongPress?: () => void;
}

/**
 * A full-screen photo you can pinch (about the fingers) and double-tap to
 * zoom, and drag around once zoomed, kept from sliding off its edges. Not
 * zoomed, one-finger drags are left to whatever's around it (paging, closing).
 */
function ZoomablePhoto({
  source,
  width,
  height,
  onZoomChange,
  onLongPress,
}: Props) {
  /** Zoomed in: one finger moves the picture. */
  const [zoomedIn, setZoomedIn] = useState(false);
  const zoomChanged = (now: boolean) => {
    setZoomedIn(now);
    onZoomChange(now);
  };
  const scale = useSharedValue(1);
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const start = useSharedValue({ scale: 1, x: 0, y: 0 });
  /** The pinch's focal point, from the centre, when it began. */
  const focal = useSharedValue({ x: 0, y: 0 });
  const zoomed = useSharedValue(false);

  /** The furthest the picture may move each way at `s`, edge to edge. */
  const clamp = (value: number, s: number, size: number) => {
    'worklet';
    const max = (size * (s - 1)) / 2;
    return Math.min(Math.max(value, -max), max);
  };

  const report = (now: boolean) => {
    'worklet';
    if (now !== zoomed.value) {
      zoomed.value = now;
      scheduleOnRN(zoomChanged, now);
    }
  };

  /** Back inside the bounds (and to 1x if it went below), then report. */
  const settle = () => {
    'worklet';
    const s = Math.min(Math.max(scale.value, 1), MAX_SCALE);
    scale.value = withSpring(s, SETTLE);
    x.value = withSpring(clamp(x.value, s, width), SETTLE);
    y.value = withSpring(clamp(y.value, s, height), SETTLE);
    report(s > 1.01);
  };

  const pinch = usePinchGesture({
    onActivate: event => {
      'worklet';
      start.value = { scale: scale.value, x: x.value, y: y.value };
      focal.value = {
        x: event.focalX - width / 2,
        y: event.focalY - height / 2,
      };
    },
    onUpdate: event => {
      'worklet';
      // A little give past the limits, settled back on release.
      const next = Math.min(
        Math.max(start.value.scale * event.scale, 0.8),
        MAX_SCALE * 1.2,
      );
      const ratio = next / start.value.scale;
      // The point under the fingers stays under them.
      x.value = focal.value.x - ratio * (focal.value.x - start.value.x);
      y.value = focal.value.y - ratio * (focal.value.y - start.value.y);
      scale.value = next;
    },
    onDeactivate: settle,
  });

  // Only once zoomed: otherwise one finger is for paging or closing.
  const pan = usePanGesture({
    enabled: zoomedIn,
    maxPointers: 1,
    onActivate: () => {
      'worklet';
      start.value = { scale: scale.value, x: x.value, y: y.value };
    },
    onUpdate: event => {
      'worklet';
      x.value = clamp(start.value.x + event.translationX, scale.value, width);
      y.value = clamp(start.value.y + event.translationY, scale.value, height);
    },
  });

  const doubleTap = useTapGesture({
    numberOfTaps: 2,
    onActivate: event => {
      'worklet';
      if (scale.value > 1.01) {
        scale.value = withTiming(1);
        x.value = withTiming(0);
        y.value = withTiming(0);
        report(false);
        return;
      }
      // Zoomed in on the tap.
      const fx = event.x - width / 2;
      const fy = event.y - height / 2;
      scale.value = withTiming(DOUBLE_TAP_SCALE);
      x.value = withTiming(
        clamp(fx * (1 - DOUBLE_TAP_SCALE), DOUBLE_TAP_SCALE, width),
      );
      y.value = withTiming(
        clamp(fy * (1 - DOUBLE_TAP_SCALE), DOUBLE_TAP_SCALE, height),
      );
      report(true);
    },
  });

  const hold = useLongPressGesture({
    enabled: !!onLongPress,
    minDuration: LONG_PRESS_MS,
    onActivate: () => {
      'worklet';
      if (onLongPress) {
        scheduleOnRN(onLongPress);
      }
    },
  });

  const gesture = useSimultaneousGestures(pinch, pan, doubleTap, hold);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: x.value },
      { translateY: y.value },
      { scale: scale.value },
    ],
  }));

  return (
    <GestureDetector gesture={gesture}>
      {/* Cut to its page, so a zoomed photo doesn't spill onto the next. */}
      <View style={[styles.page, { width, height }]}>
        <Animated.View style={[{ width, height }, style]}>
          <Image
            source={source}
            style={{ width, height }}
            resizeMode="contain"
          />
        </Animated.View>
      </View>
    </GestureDetector>
  );
}

export default memo(ZoomablePhoto);

const styles = StyleSheet.create({
  page: {
    overflow: 'hidden',
  },
});
