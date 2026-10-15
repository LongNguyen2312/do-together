import { useEffect, useState } from 'react';
import { FlatList, Image, Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ms } from 'react-native-size-matters';
import Icon from 'react-native-vector-icons/Ionicons';

import LogoLoader from '@/components/LogoLoader';
import { fetchGalleryAlbums, fetchGalleryPage } from '@/services/gallery';
import { useTheme } from '@/theme';
import type { GalleryAlbum } from '@/types/story';

import type { StoryGalleryStyles } from './styles';

interface Props {
  /** Null for the whole library. */
  selected: GalleryAlbum | null;
  styles: StoryGalleryStyles;
  bottomInset: number;
  onPick: (album: GalleryAlbum | null) => void;
}

interface Row {
  album: GalleryAlbum | null;
  coverUri?: string;
}

/** The whole library, then each album with its newest photo and its count. */
export default function AlbumList({
  selected,
  styles,
  bottomInset,
  onPick,
}: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  /** Null while loading. */
  const [rows, setRows] = useState<Row[] | null>(null);

  useEffect(() => {
    let left = false;
    Promise.all([
      fetchGalleryPage(undefined, undefined, 1).catch(() => null),
      fetchGalleryAlbums().catch(() => []),
    ]).then(([recent, albums]) => {
      if (!left) {
        setRows([
          { album: null, coverUri: recent?.assets[0]?.uri },
          ...albums.map(album => ({ album, coverUri: album.coverUri })),
        ]);
      }
    });
    return () => {
      left = true;
    };
  }, []);

  if (!rows) {
    return (
      <View style={styles.footer}>
        <LogoLoader color={colors.white} />
      </View>
    );
  }

  return (
    <FlatList
      data={rows}
      keyExtractor={row =>
        row.album ? `${row.album.type}:${row.album.title}` : 'recents'
      }
      contentContainerStyle={{ paddingBottom: bottomInset }}
      renderItem={({ item }) => {
        const isSelected =
          item.album?.title === selected?.title &&
          item.album?.type === selected?.type;
        return (
          <Pressable
            onPress={() => onPick(item.album)}
            style={({ pressed }) => [
              styles.albumRow,
              pressed && styles.pressed,
            ]}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
          >
            {item.coverUri ? (
              <Image
                source={{ uri: item.coverUri }}
                style={styles.albumCover}
                fadeDuration={0}
              />
            ) : (
              <View style={styles.albumCover} />
            )}
            <View style={styles.albumText}>
              <Text style={styles.albumTitle} numberOfLines={1}>
                {item.album?.title ?? t('storyGallery.recents')}
              </Text>
              {item.album ? (
                <Text style={styles.albumCount}>{item.album.count}</Text>
              ) : null}
            </View>
            {isSelected ? (
              <Icon name="checkmark" size={ms(22)} color={colors.primary} />
            ) : null}
          </Pressable>
        );
      }}
    />
  );
}
