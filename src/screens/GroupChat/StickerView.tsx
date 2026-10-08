import { memo, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import LottieView from 'lottie-react-native';
import { useTranslation } from 'react-i18next';
import { ms } from 'react-native-size-matters';

import Twemoji from '@/components/Twemoji';
import type { Sticker, StickerTone } from '@/services/stickers';
import { fonts, fs, useTheme, type AppColors } from '@/theme';

type Size = 'panel' | 'message';

const EMOJI_SIZE: Record<Size, number> = { panel: ms(44), message: ms(96) };
const LOTTIE_SIZE: Record<Size, number> = { panel: ms(84), message: ms(130) };
const PHRASE_SIZE: Record<Size, number> = { panel: fs(11), message: fs(15) };

function StickerView({ sticker, size }: { sticker: Sticker; size: Size }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  if (sticker.kind === 'lottie') {
    // dotLottie assets are loaded natively; parsed JSON would be re-serialised
    // on the JS thread every render.
    return (
      <LottieView
        source={sticker.source}
        autoPlay
        loop
        renderMode="HARDWARE"
        style={{ width: LOTTIE_SIZE[size], height: LOTTIE_SIZE[size] }}
      />
    );
  }

  if (sticker.kind === 'emoji') {
    return <Twemoji emoji={sticker.emoji} size={EMOJI_SIZE[size]} />;
  }

  const tones: Record<StickerTone, string> = {
    primary: colors.primary,
    success: colors.success,
    violet: '#8E6CD8',
    sky: '#3B8FE0',
  };
  return (
    <View
      style={[
        styles.phrase,
        size === 'message' && styles.phraseLarge,
        tiltFor(sticker.id),
        { backgroundColor: tones[sticker.tone] },
      ]}
    >
      <Twemoji emoji={sticker.emoji} size={PHRASE_SIZE[size] * 1.5} />
      <Text
        style={[styles.phraseText, { fontSize: PHRASE_SIZE[size] }]}
        numberOfLines={2}
      >
        {t(`stickers.phrases.${sticker.phrase}`)}
      </Text>
    </View>
  );
}

export default memo(StickerView);

const TILTS = [-7, -5, -3, 3, 5, 7].map(deg => ({
  transform: [{ rotate: `${deg}deg` }],
}));

/** A random-looking but stable tilt, so a tag keeps its angle everywhere. */
function tiltFor(id: string) {
  const hash = Array.from(id).reduce(
    (sum, char, i) => sum + char.charCodeAt(0) * (i + 1),
    0,
  );
  return TILTS[hash % TILTS.length];
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    phrase: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: ms(4),
      maxWidth: ms(96),
      paddingHorizontal: ms(8),
      paddingVertical: ms(6),
      borderRadius: ms(14),
    },
    phraseLarge: {
      maxWidth: ms(200),
      gap: ms(6),
      paddingHorizontal: ms(14),
      paddingVertical: ms(10),
      borderRadius: ms(20),
    },
    phraseText: {
      flexShrink: 1,
      fontFamily: fonts.bold,
      color: colors.white,
    },
  });
}
