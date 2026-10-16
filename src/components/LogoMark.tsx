import Animated, {
  useAnimatedProps,
  type SharedValue,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import {
  LOGO_BOUNDS,
  LOGO_LENGTH,
  LOGO_LINE,
  LOGO_PATH,
} from '@/components/logoPath';

const AnimatedPath = Animated.createAnimatedComponent(Path);

/** A square round the mark, so it sits centred like the spinner did. */
const SIDE = 750;
const VIEW_BOX = `${LOGO_BOUNDS.x + LOGO_BOUNDS.width / 2 - SIDE / 2} ${
  LOGO_BOUNDS.y + LOGO_BOUNDS.height / 2 - SIDE / 2
} ${SIDE} ${SIDE}`;
/** A touch under the icon's, so the small c stays open when tiny. */
const LINE = LOGO_LINE * 0.85;
/** The mark under the light, faded. */
const DIM = 0.3;

interface Props {
  size: number;
  color: string;
  /** How much is lit while not looping, 0–1, e.g. how far it's been pulled. */
  pull: SharedValue<number>;
  /** Going round on its own: `phase` decides what's lit. */
  looping: SharedValue<boolean>;
  /**
   * Looping, 0–1, repeating: the first half lights the line from dark,
   * keeping what's lit; the second draws the light back off it.
   */
  phase: SharedValue<number>;
}

/**
 * The app's mark drawn in lines, faded, with light running along them (from
 * the small c out round the big C): the app's loading indicator, in
 * whatever colour the screen uses.
 */
export default function LogoMark({ size, color, pull, looping, phase }: Props) {
  const lightProps = useAnimatedProps(() => {
    let start = 0;
    let end;
    if (looping.value) {
      const at = phase.value;
      if (at < 0.5) {
        end = at * 2 * LOGO_LENGTH;
      } else {
        start = (at * 2 - 1) * LOGO_LENGTH;
        end = LOGO_LENGTH;
      }
    } else {
      end = pull.value * LOGO_LENGTH;
    }
    return {
      strokeDasharray: [end - start, LOGO_LENGTH * 2],
      strokeDashoffset: -start,
    };
  });

  return (
    <Svg width={size} height={size} viewBox={VIEW_BOX}>
      <Path
        d={LOGO_PATH}
        fill="none"
        stroke={color}
        strokeOpacity={DIM}
        strokeWidth={LINE}
        strokeLinejoin="round"
      />
      <AnimatedPath
        d={LOGO_PATH}
        fill="none"
        stroke={color}
        strokeWidth={LINE}
        strokeLinejoin="round"
        animatedProps={lightProps}
      />
    </Svg>
  );
}
