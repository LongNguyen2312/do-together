import { memo } from 'react';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import Reanimated, {
  useAnimatedProps,
  useAnimatedStyle,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { ms } from 'react-native-size-matters';
import Svg, { Circle } from 'react-native-svg';

import {
  SHUTTER_DOT,
  SHUTTER_DOTS,
  SHUTTER_SIZE,
  SHUTTER_TINT,
  type StoryCameraStyles,
} from './styles';

const AnimatedCircle = Reanimated.createAnimatedComponent(Circle);
/** Held this long, the shutter records instead of taking a photo. */
const HOLD_MS = 250;
/** Grows a little while recording, like the usual story cameras. */
const RECORDING_SCALE = 1.12;

const centre = SHUTTER_SIZE / 2;
const dotsRadius = centre - SHUTTER_DOT;
/** The dots round the ring, clockwise from the top. */
const DOTS = Array.from({ length: SHUTTER_DOTS }, (_, i) => {
  const angle = (i / SHUTTER_DOTS) * 2 * Math.PI - Math.PI / 2;
  return {
    cx: centre + dotsRadius * Math.cos(angle),
    cy: centre + dotsRadius * Math.sin(angle),
  };
});

/** The whole way round the dots. */
const PROGRESS_LENGTH = 2 * Math.PI * dotsRadius;

export type CaptureMode = 'photo' | 'video';

interface Props {
  mode: CaptureMode;
  recording: boolean;
  /** How much of the longest clip has been recorded, 0–1. */
  recorded: SharedValue<number>;
  /** A tap: a photo, or (for video) start or stop. */
  onTap: () => void;
  /** Held down: records until let go. */
  onHoldStart: () => void;
  onHoldEnd: () => void;
  styles: StoryCameraStyles;
}

/**
 * A ring inside a ring of dots, red in video mode. Tap for a photo, hold to
 * record; a solid line runs round over the dots as the clip goes on, full at
 * 30 seconds.
 */
function Shutter({
  mode,
  recording,
  recorded,
  onTap,
  onHoldStart,
  onHoldEnd,
  styles,
}: Props) {
  const { t } = useTranslation();

  const progressProps = useAnimatedProps(() => ({
    strokeDashoffset: PROGRESS_LENGTH * (1 - recorded.value),
  }));

  const growStyle = useAnimatedStyle(() => ({
    transform: [
      {
        scale: withTiming(recording ? RECORDING_SCALE : 1, { duration: 180 }),
      },
    ],
  }));

  return (
    <Pressable
      onPress={onTap}
      onLongPress={onHoldStart}
      onPressOut={onHoldEnd}
      delayLongPress={HOLD_MS}
      style={styles.shutter}
      hitSlop={ms(8)}
      accessibilityRole="button"
      accessibilityLabel={
        recording
          ? t('storyCamera.stopRecording')
          : mode === 'photo'
          ? t('storyCamera.takePhoto')
          : t('storyCamera.record')
      }
      accessibilityHint={
        mode === 'photo' ? t('storyCamera.holdToRecord') : undefined
      }
    >
      <Reanimated.View style={[styles.shutterBody, growStyle]}>
        <Svg
          width={SHUTTER_SIZE}
          height={SHUTTER_SIZE}
          style={styles.shutterDots}
        >
          {DOTS.map((dot, i) => (
            <Circle key={i} {...dot} r={SHUTTER_DOT / 2} fill={SHUTTER_TINT} />
          ))}
          {recording ? (
            <AnimatedCircle
              cx={centre}
              cy={centre}
              r={dotsRadius}
              stroke={SHUTTER_TINT}
              strokeWidth={SHUTTER_DOT}
              strokeLinecap="round"
              strokeDasharray={PROGRESS_LENGTH}
              animatedProps={progressProps}
              // From the top, clockwise.
              rotation={-90}
              origin={`${centre}, ${centre}`}
              fill="none"
            />
          ) : null}
        </Svg>
        {/* Red in video mode, so it reads as record; the filter still shows
            through. Recording, it holds a square to stop. */}
        <View
          style={[
            styles.shutterRing,
            (mode === 'video' || recording) && styles.shutterRingRecord,
          ]}
        />
        {recording ? <View style={styles.stopSquare} /> : null}
      </Reanimated.View>
    </Pressable>
  );
}

export default memo(Shutter);
