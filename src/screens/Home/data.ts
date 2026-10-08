import type { LngLat, LngLatBounds } from '@maplibre/maplibre-react-native';
import Supercluster from 'supercluster';

import type { ActivityCategory } from '@/types/activity';

export type CategoryId =
  | 'all'
  | Extract<
      ActivityCategory,
      'running' | 'coffee' | 'food' | 'football' | 'badminton' | 'walking'
    >;

export const CATEGORY_IDS: CategoryId[] = [
  'all',
  'running',
  'coffee',
  'food',
  'football',
  'badminton',
  'walking',
];

export function boundsOf(points: LngLat[]): LngLatBounds {
  const lngs = points.map(([lng]) => lng);
  const lats = points.map(([, lat]) => lat);
  return [
    Math.min(...lngs),
    Math.min(...lats),
    Math.max(...lngs),
    Math.max(...lats),
  ];
}

export function centerOf(points: LngLat[]): LngLat {
  const [west, south, east, north] = boundsOf(points);
  return [(west + east) / 2, (south + north) / 2];
}

/** Same model as react-native-map-clustering: supercluster over the activity points. */
export const CLUSTER_OPTIONS = {
  /** Cluster radius in screen pixels (MapLibre uses 512px tiles, like supercluster). */
  radius: 70,
  /** Above this zoom every activity gets its own marker. */
  maxZoom: 16,
  minPoints: 2,
};

const WORLD_BOUNDS: [number, number, number, number] = [-180, -85, 180, 85];
const TILE_SIZE = 512;

function mercatorY(lat: number) {
  const sin = Math.sin((lat * Math.PI) / 180);
  return 0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI);
}

/** Screen offset of `from` relative to `to` at this zoom, in pixels. */
export function pixelOffset(from: LngLat, to: LngLat, zoom: number) {
  const world = TILE_SIZE * 2 ** zoom;
  return {
    x: ((from[0] - to[0]) / 360) * world,
    y: (mercatorY(from[1]) - mercatorY(to[1])) * world,
  };
}

export type MarkerEntry<T> =
  | { kind: 'single'; item: T }
  | {
      kind: 'cluster';
      clusterId: number;
      center: LngLat;
      items: T[];
    };

/** Builds a clusterer for these items; rebuild only when the item set changes. */
export function createClusterer<T extends { id: string; coordinate: LngLat }>(
  items: T[],
) {
  const byId = new Map(items.map(item => [item.id, item]));
  const index = new Supercluster<{ id: string }>(CLUSTER_OPTIONS).load(
    items.map(item => ({
      type: 'Feature',
      properties: { id: item.id },
      geometry: { type: 'Point', coordinates: item.coordinate },
    })),
  );

  return {
    /** Clusters are fixed per whole zoom level, so markers only regroup at level changes. */
    entriesAt(zoom: number): MarkerEntry<T>[] {
      return index.getClusters(WORLD_BOUNDS, Math.floor(zoom)).map(feature => {
        const props = feature.properties as
          | { id: string }
          | { cluster: true; cluster_id: number };
        if ('cluster' in props) {
          return {
            kind: 'cluster',
            clusterId: props.cluster_id,
            center: feature.geometry.coordinates as LngLat,
            items: index
              .getLeaves(props.cluster_id, Infinity)
              .map(leaf => byId.get(leaf.properties.id))
              .filter((item): item is T => !!item),
          };
        }
        return { kind: 'single', item: byId.get(props.id) as T };
      });
    },
    /** Zoom at which the cluster splits apart. */
    expansionZoom(clusterId: number) {
      return index.getClusterExpansionZoom(clusterId);
    },
  };
}
