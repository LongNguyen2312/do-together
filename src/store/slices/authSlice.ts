import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import type { CustomActivity } from '@/types/broadcast';
import type { ProfileChanges, UserProfile } from '@/types/user';

interface AuthState {
  isAuthenticated: boolean;
  user: UserProfile | null;
  /**
   * Interests the user has made, kept on the device whether picked or not,
   * so they're there to pick again next time.
   */
  savedInterests: CustomActivity[];
}

const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  savedInterests: [],
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<UserProfile>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
    },
    updateProfile: (state, action: PayloadAction<ProfileChanges>) => {
      if (state.user) {
        Object.assign(state.user, action.payload);
      }
    },
    saveInterest: (state, action: PayloadAction<CustomActivity>) => {
      if (!state.savedInterests.some(item => item.id === action.payload.id)) {
        state.savedInterests.push(action.payload);
      }
    },
    /** Gone for good: off the device's list and off the profile. */
    forgetInterest: (state, action: PayloadAction<string>) => {
      state.savedInterests = state.savedInterests.filter(
        item => item.id !== action.payload,
      );
      if (state.user?.customInterests) {
        state.user.customInterests = state.user.customInterests.filter(
          item => item.id !== action.payload,
        );
      }
    },
    clearUser: state => {
      state.user = null;
      state.isAuthenticated = false;
    },
  },
});

export const {
  setUser,
  updateProfile,
  saveInterest,
  forgetInterest,
  clearUser,
} = authSlice.actions;
export default authSlice.reducer;
