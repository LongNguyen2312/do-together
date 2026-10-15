import { useRef, type ReactNode } from 'react';
import { Modal, Platform, Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/theme';

import { SHEET_BOTTOM, type ProfileStyles } from './styles';

export interface SheetOption<Id extends string> {
  id: Id;
  icon: ReactNode;
  label: string;
  /** Undoes something, e.g. unfriending: in the warning colour. */
  danger?: boolean;
}

interface Props<Id extends string> {
  visible: boolean;
  options: readonly SheetOption<Id>[];
  styles: ProfileStyles;
  onClose: () => void;
  /** Once the sheet's gone, so what it opens doesn't meet it on the way out. */
  onPick: (id: Id) => void;
}

/** A few choices sliding up from the bottom, e.g. tapping the profile photo. */
export default function OptionSheet<Id extends string>({
  visible,
  options,
  styles,
  onClose,
  onPick,
}: Props<Id>) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  /** Picked, waiting for the sheet to close (iOS tells us when). */
  const picked = useRef<Id | null>(null);

  const pick = (id: Id) => {
    if (Platform.OS === 'ios') {
      picked.current = id;
      onClose();
    } else {
      onClose();
      onPick(id);
    }
  };

  const onDismiss = () => {
    const id = picked.current;
    picked.current = null;
    if (id) {
      onPick(id);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
      onDismiss={onDismiss}
    >
      <Pressable
        style={styles.sheetBackdrop}
        onPress={onClose}
        accessibilityLabel={t('common.cancel')}
      />
      <View
        style={[styles.sheet, { paddingBottom: insets.bottom + SHEET_BOTTOM }]}
      >
        <View style={styles.sheetHandle} />
        {options.map((option, index) => (
          <Pressable
            key={option.id}
            onPress={() => pick(option.id)}
            style={({ pressed }) => [
              styles.sheetAction,
              index > 0 && styles.sheetActionDivided,
              pressed && styles.pressed,
            ]}
            accessibilityRole="button"
          >
            {option.icon}
            <Text
              style={[
                styles.sheetActionText,
                option.danger && { color: colors.danger },
              ]}
            >
              {option.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </Modal>
  );
}
