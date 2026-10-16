import { useMemo } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { ms } from 'react-native-size-matters';

import LogoGlyph from '@/components/LogoGlyph';
import { isLogoLetter, kernAfter, LETTER_HEIGHT } from '@/components/logoPath';
import { fonts, fs, useTheme, type AppColors } from '@/theme';

/** The letters' band: script capitals, taller than the rest. */
const LETTER = fs(20.4);
/** As heavy as the bold text beside them. */
const LETTER_WEIGHT = 1.3;
/** Raised off the line's foot so their feet sit on the text's baseline. */
const LETTER_LIFT = fs(4);

/**
 * A heading in the brand's voice: its first letter, when the mark has a hand
 * for it (C, D, P), written in it, so "ComeCrew", "Discover", "Profile" open
 * with the logo's letters. Otherwise ("Khám phá"), the mark stands beside it.
 */
export default function BrandTitle({ text }: { text: string }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const first = text.charAt(0);

  if (!isLogoLetter(first)) {
    return (
      <View style={styles.beside}>
        <Image
          source={require('@/assets/images/logo-mark.png')}
          style={styles.logo}
          tintColor={colors.primary}
          resizeMode="contain"
        />
        <Text style={styles.text} accessibilityRole="header">
          {text}
        </Text>
      </View>
    );
  }

  return (
    <View
      style={styles.written}
      accessible
      accessibilityRole="header"
      accessibilityLabel={text}
    >
      <View
        style={[
          styles.letter,
          // What follows sits where the letter's kerning puts it.
          {
            marginRight:
              (kernAfter(first, text.charAt(1)) * LETTER) / LETTER_HEIGHT,
          },
        ]}
      >
        <LogoGlyph
          letter={first}
          height={LETTER}
          color={colors.primary}
          weight={LETTER_WEIGHT}
        />
      </View>
      <Text style={styles.text}>{text.slice(1)}</Text>
    </View>
  );
}

const createStyles = (colors: AppColors) =>
  StyleSheet.create({
    beside: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: ms(8),
    },
    logo: {
      width: ms(20),
      height: ms(20),
    },
    written: {
      flexDirection: 'row',
      alignItems: 'flex-end',
    },
    letter: {
      marginBottom: LETTER_LIFT,
    },
    text: {
      fontSize: fs(17),
      lineHeight: fs(22),
      fontFamily: fonts.bold,
      letterSpacing: -0.3,
      color: colors.primary,
    },
  });
