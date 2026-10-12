import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Reanimated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
  cancelAnimation,
} from 'react-native-reanimated';

/** Each bar starts at its own moment, so they don't move in step. */
const BAR_DELAYS = [0, 180, 90];
const BOUNCE_MS = 360;

/** Where the bars rest while the song is paused. */
const RESTING = 0.3;

interface Props {
  height: number;
  barWidth: number;
  color: string;
  /** Bounces while true; rests low when paused. */
  playing?: boolean;
}

/** Bouncing bars that show a song is playing. */
export default function Equalizer({
  height,
  barWidth,
  color,
  playing = true,
}: Props) {
  return (
    <View style={[styles.row, { height, gap: barWidth * 0.75 }]}>
      {BAR_DELAYS.map(delay => (
        <Bar
          key={delay}
          delay={delay}
          playing={playing}
          style={{
            width: barWidth,
            borderRadius: barWidth / 2,
            backgroundColor: color,
          }}
        />
      ))}
    </View>
  );
}

function Bar({
  delay,
  playing,
  style,
}: {
  delay: number;
  playing: boolean;
  style: { width: number; borderRadius: number; backgroundColor: string };
}) {
  const level = useSharedValue(RESTING);
  useEffect(() => {
    if (!playing) {
      cancelAnimation(level);
      level.value = withTiming(RESTING, { duration: 150 });
      return;
    }
    level.value = withDelay(
      delay,
      withRepeat(
        withTiming(1, {
          duration: BOUNCE_MS,
          easing: Easing.inOut(Easing.quad),
        }),
        -1,
        true,
      ),
    );
  }, [delay, level, playing]);
  const bounce = useAnimatedStyle(() => ({
    transform: [{ scaleY: level.value }],
  }));
  return <Reanimated.View style={[styles.bar, style, bounce]} />;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  bar: {
    height: '100%',
    transformOrigin: 'bottom',
  },
});
