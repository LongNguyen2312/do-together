import { Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ms } from 'react-native-size-matters';
import Svg, { Circle } from 'react-native-svg';
import Icon from 'react-native-vector-icons/Ionicons';

import { useAppSelector } from '@/store/hooks';
import { useTheme } from '@/theme';
import { initialsOf } from '@/utils/format';

import { SEND_SIZE, type StoryEditorStyles } from './styles';
import type { Prepared } from './usePreparedMedia';

const RING_WIDTH = ms(3);

interface Props {
  prepared: Prepared;
  /** Share was tapped; it goes once the media is ready. */
  sharing: boolean;
  styles: StoryEditorStyles;
  onShare: () => void;
}

/**
 * "Your story" (where it goes) and the send button. Sending while the media
 * is still being compressed shows how far along it is, then posts by itself.
 */
export default function ShareBar({
  prepared,
  sharing,
  styles,
  onShare,
}: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const myName = useAppSelector(state => state.auth.user?.displayName);
  const failed = prepared.status === 'failed';
  const waiting = sharing && prepared.status === 'working';

  const label = failed
    ? t('storyEditor.prepareFailed')
    : waiting
    ? t('storyEditor.posting')
    : t('storyEditor.yourStory');

  return (
    <View style={styles.shareBar} pointerEvents="box-none">
      {/* Who it's shared with; only the send button shares. */}
      <View style={styles.yourStory}>
        <View style={styles.yourStoryAvatar}>
          <Text style={styles.yourStoryInitials}>
            {initialsOf(myName || t('chat.you'))}
          </Text>
        </View>
        <Text style={styles.yourStoryText} numberOfLines={1}>
          {label}
        </Text>
      </View>

      <Pressable
        onPress={onShare}
        disabled={waiting}
        style={({ pressed }) => [
          styles.send,
          failed && styles.sendFailed,
          pressed && styles.pressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel={t('storyEditor.share')}
        accessibilityState={{ busy: waiting }}
      >
        {waiting ? (
          <>
            <ProgressRing
              style={styles.sendRing}
              progress={prepared.percent / 100}
              color={colors.white}
              track={`${colors.white}40`}
            />
            <Text style={styles.sendPercent}>{prepared.percent}</Text>
          </>
        ) : (
          <Icon
            name={failed ? 'refresh' : 'send'}
            size={ms(20)}
            color={colors.white}
            // The paper plane points up and right; nudged to look centred.
            style={failed ? undefined : styles.sendIcon}
          />
        )}
      </Pressable>
    </View>
  );
}

/** A ring filling clockwise from the top, around the send button. */
function ProgressRing({
  style,
  progress,
  color,
  track,
}: {
  style: StoryEditorStyles['sendRing'];
  progress: number;
  color: string;
  track: string;
}) {
  const radius = (SEND_SIZE - RING_WIDTH) / 2;
  const length = 2 * Math.PI * radius;
  const centre = SEND_SIZE / 2;
  return (
    <Svg width={SEND_SIZE} height={SEND_SIZE} style={style}>
      <Circle
        cx={centre}
        cy={centre}
        r={radius}
        stroke={track}
        strokeWidth={RING_WIDTH}
        fill="none"
      />
      <Circle
        cx={centre}
        cy={centre}
        r={radius}
        stroke={color}
        strokeWidth={RING_WIDTH}
        strokeLinecap="round"
        strokeDasharray={length}
        strokeDashoffset={length * (1 - Math.min(Math.max(progress, 0), 1))}
        fill="none"
      />
    </Svg>
  );
}
