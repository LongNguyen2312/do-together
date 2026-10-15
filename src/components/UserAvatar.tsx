import { useMemo } from 'react';
import {
  Image,
  StyleSheet,
  Text,
  View,
  type ImageSourcePropType,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

import { fonts, useTheme, type AppColors } from '@/theme';
import { initialsOf } from '@/utils/format';

interface Props {
  size: number;
  name: string;
  /** Their photo; without one, their initials on the brand colour. */
  uri?: string;
  /** Someone else's photo, as the mock data has it. */
  source?: ImageSourcePropType;
}

/** A person's picture, the signed-in user's wherever it shows. */
export default function UserAvatar({ size, name, uri, source }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const round = { width: size, height: size, borderRadius: size / 2 };

  const initials = initialsOf(name);
  const photo = uri ? { uri } : source;
  return photo ? (
    <Image source={photo} style={[styles.photo, round]} />
  ) : (
    // No name yet either: just a figure.
    <View style={[styles.initials, round]}>
      {initials ? (
        <Text style={[styles.initialsText, { fontSize: size * 0.36 }]}>
          {initials}
        </Text>
      ) : (
        <Icon name="person" size={size * 0.46} color={colors.white} />
      )}
    </View>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    photo: {
      backgroundColor: colors.surfaceHigh,
    },
    initials: {
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primaryDark,
    },
    initialsText: {
      fontFamily: fonts.bold,
      color: colors.white,
    },
  });
}
