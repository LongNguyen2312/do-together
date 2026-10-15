import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import { ME } from '@/types/chat';
import type { Story, StoryDraft, StoryReply } from '@/types/story';

interface StoryState {
  /** The user's own stories, oldest first. */
  mine: Story[];
  /** Friend stories the user has opened. */
  seenIds: string[];
  /** Replies and reactions the user sent, until there are direct messages. */
  replies: StoryReply[];
  /**
   * The user's own stories pinned to their profile, in the order pinned;
   * they stay there after the day is up.
   */
  pinnedIds: string[];
  /** What shows under a pinned story on the profile; '' is nothing, none its day. */
  pinnedTitles: Record<string, string>;
}

const initialState: StoryState = {
  mine: [],
  seenIds: [],
  replies: [],
  pinnedIds: [],
  pinnedTitles: {},
};

const storySlice = createSlice({
  name: 'story',
  initialState,
  reducers: {
    postStory: {
      reducer: (state, action: PayloadAction<Story>) => {
        state.mine.push(action.payload);
      },
      prepare: (draft: StoryDraft) => {
        const postedAt = Date.now();
        return {
          payload: { ...draft, id: `${ME}-${postedAt}`, userId: ME, postedAt },
        };
      },
    },
    deleteStory: (state, action: PayloadAction<string>) => {
      state.mine = state.mine.filter(story => story.id !== action.payload);
      state.pinnedIds = state.pinnedIds.filter(id => id !== action.payload);
      delete state.pinnedTitles[action.payload];
    },
    togglePinStory: (state, action: PayloadAction<string>) => {
      if (state.pinnedIds.includes(action.payload)) {
        state.pinnedIds = state.pinnedIds.filter(id => id !== action.payload);
        delete state.pinnedTitles[action.payload];
      } else {
        state.pinnedIds.push(action.payload);
      }
    },
    setPinnedTitle: (
      state,
      action: PayloadAction<{ id: string; title: string }>,
    ) => {
      if (state.pinnedIds.includes(action.payload.id)) {
        state.pinnedTitles[action.payload.id] = action.payload.title;
      }
    },
    markStorySeen: (state, action: PayloadAction<string>) => {
      if (!state.seenIds.includes(action.payload)) {
        state.seenIds.push(action.payload);
      }
    },
    replyToStory: {
      reducer: (state, action: PayloadAction<StoryReply>) => {
        state.replies.push(action.payload);
      },
      prepare: (
        reply: Pick<StoryReply, 'storyId' | 'toUserId' | 'text' | 'emoji'>,
      ) => {
        const sentAt = Date.now();
        return {
          payload: { ...reply, id: `${reply.storyId}-${sentAt}`, sentAt },
        };
      },
    },
  },
});

export const {
  postStory,
  deleteStory,
  togglePinStory,
  setPinnedTitle,
  markStorySeen,
  replyToStory,
} = storySlice.actions;
export default storySlice.reducer;
