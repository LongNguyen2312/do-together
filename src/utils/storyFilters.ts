import type { ViewStyle } from 'react-native';

import type { StoryFilterId } from '@/types/story';

type BlendMode = NonNullable<ViewStyle['mixBlendMode']>;

/** A flat colour blended over the picture. */
export interface FilterLayer {
  color: string;
  blend: BlendMode;
  opacity: number;
}

export interface StoryFilter {
  id: StoryFilterId;
  layers: FilterLayer[];
}

/**
 * The looks a story can have, in the camera's order: `normal` in the middle,
 * where the camera starts, with filters to either side. Each is a few colour
 * layers blended over the picture as it's shown, so the same filter works on
 * photos and videos, live in the camera, without re-encoding anything.
 */
export const STORY_FILTERS: StoryFilter[] = [
  // Grey in `saturation` mode takes all the colour out.
  {
    id: 'mono',
    layers: [{ color: '#808080', blend: 'saturation', opacity: 1 }],
  },
  {
    id: 'fade',
    layers: [
      { color: '#808080', blend: 'saturation', opacity: 0.35 },
      { color: '#FFFFFF', blend: 'normal', opacity: 0.14 },
    ],
  },
  {
    id: 'vintage',
    layers: [
      { color: '#8A5A2B', blend: 'color', opacity: 0.45 },
      { color: '#FFF1D6', blend: 'multiply', opacity: 0.35 },
    ],
  },
  { id: 'normal', layers: [] },
  // A fully saturated colour in `saturation` mode lifts every colour's
  // saturation, keeping its hue.
  {
    id: 'vivid',
    layers: [{ color: '#FF0000', blend: 'saturation', opacity: 0.3 }],
  },
  {
    id: 'warm',
    layers: [{ color: '#FF9A3C', blend: 'soft-light', opacity: 0.5 }],
  },
  {
    id: 'cool',
    layers: [{ color: '#3C8CFF', blend: 'soft-light', opacity: 0.5 }],
  },
  {
    id: 'rose',
    layers: [{ color: '#FF5C8A', blend: 'soft-light', opacity: 0.45 }],
  },
];

/** Where the camera starts. */
export const NORMAL_FILTER = STORY_FILTERS.findIndex(
  filter => filter.id === 'normal',
);

const byId = new Map(STORY_FILTERS.map(filter => [filter.id, filter]));

export const filterLayers = (id: StoryFilterId | undefined) =>
  (id && byId.get(id)?.layers) || [];
