import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ms } from 'react-native-size-matters';
import Icon from 'react-native-vector-icons/Ionicons';

import { fonts, fs, useTheme, type AppColors } from '@/theme';

const ICON_SIZE = ms(64);

export interface ConfirmOptions {
  /** Ionicons name. */
  icon: string;
  title: string;
  message: string;
  /** A small card under the message, e.g. the activity that clashes. */
  highlight?: { emoji?: string; title: string; subtitle: string };
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void;
  /** Also runs when the dialog is dismissed from outside. */
  onCancel?: () => void;
}

type Confirm = (options: ConfirmOptions) => void;

const ConfirmContext = createContext<Confirm | null>(null);

/** Opens the app's confirm dialog; needs ConfirmProvider above it. */
export function useConfirm(): Confirm {
  const confirm = useContext(ConfirmContext);
  if (!confirm) {
    throw new Error('useConfirm must be used inside ConfirmProvider');
  }
  return confirm;
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const confirm = useCallback<Confirm>(next => setOptions(next), []);

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <ConfirmDialog
        options={options}
        onClose={() => setOptions(null)}
        onCancel={() => {
          options?.onCancel?.();
          setOptions(null);
        }}
      />
    </ConfirmContext.Provider>
  );
}

function ConfirmDialog({
  options,
  onClose,
  onCancel,
}: {
  options: ConfirmOptions | null;
  onClose: () => void;
  onCancel: () => void;
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const confirm = () => {
    onClose();
    options?.onConfirm();
  };

  return (
    <Modal
      visible={!!options}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onCancel}
    >
      <View style={styles.backdrop}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onCancel}
          accessibilityRole="button"
          accessibilityLabel={options?.cancelLabel ?? t('common.cancel')}
        />
        {options ? (
          <View style={styles.card} accessibilityViewIsModal>
            <View style={styles.iconHalo}>
              <View style={styles.icon}>
                <Icon name={options.icon} size={ms(30)} color={colors.white} />
              </View>
            </View>

            <Text style={styles.title}>{options.title}</Text>
            <Text style={styles.message}>{options.message}</Text>

            {options.highlight ? (
              <View style={styles.highlight}>
                {options.highlight.emoji ? (
                  <View style={styles.highlightEmojiBox}>
                    <Text style={styles.highlightEmoji}>
                      {options.highlight.emoji}
                    </Text>
                  </View>
                ) : null}
                <View style={styles.highlightBody}>
                  <Text style={styles.highlightTitle} numberOfLines={1}>
                    {options.highlight.title}
                  </Text>
                  <View style={styles.highlightRow}>
                    <Icon
                      name="time-outline"
                      size={ms(13)}
                      color={colors.primary}
                    />
                    <Text style={styles.highlightSubtitle} numberOfLines={1}>
                      {options.highlight.subtitle}
                    </Text>
                  </View>
                </View>
              </View>
            ) : null}

            <View style={styles.actions}>
              <Pressable
                onPress={onCancel}
                style={({ pressed }) => [
                  styles.button,
                  styles.cancelButton,
                  pressed && styles.pressed,
                ]}
                accessibilityRole="button"
              >
                <Text style={styles.cancelText} numberOfLines={1}>
                  {options.cancelLabel ?? t('common.cancel')}
                </Text>
              </Pressable>
              <Pressable
                onPress={confirm}
                style={({ pressed }) => [
                  styles.button,
                  styles.confirmButton,
                  pressed && styles.pressed,
                ]}
                accessibilityRole="button"
              >
                <Text style={styles.confirmText} numberOfLines={1}>
                  {options.confirmLabel}
                </Text>
              </Pressable>
            </View>
          </View>
        ) : null}
      </View>
    </Modal>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    backdrop: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: ms(28),
      backgroundColor: 'rgba(0, 0, 0, 0.45)',
    },
    card: {
      width: '100%',
      maxWidth: ms(360),
      alignItems: 'center',
      paddingTop: ms(28),
      paddingHorizontal: ms(22),
      paddingBottom: ms(18),
      borderRadius: ms(28),
      backgroundColor: colors.card,
      shadowColor: colors.black,
      shadowOpacity: 0.2,
      shadowRadius: ms(24),
      shadowOffset: { width: 0, height: ms(12) },
      elevation: 12,
    },
    iconHalo: {
      padding: ms(8),
      marginBottom: ms(16),
      borderRadius: ms(999),
      backgroundColor: colors.primarySoft,
    },
    icon: {
      width: ICON_SIZE,
      height: ICON_SIZE,
      borderRadius: ICON_SIZE / 2,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primary,
    },
    title: {
      fontSize: fs(19),
      lineHeight: fs(25),
      fontFamily: fonts.bold,
      letterSpacing: -0.3,
      textAlign: 'center',
      color: colors.text,
    },
    message: {
      marginTop: ms(8),
      fontSize: fs(14),
      lineHeight: fs(20),
      fontFamily: fonts.regular,
      textAlign: 'center',
      color: colors.textSecondary,
    },
    highlight: {
      alignSelf: 'stretch',
      flexDirection: 'row',
      alignItems: 'center',
      gap: ms(12),
      marginTop: ms(18),
      padding: ms(12),
      borderRadius: ms(16),
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    highlightEmojiBox: {
      width: ms(42),
      height: ms(42),
      borderRadius: ms(12),
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.card,
    },
    highlightEmoji: {
      fontSize: fs(20),
    },
    highlightBody: {
      flex: 1,
      gap: ms(3),
    },
    highlightTitle: {
      fontSize: fs(14),
      lineHeight: fs(19),
      fontFamily: fonts.semibold,
      color: colors.text,
    },
    highlightRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: ms(4),
    },
    highlightSubtitle: {
      flexShrink: 1,
      fontSize: fs(12.5),
      fontFamily: fonts.medium,
      color: colors.primary,
    },
    actions: {
      alignSelf: 'stretch',
      flexDirection: 'row',
      gap: ms(10),
      marginTop: ms(22),
    },
    button: {
      flex: 1,
      height: ms(50),
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: ms(10),
      borderRadius: ms(16),
    },
    confirmButton: {
      backgroundColor: colors.primary,
    },
    confirmText: {
      fontSize: fs(15),
      fontFamily: fonts.semibold,
      color: colors.white,
    },
    cancelButton: {
      backgroundColor: colors.surfaceMuted,
    },
    cancelText: {
      fontSize: fs(15),
      fontFamily: fonts.semibold,
      color: colors.text,
    },
    pressed: {
      opacity: 0.8,
    },
  });
}
