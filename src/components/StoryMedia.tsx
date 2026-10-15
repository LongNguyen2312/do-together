import { memo, useEffect, useRef, useState } from 'react';
import {
  Image,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type ImageStyle,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { ms } from 'react-native-size-matters';
import Icon from 'react-native-vector-icons/Ionicons';
import Video, { ViewType, type VideoRef } from 'react-native-video';

import LogoLoader from '@/components/LogoLoader';
import { fonts, fs, useTheme } from '@/theme';
import type {
  StoryFilterId,
  StoryMedia as Media,
  StoryPhoto,
} from '@/types/story';
import { filterLayers } from '@/utils/storyFilters';

import FilterLayers from './FilterLayers';

const BLUR_RADIUS = 30;
/** Media that's quick to appear (cached, bundled) never flashes a spinner. */
const SPINNER_DELAY_MS = 200;
/** A video on its poster already shows something: only a long wait needs it. */
const POSTER_SPINNER_DELAY_MS = 1000;
/** Fills its frame when that crops at most this share of the picture. */
const COVER_MAX_CROP = 0.25;

interface Size {
  width: number;
  height: number;
}

/** Whether the picture can fill the frame without losing too much of it. */
function fitsByCover(picture: Size | null, frame: Size | null) {
  if (!picture || !frame || !picture.height || !frame.height) {
    return false;
  }
  const a = picture.width / picture.height;
  const b = frame.width / frame.height;
  return Math.min(a, b) / Math.max(a, b) >= 1 - COVER_MAX_CROP;
}
/**
 * Decoded and blurred at an eighth of the screen, then scaled up: behind a
 * blur the missing detail doesn't show, and it's about 1/64 of the work of
 * blurring a full-size photo, which otherwise lands on every story change.
 */
const SHRINK = 8;

/** A blurred, screen-filling copy of a photo, for backdrops. */
function BlurredPhotoView({ photo }: { photo: StoryPhoto }) {
  const { width, height } = useWindowDimensions();
  return (
    <View style={styles.fill} pointerEvents="none">
      <Image
        source={photo}
        resizeMode="cover"
        blurRadius={BLUR_RADIUS / SHRINK}
        style={[
          styles.shrunk,
          { width: width / SHRINK, height: height / SHRINK },
        ]}
      />
    </View>
  );
}

export const BlurredPhoto = memo(BlurredPhotoView);

/** A still of a story for small tiles: the photo, or a video's first frame. */
function StoryThumbView({
  media,
  filter,
  style,
}: {
  media: Media;
  filter?: StoryFilterId;
  style?: StyleProp<ViewStyle>;
}) {
  if (filterLayers(filter).length) {
    return (
      <View style={[style, styles.clip]} pointerEvents="none">
        <StoryThumbView media={media} style={styles.fill} />
        <FilterLayers filter={filter} />
      </View>
    );
  }
  if (media.type === 'photo') {
    return (
      <Image source={media.source} style={style as StyleProp<ImageStyle>} />
    );
  }
  if (media.posterUri) {
    return (
      <Image
        source={{ uri: media.posterUri }}
        style={style as StyleProp<ImageStyle>}
      />
    );
  }
  // Only before a poster exists: a paused player costs more than an image.
  return (
    <View style={[style, styles.clip]} pointerEvents="none">
      <Video
        source={{ uri: media.uri }}
        style={styles.fill}
        resizeMode="cover"
        paused
        muted
        disableFocus
      />
    </View>
  );
}

export const StoryThumb = memo(StoryThumbView);

interface Props {
  media: Media;
  filter?: StoryFilterId;
  /** Holds a video still (on its first frame until it has played). */
  paused?: boolean;
  /** Silences a video, e.g. when music plays instead. */
  muted?: boolean;
  /** Loops a video, for the editor's preview. */
  repeat?: boolean;
  /** Changing it plays a video again from the start; undefined is ignored. */
  restartKey?: number;
  /** Once the photo or the video's first frame is on screen (or failed). */
  onReady?: () => void;
  /**
   * Fills the frame when the picture's shape is close to it (a portrait
   * photo), cropping a little; otherwise shows all of it on a blurred copy.
   */
  fill?: boolean;
  style?: StyleProp<ViewStyle>;
}

/**
 * A story's photo or video, filling the screen without cropping: photos sit
 * on a blurred copy of themselves, videos on black (on their poster frame
 * until they're ready).
 */
function StoryMedia({
  media,
  filter,
  paused = false,
  muted = false,
  repeat = false,
  restartKey,
  onReady,
  fill = false,
  style,
}: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [frame, setFrame] = useState<Size | null>(null);
  const [picture, setPicture] = useState<Size | null>(null);
  const resizeMode = fill && fitsByCover(picture, frame) ? 'cover' : 'contain';
  const measure = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setFrame({ width, height });
  };
  const [loading, setLoading] = useState(true);
  const [buffering, setBuffering] = useState(false);
  const [failed, setFailed] = useState(false);
  const [slow, setSlow] = useState(false);
  const reported = useRef(false);

  // Restarting seeks back rather than remounting the player, which would go
  // black for a moment and load the clip all over again. A clip still on its
  // first frame isn't sought at all: a seek stalls playback for a moment.
  const videoRef = useRef<VideoRef>(null);
  const lastRestart = useRef(restartKey);
  const hasPlayed = useRef(false);
  useEffect(() => {
    if (restartKey === undefined || restartKey === lastRestart.current) {
      return;
    }
    lastRestart.current = restartKey;
    if (hasPlayed.current) {
      hasPlayed.current = false;
      videoRef.current?.seek(0);
    }
  }, [restartKey]);

  const waiting = loading || buffering;
  const spinnerDelay =
    media.type === 'video' && media.posterUri
      ? POSTER_SPINNER_DELAY_MS
      : SPINNER_DELAY_MS;
  // Only shown once the wait has gone on a little.
  useEffect(() => {
    if (!waiting) {
      setSlow(false);
      return;
    }
    const timer = setTimeout(() => setSlow(true), spinnerDelay);
    return () => clearTimeout(timer);
  }, [waiting, spinnerDelay]);

  const ready = (ok: boolean) => {
    setLoading(false);
    setFailed(!ok);
    if (!reported.current) {
      reported.current = true;
      onReady?.();
    }
  };

  const status = failed ? (
    <View style={styles.status}>
      <Icon name="image-outline" size={ms(34)} color={colors.white} />
      <Text style={[styles.statusText, { color: colors.white }]}>
        {t('stories.loadFailed')}
      </Text>
    </View>
  ) : slow ? (
    <View style={styles.status}>
      <LogoLoader size="large" color={colors.white} />
    </View>
  ) : null;

  if (media.type === 'video') {
    return (
      <View
        style={[styles.fill, { backgroundColor: colors.black }, style]}
        pointerEvents="none"
        onLayout={measure}
      >
        {/* The first frame, on screen at once while the clip loads. */}
        {media.posterUri ? (
          <Image
            source={{ uri: media.posterUri }}
            style={styles.fill}
            resizeMode={resizeMode}
            onLoad={({ nativeEvent }) =>
              setPicture(known => known ?? nativeEvent.source)
            }
          />
        ) : null}
        <Video
          ref={videoRef}
          source={{ uri: media.uri }}
          style={styles.fill}
          resizeMode={resizeMode}
          paused={paused}
          muted={muted}
          repeat={repeat}
          onLoad={({ naturalSize }) => {
            // Clips shot upright can report their size sideways.
            const upright =
              naturalSize.orientation === 'portrait' &&
              naturalSize.width > naturalSize.height;
            setPicture(
              upright
                ? { width: naturalSize.height, height: naturalSize.width }
                : { width: naturalSize.width, height: naturalSize.height },
            );
          }}
          onReadyForDisplay={() => ready(true)}
          onProgress={({ currentTime }) => {
            if (currentTime > 0) {
              hasPlayed.current = true;
            }
          }}
          onBuffer={event => setBuffering(event.isBuffering)}
          onError={() => ready(false)}
          // Story music and a clip's own sound shouldn't stop other audio.
          disableFocus
          playInBackground={false}
          // Android's black cover before the first frame would hide the poster.
          shutterColor="transparent"
          // A filter can only blend with a texture, not Android's own surface.
          viewType={
            filterLayers(filter).length ? ViewType.TEXTURE : ViewType.SURFACE
          }
        />
        <FilterLayers filter={filter} />
        {status}
      </View>
    );
  }
  return (
    <View style={[styles.fill, style]} pointerEvents="none" onLayout={measure}>
      <BlurredPhoto photo={media.source} />
      {/* Dims the blurred fill so the photo itself stands out. */}
      <View style={[styles.fill, { backgroundColor: `${colors.black}73` }]} />
      <Image
        source={media.source}
        style={styles.fill}
        resizeMode={resizeMode}
        onLoad={({ nativeEvent }) => {
          setPicture(nativeEvent.source);
          ready(true);
        }}
        onError={() => ready(false)}
      />
      <FilterLayers filter={filter} />
      {status}
    </View>
  );
}

export default memo(StoryMedia);

const styles = StyleSheet.create({
  // Centred over the media while it loads, or if it couldn't.
  status: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: ms(10),
  },
  statusText: {
    fontSize: fs(14),
    fontFamily: fonts.medium,
  },
  clip: {
    overflow: 'hidden',
  },
  shrunk: {
    transformOrigin: 'top left',
    transform: [{ scale: SHRINK }],
  },
  // Bundled images otherwise keep their pixel size.
  fill: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
});
