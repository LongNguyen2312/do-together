import { ms } from 'react-native-size-matters';

export const typography = {
  title: ms(24),
  subtitle: ms(16),
  body: ms(14),
  caption: ms(12),
};

/** Font size that grows less than layout on large screens. */
export const fs = (size: number) => ms(size, 0.25);
