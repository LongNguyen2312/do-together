import { useMemo, useState, type ReactNode } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputInstance,
  type TextInputProps,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { ms } from 'react-native-size-matters';

import { fonts, useTheme, type AppColors } from '@/theme';

interface FormFieldProps extends TextInputProps {
  label: string;
  /** Ionicons name rendered before the input. */
  icon: string;
  error?: string;
  /** Rendered at the right end of the label row. */
  labelAccessory?: ReactNode;
  inputRef?: React.Ref<TextInputInstance>;
  trailing?: ReactNode;
  /** Rendered under the input when there is no error. */
  footer?: ReactNode;
}

export default function FormField({
  label,
  icon,
  error,
  labelAccessory,
  inputRef,
  trailing,
  footer,
  onFocus,
  onBlur,
  ...inputProps
}: FormFieldProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.field}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        {labelAccessory}
      </View>
      <View
        style={[
          styles.inputWrap,
          focused && styles.inputWrapFocused,
          error ? styles.inputWrapError : null,
        ]}
      >
        <Icon
          name={icon}
          size={ms(20)}
          color={colors.textSecondary}
          style={styles.inputIcon}
        />
        <TextInput
          ref={inputRef}
          style={styles.input}
          placeholderTextColor={colors.textMuted}
          selectionColor={colors.primary}
          accessibilityLabel={label}
          onFocus={event => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={event => {
            setFocused(false);
            onBlur?.(event);
          }}
          {...inputProps}
        />
        {trailing}
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : footer}
    </View>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    field: {
      gap: ms(4),
    },
    labelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    label: {
      fontSize: ms(13),
      lineHeight: ms(16),
      fontFamily: fonts.semibold,
      color: colors.textWarm,
    },
    inputWrap: {
      height: ms(48),
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: ms(12),
      borderWidth: 1,
      borderColor: 'transparent',
      backgroundColor: colors.card,
      shadowColor: colors.black,
      shadowOpacity: 0.05,
      shadowRadius: ms(3),
      shadowOffset: { width: 0, height: ms(1) },
      elevation: 1,
    },
    inputWrapFocused: {
      borderColor: colors.primarySoft,
    },
    inputWrapError: {
      borderColor: colors.danger,
    },
    inputIcon: {
      marginLeft: ms(14),
      marginRight: ms(8),
    },
    input: {
      flex: 1,
      height: '100%',
      paddingRight: ms(14),
      fontSize: ms(14),
      fontFamily: fonts.regular,
      color: colors.text,
    },
    errorText: {
      fontSize: ms(12),
      fontFamily: fonts.regular,
      lineHeight: ms(16),
      color: colors.danger,
    },
  });
}
