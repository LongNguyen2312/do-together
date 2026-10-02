import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import type { LanguageOption } from '@/types/language';
import type { MapStyleId } from '@/types/map';
import type { ThemeMode } from '@/types/theme';

interface AppState {
  /**
   * null = first launch: useI18nSync seeds en/vi from the device once.
   * After that the choice is persisted and no longer follows the system.
   */
  language: LanguageOption['code'] | null;
  /**
   * null = first launch: ThemeProvider seeds light/dark from the device once.
   * After that the choice is persisted and no longer follows the system.
   */
  themeMode: ThemeMode | null;
  hasCompletedOnboarding: boolean;
  /** null = follow the app theme until the user picks a style. */
  mapStyle: MapStyleId | null;
}

const initialState: AppState = {
  language: null,
  themeMode: null,
  hasCompletedOnboarding: false,
  mapStyle: null,
};

const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    setLanguage: (state, action: PayloadAction<LanguageOption['code']>) => {
      state.language = action.payload;
    },
    setThemeMode: (state, action: PayloadAction<ThemeMode>) => {
      state.themeMode = action.payload;
    },
    completeOnboarding: state => {
      state.hasCompletedOnboarding = true;
    },
    resetOnboarding: state => {
      state.hasCompletedOnboarding = false;
    },
    setMapStyle: (state, action: PayloadAction<MapStyleId>) => {
      state.mapStyle = action.payload;
    },
  },
});

export const {
  setLanguage,
  setThemeMode,
  completeOnboarding,
  resetOnboarding,
  setMapStyle,
} = appSlice.actions;
export default appSlice.reducer;
