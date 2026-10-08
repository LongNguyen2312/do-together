import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ScrollViewInstance,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ms } from 'react-native-size-matters';

import PrimaryButton from '@/components/PrimaryButton';
import { fonts, fs, useTheme, type AppColors } from '@/theme';
import type { BroadcastDay, BroadcastTime } from '@/types/broadcast';

import { defaultPickTime, isPastTime, MINUTE_STEP } from './data';
import { useSheetTransition } from './useSheetTransition';

const ITEM_HEIGHT = ms(40);
const VISIBLE_ITEMS = 5;
const WHEEL_WIDTH = ms(72);
const DAYS: BroadcastDay[] = ['today', 'tomorrow'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = Array.from(
  { length: 60 / MINUTE_STEP },
  (_, i) => i * MINUTE_STEP,
);

interface TimePickerSheetProps {
  visible: boolean;
  value: BroadcastTime | null;
  onClose: () => void;
  onConfirm: (time: BroadcastTime) => void;
}

export default function TimePickerSheet({
  visible,
  value,
  onClose,
  onConfirm,
}: TimePickerSheetProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();

  const [draft, setDraft] = useState<BroadcastTime>(
    () => value ?? defaultPickTime(),
  );

  useEffect(() => {
    if (visible) {
      setDraft(value ?? defaultPickTime());
    }
  }, [visible, value]);

  const past = isPastTime(draft);

  const { mounted, backdropStyle, sheetStyle, onSheetLayout } =
    useSheetTransition(visible);

  return (
    <Modal
      visible={mounted}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.root}>
        <Animated.View style={[styles.backdrop, backdropStyle]}>
          <Pressable
            style={styles.flex}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel={t('common.close')}
          />
        </Animated.View>
        <Animated.View
          onLayout={onSheetLayout}
          style={[
            styles.sheet,
            { paddingBottom: Math.max(insets.bottom, ms(16)) },
            sheetStyle,
          ]}
        >
          <View style={styles.handle} />
          <Text style={styles.title}>{t('imFree.pickTimeTitle')}</Text>

          <View style={styles.segment}>
            {DAYS.map(day => {
              const selected = draft.day === day;
              return (
                <Pressable
                  key={day}
                  onPress={() => setDraft(prev => ({ ...prev, day }))}
                  style={[styles.segmentItem, selected && styles.segmentOn]}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                >
                  <Text
                    style={[
                      styles.segmentText,
                      selected && styles.segmentTextOn,
                    ]}
                  >
                    {t(`imFree.${day}`)}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.wheels}>
            <View style={styles.wheelBand} pointerEvents="none" />
            <Wheel
              values={HOURS}
              selected={draft.hour}
              onChange={hour => setDraft(prev => ({ ...prev, hour }))}
              styles={styles}
            />
            <Text style={styles.colon}>:</Text>
            <Wheel
              values={MINUTES}
              selected={draft.minute}
              onChange={minute => setDraft(prev => ({ ...prev, minute }))}
              styles={styles}
            />
          </View>

          <Text style={[styles.hint, !past && styles.hintHidden]}>
            {t('imFree.pastTime')}
          </Text>

          <View style={styles.actions}>
            <Pressable
              onPress={onClose}
              style={styles.cancel}
              accessibilityRole="button"
            >
              <Text style={styles.cancelText}>{t('common.cancel')}</Text>
            </Pressable>
            <PrimaryButton
              title={t('common.done')}
              onPress={() => onConfirm(draft)}
              disabled={past}
              style={styles.confirm}
            />
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

interface WheelProps {
  values: number[];
  selected: number;
  onChange: (value: number) => void;
  styles: ReturnType<typeof createStyles>;
}

function Wheel({ values, selected, onChange, styles }: WheelProps) {
  const ref = useRef<ScrollViewInstance>(null);
  const selectedIndex = Math.max(values.indexOf(selected), 0);

  const scrollToIndex = (index: number, animated: boolean) => {
    ref.current?.scrollTo({ y: index * ITEM_HEIGHT, animated });
  };

  const onScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(event.nativeEvent.contentOffset.y / ITEM_HEIGHT);
    const clamped = Math.min(Math.max(index, 0), values.length - 1);
    if (values[clamped] !== selected) {
      onChange(values[clamped]);
    }
  };

  return (
    <ScrollView
      ref={ref}
      style={styles.wheel}
      contentContainerStyle={styles.wheelContent}
      showsVerticalScrollIndicator={false}
      snapToInterval={ITEM_HEIGHT}
      decelerationRate="fast"
      nestedScrollEnabled
      onLayout={() => scrollToIndex(selectedIndex, false)}
      onMomentumScrollEnd={onScrollEnd}
      onScrollEndDrag={onScrollEnd}
    >
      {values.map((value, index) => {
        const isSelected = index === selectedIndex;
        return (
          <Pressable
            key={value}
            style={styles.wheelItem}
            onPress={() => {
              scrollToIndex(index, true);
              onChange(value);
            }}
          >
            <Text style={[styles.wheelText, isSelected && styles.wheelTextOn]}>
              {String(value).padStart(2, '0')}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    root: {
      flex: 1,
      justifyContent: 'flex-end',
    },
    flex: {
      flex: 1,
    },
    backdrop: {
      ...StyleSheet.absoluteFill,
      backgroundColor: `${colors.black}66`,
    },
    sheet: {
      paddingHorizontal: ms(20),
      borderTopLeftRadius: ms(28),
      borderTopRightRadius: ms(28),
      backgroundColor: colors.card,
      gap: ms(16),
    },
    handle: {
      alignSelf: 'center',
      width: ms(36),
      height: ms(5),
      marginTop: ms(8),
      borderRadius: ms(3),
      backgroundColor: colors.border,
    },
    title: {
      fontSize: fs(17),
      fontFamily: fonts.bold,
      color: colors.text,
    },
    segment: {
      flexDirection: 'row',
      padding: ms(4),
      borderRadius: ms(999),
      backgroundColor: colors.surfaceMuted,
    },
    segmentItem: {
      flex: 1,
      paddingVertical: ms(9),
      borderRadius: ms(999),
      alignItems: 'center',
    },
    segmentOn: {
      backgroundColor: colors.card,
      shadowColor: colors.black,
      shadowOpacity: 0.08,
      shadowRadius: ms(4),
      shadowOffset: { width: 0, height: ms(1) },
      elevation: 2,
    },
    segmentText: {
      fontSize: fs(13),
      fontFamily: fonts.medium,
      color: colors.textSecondary,
    },
    segmentTextOn: {
      fontFamily: fonts.semibold,
      color: colors.text,
    },
    wheels: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: ms(8),
    },
    wheelBand: {
      position: 'absolute',
      left: 0,
      right: 0,
      top: ITEM_HEIGHT * Math.floor(VISIBLE_ITEMS / 2),
      height: ITEM_HEIGHT,
      borderRadius: ms(12),
      backgroundColor: colors.primarySoft,
    },
    wheel: {
      width: WHEEL_WIDTH,
      height: ITEM_HEIGHT * VISIBLE_ITEMS,
    },
    wheelContent: {
      paddingVertical: ITEM_HEIGHT * Math.floor(VISIBLE_ITEMS / 2),
    },
    wheelItem: {
      height: ITEM_HEIGHT,
      alignItems: 'center',
      justifyContent: 'center',
    },
    wheelText: {
      fontSize: fs(18),
      fontFamily: fonts.medium,
      color: colors.textMuted,
    },
    wheelTextOn: {
      fontSize: fs(22),
      fontFamily: fonts.bold,
      color: colors.primaryDark,
    },
    colon: {
      fontSize: fs(22),
      fontFamily: fonts.bold,
      color: colors.primaryDark,
    },
    hint: {
      marginTop: -ms(6),
      textAlign: 'center',
      fontSize: fs(12),
      fontFamily: fonts.medium,
      color: colors.danger,
    },
    hintHidden: {
      opacity: 0,
    },
    actions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: ms(12),
    },
    cancel: {
      paddingHorizontal: ms(20),
      height: ms(56),
      borderRadius: ms(999),
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surfaceMuted,
    },
    cancelText: {
      fontSize: fs(14),
      fontFamily: fonts.semibold,
      color: colors.text,
    },
    confirm: {
      flex: 1,
    },
  });
}
