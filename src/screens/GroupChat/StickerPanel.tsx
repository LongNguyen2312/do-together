import { memo, useCallback, useMemo, useRef, useState } from 'react';
import {
  Linking,
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ms } from 'react-native-size-matters';

import Twemoji, { TWEMOJI_LICENSE_URL } from '@/components/Twemoji';
import {
  STICKER_PACKS,
  type Sticker,
  type StickerPack,
} from '@/services/stickers';

import StickerView from './StickerView';
import {
  STICKER_GRID_PADDING as GRID_PADDING,
  type GroupChatStyles,
} from './styles';

/** Sticker size (see StickerView) plus a little breathing room. */
const CELL_HEIGHT: Record<Sticker['kind'], number> = {
  emoji: ms(60),
  lottie: ms(96),
  text: ms(52),
};

/** Sits where the keyboard would; tapping a sticker sends it. */
export default function StickerPanel({
  styles,
  onPick,
}: {
  styles: GroupChatStyles;
  onPick: (sticker: Sticker) => void;
}) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, ms(10));
  const [packId, setPackId] = useState(STICKER_PACKS[0].id);
  // Visited packs stay mounted (hidden) so switching back is instant.
  const [visited, setVisited] = useState(() => new Set([packId]));

  const onPickRef = useRef(onPick);
  onPickRef.current = onPick;
  const pick = useCallback(
    (sticker: Sticker) => onPickRef.current(sticker),
    [],
  );

  const selectPack = (id: string) => {
    setPackId(id);
    setVisited(prev => (prev.has(id) ? prev : new Set(prev).add(id)));
  };

  return (
    <View style={styles.stickerPanel}>
      <View style={styles.stickerTabs}>
        {STICKER_PACKS.map(item => (
          <Pressable
            key={item.id}
            onPressIn={() => selectPack(item.id)}
            style={[
              styles.stickerTab,
              item.id === packId && styles.stickerTabActive,
            ]}
            accessibilityRole="tab"
            accessibilityState={{ selected: item.id === packId }}
            accessibilityLabel={t(`stickers.packs.${item.id}`)}
          >
            <Twemoji emoji={item.icon} size={ms(22)} />
          </Pressable>
        ))}
      </View>
      {STICKER_PACKS.filter(item => visited.has(item.id)).map(item => (
        <PackGrid
          key={item.id}
          pack={item}
          hidden={item.id !== packId}
          bottomInset={bottomInset}
          styles={styles}
          onPick={pick}
        />
      ))}
    </View>
  );
}

const PackGrid = memo(function PackGridView({
  pack,
  hidden,
  bottomInset,
  styles,
  onPick,
}: {
  pack: StickerPack;
  hidden: boolean;
  bottomInset: number;
  styles: GroupChatStyles;
  onPick: (sticker: Sticker) => void;
}) {
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const kind = pack.stickers[0]?.kind;
  // Explicit sizes: percentage widths + aspectRatio inside a wrapping row make
  // Yoga overestimate the grid height, leaving a gap under the last row.
  const cellSize = useMemo(() => {
    const columns = kind === 'lottie' ? 3 : kind === 'text' ? 2 : 4;
    return {
      width: (width - GRID_PADDING * 2) / columns,
      height: CELL_HEIGHT[kind ?? 'emoji'],
    };
  }, [kind, width]);

  return (
    <ScrollView
      style={hidden ? styles.hidden : styles.flex}
      // Inset as content padding so stickers scroll under the home indicator.
      contentContainerStyle={{ paddingBottom: bottomInset }}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.stickerGrid}>
        {pack.stickers.map(sticker => (
          <Pressable
            key={sticker.id}
            onPress={() => onPick(sticker)}
            style={({ pressed }) => [
              styles.stickerCell,
              cellSize,
              pressed && styles.stickerCellPressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel={
              sticker.kind === 'text'
                ? t(`stickers.phrases.${sticker.phrase}`)
                : sticker.kind === 'emoji'
                ? sticker.emoji
                : t('chat.sticker')
            }
          >
            <StickerView sticker={sticker} size="panel" />
          </Pressable>
        ))}
      </View>
      <Text style={styles.stickerCredit}>
        {t('stickers.credit')}{' '}
        <Text
          style={styles.stickerCreditLink}
          onPress={() => Linking.openURL(TWEMOJI_LICENSE_URL)}
          accessibilityRole="link"
        >
          CC-BY 4.0
        </Text>
      </Text>
    </ScrollView>
  );
});
