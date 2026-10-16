import Svg, { Path } from 'react-native-svg';

import {
  LETTER_HEIGHT,
  LETTER_TOP,
  LOGO_LETTERS,
  LOGO_LINE,
  type LogoLetter,
} from '@/components/logoPath';

interface Props {
  /** How tall the letters' band stands; each is as wide as it needs. */
  height: number;
  color: string;
  /** The mark's C, or another capital in its hand. */
  letter?: LogoLetter;
  /** Line thickness against the icon's, e.g. heavier beside bold text. */
  weight?: number;
}

/** The app's mark (or a capital in its hand), still and cut close. */
export default function LogoGlyph({
  height,
  color,
  letter = 'C',
  weight = 1,
}: Props) {
  const { path, x, width: letterWidth } = LOGO_LETTERS[letter];
  const line = LOGO_LINE * weight;
  // The bounds hold the icon's line; a heavier one needs a little more room.
  const pad = Math.max((line - LOGO_LINE) / 2, 0);
  const width = letterWidth + pad * 2;
  const tall = LETTER_HEIGHT + pad * 2;
  return (
    <Svg
      width={(height * width) / tall}
      height={height}
      viewBox={`${x - pad} ${LETTER_TOP - pad} ${width} ${tall}`}
    >
      <Path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth={line}
        strokeLinejoin="round"
      />
    </Svg>
  );
}
