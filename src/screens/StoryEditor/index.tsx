import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Pressable,
  StatusBar,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import Reanimated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
  ZoomOut,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ms } from 'react-native-size-matters';
import Icon from 'react-native-vector-icons/Ionicons';

import { useConfirm } from '@/components/ConfirmDialog';
import Equalizer from '@/components/Equalizer';
import StoryMedia from '@/components/StoryMedia';
import { useStoryCanvas } from '@/hooks/useStoryCanvas';
import { playMusic, stopMusic } from '@/services/music';
import type { Sticker } from '@/services/stickers';
import { useAppDispatch } from '@/store/hooks';
import { postStory } from '@/store/slices/storySlice';
import { useTheme } from '@/theme';
import type { RootStackParamList } from '@/types/navigation';
import type {
  MusicTrack,
  StoryMedia as StoryMediaType,
  StoryOverlay,
} from '@/types/story';

import MusicSheet from './MusicSheet';
import OverlayItem, { type Placement } from './OverlayItem';
import ShareBar from './ShareBar';
import StickerSheet from './StickerSheet';
import { createStyles, TEXT_COLORS } from './styles';
import TextComposer, { type TextDraft } from './TextComposer';
import { usePreparedMedia } from './usePreparedMedia';

/** New text and stickers land a little above the middle. */
const DROP_POINT = { x: 0.5, y: 0.42 };
/** Pops in a touch past full size and settles, in one go: no wobble. */
const popIn = () => {
  'worklet';
  return {
    initialValues: { opacity: 0, transform: [{ scale: 0.6 }] },
    animations: {
      opacity: withTiming(1, { duration: 120 }),
      transform: [
        {
          scale: withSequence(
            withTiming(1.1, { duration: 170, easing: Easing.out(Easing.quad) }),
            withTiming(1, { duration: 130, easing: Easing.inOut(Easing.quad) }),
          ),
        },
      ],
    },
  };
};

const FADE_MS = 150;
/** Screens a story is begun from, closed along with the editor once shared. */
const STORY_SOURCES: string[] = ['StoryCamera', 'StoryGallery'];

/** The strip along the bottom where a dragged overlay gets thrown away. */
const TRASH_ZONE = ms(110);

type Props = NativeStackScreenProps<RootStackParamList, 'StoryEditor'>;

/**
 * Making a story from a picked photo or video: add text and stickers, move,
 * resize and turn them, pick a song, then share.
 */
export default function StoryEditorScreen({ navigation, route }: Props) {
  const { media, filter } = route.params;
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const dispatch = useAppDispatch();
  const confirm = useConfirm();

  const [overlays, setOverlays] = useState<StoryOverlay[]>([]);
  const [music, setMusic] = useState<MusicTrack | null>(null);
  const [composing, setComposing] = useState<TextDraft | null>(null);
  const [sheet, setSheet] = useState<'stickers' | 'music' | null>(null);
  // Shared values, not state: dragging an overlay mustn't re-render the editor.
  const dragging = useSharedValue(false);
  const overTrash = useSharedValue(false);
  const overlayCount = useRef(0);
  const isVideo = media.type === 'video';
  const canvas = useStoryCanvas();
  // Compresses the pick in the background while the story is being made.
  const { prepared, retry: retryPrepare } = usePreparedMedia(media);

  // The chosen song plays along, as it will on the story; the music sheet
  // takes the player over for previews while it's open.
  useEffect(() => {
    if (sheet === 'music') {
      return;
    }
    if (music) {
      playMusic(music.url);
    } else {
      stopMusic();
    }
  }, [music, sheet]);
  useEffect(
    () => () => {
      stopMusic();
    },
    [],
  );

  const chromeStyle = useAnimatedStyle(() => ({
    opacity: withTiming(dragging.value ? 0 : 1, { duration: FADE_MS }),
  }));
  const trashStyle = useAnimatedStyle(() => ({
    opacity: withTiming(dragging.value ? 1 : 0, { duration: FADE_MS }),
    borderColor: overTrash.value ? colors.danger : `${colors.white}CC`,
    backgroundColor: overTrash.value ? colors.danger : `${colors.black}59`,
    transform: [
      { scale: withTiming(overTrash.value ? 1.25 : 1, { duration: FADE_MS }) },
    ],
  }));

  const newId = () => {
    overlayCount.current += 1;
    return `overlay-${overlayCount.current}`;
  };

  const addSticker = (sticker: Sticker) => {
    setSheet(null);
    setOverlays(list => [
      ...list,
      {
        id: newId(),
        kind: 'sticker',
        stickerId: sticker.id,
        ...DROP_POINT,
        scale: 1,
        rotation: 0,
      },
    ]);
  };

  const finishText = ({ id, text, color }: TextDraft) => {
    setComposing(null);
    const trimmed = text.trim();
    setOverlays(list => {
      if (id) {
        // Emptying text that was already there takes it off.
        return trimmed
          ? list.map(item =>
              item.id === id ? { ...item, text: trimmed, color } : item,
            )
          : list.filter(item => item.id !== id);
      }
      return trimmed
        ? [
            ...list,
            {
              id: newId(),
              kind: 'text',
              text: trimmed,
              color,
              ...DROP_POINT,
              scale: 1,
              rotation: 0,
            },
          ]
        : list;
    });
  };

  // Stable, since the overlays' gestures keep hold of them on the UI thread.
  const place = useCallback((id: string, placement: Placement) => {
    setOverlays(list =>
      list.map(item => (item.id === id ? { ...item, ...placement } : item)),
    );
  }, []);
  const remove = useCallback((id: string) => {
    setOverlays(list => list.filter(item => item.id !== id));
  }, []);
  const overlaysRef = useRef(overlays);
  overlaysRef.current = overlays;
  const editText = useCallback((id: string) => {
    const item = overlaysRef.current.find(overlay => overlay.id === id);
    if (item?.kind === 'text') {
      setComposing({
        id,
        text: item.text ?? '',
        color: item.color ?? TEXT_COLORS[0],
      });
    }
  }, []);

  const pickMusic = (track: MusicTrack | null) => {
    setMusic(track);
    setSheet(null);
  };

  /** Share was tapped while the media was still being compressed. */
  const [sharing, setSharing] = useState(false);

  // Shares the compressed copy, never the original pick.
  const postRef = useRef((_ready: StoryMediaType) => {});
  postRef.current = ready => {
    dispatch(
      postStory({
        media: ready,
        filter: filter === 'normal' ? undefined : filter,
        overlays: overlays.length ? overlays : undefined,
        music: music ?? undefined,
      }),
    );
    // Past the camera or gallery it came from, back to where it was begun.
    const { routes, index } = navigation.getState();
    let count = 1;
    while (STORY_SOURCES.includes(routes[index - count]?.name)) {
      count += 1;
    }
    navigation.pop(count);
  };

  const share = () => {
    if (prepared.status === 'ready') {
      postRef.current(prepared.media);
      return;
    }
    if (prepared.status === 'failed') {
      retryPrepare();
    }
    setSharing(true);
  };

  // Goes as soon as it's ready, or gives up waiting if compressing fails.
  useEffect(() => {
    if (!sharing) {
      return;
    }
    if (prepared.status === 'ready') {
      postRef.current(prepared.media);
    } else if (prepared.status === 'failed') {
      setSharing(false);
    }
  }, [sharing, prepared]);

  const close = () => {
    if (!overlays.length && !music) {
      navigation.goBack();
      return;
    }
    confirm({
      icon: 'trash-outline',
      title: t('storyEditor.discardTitle'),
      message: t('storyEditor.discardMessage'),
      confirmLabel: t('storyEditor.discard'),
      onConfirm: () => navigation.goBack(),
    });
  };

  const tool = (
    icon: string | null,
    label: string,
    onPress: () => void,
    active = false,
  ) => (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.tool,
        active && styles.toolActive,
        pressed && styles.pressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      {icon ? (
        <Icon name={icon} size={ms(22)} color={colors.white} />
      ) : (
        <Text style={styles.toolText}>Aa</Text>
      )}
    </Pressable>
  );

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />
      {/* The same frame the story is watched in, so overlays land true. */}
      <View
        style={[styles.canvas, { top: canvas.top, height: canvas.height }]}
        pointerEvents="none"
      >
        <StoryMedia
          media={media}
          filter={filter}
          repeat
          fill
          // A picked song replaces the clip's sound; previews silence it too.
          muted={music != null || sheet === 'music'}
        />
      </View>

      {overlays.map(overlay => (
        <OverlayItem
          key={overlay.id}
          overlay={overlay}
          styles={styles}
          hidden={composing?.id === overlay.id}
          trashTop={height - TRASH_ZONE}
          onPlace={place}
          onDelete={remove}
          onEdit={editText}
          dragging={dragging}
          overTrash={overTrash}
        />
      ))}

      {/* Fades away while an overlay is dragged, and the trash fades in. */}
      <Reanimated.View
        style={[styles.top, { paddingTop: insets.top + ms(8) }, chromeStyle]}
        pointerEvents="box-none"
      >
        {tool('close', t('common.close'), close)}
        {music ? (
          // Keyed by song, so picking another one pops it in again.
          <Reanimated.View
            key={music.id}
            entering={popIn}
            exiting={ZoomOut.duration(150)}
            style={styles.musicChipWrap}
          >
            {/* Tapping the song reopens the list, on the song in use. */}
            <Pressable
              onPress={() => setSheet('music')}
              accessibilityRole="button"
              accessibilityLabel={t('storyEditor.changeMusic', {
                title: music.title,
              })}
            >
              <View style={styles.musicChip}>
                <Equalizer
                  height={ms(12)}
                  barWidth={ms(2.5)}
                  color={colors.white}
                />
                <Text style={styles.musicChipText} numberOfLines={1}>
                  {music.title}
                </Text>
                <Pressable
                  onPress={() => setMusic(null)}
                  hitSlop={ms(8)}
                  accessibilityRole="button"
                  accessibilityLabel={t('storyEditor.removeMusic')}
                >
                  <Icon
                    name="close-circle"
                    size={ms(18)}
                    color={`${colors.white}D9`}
                  />
                </Pressable>
              </View>
            </Pressable>
          </Reanimated.View>
        ) : (
          <View />
        )}
        <View style={styles.tools}>
          {tool(null, t('storyEditor.text'), () =>
            setComposing({ text: '', color: TEXT_COLORS[0] }),
          )}
          {tool('happy-outline', t('storyEditor.stickers'), () =>
            setSheet('stickers'),
          )}
          {tool(
            'musical-notes-outline',
            t('storyEditor.music'),
            () => setSheet('music'),
            music != null,
          )}
        </View>
      </Reanimated.View>

      <Reanimated.View
        style={[
          styles.bottom,
          // In the strip below the story, clear of the photo.
          { paddingBottom: insets.bottom },
          chromeStyle,
        ]}
        pointerEvents="box-none"
      >
        <ShareBar
          prepared={prepared}
          sharing={sharing}
          styles={styles}
          onShare={share}
        />
      </Reanimated.View>

      <Reanimated.View
        style={[styles.trash, { bottom: insets.bottom + ms(24) }, trashStyle]}
        pointerEvents="none"
        accessibilityLabel={t('storyEditor.dropToDelete')}
      >
        <Icon name="trash-outline" size={ms(24)} color={colors.white} />
      </Reanimated.View>

      {composing ? (
        <TextComposer initial={composing} styles={styles} onDone={finishText} />
      ) : null}

      <StickerSheet
        visible={sheet === 'stickers'}
        styles={styles}
        onPick={addSticker}
        onClose={() => setSheet(null)}
      />
      <MusicSheet
        visible={sheet === 'music'}
        styles={styles}
        selectedId={music?.id}
        isVideo={isVideo}
        onPick={pickMusic}
        onClose={() => setSheet(null)}
      />
    </View>
  );
}
