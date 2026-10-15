import { memo, useEffect, type ReactNode } from 'react';
import { Image, Text, View } from 'react-native';
import type { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';
import Reanimated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { ms } from 'react-native-size-matters';

import Equalizer from '@/components/Equalizer';
import StoryMedia from '@/components/StoryMedia';
import StoryOverlays from '@/components/StoryOverlays';
import { useStoryCanvas, type StoryCanvas } from '@/hooks/useStoryCanvas';
import { getUser } from '@/services/mockData';
import { useAppSelector } from '@/store/hooks';
import { useTheme } from '@/theme';
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
  /**
   * How far the person's stories have played, in stories, e.g. 1.5 is halfway
   * through the second. Without it the bars stand still at `index`.
   */
  played?: SharedValue<number>;
  /** Plays a video story; the cube's other sides hold theirs still. */
  playing?: boolean;
  /** Changing it plays a video story again from the start. */
  restartKey?: number;
  /** The viewer's mute button. */
  muted?: boolean;
  /**
   * Keeps the person's stories either side of `index` ready underneath, so
   * moving to them is a crossfade with nothing left to load. Only for the
   * side being watched; the cube's other sides show just one story.
   */
  preload?: boolean;
  /** A story's photo or video has appeared (or failed); gets its id. */
  onMediaReady?: (storyId: string) => void;
  /** Between the photo and the header, e.g. the tap zones. */
  overlay?: ReactNode;
  /** Buttons at the end of the header. */
  actions?: ReactNode;
  /** Along the bottom, over a shade, e.g. the reply bar. */
  footer?: ReactNode;
}

/** One person's story page: the photo, progress bars and who posted it. */
export default function StoryFace({
  userId,
  stories,
  index,
  styles,
  topInset,
  played,
  playing = false,
  restartKey,
  muted = false,
  preload = false,
  onMediaReady,
  overlay,
  actions,
  footer,
}: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const myName = useAppSelector(state => state.auth.user?.displayName);
  const story = stories[index];
  const author = userId === ME ? undefined : getUser(userId);
  // Room underneath for the message field, or the pin button on their own.
  const canvas = useStoryCanvas(footer != null);

  return (
    <>
      {/* Black around the story, as the message field sits below it. */}
      <View
        style={[styles.layer, styles.faceBackground]}
        pointerEvents="none"
      />
      <View
        style={[styles.canvas, { top: canvas.top, height: canvas.height }]}
        pointerEvents="none"
      >
        {/* The current story last, so it's on top while it fades in. */}
        {(preload ? [index - 1, index + 1, index] : [index])
          .filter(i => i >= 0 && i < stories.length)
          .map(i => (
            <StoryLayer
              key={stories[i].id}
              story={stories[i]}
              active={i === index}
              playing={playing && i === index}
              muted={muted}
              restartKey={i === index ? restartKey : undefined}
              onMediaReady={onMediaReady}
              canvas={canvas}
              styles={styles}
            />
          ))}
        <View style={styles.shade} />
        {footer ? <View style={styles.footShade} /> : null}
      </View>

      {overlay}

      <View
        style={[styles.top, { paddingTop: topInset + ms(8) }]}
        pointerEvents="box-none"
      >
        <View style={styles.bars} pointerEvents="none">
          {stories.map((item, i) => (
            <StoryBar
              key={item.id}
              slot={i}
              index={index}
              played={played}
              styles={styles}
            />
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
            {author?.name ?? (myName || t('chat.you'))}
          </Text>
          <Text style={styles.time}>{ageLabel(story.postedAt, t)}</Text>
          <View style={styles.spacer} />
          {actions}
        </View>

        {story.music ? (
          // The song playing with it, under who posted it.
          <View style={styles.musicChip} pointerEvents="none">
            <Equalizer
              height={ms(10)}
              barWidth={ms(2)}
              color={colors.white}
              playing={playing && !muted}
            />
            <Text style={styles.musicChipText} numberOfLines={1}>
              {story.music.title}
            </Text>
          </View>
        ) : null}
      </View>

      {footer}
    </>
  );
}

/** How long the next of a person's stories takes to fade in over the last. */
const CROSSFADE_MS = 180;

interface StoryLayerProps {
  story: Story;
  active: boolean;
  playing: boolean;
  muted: boolean;
  restartKey?: number;
  onMediaReady?: (storyId: string) => void;
  canvas: StoryCanvas;
  styles: StoryViewerStyles;
}

/**
 * One story's photo or video with its text and stickers. Coming to the front
 * it fades in over the one it replaces, which only goes once it's covered.
 */
function StoryLayerView({
  story,
  active,
  playing,
  muted,
  restartKey,
  onMediaReady,
  canvas,
  styles,
}: StoryLayerProps) {
  const opacity = useSharedValue(active ? 1 : 0);

  useEffect(() => {
    opacity.value = active
      ? withTiming(1, {
          duration: CROSSFADE_MS,
          easing: Easing.out(Easing.quad),
        })
      : withDelay(CROSSFADE_MS, withTiming(0, { duration: 0 }));
  }, [active, opacity]);

  const fadeStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Reanimated.View style={[styles.layer, fadeStyle]} pointerEvents="none">
      <StoryMedia
        media={story.media}
        filter={story.filter}
        paused={!playing}
        // Chosen music plays instead of the clip's own sound.
        muted={muted || story.music != null}
        restartKey={restartKey}
        onReady={() => onMediaReady?.(story.id)}
        fill
      />
      <StoryOverlays overlays={story.overlays} frame={canvas} />
    </Reanimated.View>
  );
}

const StoryLayer = memo(StoryLayerView);

interface StoryBarProps {
  /** Which story this bar stands for. */
  slot: number;
  index: number;
  played?: SharedValue<number>;
  styles: StoryViewerStyles;
}

/**
 * One story's bar. Every bar reads the same `played`, so the one finishing
 * and the one starting can never be a frame apart.
 */
function StoryBarView({ slot, index, played, styles }: StoryBarProps) {
  // Slides rather than resizes, so the UI thread animates it without layout.
  const fillStyle = useAnimatedStyle(() => {
    const filled = played
      ? Math.min(Math.max(played.value - slot, 0), 1)
      : Number(slot < index);
    return { transform: [{ translateX: `${(filled - 1) * 100}%` }] };
  });

  return (
    <View style={styles.bar}>
      <Reanimated.View style={[styles.barFill, fillStyle]} />
    </View>
  );
}

const StoryBar = memo(StoryBarView);

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
