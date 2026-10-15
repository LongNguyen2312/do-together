import { useMemo, useState } from 'react';
import {
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ms } from 'react-native-size-matters';

import PhotoViewer from '@/components/PhotoViewer';
import ScreenHeader from '@/components/ScreenHeader';
import { photosIn } from '@/services/chat';
import { useAppSelector } from '@/store/hooks';
import { selectThread } from '@/store/slices/chatSlice';
import { fonts, fs, useTheme, type AppColors } from '@/theme';
import type { RootStackParamList } from '@/types/navigation';

const COLUMNS = 3;
const GAP = ms(3);

type Props = NativeStackScreenProps<RootStackParamList, 'GroupMedia'>;

export default function GroupMediaScreen({ navigation, route }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { width } = useWindowDimensions();
  const tile = (width - GAP * (COLUMNS - 1)) / COLUMNS;

  const thread = useAppSelector(state =>
    selectThread(state, route.params.activityId),
  );
  // Newest first, like a gallery.
  const photos = useMemo(() => photosIn(thread).reverse(), [thread]);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader
        title={t('chat.info.media')}
        titleAccessory={<Text style={styles.titleCount}>{photos.length}</Text>}
        onBack={navigation.goBack}
      />

      <FlatList
        data={photos}
        numColumns={COLUMNS}
        keyExtractor={(_, index) => String(index)}
        columnWrapperStyle={styles.column}
        contentContainerStyle={styles.grid}
        renderItem={({ item, index }) => (
          <Pressable
            onPress={() => setViewerIndex(index)}
            style={({ pressed }) => pressed && styles.pressed}
            accessibilityRole="imagebutton"
            accessibilityLabel={t('chat.info.openPhoto', { index: index + 1 })}
          >
            <Image
              source={item}
              style={[styles.tile, { width: tile, height: tile }]}
            />
          </Pressable>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>{t('chat.info.noPhotos')}</Text>
        }
      />

      <PhotoViewer
        photos={photos}
        startIndex={viewerIndex}
        onClose={() => setViewerIndex(null)}
      />
    </SafeAreaView>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: colors.background,
    },
    pressed: {
      opacity: 0.7,
    },
    // How many photos, by the title.
    titleCount: {
      fontSize: fs(13),
      fontFamily: fonts.medium,
      color: colors.textMuted,
    },
    grid: {
      paddingTop: ms(8),
      gap: GAP,
    },
    column: {
      gap: GAP,
    },
    tile: {
      backgroundColor: colors.surfaceHigh,
    },
    empty: {
      marginTop: ms(40),
      textAlign: 'center',
      fontSize: fs(13),
      fontFamily: fonts.regular,
      color: colors.textMuted,
    },
  });
}
