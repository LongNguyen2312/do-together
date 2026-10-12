import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import type { StoryFilterId } from '@/types/story';
import { filterLayers } from '@/utils/storyFilters';

/**
 * A story filter's colour layers, blended over whatever is under them in the
 * same parent (a photo, a video, the camera's preview).
 */
function FilterLayers({ filter }: { filter?: StoryFilterId }) {
  return (
    <>
      {filterLayers(filter).map((layer, i) => (
        <View
          key={i}
          pointerEvents="none"
          style={[
            styles.fill,
            {
              backgroundColor: layer.color,
              opacity: layer.opacity,
              mixBlendMode: layer.blend,
            },
          ]}
        />
      ))}
    </>
  );
}

export default memo(FilterLayers);

const styles = StyleSheet.create({
  fill: StyleSheet.absoluteFill,
});
