/**
 * The map's style follows the app's theme until the user picks another:
 * dark mode on, the map goes dark, unless they chose Bright or Positron.
 */
import reducer, { setMapStyle, setThemeMode } from '@/store/slices/appSlice';

const initial = reducer(undefined, { type: '@@init' });
const inLight = reducer(initial, setThemeMode('light'));

describe('map style', () => {
  it('follows the theme when none is picked', () => {
    expect(reducer(inLight, setThemeMode('dark')).mapStyle).toBeNull();
  });

  it("treats picking the theme's own style as not picking", () => {
    expect(reducer(inLight, setMapStyle('liberty')).mapStyle).toBeNull();
  });

  it('lets a theme style picked in the other theme follow once it changes', () => {
    const picked = reducer(inLight, setMapStyle('dark'));
    expect(picked.mapStyle).toBe('dark');
    expect(reducer(picked, setThemeMode('dark')).mapStyle).toBeNull();
  });

  it('keeps Bright or Positron whatever the theme', () => {
    const picked = reducer(inLight, setMapStyle('positron'));
    expect(reducer(picked, setThemeMode('dark')).mapStyle).toBe('positron');
  });
});
