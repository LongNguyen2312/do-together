import { memo, useEffect, useRef, useState, type ReactNode } from 'react';
import { Image, Pressable, useWindowDimensions, View } from 'react-native';
import {
  NativeNitroImage,
  type Image as CameraSnapshot,
} from 'react-native-nitro-image';
import { useTranslation } from 'react-i18next';
import Reanimated, {
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import FilterLayers from '@/components/FilterLayers';
import type { StoryFilterId } from '@/types/story';
import { STORY_FILTERS } from '@/utils/storyFilters';

import { FILTER_GAP, FILTER_SIZE, type StoryCameraStyles } from './styles';

const STRIDE = FILTER_SIZE + FILTER_GAP;
/** Shows the filters when there's no picture from the camera yet. */
const SAMPLE = require('@/assets/images/discover/sunset-run.jpg');
const LAST = STORY_FILTERS.length - 1;

interface Props {
  index: number;
  onChange: (index: number) => void;
  /** The filters step aside while recording. */
  recording: boolean;
  /** A recent, small still from the camera, shown through each filter. */
  sample: CameraSnapshot | null;
  /** Sits in the middle, round the filter in use. */
  shutter: ReactNode;
  styles: StoryCameraStyles;
}

/**
 * The shutter, with the filters running through it: whichever sits in the
 * ring is the one in use, changing as each passes through. Scroll or tap to
 * pick one, or swipe the picture; the strip rolls it into the ring.
 */
function FilterStrip({
  index,
  onChange,
  recording,
  sample,
  shutter,
  styles,
}: Props) {
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const scrollRef = useRef<Reanimated.ScrollView>(null);
  // Only where it starts: set again on every render, it would jump.
  const [startOffset] = useState(() => ({ x: index * STRIDE, y: 0 }));
  const offset = useSharedValue(index * STRIDE);
  /** The filter in the ring, as last told to the screen. */
  const shown = useRef(index);
  const ringSlot = useSharedValue(index);
  /** Where a roll started from outside is headed; -1 while the finger scrolls. */
  const rollingTo = useSharedValue(-1);

  const reached = (next: number) => {
    shown.current = next;
    onChange(next);
  };

  const onScroll = useAnimatedScrollHandler({
    // A finger on the strip takes over from a roll.
    onBeginDrag: () => {
      rollingTo.value = -1;
    },
    onScroll: event => {
      offset.value = event.contentOffset.x;
      const slot = Math.min(
        Math.max(Math.round(event.contentOffset.x / STRIDE), 0),
        LAST,
      );
      if (rollingTo.value >= 0) {
        // Rolling to a filter picked outside: skip the ones it passes.
        if (slot === rollingTo.value) {
          rollingTo.value = -1;
          ringSlot.value = slot;
        }
        return;
      }
      if (slot !== ringSlot.value) {
        ringSlot.value = slot;
        scheduleOnRN(reached, slot);
      }
    },
  });

  // Picked outside the strip (a swipe on the picture, a tap): roll it in.
  useEffect(() => {
    if (shown.current !== index) {
      shown.current = index;
      rollingTo.value = index;
      scrollRef.current?.scrollTo({ x: index * STRIDE, animated: true });
    }
  }, [index, rollingTo]);

  // The filters step aside while recording; only the shutter stays.
  const stripStyle = useAnimatedStyle(() => ({
    opacity: withTiming(recording ? 0 : 1, { duration: 150 }),
  }));

  return (
    <View style={styles.strip}>
      <Reanimated.View style={[styles.fill, stripStyle]}>
        <Reanimated.ScrollView
          ref={scrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={STRIDE}
          decelerationRate="fast"
          scrollEnabled={!recording}
          contentOffset={startOffset}
          contentContainerStyle={[
            styles.stripContent,
            { paddingHorizontal: (width - FILTER_SIZE) / 2 },
          ]}
          onScroll={onScroll}
          scrollEventThrottle={16}
        >
          {STORY_FILTERS.map((filter, i) => (
            <FilterButton
              key={filter.id}
              id={filter.id}
              slot={i}
              offset={offset}
              label={t(`storyCamera.filters.${filter.id}`)}
              sample={sample}
              styles={styles}
              onPress={() => onChange(i)}
            />
          ))}
        </Reanimated.ScrollView>
      </Reanimated.View>

      {shutter}
    </View>
  );
}

export default memo(FilterStrip);

interface FilterButtonProps {
  id: StoryFilterId;
  slot: number;
  offset: SharedValue<number>;
  label: string;
  sample: CameraSnapshot | null;
  styles: StoryCameraStyles;
  onPress: () => void;
}

/**
 * One filter, over what the camera sees (or a sample photo): smaller and
 * dimmer the further it is from the ring.
 */
function FilterButton({
  id,
  slot,
  offset,
  label,
  sample,
  styles,
  onPress,
}: FilterButtonProps) {
  const sizeStyle = useAnimatedStyle(() => {
    const distance = Math.abs(offset.value / STRIDE - slot);
    return {
      opacity: interpolate(distance, [0, 3], [1, 0.6], 'clamp'),
      transform: [{ scale: interpolate(distance, [0, 1], [1, 0.8], 'clamp') }],
    };
  });

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Reanimated.View style={[styles.filter, sizeStyle]}>
        {sample ? (
          <NativeNitroImage
            image={sample}
            resizeMode="cover"
            style={styles.filterPicture}
          />
        ) : (
          <Image
            source={SAMPLE}
            resizeMode="cover"
            style={styles.filterPicture}
          />
        )}
        <FilterLayers filter={id} />
      </Reanimated.View>
    </Pressable>
  );
}
