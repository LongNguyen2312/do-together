import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ms } from 'react-native-size-matters';
import Icon from 'react-native-vector-icons/Ionicons';

import Equalizer from '@/components/Equalizer';
import { fetchMusicTracks, playMusic, stopMusic } from '@/services/music';
import { useTheme } from '@/theme';
import type { MusicTrack } from '@/types/story';
import { formatDuration } from '@/utils/format';

import EditorSheet from './EditorSheet';
import { ART_GRADIENTS, type StoryEditorStyles } from './styles';

type Status = 'loading' | 'ready' | 'error';

/** Lets the sheet finish sliding up before the list moves. */
const SCROLL_DELAY_MS = 300;

/** Each song gets its own cover colours, by its place in the list. */
const artGradient = (index: number) => {
  const [from, to] = ART_GRADIENTS[index % ART_GRADIENTS.length];
  return `linear-gradient(135deg, ${from} 0%, ${to} 100%)`;
};

/** "✓ Selected", under the song (or no-song option) in use. */
function SelectedTag({ styles }: { styles: StoryEditorStyles }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  return (
    <View style={styles.selectedTag}>
      <Icon name="checkmark-circle" size={ms(13)} color={colors.white} />
      <Text style={styles.selectedTagText}>{t('storyEditor.selected')}</Text>
    </View>
  );
}

interface Props {
  visible: boolean;
  styles: StoryEditorStyles;
  selectedId?: string;
  /** A video keeps its own sound when no song is picked. */
  isVideo: boolean;
  /** `null` picks no song. */
  onPick: (track: MusicTrack | null) => void;
  onClose: () => void;
}

/** The music library from the bucket: preview a song, tap it to use it. */
export default function MusicSheet({
  visible,
  styles,
  selectedId,
  isVideo,
  onPick,
  onClose,
}: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [tracks, setTracks] = useState<MusicTrack[]>([]);
  const [status, setStatus] = useState<Status>('loading');
  const [refreshing, setRefreshing] = useState(false);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const listRef = useRef<FlatList<MusicTrack>>(null);
  const selectedIndex = tracks.findIndex(track => track.id === selectedId);

  // Opening on a song in use brings it into view, once the sheet is up.
  useEffect(() => {
    if (!visible || status !== 'ready' || selectedIndex < 0) {
      return;
    }
    const timer = setTimeout(
      () =>
        listRef.current?.scrollToIndex({
          index: selectedIndex,
          viewPosition: 0.5,
          animated: true,
        }),
      SCROLL_DELAY_MS,
    );
    return () => clearTimeout(timer);
  }, [visible, status, selectedIndex]);

  const load = useCallback(async (refresh = false) => {
    try {
      setTracks(await fetchMusicTracks(refresh));
      setStatus('ready');
    } catch {
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    if (visible) {
      load();
    } else {
      setPreviewId(null);
    }
  }, [visible, load]);

  const refresh = async () => {
    setRefreshing(true);
    await load(true);
    setRefreshing(false);
  };

  const retry = () => {
    setStatus('loading');
    load(true);
  };

  const togglePreview = (track: MusicTrack) => {
    if (previewId === track.id) {
      setPreviewId(null);
      stopMusic();
    } else {
      setPreviewId(track.id);
      // Back to the play button once the song has played through.
      playMusic(track.url, {
        durationMs: track.durationMs,
        onEnd: () =>
          setPreviewId(current => (current === track.id ? null : current)),
      });
    }
  };

  const noneSelected = !selectedId;
  const noneRow = (
    <Pressable
      onPress={() => onPick(null)}
      style={({ pressed }) => [
        styles.track,
        noneSelected && styles.trackSelected,
        pressed && styles.pressed,
      ]}
      accessibilityRole="button"
      accessibilityState={{ selected: noneSelected }}
    >
      <View
        style={[
          styles.trackArt,
          styles.trackArtPlain,
          noneSelected && styles.trackArtOn,
        ]}
      >
        <Icon
          name={isVideo ? 'videocam' : 'volume-mute'}
          size={ms(19)}
          color={noneSelected ? colors.white : colors.textSecondary}
        />
      </View>
      <View style={styles.trackBody}>
        <Text style={[styles.trackTitle, noneSelected && styles.textOn]}>
          {isVideo ? t('storyEditor.originalSound') : t('storyEditor.noMusic')}
        </Text>
        {noneSelected ? <SelectedTag styles={styles} /> : null}
      </View>
    </Pressable>
  );

  const renderTrack = ({
    item,
    index,
  }: {
    item: MusicTrack;
    index: number;
  }) => {
    const previewing = previewId === item.id;
    const selected = item.id === selectedId;
    return (
      <Pressable
        onPress={() => onPick(item)}
        style={({ pressed }) => [
          styles.track,
          selected && styles.trackSelected,
          pressed && styles.pressed,
        ]}
        accessibilityRole="button"
        accessibilityState={{ selected }}
      >
        <View
          style={[styles.trackArt, { backgroundImage: artGradient(index) }]}
        >
          {previewing ? (
            <Equalizer
              height={ms(18)}
              barWidth={ms(3.5)}
              color={colors.white}
            />
          ) : (
            <Icon name="musical-note" size={ms(19)} color={colors.white} />
          )}
        </View>
        <View style={styles.trackBody}>
          <Text
            style={[styles.trackTitle, selected && styles.textOn]}
            numberOfLines={1}
          >
            {item.title}
          </Text>
          <View style={styles.trackMetaRow}>
            <Text style={[styles.trackMeta, selected && styles.metaOn]}>
              {formatDuration(item.durationMs)}
            </Text>
            {previewing ? (
              <Text
                style={[
                  styles.trackMeta,
                  styles.trackMetaLive,
                  selected && styles.textOn,
                ]}
              >
                {' · '}
                {t('storyEditor.previewing')}
              </Text>
            ) : null}
          </View>
          {selected ? <SelectedTag styles={styles} /> : null}
        </View>
        <Pressable
          onPress={() => togglePreview(item)}
          hitSlop={ms(8)}
          style={({ pressed }) => [
            styles.trackPreview,
            previewing && styles.trackPreviewLive,
            // White on the selected row's orange, whatever it's doing.
            selected && styles.trackPreviewOn,
            pressed && styles.pressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel={
            previewing ? t('storyEditor.stopPreview') : t('storyEditor.preview')
          }
        >
          <Icon
            name={previewing ? 'pause' : 'play'}
            size={ms(18)}
            color={
              selected
                ? colors.primary
                : previewing
                ? colors.white
                : colors.text
            }
          />
        </Pressable>
      </Pressable>
    );
  };

  return (
    <EditorSheet
      visible={visible}
      title={t('storyEditor.musicTitle')}
      subtitle={
        status === 'ready' && tracks.length
          ? t('storyEditor.musicCount', { count: tracks.length })
          : undefined
      }
      styles={styles}
      onClose={onClose}
    >
      {status === 'loading' ? (
        <View style={styles.sheetState}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : status === 'error' ? (
        <View style={styles.sheetState}>
          <Text style={styles.sheetStateText}>
            {t('storyEditor.musicError')}
          </Text>
          <Pressable
            onPress={retry}
            style={({ pressed }) => [styles.retry, pressed && styles.pressed]}
            accessibilityRole="button"
          >
            <Text style={styles.retryText}>{t('storyEditor.retry')}</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={tracks}
          // Rows are only measured once drawn; all of them are, but just in case.
          onScrollToIndexFailed={({ averageItemLength, index }) =>
            listRef.current?.scrollToOffset({
              offset: averageItemLength * index,
              animated: true,
            })
          }
          keyExtractor={track => track.id}
          renderItem={renderTrack}
          ListHeaderComponent={noneRow}
          ListEmptyComponent={
            <View style={styles.sheetState}>
              <Text style={styles.sheetStateText}>
                {t('storyEditor.musicEmpty')}
              </Text>
            </View>
          }
          contentContainerStyle={[
            styles.musicList,
            { paddingBottom: insets.bottom + ms(16) },
          ]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={refresh}
              tintColor={colors.primary}
            />
          }
        />
      )}
    </EditorSheet>
  );
}
