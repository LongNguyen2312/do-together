import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
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
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ms } from 'react-native-size-matters';
import Icon from 'react-native-vector-icons/Ionicons';
import Video, { type VideoRef } from 'react-native-video';
import { scheduleOnRN } from 'react-native-worklets';

import { useSwipeToDismiss } from '@/hooks/useSwipeToDismiss';
import { fonts, fs, useTheme, type AppColors } from '@/theme';
import type { ChatVideo } from '@/types/chat';
import { formatDuration } from '@/utils/format';

/** While playing, the controls step aside after this long. */
const HIDE_CONTROLS_MS = 2500;
const PLAY_BUTTON = ms(64);
const THUMB = ms(14);

interface Props {
  /** The clip to play; null keeps the viewer closed. */
  video: ChatVideo | null;
  onClose: () => void;
}

/**
 * A chat clip, full screen, with its own controls: play / pause, a bar to
 * seek along (tap or drag), the time, and sound on / off. A tap shows or hides
 * them (they hide by themselves while it plays); drag up or down to close.
 */
export default function VideoViewer({ video, onClose }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const open = video !== null;
  const swipe = useSwipeToDismiss(open, onClose);

  const playerRef = useRef<VideoRef>(null);
  const [loading, setLoading] = useState(true);
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(false);
  const [ended, setEnded] = useState(false);
  const [durationMs, setDurationMs] = useState(video?.durationMs ?? 0);
  const [positionMs, setPositionMs] = useState(0);
  const [controlsShown, setControlsShown] = useState(true);
  /** Played share, 0–1: from the player, or the finger while seeking. */
  const progress = useSharedValue(0);
  const seeking = useSharedValue(false);
  const [barWidth, setBarWidth] = useState(0);

  // Fresh for every clip opened.
  useEffect(() => {
    if (open) {
      setLoading(true);
      setPaused(false);
      setEnded(false);
      setPositionMs(0);
      setDurationMs(video?.durationMs ?? 0);
      setControlsShown(true);
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
  }, [open, controlsShown, paused, ended]);

  const togglePlay = () => {
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
    playerRef.current?.seek((share * durationMs) / 1000);
    setPositionMs(share * durationMs);
    setEnded(false);
    setControlsShown(true);
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
    },
    onUpdate: event => {
      'worklet';
      progress.value = shareAt(event.x);
    },
    onDeactivate: () => {
      'worklet';
      seeking.value = false;
      scheduleOnRN(seekTo, progress.value);
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
                paused={paused || ended}
                muted={muted}
                progressUpdateInterval={250}
                onLoad={event => {
                  setLoading(false);
                  setDurationMs(event.duration * 1000);
                }}
                onReadyForDisplay={() => setLoading(false)}
                onProgress={event => {
                  const at = event.currentTime * 1000;
                  setPositionMs(at);
                  if (!seeking.value && durationMs > 0) {
                    progress.value = Math.min(at / durationMs, 1);
                  }
                }}
                onEnd={() => {
                  setEnded(true);
                  setControlsShown(true);
                  setPositionMs(durationMs);
                  progress.value = 1;
                }}
                onError={() => setLoading(false)}
              />
            ) : null}
            {/* With a poster there's already something to see. */}
            {loading && !video?.posterUri ? (
              <View style={styles.center} pointerEvents="none">
                <ActivityIndicator size="large" color={colors.white} />
              </View>
            ) : null}
          </Animated.View>
        </GestureDetector>

        {/* Over the clip, fading as it's dragged away. */}
        <Animated.View
          style={[styles.fill, swipe.chromeStyle]}
          pointerEvents="box-none"
        >
          {/* Hidden, the controls take no taps (a tap shows them again). */}
          <Animated.View
            style={[styles.fill, controlsStyle]}
            pointerEvents={controlsShown ? 'box-none' : 'none'}
          >
            <View style={styles.center} pointerEvents="box-none">
              <Pressable
                onPress={togglePlay}
                style={({ pressed }) => [
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
                  size={ms(30)}
                  color={colors.white}
                  style={paused && !ended ? styles.playIcon : undefined}
                />
              </Pressable>
            </View>

            <View
              style={[
                styles.bottomBar,
                { paddingBottom: insets.bottom + ms(12) },
              ]}
            >
              <Text style={styles.time}>{formatDuration(positionMs)}</Text>
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
              <Text style={styles.time}>{formatDuration(durationMs)}</Text>
              <Pressable
                onPress={() => setMuted(value => !value)}
                hitSlop={ms(10)}
                accessibilityRole="button"
                accessibilityLabel={
                  muted ? t('videoViewer.unmute') : t('videoViewer.mute')
                }
              >
                <Icon
                  name={muted ? 'volume-mute' : 'volume-high'}
                  size={ms(22)}
                  color={colors.white}
                />
              </Pressable>
            </View>
          </Animated.View>

          <Pressable
            onPress={onClose}
            hitSlop={ms(10)}
            style={[styles.close, { top: insets.top + ms(8) }]}
            accessibilityRole="button"
            accessibilityLabel={t('common.close')}
          >
            <Icon name="close" size={ms(28)} color={colors.white} />
          </Pressable>
        </Animated.View>
      </GestureHandlerRootView>
    </Modal>
  );
}

function createStyles(colors: AppColors) {
  const glass = `${colors.black}59`;
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
    },
    playButton: {
      width: PLAY_BUTTON,
      height: PLAY_BUTTON,
      borderRadius: PLAY_BUTTON / 2,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: glass,
    },
    // The play triangle looks centred a touch to the right.
    playIcon: {
      marginLeft: ms(4),
    },
    // Over a shade, so it reads on a bright picture.
    bottomBar: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      flexDirection: 'row',
      alignItems: 'center',
      gap: ms(12),
      paddingTop: ms(32),
      paddingHorizontal: ms(16),
      backgroundImage: `linear-gradient(to top, ${colors.black}99 0%, ${colors.black}00 100%)`,
    },
    time: {
      minWidth: ms(34),
      fontSize: fs(12),
      fontFamily: fonts.semibold,
      color: colors.white,
      fontVariant: ['tabular-nums'],
      textAlign: 'center',
    },
    // Tall enough to catch a finger; the line itself is thin.
    track: {
      flex: 1,
      height: ms(32),
      justifyContent: 'center',
    },
    trackLine: {
      height: ms(3),
      borderRadius: ms(1.5),
      overflow: 'hidden',
      backgroundColor: `${colors.white}4D`,
    },
    trackFill: {
      height: '100%',
      backgroundColor: colors.white,
    },
    thumb: {
      position: 'absolute',
      width: THUMB,
      height: THUMB,
      borderRadius: THUMB / 2,
      backgroundColor: colors.white,
    },
    close: {
      position: 'absolute',
      left: ms(14),
      width: ms(40),
      height: ms(40),
      borderRadius: ms(20),
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: glass,
    },
  });
}
