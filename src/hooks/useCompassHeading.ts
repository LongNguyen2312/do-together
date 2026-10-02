import { useEffect, useState } from 'react';
import CompassHeading from 'react-native-compass-heading';

/** Minimum change in degrees before the native side reports a new heading. */
const UPDATE_RATE = 3;

/** Device compass heading in degrees from north, or null without a compass. */
export function useCompassHeading() {
  const [heading, setHeading] = useState<number | null>(null);

  useEffect(() => {
    CompassHeading.start(
      UPDATE_RATE,
      ({ heading: value }: { heading: number }) => {
        if (value >= 0) {
          setHeading(value);
        }
      },
    ).catch(() => {});
    return () => {
      CompassHeading.stop().catch(() => {});
    };
  }, []);

  return heading;
}
