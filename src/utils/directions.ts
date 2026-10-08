import { Linking, Platform } from 'react-native';
import type { LngLat } from '@maplibre/maplibre-react-native';

/**
 * Opens turn-by-turn directions to a point: Apple Maps on iOS, Google Maps on
 * Android. Falls back to Google Maps on the web when the app isn't installed.
 */
export async function openDirections([lng, lat]: LngLat, label: string) {
  const destination = `${lat},${lng}`;
  const web = `https://www.google.com/maps/dir/?api=1&destination=${destination}`;
  const native =
    Platform.OS === 'ios'
      ? `https://maps.apple.com/?daddr=${destination}&q=${encodeURIComponent(
          label,
        )}`
      : `google.navigation:q=${destination}`;

  try {
    await Linking.openURL(native);
  } catch {
    await Linking.openURL(web);
  }
}
