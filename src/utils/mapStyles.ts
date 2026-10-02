import type { MapStyleId } from '@/types/map';

export const MAP_STYLE_IDS: MapStyleId[] = [
  'liberty',
  'bright',
  'positron',
  'dark',
];

export const mapStyleUrl = (id: MapStyleId) =>
  `https://tiles.openfreemap.org/styles/${id}`;

export const defaultMapStyle = (isDark: boolean): MapStyleId =>
  isDark ? 'dark' : 'liberty';

export const isDarkMapStyle = (id: MapStyleId) => id === 'dark';
