import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Image,
  Keyboard,
  LayoutAnimation,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type ScrollViewInstance,
  type TextInputInstance,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { useTranslation } from 'react-i18next';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ms } from 'react-native-size-matters';
import Icon from 'react-native-vector-icons/Ionicons';

import PrimaryButton from '@/components/PrimaryButton';
import { fonts, fs, useTheme, type AppColors } from '@/theme';
import type { CustomActivity } from '@/types/broadcast';

import {
  CUSTOM_ACTIVITY_MAX_LENGTH,
  CUSTOM_EMOJIS_PER_ROW,
  DEFAULT_CUSTOM_EMOJIS,
} from './data';
import { useSheetTransition } from './useSheetTransition';

/** Kept small: the photo is stored inline in persisted state. */
const PHOTO_MAX_SIZE = 320;
const PREVIEW_SIZE = ms(88);
/** Breathing room between the focused input and the keyboard. */
const INPUT_KEYBOARD_GAP = ms(16);
const EMOJI_COLUMN_GAP = ms(14);
const EMOJI_ROW_GAP = ms(10);
const EMOJI_GLYPH_BOX = fs(24);

interface CustomActivitySheetProps {
  visible: boolean;
  onClose: () => void;
  onSave: (activity: CustomActivity) => void;
}

export default function CustomActivitySheet({
  visible,
  onClose,
  onSave,
}: CustomActivitySheetProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const { mounted, backdropStyle, sheetStyle, onSheetLayout } =
    useSheetTransition(visible);

  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState(DEFAULT_CUSTOM_EMOJIS[0]);
  const [image, setImage] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setName('');
      setEmoji(DEFAULT_CUSTOM_EMOJIS[0]);
      setImage(null);
    }
  }, [visible]);

  const scrollRef = useRef<ScrollViewInstance>(null);
  const inputRef = useRef<TextInputInstance>(null);
  const [keyboardShown, setKeyboardShown] = useState(false);
  /** Extra sheet height that lifts the input above the keyboard. */
  const [lift, setLift] = useState(0);
  // Android shrinks the window for the keyboard; a fixed frame keeps the sheet anchored.
  const [frameHeight, setFrameHeight] = useState<number | null>(null);
  const [emojiRowWidth, setEmojiRowWidth] = useState(0);
  const emojiSize =
    emojiRowWidth > 0
      ? (emojiRowWidth - EMOJI_COLUMN_GAP * (CUSTOM_EMOJIS_PER_ROW - 1)) /
        CUSTOM_EMOJIS_PER_ROW
      : 0;

  useEffect(() => {
    if (!visible) {
      return;
    }
    const showEvent =
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent =
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const show = Keyboard.addListener(showEvent, event => {
      setKeyboardShown(true);
      const keyboardTop = event.endCoordinates.screenY;
      inputRef.current?.measureInWindow((_x, y, _width, height) => {
        const overlap = y + height + INPUT_KEYBOARD_GAP - keyboardTop;
        if (overlap > 0) {
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          setLift(overlap);
        }
      });
    });
    const hide = Keyboard.addListener(hideEvent, () => {
      setKeyboardShown(false);
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setLift(0);
    });
    return () => {
      show.remove();
      hide.remove();
    };
  }, [visible]);

  // Only matters once the sheet hits its max height and can't grow any further.
  useEffect(() => {
    if (lift > 0) {
      scrollRef.current?.scrollTo({ y: lift, animated: true });
    }
  }, [lift]);

  const onBackdropPress = () => {
    if (keyboardShown) {
      Keyboard.dismiss();
    } else {
      onClose();
    }
  };

  const trimmed = name.trim();

  const pickPhoto = async () => {
    Keyboard.dismiss();
    const result = await launchImageLibrary({
      mediaType: 'photo',
      selectionLimit: 1,
      maxWidth: PHOTO_MAX_SIZE,
      maxHeight: PHOTO_MAX_SIZE,
      quality: 0.7,
      includeBase64: true,
    });
    if (result.errorCode) {
      Alert.alert(t('imFree.custom.photoErrorTitle'), result.errorMessage);
      return;
    }
    const asset = result.assets?.[0];
    if (asset?.base64) {
      setImage(`data:${asset.type ?? 'image/jpeg'};base64,${asset.base64}`);
    }
  };

  const save = () => {
    onSave({ id: `custom-${Date.now()}`, name: trimmed, emoji, image });
  };

  return (
    <Modal
      visible={mounted}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View
        style={[
          styles.root,
          frameHeight !== null && [styles.rootLocked, { height: frameHeight }],
        ]}
        onLayout={event => {
          if (frameHeight === null) {
            setFrameHeight(event.nativeEvent.layout.height);
          }
        }}
      >
        <Animated.View style={[styles.backdrop, backdropStyle]}>
          <Pressable
            style={styles.flex}
            onPress={onBackdropPress}
            accessibilityRole="button"
            accessibilityLabel={t('common.close')}
          />
        </Animated.View>
        <Animated.View
          onLayout={onSheetLayout}
          style={[
            styles.sheet,
            { paddingBottom: Math.max(insets.bottom, ms(16)) },
            sheetStyle,
          ]}
        >
          <ScrollView
            ref={scrollRef}
            contentContainerStyle={[styles.content, { paddingBottom: lift }]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            <View style={styles.handle} />
            <Text style={styles.title}>{t('imFree.custom.title')}</Text>

            <View style={styles.photoRow}>
              <Pressable
                onPress={pickPhoto}
                style={({ pressed }) => [
                  styles.preview,
                  pressed && styles.pressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel={t('imFree.custom.uploadPhoto')}
              >
                {image ? (
                  <Image source={{ uri: image }} style={styles.previewImage} />
                ) : (
                  <Text style={styles.previewEmoji}>{emoji}</Text>
                )}
                <View style={styles.cameraBadge}>
                  <Icon name="camera" size={ms(13)} color={colors.white} />
                </View>
              </Pressable>
              <View style={styles.photoActions}>
                <Pressable
                  onPress={pickPhoto}
                  hitSlop={6}
                  accessibilityRole="button"
                >
                  <Text style={styles.linkText}>
                    {image
                      ? t('imFree.custom.changePhoto')
                      : t('imFree.custom.uploadPhoto')}
                  </Text>
                </Pressable>
                {image ? (
                  <Pressable
                    onPress={() => setImage(null)}
                    hitSlop={6}
                    accessibilityRole="button"
                  >
                    <Text style={styles.removeText}>
                      {t('imFree.custom.removePhoto')}
                    </Text>
                  </Pressable>
                ) : (
                  <Text style={styles.hint}>
                    {t('imFree.custom.photoHint')}
                  </Text>
                )}
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>{t('imFree.custom.defaultIcon')}</Text>
              <View
                style={styles.emojis}
                onLayout={event =>
                  setEmojiRowWidth(event.nativeEvent.layout.width)
                }
              >
                {DEFAULT_CUSTOM_EMOJIS.map(item => {
                  const selected = !image && item === emoji;
                  return (
                    <Pressable
                      key={item}
                      onPress={() => {
                        Keyboard.dismiss();
                        setEmoji(item);
                        setImage(null);
                      }}
                      style={[
                        styles.emojiItem,
                        emojiSize > 0 && {
                          width: emojiSize,
                          height: emojiSize,
                        },
                        selected && styles.emojiItemOn,
                      ]}
                      accessibilityRole="radio"
                      accessibilityState={{ selected }}
                    >
                      <Text style={styles.emojiText}>{item}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>{t('imFree.custom.nameLabel')}</Text>
              <TextInput
                ref={inputRef}
                value={name}
                onChangeText={setName}
                placeholder={t('imFree.otherPlaceholder')}
                placeholderTextColor={colors.textMuted}
                selectionColor={colors.primary}
                maxLength={CUSTOM_ACTIVITY_MAX_LENGTH}
                returnKeyType="done"
                onSubmitEditing={trimmed ? save : undefined}
                style={styles.input}
                accessibilityLabel={t('imFree.custom.nameLabel')}
              />
            </View>

            <View style={styles.actions}>
              <Pressable
                onPress={onClose}
                style={styles.cancel}
                accessibilityRole="button"
              >
                <Text style={styles.cancelText}>{t('common.cancel')}</Text>
              </Pressable>
              <PrimaryButton
                title={t('imFree.custom.save')}
                onPress={save}
                disabled={!trimmed}
                style={styles.confirm}
              />
            </View>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    root: {
      flex: 1,
      justifyContent: 'flex-end',
    },
    rootLocked: {
      flex: 0,
    },
    flex: {
      flex: 1,
    },
    pressed: {
      opacity: 0.85,
    },
    backdrop: {
      ...StyleSheet.absoluteFill,
      backgroundColor: `${colors.black}66`,
    },
    sheet: {
      maxHeight: '92%',
      paddingHorizontal: ms(20),
      borderTopLeftRadius: ms(28),
      borderTopRightRadius: ms(28),
      backgroundColor: colors.card,
    },
    content: {
      gap: ms(18),
    },
    handle: {
      alignSelf: 'center',
      width: ms(36),
      height: ms(5),
      marginTop: ms(8),
      borderRadius: ms(3),
      backgroundColor: colors.border,
    },
    title: {
      fontSize: fs(17),
      fontFamily: fonts.bold,
      color: colors.text,
    },
    photoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: ms(16),
    },
    preview: {
      width: PREVIEW_SIZE,
      height: PREVIEW_SIZE,
      borderRadius: ms(20),
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primarySoft,
    },
    previewImage: {
      width: PREVIEW_SIZE,
      height: PREVIEW_SIZE,
      borderRadius: ms(20),
    },
    previewEmoji: {
      fontSize: fs(40),
    },
    cameraBadge: {
      position: 'absolute',
      right: -ms(4),
      bottom: -ms(4),
      width: ms(26),
      height: ms(26),
      borderRadius: ms(13),
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: colors.card,
      backgroundColor: colors.primary,
    },
    photoActions: {
      flex: 1,
      gap: ms(6),
    },
    linkText: {
      fontSize: fs(14),
      fontFamily: fonts.semibold,
      color: colors.primary,
    },
    removeText: {
      fontSize: fs(13),
      fontFamily: fonts.medium,
      color: colors.danger,
    },
    hint: {
      fontSize: fs(12),
      lineHeight: fs(17),
      fontFamily: fonts.regular,
      color: colors.textMuted,
    },
    field: {
      gap: ms(8),
    },
    label: {
      fontSize: fs(13),
      fontFamily: fonts.semibold,
      color: colors.textSecondary,
    },
    emojis: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      rowGap: EMOJI_ROW_GAP,
      columnGap: EMOJI_COLUMN_GAP,
    },
    emojiItem: {
      width: ms(40),
      height: ms(40),
      borderRadius: ms(12),
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1.5,
      borderColor: colors.border,
      backgroundColor: colors.surfaceHigh,
    },
    emojiItemOn: {
      borderColor: colors.primary,
      backgroundColor: colors.primarySoft,
    },
    // Fixed box + lineHeight so the glyph sits in the optical center on both platforms.
    emojiText: {
      width: EMOJI_GLYPH_BOX,
      height: EMOJI_GLYPH_BOX,
      fontSize: fs(18),
      lineHeight: EMOJI_GLYPH_BOX,
      textAlign: 'center',
      includeFontPadding: false,
    },
    input: {
      paddingHorizontal: ms(14),
      paddingVertical: ms(12),
      borderRadius: ms(12),
      fontSize: fs(14),
      fontFamily: fonts.medium,
      color: colors.text,
      backgroundColor: colors.surface,
    },
    actions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: ms(12),
    },
    cancel: {
      paddingHorizontal: ms(20),
      height: ms(56),
      borderRadius: ms(999),
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surfaceMuted,
    },
    cancelText: {
      fontSize: fs(14),
      fontFamily: fonts.semibold,
      color: colors.text,
    },
    confirm: {
      flex: 1,
    },
  });
}
