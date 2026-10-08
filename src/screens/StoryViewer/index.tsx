import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  Pressable,
  StatusBar,
  StyleSheet,
  useWindowDimensions,
  View,
  type GestureResponderEvent,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import Reanimated, {
  Easing as ReEasing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ms } from 'react-native-size-matters';
import Icon from 'react-native-vector-icons/Ionicons';
import { scheduleOnRN } from 'react-native-worklets';

import { useConfirm } from '@/components/ConfirmDialog';
import { useStories } from '@/hooks/useStories';
import { firstUnseenIndex, STORY_DURATION_MS } from '@/services/stories';
import { useAppDispatch } from '@/store/hooks';
import { deleteStory, markStorySeen } from '@/store/slices/storySlice';
import { useTheme } from '@/theme';
import { ME } from '@/types/chat';
import type { RootStackParamList } from '@/types/navigation';
import type { Story } from '@/types/story';

import StoryFace from './StoryFace';
import { createStyles } from './styles';

/** Taps on the left part of the photo go back. */
const BACK_ZONE = 0.3;
/** Holding longer than this pauses instead of skipping. */
const HOLD_MS = 200;
const FADE_MS = 220;
const CUBE_MS = 420;
/** Camera distance, in screen widths. */
const PERSPECTIVE_SHARE = 2.5;
/** How much the cube shrinks halfway through a turn. */
const CUBE_DIP = 0.1;

/** -1 turns the cube from the left, 1 from the right, 0 fades in place. */
type EnterFrom = -1 | 0 | 1;

/** The page turning away while the next person's comes in. */
interface Leaving {
  userId: string;
  stories: Story[];
  index: number;
  from: Exclude<EnterFrom, 0>;
}

type Props = NativeStackScreenProps<RootStackParamList, 'StoryViewer'>;

/** Full-screen stories, one person after another, like the usual story apps. */
export default function StoryViewerScreen({ navigation, route }: Props) {
  const { userIds, startIndex } = route.params;
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const dispatch = useAppDispatch();
  const confirm = useConfirm();
  const { mine, friends, seenIds } = useStories();

  const storiesOf = (userId: string) =>
    userId === ME
      ? mine
      : friends.find(group => group.userId === userId)?.stories ?? [];

  const [userIndex, setUserIndex] = useState(startIndex);
  const [storyIndex, setStoryIndex] = useState(() =>
    firstUnseenIndex(storiesOf(userIds[startIndex]), seenIds),
  );

  const userId = userIds[userIndex];
  const stories = storiesOf(userId);
  // Deleting the last of the user's own stories shifts what's left.
  const index = Math.min(storyIndex, stories.length - 1);
  const story = stories[index];
  const isMine = userId === ME;

  const progress = useRef(new Animated.Value(0)).current;
  const pausedAt = useRef(0);
  const currentFill = useMemo(
    () => ({
      width: progress.interpolate({
        inputRange: [0, 1],
        outputRange: ['0%', '100%'],
      }),
    }),
    [progress],
  );

  const enter = useSharedValue(1);
  const enterFrom = useSharedValue<EnterFrom>(0);
  const [leaving, setLeaving] = useState<Leaving | null>(null);

  // Reset before the state change, so the new story's first frame is already hidden.
  const transition = (from: EnterFrom) => {
    enterFrom.value = from;
    enter.value = 0;
    setLeaving(from === 0 ? null : { userId, stories, index, from });
  };

  const close = () => navigation.goBack();

  const openUser = (next: number) => {
    transition(next > userIndex ? 1 : -1);
    setUserIndex(next);
    setStoryIndex(firstUnseenIndex(storiesOf(userIds[next]), seenIds));
  };

  const goNext = () => {
    if (index < stories.length - 1) {
      transition(0);
      setStoryIndex(index + 1);
    } else if (userIndex < userIds.length - 1) {
      openUser(userIndex + 1);
    } else {
      close();
    }
  };

  const goPrevious = () => {
    if (index > 0) {
      transition(0);
      setStoryIndex(index - 1);
    } else if (userIndex > 0) {
      transition(-1);
      setUserIndex(userIndex - 1);
      setStoryIndex(0);
    } else {
      play(0);
    }
  };

  // The animation callback outlives renders, so it reads the latest goNext.
  const goNextRef = useRef(goNext);
  goNextRef.current = goNext;

  const play = (from: number) => {
    progress.setValue(from);
    Animated.timing(progress, {
      toValue: 1,
      duration: STORY_DURATION_MS * (1 - from),
      easing: Easing.linear,
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished) {
        goNextRef.current();
      }
    });
  };

  const pause = () =>
    progress.stopAnimation(value => {
      pausedAt.current = value;
    });

  const storyId = story?.id;
  useEffect(() => {
    if (!storyId) {
      navigation.goBack();
      return;
    }
    if (!isMine) {
      dispatch(markStorySeen(storyId));
    }
    play(0);
    const turning = enterFrom.value !== 0;
    enter.value = withTiming(
      1,
      {
        duration: turning ? CUBE_MS : FADE_MS,
        easing: turning
          ? ReEasing.inOut(ReEasing.cubic)
          : ReEasing.out(ReEasing.cubic),
      },
      finished => {
        if (finished && turning) {
          scheduleOnRN(setLeaving, null);
        }
      },
    );
    return () => progress.stopAnimation();
    // play only reads refs and stable values.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storyId]);

  const onTap = (event: GestureResponderEvent) => {
    if (event.nativeEvent.pageX < width * BACK_ZONE) {
      goPrevious();
    } else {
      goNext();
    }
  };

  const askDelete = () => {
    if (!story) {
      return;
    }
    pause();
    confirm({
      icon: 'trash-outline',
      title: t('stories.deleteTitle'),
      message: t('stories.deleteMessage'),
      confirmLabel: t('stories.delete'),
      onConfirm: () => dispatch(deleteStory(story.id)),
      onCancel: () => play(pausedAt.current),
    });
  };

  // Pages are sides of a cube: they turn around its centre, half a screen
  // behind the glass, and the cube dips back a little mid-turn.
  const cubeTurn = (angle: number, turned: number) => {
    'worklet';
    return {
      transform: [
        { perspective: width * PERSPECTIVE_SHARE },
        { scale: 1 - CUBE_DIP * Math.sin(Math.PI * turned) },
        { rotateY: `${angle}deg` },
      ],
    };
  };
  const inFace = useAnimatedStyle(() =>
    cubeTurn(enterFrom.value * 90 * (1 - enter.value), enter.value),
  );
  const outFace = useAnimatedStyle(() =>
    cubeTurn(-enterFrom.value * 90 * enter.value, enter.value),
  );
  const cubeAxis = useMemo(
    () => ({
      transformOrigin: ['50%', '50%', -width / 2] as [string, string, number],
    }),
    [width],
  );
  // Between one person's stories the photo just fades in.
  const fadeIn = useAnimatedStyle(() => ({
    opacity: enterFrom.value === 0 ? 0.2 + 0.8 * enter.value : 1,
  }));

  const closeIcon = <Icon name="close" size={ms(26)} color={colors.white} />;

  if (!story) {
    return <View style={styles.root} />;
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />
      {/* Shows through the gaps the turning pages open, instead of black. */}
      <Image
        source={story.photo}
        style={styles.photo}
        resizeMode="cover"
        blurRadius={30}
      />

      {leaving ? (
        <Reanimated.View
          style={[styles.face, cubeAxis, outFace]}
          pointerEvents="none"
        >
          <StoryFace
            userId={leaving.userId}
            stories={leaving.stories}
            index={leaving.index}
            styles={styles}
            topInset={insets.top}
            barFill={styles.barDone}
            actions={closeIcon}
          />
        </Reanimated.View>
      ) : null}

      <Reanimated.View
        style={[styles.face, leaving && cubeAxis, inFace]}
        pointerEvents="box-none"
      >
        <StoryFace
          userId={userId}
          stories={stories}
          index={index}
          styles={styles}
          topInset={insets.top}
          barFill={currentFill}
          photoStyle={fadeIn}
          overlay={
            <Pressable
              style={StyleSheet.absoluteFill}
              onPress={onTap}
              onPressIn={pause}
              // A hold only pauses; without this the release would also skip.
              onLongPress={() => {}}
              delayLongPress={HOLD_MS}
              onPressOut={() => play(pausedAt.current)}
              accessibilityRole="button"
              accessibilityHint={t('stories.tapHint')}
            />
          }
          actions={
            <>
              {isMine ? (
                <Pressable
                  onPress={askDelete}
                  hitSlop={ms(8)}
                  style={styles.iconButton}
                  accessibilityRole="button"
                  accessibilityLabel={t('stories.delete')}
                >
                  <Icon
                    name="trash-outline"
                    size={ms(21)}
                    color={colors.white}
                  />
                </Pressable>
              ) : null}
              <Pressable
                onPress={close}
                hitSlop={ms(8)}
                style={styles.iconButton}
                accessibilityRole="button"
                accessibilityLabel={t('common.close')}
              >
                {closeIcon}
              </Pressable>
            </>
          }
        />
      </Reanimated.View>
    </View>
  );
}
