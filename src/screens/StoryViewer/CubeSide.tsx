import type { ReactNode } from 'react';
import { Platform, useWindowDimensions } from 'react-native';
import Reanimated, {
  useAnimatedStyle,
  type SharedValue,
} from 'react-native-reanimated';

import type { StoryViewerStyles } from './styles';

/** How far the camera sits from the glass, in screen widths. */
const CAMERA_DISTANCE = 2;
/** How dark a side gets as it turns away from the light. */
const SIDE_DIM = 0.6;
/** Narrower than this share of the screen, a side isn't drawn. */
const MIN_SIDE_WIDTH = 0.01;
// Android breaks a transform into view properties and always moves the view
// after the perspective; iOS draws the list as written, so it gets the shift
// first to look the same.
const SHIFT_LAST = Platform.OS === 'android';

interface Props {
  /** Which person in the viewer this side belongs to. */
  index: number;
  /** How far the cube has turned, in people; whole when it's at rest. */
  position: SharedValue<number>;
  styles: StoryViewerStyles;
  pointerEvents?: 'box-none' | 'none';
  children: ReactNode;
}

/** One person's page, as a side of the cube the viewer turns between people. */
export default function CubeSide({
  index,
  position,
  styles,
  pointerEvents,
  children,
}: Props) {
  const { width } = useWindowDimensions();
  const sideStyle = useAnimatedStyle(() =>
    placeSide(index - position.value, width),
  );
  const dimStyle = useAnimatedStyle(() => ({
    opacity:
      SIDE_DIM *
      (1 - Math.cos(Math.min(Math.abs(index - position.value), 1) * HALF_PI)),
  }));

  return (
    <Reanimated.View
      style={[styles.layer, sideStyle]}
      pointerEvents={pointerEvents}
    >
      {children}
      <Reanimated.View
        style={[styles.layer, styles.sideDim, dimStyle]}
        pointerEvents="none"
      />
    </Reanimated.View>
  );
}

const HALF_PI = Math.PI / 2;

/**
 * Puts a side `offset` quarter turns away from facing the viewer, +1 waiting
 * on the right. The cube spins around its own centre, half a screen behind
 * the glass, and is seen in true perspective, so neighbouring sides keep
 * sharing their edge all the way round.
 */
function placeSide(offset: number, width: number) {
  'worklet';
  const angle = offset * HALF_PI;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const half = width / 2;
  const camera = width * CAMERA_DISTANCE;
  // From the camera to the side's centre, which sinks back as it turns.
  const depth = camera + half * (1 - cos);
  const scaleY = camera / depth;
  // Seen at a slant it narrows too, down to nothing once it's edge-on.
  const scaleX = scaleY * (1 - (half * sin * sin) / (depth * cos));
  if (cos <= 0 || scaleX < MIN_SIDE_WIDTH) {
    return { opacity: 0, transform: [] };
  }
  const shift = { translateX: scaleY * half * sin };
  const perspective = { perspective: scaleX * depth };
  const turn = { rotateY: `${angle}rad` };
  return {
    opacity: 1,
    transform: SHIFT_LAST
      ? [perspective, shift, turn, { scaleX }, { scaleY }]
      : [shift, perspective, turn, { scaleX }, { scaleY }],
  };
}
