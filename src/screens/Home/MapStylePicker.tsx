import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Image,
  Modal,
  PanResponder,
  PixelRatio,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  type LngLat,
  StaticMapImageManager,
} from '@maplibre/maplibre-react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { ms } from 'react-native-size-matters';

import { fonts, fs, useTheme, type AppColors } from '@/theme';
import type { MapStyleId } from '@/types/map';
import { MAX_CONTENT_WIDTH } from '@/utils/constants';
import { MAP_STYLE_IDS, mapStyleUrl } from '@/utils/mapStyles';

const PREVIEW_WIDTH = 240;
const PREVIEW_HEIGHT = 160;
const PREVIEW_ZOOM = 13.5;
const DISMISS_RATIO = 0.25;
const DISMISS_VELOCITY = 0.8;

const previewCache: Partial<Record<MapStyleId, string>> = {};

function usePreviews(visible: boolean, center: LngLat) {
  const [previews, setPreviews] = useState(previewCache);

  useEffect(() => {
    if (!visible) {
      return;
    }
    let cancelled = false;
    const ratio = PixelRatio.get();
    MAP_STYLE_IDS.filter(id => !previewCache[id]).forEach(id => {
      StaticMapImageManager.createImage({
        mapStyle: mapStyleUrl(id),
        center,
        zoom: PREVIEW_ZOOM,
        width: PREVIEW_WIDTH * ratio,
        height: PREVIEW_HEIGHT * ratio,
        output: 'file',
        logo: false,
      })
        .then(uri => {
          previewCache[id] = uri;
          if (!cancelled) {
            setPreviews({ ...previewCache });
          }
        })
        .catch(() => {});
    });
    return () => {
      cancelled = true;
    };
  }, [visible, center]);

  return previews;
}

interface Props {
  visible: boolean;
  selected: MapStyleId;
  center: LngLat;
  onSelect: (id: MapStyleId) => void;
  onClose: () => void;
}

export default function MapStylePicker({
  visible,
  selected,
  center,
  onSelect,
  onClose,
}: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const previews = usePreviews(visible, center);

  const [mounted, setMounted] = useState(visible);
  const [sheetHeight, setSheetHeight] = useState(0);
  const progress = useRef(new Animated.Value(0)).current;
  const dragY = useRef(new Animated.Value(0)).current;
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (visible) {
      setMounted(true);
      dragY.setValue(0);
      Animated.spring(progress, {
        toValue: 1,
        useNativeDriver: true,
        bounciness: 0,
        speed: 14,
      }).start();
    } else {
      Animated.timing(progress, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }).start(({ finished }) => finished && setMounted(false));
    }
  }, [visible, progress, dragY]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, { dx, dy }) =>
          dy > 6 && Math.abs(dy) > Math.abs(dx),
        onPanResponderMove: (_, { dy }) => dragY.setValue(Math.max(dy, 0)),
        onPanResponderRelease: (_, { dy, vy }) => {
          if (dy > sheetHeight * DISMISS_RATIO || vy > DISMISS_VELOCITY) {
            onCloseRef.current();
          } else {
            Animated.spring(dragY, {
              toValue: 0,
              useNativeDriver: true,
              bounciness: 0,
            }).start();
          }
        },
      }),
    [dragY, sheetHeight],
  );

  const translateY = Animated.add(
    progress.interpolate({
      inputRange: [0, 1],
      outputRange: [sheetHeight || 1000, 0],
    }),
    dragY,
  );

  return (
    <Modal
      visible={mounted}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Animated.View style={[styles.backdrop, { opacity: progress }]}>
        <Pressable
          style={styles.fill}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel={t('common.close')}
        />
      </Animated.View>
      <View style={styles.container} pointerEvents="box-none">
        <Animated.View
          {...panResponder.panHandlers}
          onLayout={event => setSheetHeight(event.nativeEvent.layout.height)}
          style={[
            styles.sheet,
            {
              paddingBottom: insets.bottom + ms(16),
              transform: [{ translateY }],
            },
          ]}
        >
          <View style={styles.handle} />
          <View style={styles.content}>
            <View style={styles.header}>
              <Text style={styles.title}>{t('home.mapStyles.title')}</Text>
              <Pressable
                onPress={onClose}
                hitSlop={8}
                style={styles.closeButton}
                accessibilityRole="button"
                accessibilityLabel={t('common.close')}
              >
                <Icon name="close" size={ms(18)} color={colors.text} />
              </Pressable>
            </View>
            <View style={styles.grid}>
              {MAP_STYLE_IDS.map(id => {
                const active = id === selected;
                const uri = previews[id];
                return (
                  <Pressable
                    key={id}
                    onPress={() => onSelect(id)}
                    style={({ pressed }) => [
                      styles.option,
                      pressed && styles.pressed,
                    ]}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    accessibilityLabel={t(`home.mapStyles.${id}`)}
                  >
                    <View
                      style={[styles.preview, active && styles.previewActive]}
                    >
                      {uri ? (
                        <Image source={{ uri }} style={styles.previewImage} />
                      ) : (
                        <ActivityIndicator color={colors.textSecondary} />
                      )}
                      {active ? (
                        <View style={styles.check}>
                          <Icon
                            name="checkmark"
                            size={ms(12)}
                            color={colors.white}
                          />
                        </View>
                      ) : null}
                    </View>
                    <Text
                      style={[styles.label, active && styles.labelActive]}
                      numberOfLines={1}
                    >
                      {t(`home.mapStyles.${id}`)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    backdrop: {
      ...StyleSheet.absoluteFill,
      backgroundColor: 'rgba(0, 0, 0, 0.35)',
    },
    fill: {
      flex: 1,
    },
    container: {
      flex: 1,
      justifyContent: 'flex-end',
    },
    sheet: {
      paddingTop: ms(8),
      paddingHorizontal: ms(16),
      borderTopLeftRadius: ms(28),
      borderTopRightRadius: ms(28),
      backgroundColor: colors.card,
      shadowColor: colors.black,
      shadowOpacity: 0.12,
      shadowRadius: ms(16),
      shadowOffset: { width: 0, height: -ms(4) },
      elevation: 12,
    },
    handle: {
      alignSelf: 'center',
      width: ms(36),
      height: ms(5),
      marginBottom: ms(10),
      borderRadius: ms(3),
      backgroundColor: colors.border,
    },
    content: {
      width: '100%',
      maxWidth: MAX_CONTENT_WIDTH,
      alignSelf: 'center',
      gap: ms(14),
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    title: {
      fontSize: fs(16),
      lineHeight: fs(21),
      fontFamily: fonts.semibold,
      color: colors.text,
    },
    closeButton: {
      width: ms(30),
      height: ms(30),
      borderRadius: ms(15),
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surfaceMuted,
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      rowGap: ms(14),
    },
    option: {
      width: '48%',
      gap: ms(6),
    },
    pressed: {
      opacity: 0.85,
      transform: [{ scale: 0.97 }],
    },
    preview: {
      aspectRatio: PREVIEW_WIDTH / PREVIEW_HEIGHT,
      borderRadius: ms(14),
      borderWidth: 2,
      borderColor: colors.border,
      overflow: 'hidden',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surfaceMuted,
    },
    previewActive: {
      borderColor: colors.primary,
    },
    previewImage: {
      ...StyleSheet.absoluteFill,
    },
    check: {
      position: 'absolute',
      top: ms(6),
      right: ms(6),
      width: ms(20),
      height: ms(20),
      borderRadius: ms(10),
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primary,
    },
    label: {
      fontSize: fs(12.5),
      lineHeight: fs(16),
      fontFamily: fonts.medium,
      textAlign: 'center',
      color: colors.textSecondary,
    },
    labelActive: {
      fontFamily: fonts.semibold,
      color: colors.primary,
    },
  });
}
