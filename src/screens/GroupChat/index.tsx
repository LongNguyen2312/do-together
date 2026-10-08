import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  Keyboard,
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
import { stopVoice } from '@/services/audio';
import { chatMemberIds } from '@/services/chat';
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
} from '@/store/slices/chatSlice';
import { useTheme } from '@/theme';
import {
  ME,
  type ChatDraft,
  type ChatMessage,
  type ChatPhoto,
} from '@/types/chat';
import type { RootStackParamList } from '@/types/navigation';
import { chatTime } from '@/utils/format';

import Composer from './Composer';
import MessageActionSheet from './MessageActionSheet';
import MessageRow from './MessageRow';
import { chatBackground, createStyles } from './styles';

/** A gap this long starts a new time label. */
const TIME_GAP_MS = 10 * 60 * 1000;
/** Consecutive messages closer than this share one name and avatar. */
const GROUP_GAP_MS = 5 * 60 * 1000;
const HIGHLIGHT_MS = 1600;
const noop = () => {};

type Row =
  | { kind: 'time'; key: string; label: string; mine: boolean }
  | {
      kind: 'message';
      key: string;
      message: ChatMessage;
      mine: boolean;
      groupStart: boolean;
      groupEnd: boolean;
    };

function buildRows(messages: readonly ChatMessage[]): Row[] {
  const rows: Row[] = [];
  messages.forEach((message, i) => {
    const prev = messages[i - 1];
    const next = messages[i + 1];
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
    const joinsNext =
      !!next &&
      next.senderId === message.senderId &&
      next.sentAt - message.sentAt < GROUP_GAP_MS;
    rows.push({
      kind: 'message',
      key: message.id,
      message,
      mine,
      groupStart: !joinsPrev || !!message.replyToId,
      groupEnd: !joinsNext || !!next?.replyToId,
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

  const [keyboardShown, setKeyboardShown] = useState(false);
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [menuFor, setMenuFor] = useState<ChatMessage | null>(null);
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const [viewer, setViewer] = useState<{
    photos: ChatPhoto[];
    index: number;
  } | null>(null);

  useEffect(() => {
    dispatch(markRead({ activityId: activity.id, at: Date.now() }));
  }, [thread, activity.id, dispatch]);

  useEffect(() => {
    const show = Keyboard.addListener('keyboardWillShow', () =>
      setKeyboardShown(true),
    );
    const hide = Keyboard.addListener('keyboardWillHide', () =>
      setKeyboardShown(false),
    );
    return () => {
      show.remove();
      hide.remove();
      stopVoice().catch(() => {});
    };
  }, []);

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

  const jumpTo = useCallback(
    (messageId: string) => {
      const index = rows.findIndex(row => row.key === messageId);
      if (index < 0) {
        return;
      }
      listRef.current?.scrollToIndex({ index, viewPosition: 0.5 });
      setHighlightId(messageId);
    },
    [rows],
  );

  const openPhoto = useCallback(
    (photos: ChatPhoto[], index: number) => setViewer({ photos, index }),
    [],
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
      >
        <FlatList
          ref={listRef}
          inverted
          data={rows}
          keyExtractor={row => row.key}
          renderItem={({ item }) =>
            item.kind === 'time' ? (
              <Text
                style={[styles.timeLabel, item.mine && styles.timeLabelMine]}
              >
                {item.label}
              </Text>
            ) : (
              <MessageRow
                message={item.message}
                mine={item.mine}
                groupStart={item.groupStart}
                groupEnd={item.groupEnd}
                quoted={
                  item.message.replyToId
                    ? byId.get(item.message.replyToId)
                    : undefined
                }
                reported={reportedIds.includes(item.message.id)}
                highlighted={highlightId === item.message.id}
                styles={styles}
                onLongPress={ended ? noop : setMenuFor}
                onOpenPhoto={openPhoto}
                onReact={ended ? noop : react}
                onPressQuote={jumpTo}
                memberIds={memberIdSet}
              />
            )
          }
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
            replyTo={replyTo}
            memberIds={memberIds}
            hostId={activity.hostId}
            bottomPadding={
              keyboardShown ? ms(8) : Math.max(insets.bottom, ms(10))
            }
            styles={styles}
            onCancelReply={() => setReplyTo(null)}
            onSend={send}
          />
        )}
      </KeyboardAvoidingView>

      <MessageActionSheet
        message={menuFor}
        reported={!!menuFor && reportedIds.includes(menuFor.id)}
        styles={styles}
        onClose={() => setMenuFor(null)}
        onReact={emoji => {
          if (menuFor) {
            react(menuFor, emoji);
          }
          setMenuFor(null);
        }}
        onReply={() => {
          setReplyTo(menuFor);
          setMenuFor(null);
        }}
        onReport={() => {
          if (menuFor) {
            dispatch(reportMessage(menuFor.id));
          }
          setMenuFor(null);
          Alert.alert(t('chat.reportSentTitle'), t('chat.reportSentMessage'));
        }}
      />

      <PhotoViewer
        photos={viewer?.photos ?? []}
        startIndex={viewer?.index ?? null}
        onClose={() => setViewer(null)}
      />
    </SafeAreaView>
  );
}
