import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  AppState,
  Linking,
  Platform,
  Pressable,
  StatusBar,
  Text,
  View,
} from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import {
  GestureDetector,
  useCompetingGestures,
  usePanGesture,
  usePinchGesture,
  useTapGesture,
} from 'react-native-gesture-handler';
import Reanimated, {
  cancelAnimation,
  Easing,
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import type { Image as CameraSnapshot } from 'react-native-nitro-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ms } from 'react-native-size-matters';
import Icon from 'react-native-vector-icons/Ionicons';
import {
  Camera,
  CommonResolutions,
  useCameraDevice,
  useCameraPermission,
  useMicrophonePermission,
  usePhotoOutput,
  useVideoOutput,
  type CameraDevice,
  type CameraRef,
  type Recorder,
} from 'react-native-vision-camera';
import { scheduleOnRN } from 'react-native-worklets';

import FilterLayers from '@/components/FilterLayers';
import { STORY_FOOTER, useStoryCanvas } from '@/hooks/useStoryCanvas';
import { MAX_VIDEO_MS } from '@/services/stories';
import { useTheme } from '@/theme';
import type { RootStackParamList } from '@/types/navigation';
import { formatDuration } from '@/utils/format';
import { NORMAL_FILTER, STORY_FILTERS } from '@/utils/storyFilters';

import FilterStrip from './FilterStrip';
import Shutter, { type CaptureMode } from './Shutter';
import { createStyles } from './styles';

type Props = NativeStackScreenProps<RootStackParamList, 'StoryCamera'>;

/** A sideways swipe this far, or this fast, moves to the next filter. */
const SWIPE_DISTANCE = ms(60);
const SWIPE_VELOCITY = 500;
/** Clips shorter than this were a slip of the finger. */
const MIN_CLIP_MS = 500;
/** How long a new filter's name stays up. */
const FILTER_NAME_MS = 900;
/** How often the filter buttons get a fresh look at what the camera sees. */
const SAMPLE_EVERY_MS = 1500;
/** Their pictures' width: they're small circles. */
const SAMPLE_WIDTH = 160;
/** How fast the zoom buttons glide, in doublings a second. */
const ZOOM_RATE = 8;
/** Pinching stops at ten times the main lens. */
const MAX_ZOOM_RATIO = 10;

/**
 * The zoom levels offered as buttons, as the device's zoom factors: the
 * ultra-wide if there is one (".5"), the main lens ("1x"), and twice that.
 * On iPhones with an ultra-wide, the main lens is the first lens switch.
 */
function zoomStops(device: CameraDevice) {
  const hasUltraWide = device.physicalDevices.some(
    lens => lens.type === 'ultra-wide-angle',
  );
  const main =
    device.minZoom < 1
      ? 1
      : hasUltraWide
      ? device.zoomLensSwitchFactors[0] ?? 1
      : device.minZoom;
  const stops = device.minZoom < main ? [device.minZoom, main] : [main];
  if (main * 2 <= device.maxZoom) {
    stops.push(main * 2);
  }
  return { main, stops };
}

/** "0.5x", "1x", "2x": the one in use shows its exact value, e.g. "1.4x". */
function zoomLabel(ratio: number) {
  return `${Math.round(ratio * 10) / 10}x`;
}

/**
 * The story camera: a photo or a clip of up to 30 seconds, through a filter
 * picked beside the shutter or by swiping across the picture. What's taken
 * opens in the editor with the filter on.
 */
export default function StoryCameraScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const canvas = useStoryCanvas();
  const isFocused = useIsFocused();
  const [appActive, setAppActive] = useState(
    AppState.currentState === 'active',
  );
  useEffect(() => {
    const subscription = AppState.addEventListener('change', state =>
      setAppActive(state === 'active'),
    );
    return () => subscription.remove();
  }, []);

  const cameraAccess = useCameraPermission();
  const micAccess = useMicrophonePermission();
  // Both at once: holding the shutter records, with sound, in either mode.
  useEffect(() => {
    (async () => {
      if (cameraAccess.canRequestPermission) {
        await cameraAccess.requestPermission();
      }
      if (micAccess.canRequestPermission) {
        await micAccess.requestPermission();
      }
    })();
    // Once, on opening.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [position, setPosition] = useState<'back' | 'front'>('back');
  // Every lens it has, so zooming out reaches the ultra-wide.
  const device = useCameraDevice(position, {
    physicalDevices: ['ultra-wide-angle', 'wide-angle', 'telephoto'],
  });
  const [mode, setMode] = useState<CaptureMode>('photo');
  const [flash, setFlash] = useState(false);
  const [filterIndex, setFilterIndex] = useState(NORMAL_FILTER);
  const filter = STORY_FILTERS[filterIndex].id;
  const [showFilterName, setShowFilterName] = useState(false);

  const photoOutput = usePhotoOutput({
    // The shape of a story, so the editor gets what the preview showed.
    targetResolution: CommonResolutions.FHD_16_9,
    qualityPrioritization: 'balanced',
  });
  const videoOutput = useVideoOutput({
    targetResolution: CommonResolutions.FHD_16_9,
    enableAudio: micAccess.hasPermission,
  });

  const cameraRef = useRef<CameraRef>(null);

  // Zoom
  const zoomInfo = useMemo(
    () => (device ? zoomStops(device) : { main: 1, stops: [1] }),
    [device],
  );
  /**
   * The zoom, worked out on the UI thread while pinching and handed to the
   * camera from JS: as a shared value prop it would need VisionCamera's
   * separate worklets package.
   */
  const zoom = useSharedValue(zoomInfo.main);
  const pinchStart = useSharedValue(zoomInfo.main);
  /** Kept in step with `zoom` once a pinch or tap ends, for the labels. */
  const [zoomNow, setZoomNow] = useState(zoomInfo.main);
  // A new camera (or the same one set up again) starts back on "1x".
  const resetZoom = useCallback(() => {
    zoom.value = zoomInfo.main;
    setZoomNow(zoomInfo.main);
  }, [zoomInfo, zoom]);
  useEffect(resetZoom, [resetZoom]);
  const setCameraZoom = (value: number) => {
    cameraRef.current?.controller?.setZoom(value).catch(() => {});
  };
  // The buttons glide to their zoom, as the system camera's do.
  const zoomTo = (value: number) => {
    zoom.value = value;
    setZoomNow(value);
    cameraRef.current?.controller
      ?.startZoomAnimation(value, ZOOM_RATE)
      .catch(() => setCameraZoom(value));
  };
  const minZoom = device?.minZoom ?? 1;
  const maxZoom = Math.min(
    device?.maxZoom ?? 1,
    zoomInfo.main * MAX_ZOOM_RATIO,
  );

  // Capture
  const busy = useRef(false);
  const recorder = useRef<Recorder | null>(null);
  const recordStart = useRef(0);
  /** The shutter is being held down to record. */
  const holding = useRef(false);
  /** Let go before the recording had got going: stop it once it has. */
  const stopOnceStarted = useRef(false);
  const [recording, setRecording] = useState(false);
  const [recordedMs, setRecordedMs] = useState(0);
  const recorded = useSharedValue(0);
  const blink = useSharedValue(0);

  // Leaving mid-clip throws it away.
  useEffect(
    () => () => {
      recorder.current?.cancelRecording();
    },
    [],
  );

  useEffect(() => {
    if (!recording) {
      return;
    }
    const timer = setInterval(
      () => setRecordedMs(Date.now() - recordStart.current),
      250,
    );
    return () => clearInterval(timer);
  }, [recording]);

  const failed = () =>
    Alert.alert(t('storyCamera.failedTitle'), t('storyCamera.failed'));

  const takePhoto = async () => {
    if (busy.current || !device) {
      return;
    }
    busy.current = true;
    blink.value = withSequence(
      withTiming(0.8, { duration: 40 }),
      withTiming(0, { duration: 260 }),
    );
    try {
      const shot = await photoOutput.capturePhotoToFile(
        { flashMode: flash && device.hasFlash ? 'on' : 'off' },
        {},
      );
      navigation.navigate('StoryEditor', {
        media: { type: 'photo', source: { uri: `file://${shot.filePath}` } },
        filter,
      });
    } catch {
      failed();
    } finally {
      busy.current = false;
    }
  };

  const finishClip = (filePath: string) => {
    const durationMs = Math.min(Date.now() - recordStart.current, MAX_VIDEO_MS);
    recorder.current = null;
    setRecording(false);
    cancelAnimation(recorded);
    recorded.value = 0;
    if (durationMs < MIN_CLIP_MS) {
      return;
    }
    navigation.navigate('StoryEditor', {
      media: { type: 'video', uri: `file://${filePath}`, durationMs },
      filter,
    });
  };

  const startRecording = async () => {
    if (busy.current || !device) {
      return;
    }
    busy.current = true;
    stopOnceStarted.current = false;
    try {
      const next = await videoOutput.createRecorder({
        // Stops by itself at 30 seconds, as if the shutter were tapped.
        maxDuration: MAX_VIDEO_MS / 1000,
      });
      recorder.current = next;
      await next.startRecording(finishClip, () => {
        recorder.current = null;
        setRecording(false);
        cancelAnimation(recorded);
        recorded.value = 0;
        failed();
      });
      recordStart.current = Date.now();
      setRecordedMs(0);
      setRecording(true);
      recorded.value = 0;
      recorded.value = withTiming(1, {
        duration: MAX_VIDEO_MS,
        easing: Easing.linear,
      });
      if (stopOnceStarted.current) {
        stopOnceStarted.current = false;
        next.stopRecording();
      }
    } catch {
      recorder.current = null;
      failed();
    } finally {
      busy.current = false;
    }
  };

  const stopRecording = () => {
    if (recorder.current?.isRecording) {
      recorder.current.stopRecording();
    } else if (busy.current) {
      stopOnceStarted.current = true;
    }
  };

  // A tap takes a photo, or starts and stops a clip in video mode.
  const onShutterTap = () => {
    if (mode === 'photo') {
      takePhoto();
    } else if (recording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  // Held, it records in either mode, until let go.
  const onShutterHold = () => {
    holding.current = true;
    if (!recording) {
      startRecording();
    }
  };
  const onShutterRelease = () => {
    if (holding.current) {
      holding.current = false;
      stopRecording();
    }
  };

  // Filters
  const pickFilter = useCallback((index: number) => {
    setFilterIndex(index);
    setShowFilterName(true);
  }, []);
  useEffect(() => {
    if (!showFilterName) {
      return;
    }
    const timer = setTimeout(() => setShowFilterName(false), FILTER_NAME_MS);
    return () => clearTimeout(timer);
  }, [showFilterName, filterIndex]);
  const stepFilter = (step: number) => {
    const next = filterIndex + step;
    if (next >= 0 && next < STORY_FILTERS.length) {
      pickFilter(next);
    }
  };

  const focusAt = (x: number, y: number) => {
    cameraRef.current?.focusTo({ x, y }).catch(() => {});
  };

  // On the picture: swipe sideways for the next filter, pinch to zoom, tap
  // to focus.
  const swipe = usePanGesture({
    enabled: !recording,
    maxPointers: 1,
    activeOffsetX: [-ms(20), ms(20)],
    failOffsetY: [-ms(20), ms(20)],
    onDeactivate: event => {
      'worklet';
      if (
        event.translationX < -SWIPE_DISTANCE ||
        event.velocityX < -SWIPE_VELOCITY
      ) {
        scheduleOnRN(stepFilter, 1);
      } else if (
        event.translationX > SWIPE_DISTANCE ||
        event.velocityX > SWIPE_VELOCITY
      ) {
        scheduleOnRN(stepFilter, -1);
      }
    },
  });
  const pinch = usePinchGesture({
    onActivate: () => {
      'worklet';
      pinchStart.value = zoom.value;
    },
    onUpdate: event => {
      'worklet';
      zoom.value = Math.min(
        Math.max(pinchStart.value * event.scale, minZoom),
        maxZoom,
      );
      scheduleOnRN(setCameraZoom, zoom.value);
    },
    onDeactivate: () => {
      'worklet';
      scheduleOnRN(setZoomNow, zoom.value);
    },
  });
  const tap = useTapGesture({
    onActivate: event => {
      'worklet';
      scheduleOnRN(focusAt, event.x, event.y);
    },
  });
  const gesture = useCompetingGestures(pinch, swipe, tap);

  const blinkStyle = useAnimatedStyle(() => ({ opacity: blink.value }));

  const canShow = cameraAccess.hasPermission && device != null;
  const live = canShow && isFocused && appActive;

  // Every so often a small still of the preview, so each filter button shows
  // the scene through its filter. Paused while recording.
  const [sample, setSample] = useState<CameraSnapshot | null>(null);
  useEffect(() => {
    if (!live || recording) {
      return;
    }
    let stopped = false;
    const grab = async () => {
      try {
        const still = await cameraRef.current?.takeSnapshot();
        if (!still || stopped) {
          return;
        }
        const small = await still.resizeAsync(
          SAMPLE_WIDTH,
          Math.round((SAMPLE_WIDTH * still.height) / still.width),
        );
        if (!stopped) {
          setSample(small);
        }
      } catch {
        // Not ready yet; the next one will do.
      }
    };
    const first = setTimeout(grab, 500);
    const timer = setInterval(grab, SAMPLE_EVERY_MS);
    return () => {
      stopped = true;
      clearTimeout(first);
      clearInterval(timer);
    };
  }, [live, recording, position]);
  const notice = !cameraAccess.hasPermission ? (
    <View style={styles.notice}>
      <Icon name="camera-outline" size={ms(40)} color={colors.white} />
      <Text style={styles.noticeText}>{t('storyCamera.noAccess')}</Text>
      <Pressable
        onPress={
          cameraAccess.canRequestPermission
            ? cameraAccess.requestPermission
            : Linking.openSettings
        }
        style={({ pressed }) => [
          styles.noticeButton,
          pressed && styles.pressed,
        ]}
        accessibilityRole="button"
      >
        <Text style={styles.noticeButtonText}>
          {cameraAccess.canRequestPermission
            ? t('storyCamera.allow')
            : t('storyCamera.openSettings')}
        </Text>
      </Pressable>
    </View>
  ) : !device ? (
    <View style={styles.notice}>
      <Icon name="videocam-off-outline" size={ms(40)} color={colors.white} />
      <Text style={styles.noticeText}>{t('storyCamera.noCamera')}</Text>
    </View>
  ) : null;

  const activeStop = zoomInfo.stops.reduce(
    (best, stop, i) => (zoomNow >= stop - 0.01 ? i : best),
    0,
  );

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />
      <GestureDetector gesture={gesture}>
        <View
          style={[styles.preview, { top: canvas.top, height: canvas.height }]}
        >
          {canShow ? (
            <Camera
              ref={cameraRef}
              style={styles.fill}
              device={device}
              isActive={live}
              // Both, so holding the shutter in photo mode can record.
              outputs={[photoOutput, videoOutput]}
              // Starts on the main lens ("1x"), as a plain number: only set
              // again when the camera changes. Pinches and the zoom buttons
              // move it from there.
              zoom={zoomInfo.main}
              onConfigured={resetZoom}
              torchMode={
                mode === 'video' && flash && device.hasTorch ? 'on' : 'off'
              }
              resizeMode="cover"
              // Android's fast preview is its own surface, which a filter
              // can't blend with.
              implementationMode={
                Platform.OS === 'android' ? 'compatible' : undefined
              }
              onError={failed}
            />
          ) : null}
          {canShow ? <FilterLayers filter={filter} /> : null}
          {notice}
          <Reanimated.View
            style={[styles.blink, blinkStyle]}
            pointerEvents="none"
          />
          {showFilterName ? (
            <Reanimated.Text
              key={filter}
              entering={FadeIn.duration(150)}
              exiting={FadeOut.duration(250)}
              style={[styles.filterName, { top: canvas.height * 0.42 }]}
              pointerEvents="none"
            >
              {t(`storyCamera.filters.${filter}`)}
            </Reanimated.Text>
          ) : null}
        </View>
      </GestureDetector>

      <View
        style={[styles.top, { top: canvas.top + ms(12) }]}
        pointerEvents="box-none"
      >
        <Pressable
          onPress={() => navigation.goBack()}
          style={({ pressed }) => [styles.round, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel={t('common.close')}
        >
          <Icon name="close" size={ms(24)} color={colors.white} />
        </Pressable>
        {recording ? (
          <View style={styles.timer}>
            <View style={styles.timerDot} />
            <Text style={styles.timerText}>{formatDuration(recordedMs)}</Text>
          </View>
        ) : null}
        <View style={styles.topRight}>
          <Pressable
            onPress={() => setFlash(on => !on)}
            style={({ pressed }) => [styles.round, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel={t('storyCamera.flash')}
            accessibilityState={{ checked: flash }}
          >
            <Icon
              name={flash ? 'flash' : 'flash-off'}
              size={ms(20)}
              color={colors.white}
            />
          </Pressable>
          {recording ? null : (
            <Pressable
              onPress={() =>
                setPosition(side => (side === 'back' ? 'front' : 'back'))
              }
              style={({ pressed }) => [styles.round, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel={t('storyCamera.flip')}
            >
              <Icon
                name="camera-reverse-outline"
                size={ms(22)}
                color={colors.white}
              />
            </Pressable>
          )}
        </View>
      </View>

      <View
        style={[
          styles.controls,
          // Over the bottom of the picture, just above the photo/video tabs.
          { bottom: insets.bottom + STORY_FOOTER + ms(16) },
        ]}
        pointerEvents="box-none"
      >
        {zoomInfo.stops.length > 1 ? (
          <View style={styles.zoomRow}>
            {zoomInfo.stops.map((stop, i) => {
              const active = i === activeStop;
              return (
                <Pressable
                  key={stop}
                  onPress={() => zoomTo(stop)}
                  style={[styles.zoomChip, active && styles.zoomChipActive]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                >
                  <Text
                    style={[styles.zoomText, active && styles.zoomTextActive]}
                  >
                    {zoomLabel((active ? zoomNow : stop) / zoomInfo.main)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ) : null}
        <FilterStrip
          index={filterIndex}
          onChange={pickFilter}
          recording={recording}
          sample={sample}
          styles={styles}
          shutter={
            <Shutter
              mode={mode}
              recording={recording}
              recorded={recorded}
              onTap={onShutterTap}
              onHoldStart={onShutterHold}
              onHoldEnd={onShutterRelease}
              styles={styles}
            />
          }
        />
      </View>

      {recording ? null : (
        <View
          style={[styles.modes, { top: canvas.top + canvas.height }]}
          pointerEvents="box-none"
        >
          {(['photo', 'video'] as const).map(option => {
            const active = option === mode;
            return (
              <Pressable
                key={option}
                onPress={() => setMode(option)}
                style={[styles.mode, active && styles.modeActive]}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
              >
                <Text
                  style={[styles.modeText, active && styles.modeTextActive]}
                >
                  {t(`storyCamera.${option}`)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}
