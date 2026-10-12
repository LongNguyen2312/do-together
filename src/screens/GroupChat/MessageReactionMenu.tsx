import { Modal, Pressable, Text, useWindowDimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
import Animated, {
  Easing,
  FadeIn,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ms } from 'react-native-size-matters';
import Icon from 'react-native-vector-icons/Ionicons';

import { useTheme } from '@/theme';
import type { ChatMessage } from '@/types/chat';

import { QUICK_REACTIONS } from './MessageActionSheet';
import {
  REACTION_BAR_HEIGHT,
  REACTION_BAR_WIDTH,
  type GroupChatStyles,
} from './styles';

/** Where a message is on screen, in window points. */
export interface MessageFrame {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Pops up once, a touch past full size, and settles: no spring. */
const popIn = () => {
  'worklet';
  return {
    initialValues: { opacity: 0, transform: [{ scale: 0.7 }] },
    animations: {
      opacity: withTiming(1, { duration: 120 }),
      transform: [
        {
          scale: withSequence(
            withTiming(1.06, {
              duration: 150,
              easing: Easing.out(Easing.quad),
            }),
            withTiming(1, { duration: 100, easing: Easing.inOut(Easing.quad) }),
          ),
        },
      ],
    },
  };
};

/** Between the message and the bar or the card. */
const GAP = ms(8);
/** Kept clear of the screen's edges. */
const EDGE = ms(10);
const ACTION_HEIGHT = ms(46);
const CARD_WIDTH = ms(200);

interface Props {
  /** The held message and where it is; null keeps the menu closed. */
  target: { message: ChatMessage; frame: MessageFrame } | null;
  mine: boolean;
  reported: boolean;
  styles: GroupChatStyles;
  onReact: (emoji: string) => void;
  onReply: () => void;
  /** Others' messages only; opens the reasons. */
  onReport: () => void;
  onClose: () => void;
}

/**
 * What a held message offers, by the message itself as on Messenger: a bar of
 * reactions over it (under it near the top), and a small card of actions
 * under it (over it near the bottom), lined up with its side.
 */
export default function MessageReactionMenu({
  target,
  mine,
  reported,
  styles,
  onReact,
  onReply,
  onReport,
  onClose,
}: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  if (!target) {
    return null;
  }
  const { message, frame } = target;
  const myReaction = message.reactions?.find(item => item.mine)?.emoji;
  const actionCount = mine ? 1 : 2;
  const cardHeight = actionCount * ACTION_HEIGHT;
  const top = insets.top + EDGE;
  const bottom = height - insets.bottom - EDGE;

  // The bar over the message, or under it if there's no room above.
  const above = frame.y - REACTION_BAR_HEIGHT - GAP >= top;
  const barTop = above
    ? frame.y - REACTION_BAR_HEIGHT - GAP
    : frame.y + frame.height + GAP;
  // The card under the message (and the bar), or over everything if it
  // would run off the bottom.
  const under = above
    ? frame.y + frame.height + GAP
    : barTop + REACTION_BAR_HEIGHT + GAP;
  const cardTop =
    under + cardHeight <= bottom
      ? under
      : Math.max(top, (above ? barTop : frame.y) - cardHeight - GAP);

  // Lined up with the message's side, kept on screen.
  const alongside = (boxWidth: number) =>
    Math.min(
      Math.max(mine ? frame.x + frame.width - boxWidth : frame.x, EDGE),
      width - boxWidth - EDGE,
    );

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Pressable
        style={styles.menuBackdrop}
        onPress={onClose}
        accessibilityLabel={t('common.cancel')}
      />

      <Animated.View
        entering={popIn}
        style={[
          styles.reactionBar,
          { top: barTop, left: alongside(REACTION_BAR_WIDTH) },
        ]}
      >
        {QUICK_REACTIONS.map(emoji => (
          <Pressable
            key={emoji}
            onPress={() => onReact(emoji)}
            style={({ pressed }) => [
              styles.reactionOption,
              emoji === myReaction && styles.reactionOptionOn,
              pressed && styles.reactionOptionPressed,
            ]}
            accessibilityRole="button"
            accessibilityState={{ selected: emoji === myReaction }}
          >
            <Text style={styles.reactionOptionEmoji}>{emoji}</Text>
          </Pressable>
        ))}
      </Animated.View>

      <Animated.View
        entering={FadeIn.duration(160)}
        style={[
          styles.menuCard,
          { top: cardTop, left: alongside(CARD_WIDTH), width: CARD_WIDTH },
        ]}
      >
        <MenuAction
          icon="arrow-undo-outline"
          label={t('chat.reply')}
          color={colors.text}
          styles={styles}
          onPress={onReply}
        />
        {mine ? null : (
          <MenuAction
            icon={reported ? 'flag' : 'flag-outline'}
            label={reported ? t('chat.reported') : t('chat.report')}
            color={reported ? colors.textMuted : colors.danger}
            styles={styles}
            onPress={reported ? undefined : onReport}
          />
        )}
      </Animated.View>
    </Modal>
  );
}

function MenuAction({
  icon,
  label,
  color,
  styles,
  onPress,
}: {
  icon: string;
  label: string;
  color: string;
  styles: GroupChatStyles;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [
        styles.menuAction,
        { height: ACTION_HEIGHT },
        pressed && styles.pressed,
      ]}
      accessibilityRole="button"
    >
      <Text style={[styles.menuActionText, { color }]}>{label}</Text>
      <Icon name={icon} size={ms(19)} color={color} />
    </Pressable>
  );
}
