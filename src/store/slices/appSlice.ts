import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import type { LanguageOption } from '@/types/language';
import type { MapStyleId } from '@/types/map';
import type { ThemeMode } from '@/types/theme';
import { defaultMapStyle } from '@/utils/mapStyles';

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
  /**
   * null = follow the app theme. Picking the theme's own style (Liberty in
   * light, Dark in dark) keeps it following; only Bright or Positron, or the
   * other theme's style, stick.
   */
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
      // A theme's own map style follows the theme from now on: dark mode on,
      // the map goes dark too.
      if (
        state.mapStyle === defaultMapStyle(true) ||
        state.mapStyle === defaultMapStyle(false)
      ) {
        state.mapStyle = null;
      }
    },
    completeOnboarding: state => {
      state.hasCompletedOnboarding = true;
    },
    resetOnboarding: state => {
      state.hasCompletedOnboarding = false;
    },
    setMapStyle: (state, action: PayloadAction<MapStyleId>) => {
      // The theme's own style is the same as not picking one.
      const isDark = state.themeMode === 'dark';
      state.mapStyle =
        action.payload === defaultMapStyle(isDark) ? null : action.payload;
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
