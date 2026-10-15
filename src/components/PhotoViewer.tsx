import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
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
import {
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import Animated, {
  Extrapolation,
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideOutDown,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ms } from 'react-native-size-matters';
import Icon from 'react-native-vector-icons/Ionicons';

import LogoLoader from '@/components/LogoLoader';
import ZoomablePhoto from '@/components/ZoomablePhoto';
import { useSwipeToDismiss } from '@/hooks/useSwipeToDismiss';
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
  /** Just the photo, e.g. a profile photo: no long-press menu to save it. */
  bare?: boolean;
}

/**
 * Full-screen photo pager: pinch or double-tap to zoom, drag up or down to
 * close, hold a photo for a menu to save it.
 */
export default function PhotoViewer({
  photos,
  startIndex,
  onClose,
  bare = false,
}: Props) {
  /** The long-press menu, with saving the photo showing. */
  const [menuOpen, setMenuOpen] = useState(false);
  const openMenu = useCallback(() => setMenuOpen(true), []);
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  const [current, setCurrent] = useState(startIndex ?? 0);
  const [saving, setSaving] = useState(false);
  /** The photo showing is zoomed in: drags move it, not the pages. */
  const [zoomed, setZoomed] = useState(false);
  const swipe = useSwipeToDismiss(startIndex !== null, onClose, !zoomed);

  const scrollX = useSharedValue((startIndex ?? 0) * width);
  const onScroll = useAnimatedScrollHandler(event => {
    scrollX.value = event.contentOffset.x;
  });

  useEffect(() => {
    if (startIndex !== null) {
      setZoomed(false);
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
      {/* A modal is its own root: gestures need one of their own. */}
      <GestureHandlerRootView style={styles.root}>
        <Animated.View
          style={[styles.backdrop, swipe.backdropStyle]}
          pointerEvents="none"
        />
        <GestureDetector gesture={swipe.gesture}>
          <Animated.View style={[styles.root, swipe.contentStyle]}>
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
                <ZoomablePhoto
                  source={item}
                  width={width}
                  height={height}
                  onZoomChange={setZoomed}
                  onLongPress={bare ? undefined : openMenu}
                />
              )}
              scrollEnabled={!zoomed}
              onScroll={onScroll}
              scrollEventThrottle={16}
              onMomentumScrollEnd={event =>
                setCurrent(
                  Math.round(event.nativeEvent.contentOffset.x / width),
                )
              }
              showsHorizontalScrollIndicator={false}
            />
          </Animated.View>
        </GestureDetector>

        <Animated.View
          style={[
            styles.topBar,
            { paddingTop: insets.top + ms(8) },
            swipe.chromeStyle,
          ]}
        >
          <Pressable
            onPress={onClose}
            hitSlop={6}
            style={({ pressed }) => [styles.button, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel={t('photoViewer.close')}
          >
            <Icon name="close" size={ms(22)} color={colors.white} />
          </Pressable>
        </Animated.View>

        {photos.length > 1 && photos.length <= MAX_DOTS ? (
          <Animated.View
            style={[
              styles.dots,
              { bottom: insets.bottom + ms(20) },
              swipe.chromeStyle,
            ]}
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
          </Animated.View>
        ) : null}

        {/* Held down: what can be done with the photo showing. */}
        {menuOpen ? (
          <Animated.View
            entering={FadeIn.duration(160)}
            exiting={FadeOut.duration(160)}
            style={StyleSheet.absoluteFill}
          >
            <Pressable
              style={styles.menuBackdrop}
              onPress={() => setMenuOpen(false)}
              accessibilityLabel={t('common.cancel')}
            />
            <Animated.View
              entering={SlideInDown.duration(220)}
              exiting={SlideOutDown.duration(180)}
              style={[styles.menu, { paddingBottom: insets.bottom + ms(16) }]}
            >
              <View style={styles.menuHandle} />
              <Pressable
                onPress={() => {
                  setMenuOpen(false);
                  download();
                }}
                style={({ pressed }) => [
                  styles.menuRow,
                  pressed && styles.pressed,
                ]}
                accessibilityRole="button"
              >
                <Icon
                  name="download-outline"
                  size={ms(22)}
                  color={colors.text}
                />
                <Text style={styles.menuText}>{t('photoViewer.download')}</Text>
              </Pressable>
            </Animated.View>
          </Animated.View>
        ) : null}

        {saving ? (
          <View style={styles.savingBadge} pointerEvents="none">
            <LogoLoader color={colors.white} />
          </View>
        ) : null}
      </GestureHandlerRootView>
    </Modal>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    root: {
      flex: 1,
    },
    // Fades as the photo's dragged away, showing the screen beneath.
    backdrop: {
      ...StyleSheet.absoluteFill,
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
    // The long-press menu, from the bottom.
    menuBackdrop: {
      flex: 1,
      backgroundColor: `${colors.black}66`,
    },
    menu: {
      paddingHorizontal: ms(16),
      paddingTop: ms(10),
      borderTopLeftRadius: ms(24),
      borderTopRightRadius: ms(24),
      backgroundColor: colors.card,
    },
    menuHandle: {
      alignSelf: 'center',
      width: ms(38),
      height: ms(4),
      borderRadius: ms(2),
      marginBottom: ms(6),
      backgroundColor: colors.surfaceHigh,
    },
    menuRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: ms(14),
      paddingVertical: ms(18),
    },
    menuText: {
      fontSize: fs(15),
      fontFamily: fonts.medium,
      color: colors.text,
    },
    savingBadge: {
      position: 'absolute',
      alignSelf: 'center',
      top: '50%',
      padding: ms(14),
      borderRadius: ms(16),
      backgroundColor: `${colors.black}99`,
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
