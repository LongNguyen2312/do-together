import { useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  GestureDetector,
  useCompetingGestures,
  usePanGesture,
  useTapGesture,
} from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { ms } from 'react-native-size-matters';
import { scheduleOnRN } from 'react-native-worklets';

import { useTheme, type AppColors } from '@/theme';

const TRACK_HEIGHT = ms(6);
const THUMB_SIZE = ms(22);
const THUMB_SPRING = { damping: 20, stiffness: 260, overshootClamping: true };

interface RangeSliderProps {
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  accessibilityLabel?: string;
}

/** Single-thumb slider; drag or tap anywhere on the track. Snaps to `step`. */
export default function RangeSlider({
  value,
  min,
  max,
  step,
  onChange,
  accessibilityLabel,
}: RangeSliderProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const width = useSharedValue(0);
  const ratio = useSharedValue((value - min) / (max - min));
  const lastValue = useSharedValue(value);
  const dragging = useSharedValue(false);

  useEffect(() => {
    lastValue.value = value;
    if (!dragging.value) {
      ratio.value = withSpring((value - min) / (max - min), THUMB_SPRING);
    }
  }, [value, min, max, ratio, lastValue, dragging]);

  const moveTo = (x: number) => {
    'worklet';
    if (!width.value) {
      return;
    }
    const raw = Math.min(Math.max(x / width.value, 0), 1);
    ratio.value = raw;
    const snapped = Math.min(
      Math.max(Math.round((min + raw * (max - min)) / step) * step, min),
      max,
    );
    if (snapped !== lastValue.value) {
      lastValue.value = snapped;
      scheduleOnRN(onChange, snapped);
    }
  };

  const settle = () => {
    'worklet';
    ratio.value = withSpring(
      (lastValue.value - min) / (max - min),
      THUMB_SPRING,
    );
  };

  const tap = useTapGesture({
    maxDuration: 1000,
    onActivate: event => {
      'worklet';
      moveTo(event.x);
      settle();
    },
  });

  const pan = usePanGesture({
    activeOffsetX: [-4, 4],
    failOffsetY: [-12, 12],
    onActivate: event => {
      'worklet';
      dragging.value = true;
      moveTo(event.x);
    },
    onUpdate: event => {
      'worklet';
      moveTo(event.x);
    },
    onDeactivate: () => {
      'worklet';
      dragging.value = false;
      settle();
    },
  });

  const gesture = useCompetingGestures(pan, tap);

  const fillStyle = useAnimatedStyle(() => ({
    width: Math.min(Math.max(ratio.value, 0), 1) * width.value,
  }));
  const thumbStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX:
          Math.min(Math.max(ratio.value, 0), 1) * width.value - THUMB_SIZE / 2,
      },
    ],
  }));

  return (
    <GestureDetector gesture={gesture}>
      <View
        style={styles.hitArea}
        hitSlop={{ left: THUMB_SIZE / 2, right: THUMB_SIZE / 2 }}
        onLayout={event => {
          width.value = event.nativeEvent.layout.width;
        }}
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={accessibilityLabel}
        accessibilityValue={{ min, max, now: value }}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={event => {
          const delta = event.nativeEvent.actionName === 'increment' ? 1 : -1;
          onChange(Math.min(Math.max(value + delta * step, min), max));
        }}
      >
        <View style={styles.track}>
          <Animated.View style={[styles.fill, fillStyle]} />
        </View>
        <Animated.View style={[styles.thumb, thumbStyle]} />
      </View>
    </GestureDetector>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    hitArea: {
      height: ms(44),
      justifyContent: 'center',
    },
    track: {
      height: TRACK_HEIGHT,
      borderRadius: TRACK_HEIGHT / 2,
      overflow: 'hidden',
      backgroundColor: colors.surfaceHigh,
    },
    fill: {
      height: '100%',
      backgroundColor: colors.primary,
    },
    thumb: {
      position: 'absolute',
      left: 0,
      width: THUMB_SIZE,
      height: THUMB_SIZE,
      borderRadius: THUMB_SIZE / 2,
      borderWidth: ms(3),
      borderColor: colors.white,
      backgroundColor: colors.primary,
      shadowColor: colors.black,
      shadowOpacity: 0.18,
      shadowRadius: ms(4),
      shadowOffset: { width: 0, height: ms(2) },
      elevation: 3,
    },
  });
}
