import { memo, useMemo } from 'react';
import { Alert, Image, Pressable, Text, View } from 'react-native';
import {
  isLiquidGlassSupported,
  LiquidGlassView,
} from '@callstack/liquid-glass';
import { useTranslation } from 'react-i18next';
import { ms } from 'react-native-size-matters';
import Icon from 'react-native-vector-icons/Ionicons';

import { useVoicePlayback } from '@/hooks/useVoicePlayback';
import { toggleVoice } from '@/services/audio';
import { splitMentions } from '@/services/chat';
import { getUser } from '@/services/mockData';
import { getSticker } from '@/services/stickers';
import { useTheme } from '@/theme';
import { ME, type ChatMessage, type ChatPhoto } from '@/types/chat';
import { formatDuration } from '@/utils/format';

import StickerView from './StickerView';
import type { GroupChatStyles } from './styles';

const MAX_STACKED_PHOTOS = 3;
const WAVE_BARS = 26;
const NAME_COLORS = ['#E8833A', '#2FA493', '#8E6CD8', '#D95C8A', '#4A90D9'];

function hashOf(value: string) {
  let hash = 0;
  for (const char of value) {
    hash = (hash * 31 + char.charCodeAt(0)) % 1_000_003;
  }
  return hash;
}

export const nameColor = (userId: string) =>
  NAME_COLORS[hashOf(userId) % NAME_COLORS.length];

/** One-line summary used in reply quotes and the reply bar. */
export function useMessagePreview() {
  const { t } = useTranslation();
  return (message: ChatMessage) => {
    if (message.text) {
      return message.text;
    }
    if (message.voice) {
      return `🎤 ${t('chat.voice')} • ${formatDuration(
        message.voice.durationMs,
      )}`;
    }
    const sticker = message.stickerId
      ? getSticker(message.stickerId)
      : undefined;
    if (sticker) {
      return sticker.kind === 'lottie'
        ? `✨ ${t('chat.sticker')}`
        : `${sticker.emoji} ${t('chat.sticker')}`;
    }
    return `📷 ${t('chat.photoCount', { count: message.photos?.length ?? 1 })}`;
  };
}

export function useSenderName() {
  const { t } = useTranslation();
  return (senderId: string) =>
    senderId === ME ? t('chat.you') : getUser(senderId)?.name ?? senderId;
}

export interface MessageRowProps {
  message: ChatMessage;
  mine: boolean;
  groupStart: boolean;
  groupEnd: boolean;
  quoted?: ChatMessage;
  reported: boolean;
  highlighted: boolean;
  styles: GroupChatStyles;
  onLongPress: (message: ChatMessage) => void;
  onOpenPhoto: (photos: ChatPhoto[], index: number) => void;
  onReact: (message: ChatMessage, emoji: string) => void;
  onPressQuote: (messageId: string) => void;
  /** The activity's members; only they are highlighted when tagged. */
  memberIds: ReadonlySet<string>;
}

function MessageRow({
  message,
  mine,
  groupStart,
  groupEnd,
  quoted,
  reported,
  highlighted,
  styles,
  onLongPress,
  onOpenPhoto,
  onReact,
  onPressQuote,
  memberIds,
}: MessageRowProps) {
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const sender = mine ? null : getUser(message.senderId);
  const longPress = () => onLongPress(message);
  const nameSender = groupStart ? sender : null;
  const sticker = message.stickerId ? getSticker(message.stickerId) : undefined;

  return (
    <View
      style={[
        styles.row,
        mine && styles.rowMine,
        groupStart && styles.rowGroupStart,
      ]}
    >
      {mine ? null : (
        <View style={styles.avatarSlot}>
          {groupEnd && sender ? (
            <Image source={sender.avatar} style={styles.avatar} />
          ) : null}
        </View>
      )}
      <View style={[styles.content, mine && styles.contentMine]}>
        {sticker ? (
          <>
            {nameSender ? (
              <Text
                style={[
                  styles.senderName,
                  styles.senderNameOutside,
                  { color: nameColor(message.senderId) },
                ]}
                numberOfLines={1}
              >
                {nameSender.name}
              </Text>
            ) : null}
            {quoted ? (
              <Quote
                message={quoted}
                mine={false}
                styles={styles}
                onPress={() => onPressQuote(quoted.id)}
              />
            ) : null}
            <Pressable
              onLongPress={longPress}
              delayLongPress={280}
              style={[styles.sticker, highlighted && styles.stickerHighlighted]}
              accessibilityHint={t('chat.longPressHint')}
            >
              <StickerView sticker={sticker} size="message" />
            </Pressable>
          </>
        ) : null}
        {message.photos?.length ? (
          <>
            {nameSender ? (
              <Text
                style={[
                  styles.senderName,
                  styles.senderNameOutside,
                  { color: nameColor(message.senderId) },
                ]}
                numberOfLines={1}
              >
                {nameSender.name}
              </Text>
            ) : null}
            <PhotoStack
              photos={message.photos}
              styles={styles}
              onOpen={index => onOpenPhoto(message.photos ?? [], index)}
              onLongPress={longPress}
            />
          </>
        ) : null}
        {message.text || message.voice || (quoted && !sticker) ? (
          <Pressable
            onLongPress={longPress}
            delayLongPress={280}
            style={[
              styles.bubble,
              mine && styles.bubbleMine,
              isLiquidGlassSupported && styles.bubbleGlassed,
              highlighted && styles.bubbleHighlighted,
            ]}
            accessibilityHint={t('chat.longPressHint')}
          >
            {isLiquidGlassSupported ? (
              <LiquidGlassView
                pointerEvents="none"
                effect="regular"
                colorScheme={isDark ? 'dark' : 'light'}
                tintColor={mine ? `${colors.text}E6` : undefined}
                style={styles.bubbleGlass}
              />
            ) : null}
            {nameSender && !message.photos?.length ? (
              <Text
                style={[
                  styles.senderName,
                  { color: nameColor(message.senderId) },
                ]}
                numberOfLines={1}
              >
                {nameSender.name}
              </Text>
            ) : null}
            {quoted && !sticker ? (
              <Quote
                message={quoted}
                mine={mine}
                styles={styles}
                onPress={() => onPressQuote(quoted.id)}
              />
            ) : null}
            {message.voice ? (
              <VoiceClip message={message} mine={mine} styles={styles} />
            ) : null}
            {message.text ? (
              <MessageText
                text={message.text}
                mine={mine}
                mentionNames={(message.mentionIds ?? [])
                  .filter(id => memberIds.has(id))
                  .map(id => getUser(id).name)}
                styles={styles}
              />
            ) : null}
          </Pressable>
        ) : null}
        {message.reactions?.length ? (
          <View style={styles.reactions}>
            {message.reactions.map(reaction => (
              <Pressable
                key={reaction.emoji}
                onPress={() => onReact(message, reaction.emoji)}
                style={[styles.reaction, reaction.mine && styles.reactionMine]}
                accessibilityRole="button"
                accessibilityState={{ selected: !!reaction.mine }}
              >
                <Text style={styles.reactionText}>
                  {`${reaction.emoji} ${reaction.count}`}
                </Text>
              </Pressable>
            ))}
          </View>
        ) : null}
        {reported ? (
          <View style={styles.reportedRow}>
            <Icon name="flag" size={ms(11)} color={colors.textMuted} />
            <Text style={styles.reportedText}>{t('chat.reported')}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

export default memo(MessageRow);

function Quote({
  message,
  mine,
  styles,
  onPress,
}: {
  message: ChatMessage;
  mine: boolean;
  styles: GroupChatStyles;
  onPress: () => void;
}) {
  const preview = useMessagePreview();
  const senderName = useSenderName();
  return (
    <Pressable
      onPress={onPress}
      style={[styles.quote, mine && styles.quoteMine]}
      accessibilityRole="button"
    >
      <Text
        style={[styles.quoteName, mine && styles.quoteNameMine]}
        numberOfLines={1}
      >
        {senderName(message.senderId)}
      </Text>
      <Text
        style={[styles.quoteText, mine && styles.quoteTextMine]}
        numberOfLines={2}
      >
        {preview(message)}
      </Text>
    </Pressable>
  );
}

function VoiceClip({
  message,
  mine,
  styles,
}: {
  message: ChatMessage;
  mine: boolean;
  styles: GroupChatStyles;
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const voice = message.voice!;
  const { playing, progress, positionMs } = useVoicePlayback(
    message.id,
    voice.durationMs,
  );
  const bars = useMemo(() => {
    const seed = hashOf(message.id);
    return Array.from(
      { length: WAVE_BARS },
      (_, i) => 0.25 + (((seed + 1) * (i + 3) * 7919) % 100) / 133,
    );
  }, [message.id]);
  const played = Math.round(progress * WAVE_BARS);
  const tint = mine ? colors.background : colors.text;

  const toggle = () =>
    toggleVoice(message.id, voice.uri, voice.durationMs).catch(() =>
      Alert.alert(t('chat.voiceFailed')),
    );

  return (
    <View style={styles.voice}>
      <Pressable
        onPress={toggle}
        hitSlop={6}
        style={[styles.voiceButton, mine && styles.voiceButtonMine]}
        accessibilityRole="button"
        accessibilityLabel={t(playing ? 'chat.pause' : 'chat.play')}
      >
        <Icon
          name={playing ? 'pause' : 'play'}
          size={ms(16)}
          color={mine ? colors.text : colors.white}
        />
      </Pressable>
      <View style={styles.wave}>
        {bars.map((height, i) => (
          <View
            key={i}
            style={[
              styles.waveBar,
              i >= played && styles.waveBarIdle,
              { height: `${height * 100}%`, backgroundColor: tint },
            ]}
          />
        ))}
      </View>
      <Text style={[styles.voiceTime, mine && styles.messageTextMine]}>
        {formatDuration(positionMs || voice.durationMs)}
      </Text>
    </View>
  );
}

function MessageText({
  text,
  mine,
  mentionNames,
  styles,
}: {
  text: string;
  mine: boolean;
  mentionNames: string[];
  styles: GroupChatStyles;
}) {
  return (
    <Text style={[styles.messageText, mine && styles.messageTextMine]}>
      {splitMentions(text, mentionNames).map((part, i) =>
        i % 2 === 1 ? (
          <Text key={i} style={styles.mention}>
            {part}
          </Text>
        ) : (
          part
        ),
      )}
    </Text>
  );
}

function PhotoStack({
  photos,
  styles,
  onOpen,
  onLongPress,
}: {
  photos: ChatPhoto[];
  styles: GroupChatStyles;
  onOpen: (index: number) => void;
  onLongPress: () => void;
}) {
  const { t } = useTranslation();
  const [front, left, right] = photos;
  const hidden = photos.length - MAX_STACKED_PHOTOS;
  const tile = (photo: ChatPhoto, index: number, style: object) => (
    <Pressable
      key={index}
      onPress={() => onOpen(index)}
      onLongPress={onLongPress}
      delayLongPress={280}
      style={style}
      accessibilityRole="imagebutton"
      accessibilityLabel={t('chat.info.openPhoto', { index: index + 1 })}
    >
      <Image source={photo} style={styles.photoFill} />
      {index === 0 && hidden > 0 ? (
        <View style={styles.morePhotos}>
          <Text style={styles.morePhotosText}>
            {t('chat.morePhotos', { count: hidden })}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );

  if (photos.length === 1) {
    return tile(front, 0, [styles.photoSingle]);
  }
  return (
    <View style={styles.photoStack}>
      {left !== undefined
        ? tile(left, 1, [styles.photo, styles.photoBack, styles.photoLeft])
        : null}
      {right !== undefined
        ? tile(right, 2, [styles.photo, styles.photoBack, styles.photoRight])
        : null}
      {tile(front, 0, [styles.photo, styles.photoFront])}
    </View>
  );
}
