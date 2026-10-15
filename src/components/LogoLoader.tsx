import { useEffect } from 'react';
import {
  cancelAnimation,
  Easing,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { ms } from 'react-native-size-matters';

import LogoMark from '@/components/LogoMark';

/** Lighting the mark from dark and drawing the light back off it. */
export const LOGO_LOOP_MS = 2400;

/** As big as the system spinner's small and large sizes, about. */
const SIZES = { small: ms(22), large: ms(36) };

interface Props {
  /** Colour of the screen's loading: white over photos, the brand's on pages. */
  color: string;
  size?: keyof typeof SIZES;
}

/**
 * The app's loading indicator, in place of the system spinner: its mark,
 * faded, lit along its lines from dark, then dark again, round and round.
 */
export default function LogoLoader({ color, size = 'small' }: Props) {
  const phase = useSharedValue(0);
  const looping = useSharedValue(true);
  const pull = useSharedValue(0);

  useEffect(() => {
    phase.value = withRepeat(
      withTiming(1, { duration: LOGO_LOOP_MS, easing: Easing.linear }),
      -1,
    );
    return () => cancelAnimation(phase);
  }, [phase]);

  return (
    <LogoMark
      size={SIZES[size]}
      color={color}
      pull={pull}
      looping={looping}
      phase={phase}
    />
  );
}
