import {
  memo,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentRef,
  type ReactNode,
} from 'react';
import {
  Alert,
  Image,
  Pressable,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
  useWindowDimensions,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  GestureDetector,
  useCompetingGestures,
  useLongPressGesture,
  usePanGesture,
  useTapGesture,
} from 'react-native-gesture-handler';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { ms } from 'react-native-size-matters';
import Icon from 'react-native-vector-icons/Ionicons';
import { scheduleOnRN } from 'react-native-worklets';

import LogoLoader from '@/components/LogoLoader';
import { useVoicePlayback } from '@/hooks/useVoicePlayback';
import { toggleVoice, WAVEFORM_BARS } from '@/services/audio';
import { splitMentions } from '@/services/chat';
import { getUser } from '@/services/mockData';
import { getSticker } from '@/services/stickers';
import { useTheme } from '@/theme';
import {
  ME,
  type ChatMessage,
  type ChatPhoto,
  type ChatVideo,
} from '@/types/chat';
import { formatDuration } from '@/utils/format';

import StickerView from '@/components/StickerView';
import type { MessageFrame } from './MessageReactionMenu';
import {
  MEDIA_TILE_MAX_HEIGHT,
  MEDIA_TILE_MAX_WIDTH,
  WAVE_HEIGHT,
  type GroupChatStyles,
} from './styles';

const MAX_STACKED_PHOTOS = 3;
/** A double tap's reaction, as on Messenger. */
export const LIKE = '❤️';
/** Held this long, a message opens its reactions. */
const LONG_PRESS_MS = 350;
/** Sideways travel before a drag starts swiping to reply. */
const SWIPE_SLOP = ms(14);
/** Swiped this far (and no further), letting go replies. */
const REPLY_AT = ms(64);
/** A long message only goes as far as the room beside it, but at least this. */
const MIN_SWIPE = ms(28);
/** The chat's edge, in from the screen's: a swiped message stops there. */
const CHAT_EDGE = ms(12);
/** Jumped to from a reply, a message shakes once the list's scrolled there. */
const SHAKE_DELAY_MS = 300;
/** Each swing of the shake, side to side, smaller each time. */
const SHAKE_SWINGS = [-8, 7, -5, 4, -2, 0].map(x => ms(x));
const SHAKE_SWING_MS = 60;
const SNAP_BACK = { damping: 22, stiffness: 300, mass: 0.7 };

type TapGesture = ReturnType<typeof useTapGesture>;
/** The quietest bar still shows as a dot. */
const WAVE_MIN_BAR = ms(3);

/**
 * For voice notes sent before waves were recorded: a made-up but voice-like
 * shape (smooth swells, quieter at the ends), the same each time for a note.
 */
function placeholderWave(seed: number) {
  return Array.from({ length: WAVEFORM_BARS }, (_, i) => {
    const swell =
      0.5 +
      0.28 * Math.sin(i * 0.8 + seed) +
      0.16 * Math.sin(i * 2.1 + seed * 1.7) +
      0.08 * Math.sin(i * 4.7 + seed * 0.3);
    const ends = Math.sqrt(Math.sin((Math.PI * (i + 0.5)) / WAVEFORM_BARS));
    return Math.min(Math.max(swell * ends, 0.12), 1);
  });
}
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
    if (message.video) {
      return `🎬 ${t('chat.video')} • ${formatDuration(
        message.video.durationMs,
      )}`;
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
  quoted?: ChatMessage;
  reported: boolean;
  highlighted: boolean;
  styles: GroupChatStyles;
  /** Held: its reactions and actions, by where it is on screen. */
  onLongPress: (message: ChatMessage, frame: MessageFrame) => void;
  /** Swiped sideways (right for others', left for the user's own). */
  onReply: (message: ChatMessage) => void;
  /** Off in a closed chat: no likes, reactions or replies. */
  interactive: boolean;
  onOpenPhoto: (photos: ChatPhoto[], index: number) => void;
  onOpenVideo: (video: ChatVideo) => void;
  onReact: (message: ChatMessage, emoji: string) => void;
  onPressQuote: (messageId: string) => void;
  /** The activity's members; only they are highlighted when tagged. */
  memberIds: ReadonlySet<string>;
}

function MessageRow({
  message,
  mine,
  groupStart,
  quoted,
  reported,
  highlighted,
  styles,
  onLongPress,
  onReply,
  interactive,
  onOpenPhoto,
  onOpenVideo,
  onReact,
  onPressQuote,
  memberIds,
}: MessageRowProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const sender = mine ? null : getUser(message.senderId);
  const contentRef = useRef<ComponentRef<typeof Animated.View>>(null);

  // Held: the menu opens by the message, wherever it is on screen.
  const openMenu = () =>
    contentRef.current?.measureInWindow((x, y, width, height) =>
      onLongPress(message, { x, y, width, height }),
    );
  const like = () => onReact(message, LIKE);
  const reply = () => onReply(message);

  // A double tap likes it (the heart shows with its reactions, under it).
  const doubleTap = useTapGesture({
    numberOfTaps: 2,
    enabled: interactive,
    onActivate: () => {
      'worklet';
      scheduleOnRN(like);
    },
  });
  const hold = useLongPressGesture({
    enabled: interactive,
    minDuration: LONG_PRESS_MS,
    onActivate: () => {
      'worklet';
      scheduleOnRN(openMenu);
    },
  });

  // Swiped away from its side: others' to the right, the user's to the left.
  const away = mine ? -1 : 1;
  const swipeX = useSharedValue(0);
  // How far it can go and stay in the chat: the room between the message
  // and the chat's edge on the side it moves to (a long one has little), up
  // to REPLY_AT. Measured on screen, as it's laid out.
  const { width: screenWidth } = useWindowDimensions();
  const room = useSharedValue(REPLY_AT);
  const measureRoom = () =>
    contentRef.current?.measureInWindow((x, _y, width) => {
      room.value = mine ? x - CHAT_EDGE : screenWidth - CHAT_EDGE - x - width;
    });
  const swipeLimit = () => {
    'worklet';
    return Math.max(Math.min(REPLY_AT, room.value), MIN_SWIPE);
  };
  const swipe = usePanGesture({
    enabled: interactive,
    activeOffsetX: mine ? [-SWIPE_SLOP, 9999] : [-9999, SWIPE_SLOP],
    failOffsetY: [-SWIPE_SLOP, SWIPE_SLOP],
    onUpdate: event => {
      'worklet';
      // Only so far: at the reply point, or the chat's edge, it stops.
      swipeX.value =
        away * Math.min(Math.max(event.translationX * away, 0), swipeLimit());
    },
    onDeactivate: () => {
      'worklet';
      if (Math.abs(swipeX.value) >= swipeLimit() - 0.5) {
        scheduleOnRN(reply);
      }
    },
    // However it ends, done or cut off (e.g. by the list scrolling), the
    // message goes back to its place.
    onFinalize: () => {
      'worklet';
      swipeX.value = withSpring(0, SNAP_BACK);
    },
  });
  const gesture = useCompetingGestures(swipe, hold, doubleTap);

  // Jumped to: a quick shake, and a little swell while it does.
  const shake = useSharedValue(0);
  const swell = useSharedValue(1);
  useEffect(() => {
    if (!highlighted) {
      return;
    }
    const swing = (x: number) =>
      withTiming(x, {
        duration: SHAKE_SWING_MS,
        easing: Easing.inOut(Easing.quad),
      });
    shake.value = withDelay(
      SHAKE_DELAY_MS,
      withSequence(...SHAKE_SWINGS.map(swing)),
    );
    swell.value = withDelay(
      SHAKE_DELAY_MS,
      withSequence(
        withTiming(1.04, { duration: 140, easing: Easing.out(Easing.quad) }),
        withTiming(1, { duration: 220, easing: Easing.inOut(Easing.quad) }),
      ),
    );
  }, [highlighted, shake, swell]);
  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shake.value }, { scale: swell.value }],
  }));

  const slideStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: swipeX.value }],
  }));
  // The reply arrow shows behind the message as it's swiped off.
  const replyIconStyle = useAnimatedStyle(() => {
    const pulled = Math.min(Math.abs(swipeX.value) / swipeLimit(), 1);
    return {
      opacity: pulled,
      transform: [{ scale: interpolate(pulled, [0, 1], [0.5, 1]) }],
    };
  });
  const nameSender = groupStart ? sender : null;
  const sticker = message.stickerId ? getSticker(message.stickerId) : undefined;

  return (
    <View style={[styles.rowWrap, groupStart && styles.rowGroupStart]}>
      {/* Behind the message, on the side it's swiped away from. */}
      <Animated.View
        style={[
          styles.replyHint,
          mine ? styles.replyHintMine : styles.replyHintTheirs,
          replyIconStyle,
        ]}
        pointerEvents="none"
      >
        <Icon name="arrow-undo" size={ms(18)} color={colors.textSecondary} />
      </Animated.View>
      <Animated.View style={[styles.row, mine && styles.rowMine, slideStyle]}>
        {mine ? null : (
          // On the first message of a run, level with its top: the sender's
          // name, inside the bubble or above photos and stickers.
          <View style={styles.avatarSlot}>
            {groupStart && sender ? (
              <Image source={sender.avatar} style={styles.avatar} />
            ) : null}
          </View>
        )}
        <GestureDetector gesture={gesture}>
          <Animated.View
            ref={contentRef}
            onLayout={measureRoom}
            style={[styles.content, mine && styles.contentMine, shakeStyle]}
            accessibilityHint={
              interactive ? t('chat.longPressHint') : undefined
            }
          >
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
                <View style={styles.sticker}>
                  <StickerView sticker={sticker} size="message" />
                </View>
              </>
            ) : null}
            {message.photos?.length || message.video ? (
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
                {message.video ? (
                  <VideoTile
                    video={message.video}
                    sending={message.status === 'sending'}
                    styles={styles}
                    onOpen={() => message.video && onOpenVideo(message.video)}
                    doubleTap={doubleTap}
                  />
                ) : (
                  <PhotoStack
                    photos={message.photos ?? []}
                    sending={message.status === 'sending'}
                    styles={styles}
                    onOpen={index => onOpenPhoto(message.photos ?? [], index)}
                    doubleTap={doubleTap}
                  />
                )}
              </>
            ) : null}
            {message.text || message.voice || (quoted && !sticker) ? (
              <View
                // A plain see-through bubble, not liquid glass: a glass view per
                // message appeared a beat after its row, so bubbles flickered in
                // as rows were drawn (scrolling, new messages, the keyboard).
                style={[styles.bubble, mine && styles.bubbleMine]}
              >
                {nameSender && !message.photos?.length && !message.video ? (
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
              </View>
            ) : null}
            {message.reactions?.length ? (
              <View style={styles.reactions}>
                {message.reactions.map(reaction => (
                  <Pressable
                    key={reaction.emoji}
                    onPress={() => onReact(message, reaction.emoji)}
                    style={[
                      styles.reaction,
                      reaction.mine && styles.reactionMine,
                    ]}
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
            {message.status === 'failed' ? (
              <View style={styles.reportedRow}>
                <Icon name="alert-circle" size={ms(13)} color={colors.danger} />
                <Text style={[styles.reportedText, { color: colors.danger }]}>
                  {t('chat.sendFailed')}
                </Text>
              </View>
            ) : null}
            {reported ? (
              <View style={styles.reportedRow}>
                <Icon name="flag" size={ms(11)} color={colors.textMuted} />
                <Text style={styles.reportedText}>{t('chat.reported')}</Text>
              </View>
            ) : null}
          </Animated.View>
        </GestureDetector>
      </Animated.View>
    </View>
  );
}

export default memo(MessageRow);

/** A tap that waits to be sure it isn't half of a double tap (a like). */
function TapTarget({
  doubleTap,
  onTap,
  style,
  label,
  children,
}: {
  doubleTap: TapGesture;
  onTap: () => void;
  style: StyleProp<ViewStyle>;
  label: string;
  children: ReactNode;
}) {
  const tap = useTapGesture({
    requireToFail: doubleTap,
    onActivate: () => {
      'worklet';
      scheduleOnRN(onTap);
    },
  });
  return (
    <GestureDetector gesture={tap}>
      <View
        style={style}
        accessible
        accessibilityRole="imagebutton"
        accessibilityLabel={label}
      >
        {children}
      </View>
    </GestureDetector>
  );
}

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
  const bars = useMemo(
    () =>
      voice.waveform?.length
        ? voice.waveform
        : placeholderWave(hashOf(message.id)),
    [voice.waveform, message.id],
  );
  const played = progress * bars.length;
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
              {
                height: Math.max(WAVE_MIN_BAR, height * WAVE_HEIGHT),
                backgroundColor: tint,
              },
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
  sending,
  styles,
  onOpen,
  doubleTap,
}: {
  photos: ChatPhoto[];
  /** Still being compressed: all of them dimmed, with a spinner. */
  sending: boolean;
  styles: GroupChatStyles;
  onOpen: (index: number) => void;
  /** The message's like: a tap waits to be sure it isn't one. */
  doubleTap: TapGesture;
}) {
  const { t } = useTranslation();
  const [front, left, right] = photos;
  // A lone photo takes its own shape.
  const loneSize = usePhotoSize(photos.length === 1 ? front : undefined);
  const hidden = photos.length - MAX_STACKED_PHOTOS;
  const tile = (photo: ChatPhoto, index: number, style: object) => (
    <TapTarget
      key={index}
      doubleTap={doubleTap}
      onTap={() => onOpen(index)}
      style={style}
      label={t('chat.info.openPhoto', { index: index + 1 })}
    >
      <Image source={photo} style={styles.photoFill} />
      {/* Every photo dims; one spinner over the lot (or the only one). */}
      {sending ? (
        <Sending styles={styles} spinner={photos.length === 1} />
      ) : null}
      {index === 0 && hidden > 0 ? (
        <View style={styles.morePhotos}>
          <Text style={styles.morePhotosText}>
            {t('chat.morePhotos', { count: hidden })}
          </Text>
        </View>
      ) : null}
    </TapTarget>
  );

  if (photos.length === 1) {
    return tile(front, 0, [styles.photoSingle, tileSize(loneSize)]);
  }
  // Two: the front one against the far edge, the other tilted behind it, so
  // the pair sits flush with the side the message is on.
  const pair = photos.length === 2;
  return (
    <View style={[styles.photoStack, pair && styles.photoStackPair]}>
      {left !== undefined
        ? tile(left, 1, [styles.photo, styles.photoBack, styles.photoLeft])
        : null}
      {right !== undefined
        ? tile(right, 2, [styles.photo, styles.photoBack, styles.photoRight])
        : null}
      {tile(front, 0, [
        styles.photo,
        styles.photoFront,
        pair && styles.photoFrontPair,
      ])}
      {sending ? (
        <View style={styles.sendingSpinner} pointerEvents="none">
          <SendingSpinner />
        </View>
      ) : null}
    </View>
  );
}

/**
 * Over a photo or clip that's still being compressed to send: dimmed, with a
 * spinner unless one's shown over the whole stack.
 */
function Sending({
  styles,
  spinner = true,
}: {
  styles: GroupChatStyles;
  spinner?: boolean;
}) {
  return (
    <View style={styles.sending} pointerEvents="none">
      {spinner ? <SendingSpinner /> : null}
    </View>
  );
}

function SendingSpinner() {
  const { colors } = useTheme();
  return <LogoLoader size="large" color={colors.white} />;
}

/** Taller or wider than this, a lone photo's or a clip's tile is cropped. */
const TILE_MIN_RATIO = 9 / 16;
const TILE_MAX_RATIO = 16 / 9;

interface Size {
  width: number;
  height: number;
}

/**
 * A lone photo's or a clip's own shape, as big as fits the box: tall for a
 * portrait one, wide for a landscape one. Undefined when its size isn't known.
 */
function tileSize(size?: Partial<Size>) {
  if (!size?.width || !size.height) {
    return undefined;
  }
  const ratio = Math.min(
    Math.max(size.width / size.height, TILE_MIN_RATIO),
    TILE_MAX_RATIO,
  );
  const width = Math.min(MEDIA_TILE_MAX_WIDTH, MEDIA_TILE_MAX_HEIGHT * ratio);
  return { width, height: width / ratio };
}

/** Sizes read from photo files, so each file is read once. */
const photoSizes = new Map<string, Size>();

/**
 * A photo's size: given with it, bundled with the app, or read from its file
 * (e.g. while it's still being sent) and remembered. Undefined until known.
 */
function usePhotoSize(photo: ChatPhoto | undefined) {
  const uri = typeof photo === 'object' ? photo.uri : undefined;
  const given =
    typeof photo === 'number'
      ? Image.resolveAssetSource(photo)
      : photo?.width && photo.height
      ? { width: photo.width, height: photo.height }
      : uri
      ? photoSizes.get(uri)
      : undefined;
  const [read, setRead] = useState<Size>();
  const known = given !== undefined;
  useEffect(() => {
    if (known || !uri) {
      return;
    }
    let live = true;
    Image.getSize(
      uri,
      (width, height) => {
        photoSizes.set(uri, { width, height });
        if (live) {
          setRead({ width, height });
        }
      },
      () => {},
    );
    return () => {
      live = false;
    };
  }, [uri, known]);
  return given ?? read;
}

/** A clip: its first frame, a play button and its length. */
function VideoTile({
  video,
  sending,
  styles,
  onOpen,
  doubleTap,
}: {
  video: ChatVideo;
  sending: boolean;
  styles: GroupChatStyles;
  onOpen: () => void;
  doubleTap: TapGesture;
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  return (
    <TapTarget
      doubleTap={doubleTap}
      onTap={onOpen}
      style={[styles.photoSingle, tileSize(video)]}
      label={t('chat.playVideo')}
    >
      {video.posterUri ? (
        <Image source={{ uri: video.posterUri }} style={styles.photoFill} />
      ) : null}
      {sending ? (
        <Sending styles={styles} />
      ) : (
        <View style={styles.videoPlayCentre} pointerEvents="none">
          <View style={styles.videoPlay}>
            <Icon name="play" size={ms(26)} color={colors.white} />
          </View>
        </View>
      )}
      <Text style={styles.videoDuration}>
        {formatDuration(video.durationMs)}
      </Text>
    </TapTarget>
  );
}
