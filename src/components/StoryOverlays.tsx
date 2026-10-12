import { memo } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import StickerView from '@/components/StickerView';
import { getSticker } from '@/services/stickers';
import { fonts, fs } from '@/theme';
import type { StoryOverlay } from '@/types/story';

/** Text wraps before it gets wider than this share of the screen. */
const TEXT_SHARE = 0.8;

/**
 * Centres an overlay on its anchor, then turns and sizes it about its middle.
 * Also runs on the UI thread, for overlays being dragged in the editor.
 */
export function overlayTransform(scale: number, rotation: number) {
  'worklet';
  return [
    { translateX: '-50%' as const },
    { translateY: '-50%' as const },
    { rotate: `${rotation}rad` },
    { scale },
  ];
}

/** What an overlay shows, before it's placed. */
function OverlayContentView({ overlay }: { overlay: StoryOverlay }) {
  const { width } = useWindowDimensions();
  if (overlay.kind === 'sticker') {
    const sticker = overlay.stickerId ? getSticker(overlay.stickerId) : null;
    return sticker ? <StickerView sticker={sticker} size="message" /> : null;
  }
  return (
    <Text
      style={[
        styles.text,
        { color: overlay.color, maxWidth: width * TEXT_SHARE },
      ]}
    >
      {overlay.text}
    </Text>
  );
}

export const OverlayContent = memo(OverlayContentView);

interface Props {
  overlays?: StoryOverlay[];
  /** The story's frame (see useStoryCanvas); positions are shares of it. */
  frame: { width: number; height: number };
}

/** A story's text and stickers where they were put, out of the way of taps. */
function StoryOverlays({ overlays, frame }: Props) {
  const { width, height } = frame;
  if (!overlays?.length) {
    return null;
  }
  return (
    <View style={styles.fill} pointerEvents="none">
      {overlays.map(overlay => (
        <View
          key={overlay.id}
          style={[
            styles.anchor,
            {
              left: overlay.x * width,
              top: overlay.y * height,
              transform: overlayTransform(overlay.scale, overlay.rotation),
            },
          ]}
        >
          <OverlayContent overlay={overlay} />
        </View>
      ))}
    </View>
  );
}

export default memo(StoryOverlays);

const styles = StyleSheet.create({
  fill: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  anchor: {
    position: 'absolute',
  },
  text: {
    fontSize: fs(30),
    fontFamily: fonts.bold,
    textAlign: 'center',
    // Readable on light and dark photos alike.
    textShadowColor: 'rgba(0, 0, 0, 0.45)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
});
