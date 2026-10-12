import {
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type Ref,
} from 'react';
import {
  Alert,
  Image,
  Keyboard,
  Pressable,
  Text,
  TextInput,
  View,
  type TextInputInstance,
} from 'react-native';
import {
  isLiquidGlassSupported,
  LiquidGlassView,
} from '@callstack/liquid-glass';
import { useTranslation } from 'react-i18next';
import Reanimated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { ms } from 'react-native-size-matters';
import { scheduleOnRN } from 'react-native-worklets';
import Icon from 'react-native-vector-icons/Ionicons';

import PulseDot from '@/components/PulseDot';
import StickerIcon from '@/components/StickerIcon';
import { canRecord, startRecording, stopRecording } from '@/services/audio';
import { splitMentions } from '@/services/chat';
import { getUser } from '@/services/mockData';
import type { Sticker } from '@/services/stickers';
import { useTheme } from '@/theme';
import type { ChatDraft, ChatMessage } from '@/types/chat';
import { formatDuration } from '@/utils/format';

import { useMessagePreview, useSenderName } from './MessageRow';
import StickerPanel from './StickerPanel';
import { STICKER_PANEL_SPACE, type GroupChatStyles } from './styles';

/** Shorter clips are treated as accidental taps and dropped. */
const MIN_VOICE_MS = 1000;
const MAX_MENTION_OPTIONS = 5;
/** The sticker panel sliding in or out, the field moving with it. */
const PANEL_SLIDE = { duration: 250, easing: Easing.out(Easing.cubic) };
/** After the screen's slid in, when the panel's built ahead of use. */
const PANEL_PREBUILD_MS = 800;
/** The `@query` being typed right before the cursor. */
const MENTION_QUERY = /(?:^|\s)@([^\s@]*)$/;

/** Lowercase without Vietnamese accents, so "@thao" finds "Thảo Vy". */
const fold = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase();

interface Props {
  replyTo: ChatMessage | null;
  /** The only people who can be tagged; host first. */
  memberIds: readonly string[];
  hostId: string;
  bottomPadding: number;
  styles: GroupChatStyles;
  onCancelReply: () => void;
  onSend: (draft: Omit<ChatDraft, 'replyToId'>) => void;
  /** The picture button: the chat gallery, for photos or a clip. */
  onOpenGallery: () => void;
  ref?: Ref<ComposerHandle>;
}

export interface ComposerHandle {
  /** Puts the sticker panel away, e.g. on a tap among the messages. */
  closeStickers: () => void;
}

export default function Composer({
  replyTo,
  memberIds,
  hostId,
  bottomPadding,
  styles,
  onCancelReply,
  onSend,
  onOpenGallery,
  ref,
}: Props) {
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const preview = useMessagePreview();
  const senderName = useSenderName();
  const inputRef = useRef<TextInputInstance>(null);

  const [draft, setDraft] = useState('');
  const [cursor, setCursor] = useState(0);
  const [taggedIds, setTaggedIds] = useState<string[]>([]);
  // A tag whose name was edited away stops being a tag.
  const liveTaggedIds = taggedIds.filter(id =>
    draft.includes(getUser(id).name),
  );
  /** The sticker button's state: the panel is open, or opening. */
  const [stickersOpen, setStickersOpen] = useState(false);
  /**
   * The panel's been opened, and is kept from then on (hidden when shut):
   * building its animated stickers again each time would hold up the slide.
   */
  const [panelBuilt, setPanelBuilt] = useState(false);
  /**
   * Its animated stickers run, once it's slid open, and stop once it's slid
   * shut: starting or stopping them mid-slide would hold the slide up.
   */
  const [stickersPlaying, setStickersPlaying] = useState(false);
  const stickersOpenRef = useRef(stickersOpen);
  stickersOpenRef.current = stickersOpen;
  /**
   * The panel's room under the field. Shut, it's the field's own bottom
   * padding, which the panel takes over: so nothing jumps as it comes or goes.
   */
  const panelRoom = useSharedValue(0);
  const panelRoomStyle = useAnimatedStyle(() => ({
    height: panelRoom.value,
  }));
  // Out of sight once it's slid shut, rather than peeking over the padding.
  const panelStyle = useAnimatedStyle(() => ({
    opacity: panelRoom.value > bottomPadding + 0.5 ? 1 : 0,
  }));
  // Built shortly after the chat opens (hidden, its stickers still), so even
  // the first slide has nothing to build.
  useEffect(() => {
    const timer = setTimeout(() => setPanelBuilt(true), PANEL_PREBUILD_MS);
    return () => clearTimeout(timer);
  }, []);
  // Shut, the room is the field's padding, which shrinks with the keyboard up.
  useEffect(() => {
    if (!stickersOpenRef.current) {
      panelRoom.value = bottomPadding;
    }
  }, [bottomPadding, panelRoom]);

  /** Shows or hides the panel at once, as the keyboard comes or goes. */
  const setStickersNow = (open: boolean) => {
    panelRoom.value = open ? STICKER_PANEL_SPACE : bottomPadding;
    setStickersOpen(open);
    setStickersPlaying(open);
    if (open) {
      setPanelBuilt(true);
    }
  };

  /**
   * Opens or closes the panel. With the keyboard down it slides, the field
   * moving with it; with it up, the keyboard's own animation moves things.
   */
  const slideStickers = (open: boolean) => {
    if (open === stickersOpenRef.current) {
      return;
    }
    if (Keyboard.isVisible()) {
      setStickersNow(open);
      return;
    }
    setStickersOpen(open);
    setPanelBuilt(true);
    panelRoom.value = withTiming(
      open ? STICKER_PANEL_SPACE : bottomPadding,
      PANEL_SLIDE,
      finished => {
        // Not if it was turned back meanwhile (that cut this short).
        if (finished) {
          scheduleOnRN(setStickersPlaying, open);
        }
      },
    );
  };
  const slideStickersRef = useRef(slideStickers);
  slideStickersRef.current = slideStickers;
  useImperativeHandle(
    ref,
    () => ({ closeStickers: () => slideStickersRef.current(false) }),
    [],
  );
  const [recordingMs, setRecordingMs] = useState<number | null>(null);
  const recording = recordingMs !== null;
  const recordingRef = useRef(false);
  const elapsedRef = useRef(0);

  useEffect(() => {
    if (replyTo) {
      inputRef.current?.focus();
    }
  }, [replyTo]);

  useEffect(
    () => () => {
      if (recordingRef.current) {
        stopRecording().catch(() => {});
      }
    },
    [],
  );

  const sendText = () => {
    const text = draft.trim();
    if (text) {
      onSend({
        text,
        mentionIds: liveTaggedIds.length > 0 ? liveTaggedIds : undefined,
      });
      setDraft('');
      setTaggedIds([]);
    }
  };

  const toggleStickers = () => {
    if (!stickersOpen && Keyboard.isVisible()) {
      Keyboard.dismiss();
    }
    slideStickers(!stickersOpen);
  };

  const sendSticker = (sticker: Sticker) => onSend({ stickerId: sticker.id });

  const startVoice = async () => {
    Keyboard.dismiss();
    setStickersNow(false);
    if (!(await canRecord())) {
      Alert.alert(t('chat.micDeniedTitle'), t('chat.micDeniedMessage'));
      return;
    }
    try {
      elapsedRef.current = 0;
      setRecordingMs(0);
      recordingRef.current = true;
      await startRecording(elapsed => {
        elapsedRef.current = elapsed;
        setRecordingMs(elapsed);
      });
    } catch {
      recordingRef.current = false;
      setRecordingMs(null);
      Alert.alert(t('chat.micDeniedTitle'), t('chat.micDeniedMessage'));
    }
  };

  const finishVoice = async (send: boolean) => {
    if (!recordingRef.current) {
      return;
    }
    recordingRef.current = false;
    const durationMs = elapsedRef.current;
    setRecordingMs(null);
    try {
      const uri = await stopRecording();
      if (send && durationMs >= MIN_VOICE_MS) {
        onSend({ voice: { uri, durationMs } });
      }
    } catch {
      Alert.alert(t('chat.voiceFailed'));
    }
  };

  const mentionQuery = MENTION_QUERY.exec(draft.slice(0, cursor))?.[1];
  const mentionOptions =
    mentionQuery === undefined || recording
      ? []
      : memberIds
          .map(getUser)
          .filter(
            user => !!user && fold(user.name).includes(fold(mentionQuery)),
          )
          .slice(0, MAX_MENTION_OPTIONS);

  const insertMention = (userId: string) => {
    if (mentionQuery === undefined) {
      return;
    }
    const start = cursor - mentionQuery.length - 1;
    const token = `${getUser(userId).name} `;
    const next = cursor + token.length - mentionQuery.length - 1;
    setDraft(draft.slice(0, start) + token + draft.slice(cursor));
    setCursor(next);
    setTaggedIds(ids => (ids.includes(userId) ? ids : [...ids, userId]));
    requestAnimationFrame(() => inputRef.current?.setSelection(next, next));
  };

  const hasText = draft.trim().length > 0;
  const mainAction = recording
    ? () => finishVoice(true)
    : hasText
    ? sendText
    : startVoice;

  return (
    <View
      style={[
        styles.composerWrap,
        !panelBuilt && { paddingBottom: bottomPadding },
      ]}
    >
      {replyTo ? (
        <View style={styles.replyBar}>
          <View style={styles.replyBarAccent} />
          <View style={styles.flex}>
            <Text style={styles.replyBarTitle} numberOfLines={1}>
              {t('chat.replyingTo', { name: senderName(replyTo.senderId) })}
            </Text>
            <Text style={styles.replyBarText} numberOfLines={1}>
              {preview(replyTo)}
            </Text>
          </View>
          <Pressable
            onPress={onCancelReply}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={t('chat.cancelReply')}
          >
            <Icon name="close" size={ms(18)} color={colors.textSecondary} />
          </Pressable>
        </View>
      ) : null}

      {mentionOptions.length > 0 ? (
        <LiquidGlassView
          colorScheme={isDark ? 'dark' : 'light'}
          style={[
            styles.mentions,
            !isLiquidGlassSupported && styles.mentionsFallback,
          ]}
        >
          {mentionOptions.map(user => (
            <Pressable
              key={user.id}
              onPress={() => insertMention(user.id)}
              style={({ pressed }) => [
                styles.mentionOption,
                pressed && styles.mentionOptionPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel={t('chat.mentionMember', { name: user.name })}
            >
              <Image source={user.avatar} style={styles.mentionAvatar} />
              <Text style={styles.mentionName} numberOfLines={1}>
                {user.name}
              </Text>
              {user.id === hostId ? (
                <Text style={styles.mentionHost}>{t('chat.mentionHost')}</Text>
              ) : null}
            </Pressable>
          ))}
        </LiquidGlassView>
      ) : null}

      <View style={styles.composer}>
        <LiquidGlassView
          colorScheme={isDark ? 'dark' : 'light'}
          style={[
            styles.inputPill,
            !isLiquidGlassSupported && styles.inputFallback,
          ]}
        >
          {recording ? (
            <>
              <Pressable
                onPress={() => finishVoice(false)}
                hitSlop={6}
                accessibilityRole="button"
                accessibilityLabel={t('chat.cancelVoice')}
              >
                <Icon
                  name="trash-outline"
                  size={ms(20)}
                  color={colors.danger}
                />
              </Pressable>
              <View style={styles.recording}>
                <PulseDot color={colors.danger} size={ms(8)} />
                <Text style={styles.recordingText}>
                  {t('chat.recording', {
                    time: formatDuration(recordingMs ?? 0),
                  })}
                </Text>
              </View>
            </>
          ) : (
            <>
              <Pressable
                onPress={toggleStickers}
                hitSlop={6}
                accessibilityRole="button"
                accessibilityLabel={t(
                  stickersOpen ? 'chat.hideStickers' : 'chat.stickers',
                )}
                accessibilityState={{ expanded: stickersOpen }}
              >
                {/* Filled while the panel's open. */}
                <StickerIcon
                  size={ms(23)}
                  filled={stickersOpen}
                  color={stickersOpen ? colors.primary : colors.textMuted}
                  contrast={colors.white}
                />
              </Pressable>
              <TextInput
                ref={inputRef}
                onChangeText={setDraft}
                onSelectionChange={event =>
                  setCursor(event.nativeEvent.selection.start)
                }
                onFocus={() => setStickersNow(false)}
                placeholder={t('chat.placeholder')}
                placeholderTextColor={colors.textMuted}
                style={styles.input}
                multiline
                accessibilityLabel={t('chat.placeholder')}
              >
                {splitMentions(
                  draft,
                  liveTaggedIds.map(id => getUser(id).name),
                ).map((part, i) =>
                  i % 2 === 1 ? (
                    <Text key={i} style={styles.inputMention}>
                      {part}
                    </Text>
                  ) : (
                    part
                  ),
                )}
              </TextInput>
              <Pressable
                onPress={onOpenGallery}
                hitSlop={6}
                accessibilityRole="button"
                accessibilityLabel={t('chat.addMedia')}
              >
                <Icon
                  name="images-outline"
                  size={ms(22)}
                  color={colors.textMuted}
                />
              </Pressable>
            </>
          )}
        </LiquidGlassView>
        <Pressable
          onPress={mainAction}
          style={({ pressed }) => [
            styles.sendButton,
            recording && styles.sendButtonRecording,
            pressed && styles.pressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel={t(
            recording || hasText ? 'chat.send' : 'chat.recordVoice',
          )}
        >
          <Icon
            name={recording || hasText ? 'arrow-up' : 'mic'}
            size={ms(22)}
            color={colors.white}
          />
        </Pressable>
      </View>
      {/* Once built, the panel's room also stands in for the padding. */}
      {panelBuilt ? (
        <Reanimated.View style={[styles.stickerRoom, panelRoomStyle]}>
          <Reanimated.View style={panelStyle}>
            <StickerPanel
              styles={styles}
              onPick={sendSticker}
              playing={stickersPlaying}
            />
          </Reanimated.View>
        </Reanimated.View>
      ) : null}
    </View>
  );
}
