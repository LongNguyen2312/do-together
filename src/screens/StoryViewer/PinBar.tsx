import { Pressable, Text, View } from 'react-native';
import { PushPinIcon } from 'phosphor-react-native/src/icons/PushPin';
import { useTranslation } from 'react-i18next';
import { ms } from 'react-native-size-matters';

import { useTheme } from '@/theme';

import type { StoryViewerStyles } from './styles';

interface Props {
  pinned: boolean;
  /** None on the cube's other sides, which only show. */
  onPress?: () => void;
  bottomInset: number;
  styles: StoryViewerStyles;
}

/**
 * Under the user's own story, where a friend's has the message field:
 * pinning it to their profile, or, pinned, taking it off.
 */
export default function PinBar({
  pinned,
  onPress,
  bottomInset,
  styles,
}: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  return (
    <View
      style={[styles.pinBar, { paddingBottom: bottomInset + ms(13) }]}
      pointerEvents={onPress ? 'box-none' : 'none'}
    >
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.pinButton,
          pinned && styles.pinButtonOn,
          pressed && styles.pinPressed,
        ]}
        accessibilityRole="button"
        accessibilityState={{ selected: pinned }}
        accessibilityHint={pinned ? t('stories.unpin') : undefined}
      >
        <PushPinIcon
          size={ms(15)}
          weight={pinned ? 'fill' : 'regular'}
          color={pinned ? colors.black : colors.white}
        />
        <Text style={[styles.pinText, pinned && styles.pinTextOn]}>
          {pinned ? t('stories.pinnedLabel') : t('stories.pin')}
        </Text>
      </Pressable>
    </View>
  );
}
