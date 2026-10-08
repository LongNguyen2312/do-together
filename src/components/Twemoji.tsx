import { Text } from 'react-native';
import { parse, SvgAst, type JsxAST } from 'react-native-svg';

import { TWEMOJI_SVG } from '@/assets/twemoji';

/** CC-BY 4.0 requires the credit to point at the licence. */
export const TWEMOJI_LICENSE_URL =
  'https://creativecommons.org/licenses/by/4.0/';

/**
 * Twemoji file names are the code points joined by "-". Variation selectors
 * (FE0F) are dropped unless the emoji is a zero-width-joiner sequence.
 * Must match scripts/build-twemoji.js.
 */
export function twemojiCode(emoji: string) {
  const text = emoji.includes('\u200d') ? emoji : emoji.replace(/\uFE0F/g, '');
  return Array.from(text)
    .map(char => char.codePointAt(0)!.toString(16))
    .join('-');
}

/** SvgXml re-parses its string on every mount; parse each emoji once. */
const astCache = new Map<string, JsxAST | null>();

function twemojiAst(code: string) {
  if (!astCache.has(code)) {
    const xml = TWEMOJI_SVG[code];
    astCache.set(code, xml ? parse(xml) : null);
  }
  return astCache.get(code) ?? null;
}

/**
 * Renders bundled Twemoji artwork so stickers look the same on every platform.
 * Emoji missing from the bundle (run `yarn twemoji`) fall back to the system font.
 */
export default function Twemoji({
  emoji,
  size,
}: {
  emoji: string;
  size: number;
}) {
  const ast = twemojiAst(twemojiCode(emoji));
  if (!ast) {
    return <Text style={{ fontSize: size * 0.85 }}>{emoji}</Text>;
  }
  return <SvgAst ast={ast} override={{ width: size, height: size }} />;
}
