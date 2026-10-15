import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ms } from 'react-native-size-matters';
import Icon from 'react-native-vector-icons/Ionicons';

import { StoryThumb } from '@/components/StoryMedia';
import { useTheme } from '@/theme';
import type { Story } from '@/types/story';

import { SHEET_BOTTOM, type ProfileStyles } from './styles';

/** What shows under a pinned story: one short line. */
export const PINNED_TITLE_MAX = 30;

interface Props {
  /** Null keeps the sheet closed. */
  story: Story | null;
  /** What shows under it now: its title, or its day without one. */
  title: string;
  styles: ProfileStyles;
  onClose: () => void;
  /** Blank is allowed: nothing shows under it then. */
  onSave: (title: string) => void;
  onUnpin: () => void;
}

/**
 * A long press on a pinned story: what shows under it on the profile, or
 * taking it off.
 */
export default function PinnedStorySheet({
  story,
  title,
  styles,
  onClose,
  onSave,
  onUnpin,
}: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [text, setText] = useState(title);

  useEffect(() => {
    if (story) {
      setText(title);
    }
  }, [story, title]);

  return (
    <Modal
      visible={!!story}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.sheetRoot}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable
          style={styles.sheetBackdrop}
          onPress={onClose}
          accessibilityLabel={t('common.cancel')}
        />
        <View
          style={[
            styles.sheet,
            { paddingBottom: insets.bottom + SHEET_BOTTOM },
          ]}
        >
          <View style={styles.sheetHandle} />
          {story ? (
            <View style={styles.titleRow}>
              <StoryThumb
                media={story.media}
                filter={story.filter}
                style={styles.titleThumb}
              />
              <View style={styles.titleField}>
                <TextInput
                  value={text}
                  onChangeText={setText}
                  placeholder={t('profile.pinned.placeholder')}
                  placeholderTextColor={colors.textMuted}
                  selectionColor={colors.primary}
                  maxLength={PINNED_TITLE_MAX}
                  autoFocus
                  returnKeyType="done"
                  onSubmitEditing={() => onSave(text.trim())}
                  style={styles.titleInput}
                  accessibilityLabel={t('profile.pinned.title')}
                />
                {text ? (
                  <Pressable
                    onPress={() => setText('')}
                    hitSlop={ms(8)}
                    accessibilityRole="button"
                    accessibilityLabel={t('profile.pinned.clear')}
                  >
                    <Icon
                      name="close-circle"
                      size={ms(18)}
                      color={colors.textMuted}
                    />
                  </Pressable>
                ) : null}
              </View>
              <Pressable
                onPress={() => onSave(text.trim())}
                style={({ pressed }) => [
                  styles.titleSave,
                  pressed && styles.pressed,
                ]}
                accessibilityRole="button"
              >
                <Text style={styles.titleSaveText}>{t('common.save')}</Text>
              </Pressable>
            </View>
          ) : null}
          <Text style={styles.titleHint}>{t('profile.pinned.hint')}</Text>
          <Pressable
            onPress={onUnpin}
            style={({ pressed }) => [
              styles.sheetAction,
              styles.sheetActionDivided,
              pressed && styles.pressed,
            ]}
            accessibilityRole="button"
          >
            <Text style={[styles.sheetActionText, { color: colors.primary }]}>
              {t('stories.unpin')}
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
