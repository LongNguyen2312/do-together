import type { ReactNode } from 'react';
import {
  Animated,
  Image,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import type { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';
import Reanimated, { type AnimatedStyle } from 'react-native-reanimated';
import { ms } from 'react-native-size-matters';

import { getUser } from '@/services/mockData';
import { useAppSelector } from '@/store/hooks';
import { ME } from '@/types/chat';
import type { Story } from '@/types/story';
import { initialsOf } from '@/utils/format';

import type { StoryViewerStyles } from './styles';

const MINUTE = 60 * 1000;

interface Props {
  userId: string;
  stories: Story[];
  index: number;
  styles: StoryViewerStyles;
  topInset: number;
  /** Fill of the current progress bar. */
  barFill: Animated.WithAnimatedValue<StyleProp<ViewStyle>>;
  /** Applied to the photo only, e.g. a fade between one person's stories. */
  photoStyle?: AnimatedStyle<ViewStyle>;
  /** Between the photo and the header, e.g. the tap zones. */
  overlay?: ReactNode;
  /** Buttons at the end of the header. */
  actions?: ReactNode;
}

/** One person's story page: the photo, progress bars and who posted it. */
export default function StoryFace({
  userId,
  stories,
  index,
  styles,
  topInset,
  barFill,
  photoStyle,
  overlay,
  actions,
}: Props) {
  const { t } = useTranslation();
  const myName = useAppSelector(state => state.auth.user?.displayName);
  const story = stories[index];
  const author = userId === ME ? undefined : getUser(userId);

  return (
    <>
      <Reanimated.View style={[styles.layer, photoStyle]} pointerEvents="none">
        {/* A blurred copy fills the bars left around photos that aren't portrait. */}
        <Image
          source={story.photo}
          style={styles.photo}
          resizeMode="cover"
          blurRadius={30}
        />
        <View style={styles.backdropDim} />
        <Image source={story.photo} style={styles.photo} resizeMode="contain" />
        <View style={styles.shade} />
      </Reanimated.View>

      {overlay}

      <View
        style={[styles.top, { paddingTop: topInset + ms(8) }]}
        pointerEvents="box-none"
      >
        <View style={styles.bars} pointerEvents="none">
          {stories.map((item, i) => (
            <View key={item.id} style={styles.bar}>
              {i < index ? (
                <View style={[styles.barFill, styles.barDone]} />
              ) : i === index ? (
                <Animated.View style={[styles.barFill, barFill]} />
              ) : null}
            </View>
          ))}
        </View>

        <View style={styles.meta} pointerEvents="box-none">
          {author ? (
            <Image source={author.avatar} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarInitials]}>
              <Text style={styles.avatarText}>
                {initialsOf(myName || t('chat.you'))}
              </Text>
            </View>
          )}
          <Text style={styles.name} numberOfLines={1}>
            {author?.name ?? t('stories.yourStory')}
          </Text>
          <Text style={styles.time}>{ageLabel(story.postedAt, t)}</Text>
          <View style={styles.spacer} />
          {actions}
        </View>
      </View>
    </>
  );
}

/** "Now", "12 min", "5h". */
function ageLabel(at: number, t: TFunction) {
  const minutes = Math.floor((Date.now() - at) / MINUTE);
  if (minutes < 1) {
    return t('chats.now');
  }
  if (minutes < 60) {
    return t('chats.minutesAgo', { count: minutes });
  }
  return t('stories.hoursAgo', { count: Math.floor(minutes / 60) });
}
