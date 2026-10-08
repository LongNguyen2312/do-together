import { useEffect, useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ms } from 'react-native-size-matters';
import Icon from 'react-native-vector-icons/Ionicons';

import { useTheme } from '@/theme';
import { ME, type ChatMessage, type ReportReason } from '@/types/chat';

import { useMessagePreview, useSenderName } from './MessageRow';
import type { GroupChatStyles } from './styles';

export const QUICK_REACTIONS = ['❤️', '😂', '😮', '😢', '🔥', '👍'];
const REPORT_REASONS: ReportReason[] = [
  'spam',
  'harassment',
  'inappropriate',
  'scam',
  'other',
];

interface Props {
  /** Null keeps the sheet closed. */
  message: ChatMessage | null;
  reported: boolean;
  styles: GroupChatStyles;
  onClose: () => void;
  onReact: (emoji: string) => void;
  onReply: () => void;
  onReport: (reason: ReportReason) => void;
}

/** Long-press menu: quick reactions, reply and report. */
export default function MessageActionSheet({
  message,
  reported,
  styles,
  onClose,
  onReact,
  onReply,
  onReport,
}: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const preview = useMessagePreview();
  const senderName = useSenderName();
  const [step, setStep] = useState<'actions' | 'report'>('actions');
  const [reason, setReason] = useState<ReportReason | null>(null);

  useEffect(() => {
    if (message) {
      setStep('actions');
      setReason(null);
    }
  }, [message]);

  const mine = message?.senderId === ME;
  const myReaction = message?.reactions?.find(item => item.mine)?.emoji;

  return (
    <Modal
      visible={!!message}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Pressable
        style={styles.sheetBackdrop}
        onPress={onClose}
        accessibilityLabel={t('common.cancel')}
      />
      <View
        style={[
          styles.sheet,
          { paddingBottom: Math.max(insets.bottom, ms(16)) },
        ]}
      >
        <View style={styles.sheetHandle} />
        {message && step === 'actions' ? (
          <>
            <View style={styles.sheetPreview}>
              <Text style={styles.sheetPreviewName} numberOfLines={1}>
                {senderName(message.senderId)}
              </Text>
              <Text style={styles.sheetPreviewText} numberOfLines={2}>
                {preview(message)}
              </Text>
            </View>
            <View style={styles.quickReactions}>
              {QUICK_REACTIONS.map(emoji => (
                <Pressable
                  key={emoji}
                  onPress={() => onReact(emoji)}
                  style={({ pressed }) => [
                    styles.quickReaction,
                    emoji === myReaction && styles.quickReactionActive,
                    pressed && styles.pressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: emoji === myReaction }}
                >
                  <Text style={styles.quickReactionEmoji}>{emoji}</Text>
                </Pressable>
              ))}
            </View>
            <SheetAction
              icon="arrow-undo-outline"
              label={t('chat.reply')}
              onPress={onReply}
              styles={styles}
              color={colors.text}
            />
            {mine ? null : reported ? (
              <SheetAction
                icon="flag"
                label={t('chat.reported')}
                styles={styles}
                color={colors.textMuted}
              />
            ) : (
              <SheetAction
                icon="flag-outline"
                label={t('chat.report')}
                onPress={() => setStep('report')}
                styles={styles}
                color={colors.danger}
              />
            )}
          </>
        ) : null}

        {message && step === 'report' ? (
          <>
            <View style={styles.reportHeader}>
              <Pressable
                onPress={() => setStep('actions')}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={t('auth.back')}
              >
                <Icon name="chevron-back" size={ms(20)} color={colors.text} />
              </Pressable>
              <Text style={styles.reportTitle}>{t('chat.reportTitle')}</Text>
            </View>
            <Text style={styles.reportSubtitle}>
              {t('chat.reportSubtitle', {
                name: senderName(message.senderId),
              })}
            </Text>
            {REPORT_REASONS.map(item => (
              <Pressable
                key={item}
                onPress={() => setReason(item)}
                style={({ pressed }) => [
                  styles.reasonRow,
                  pressed && styles.pressed,
                ]}
                accessibilityRole="radio"
                accessibilityState={{ checked: reason === item }}
              >
                <Text style={styles.reasonText}>
                  {t(`chat.reasons.${item}`)}
                </Text>
                <Icon
                  name={
                    reason === item ? 'radio-button-on' : 'radio-button-off'
                  }
                  size={ms(20)}
                  color={reason === item ? colors.danger : colors.textMuted}
                />
              </Pressable>
            ))}
            <Pressable
              onPress={() => reason && onReport(reason)}
              disabled={!reason}
              style={({ pressed }) => [
                styles.reportButton,
                !reason && styles.reportButtonDisabled,
                pressed && styles.pressed,
              ]}
              accessibilityRole="button"
              accessibilityState={{ disabled: !reason }}
            >
              <Text style={styles.reportButtonText}>
                {t('chat.sendReport')}
              </Text>
            </Pressable>
          </>
        ) : null}
      </View>
    </Modal>
  );
}

function SheetAction({
  icon,
  label,
  onPress,
  color,
  styles,
}: {
  icon: string;
  label: string;
  onPress?: () => void;
  color: string;
  styles: GroupChatStyles;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [styles.sheetAction, pressed && styles.pressed]}
      accessibilityRole="button"
    >
      <Icon name={icon} size={ms(20)} color={color} />
      <Text style={[styles.sheetActionText, { color }]}>{label}</Text>
    </Pressable>
  );
}
