import {
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  type ReactNode,
  type Ref,
} from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { GestureDetector, usePanGesture } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { ms } from 'react-native-size-matters';
import Icon from 'react-native-vector-icons/Ionicons';
import { scheduleOnRN } from 'react-native-worklets';

import { fonts, fs, useTheme, type AppColors } from '@/theme';

/** Open, the row sits this far left, uncovering the button. */
const BUTTON_WIDTH = ms(84);
/** Round the button, inside the space it's uncovered. */
const BUTTON_INSET = ms(8);
/** Sideways travel before a touch starts swiping the row. */
const SWIPE_SLOP = ms(10);
/** Past this share of the row, letting go deletes without the tap. */
const FULL_SHARE = 0.55;
/** pt/s; a quick flick left opens it, right closes it. */
const FLICK_VELOCITY = 500;
const SETTLE = { damping: 26, stiffness: 300, mass: 0.8 };
/** How much bigger the button gets once letting go would delete. */
const ARMED_SWELL = 0.15;

export interface SwipeToDeleteHandle {
  close: () => void;
  isOpen: () => boolean;
}

interface Props {
  ref?: Ref<SwipeToDeleteHandle>;
  label: string;
  /** Tapped the button, or swiped all the way: confirm, then delete. */
  onDelete: () => void;
  children: ReactNode;
}

/** Closes the row that's swiped open, if any: one at a time, app-wide. */
let closeOpenRow: (() => void) | null = null;

/** Closes whichever row is swiped open, e.g. as its list scrolls. */
export function closeSwipedRow() {
  closeOpenRow?.();
}

/**
 * A row that swipes left to delete, as on Messenger: a short swipe uncovers
 * a delete button; dragged further the button stretches after it, its icon
 * and label staying at its end, by the screen edge; past halfway and let go, it deletes straight
 * away (`onDelete` asks to confirm either way). Starting to swipe one row
 * closes any other that's open. Closes again with `close()`, e.g. when the
 * delete's cancelled.
 */
export default function SwipeToDelete({
  ref,
  label,
  onDelete,
  children,
}: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const x = useSharedValue(0);
  const start = useSharedValue(0);
  const width = useSharedValue(0);
  /** Past the full-swipe point: letting go deletes. */
  const armed = useSharedValue(0);

  const settle = (to: number) => {
    'worklet';
    x.value = withSpring(to, SETTLE);
  };

  // The same function for the row's whole life, so it knows itself in
  // `closeOpenRow`.
  const close = useRef(() => {
    settle(0);
    if (closeOpenRow === close.current) {
      closeOpenRow = null;
    }
  });
  // Touched to swipe: any other open row closes first.
  const claim = () => {
    if (closeOpenRow !== close.current) {
      closeOpenRow?.();
    }
    closeOpenRow = close.current;
  };
  // Gone (e.g. deleted) while open: nothing left to close.
  useEffect(
    () => () => {
      if (closeOpenRow === close.current) {
        closeOpenRow = null;
      }
    },
    [],
  );

  useImperativeHandle(ref, () => ({
    close: close.current,
    isOpen: () => x.value < 0,
  }));

  const swipe = usePanGesture({
    activeOffsetX: [-SWIPE_SLOP, SWIPE_SLOP],
    failOffsetY: [-SWIPE_SLOP, SWIPE_SLOP],
    onActivate: () => {
      'worklet';
      start.value = x.value;
      scheduleOnRN(claim);
    },
    onUpdate: event => {
      'worklet';
      // Left only, and no further than the row's own width.
      x.value = Math.min(
        Math.max(start.value + event.translationX, -width.value),
        0,
      );
    },
    onDeactivate: event => {
      'worklet';
      if (armed.value) {
        // Off the row entirely, then confirm; a cancel brings it back.
        x.value = withTiming(-width.value, {
          duration: 160,
          easing: Easing.out(Easing.cubic),
        });
        scheduleOnRN(onDelete);
        return;
      }
      const open =
        event.velocityX < -FLICK_VELOCITY ||
        (event.velocityX < FLICK_VELOCITY && x.value < -BUTTON_WIDTH / 2);
      settle(open ? -BUTTON_WIDTH : 0);
    },
  });

  // Arms past the point, disarms back short of it.
  useAnimatedReaction(
    () => width.value > 0 && -x.value > width.value * FULL_SHARE,
    (past, before) => {
      if (past !== before) {
        armed.value = withTiming(past ? 1 : 0, { duration: 140 });
      }
    },
  );

  const rowStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }],
  }));
  // The uncovered strip: as wide as the row's moved, never less than the
  // button, so it slides in whole and then stretches after the row.
  const actionStyle = useAnimatedStyle(() => ({
    width: Math.max(-x.value, BUTTON_WIDTH),
    transform: [{ translateX: Math.max(BUTTON_WIDTH + x.value, 0) }],
  }));
  // Armed, the icon swells a little, showing that letting go deletes.
  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + ARMED_SWELL * armed.value }],
  }));

  return (
    <View
      style={styles.root}
      onLayout={event => {
        width.value = event.nativeEvent.layout.width;
      }}
    >
      <Animated.View style={[styles.action, actionStyle]}>
        <Pressable
          onPress={onDelete}
          style={({ pressed }) => [styles.button, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel={label}
        >
          {/* At the button's end, by the screen edge, however far it stretches. */}
          <Animated.View style={[styles.buttonContent, iconStyle]}>
            <Icon name="trash-outline" size={ms(20)} color={colors.white} />
            <Text style={styles.label}>{label}</Text>
          </Animated.View>
        </Pressable>
      </Animated.View>
      <GestureDetector gesture={swipe}>
        <Animated.View style={rowStyle}>{children}</Animated.View>
      </GestureDetector>
    </View>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    root: {
      overflow: 'hidden',
    },
    action: {
      position: 'absolute',
      top: 0,
      bottom: 0,
      right: 0,
      padding: BUTTON_INSET,
    },
    button: {
      flex: 1,
      alignItems: 'flex-end',
      justifyContent: 'center',
      borderRadius: ms(18),
      borderCurve: 'continuous',
      overflow: 'hidden',
      backgroundColor: colors.primary,
    },
    buttonContent: {
      width: BUTTON_WIDTH - BUTTON_INSET * 2,
      alignItems: 'center',
      gap: ms(3),
    },
    pressed: {
      opacity: 0.8,
    },
    label: {
      fontSize: fs(12),
      fontFamily: fonts.semibold,
      color: colors.white,
    },
  });
}
