import {
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import {
  GestureDetector,
  ScrollView,
  usePanGesture,
} from 'react-native-gesture-handler';
import Animated, {
  type SharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { ms } from 'react-native-size-matters';
import { scheduleOnRN } from 'react-native-worklets';

import { useTheme, type AppColors } from '@/theme';

const ACTIVE_OFFSET = 8;
const FAIL_OFFSET_X = 16;
/** px/s; faster releases snap in the fling direction. */
const FLING_VELOCITY = 300;
/** Share of the travel a slow drag needs to cover to switch stops. */
const SWITCH_RATIO = 0.2;
const SHEET_RADIUS = ms(28);
const SPRING = { damping: 26, stiffness: 260, mass: 0.9 };

const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);

interface BottomSheetProps {
  /** Height of the sheet when fully expanded. */
  expandedHeight: number;
  /** Visible height when collapsed. */
  collapsedHeight: number;
  /**
   * Driven by the sheet: 0 when expanded, expandedHeight - collapsedHeight
   * when collapsed. Lets siblings (e.g. map controls) follow the sheet.
   */
  translateY: SharedValue<number>;
  header: ReactNode;
  children: ReactNode;
  contentContainerStyle?: StyleProp<ViewStyle>;
}

/**
 * Two-stop sheet whose drag and snap run on the UI thread. While expanded the
 * list scrolls; pulling down from the top of the list collapses the sheet.
 */
export default function BottomSheet({
  expandedHeight,
  collapsedHeight,
  translateY,
  header,
  children,
  contentContainerStyle,
}: BottomSheetProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const collapsedOffset = Math.max(expandedHeight - collapsedHeight, 0);

  const [expanded, setExpanded] = useState(false);
  const expandedRef = useRef(false);
  const maxOffset = useSharedValue(collapsedOffset);
  const scrollY = useSharedValue(0);
  const dragStart = useSharedValue(0);
  const startedExpanded = useSharedValue(false);

  useLayoutEffect(() => {
    maxOffset.value = collapsedOffset;
    translateY.value = expandedRef.current ? 0 : collapsedOffset;
  }, [collapsedOffset, maxOffset, translateY]);

  const onSnapped = (toExpanded: boolean) => {
    expandedRef.current = toExpanded;
    setExpanded(toExpanded);
  };

  const snapTo = (toExpanded: boolean) => {
    onSnapped(toExpanded);
    translateY.value = withSpring(toExpanded ? 0 : collapsedOffset, SPRING);
  };

  const pan = usePanGesture({
    activeOffsetY: [-ACTIVE_OFFSET, ACTIVE_OFFSET],
    failOffsetX: [-FAIL_OFFSET_X, FAIL_OFFSET_X],
    onActivate: () => {
      'worklet';
      dragStart.value = translateY.value;
      startedExpanded.value = translateY.value <= 0;
    },
    onUpdate: event => {
      'worklet';
      const atTop = translateY.value <= 0;
      // Let the list scroll instead while it isn't at its top, or when
      // pushing up on a fully expanded sheet; re-anchor so the sheet follows
      // the finger from wherever the list hands the gesture back.
      if (atTop && (scrollY.value > 0 || event.translationY < 0)) {
        dragStart.value = -event.translationY;
        return;
      }
      translateY.value = Math.min(
        Math.max(dragStart.value + event.translationY, 0),
        maxOffset.value,
      );
    },
    onDeactivate: event => {
      'worklet';
      const offset = maxOffset.value;
      const position = translateY.value;
      let toExpanded: boolean;
      if (position <= 0 && scrollY.value > 0) {
        // The list consumed the gesture; the sheet never moved.
        toExpanded = true;
      } else if (event.velocityY < -FLING_VELOCITY) {
        toExpanded = true;
      } else if (event.velocityY > FLING_VELOCITY) {
        toExpanded = false;
      } else if (startedExpanded.value) {
        toExpanded = position < offset * SWITCH_RATIO;
      } else {
        toExpanded = position < offset * (1 - SWITCH_RATIO);
      }
      translateY.value = withSpring(toExpanded ? 0 : offset, {
        ...SPRING,
        velocity: event.velocityY,
      });
      scheduleOnRN(onSnapped, toExpanded);
    },
  });

  const onScroll = useAnimatedScrollHandler(event => {
    scrollY.value = event.contentOffset.y;
  });

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <GestureDetector gesture={pan}>
      <Animated.View
        style={[styles.sheet, { height: expandedHeight }, sheetStyle]}
      >
        <Pressable
          onPress={() => snapTo(!expandedRef.current)}
          accessibilityRole="adjustable"
          accessibilityState={{ expanded }}
        >
          <View style={styles.handle} />
          {header}
        </Pressable>
        <AnimatedScrollView
          scrollEnabled={expanded}
          simultaneousWith={pan}
          bounces={false}
          showsVerticalScrollIndicator={false}
          scrollEventThrottle={16}
          onScroll={onScroll}
          contentContainerStyle={contentContainerStyle}
        >
          {children}
        </AnimatedScrollView>
      </Animated.View>
    </GestureDetector>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    sheet: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      borderTopLeftRadius: SHEET_RADIUS,
      borderTopRightRadius: SHEET_RADIUS,
      backgroundColor: colors.background,
      shadowColor: colors.black,
      shadowOpacity: 0.1,
      shadowRadius: ms(16),
      shadowOffset: { width: 0, height: -ms(4) },
      elevation: 12,
    },
    handle: {
      alignSelf: 'center',
      width: ms(36),
      height: ms(5),
      marginTop: ms(8),
      borderRadius: ms(3),
      backgroundColor: colors.border,
    },
  });
}
