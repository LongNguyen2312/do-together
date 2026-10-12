import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import Reanimated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ms } from 'react-native-size-matters';

import { TEXT_COLORS, type StoryEditorStyles } from './styles';

const MAX_TEXT_LENGTH = 200;

export interface TextDraft {
  /** Set when editing text already on the story. */
  id?: string;
  text: string;
  color: string;
}

interface Props {
  initial: TextDraft;
  styles: StoryEditorStyles;
  onDone: (draft: TextDraft) => void;
}

/** Typing text for the story, over a dimmed preview, with a colour row. */
export default function TextComposer({ initial, styles, onDone }: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [text, setText] = useState(initial.text);
  const [color, setColor] = useState(initial.color);

  const done = () => onDone({ id: initial.id, text, color });

  return (
    <Reanimated.View
      entering={FadeIn.duration(160)}
      exiting={FadeOut.duration(160)}
      style={[styles.fill, styles.composer]}
    >
      <KeyboardAvoidingView
        style={[styles.composerBody, { paddingTop: insets.top + ms(8) }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.composerTop}>
          <Pressable
            onPress={done}
            style={({ pressed }) => [styles.done, pressed && styles.pressed]}
            accessibilityRole="button"
          >
            <Text style={styles.doneText}>{t('storyEditor.done')}</Text>
          </Pressable>
        </View>

        {/* A tap around the text finishes, like the usual story apps. */}
        <Pressable
          style={styles.composerField}
          onPress={done}
          accessible={false}
        >
          <TextInput
            value={text}
            onChangeText={setText}
            autoFocus
            multiline
            maxLength={MAX_TEXT_LENGTH}
            placeholder={t('storyEditor.textPlaceholder')}
            placeholderTextColor={`${color}99`}
            style={[styles.composerInput, { color }]}
            keyboardAppearance="dark"
            selectionColor={color}
          />
        </Pressable>

        <View style={styles.swatches}>
          {TEXT_COLORS.map(swatch => (
            <Pressable
              key={swatch}
              onPress={() => setColor(swatch)}
              hitSlop={ms(4)}
              style={[
                styles.swatch,
                { backgroundColor: swatch },
                swatch === color && styles.swatchActive,
              ]}
              accessibilityRole="radio"
              accessibilityState={{ selected: swatch === color }}
              accessibilityLabel={t('storyEditor.textColor')}
            />
          ))}
        </View>
      </KeyboardAvoidingView>
    </Reanimated.View>
  );
}
