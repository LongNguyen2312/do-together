import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import { memberMessage, newMessageId, seedThread } from '@/services/chat';
import type { AppDispatch, RootState } from '@/store';
import { ME, type ChatDraft, type ChatMessage } from '@/types/chat';

/** Simulated delay before a member answers, until realtime exists. */
const REPLY_MS = 2500;

export interface ChatState {
  /** Threads touched this session; the rest fall back to their seed. */
  threads: Record<string, ChatMessage[]>;
  /** Epoch ms when each thread was last seen. */
  lastReadAt: Record<string, number>;
  /** Group chats with notifications turned off. */
  mutedIds: string[];
  /** Messages the user reported this session. */
  reportedIds: string[];
}

const initialState: ChatState = {
  threads: {},
  lastReadAt: {},
  mutedIds: [],
  reportedIds: [],
};

type MessageRef = { activityId: string; messageId: string };

const ensureThread = (state: ChatState, activityId: string) =>
  (state.threads[activityId] ??= [...seedThread(activityId).messages]);

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    addMessage: (
      state,
      action: PayloadAction<{ activityId: string; message: ChatMessage }>,
    ) => {
      ensureThread(state, action.payload.activityId).push(
        action.payload.message,
      );
    },
    /** One reaction per person: picking another emoji moves it. */
    toggleReaction: (
      state,
      action: PayloadAction<MessageRef & { emoji: string }>,
    ) => {
      const { activityId, messageId, emoji } = action.payload;
      const message = ensureThread(state, activityId).find(
        item => item.id === messageId,
      );
      if (!message) {
        return;
      }
      const reactions = message.reactions ?? [];
      const previous = reactions.find(reaction => reaction.mine);
      if (previous) {
        previous.count -= 1;
        previous.mine = false;
      }
      if (previous?.emoji !== emoji) {
        const target = reactions.find(reaction => reaction.emoji === emoji);
        if (target) {
          target.count += 1;
          target.mine = true;
        } else {
          reactions.push({ emoji, count: 1, mine: true });
        }
      }
      message.reactions = reactions.filter(reaction => reaction.count > 0);
    },
    reportMessage: (state, action: PayloadAction<string>) => {
      if (!state.reportedIds.includes(action.payload)) {
        state.reportedIds.push(action.payload);
      }
    },
    markRead: (
      state,
      action: PayloadAction<{ activityId: string; at: number }>,
    ) => {
      state.lastReadAt[action.payload.activityId] = action.payload.at;
    },
    toggleMute: (state, action: PayloadAction<string>) => {
      const ids = state.mutedIds;
      state.mutedIds = ids.includes(action.payload)
        ? ids.filter(id => id !== action.payload)
        : [...ids, action.payload];
    },
  },
});

export const {
  addMessage,
  toggleReaction,
  reportMessage,
  markRead,
  toggleMute,
} = chatSlice.actions;
export default chatSlice.reducer;

export const threadIn = (chat: ChatState, activityId: string) =>
  chat.threads[activityId] ?? seedThread(activityId).messages;

export function unreadCountIn(chat: ChatState, activityId: string) {
  const readAt =
    chat.lastReadAt[activityId] ?? seedThread(activityId).readUntil;
  return threadIn(chat, activityId).filter(
    message => message.senderId !== ME && message.sentAt > readAt,
  ).length;
}

export const selectThread = (state: RootState, activityId: string) =>
  threadIn(state.chat, activityId);

export const selectUnreadCount = (state: RootState, activityId: string) =>
  unreadCountIn(state.chat, activityId);

export const sendChatMessage =
  (activityId: string, draft: ChatDraft) => (dispatch: AppDispatch) => {
    const id = newMessageId();
    dispatch(
      addMessage({
        activityId,
        message: { ...draft, id, senderId: ME, sentAt: Date.now() },
      }),
    );
    setTimeout(() => {
      const reply = memberMessage(
        activityId,
        'reply',
        Math.random() < 0.5 ? id : undefined,
      );
      if (reply) {
        dispatch(addMessage({ activityId, message: reply }));
      }
    }, REPLY_MS);
  };

export const receiveChatMessage =
  (activityId: string) => (dispatch: AppDispatch) => {
    const message = memberMessage(activityId, 'incoming');
    if (message) {
      dispatch(addMessage({ activityId, message }));
    }
  };
