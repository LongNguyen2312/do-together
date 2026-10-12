import { memo, useEffect, useRef, useState, type ComponentProps } from 'react';
import {
  Keyboard,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
  type GestureResponderEvent,
  type ScrollViewInstance,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { ScrollView } from 'react-native-gesture-handler';
import Reanimated, {
  Easing,
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { ms } from 'react-native-size-matters';
import Icon from 'react-native-vector-icons/Ionicons';

import { useAppSelector } from '@/store/hooks';
import { useTheme } from '@/theme';
import { initialsOf } from '@/utils/format';

import type { StoryViewerStyles } from './styles';

/** After the field, like Facebook; the whole row scrolls to reach them. */
const BAR_REACTIONS = ['❤️', '👍', '😆', '🥰', '😮', '😢', '😡'];
/** Share of the screen the field takes before the row is scrolled. */
const FIELD_SHARE = 0.6;
/** Over the dimmed story while typing, like Instagram. */
const QUICK_REACTIONS = ['😂', '😭', '❤️', '🙏', '😍', '🔥'];
const MAX_REPLY_LENGTH = 500;
/** Close to the curve the iOS keyboard slides in on. */
const KEYBOARD_EASING = Easing.bezier(0.17, 0.59, 0.4, 0.77);
/** How far below centre the emoji grid sits while typing. */
const GRID_DROP = ms(70);

interface Props {
  /** Who the reply goes to. */
  name: string;
  styles: StoryViewerStyles;
  bottomInset: number;
  /** Without it the bar is only a picture, for the cube's other sides. */
  onSend?: (text: string) => void;
  /** `x` and `y` are where on screen the emoji was tapped. */
  onReact?: (emoji: string, x: number, y: number) => void;
  onFocusChange?: (focused: boolean) => void;
  /** Swipes that wait while the row scrolls sideways. */
  scrollBlocks?: ComponentProps<typeof ScrollView>['block'];
}

/**
 * The bottom of a friend's story: quick replies, the message field and
 * reactions; while typing, the story dims behind a grid of big emoji.
 */
function ReplyBar({
  name,
  styles,
  bottomInset,
  onSend,
  onReact,
  onFocusChange,
  scrollBlocks,
}: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const myName = useAppSelector(state => state.auth.user?.displayName);
  const [text, setText] = useState('');
  const [focused, setFocused] = useState(false);
  const { width } = useWindowDimensions();
  const rowRef = useRef<ScrollViewInstance>(null);
  const lift = useSharedValue(0);
  const interactive = onSend != null;
  const quickReplies = t('stories.quickReplies', {
    returnObjects: true,
  }) as string[];

  // Android resizes the window for the keyboard (adjustResize); iOS doesn't,
  // so the bar rides up with the keyboard itself.
  useEffect(() => {
    if (!interactive || Platform.OS !== 'ios') {
      return;
    }
    const show = Keyboard.addListener('keyboardWillShow', event => {
      lift.value = withTiming(event.endCoordinates.height - bottomInset, {
        duration: event.duration,
        easing: KEYBOARD_EASING,
      });
    });
    const hide = Keyboard.addListener('keyboardWillHide', event => {
      lift.value = withTiming(0, {
        duration: event.duration,
        easing: KEYBOARD_EASING,
      });
    });
    return () => {
      show.remove();
      hide.remove();
    };
  }, [interactive, bottomInset, lift]);

  const liftStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -lift.value }],
  }));
  // Centred in what the keyboard leaves of the screen, then a little lower,
  // nearer the field.
  const gridStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: lift.value / 2 + GRID_DROP }],
  }));

  const changeFocus = (next: boolean) => {
    // Typing needs the whole field in view, with the send button beside it.
    if (next) {
      rowRef.current?.scrollTo({ x: 0, animated: true });
    }
    setFocused(next);
    onFocusChange?.(next);
  };

  const send = (message: string) => {
    const trimmed = message.trim();
    if (!trimmed) {
      return;
    }
    onSend?.(trimmed);
    setText('');
    Keyboard.dismiss();
  };

  const react = (emoji: string) => (event: GestureResponderEvent) => {
    onReact?.(emoji, event.nativeEvent.pageX, event.nativeEvent.pageY);
    Keyboard.dismiss();
  };

  const canSend = text.trim().length > 0;

  return (
    <>
      {focused ? (
        <Reanimated.View
          entering={FadeIn.duration(180)}
          exiting={FadeOut.duration(180)}
          style={styles.replyDim}
        >
          {/* A tap anywhere off the field puts the keyboard away. */}
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={Keyboard.dismiss}
            accessible={false}
          />
        </Reanimated.View>
      ) : null}

      <Reanimated.View
        style={[styles.layer, liftStyle]}
        pointerEvents={interactive ? 'box-none' : 'none'}
      >
        <Reanimated.View
          style={[styles.replyGridArea, gridStyle]}
          pointerEvents="box-none"
        >
          {focused ? (
            <Reanimated.View
              entering={FadeIn.duration(200)}
              exiting={FadeOut.duration(120)}
              style={styles.replyGrid}
            >
              {QUICK_REACTIONS.map(emoji => (
                <Pressable
                  key={emoji}
                  onPress={react(emoji)}
                  style={({ pressed }) => [
                    styles.replyGridItem,
                    pressed && styles.reactionPressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={t('stories.react', { emoji })}
                >
                  <Text style={styles.replyGridEmoji}>{emoji}</Text>
                </Pressable>
              ))}
            </Reanimated.View>
          ) : null}
        </Reanimated.View>

        <View
          style={[styles.replyFooter, { paddingBottom: bottomInset + ms(8) }]}
          pointerEvents="box-none"
        >
          {focused ? (
            <Text style={styles.replyHint}>
              {t('stories.privateHint', { name })}
            </Text>
          ) : (
            // One line that scrolls sideways when the chips don't fit.
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              block={scrollBlocks}
              contentContainerStyle={styles.quickReplies}
            >
              {quickReplies.map(reply => (
                <Pressable
                  key={reply}
                  onPress={() => send(reply)}
                  style={({ pressed }) => [
                    styles.quickReply,
                    pressed && styles.quickReplyPressed,
                  ]}
                  accessibilityRole="button"
                >
                  <Text style={styles.quickReplyText} numberOfLines={1}>
                    {reply}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          )}

          {/* The field is keyed, so it keeps its focus as the ends swap. */}
          <ScrollView
            ref={rowRef}
            horizontal
            scrollEnabled={!focused}
            // Otherwise the first tap on send only puts the keyboard away.
            keyboardShouldPersistTaps="handled"
            showsHorizontalScrollIndicator={false}
            block={scrollBlocks}
            contentContainerStyle={styles.replyRow}
          >
            {focused ? (
              <View key="me" style={[styles.avatar, styles.avatarInitials]}>
                <Text style={styles.avatarText}>
                  {initialsOf(myName || t('chat.you'))}
                </Text>
              </View>
            ) : null}

            <View
              key="field"
              style={[
                styles.replyField,
                focused
                  ? styles.replyFieldOpen
                  : { width: width * FIELD_SHARE },
              ]}
            >
              {interactive ? (
                <TextInput
                  value={text}
                  onChangeText={setText}
                  placeholder={t('stories.replyPlaceholder')}
                  placeholderTextColor={`${colors.white}B3`}
                  style={styles.replyInput}
                  maxLength={MAX_REPLY_LENGTH}
                  returnKeyType="send"
                  submitBehavior="submit"
                  onSubmitEditing={() => send(text)}
                  onFocus={() => changeFocus(true)}
                  onBlur={() => changeFocus(false)}
                  keyboardAppearance="dark"
                />
              ) : (
                <Text
                  style={[styles.replyInput, styles.replyPlaceholder]}
                  numberOfLines={1}
                >
                  {t('stories.replyPlaceholder')}
                </Text>
              )}
            </View>

            {focused ? (
              <Pressable
                key="send"
                onPress={() => send(text)}
                disabled={!canSend}
                hitSlop={ms(8)}
                style={[styles.replySend, !canSend && styles.replySendIdle]}
                accessibilityRole="button"
                accessibilityLabel={t('stories.send')}
              >
                <Icon
                  name="paper-plane-outline"
                  size={ms(25)}
                  color={colors.white}
                />
              </Pressable>
            ) : (
              BAR_REACTIONS.map(emoji => (
                <Pressable
                  key={emoji}
                  onPress={react(emoji)}
                  style={({ pressed }) => [
                    styles.reaction,
                    pressed && styles.reactionPressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={t('stories.react', { emoji })}
                >
                  <Text style={styles.reactionEmoji}>{emoji}</Text>
                </Pressable>
              ))
            )}
          </ScrollView>
        </View>
      </Reanimated.View>
    </>
  );
}

// The cube's other sides pass the same props every render.
export default memo(ReplyBar);
