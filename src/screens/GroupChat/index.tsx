import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { ms } from 'react-native-size-matters';
import Icon from 'react-native-vector-icons/Ionicons';

import PhotoViewer from '@/components/PhotoViewer';
import VideoViewer from '@/components/VideoViewer';
import { stopVoice } from '@/services/audio';
import { chatMemberIds } from '@/services/chat';
import { prepareChatMedia } from '@/services/media';
import {
  ACTIVITIES,
  activityStatus,
  CATEGORY_EMOJI,
  getActivity,
  getUser,
} from '@/services/mockData';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  markRead,
  reportMessage,
  selectThread,
  sendChatMessage,
  toggleReaction,
  updateMessage,
} from '@/store/slices/chatSlice';
import { useTheme } from '@/theme';
import {
  ME,
  type ChatDraft,
  type ChatMessage,
  type ChatPhoto,
  type ChatPick,
  type ChatVideo,
} from '@/types/chat';
import type { RootStackParamList } from '@/types/navigation';
import { chatTime } from '@/utils/format';

import Composer, { type ComposerHandle } from './Composer';
import MessageActionSheet from './MessageActionSheet';
import MessageReactionMenu, { type MessageFrame } from './MessageReactionMenu';
import MessageRow from './MessageRow';
import { chatBackground, createStyles } from './styles';

/** A gap this long starts a new time label. */
const TIME_GAP_MS = 10 * 60 * 1000;
/** Consecutive messages closer than this share one name and avatar. */
const GROUP_GAP_MS = 5 * 60 * 1000;
const HIGHLIGHT_MS = 1600;
/**
 * Photos compress in a moment; until sending also uploads them (see
 * docs/BACKEND_SPEC.md, 1.3), "sending" shows at least this long so it's
 * seen rather than flickering past.
 */
const MIN_SENDING_MS = 800;
/** Between the field and the keyboard, with it up. */
const KEYBOARD_GAP = ms(8);
const noop = () => {};
const rowKey = (row: Row) => row.key;

type Row =
  | { kind: 'time'; key: string; label: string; mine: boolean }
  | {
      kind: 'message';
      key: string;
      message: ChatMessage;
      mine: boolean;
      groupStart: boolean;
    };

function buildRows(messages: readonly ChatMessage[]): Row[] {
  const rows: Row[] = [];
  messages.forEach((message, i) => {
    const prev = messages[i - 1];
    const mine = message.senderId === ME;
    const newTime = !prev || message.sentAt - prev.sentAt >= TIME_GAP_MS;
    if (newTime) {
      rows.push({
        kind: 'time',
        key: `time-${message.id}`,
        label: chatTime(message.sentAt),
        mine,
      });
    }
    const joinsPrev =
      !newTime &&
      prev.senderId === message.senderId &&
      message.sentAt - prev.sentAt < GROUP_GAP_MS;
    rows.push({
      kind: 'message',
      key: message.id,
      message,
      mine,
      groupStart: !joinsPrev || !!message.replyToId,
    });
  });
  // The list is inverted so it opens at the latest message.
  return rows.reverse();
}

type Props = NativeStackScreenProps<RootStackParamList, 'GroupChat'>;

export default function GroupChatScreen({ navigation, route }: Props) {
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const listRef = useRef<FlatList<Row>>(null);
  const composerRef = useRef<ComposerHandle>(null);

  const activity = getActivity(route.params.activityId) ?? ACTIVITIES[0];
  // After the activity ends the chat stays readable but closed.
  const ended = activityStatus(activity) === 'completed';
  const thread = useAppSelector(state => selectThread(state, activity.id));
  const reportedIds = useAppSelector(state => state.chat.reportedIds);
  const rows = useMemo(() => buildRows(thread), [thread]);
  const byId = useMemo(
    () => new Map(thread.map(message => [message.id, message])),
    [thread],
  );
  const memberIds = useMemo(() => chatMemberIds(activity.id), [activity.id]);
  const memberIdSet = useMemo(() => new Set(memberIds), [memberIds]);
  const memberNames = [
    ...memberIds.map(id => getUser(id).name),
    t('chat.you'),
  ].join(', ');

  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  /** A held message, with where it is: its reactions and actions. */
  const [menu, setMenu] = useState<{
    message: ChatMessage;
    frame: MessageFrame;
  } | null>(null);
  /** A message being reported: the reasons sheet. */
  const [reportFor, setReportFor] = useState<ChatMessage | null>(null);
  const openMenu = useCallback(
    (message: ChatMessage, frame: MessageFrame) => setMenu({ message, frame }),
    [],
  );
  const replyToMessage = useCallback(
    (message: ChatMessage) => setReplyTo(message),
    [],
  );
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const [viewer, setViewer] = useState<{
    photos: ChatPhoto[];
    index: number;
  } | null>(null);

  useEffect(() => {
    dispatch(markRead({ activityId: activity.id, at: Date.now() }));
  }, [thread, activity.id, dispatch]);

  /** Under the field: room for the home indicator, kept with the keyboard up. */
  const composerBottom = Math.max(insets.bottom, ms(10));

  useEffect(
    () => () => {
      stopVoice().catch(() => {});
    },
    [],
  );

  useEffect(() => {
    if (!highlightId) {
      return;
    }
    const timer = setTimeout(() => setHighlightId(null), HIGHLIGHT_MS);
    return () => clearTimeout(timer);
  }, [highlightId]);

  const send = (draft: Omit<ChatDraft, 'replyToId'>) => {
    dispatch(
      sendChatMessage(activity.id, { ...draft, replyToId: replyTo?.id }),
    );
    setReplyTo(null);
  };

  const react = useCallback(
    (message: ChatMessage, emoji: string) =>
      dispatch(
        toggleReaction({
          activityId: activity.id,
          messageId: message.id,
          emoji,
        }),
      ),
    [activity.id, dispatch],
  );

  // Reads the rows through a ref, so a new message doesn't hand every row a
  // new callback (and re-render them all).
  const rowsRef = useRef(rows);
  rowsRef.current = rows;
  const jumpTo = useCallback((messageId: string) => {
    const index = rowsRef.current.findIndex(row => row.key === messageId);
    if (index < 0) {
      return;
    }
    listRef.current?.scrollToIndex({ index, viewPosition: 0.5 });
    setHighlightId(messageId);
  }, []);

  const openPhoto = useCallback(
    (photos: ChatPhoto[], index: number) => setViewer({ photos, index }),
    [],
  );
  const [playing, setPlaying] = useState<ChatVideo | null>(null);
  const openVideo = useCallback((video: ChatVideo) => setPlaying(video), []);

  /**
   * Photos or a clip from the chat gallery: shown in the chat at once, as
   * picked and marked as sending, then swapped for the compressed copies
   * (which are what a server would get).
   */
  const sendMedia = (pick: ChatPick) => {
    const id = dispatch(
      sendChatMessage(activity.id, {
        photos: pick.photos?.map(uri => ({ uri })),
        video: pick.video && { ...pick.video, posterUri: pick.video.uri },
        replyToId: replyTo?.id,
        status: 'sending',
      }),
    );
    setReplyTo(null);
    const ref = { activityId: activity.id, messageId: id };
    Promise.all([
      prepareChatMedia(pick),
      new Promise<void>(resolve => setTimeout(resolve, MIN_SENDING_MS)),
    ]).then(
      ([ready]) =>
        dispatch(
          updateMessage({ ...ref, patch: { ...ready, status: undefined } }),
        ),
      () => dispatch(updateMessage({ ...ref, patch: { status: 'failed' } })),
    );
  };
  // Handed back by the chat gallery: sent once, then cleared.
  const picked = route.params.picked;
  useEffect(() => {
    if (picked) {
      navigation.setParams({ picked: undefined });
      sendMedia(picked);
    }
    // Only for a new pick.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [picked?.key]);

  // Stable, so the screen's own updates (keyboard, reply bar, menus) don't
  // re-render every row.
  const renderRow = useCallback(
    ({ item }: { item: Row }) =>
      item.kind === 'time' ? (
        <Text style={[styles.timeLabel, item.mine && styles.timeLabelMine]}>
          {item.label}
        </Text>
      ) : (
        <MessageRow
          message={item.message}
          mine={item.mine}
          groupStart={item.groupStart}
          quoted={
            item.message.replyToId
              ? byId.get(item.message.replyToId)
              : undefined
          }
          reported={reportedIds.includes(item.message.id)}
          highlighted={highlightId === item.message.id}
          styles={styles}
          onLongPress={openMenu}
          onReply={replyToMessage}
          interactive={!ended}
          onOpenPhoto={openPhoto}
          onOpenVideo={openVideo}
          onReact={ended ? noop : react}
          onPressQuote={jumpTo}
          memberIds={memberIdSet}
        />
      ),
    [
      styles,
      byId,
      reportedIds,
      openMenu,
      replyToMessage,
      highlightId,
      ended,
      openPhoto,
      openVideo,
      react,
      jumpTo,
      memberIdSet,
    ],
  );

  const openInfo = () =>
    navigation.navigate('GroupChatInfo', { activityId: activity.id });

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundImage: chatBackground(colors, isDark) }]}
      edges={['top']}
    >
      <View style={styles.header}>
        <Pressable
          onPress={navigation.goBack}
          hitSlop={6}
          style={({ pressed }) => [
            styles.iconButton,
            pressed && styles.pressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel={t('auth.back')}
        >
          <Icon name="chevron-back" size={ms(22)} color={colors.text} />
        </Pressable>
        <Pressable
          onPress={openInfo}
          style={styles.headerIdentity}
          accessibilityRole="button"
        >
          <View style={styles.headerAvatar}>
            <Text style={styles.headerEmoji}>
              {CATEGORY_EMOJI[activity.category]}
            </Text>
          </View>
          <View style={styles.headerBody}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {activity.title}
            </Text>
            <Text style={styles.headerSubtitle} numberOfLines={1}>
              {memberNames}
            </Text>
          </View>
        </Pressable>
        <Pressable
          onPress={openInfo}
          hitSlop={4}
          style={({ pressed }) => [
            styles.iconButton,
            pressed && styles.pressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel={t('chat.info.title')}
        >
          <Icon name="ellipsis-vertical" size={ms(19)} color={colors.text} />
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        // The field keeps its padding for the home indicator; with the
        // keyboard up that's taken back here, leaving it a small gap above
        // the keys. One movement, the keyboard's, rather than a jump too.
        keyboardVerticalOffset={KEYBOARD_GAP - composerBottom}
      >
        <FlatList
          ref={listRef}
          inverted
          data={rows}
          keyExtractor={rowKey}
          renderItem={renderRow}
          // Enough rows to fill the screen at once, rather than the top
          // ones popping in a batch later.
          initialNumToRender={20}
          maxToRenderPerBatch={12}
          windowSize={11}
          onScrollToIndexFailed={({ index, averageItemLength }) => {
            listRef.current?.scrollToOffset({
              offset: index * averageItemLength,
            });
            setTimeout(
              () =>
                listRef.current?.scrollToIndex({ index, viewPosition: 0.5 }),
              250,
            );
          }}
          contentContainerStyle={styles.list}
          // A tap among the messages puts the sticker panel away.
          onTouchStart={() => composerRef.current?.closeStickers()}
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        />

        {ended ? (
          <View
            style={[
              styles.endedNotice,
              { marginBottom: Math.max(insets.bottom, ms(10)) },
            ]}
          >
            <Icon
              name="lock-closed-outline"
              size={ms(15)}
              color={colors.textSecondary}
            />
            <Text style={styles.endedNoticeText}>{t('chat.endedNotice')}</Text>
          </View>
        ) : (
          <Composer
            ref={composerRef}
            replyTo={replyTo}
            memberIds={memberIds}
            hostId={activity.hostId}
            styles={styles}
            onCancelReply={() => setReplyTo(null)}
            onSend={send}
            onOpenGallery={() =>
              navigation.navigate('ChatGallery', { activityId: activity.id })
            }
            bottomPadding={composerBottom}
          />
        )}
      </KeyboardAvoidingView>

      <MessageReactionMenu
        target={menu}
        mine={menu?.message.senderId === ME}
        reported={!!menu && reportedIds.includes(menu.message.id)}
        styles={styles}
        onClose={() => setMenu(null)}
        onReact={emoji => {
          if (menu) {
            react(menu.message, emoji);
          }
          setMenu(null);
        }}
        onReply={() => {
          setReplyTo(menu?.message ?? null);
          setMenu(null);
        }}
        onReport={() => {
          setReportFor(menu?.message ?? null);
          setMenu(null);
        }}
      />

      {/* Reporting: straight to the reasons. */}
      <MessageActionSheet
        message={reportFor}
        startOn="report"
        reported={!!reportFor && reportedIds.includes(reportFor.id)}
        styles={styles}
        onClose={() => setReportFor(null)}
        onReact={emoji => {
          if (reportFor) {
            react(reportFor, emoji);
          }
          setReportFor(null);
        }}
        onReply={() => {
          setReplyTo(reportFor);
          setReportFor(null);
        }}
        onReport={() => {
          if (reportFor) {
            dispatch(reportMessage(reportFor.id));
          }
          setReportFor(null);
          Alert.alert(t('chat.reportSentTitle'), t('chat.reportSentMessage'));
        }}
      />

      <VideoViewer video={playing} onClose={() => setPlaying(null)} />

      <PhotoViewer
        photos={viewer?.photos ?? []}
        startIndex={viewer?.index ?? null}
        onClose={() => setViewer(null)}
      />
    </SafeAreaView>
  );
}
