import { useMemo, type ReactNode } from 'react';
import {
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { ms } from 'react-native-size-matters';

import { fonts, useTheme, type AppColors } from '@/theme';

interface SocialAuthGroupProps {
  dividerLabel: string;
  googleLabel: string;
  appleLabel: string;
  onGooglePress: () => void;
  onApplePress: () => void;
  disabled?: boolean;
  /** Lays the buttons out side by side; labels should be short. */
  horizontal?: boolean;
}

/** "or continue with" divider followed by Google and (iOS only) Apple buttons. */
export default function SocialAuthGroup({
  dividerLabel,
  googleLabel,
  appleLabel,
  onGooglePress,
  onApplePress,
  disabled,
  horizontal = false,
}: SocialAuthGroupProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const renderButton = (
    label: string,
    icon: ReactNode,
    onPress: () => void,
  ) => (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.button,
        horizontal && styles.buttonHorizontal,
        pressed && styles.buttonPressed,
      ]}
    >
      {icon}
      <Text style={styles.buttonText}>{label}</Text>
    </Pressable>
  );

  return (
    <>
      <View style={styles.dividerRow}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>{dividerLabel}</Text>
        <View style={styles.dividerLine} />
      </View>

      <View style={[styles.group, horizontal && styles.groupHorizontal]}>
        {renderButton(
          googleLabel,
          <Image
            source={require('@/assets/images/login/google-g.png')}
            style={styles.icon}
            resizeMode="contain"
          />,
          onGooglePress,
        )}
        {Platform.OS === 'ios'
          ? renderButton(
              appleLabel,
              <Icon name="logo-apple" size={ms(20)} color={colors.text} />,
              onApplePress,
            )
          : null}
      </View>
    </>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    dividerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: ms(12),
      marginVertical: ms(18),
    },
    dividerLine: {
      flex: 1,
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.border,
    },
    dividerText: {
      fontSize: ms(11),
      lineHeight: ms(14),
      fontFamily: fonts.semibold,
      letterSpacing: 0.2,
      color: colors.textSecondary,
    },
    group: {
      gap: ms(10),
    },
    groupHorizontal: {
      flexDirection: 'row',
    },
    buttonHorizontal: {
      flex: 1,
    },
    button: {
      height: ms(48),
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: ms(12),
      borderRadius: ms(12),
      backgroundColor: colors.card,
      shadowColor: colors.black,
      shadowOpacity: 0.05,
      shadowRadius: ms(3),
      shadowOffset: { width: 0, height: ms(1) },
      elevation: 1,
    },
    buttonPressed: {
      backgroundColor: colors.surface,
      transform: [{ scale: 0.99 }],
    },
    icon: {
      width: ms(20),
      height: ms(20),
    },
    buttonText: {
      fontSize: ms(15),
      lineHeight: ms(20),
      fontFamily: fonts.semibold,
      letterSpacing: -0.15,
      color: colors.text,
    },
  });
}
