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
  /**
   * When the user cleared each chat (epoch ms): messages up to then are gone
   * for them, though they're still in the group and get what comes next.
   */
  clearedAt: Record<string, number>;
  /** Groups the user left: off their list until they join or open it again. */
  leftIds: string[];
}

const initialState: ChatState = {
  threads: {},
  lastReadAt: {},
  mutedIds: [],
  reportedIds: [],
  clearedAt: {},
  leftIds: [],
};

type MessageRef = { activityId: string; messageId: string };

// Copies of the seed, not the cached messages themselves: a change makes a new
// message (so its row re-renders) and the cache stays as it was.
const ensureThread = (state: ChatState, activityId: string) =>
  (state.threads[activityId] ??= seedAfterClear(state, activityId).map(
    message => ({
      ...message,
      reactions: message.reactions?.map(reaction => ({ ...reaction })),
    }),
  ));

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    addMessage: (
      state,
      action: PayloadAction<{ activityId: string; message: ChatMessage }>,
    ) => {
      const { activityId, message } = action.payload;
      ensureThread(state, activityId).push(message);
    },
    /** Changes a sent message, e.g. once its media is compressed. */
    updateMessage: (
      state,
      action: PayloadAction<MessageRef & { patch: Partial<ChatMessage> }>,
    ) => {
      const { activityId, messageId, patch } = action.payload;
      const message = ensureThread(state, activityId).find(
        item => item.id === messageId,
      );
      if (message) {
        Object.assign(message, patch);
      }
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
    /**
     * Clears the chat's messages and history on the user's side only: they
     * stay in the group, it stays on their list, and new messages show.
     */
    deleteChat: (state, action: PayloadAction<string>) => {
      state.threads[action.payload] = [];
      state.clearedAt[action.payload] = Date.now();
    },
    leaveChat: (state, action: PayloadAction<string>) => {
      if (!state.leftIds.includes(action.payload)) {
        state.leftIds.push(action.payload);
      }
      state.mutedIds = state.mutedIds.filter(id => id !== action.payload);
    },
    /** Back in a group they'd left, e.g. on joining its community again. */
    rejoinChat: (state, action: PayloadAction<string>) => {
      state.leftIds = state.leftIds.filter(id => id !== action.payload);
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
  updateMessage,
  toggleReaction,
  reportMessage,
  markRead,
  toggleMute,
  deleteChat,
  leaveChat,
  rejoinChat,
} = chatSlice.actions;
export default chatSlice.reducer;

/** Seed threads past a clear, kept so the same clear gives the same array. */
const clearedSeeds = new Map<string, ChatMessage[]>();

/** A chat's starting messages, less any from before the user cleared it. */
function seedAfterClear(chat: ChatState, activityId: string) {
  const seed = seedThread(activityId).messages;
  const cleared = chat.clearedAt[activityId];
  if (!cleared) {
    return seed;
  }
  const key = `${activityId}@${cleared}`;
  let kept = clearedSeeds.get(key);
  if (!kept) {
    kept = seed.filter(message => message.sentAt > cleared);
    clearedSeeds.set(key, kept);
  }
  return kept;
}

export const threadIn = (chat: ChatState, activityId: string) =>
  chat.threads[activityId] ?? seedAfterClear(chat, activityId);

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

/** Sends a message; returns its id. */
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
    return id;
  };

export const receiveChatMessage =
  (activityId: string) => (dispatch: AppDispatch) => {
    const message = memberMessage(activityId, 'incoming');
    if (message) {
      dispatch(addMessage({ activityId, message }));
    }
  };
