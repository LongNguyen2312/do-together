import { useEffect, useRef, useState } from 'react';
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
import {
  launchCamera,
  launchImageLibrary,
  type ImagePickerResponse,
} from 'react-native-image-picker';
import { useTranslation } from 'react-i18next';
import { ms } from 'react-native-size-matters';
import Icon from 'react-native-vector-icons/Ionicons';

import PulseDot from '@/components/PulseDot';
import { canRecord, startRecording, stopRecording } from '@/services/audio';
import { splitMentions } from '@/services/chat';
import { getUser } from '@/services/mockData';
import type { Sticker } from '@/services/stickers';
import { useTheme } from '@/theme';
import type { ChatDraft, ChatMessage } from '@/types/chat';
import { formatDuration } from '@/utils/format';

import { useMessagePreview, useSenderName } from './MessageRow';
import StickerPanel from './StickerPanel';
import type { GroupChatStyles } from './styles';

const MAX_PHOTOS = 10;
const PHOTO_MAX_SIZE = 1600;
/** Shorter clips are treated as accidental taps and dropped. */
const MIN_VOICE_MS = 1000;
const MAX_MENTION_OPTIONS = 5;
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
}

export default function Composer({
  replyTo,
  memberIds,
  hostId,
  bottomPadding,
  styles,
  onCancelReply,
  onSend,
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
  const [stickersOpen, setStickersOpen] = useState(false);
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

  const onPicked = (result: ImagePickerResponse) => {
    if (result.didCancel) {
      return;
    }
    if (result.errorCode) {
      Alert.alert(
        t('chat.photoErrorTitle'),
        result.errorCode === 'camera_unavailable'
          ? t('chat.cameraUnavailable')
          : result.errorCode === 'permission'
          ? t('chat.photoPermission')
          : result.errorMessage,
      );
      return;
    }
    const photos = (result.assets ?? [])
      .map(asset => asset.uri)
      .filter((uri): uri is string => !!uri)
      .map(uri => ({ uri }));
    if (photos.length > 0) {
      onSend({ photos });
    }
  };

  const pickPhotos = async () => {
    Keyboard.dismiss();
    onPicked(
      await launchImageLibrary({
        mediaType: 'photo',
        selectionLimit: MAX_PHOTOS,
        maxWidth: PHOTO_MAX_SIZE,
        maxHeight: PHOTO_MAX_SIZE,
        quality: 0.8,
      }),
    );
  };

  const takePhoto = async () => {
    Keyboard.dismiss();
    onPicked(
      await launchCamera({
        mediaType: 'photo',
        maxWidth: PHOTO_MAX_SIZE,
        maxHeight: PHOTO_MAX_SIZE,
        quality: 0.8,
      }),
    );
  };

  const choosePhotoSource = () => {
    Keyboard.dismiss();
    Alert.alert(t('chat.photoSourceTitle'), undefined, [
      { text: t('chat.camera'), onPress: takePhoto },
      { text: t('chat.attach'), onPress: pickPhotos },
      { text: t('common.cancel'), style: 'cancel' },
    ]);
  };

  const toggleStickers = () => {
    if (stickersOpen) {
      setStickersOpen(false);
    } else {
      Keyboard.dismiss();
      setStickersOpen(true);
    }
  };

  const sendSticker = (sticker: Sticker) => onSend({ stickerId: sticker.id });

  const startVoice = async () => {
    Keyboard.dismiss();
    setStickersOpen(false);
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
        !stickersOpen && { paddingBottom: bottomPadding },
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
                <Icon
                  name={stickersOpen ? 'happy' : 'happy-outline'}
                  size={ms(21)}
                  color={stickersOpen ? colors.primary : colors.textMuted}
                />
              </Pressable>
              <TextInput
                ref={inputRef}
                onChangeText={setDraft}
                onSelectionChange={event =>
                  setCursor(event.nativeEvent.selection.start)
                }
                onFocus={() => setStickersOpen(false)}
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
                onPress={choosePhotoSource}
                hitSlop={6}
                accessibilityRole="button"
                accessibilityLabel={t('chat.photoSourceTitle')}
              >
                <Icon
                  name="camera-outline"
                  size={ms(20)}
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
      {stickersOpen ? (
        <StickerPanel styles={styles} onPick={sendSticker} />
      ) : null}
    </View>
  );
}
