import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import { ME } from '@/types/chat';
import type { Story } from '@/types/story';

interface StoryState {
  /** The user's own stories, oldest first. */
  mine: Story[];
  /** Friend stories the user has opened. */
  seenIds: string[];
}

const initialState: StoryState = {
  mine: [],
  seenIds: [],
};

const storySlice = createSlice({
  name: 'story',
  initialState,
  reducers: {
    postStory: {
      reducer: (state, action: PayloadAction<Story>) => {
        state.mine.push(action.payload);
      },
      prepare: (uri: string) => {
        const postedAt = Date.now();
        return {
          payload: {
            id: `${ME}-${postedAt}`,
            userId: ME,
            photo: { uri },
            postedAt,
          },
        };
      },
    },
    deleteStory: (state, action: PayloadAction<string>) => {
      state.mine = state.mine.filter(story => story.id !== action.payload);
    },
    markStorySeen: (state, action: PayloadAction<string>) => {
      if (!state.seenIds.includes(action.payload)) {
        state.seenIds.push(action.payload);
      }
    },
  },
});

export const { postStory, deleteStory, markStorySeen } = storySlice.actions;
export default storySlice.reducer;
