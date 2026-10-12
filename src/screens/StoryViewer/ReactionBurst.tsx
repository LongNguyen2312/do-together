import { useEffect, useState } from 'react';
import { Text, useWindowDimensions } from 'react-native';
import Reanimated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { ms } from 'react-native-size-matters';
import { scheduleOnRN } from 'react-native-worklets';

import type { StoryViewerStyles } from './styles';

export interface Burst {
  id: number;
  emoji: string;
  /** Where on screen it was tapped. */
  x: number;
  y: number;
}

const FLOAT_MS = 1300;
const LEAD_SIZE = ms(56);
/** How far each emoji sways side to side on the way up. */
const SWAY = ms(10);
/** One big emoji up the middle, smaller ones drifting off either side. */
const COPIES = [
  { size: 1, rise: 0.42, drift: 0, delay: 0 },
  { size: 0.55, rise: 0.3, drift: -1, delay: 70 },
  { size: 0.5, rise: 0.34, drift: 1, delay: 140 },
  { size: 0.4, rise: 0.24, drift: -0.6, delay: 210 },
  { size: 0.45, rise: 0.27, drift: 0.7, delay: 280 },
];
const LAST_COPY = COPIES.length - 1;

interface Props {
  bursts: Burst[];
  styles: StoryViewerStyles;
  onDone: (id: number) => void;
}

/** Emoji floating up from the reaction the user tapped, like on Facebook. */
export default function ReactionBurst({ bursts, styles, onDone }: Props) {
  return bursts.map(burst =>
    COPIES.map((copy, i) => (
      <FloatingEmoji
        key={`${burst.id}-${i}`}
        burst={burst}
        copy={copy}
        styles={styles}
        onDone={i === LAST_COPY ? onDone : undefined}
      />
    )),
  );
}

interface FloatingEmojiProps {
  burst: Burst;
  copy: (typeof COPIES)[number];
  styles: StoryViewerStyles;
  /** Only the copy that lands last reports back. */
  onDone?: (id: number) => void;
}

function FloatingEmoji({ burst, copy, styles, onDone }: FloatingEmojiProps) {
  const { width, height } = useWindowDimensions();
  const progress = useSharedValue(0);
  // A little variety, so two taps on the same emoji don't look identical.
  const [wobble] = useState(() => 0.6 + Math.random() * 0.8);
  const size = LEAD_SIZE * copy.size;
  const rise = height * copy.rise;
  const drift = width * 0.12 * copy.drift * wobble;
  // Worked out here: ms() is plain JS and can't run in the worklet below.
  const sway = SWAY * wobble;

  useEffect(() => {
    const id = burst.id;
    progress.value = withDelay(
      copy.delay,
      withTiming(
        1,
        { duration: FLOAT_MS, easing: Easing.out(Easing.quad) },
        finished => {
          if (finished && onDone) {
            scheduleOnRN(onDone, id);
          }
        },
      ),
    );
  }, [burst.id, copy.delay, onDone, progress]);

  const floatStyle = useAnimatedStyle(() => {
    const t = progress.value;
    return {
      opacity: interpolate(t, [0, 0.08, 0.7, 1], [0, 1, 1, 0]),
      transform: [
        { translateY: -rise * t },
        // Sways out and back a little on the way up.
        { translateX: drift * t + sway * Math.sin(t * 9) },
        { scale: interpolate(t, [0, 0.15, 1], [0.3, 1.25, 1]) },
      ],
    };
  });

  return (
    <Reanimated.View
      style={[
        styles.burstEmoji,
        {
          left: burst.x - size / 2,
          top: burst.y - size / 2,
          width: size,
          height: size,
        },
        floatStyle,
      ]}
      pointerEvents="none"
    >
      <Text style={{ fontSize: size * 0.8 }}>{burst.emoji}</Text>
    </Reanimated.View>
  );
}
