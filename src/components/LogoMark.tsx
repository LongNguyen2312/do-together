import Animated, {
  useAnimatedProps,
  type SharedValue,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

const AnimatedPath = Animated.createAnimatedComponent(Path);

/*
 * The app's mark, measured off logo-mark.png (216 px): two pills (capsules),
 * one along each diagonal, woven through each other. Each pill is two half
 * circles round opposite corners joined by two straight sides; where a side
 * passes under the other pill it's hidden. So each pill is drawn as its two
 * visible pieces: a half circle with the visible stretch of the side after
 * it, and the same turned half a turn for its other end. All four pieces
 * together are the whole mark.
 */
const BOX = 216;
const MIDDLE = 107.5;
const RADIUS = 42.9;
const LINE = 28.3;
const HALF_CIRCLE = Math.PI * RADIUS;
/** A side, corner to corner; only the first VISIBLE of it shows. */
const SIDE = 136.3;
const VISIBLE = 89;
/** One visible piece: a half circle, then as much of the side as shows. */
const PIECE_LENGTH = HALF_CIRCLE + VISIBLE;
/** Top-left piece: over the top-left corner, then down-right to where it goes under. */
const PIECE = `M29.1 89.6A${RADIUS} ${RADIUS} 0 0 1 89.7 29L152.6 91.9`;
/** Once round a pill: both half circles and both whole sides. */
const LOOP = 2 * (HALF_CIRCLE + SIDE);
/**
 * One light round each pill: the "\" one (top-left and bottom-right pieces)
 * and the "/" one (top-right and bottom-left). `from` is where a piece
 * starts along its pill's loop.
 */
const PIECES = [
  { turn: 0, from: 0 },
  { turn: 180, from: HALF_CIRCLE + SIDE },
  { turn: 90, from: 0 },
  { turn: 270, from: HALF_CIRCLE + SIDE },
];
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
   * Looping, 0–1, repeating: the first half lights the pills from dark,
   * keeping what's lit; the second draws the light back off them.
   */
  phase: SharedValue<number>;
}

/**
 * The app's mark drawn in lines, faded, with light running along them: the
 * app's loading indicator, in whatever colour the screen uses.
 */
export default function LogoMark({ size, color, pull, looping, phase }: Props) {
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${BOX} ${BOX}`}>
      {PIECES.map(({ turn }) => (
        <Path
          key={`dim-${turn}`}
          d={PIECE}
          transform={`rotate(${turn} ${MIDDLE} ${MIDDLE})`}
          fill="none"
          stroke={color}
          strokeOpacity={DIM}
          strokeWidth={LINE}
        />
      ))}
      {PIECES.map(({ turn, from }) => (
        <LitPiece
          key={turn}
          turn={turn}
          from={from}
          color={color}
          pull={pull}
          looping={looping}
          phase={phase}
        />
      ))}
    </Svg>
  );
}

/**
 * One visible piece of a pill and its share of the pill's light: as far
 * round the loop as `pull` has got, or, looping, as far as the light has
 * drawn in (or back) round it. Under the other pill there's nothing to light.
 */
function LitPiece({
  turn,
  from,
  color,
  pull,
  looping,
  phase,
}: {
  turn: number;
  /** Where along its pill's loop this piece starts. */
  from: number;
  color: string;
  pull: SharedValue<number>;
  looping: SharedValue<boolean>;
  phase: SharedValue<number>;
}) {
  const lightProps = useAnimatedProps(() => {
    /** The part of [start, end] round the loop on this piece, in its own terms. */
    const onPiece = (start: number, end: number) => [
      Math.min(Math.max(start - from, 0), PIECE_LENGTH),
      Math.min(Math.max(end - from, 0), PIECE_LENGTH),
    ];
    let lit;
    if (looping.value) {
      const at = phase.value;
      lit =
        at < 0.5
          ? onPiece(0, at * 2 * LOOP)
          : onPiece((at * 2 - 1) * LOOP, LOOP);
    } else {
      lit = onPiece(0, pull.value * LOOP);
    }
    return {
      strokeDasharray: [lit[1] - lit[0], PIECE_LENGTH * 2],
      strokeDashoffset: -lit[0],
    };
  });
  return (
    <AnimatedPath
      d={PIECE}
      transform={`rotate(${turn} ${MIDDLE} ${MIDDLE})`}
      fill="none"
      stroke={color}
      strokeWidth={LINE}
      animatedProps={lightProps}
    />
  );
}
