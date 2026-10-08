import { useEffect, type ReactNode } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

const APPEAR_TIMING = { duration: 320, easing: Easing.out(Easing.cubic) };
const START_SCALE = 0.6;

interface MarkerAppearProps {
  /** Where the marker starts, relative to its final spot (e.g. the cluster it left). */
  from?: { x: number; y: number };
  children: ReactNode;
}

/** Fades and scales a map marker in; when `from` is set it also glides out from there. */
export default function MarkerAppear({ from, children }: MarkerAppearProps) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(1, APPEAR_TIMING);
  }, [progress]);

  const style = useAnimatedStyle(() => {
    const rest = 1 - progress.value;
    return {
      opacity: progress.value,
      transform: [
        { translateX: (from?.x ?? 0) * rest },
        { translateY: (from?.y ?? 0) * rest },
        { scale: START_SCALE + (1 - START_SCALE) * progress.value },
      ],
    };
  });

  return (
    <Animated.View style={[styles.origin, style]}>{children}</Animated.View>
  );
}

const styles = StyleSheet.create({
  // Grow from the tip so the marker stays pinned to its coordinate.
  origin: {
    transformOrigin: 'bottom',
  },
});
