import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import type { CustomActivity } from '@/types/broadcast';

const MAX_CUSTOM_ACTIVITIES = 8;

interface BroadcastState {
  /** Most recent first. */
  customActivities: CustomActivity[];
}

const initialState: BroadcastState = {
  customActivities: [],
};

const sameName = (a: string, b: string) =>
  a.trim().toLowerCase() === b.trim().toLowerCase();

const broadcastSlice = createSlice({
  name: 'broadcast',
  initialState,
  reducers: {
    /** Saving a name that already exists replaces it and moves it to the front. */
    saveCustomActivity: (state, action: PayloadAction<CustomActivity>) => {
      const rest = state.customActivities.filter(
        item =>
          item.id !== action.payload.id &&
          !sameName(item.name, action.payload.name),
      );
      state.customActivities = [action.payload, ...rest].slice(
        0,
        MAX_CUSTOM_ACTIVITIES,
      );
    },
    removeCustomActivity: (state, action: PayloadAction<string>) => {
      state.customActivities = state.customActivities.filter(
        item => item.id !== action.payload,
      );
    },
  },
});

export const { saveCustomActivity, removeCustomActivity } =
  broadcastSlice.actions;
export default broadcastSlice.reducer;
