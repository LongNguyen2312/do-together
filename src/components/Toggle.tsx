import { useEffect } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { ms } from 'react-native-size-matters';

import { useTheme } from '@/theme';

const WIDTH = ms(42);
const HEIGHT = ms(26);
const PADDING = ms(3);
const THUMB = HEIGHT - PADDING * 2;
const TRAVEL = WIDTH - THUMB - PADDING * 2;

interface Props {
  value: boolean;
  onValueChange: (value: boolean) => void;
  accessibilityLabel?: string;
}

/**
 * Small on/off switch. The native Switch is drawn outside its layout box on
 * recent iOS, so it can't be sized or centred reliably.
 */
export default function Toggle({
  value,
  onValueChange,
  accessibilityLabel,
}: Props) {
  const { colors } = useTheme();
  const progress = useSharedValue(value ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(value ? 1 : 0, { duration: 180 });
  }, [value, progress]);

  const trackStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      [colors.surfaceHigh, colors.primary],
    ),
  }));
  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: progress.value * TRAVEL }],
  }));

  return (
    <Pressable
      onPress={() => onValueChange(!value)}
      hitSlop={8}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      accessibilityLabel={accessibilityLabel}
    >
      <Animated.View style={[styles.track, trackStyle]}>
        <Animated.View
          style={[styles.thumb, { backgroundColor: colors.white }, thumbStyle]}
        />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: {
    width: WIDTH,
    height: HEIGHT,
    borderRadius: HEIGHT / 2,
    padding: PADDING,
    justifyContent: 'center',
  },
  thumb: {
    width: THUMB,
    height: THUMB,
    borderRadius: THUMB / 2,
    shadowColor: '#000000',
    shadowOpacity: 0.18,
    shadowRadius: ms(2),
    shadowOffset: { width: 0, height: ms(1) },
    elevation: 2,
  },
});
