import { Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ms } from 'react-native-size-matters';

import StickerView from '@/components/StickerView';
import { TWEMOJI_LICENSE_URL } from '@/components/Twemoji';
import { STICKER_PACKS, type Sticker } from '@/services/stickers';

import EditorSheet from './EditorSheet';
import type { StoryEditorStyles } from './styles';

interface Props {
  visible: boolean;
  styles: StoryEditorStyles;
  onPick: (sticker: Sticker) => void;
  onClose: () => void;
}

/** Every built-in sticker pack, one under the other; a tap adds one. */
export default function StickerSheet({
  visible,
  styles,
  onPick,
  onClose,
}: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  return (
    <EditorSheet
      visible={visible}
      title={t('storyEditor.stickers')}
      styles={styles}
      onClose={onClose}
    >
      <ScrollView
        contentContainerStyle={[
          styles.sheetContent,
          { paddingBottom: insets.bottom + ms(16) },
        ]}
      >
        {STICKER_PACKS.map(pack => (
          <View key={pack.id}>
            <Text style={styles.packTitle}>
              {pack.icon} {t(`stickers.packs.${pack.id}`)}
            </Text>
            <View style={styles.stickerGrid}>
              {pack.stickers.map(sticker => (
                <Pressable
                  key={sticker.id}
                  onPress={() => onPick(sticker)}
                  style={({ pressed }) => [
                    styles.stickerCell,
                    pressed && styles.pressed,
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
          </View>
        ))}
        <Text style={styles.credit}>
          {t('stickers.credit')}{' '}
          <Text
            style={styles.creditLink}
            onPress={() => Linking.openURL(TWEMOJI_LICENSE_URL)}
            accessibilityRole="link"
          >
            CC-BY 4.0
          </Text>
        </Text>
      </ScrollView>
    </EditorSheet>
  );
}
