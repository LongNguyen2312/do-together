import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Modal,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type LayoutChangeEvent,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  GestureDetector,
  GestureHandlerRootView,
  usePanGesture,
  useSimultaneousGestures,
  useTapGesture,
} from 'react-native-gesture-handler';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ms } from 'react-native-size-matters';
import Svg, { Path } from 'react-native-svg';
import Icon from 'react-native-vector-icons/Ionicons';
import Video, { type VideoRef } from 'react-native-video';
import { scheduleOnRN } from 'react-native-worklets';

import LogoLoader from '@/components/LogoLoader';
import { useSwipeToDismiss } from '@/hooks/useSwipeToDismiss';
import { fonts, fs, useTheme, type AppColors } from '@/theme';
import type { ChatVideo } from '@/types/chat';
import { formatDuration } from '@/utils/format';

/** While playing, the controls step aside after this long. */
const HIDE_CONTROLS_MS = 2500;
/** How far the skip buttons jump. */
const SKIP_MS = 10000;
/** While dragging the seek bar, the picture follows at most this often. */
const SCRUB_PREVIEW_MS = 80;
/** A report this close to where it was sent means the seek has landed. */
const SEEK_LANDED_MS = 400;
/** How often the player reports where it is. */
const PROGRESS_MS = 250;
/** A seek that hasn't reported landing by now (e.g. at the very end) is let go. */
const SEEK_GIVE_UP_MS = 1500;
const PLAY_BUTTON = ms(58);
const SKIP_BUTTON = ms(44);
const SKIP_ICON = ms(34);
const ROUND_BUTTON = ms(34);
const THUMB = ms(12);
/** Room either side of the clip, so its rounded corners show. */
const FRAME_SIDE = ms(10);
const FRAME_RADIUS = ms(12);
const TOP_BAR = ms(56);
const TRACK_HEIGHT = ms(28);
const TIMES_HEIGHT = ms(16);
const BAR_BOTTOM = ms(10);
/** The strip at the bottom kept for the controls; the clip ends over it. */
const BOTTOM_BAR = TRACK_HEIGHT + TIMES_HEIGHT + BAR_BOTTOM;

interface Props {
  /** The clip to play; null keeps the viewer closed. */
  video: ChatVideo | null;
  onClose: () => void;
}

/**
 * A chat clip, full screen, between a top bar (close, sound) and a seek bar
 * with the times. Over it: back 10 s, play / pause, on 10 s. A tap shows or
 * hides the controls (they hide by themselves while it plays); drag up or
 * down to close.
 */
export default function VideoViewer({ video, onClose }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const screen = useWindowDimensions();
  /** Where the clip plays: clear of the top bar and the seek bar. */
  const videoArea = {
    top: insets.top + TOP_BAR,
    bottom: insets.bottom + BOTTOM_BAR,
  };
  const open = video !== null;
  /** Width over height, as shown: from the player once loaded. */
  const [loadedRatio, setLoadedRatio] = useState<number>();
  const ratio =
    loadedRatio ??
    (video?.width && video.height ? video.width / video.height : undefined);
  const frame = fitFrame(
    ratio,
    screen.width - FRAME_SIDE * 2,
    screen.height - videoArea.top - videoArea.bottom,
    FRAME_SIDE,
    videoArea.top,
  );
  const swipe = useSwipeToDismiss(open, onClose);

  const playerRef = useRef<VideoRef>(null);
  const [loading, setLoading] = useState(true);
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(false);
  const [ended, setEnded] = useState(false);
  const [durationMs, setDurationMs] = useState(video?.durationMs ?? 0);
  const [positionMs, setPositionMs] = useState(0);
  const [controlsShown, setControlsShown] = useState(true);
  /** Bumped on every touch of a control, to put off hiding them. */
  const [touchedAt, setTouchedAt] = useState(0);
  /** Played share, 0–1: from the player, or the finger while seeking. */
  const progress = useSharedValue(0);
  const seeking = useSharedValue(false);
  const [barWidth, setBarWidth] = useState(0);
  /** Dragging the seek bar: held still, the picture following the finger. */
  const [scrubbing, setScrubbing] = useState(false);
  /** Where a seek was sent, until the player reports being there. */
  const seekTarget = useRef<number | null>(null);
  const lastPreview = useRef(0);

  // Fresh for every clip opened.
  useEffect(() => {
    if (open) {
      setLoading(true);
      setPaused(false);
      setEnded(false);
      setPositionMs(0);
      setDurationMs(video?.durationMs ?? 0);
      setControlsShown(true);
      setLoadedRatio(undefined);
      setScrubbing(false);
      seekTarget.current = null;
      progress.value = 0;
    }
  }, [open, video, progress]);

  // Playing, the controls get out of the way after a moment.
  useEffect(() => {
    if (!open || !controlsShown || paused || ended) {
      return;
    }
    const timer = setTimeout(() => setControlsShown(false), HIDE_CONTROLS_MS);
    return () => clearTimeout(timer);
  }, [open, controlsShown, paused, ended, touchedAt]);

  const touched = () => {
    setControlsShown(true);
    setTouchedAt(Date.now());
  };

  const togglePlay = () => {
    touched();
    if (ended) {
      playerRef.current?.seek(0);
      progress.value = 0;
      setEnded(false);
      setPaused(false);
      return;
    }
    setPaused(value => !value);
  };

  const seekTo = (share: number) => {
    const at = share * durationMs;
    seekTarget.current = at;
    setTimeout(() => {
      if (seekTarget.current === at) {
        seekTarget.current = null;
      }
    }, SEEK_GIVE_UP_MS);
    playerRef.current?.seek(at / 1000);
    setPositionMs(at);
    setEnded(false);
    touched();
  };

  const startScrub = () => {
    setScrubbing(true);
    touched();
  };
  /** The picture and the time follow the finger, a few times a second. */
  const previewAt = (share: number) => {
    const now = Date.now();
    if (now - lastPreview.current < SCRUB_PREVIEW_MS) {
      return;
    }
    lastPreview.current = now;
    playerRef.current?.seek((share * durationMs) / 1000);
    setPositionMs(share * durationMs);
  };
  const endScrub = (share: number) => {
    setScrubbing(false);
    seekTo(share);
  };

  /** Back or on by `deltaMs`, kept inside the clip. */
  const skip = (deltaMs: number) => {
    if (durationMs <= 0) {
      return;
    }
    const at = Math.min(Math.max(positionMs + deltaMs, 0), durationMs);
    progress.value = at / durationMs;
    seekTo(at / durationMs);
  };

  const toggleControls = () => setControlsShown(shown => !shown);
  const tap = useTapGesture({
    onActivate: () => {
      'worklet';
      scheduleOnRN(toggleControls);
    },
  });
  const gesture = useSimultaneousGestures(swipe.gesture, tap);

  // Tap or drag along the bar to seek.
  const shareAt = (x: number) => {
    'worklet';
    return barWidth > 0 ? Math.min(Math.max(x / barWidth, 0), 1) : 0;
  };
  // From the first touch, so a tap seeks too. (RNGH won't take a fail offset
  // with minDistance: a drag that starts on the bar always seeks.)
  const scrub = usePanGesture({
    minDistance: 0,
    onActivate: event => {
      'worklet';
      seeking.value = true;
      progress.value = shareAt(event.x);
      scheduleOnRN(startScrub);
    },
    onUpdate: event => {
      'worklet';
      progress.value = shareAt(event.x);
      scheduleOnRN(previewAt, progress.value);
    },
    onDeactivate: () => {
      'worklet';
      seeking.value = false;
      scheduleOnRN(endScrub, progress.value);
    },
  });

  const fillStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));
  const thumbStyle = useAnimatedStyle(() => ({
    left: progress.value * barWidth - THUMB / 2,
    transform: [{ scale: withTiming(seeking.value ? 1.4 : 1) }],
  }));
  const controlsStyle = useAnimatedStyle(() => ({
    opacity: withTiming(controlsShown ? 1 : 0, { duration: 180 }),
  }));

  const measureBar = (event: LayoutChangeEvent) =>
    setBarWidth(event.nativeEvent.layout.width);

  const remainingMs = Math.max(durationMs - positionMs, 0);

  return (
    <Modal
      visible={open}
      animationType="fade"
      transparent
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <StatusBar barStyle="light-content" />
      {/* A modal is its own root: gestures need one of their own. */}
      <GestureHandlerRootView style={styles.root}>
        <Animated.View
          style={[styles.fill, styles.backdrop, swipe.backdropStyle]}
          pointerEvents="none"
        />
        <GestureDetector gesture={gesture}>
          <Animated.View style={[styles.root, swipe.contentStyle]}>
            {video ? (
              // Rounded, and just the clip's size, so the corners are its own.
              <View style={[styles.frame, frame]}>
                <Video
                  ref={playerRef}
                  source={{ uri: video.uri }}
                  poster={
                    video.posterUri
                      ? {
                          source: { uri: video.posterUri },
                          resizeMode: 'contain',
                        }
                      : undefined
                  }
                  style={styles.fill}
                  resizeMode="contain"
                  paused={paused || ended || scrubbing}
                  muted={muted}
                  progressUpdateInterval={PROGRESS_MS}
                  onLoad={event => {
                    setLoading(false);
                    setDurationMs(event.duration * 1000);
                    const { width, height, orientation } = event.naturalSize;
                    // Some players report the frame before it's turned upright.
                    const turned =
                      (orientation === 'portrait' && width > height) ||
                      (orientation === 'landscape' && height > width);
                    if (width > 0 && height > 0) {
                      setLoadedRatio(turned ? height / width : width / height);
                    }
                  }}
                  onReadyForDisplay={() => setLoading(false)}
                  onProgress={event => {
                    const at = event.currentTime * 1000;
                    // Reports from before a seek lands would pull the bar
                    // back for a moment; so would any while dragging.
                    const target = seekTarget.current;
                    if (target !== null) {
                      if (Math.abs(at - target) > SEEK_LANDED_MS) {
                        return;
                      }
                      seekTarget.current = null;
                    }
                    if (seeking.value || durationMs <= 0) {
                      return;
                    }
                    setPositionMs(at);
                    const share = Math.min(at / durationMs, 1);
                    // Glides on to each report while playing, so the bar
                    // runs instead of stepping; jumps (seeks, a restart)
                    // land at once.
                    const step = share - progress.value;
                    progress.value =
                      step > 0 && step * durationMs < PROGRESS_MS * 3
                        ? withTiming(share, {
                            duration: PROGRESS_MS,
                            easing: Easing.linear,
                          })
                        : share;
                  }}
                  onEnd={() => {
                    seekTarget.current = null;
                    setEnded(true);
                    setControlsShown(true);
                    setPositionMs(durationMs);
                    progress.value = 1;
                  }}
                  onError={() => setLoading(false)}
                />
              </View>
            ) : null}
            {/* With a poster there's already something to see. */}
            {loading && !video?.posterUri ? (
              <View style={[styles.center, videoArea]} pointerEvents="none">
                <LogoLoader size="large" color={colors.white} />
              </View>
            ) : null}
          </Animated.View>
        </GestureDetector>

        {/* Over the clip, fading as it's dragged away. */}
        <Animated.View
          style={[styles.fill, swipe.chromeStyle]}
          pointerEvents="box-none"
        >
          {/* Hidden, the controls (close too) take no taps; a tap shows them
              again. */}
          <Animated.View
            style={[styles.fill, controlsStyle]}
            pointerEvents={controlsShown ? 'box-none' : 'none'}
          >
            <View style={[styles.center, videoArea]} pointerEvents="box-none">
              <View style={styles.transport}>
                <SkipButton
                  back
                  label={t('videoViewer.back10')}
                  onPress={() => skip(-SKIP_MS)}
                  styles={styles}
                />
                <Pressable
                  onPress={togglePlay}
                  style={({ pressed }) => [
                    styles.round,
                    styles.playButton,
                    pressed && styles.pressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={
                    paused || ended ? t('chat.play') : t('chat.pause')
                  }
                >
                  <Icon
                    name={ended ? 'refresh' : paused ? 'play' : 'pause'}
                    size={ms(26)}
                    color={colors.white}
                    style={paused && !ended ? styles.playIcon : undefined}
                  />
                </Pressable>
                <SkipButton
                  label={t('videoViewer.forward10')}
                  onPress={() => skip(SKIP_MS)}
                  styles={styles}
                />
              </View>
            </View>

            <View
              style={[
                styles.bottomBar,
                { paddingBottom: insets.bottom + BAR_BOTTOM },
              ]}
            >
              <GestureDetector gesture={scrub}>
                <View
                  style={styles.track}
                  onLayout={measureBar}
                  accessibilityRole="adjustable"
                  accessibilityLabel={t('videoViewer.seek')}
                >
                  <View style={styles.trackLine}>
                    <Animated.View style={[styles.trackFill, fillStyle]} />
                  </View>
                  <Animated.View style={[styles.thumb, thumbStyle]} />
                </View>
              </GestureDetector>
              <View style={styles.times}>
                <Text style={styles.time}>{formatDuration(positionMs)}</Text>
                <Text style={styles.time}>-{formatDuration(remainingMs)}</Text>
              </View>
            </View>

            <Pressable
              onPress={onClose}
              hitSlop={ms(8)}
              style={({ pressed }) => [
                styles.round,
                styles.roundSmall,
                styles.topLeft,
                { top: insets.top + (TOP_BAR - ROUND_BUTTON) / 2 },
                pressed && styles.pressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel={t('common.close')}
            >
              <Icon name="close" size={ms(19)} color={colors.white} />
            </Pressable>
            <Pressable
              onPress={() => {
                touched();
                setMuted(value => !value);
              }}
              hitSlop={ms(8)}
              style={({ pressed }) => [
                styles.round,
                styles.roundSmall,
                styles.topRight,
                { top: insets.top + (TOP_BAR - ROUND_BUTTON) / 2 },
                pressed && styles.pressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel={
                muted ? t('videoViewer.unmute') : t('videoViewer.mute')
              }
            >
              <Icon
                name={muted ? 'volume-mute' : 'volume-high'}
                size={ms(16)}
                color={colors.white}
              />
            </Pressable>
          </Animated.View>
        </Animated.View>
      </GestureHandlerRootView>
    </Modal>
  );
}

/**
 * The clip's own rectangle inside the area (`left`, `top` its corner), as big
 * as fits; the whole area while its shape isn't known.
 */
function fitFrame(
  ratio: number | undefined,
  areaWidth: number,
  areaHeight: number,
  left: number,
  top: number,
) {
  if (!ratio) {
    return { left, top, width: areaWidth, height: areaHeight };
  }
  const width = Math.min(areaWidth, areaHeight * ratio);
  const height = width / ratio;
  return {
    left: left + (areaWidth - width) / 2,
    top: top + (areaHeight - height) / 2,
    width,
    height,
  };
}

/**
 * A ring (centre 18, 19; radius 12) open at the top left, from ten o'clock
 * round the bottom to just past twelve...
 */
const SKIP_ARC = 'M7.1 13.9 A12 12 0 1 0 19.7 7.1';
/** ...where a solid arrowhead points back into the gap. */
const SKIP_HEAD = 'M20.2 2.2 L20.2 11.8 L12.4 7 Z';

/** A curled arrow with "10" in it, like the system players'. */
function SkipButton({
  back = false,
  label,
  onPress,
  styles,
}: {
  back?: boolean;
  label: string;
  onPress: () => void;
  styles: ReturnType<typeof createStyles>;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      hitSlop={ms(6)}
      style={({ pressed }) => [styles.skipButton, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      {/* Drawn turning back; mirrored, it turns on. The number isn't. */}
      <View style={[styles.skipIcon, !back && styles.mirrored]}>
        <Svg width={SKIP_ICON} height={SKIP_ICON} viewBox="0 0 36 36">
          <Path
            d={SKIP_ARC}
            fill="none"
            stroke={colors.white}
            strokeWidth={2.8}
            strokeLinecap="round"
          />
          <Path
            d={SKIP_HEAD}
            fill={colors.white}
            stroke={colors.white}
            strokeWidth={1}
            strokeLinejoin="round"
          />
        </Svg>
      </View>
      <Text style={[styles.skipText, styles.shadowed]}>10</Text>
    </Pressable>
  );
}

function createStyles(colors: AppColors) {
  const glass = `${colors.white}1F`;
  return StyleSheet.create({
    root: {
      flex: 1,
    },
    fill: StyleSheet.absoluteFill,
    // Fades as the clip's dragged away, showing the screen beneath.
    backdrop: {
      backgroundColor: colors.black,
    },
    center: {
      ...StyleSheet.absoluteFill,
      alignItems: 'center',
      justifyContent: 'center',
    },
    pressed: {
      opacity: 0.7,
      transform: [{ scale: 0.94 }],
    },
    // Frosted, so they read on a dark or a bright picture alike.
    round: {
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: `${colors.white}33`,
      backgroundColor: glass,
    },
    roundSmall: {
      position: 'absolute',
      width: ROUND_BUTTON,
      height: ROUND_BUTTON,
      borderRadius: ROUND_BUTTON / 2,
    },
    topLeft: {
      left: ms(14),
    },
    topRight: {
      right: ms(14),
    },
    transport: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: ms(32),
    },
    playButton: {
      width: PLAY_BUTTON,
      height: PLAY_BUTTON,
      borderRadius: PLAY_BUTTON / 2,
      backgroundColor: `${colors.black}59`,
    },
    // The play triangle looks centred a touch to the right.
    playIcon: {
      marginLeft: ms(3),
    },
    // No disc behind them: just the curl, lifted off the picture by a shade.
    skipButton: {
      width: SKIP_BUTTON,
      height: SKIP_BUTTON,
      alignItems: 'center',
      justifyContent: 'center',
    },
    // A shade round the drawn ring, as on the number.
    skipIcon: {
      shadowColor: colors.black,
      shadowOpacity: 0.5,
      shadowRadius: ms(4),
      shadowOffset: { width: 0, height: 0 },
    },
    shadowed: {
      textShadowColor: `${colors.black}99`,
      textShadowRadius: ms(6),
      textShadowOffset: { width: 0, height: 0 },
    },
    mirrored: {
      transform: [{ scaleX: -1 }],
    },
    // In the ring's middle (a touch below the box's, like the ring).
    skipText: {
      position: 'absolute',
      marginTop: SKIP_ICON / 18,
      fontSize: fs(10),
      letterSpacing: -0.3,
      fontFamily: fonts.bold,
      color: colors.white,
    },
    frame: {
      position: 'absolute',
      borderRadius: FRAME_RADIUS,
      borderCurve: 'continuous',
      overflow: 'hidden',
      backgroundColor: colors.black,
    },
    // Under the clip, on the black.
    bottomBar: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      paddingHorizontal: ms(20),
    },
    // Tall enough to catch a finger; the line itself is thin.
    track: {
      height: TRACK_HEIGHT,
      justifyContent: 'center',
    },
    trackLine: {
      height: ms(3),
      borderRadius: ms(1.5),
      overflow: 'hidden',
      backgroundColor: `${colors.white}33`,
    },
    trackFill: {
      height: '100%',
      backgroundColor: colors.primary,
    },
    thumb: {
      position: 'absolute',
      width: THUMB,
      height: THUMB,
      borderRadius: THUMB / 2,
      backgroundColor: colors.white,
      shadowColor: colors.black,
      shadowOpacity: 0.3,
      shadowRadius: ms(3),
      shadowOffset: { width: 0, height: ms(1) },
    },
    times: {
      height: TIMES_HEIGHT,
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    time: {
      fontSize: fs(11),
      fontFamily: fonts.semibold,
      color: `${colors.white}CC`,
      fontVariant: ['tabular-nums'],
    },
  });
}
