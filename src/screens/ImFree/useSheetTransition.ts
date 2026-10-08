import { useEffect, useState } from 'react';
import type { LayoutChangeEvent } from 'react-native';
import {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { ms } from 'react-native-size-matters';
import { scheduleOnRN } from 'react-native-worklets';

const OPEN_TIMING = { duration: 280, easing: Easing.out(Easing.cubic) };
const CLOSE_TIMING = { duration: 220, easing: Easing.in(Easing.cubic) };
/** Off-screen distance used before the sheet's first layout. */
const SHEET_FALLBACK_HEIGHT = ms(480);

/**
 * Fades the backdrop and slides the sheet, keeping the Modal mounted until the
 * close animation finishes.
 */
export function useSheetTransition(visible: boolean) {
  const [mounted, setMounted] = useState(visible);
  const progress = useSharedValue(0);
  const sheetHeight = useSharedValue(SHEET_FALLBACK_HEIGHT);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      progress.value = withTiming(1, OPEN_TIMING);
    } else {
      progress.value = withTiming(0, CLOSE_TIMING, finished => {
        if (finished) {
          scheduleOnRN(setMounted, false);
        }
      });
    }
  }, [visible, progress]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
  }));
  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: (1 - progress.value) * sheetHeight.value }],
  }));

  const onSheetLayout = (event: LayoutChangeEvent) => {
    sheetHeight.value = event.nativeEvent.layout.height;
  };

  return { mounted, backdropStyle, sheetStyle, onSheetLayout };
}
