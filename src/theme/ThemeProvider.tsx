import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from 'react';
import { Appearance, StatusBar } from 'react-native';

import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setThemeMode } from '@/store/slices/appSlice';
import type { AppColors } from '@/theme/colors';
import { darkColors, lightColors } from '@/theme/colors';
import { isThemeMode, type ThemeMode } from '@/types/theme';

interface ThemeContextValue {
  colors: AppColors;
  themeMode: ThemeMode;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextValue>({
  colors: lightColors,
  themeMode: 'light',
  isDark: false,
});

interface ThemeProviderProps {
  children: ReactNode;
}

function themeFromSystem(): ThemeMode {
  return Appearance.getColorScheme() === 'dark' ? 'dark' : 'light';
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const dispatch = useAppDispatch();
  const storedTheme = useAppSelector(state => state.app.themeMode);
  const seededRef = useRef(false);

  // First open: lock in the device theme once, then persist.
  useEffect(() => {
    if (seededRef.current || isThemeMode(storedTheme)) {
      return;
    }
    seededRef.current = true;
    dispatch(setThemeMode(themeFromSystem()));
  }, [dispatch, storedTheme]);

  const themeMode: ThemeMode = isThemeMode(storedTheme)
    ? storedTheme
    : themeFromSystem();
  const isDark = themeMode === 'dark';

  const value = useMemo<ThemeContextValue>(
    () => ({
      colors: isDark ? darkColors : lightColors,
      themeMode,
      isDark,
    }),
    [isDark, themeMode],
  );

  return (
    <ThemeContext.Provider value={value}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
