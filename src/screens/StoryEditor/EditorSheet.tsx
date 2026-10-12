import type { ReactNode } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import {
  isLiquidGlassSupported,
  LiquidGlassView,
} from '@callstack/liquid-glass';
import { useTranslation } from 'react-i18next';
import { ms } from 'react-native-size-matters';
import Icon from 'react-native-vector-icons/Ionicons';

import { useTheme } from '@/theme';

import type { StoryEditorStyles } from './styles';

interface Props {
  visible: boolean;
  title: string;
  subtitle?: string;
  styles: StoryEditorStyles;
  onClose: () => void;
  children: ReactNode;
}

/**
 * A frosted-glass panel sliding up over the editor; tapping above it closes
 * it. Its content runs to the bottom edge and pads itself for the home bar.
 */
export default function EditorSheet({
  visible,
  title,
  subtitle,
  styles,
  onClose,
  children,
}: Props) {
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable
        style={styles.sheetBackdrop}
        onPress={onClose}
        accessible={false}
      >
        {/* Swallows taps, so only the space above the panel closes it. */}
        <Pressable style={styles.sheet} accessible={false}>
          <LiquidGlassView
            effect="regular"
            colorScheme={isDark ? 'dark' : 'light'}
            style={[
              styles.sheetGlass,
              !isLiquidGlassSupported && styles.sheetGlassFallback,
            ]}
          />
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeader}>
            <View style={styles.sheetHeading}>
              <Text style={styles.sheetTitle}>{title}</Text>
              {subtitle ? (
                <Text style={styles.sheetSubtitle}>{subtitle}</Text>
              ) : null}
            </View>
            <Pressable
              onPress={onClose}
              hitSlop={ms(8)}
              style={({ pressed }) => [
                styles.sheetClose,
                pressed && styles.pressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel={t('common.close')}
            >
              <Icon name="close" size={ms(18)} color={colors.text} />
            </Pressable>
          </View>
          {children}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
