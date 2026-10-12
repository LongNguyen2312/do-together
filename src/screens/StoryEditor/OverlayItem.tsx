import { memo } from 'react';
import {
  useWindowDimensions,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import {
  GestureDetector,
  useCompetingGestures,
  usePanGesture,
  usePinchGesture,
  useRotationGesture,
  useSimultaneousGestures,
  useTapGesture,
} from 'react-native-gesture-handler';
import Reanimated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ms } from 'react-native-size-matters';
import { scheduleOnRN } from 'react-native-worklets';

import { OverlayContent } from '@/components/StoryOverlays';
import { useStoryCanvas } from '@/hooks/useStoryCanvas';
import type { StoryOverlay } from '@/types/story';

import type { StoryEditorStyles } from './styles';

const MIN_SCALE = 0.3;
const MAX_SCALE = 6;
/** Shrinks over the trash, to show it'll go if let go there. */
const TRASH_SCALE = 0.45;
/** Fingers count as on a small sticker without hitting it exactly. */
const HIT_SLOP = ms(24);
/** Kept this far inside the safe area. */
const EDGE = ms(8);

export type Placement = Pick<StoryOverlay, 'x' | 'y' | 'scale' | 'rotation'>;

interface Props {
  overlay: StoryOverlay;
  styles: StoryEditorStyles;
  /** While the text is open in the composer. */
  hidden?: boolean;
  /** Screen y below which a dragged finger is over the trash. */
  trashTop: number;
  /** Set while any overlay is being dragged; the editor hides its buttons. */
  dragging: SharedValue<boolean>;
  /** Set while the dragged finger is over the trash. */
  overTrash: SharedValue<boolean>;
  onPlace: (id: string, placement: Placement) => void;
  onDelete: (id: string) => void;
  /** Gets the id: the overlay in a gesture's closure may be out of date. */
  onEdit: (id: string) => void;
}

/**
 * Text or a sticker on the story being made: drag to move, pinch to resize,
 * twist to turn, tap text to edit it, drop on the trash to remove it. It all
 * runs on the UI thread, without a React render until the fingers lift, and
 * the whole overlay stays inside the safe area.
 */
function OverlayItem({
  overlay,
  styles,
  hidden,
  trashTop,
  dragging,
  overTrash,
  onPlace,
  onDelete,
  onEdit,
}: Props) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  /** Positions are shares of the story's frame, as when it's watched. */
  const canvas = useStoryCanvas();
  const id = overlay.id;
  /** The overlay's centre, in screen points. */
  const x = useSharedValue(overlay.x * width);
  const y = useSharedValue(canvas.top + overlay.y * canvas.height);
  const scale = useSharedValue(overlay.scale);
  const rotation = useSharedValue(overlay.rotation);
  /** Unscaled size, measured once laid out. */
  const size = useSharedValue({ width: 0, height: 0 });
  const start = useSharedValue({ x: 0, y: 0, scale: 1, rotation: 0 });
  const trashShrink = useSharedValue(1);

  // The story's frame already sits inside the safe area, top to bottom.
  const area = {
    left: insets.left + EDGE,
    right: width - insets.right - EDGE,
    top: canvas.top + EDGE,
    bottom: canvas.top + canvas.height - EDGE,
  };

  /** Keeps the scaled overlay inside the safe area (centred if it can't fit). */
  const clampCentre = (
    centre: number,
    half: number,
    lo: number,
    hi: number,
  ) => {
    'worklet';
    if (hi - lo <= half * 2) {
      return (lo + hi) / 2;
    }
    return Math.min(Math.max(centre, lo + half), hi - half);
  };

  const keepInside = () => {
    'worklet';
    x.value = clampCentre(
      x.value,
      (size.value.width * scale.value) / 2,
      area.left,
      area.right,
    );
    y.value = clampCentre(
      y.value,
      (size.value.height * scale.value) / 2,
      area.top,
      area.bottom,
    );
  };

  const save = () => {
    'worklet';
    keepInside();
    scheduleOnRN(onPlace, id, {
      x: x.value / width,
      y: (y.value - canvas.top) / canvas.height,
      scale: scale.value,
      rotation: rotation.value,
    });
  };

  const setOverTrash = (over: boolean) => {
    'worklet';
    if (over !== overTrash.value) {
      overTrash.value = over;
      trashShrink.value = withTiming(over ? TRASH_SCALE : 1, {
        duration: 150,
      });
    }
  };

  const pan = usePanGesture({
    onActivate: () => {
      'worklet';
      start.value = { ...start.value, x: x.value, y: y.value };
      dragging.value = true;
    },
    onUpdate: event => {
      'worklet';
      x.value = start.value.x + event.translationX;
      y.value = start.value.y + event.translationY;
      keepInside();
      setOverTrash(event.absoluteY > trashTop);
    },
    onDeactivate: () => {
      'worklet';
      dragging.value = false;
      if (overTrash.value) {
        setOverTrash(false);
        scheduleOnRN(onDelete, id);
        return;
      }
      save();
    },
  });

  const pinch = usePinchGesture({
    onActivate: () => {
      'worklet';
      start.value = { ...start.value, scale: scale.value };
    },
    onUpdate: event => {
      'worklet';
      scale.value = Math.min(
        Math.max(start.value.scale * event.scale, MIN_SCALE),
        MAX_SCALE,
      );
      keepInside();
    },
    onDeactivate: save,
  });

  const rotate = useRotationGesture({
    onActivate: () => {
      'worklet';
      start.value = { ...start.value, rotation: rotation.value };
    },
    onUpdate: event => {
      'worklet';
      rotation.value = start.value.rotation + event.rotation;
    },
    onDeactivate: save,
  });

  const tap = useTapGesture({
    enabled: overlay.kind === 'text',
    onActivate: () => {
      'worklet';
      scheduleOnRN(onEdit, id);
    },
  });

  const transformGestures = useSimultaneousGestures(pan, pinch, rotate);
  const gesture = useCompetingGestures(tap, transformGestures);

  // Plain numbers only (no percentages), so Reanimated can move it straight
  // on the UI thread instead of laying it out again every frame.
  const placeStyle = useAnimatedStyle(() => ({
    // Hidden while in the composer, and for the frame before it's measured.
    opacity: hidden || !size.value.width ? 0 : 1,
    transform: [
      { translateX: x.value - size.value.width / 2 },
      { translateY: y.value - size.value.height / 2 },
      { rotate: `${rotation.value}rad` },
      { scale: scale.value * trashShrink.value },
    ],
  }));

  const measure = (event: LayoutChangeEvent) => {
    const { width: w, height: h } = event.nativeEvent.layout;
    size.value = { width: w, height: h };
  };

  return (
    <GestureDetector gesture={gesture}>
      {/*
       * The detector only takes touches inside its child's layout box, and a
       * transform doesn't move that box: the overlay, placed by transform,
       * would sit outside it. So the child is screen-sized and lets touches
       * through, and only the overlay inside it picks them up.
       */}
      <View style={styles.fill} pointerEvents="box-none" collapsable={false}>
        <Reanimated.View
          hitSlop={HIT_SLOP}
          onLayout={measure}
          style={[styles.overlayItem, placeStyle]}
        >
          <OverlayContent overlay={overlay} />
        </Reanimated.View>
      </View>
    </GestureDetector>
  );
}

export default memo(OverlayItem);
