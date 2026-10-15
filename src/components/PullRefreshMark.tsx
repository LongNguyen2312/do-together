import { useEffect } from 'react';
import { Platform, StyleSheet } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withRepeat,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { ms } from 'react-native-size-matters';

import { LOGO_LOOP_MS } from '@/components/LogoLoader';
import LogoMark from '@/components/LogoMark';

const MARK_SIZE = ms(28);
/** About how far iOS wants a list pulled before it refreshes. */
const PULL_DISTANCE = ms(72);
/** Below the list's top edge, in the room iOS holds open while refreshing. */
const MARK_TOP = ms(16);
const FADE_MS = 200;

interface Props {
  scrollY: SharedValue<number>;
  refreshing: boolean;
  /** The colour the screen's spinner was. */
  color: string;
}

/**
 * The app's mark at the top of a list, in place of the system spinner (iOS;
 * Android keeps its own): lit along its lines as the list is pulled down,
 * then, while refreshing, lit from dark and dark again, round and round,
 * fading once it's done. See usePullRefresh.
 */
export default function PullRefreshMark({ scrollY, refreshing, color }: Props) {
  const looping = useSharedValue(false);
  const phase = useSharedValue(0);
  const shown = useSharedValue(0);
  const pull = useDerivedValue(() =>
    Math.min(Math.max(-scrollY.value / PULL_DISTANCE, 0), 1),
  );

  useEffect(() => {
    if (refreshing) {
      looping.value = true;
      shown.value = 1;
      phase.value = 0;
      phase.value = withRepeat(
        withTiming(1, { duration: LOGO_LOOP_MS, easing: Easing.linear }),
        -1,
      );
      return;
    }
    looping.value = false;
    cancelAnimation(phase);
    shown.value = withTiming(0, { duration: FADE_MS });
  }, [refreshing, looping, phase, shown]);

  const style = useAnimatedStyle(() => ({
    opacity: Math.max(Math.min(pull.value * 1.6, 1), shown.value),
  }));

  if (Platform.OS !== 'ios') {
    return null;
  }
  return (
    <Animated.View style={[styles.mark, style]} pointerEvents="none">
      <LogoMark
        size={MARK_SIZE}
        color={color}
        pull={pull}
        looping={looping}
        phase={phase}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  mark: {
    position: 'absolute',
    top: MARK_TOP,
    alignSelf: 'center',
    width: MARK_SIZE,
    height: MARK_SIZE,
  },
});
