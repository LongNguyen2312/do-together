import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type ViewStyle,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ms } from 'react-native-size-matters';
import Icon from 'react-native-vector-icons/Ionicons';

import { fonts, fs, useTheme, type AppColors } from '@/theme';
import type { ChatPhoto } from '@/types/chat';
import { savePhoto } from '@/utils/savePhoto';

const BUTTON = ms(40);
const MAX_DOTS = 10;
const DOT = ms(6);
const DOT_ACTIVE = ms(16);

interface Props {
  photos: readonly ChatPhoto[];
  /** Photo to open on; null keeps the viewer closed. */
  startIndex: number | null;
  onClose: () => void;
}

/** Full-screen photo pager with a download button. */
export default function PhotoViewer({ photos, startIndex, onClose }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  const [current, setCurrent] = useState(startIndex ?? 0);
  const [saving, setSaving] = useState(false);

  const scrollX = useSharedValue((startIndex ?? 0) * width);
  const onScroll = useAnimatedScrollHandler(event => {
    scrollX.value = event.contentOffset.x;
  });

  useEffect(() => {
    if (startIndex !== null) {
      setCurrent(startIndex);
      scrollX.value = startIndex * width;
    }
  }, [startIndex, width, scrollX]);

  const download = async () => {
    const photo = photos[current];
    if (photo === undefined || saving) {
      return;
    }
    setSaving(true);
    try {
      const result = await savePhoto(photo);
      if (result === 'saved') {
        Alert.alert(t('photoViewer.savedTitle'), t('photoViewer.savedMessage'));
      } else if (result === 'denied') {
        Alert.alert(
          t('photoViewer.deniedTitle'),
          t('photoViewer.deniedMessage'),
        );
      } else {
        Alert.alert(
          t('photoViewer.deniedTitle'),
          t('photoViewer.blockedMessage'),
          [
            { text: t('common.cancel'), style: 'cancel' },
            {
              text: t('photoViewer.openSettings'),
              onPress: () => Linking.openSettings(),
            },
          ],
        );
      }
    } catch (error) {
      if (__DEV__) {
        console.warn('Saving photo failed', error);
      }
      Alert.alert(t('photoViewer.failedTitle'), t('photoViewer.failedMessage'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      visible={startIndex !== null}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.root}>
        <Animated.FlatList
          key={`${startIndex}-${width}`}
          data={photos}
          horizontal
          pagingEnabled
          initialScrollIndex={startIndex ?? 0}
          getItemLayout={(_, index) => ({
            length: width,
            offset: width * index,
            index,
          })}
          keyExtractor={(_, index) => String(index)}
          renderItem={({ item }) => (
            <Image
              source={item}
              style={{ width, height }}
              resizeMode="contain"
            />
          )}
          onScroll={onScroll}
          scrollEventThrottle={16}
          onMomentumScrollEnd={event =>
            setCurrent(Math.round(event.nativeEvent.contentOffset.x / width))
          }
          showsHorizontalScrollIndicator={false}
        />

        <View style={[styles.topBar, { paddingTop: insets.top + ms(8) }]}>
          <Pressable
            onPress={onClose}
            hitSlop={6}
            style={({ pressed }) => [styles.button, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel={t('photoViewer.close')}
          >
            <Icon name="close" size={ms(22)} color={colors.white} />
          </Pressable>
          <Text style={styles.counter}>
            {t('photoViewer.counter', {
              current: current + 1,
              total: photos.length,
            })}
          </Text>
          <Pressable
            onPress={download}
            disabled={saving}
            hitSlop={6}
            style={({ pressed }) => [styles.button, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel={t('photoViewer.download')}
            accessibilityState={{ busy: saving }}
          >
            {saving ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Icon
                name="download-outline"
                size={ms(20)}
                color={colors.white}
              />
            )}
          </Pressable>
        </View>

        {photos.length > 1 && photos.length <= MAX_DOTS ? (
          <View
            style={[styles.dots, { bottom: insets.bottom + ms(20) }]}
            pointerEvents="none"
          >
            {photos.map((_, index) => (
              <Dot
                key={index}
                index={index}
                scrollX={scrollX}
                pageWidth={width}
                style={styles.dot}
              />
            ))}
          </View>
        ) : null}
      </View>
    </Modal>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.black,
    },
    topBar: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: ms(16),
    },
    button: {
      width: BUTTON,
      height: BUTTON,
      borderRadius: BUTTON / 2,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: `${colors.white}26`,
    },
    pressed: {
      opacity: 0.7,
    },
    counter: {
      fontSize: fs(14),
      fontFamily: fonts.semibold,
      color: colors.white,
    },
    dots: {
      position: 'absolute',
      left: 0,
      right: 0,
      flexDirection: 'row',
      justifyContent: 'center',
      gap: ms(6),
    },
    dot: {
      height: DOT,
      borderRadius: DOT / 2,
      backgroundColor: colors.white,
    },
  });
}

/** Stretches and brightens as its page scrolls into view. */
function Dot({
  index,
  scrollX,
  pageWidth,
  style,
}: {
  index: number;
  scrollX: SharedValue<number>;
  pageWidth: number;
  style: ViewStyle;
}) {
  const animatedStyle = useAnimatedStyle(() => {
    const page = pageWidth > 0 ? scrollX.value / pageWidth : 0;
    const range = [index - 1, index, index + 1];
    return {
      width: interpolate(
        page,
        range,
        [DOT, DOT_ACTIVE, DOT],
        Extrapolation.CLAMP,
      ),
      opacity: interpolate(page, range, [0.35, 1, 0.35], Extrapolation.CLAMP),
    };
  });
  return <Animated.View style={[style, animatedStyle]} />;
}
