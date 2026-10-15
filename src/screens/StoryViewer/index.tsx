import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Keyboard,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type GestureResponderEvent,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import {
  GestureDetector,
  useCompetingGestures,
  usePanGesture,
} from 'react-native-gesture-handler';
import Reanimated, {
  cancelAnimation,
  Easing as ReEasing,
  FadeInDown,
  FadeOut,
  useSharedValue,
  withTiming,
  type EasingFunction,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ms } from 'react-native-size-matters';
import Icon from 'react-native-vector-icons/Ionicons';
import { scheduleOnRN, scheduleOnUI } from 'react-native-worklets';

import { useConfirm } from '@/components/ConfirmDialog';
import { BlurredPhoto } from '@/components/StoryMedia';
import { useStories } from '@/hooks/useStories';
import { getUser } from '@/services/mockData';
import {
  pauseMusic,
  playMusic,
  resumeMusic,
  setMusicMuted,
  stopMusic,
} from '@/services/music';
import { firstUnseenIndex, storyDurationMs } from '@/services/stories';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  deleteStory,
  togglePinStory,
  markStorySeen,
  replyToStory,
} from '@/store/slices/storySlice';
import { useTheme } from '@/theme';
import { ME } from '@/types/chat';
import type { RootStackParamList } from '@/types/navigation';
import type { Story } from '@/types/story';

import CubeSide from './CubeSide';
import ReactionBurst, { type Burst } from './ReactionBurst';
import PinBar from './PinBar';
import ReplyBar from './ReplyBar';
import StoryFace from './StoryFace';
import { usePullToClose } from './usePullToClose';
import { createStyles } from './styles';

/** Taps on the left part of the photo go back. */
const BACK_ZONE = 0.3;
/** Holding longer than this pauses instead of skipping. */
const HOLD_MS = 200;
/** A whole turn of the cube, from one person to the next. */
const TURN_MS = 420;
/** Sideways travel before a touch becomes a swipe. */
const SWIPE_SLOP = 10;
/** Share of a turn a slow swipe has to cover to go through. */
const SWIPE_SHARE = 0.25;
/** px/s; faster releases go through, or back, whatever the distance. */
const FLING_VELOCITY = 400;
const TAP_TURN = ReEasing.inOut(ReEasing.cubic);
const SWIPE_TURN = ReEasing.out(ReEasing.cubic);
const TOAST_MS = 1500;

/** A video's own sound, or a song. */
const hasSound = (story: Story) =>
  story.media.type === 'video' || story.music != null;

type Props = NativeStackScreenProps<RootStackParamList, 'StoryViewer'>;

/** Full-screen stories, one person after another, like the usual story apps. */
export default function StoryViewerScreen({ navigation, route }: Props) {
  const {
    userIds: requested,
    startIndex,
    pinned: showPinned,
    storyIndex: startStory,
  } = route.params;
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const dispatch = useAppDispatch();
  const confirm = useConfirm();
  const { mine: live, pinned, friends, seenIds } = useStories();
  const pinnedIds = useAppSelector(state => state.story.pinnedIds);
  // From the profile's pinned ones: those, kept past their day.
  const mine = showPinned ? pinned : live;

  const storiesOf = (userId: string) =>
    userId === ME
      ? mine
      : friends.find(group => group.userId === userId)?.stories ?? [];
  // Whoever has nothing left to show drops out, e.g. the user once they've
  // deleted their last story; the next person takes their place.
  const userIds = useMemo(
    () =>
      requested.filter(
        id =>
          (id === ME
            ? mine
            : friends.find(group => group.userId === id)?.stories ?? []
          ).length > 0,
      ),
    [requested, mine, friends],
  );

  const [userIndex, setUserIndex] = useState(startIndex);
  const [storyIndex, setStoryIndex] = useState(
    () =>
      startStory ?? firstUnseenIndex(storiesOf(userIds[startIndex]), seenIds),
  );

  const userId = userIds[userIndex];
  const stories = storiesOf(userId);
  // Deleting the last of the user's own stories shifts what's left.
  const index = Math.min(storyIndex, stories.length - 1);
  const story = stories[index];
  const isMine = userId === ME;
  const last = userIds.length - 1;

  // Going back opens someone's first story, going on their first unseen one.
  const entryIndex = (target: number) =>
    target < userIndex
      ? 0
      : firstUnseenIndex(storiesOf(userIds[target]), seenIds);

  /** How far this person's stories have played, in stories. */
  const played = useSharedValue(storyIndex);
  /** How far the cube has turned, in people; rests on userIndex. */
  const position = useSharedValue(startIndex);
  /** Set from the moment the cube starts turning until it's settled. */
  const turning = useSharedValue(false);
  /** Where the swipe in progress started, if there is one. */
  const swipeFrom = useSharedValue<number | null>(null);
  /** Letting go resumes the story only after a plain hold. */
  const resumeOnRelease = useRef(false);
  /** The reply field is open: the story waits and swipes are off. */
  const [replying, setReplying] = useState(false);
  const [bursts, setBursts] = useState<Burst[]>([]);
  const burstCount = useRef(0);
  const [toast, setToast] = useState<{ id: number; text: string } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(toastTimer.current), []);
  /**
   * Whether the current story's video is running. It waits, paused on its
   * first frame, until the story starts.
   */
  const [playing, setPlaying] = useState(false);
  const [restartKey, setRestartKey] = useState(0);
  /** Silences videos and music, from one story to the next. */
  const [muted, setMuted] = useState(false);
  const toggleMuted = () => {
    setMuted(!muted);
    setMusicMuted(!muted);
  };
  // Music stops with the viewer, however it closes, and isn't left muted
  // for the editor's previews.
  useEffect(
    () => () => {
      setMusicMuted(false);
      stopMusic();
    },
    [],
  );

  const close = () => navigation.goBack();

  // Between one person's stories StoryFace crossfades the photos.
  const showStory = (next: number) => {
    played.value = next;
    setStoryIndex(next);
  };

  // Settles on whoever the cube ended up facing.
  const land = (target: number) => {
    if (target === userIndex) {
      turning.value = false;
      play();
      return;
    }
    const entry = entryIndex(target);
    // The face turning in follows `played` from its first render as the
    // current one, so it has to be on that person's story already.
    played.value = entry;
    setUserIndex(target);
    setStoryIndex(entry);
  };
  // Turns end on the UI thread, after the render that started them.
  const landRef = useRef(land);
  landRef.current = land;
  const onTurned = (target: number) => landRef.current(target);

  const turnTo = (target: number, easing: EasingFunction) => {
    'worklet';
    turning.value = true;
    position.value = withTiming(
      target,
      { duration: TURN_MS * Math.abs(target - position.value), easing },
      finished => {
        if (finished) {
          scheduleOnRN(onTurned, target);
        }
      },
    );
  };

  const turnToUser = (target: number) => {
    pause();
    turnTo(target, TAP_TURN);
  };

  const goNext = () => {
    if (turning.value) {
      return;
    }
    if (index < stories.length - 1) {
      showStory(index + 1);
    } else if (userIndex < last) {
      turnToUser(userIndex + 1);
    } else {
      close();
    }
  };

  const goPrevious = () => {
    if (turning.value) {
      return;
    }
    if (index > 0) {
      showStory(index - 1);
    } else if (userIndex > 0) {
      turnToUser(userIndex - 1);
    } else {
      play(true);
    }
  };

  // The bar runs on the UI thread, so neither a busy JS thread nor a
  // re-render can make it stutter. It also ends there, after the render that
  // started it, and a tap may have moved on by the time that's heard.
  const barEndRef = useRef((_id: string) => {});
  barEndRef.current = id => {
    if (id === story?.id) {
      goNext();
    }
  };
  const onBarEnd = (id: string) => barEndRef.current(id);

  const runBar = (
    slot: number,
    from: number | null,
    id: string,
    durationMs: number,
  ) => {
    'worklet';
    if (from !== null) {
      played.value = from;
    }
    played.value = withTiming(
      slot + 1,
      {
        duration: durationMs * (slot + 1 - played.value),
        easing: ReEasing.linear,
      },
      finished => {
        if (finished) {
          scheduleOnRN(onBarEnd, id);
        }
      },
    );
  };

  const stopBar = () => {
    'worklet';
    cancelAnimation(played);
  };

  /** Stories whose photo or video has shown, here or preloaded. */
  const loadedIds = useRef(new Set<string>());
  /** The current story is still loading, and should start once it's in. */
  const waitingToStart = useRef(false);
  const mediaReadyRef = useRef((_id: string) => {});
  mediaReadyRef.current = id => {
    loadedIds.current.add(id);
    if (id === story?.id && waitingToStart.current) {
      play(true);
    }
  };
  // Stable, so StoryFace's layers don't re-render for it.
  const onMediaReady = useCallback(
    (id: string) => mediaReadyRef.current(id),
    [],
  );

  /**
   * Plays the current story on from where its bar is, or over from the start,
   * along with its video and music.
   */
  const play = (fromStart = false) => {
    if (!story) {
      return;
    }
    // The bar and music wait for the photo or video to show up.
    if (!loadedIds.current.has(story.id)) {
      waitingToStart.current = true;
      return;
    }
    waitingToStart.current = false;
    scheduleOnUI(
      runBar,
      index,
      fromStart ? index : null,
      story.id,
      storyDurationMs(story),
    );
    if (hasSound(story)) {
      setPlaying(true);
    }
    if (!fromStart) {
      resumeMusic();
      return;
    }
    setRestartKey(key => key + 1);
    if (story.music) {
      playMusic(story.music.url);
    } else {
      stopMusic();
    }
  };

  // The bar stays on the UI thread: a read from JS could see a stale value.
  const pause = () => {
    // Held, replying or gone: don't start by itself once it loads.
    waitingToStart.current = false;
    scheduleOnUI(stopBar);
    // Only a video, or a song's bars, need telling; for a plain photo it would
    // just re-render the cube.
    if (story && hasSound(story)) {
      setPlaying(false);
    }
    pauseMusic();
  };

  // Gestures call back from the UI thread, maybe with an older render's play.
  const playRef = useRef(play);
  playRef.current = play;
  const resume = () => playRef.current();

  const hold = () => {
    resumeOnRelease.current = true;
    pause();
  };

  // A swipe keeps the story paused until the cube settles.
  const holdForSwipe = () => {
    resumeOnRelease.current = false;
    pause();
  };

  const storyId = story?.id;
  useEffect(() => {
    if (!storyId) {
      navigation.goBack();
      return;
    }
    if (!isMine) {
      dispatch(markStorySeen(storyId));
    }
    turning.value = false;
    play(true);
    return pause;
    // play reads this render's story, which storyId already stands for.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storyId]);

  // Dragging sideways turns the cube under the finger, like the usual story
  // apps; letting go finishes the turn or rolls it back.
  const pan = usePanGesture({
    enabled: !replying,
    activeOffsetX: [-SWIPE_SLOP, SWIPE_SLOP],
    failOffsetY: [-SWIPE_SLOP, SWIPE_SLOP],
    onActivate: () => {
      'worklet';
      if (turning.value) {
        return;
      }
      swipeFrom.value = position.value;
      scheduleOnRN(holdForSwipe);
    },
    onUpdate: event => {
      'worklet';
      const from = swipeFrom.value;
      if (from === null) {
        return;
      }
      // Dragging left brings the next person round from the right.
      position.value = Math.min(
        Math.max(from - event.translationX / width, from - 1, 0),
        from + 1,
        last,
      );
    },
    onDeactivate: event => {
      'worklet';
      const from = swipeFrom.value;
      if (from === null) {
        return;
      }
      swipeFrom.value = null;
      const moved = position.value - from;
      const toward = Math.sign(moved);
      const speed = -event.velocityX * toward;
      const goes =
        speed > FLING_VELOCITY ||
        (speed > -FLING_VELOCITY && Math.abs(moved) > SWIPE_SHARE);
      turnTo(goes ? from + toward : from, SWIPE_TURN);
    },
  });

  const pull = usePullToClose({
    enabled: !replying,
    turning,
    failOffsetX: SWIPE_SLOP * 2,
    onHold: holdForSwipe,
    onResume: resume,
    onClose: close,
  });
  const gesture = useCompetingGestures(pan, pull.gesture);

  const showToast = (text: string) => {
    clearTimeout(toastTimer.current);
    setToast({ id: Date.now(), text });
    toastTimer.current = setTimeout(() => setToast(null), TOAST_MS);
  };

  // Typing a reply holds the story still until the keyboard goes away.
  const onReplyFocus = (focused: boolean) => {
    setReplying(focused);
    if (focused) {
      resumeOnRelease.current = false;
      pause();
    } else {
      play();
    }
  };

  const sendReply = (text: string) => {
    dispatch(replyToStory({ storyId: story.id, toUserId: userId, text }));
    showToast(t('stories.sent'));
  };

  const react = (emoji: string, x: number, y: number) => {
    dispatch(replyToStory({ storyId: story.id, toUserId: userId, emoji }));
    burstCount.current += 1;
    setBursts(list => [...list, { id: burstCount.current, emoji, x, y }]);
  };

  const onBurstDone = (id: number) =>
    setBursts(list => list.filter(burst => burst.id !== id));

  const onTap = (event: GestureResponderEvent) => {
    // A quick tap's press-out arrives late, after this has already moved on
    // or restarted; it mustn't drag the story back to where it was paused.
    resumeOnRelease.current = false;
    // While replying, a tap on the photo only puts the keyboard away.
    if (replying) {
      Keyboard.dismiss();
      return;
    }
    if (event.nativeEvent.pageX < width * BACK_ZONE) {
      goPrevious();
    } else {
      goNext();
    }
  };

  const isPinned = !!story && pinnedIds.includes(story.id);
  const togglePin = () => {
    if (!story) {
      return;
    }
    dispatch(togglePinStory(story.id));
    showToast(isPinned ? t('stories.unpinned') : t('stories.pinned'));
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
      onConfirm: () => {
        // The last one: the next person's stories follow, from the first
        // they haven't seen.
        if (stories.length === 1 && userIndex < last) {
          setStoryIndex(
            firstUnseenIndex(storiesOf(userIds[userIndex + 1]), seenIds),
          );
        }
        dispatch(deleteStory(story.id));
      },
      onCancel: () => play(),
    });
  };

  const closeIcon = <Icon name="close" size={ms(26)} color={colors.white} />;

  if (!story) {
    return <View style={styles.root} />;
  }

  // The people either side wait on the cube's next sides, ready to turn to.
  const sides = [userIndex - 1, userIndex, userIndex + 1].filter(
    i => i >= 0 && i <= last && storiesOf(userIds[i]).length > 0,
  );

  // Under the user's own stories, pinning to their profile; under a
  // friend's, the message field.
  const replyBarFor = (personId: string, interactive: boolean) =>
    personId === ME ? (
      <PinBar
        pinned={
          interactive
            ? isPinned
            : pinnedIds.includes(
                storiesOf(ME)[entryIndex(userIds.indexOf(ME))]?.id,
              )
        }
        onPress={interactive ? togglePin : undefined}
        bottomInset={insets.bottom}
        styles={styles}
      />
    ) : (
      <ReplyBar
        name={getUser(personId)?.name ?? ''}
        styles={styles}
        bottomInset={insets.bottom}
        {...(interactive && {
          onSend: sendReply,
          onReact: react,
          onFocusChange: onReplyFocus,
          // Only the cube's turn: a pull down still closes from the row.
          scrollBlocks: [pan],
        })}
      />
    );

  return (
    <GestureDetector gesture={gesture}>
      <View style={styles.root}>
        <StatusBar barStyle="light-content" />
        <Reanimated.View
          style={[styles.backdrop, pull.backdropStyle]}
          pointerEvents="none"
        />
        <Reanimated.View style={[styles.card, pull.cardStyle]}>
          {/* Shows through the gaps the turning cube opens, instead of black. */}
          {story.media.type === 'photo' ? (
            <BlurredPhoto photo={story.media.source} />
          ) : null}

          {/* Its own layer, so on iOS the turning sides don't cut into the backdrop. */}
          <View
            style={styles.layer}
            pointerEvents="box-none"
            collapsable={false}
          >
            {sides.map(i =>
              i === userIndex ? (
                <CubeSide
                  key={userId}
                  index={i}
                  position={position}
                  styles={styles}
                  pointerEvents="box-none"
                >
                  <StoryFace
                    userId={userId}
                    stories={stories}
                    index={index}
                    styles={styles}
                    topInset={insets.top}
                    played={played}
                    playing={playing}
                    restartKey={restartKey}
                    muted={muted}
                    preload
                    onMediaReady={onMediaReady}
                    footer={replyBarFor(userId, true)}
                    overlay={
                      <Pressable
                        style={StyleSheet.absoluteFill}
                        onPress={onTap}
                        onPressIn={hold}
                        // A hold only pauses; without this the release would also skip.
                        onLongPress={() => {}}
                        delayLongPress={HOLD_MS}
                        onPressOut={() => {
                          if (resumeOnRelease.current) {
                            play();
                          }
                        }}
                        accessibilityRole="button"
                        accessibilityHint={t('stories.tapHint')}
                      />
                    }
                    actions={
                      <>
                        {/* Only for stories with something to hear. */}
                        {hasSound(story) ? (
                          <Pressable
                            onPress={toggleMuted}
                            hitSlop={ms(8)}
                            style={styles.iconButton}
                            accessibilityRole="button"
                            accessibilityLabel={
                              muted ? t('stories.unmute') : t('stories.mute')
                            }
                          >
                            <Icon
                              name={muted ? 'volume-mute' : 'volume-high'}
                              size={ms(22)}
                              color={colors.white}
                            />
                          </Pressable>
                        ) : null}
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
                </CubeSide>
              ) : (
                <CubeSide
                  key={userIds[i]}
                  index={i}
                  position={position}
                  styles={styles}
                  pointerEvents="none"
                >
                  <StoryFace
                    userId={userIds[i]}
                    stories={storiesOf(userIds[i])}
                    index={entryIndex(i)}
                    styles={styles}
                    topInset={insets.top}
                    actions={<View style={styles.iconButton}>{closeIcon}</View>}
                    footer={replyBarFor(userIds[i], false)}
                    // Loaded while waiting here, so turning to it starts at once.
                    onMediaReady={onMediaReady}
                  />
                </CubeSide>
              ),
            )}
          </View>
        </Reanimated.View>

        {toast ? (
          <Reanimated.View
            key={toast.id}
            entering={FadeInDown.duration(180)}
            exiting={FadeOut.duration(180)}
            style={[styles.toast, { bottom: insets.bottom + ms(130) }]}
            pointerEvents="none"
          >
            <Text style={styles.toastText}>{toast.text}</Text>
          </Reanimated.View>
        ) : null}
        <ReactionBurst bursts={bursts} styles={styles} onDone={onBurstDone} />
      </View>
    </GestureDetector>
  );
}
