import { useCallback, useEffect, useMemo, useRef } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import {
  isLiquidGlassSupported,
  LiquidGlassView,
} from '@callstack/liquid-glass';
import { useTranslation } from 'react-i18next';
import { GestureDetector, usePanGesture } from 'react-native-gesture-handler';
import Animated, {
  cancelAnimation,
  interpolate,
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Icon as PhosphorIcon } from 'phosphor-react-native';
import { CompassIcon } from 'phosphor-react-native/src/icons/Compass';
import { HouseIcon } from 'phosphor-react-native/src/icons/House';
import { PlusIcon } from 'phosphor-react-native/src/icons/Plus';
import { PulseIcon } from 'phosphor-react-native/src/icons/Pulse';
import { UserCircleIcon } from 'phosphor-react-native/src/icons/UserCircle';
import { ms } from 'react-native-size-matters';
import { scheduleOnRN } from 'react-native-worklets';

import { fonts, fs, useTheme, type AppColors } from '@/theme';
import type { MainTabParamList } from '@/types/navigation';
import { MAX_CONTENT_WIDTH } from '@/utils/constants';

const BAR_HEIGHT = ms(56);
/** The "I'm free" button is a circle as tall as the bar, beside it. */
const FREE_SIZE = BAR_HEIGHT;
const FREE_GAP = ms(10);
const MIN_BOTTOM = ms(12);
const BAR_PADDING = ms(6);
/** How far the sliding lens spills past the bar, like the iOS 26 tab bar. */
const LENS_OVERFLOW_X = ms(6);
const LENS_OVERFLOW_Y = ms(10);
const LENS_RADIUS = ms(32);
const LENS_SIDE_GLOW = ms(12);
/**
 * Under-damped so the lens overshoots and wobbles like liquid; the raised
 * energy threshold ends it once the wobble is too small to see.
 */
const LENS_SPRING = {
  damping: 20,
  stiffness: 170,
  mass: 0.8,
  energyThreshold: 1e-3,
};
/** Peak horizontal stretch mid-travel; the lens squashes vertically to keep its volume. */
const LENS_MAX_STRETCH = 0.18;
/** Finger speed (px/s) at which a dragged lens is fully stretched. */
const LENS_DRAG_SPEED = 2500;
/**
 * Real glass breaks under an animated opacity, so it hides by shrinking away;
 * the hand-drawn fallback can shrink a little and fade instead.
 */
const LENS_HIDDEN_SCALE = isLiquidGlassSupported ? 0 : 0.82;
const LENS_SHOW_MS = 110;
const LENS_FADE_MS = 120;
/** How much icons grow while the lens passes over them. */
const LENS_MAGNIFY = 0.18;
const DRAG_OFFSET = 6;

/** Focused tabs use the filled weight of the same icon. */
const TAB_ICONS: Record<keyof MainTabParamList, PhosphorIcon> = {
  Home: HouseIcon,
  Discover: CompassIcon,
  Activities: PulseIcon,
  Profile: UserCircleIcon,
};

type Styles = ReturnType<typeof createStyles>;

/** Space screens must leave at the bottom so content clears the floating bar. */
export function useTabBarInset() {
  const insets = useSafeAreaInsets();
  return Math.max(insets.bottom, MIN_BOTTOM) + BAR_HEIGHT;
}

export default function LiquidTabBar({ state, navigation }: BottomTabBarProps) {
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const tabCount = state.routes.length;

  const tabWidth = useSharedValue(0);
  /** Lens position measured in tabs, so it can sit between two of them. */
  const lensX = useSharedValue(state.index);
  const lensFrom = useSharedValue(state.index);
  const lensTarget = useSharedValue(state.index);
  const lensShown = useSharedValue(0);
  const dragging = useSharedValue(false);
  const dragSpeed = useSharedValue(0);
  const previousIndex = useRef(state.index);

  const selectTab = (index: number) => {
    const route = state.routes[index];
    const event = navigation.emit({
      type: 'tabPress',
      target: route.key,
      canPreventDefault: true,
    });
    if (state.index !== index && !event.defaultPrevented) {
      navigation.navigate(route.name, route.params);
    }
  };
  const selectTabRef = useRef(selectTab);
  selectTabRef.current = selectTab;
  const selectDraggedTab = useCallback(
    (index: number) => selectTabRef.current(index),
    [],
  );

  useEffect(() => {
    if (previousIndex.current === state.index) {
      return;
    }
    previousIndex.current = state.index;
    if (lensTarget.value === state.index) {
      return; // A drag already sent the lens here.
    }
    lensFrom.value = lensX.value;
    lensTarget.value = state.index;
    lensShown.value = withTiming(1, { duration: LENS_SHOW_MS });
    lensX.value = withSpring(state.index, LENS_SPRING, finished => {
      'worklet';
      if (finished && !dragging.value) {
        lensShown.value = withTiming(0, { duration: LENS_FADE_MS });
      }
    });
  }, [state.index, lensX, lensFrom, lensTarget, lensShown, dragging]);

  const pan = usePanGesture({
    activeOffsetX: [-DRAG_OFFSET, DRAG_OFFSET],
    onActivate: () => {
      'worklet';
      dragging.value = true;
      cancelAnimation(lensX);
      lensShown.value = withTiming(1, { duration: LENS_SHOW_MS });
    },
    onUpdate: event => {
      'worklet';
      if (!tabWidth.value) {
        return;
      }
      const position = (event.x - BAR_PADDING) / tabWidth.value - 0.5;
      lensX.value = Math.min(Math.max(position, 0), tabCount - 1);
      dragSpeed.value = Math.min(
        Math.abs(event.velocityX) / LENS_DRAG_SPEED,
        1,
      );
    },
    onDeactivate: () => {
      'worklet';
      dragging.value = false;
      dragSpeed.value = 0;
      const target = Math.round(lensX.value);
      lensFrom.value = lensX.value;
      lensTarget.value = target;
      lensX.value = withSpring(target, LENS_SPRING, finished => {
        if (finished && !dragging.value) {
          lensShown.value = withTiming(0, { duration: LENS_FADE_MS });
        }
      });
      scheduleOnRN(selectDraggedTab, target);
    },
  });

  const lensStyle = useAnimatedStyle(() => {
    let stretch: number;
    if (dragging.value) {
      stretch = dragSpeed.value;
    } else {
      // Bell curve over the trip: flat at both ends, longest mid-way, and
      // negative (squashed) while the spring overshoots the target.
      const travel = Math.abs(lensTarget.value - lensFrom.value);
      const progress = travel
        ? Math.abs(lensX.value - lensFrom.value) / travel
        : 1;
      stretch = Math.max(
        4 * progress * (1 - progress) * Math.min(travel, 1),
        -0.4,
      );
    }
    stretch *= LENS_MAX_STRETCH;
    const scale = interpolate(lensShown.value, [0, 1], [LENS_HIDDEN_SCALE, 1]);
    return {
      opacity: isLiquidGlassSupported ? 1 : lensShown.value,
      width: tabWidth.value + LENS_OVERFLOW_X * 2,
      transform: [
        { translateX: lensX.value * tabWidth.value },
        { scaleX: (1 + stretch) * scale },
        { scaleY: (1 - stretch * 0.5) * scale },
      ],
    };
  });

  const onImFree = () => {
    Alert.alert(t('auth.comingSoonTitle'), t('auth.comingSoonMessage'));
  };

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.container,
        { paddingBottom: Math.max(insets.bottom, MIN_BOTTOM) },
      ]}
    >
      <GestureDetector gesture={pan}>
        <View
          style={styles.barWrap}
          onLayout={event => {
            tabWidth.value =
              (event.nativeEvent.layout.width - BAR_PADDING * 2) / tabCount;
          }}
        >
          <LiquidGlassView
            effect="clear"
            colorScheme={isDark ? 'dark' : 'light'}
            style={[styles.bar, !isLiquidGlassSupported && styles.barFallback]}
          />
          <Animated.View pointerEvents="none" style={[styles.lens, lensStyle]}>
            {isLiquidGlassSupported ? (
              <LiquidGlassView
                effect="clear"
                colorScheme={isDark ? 'dark' : 'light'}
                style={styles.lensGlass}
              />
            ) : null}
            {/* Rim and frosted side edges drawn over the glass. */}
            <View style={styles.lensBody} />
          </Animated.View>
          {/* Tabs render above the lens so its rims never cover them. */}
          <View style={styles.tabs}>
            {state.routes.map((route, index) => {
              const name = route.name as keyof MainTabParamList;
              return (
                <TabButton
                  key={route.key}
                  name={name}
                  index={index}
                  focused={state.index === index}
                  label={t(`tabs.${name.toLowerCase()}`)}
                  lensX={lensX}
                  lensShown={lensShown}
                  styles={styles}
                  onPress={() => selectTab(index)}
                  onLongPress={() =>
                    navigation.emit({ type: 'tabLongPress', target: route.key })
                  }
                />
              );
            })}
          </View>
        </View>
      </GestureDetector>
      <LiquidGlassView
        interactive
        effect="clear"
        colorScheme={isDark ? 'dark' : 'light'}
        style={[
          styles.freeButton,
          !isLiquidGlassSupported && styles.freeFallback,
        ]}
      >
        <Pressable
          onPress={onImFree}
          style={styles.freePressable}
          accessibilityRole="button"
          accessibilityLabel={t('home.imFree')}
        >
          <PlusIcon size={ms(26)} weight="bold" color={colors.primary} />
        </Pressable>
      </LiquidGlassView>
    </View>
  );
}

interface TabButtonProps {
  name: keyof MainTabParamList;
  index: number;
  focused: boolean;
  label: string;
  lensX: SharedValue<number>;
  lensShown: SharedValue<number>;
  styles: Styles;
  onPress: () => void;
  onLongPress: () => void;
}

function TabButton({
  name,
  index,
  focused,
  label,
  lensX,
  lensShown,
  styles,
  onPress,
  onLongPress,
}: TabButtonProps) {
  const { colors } = useTheme();
  const TabIcon = TAB_ICONS[name];
  const color = focused ? colors.primary : colors.textSecondary;

  const magnifyStyle = useAnimatedStyle(() => {
    const under = Math.max(0, 1 - Math.abs(lensX.value - index));
    return {
      transform: [{ scale: 1 + LENS_MAGNIFY * under * lensShown.value }],
    };
  });

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      style={styles.tab}
      accessibilityRole="tab"
      accessibilityState={{ selected: focused }}
      accessibilityLabel={label}
    >
      <Animated.View style={[styles.tabInner, magnifyStyle]}>
        <TabIcon
          size={ms(26)}
          weight={focused ? 'fill' : 'regular'}
          color={color}
        />
        {focused ? (
          <Text style={[styles.tabLabel, { color }]} numberOfLines={1}>
            {label}
          </Text>
        ) : null}
      </Animated.View>
    </Pressable>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    container: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: FREE_GAP,
      paddingHorizontal: ms(16),
    },
    freeButton: {
      width: FREE_SIZE,
      height: FREE_SIZE,
      borderRadius: FREE_SIZE / 2,
      shadowColor: colors.black,
      shadowOpacity: 0.12,
      shadowRadius: ms(14),
      shadowOffset: { width: 0, height: ms(6) },
    },
    freeFallback: {
      backgroundColor: colors.primarySoft,
      elevation: 6,
    },
    freePressable: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    barWrap: {
      flex: 1,
      maxWidth: MAX_CONTENT_WIDTH - FREE_SIZE - FREE_GAP,
      height: BAR_HEIGHT,
    },
    bar: {
      ...StyleSheet.absoluteFill,
      borderRadius: BAR_HEIGHT / 2,
    },
    tabs: {
      ...StyleSheet.absoluteFill,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: BAR_PADDING,
    },
    lens: {
      position: 'absolute',
      top: -LENS_OVERFLOW_Y,
      bottom: -LENS_OVERFLOW_Y,
      left: BAR_PADDING - LENS_OVERFLOW_X,
    },
    lensGlass: {
      ...StyleSheet.absoluteFill,
      borderRadius: LENS_RADIUS,
    },
    lensBody: {
      ...StyleSheet.absoluteFill,
      borderRadius: LENS_RADIUS,
      borderWidth: ms(1),
      borderColor: `${colors.white}D9`,
      // Frosted left/right edges, drawn inside the lens.
      boxShadow: [
        `0 ${ms(6)}px ${ms(16)}px ${colors.black}4D`,
        `inset ${LENS_SIDE_GLOW}px 0 ${LENS_SIDE_GLOW}px -${ms(4)}px ${
          colors.white
        }4D`,
        `inset -${LENS_SIDE_GLOW}px 0 ${LENS_SIDE_GLOW}px -${ms(4)}px ${
          colors.white
        }4D`,
      ].join(', '),
    },
    barFallback: {
      backgroundColor: colors.card,
      shadowColor: colors.black,
      shadowOpacity: 0.12,
      shadowRadius: ms(16),
      shadowOffset: { width: 0, height: ms(6) },
      elevation: 8,
    },
    tab: {
      flex: 1,
      height: '100%',
      justifyContent: 'center',
    },
    tabInner: {
      height: BAR_HEIGHT - ms(12),
      borderRadius: (BAR_HEIGHT - ms(12)) / 2,
      alignItems: 'center',
      justifyContent: 'center',
      gap: ms(2),
    },
    tabLabel: {
      fontSize: fs(10),
      lineHeight: ms(12),
      fontFamily: fonts.bold,
    },
  });
}
