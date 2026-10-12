import { memo } from 'react';
import Svg, { Circle, Path } from 'react-native-svg';

/** A rounded tile with its bottom-right corner cut away, where it peels. */
const TILE =
  'M8 3h8a5 5 0 0 1 5 5v5.2L13.2 21H8a5 5 0 0 1-5-5V8a5 5 0 0 1 5-5z';
/** The peeled corner, curling back over the face. */
const CURL = 'M21 13.2h-3.6a4.2 4.2 0 0 0-4.2 4.2V21';
const SMILE = 'M8.4 13.6c.9 1.5 2.4 2.2 4 2.1';

interface Props {
  size: number;
  color: string;
  /** Solid, for when the sticker panel's open. */
  filled?: boolean;
  /** The face and curl on a solid icon. */
  contrast: string;
}

/** A smiling sticker with a peeling corner: the sticker button. */
function StickerIcon({ size, color, filled = false, contrast }: Props) {
  const line = filled ? contrast : color;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d={TILE}
        fill={filled ? color : 'none'}
        stroke={color}
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
      <Path
        d={CURL}
        fill={filled ? contrast : 'none'}
        fillOpacity={filled ? 0.55 : 0}
        stroke={line}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx={9.4} cy={9.6} r={1.15} fill={line} />
      <Circle cx={14.6} cy={9.6} r={1.15} fill={line} />
      <Path
        d={SMILE}
        fill="none"
        stroke={line}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export default memo(StickerIcon);
