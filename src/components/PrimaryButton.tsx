import { useMemo } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { ms } from 'react-native-size-matters';

import { fonts, useTheme, type AppColors } from '@/theme';

interface PrimaryButtonProps {
  title: string;
  onPress: () => void;
  /** Ionicons name rendered before the title. */
  leadingIcon?: string;
  /** Ionicons name rendered after the title. */
  trailingIcon?: string;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
}

export default function PrimaryButton({
  title,
  onPress,
  leadingIcon,
  trailingIcon,
  disabled = false,
  loading = false,
  style,
}: PrimaryButtonProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      style={({ pressed }) => [
        styles.button,
        pressed && styles.pressed,
        disabled && !loading && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={colors.white} />
      ) : (
        <>
          {leadingIcon ? (
            <Icon name={leadingIcon} size={ms(18)} color={colors.white} />
          ) : null}
          <Text style={styles.title}>{title}</Text>
          {trailingIcon ? (
            <Icon name={trailingIcon} size={ms(20)} color={colors.white} />
          ) : null}
        </>
      )}
    </Pressable>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    button: {
      height: ms(56),
      borderRadius: ms(16),
      backgroundColor: colors.primary,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: ms(8),
      shadowColor: colors.primary,
      shadowOpacity: 0.25,
      shadowRadius: ms(10),
      shadowOffset: { width: 0, height: ms(4) },
      elevation: 4,
    },
    pressed: {
      opacity: 0.92,
      transform: [{ scale: 0.98 }],
    },
    disabled: {
      opacity: 0.5,
    },
    title: {
      color: colors.white,
      fontSize: ms(15),
      fontFamily: fonts.semibold,
      letterSpacing: -0.15,
    },
  });
}
