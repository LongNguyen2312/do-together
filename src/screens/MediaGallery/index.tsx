import { memo, useCallback, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Image,
  Linking,
  Pressable,
  RefreshControl,
  StatusBar,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ms } from 'react-native-size-matters';
import Icon from 'react-native-vector-icons/Ionicons';

import PullRefreshMark from '@/components/PullRefreshMark';
import { usePullRefresh } from '@/hooks/usePullRefresh';
import LogoLoader from '@/components/LogoLoader';
import { MAX_CHAT_PHOTOS, MAX_CHAT_VIDEO_MS } from '@/services/chat';
import { changeGallerySelection } from '@/services/gallery';
import { MAX_VIDEO_MS } from '@/services/stories';
import { useTheme } from '@/theme';
import type { ChatPick } from '@/types/chat';
import type { RootStackParamList } from '@/types/navigation';
import type { GalleryAlbum, GalleryAsset, StoryMedia } from '@/types/story';
import { formatDuration } from '@/utils/format';

import AlbumList from './AlbumList';
import {
  createStyles,
  GRID_COLUMNS,
  GRID_GAP,
  TILE_ASPECT,
  type StoryGalleryStyles,
} from './styles';
import { useChatPick } from './useChatPick';
import { useGallery } from './useGallery';
import { usePickMedia, VIDEO_GRACE_MS } from './usePickMedia';

type Props = NativeStackScreenProps<
  RootStackParamList,
  'StoryGallery' | 'ChatGallery'
>;

/** The first tile opens the camera. */
const CAMERA = 'camera' as const;
type Tile = typeof CAMERA | GalleryAsset;

/**
 * The camera, then the latest photos and videos (or an album's), read
 * straight from the library so it opens at once and nothing needs copying.
 *
 * - For a story (`StoryGallery`): a tap opens the editor on that photo or
 *   video (of up to 30 seconds); the camera is the story camera.
 * - For a group chat (`ChatGallery`): taps choose up to 5 photos, or one clip
 *   of up to 10 seconds, then Send hands them back to the chat; the camera is
 *   the system one, and sends what it takes straight away.
 */
export default function MediaGalleryScreen({ navigation, route }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const chatId =
    route.name === 'ChatGallery'
      ? (route.params as RootStackParamList['ChatGallery']).activityId
      : null;
  const forChat = chatId !== null;
  /** Null for the whole library. */
  const [album, setAlbum] = useState<GalleryAlbum | null>(null);
  const [choosingAlbum, setChoosingAlbum] = useState(false);
  const pullRefresh = usePullRefresh();
  const { access, assets, refreshing, refresh, loadMore, allow } =
    useGallery(album);
  const readable = access === 'granted' || access === 'limited';
  const storyPick = usePickMedia();
  const chatPick = useChatPick();
  /** The camera or the system picker is handing something over. */
  const [busy, setBusy] = useState(false);
  /** For a chat: what's chosen so far, in order. */
  const [chosen, setChosen] = useState<GalleryAsset[]>([]);

  const tileSize = useMemo(() => {
    const tileWidth = (width - GRID_GAP * (GRID_COLUMNS - 1)) / GRID_COLUMNS;
    return { width: tileWidth, height: tileWidth * TILE_ASPECT };
  }, [width]);
  const data = useMemo<Tile[]>(() => [CAMERA, ...(assets ?? [])], [assets]);
  const maxVideoMs = forChat ? MAX_CHAT_VIDEO_MS : MAX_VIDEO_MS;

  const edit = (media: StoryMedia | null) => {
    if (media) {
      navigation.navigate('StoryEditor', { media });
    }
  };

  /** Back to the chat, which sends it. */
  const sendToChat = (pick: ChatPick | null) => {
    if (pick && chatId) {
      navigation.popTo(
        'GroupChat',
        { activityId: chatId, picked: pick },
        { merge: true },
      );
    }
  };

  const sendChosen = () => {
    const first = chosen[0];
    if (!first) {
      return;
    }
    sendToChat(
      first.type === 'video'
        ? {
            key: Date.now(),
            video: {
              uri: first.uri,
              durationMs: Math.min(
                first.durationMs || MAX_CHAT_VIDEO_MS,
                MAX_CHAT_VIDEO_MS,
              ),
              width: first.width,
              height: first.height,
            },
          }
        : { key: Date.now(), photos: chosen.map(asset => asset.uri) },
    );
  };

  const chosenRef = useRef(chosen);
  chosenRef.current = chosen;
  /** A chat's choice: photos add up to 5; a clip goes alone. */
  const toggleChosen = (asset: GalleryAsset) => {
    const current = chosenRef.current;
    if (current.some(item => item.uri === asset.uri)) {
      setChosen(current.filter(item => item.uri !== asset.uri));
    } else if (asset.type === 'video') {
      if (asset.durationMs > MAX_CHAT_VIDEO_MS + VIDEO_GRACE_MS) {
        chatPick.tooLong();
      } else if (current.length) {
        chatPick.oneVideo();
      } else {
        setChosen([asset]);
      }
    } else if (current[0]?.type === 'video') {
      chatPick.oneVideo();
    } else if (current.length >= MAX_CHAT_PHOTOS) {
      chatPick.tooMany();
    } else {
      setChosen([...current, asset]);
    }
  };

  // Stable, so the tiles don't re-render with the screen.
  const pickAssetRef = useRef((_asset: GalleryAsset) => {});
  pickAssetRef.current = asset =>
    forChat ? toggleChosen(asset) : edit(storyPick.fromGallery(asset));
  const pickAsset = useCallback(
    (asset: GalleryAsset) => pickAssetRef.current(asset),
    [],
  );

  const withBusy = async <T,>(picker: () => Promise<T>) => {
    setBusy(true);
    try {
      return await picker();
    } finally {
      setBusy(false);
    }
  };

  const openCamera = async () => {
    if (forChat) {
      sendToChat(await withBusy(chatPick.fromCamera));
    } else {
      navigation.navigate('StoryCamera');
    }
  };

  const openSystemPicker = async () => {
    if (forChat) {
      sendToChat(await withBusy(chatPick.fromLibrary));
    } else {
      edit(await withBusy(storyPick.fromLibrary));
    }
  };

  const chosenFirst = chosen[0];
  const renderItem = ({ item }: { item: Tile }) => {
    if (item === CAMERA) {
      return (
        <Pressable
          onPress={openCamera}
          style={({ pressed }) => [
            styles.tile,
            styles.camera,
            tileSize,
            pressed && styles.pressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel={t('storyGallery.camera')}
        >
          <Icon name="camera" size={ms(34)} color={colors.white} />
        </Pressable>
      );
    }
    const order = forChat
      ? chosen.findIndex(asset => asset.uri === item.uri)
      : -1;
    // For a chat, what can't join the current choice is dimmed.
    const blocked =
      forChat &&
      order < 0 &&
      !!chosenFirst &&
      (chosenFirst.type === 'video' ||
        item.type === 'video' ||
        chosen.length >= MAX_CHAT_PHOTOS);
    return (
      <AssetTile
        asset={item}
        size={tileSize}
        styles={styles}
        maxVideoMs={maxVideoMs}
        selectable={forChat}
        order={order}
        dimmed={blocked}
        onPress={pickAsset}
      />
    );
  };

  const limitedNotice =
    access === 'limited' ? (
      <View style={styles.limited}>
        <Icon name="images-outline" size={ms(20)} color={colors.white} />
        <Text style={styles.limitedText}>{t('storyGallery.limited')}</Text>
        <Pressable
          onPress={changeGallerySelection}
          hitSlop={ms(8)}
          accessibilityRole="button"
        >
          <Text style={styles.link}>{t('storyGallery.manage')}</Text>
        </Pressable>
      </View>
    ) : undefined;

  const blocked = access === 'blocked';
  const footer =
    access === 'denied' || blocked ? (
      <View style={styles.footer}>
        <Icon name="images-outline" size={ms(40)} color={colors.white} />
        <Text style={styles.footerTitle}>
          {t('storyGallery.noAccessTitle')}
        </Text>
        <Text style={styles.footerText}>{t('storyGallery.noAccess')}</Text>
        <Pressable
          onPress={blocked ? Linking.openSettings : allow}
          style={({ pressed }) => [styles.button, pressed && styles.pressed]}
          accessibilityRole="button"
        >
          <Text style={styles.buttonText}>
            {blocked ? t('storyGallery.openSettings') : t('storyGallery.allow')}
          </Text>
        </Pressable>
        {/* The system picker needs no access to the whole library. */}
        <Pressable
          onPress={openSystemPicker}
          hitSlop={ms(8)}
          accessibilityRole="button"
        >
          <Text style={styles.link}>{t('storyGallery.pickInstead')}</Text>
        </Pressable>
      </View>
    ) : assets === null ? (
      <View style={styles.footer}>
        <LogoLoader color={colors.white} />
      </View>
    ) : !assets.length ? (
      <View style={styles.footer}>
        <Text style={styles.footerText}>{t('storyGallery.empty')}</Text>
      </View>
    ) : undefined;

  const pickAlbum = (picked: GalleryAlbum | null) => {
    setChoosingAlbum(false);
    setAlbum(picked);
  };

  const sendLabel =
    chosenFirst?.type === 'video'
      ? t('chatGallery.sendVideo')
      : t('chatGallery.sendPhotos', { count: chosen.length });

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={({ pressed }) => [styles.close, pressed && styles.pressed]}
          hitSlop={ms(6)}
          accessibilityRole="button"
          accessibilityLabel={t('common.close')}
        >
          <Icon name="close" size={ms(30)} color={colors.white} />
        </Pressable>
        <Text style={styles.title}>
          {forChat ? t('chatGallery.title') : t('storyGallery.title')}
        </Text>
      </View>

      {readable ? (
        <View style={styles.albumBar}>
          <Pressable
            onPress={() => setChoosingAlbum(open => !open)}
            style={({ pressed }) => [
              styles.albumButton,
              pressed && styles.pressed,
            ]}
            hitSlop={ms(8)}
            accessibilityRole="button"
            accessibilityLabel={t('storyGallery.chooseAlbum')}
            accessibilityState={{ expanded: choosingAlbum }}
          >
            <Text style={styles.albumName} numberOfLines={1}>
              {album?.title ?? t('storyGallery.recents')}
            </Text>
            <Icon
              name={choosingAlbum ? 'chevron-up' : 'chevron-down'}
              size={ms(20)}
              color={colors.white}
            />
          </Pressable>
          {forChat ? (
            <Text style={styles.limitHint}>
              {t('chatGallery.limits', {
                count: MAX_CHAT_PHOTOS,
                seconds: MAX_CHAT_VIDEO_MS / 1000,
              })}
            </Text>
          ) : null}
        </View>
      ) : null}

      {choosingAlbum ? (
        <AlbumList
          selected={album}
          styles={styles}
          bottomInset={insets.bottom}
          onPick={pickAlbum}
        />
      ) : (
        // The grid, with the pull-to-refresh mark over its top.
        <View style={styles.flex}>
          <FlatList<Tile>
            data={data}
            extraData={chosen}
            keyExtractor={item => (item === CAMERA ? CAMERA : item.uri)}
            renderItem={renderItem}
            numColumns={GRID_COLUMNS}
            columnWrapperStyle={styles.row}
            ListHeaderComponent={limitedNotice}
            ListFooterComponent={footer}
            contentContainerStyle={{
              // Clear of the send bar, when there is one.
              paddingBottom: insets.bottom + (chosen.length ? ms(72) : 0),
            }}
            onEndReached={loadMore}
            onEndReachedThreshold={1.5}
            refreshControl={
              readable ? (
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={refresh}
                  tintColor={pullRefresh.refreshTint(colors.white)}
                />
              ) : undefined
            }
            onScroll={pullRefresh.onScroll}
            scrollEventThrottle={pullRefresh.scrollEventThrottle}
            // Thumbnails are cheap, but there can be thousands: keep few mounted.
            initialNumToRender={18}
            maxToRenderPerBatch={18}
            windowSize={7}
            removeClippedSubviews
          />
          <PullRefreshMark
            scrollY={pullRefresh.scrollY}
            refreshing={refreshing}
            color={colors.white}
          />
        </View>
      )}

      {forChat && chosen.length && !choosingAlbum ? (
        <View
          style={[styles.sendBar, { paddingBottom: insets.bottom + ms(10) }]}
        >
          <Pressable
            onPress={sendChosen}
            style={({ pressed }) => [
              styles.sendButton,
              pressed && styles.pressed,
            ]}
            accessibilityRole="button"
          >
            <Text style={styles.sendText}>{sendLabel}</Text>
            <Icon name="send" size={ms(16)} color={colors.white} />
          </Pressable>
        </View>
      ) : null}

      {busy ? (
        <View style={styles.busy}>
          <LogoLoader size="large" color={colors.white} />
        </View>
      ) : null}
    </View>
  );
}

interface AssetTileProps {
  asset: GalleryAsset;
  size: { width: number; height: number };
  styles: StoryGalleryStyles;
  /** Longer clips are dimmed: they can't be used here. */
  maxVideoMs: number;
  /** Shows a round to tick (for a chat). */
  selectable: boolean;
  /** Its place in the choice, from 0; -1 if not chosen. */
  order: number;
  /** Can't join the current choice. */
  dimmed: boolean;
  onPress: (asset: GalleryAsset) => void;
}

/**
 * A photo or a video (with its length), dimmed if it can't be used; for a
 * chat, with a round that shows its number once chosen.
 */
function AssetTileView({
  asset,
  size,
  styles,
  maxVideoMs,
  selectable,
  order,
  dimmed,
  onPress,
}: AssetTileProps) {
  const { t } = useTranslation();
  const isVideo = asset.type === 'video';
  const tooLong = isVideo && asset.durationMs > maxVideoMs + VIDEO_GRACE_MS;
  const chosen = order >= 0;
  return (
    <Pressable
      onPress={() => onPress(asset)}
      style={({ pressed }) => [styles.tile, size, pressed && styles.pressed]}
      accessibilityRole="imagebutton"
      accessibilityState={selectable ? { selected: chosen } : undefined}
      accessibilityLabel={isVideo ? t('chat.video') : undefined}
    >
      {/* The library hands over a thumbnail sized to the tile. */}
      <Image
        source={{ uri: asset.uri }}
        style={[styles.tileImage, (tooLong || dimmed) && styles.tooLong]}
        resizeMode="cover"
        fadeDuration={0}
      />
      {chosen ? <View style={styles.chosenFrame} pointerEvents="none" /> : null}
      {isVideo ? (
        <Text style={styles.duration}>{formatDuration(asset.durationMs)}</Text>
      ) : null}
      {selectable ? (
        <View
          style={[styles.pickRound, chosen && styles.pickRoundOn]}
          pointerEvents="none"
        >
          {chosen ? <Text style={styles.pickNumber}>{order + 1}</Text> : null}
        </View>
      ) : null}
    </Pressable>
  );
}

const AssetTile = memo(AssetTileView);
