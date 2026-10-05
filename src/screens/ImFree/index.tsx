import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { ms } from 'react-native-size-matters';

import PrimaryButton from '@/components/PrimaryButton';
import PulseDot from '@/components/PulseDot';
import RangeSlider from '@/components/RangeSlider';
import { useTheme } from '@/theme';
import type {
  BroadcastActivityId,
  BroadcastDuration,
  BroadcastTime,
  BroadcastWhen,
} from '@/types/broadcast';
import type { RootStackParamList } from '@/types/navigation';

import {
  ACTIVITIES,
  DURATIONS,
  estimateNearby,
  formatClock,
  NEARBY_PREVIEW,
  NOTE_MAX_LENGTH,
  RADIUS_KM,
  WHEN_OPTIONS,
} from './data';
import { createStyles } from './styles';
import TimePickerSheet from './TimePickerSheet';

/** Simulated broadcast round-trip until the API exists. */
const BROADCAST_MS = 1100;

type Props = NativeStackScreenProps<RootStackParamList, 'ImFree'>;

export default function ImFreeScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();

  const [activity, setActivity] = useState<BroadcastActivityId>('running');
  const [when, setWhen] = useState<BroadcastWhen>('now');
  const [duration, setDuration] = useState<BroadcastDuration>('1h');
  const [note, setNote] = useState('');
  const [radius, setRadius] = useState(RADIUS_KM.initial);
  const [broadcasting, setBroadcasting] = useState(false);
  const [keyboardShown, setKeyboardShown] = useState(false);
  const [customTime, setCustomTime] = useState<BroadcastTime | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const customSelected = when === 'custom' && customTime !== null;

  // Android resizes the window (adjustResize), which would lift the footer above the keyboard.
  const hideFooter = Platform.OS === 'android' && keyboardShown;

  useEffect(() => {
    if (Platform.OS !== 'android') {
      return;
    }
    const show = Keyboard.addListener('keyboardDidShow', () =>
      setKeyboardShown(true),
    );
    const hide = Keyboard.addListener('keyboardDidHide', () =>
      setKeyboardShown(false),
    );
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  const nearby = estimateNearby(radius);
  const activityLabel = t(`imFree.activities.${activity}`);

  const onBroadcast = () => {
    Keyboard.dismiss();
    setBroadcasting(true);
    setTimeout(() => {
      setBroadcasting(false);
      Alert.alert(
        t('imFree.broadcastTitle'),
        t('imFree.broadcastMessage', { activity: activityLabel }),
        [{ text: t('common.ok'), onPress: navigation.goBack }],
      );
    }, BROADCAST_MS);
  };

  const avatarColors = [
    { backgroundColor: colors.surfaceHigh, color: colors.text },
    { backgroundColor: colors.mint, color: colors.success },
    { backgroundColor: colors.primarySoft, color: colors.primaryDark },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Pressable
            onPress={navigation.goBack}
            hitSlop={8}
            style={styles.iconButton}
            accessibilityRole="button"
            accessibilityLabel={t('auth.back')}
          >
            <Icon name="arrow-back" size={ms(22)} color={colors.text} />
          </Pressable>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {t('imFree.title')}
          </Text>
        </View>
      </View>

      <View style={styles.flex}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          automaticallyAdjustKeyboardInsets
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.heading}>{t('imFree.heading')}</Text>
          <Text style={styles.subheading}>{t('imFree.subheading')}</Text>

          <View style={styles.grid}>
            {ACTIVITIES.map(item => {
              const selected = item.id === activity;
              return (
                <Pressable
                  key={item.id}
                  onPress={() => setActivity(item.id)}
                  style={({ pressed }) => [
                    styles.tile,
                    selected && styles.tileSelected,
                    pressed && styles.pressed,
                  ]}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                >
                  {selected ? (
                    <View style={styles.tileCheck}>
                      <Icon
                        name="checkmark"
                        size={ms(10)}
                        color={colors.white}
                      />
                    </View>
                  ) : null}
                  {item.emoji ? (
                    <Text style={styles.tileEmoji}>{item.emoji}</Text>
                  ) : (
                    <Icon
                      name="add-circle-outline"
                      size={ms(24)}
                      color={colors.primary}
                    />
                  )}
                  <Text
                    style={[styles.tileLabel, selected && styles.tileLabelOn]}
                    numberOfLines={1}
                  >
                    {t(`imFree.activities.${item.id}`)}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardTitleRow}>
                <Icon
                  name="time-outline"
                  size={ms(18)}
                  color={colors.primary}
                />
                <Text style={styles.cardTitle}>{t('imFree.when')}</Text>
              </View>
              {when === 'now' ? (
                <View style={styles.instantRow}>
                  <PulseDot color={colors.primary} size={ms(6)} />
                  <Text style={styles.instantText}>
                    {t('imFree.instantMatch')}
                  </Text>
                </View>
              ) : null}
            </View>
            <View style={styles.pillWrap}>
              {WHEN_OPTIONS.map(option => {
                const selected = option === when;
                return (
                  <Pressable
                    key={option}
                    onPress={() => setWhen(option)}
                    style={[styles.pill, selected && styles.pillOn]}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                  >
                    <Text
                      style={[styles.pillText, selected && styles.pillTextOn]}
                    >
                      {t(`imFree.whenOptions.${option}`)}
                    </Text>
                  </Pressable>
                );
              })}
              <Pressable
                onPress={() => {
                  Keyboard.dismiss();
                  setPickerOpen(true);
                }}
                style={[
                  styles.pill,
                  styles.pillRow,
                  customSelected && styles.pillOn,
                ]}
                accessibilityRole="radio"
                accessibilityState={{ selected: customSelected }}
              >
                <Text
                  style={[styles.pillText, customSelected && styles.pillTextOn]}
                >
                  {customTime
                    ? t('imFree.customTime', {
                        day: t(`imFree.${customTime.day}`),
                        time: formatClock(customTime.hour, customTime.minute),
                      })
                    : t('imFree.pickTime')}
                </Text>
                <Icon
                  name="chevron-down"
                  size={ms(14)}
                  color={customSelected ? colors.white : colors.text}
                />
              </Pressable>
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.cardTitleRow}>
              <Icon
                name="hourglass-outline"
                size={ms(17)}
                color={colors.textSecondary}
              />
              <Text style={styles.cardTitle}>{t('imFree.duration')}</Text>
            </View>
            <View style={styles.durationRow}>
              {DURATIONS.map(option => {
                const selected = option === duration;
                return (
                  <Pressable
                    key={option}
                    onPress={() => setDuration(option)}
                    style={[styles.durationPill, selected && styles.pillOn]}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                  >
                    <Text
                      style={[styles.pillText, selected && styles.pillTextOn]}
                    >
                      {t(`imFree.durations.${option}`)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardTitleRow}>
                <Icon
                  name="create-outline"
                  size={ms(17)}
                  color={colors.textSecondary}
                />
                <Text style={styles.cardTitle}>{t('imFree.note')}</Text>
              </View>
              <Text style={styles.hint}>{t('imFree.optional')}</Text>
            </View>
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder={t('imFree.notePlaceholder')}
              placeholderTextColor={colors.textMuted}
              selectionColor={colors.primary}
              maxLength={NOTE_MAX_LENGTH}
              multiline
              textAlignVertical="top"
              style={styles.noteInput}
              accessibilityLabel={t('imFree.note')}
            />
            <Text style={[styles.hint, styles.noteCounter]}>
              {t('imFree.noteCounter', {
                count: note.length,
                max: NOTE_MAX_LENGTH,
              })}
            </Text>
          </View>

          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardTitleRow}>
                <Icon
                  name="navigate-outline"
                  size={ms(17)}
                  color={colors.textSecondary}
                />
                <Text style={styles.cardTitle}>{t('imFree.radius')}</Text>
              </View>
              <View style={styles.radiusBadge}>
                <Text style={styles.radiusBadgeText}>
                  {t('imFree.km', { value: radius.toFixed(1) })}
                </Text>
              </View>
            </View>
            <RangeSlider
              value={radius}
              min={RADIUS_KM.min}
              max={RADIUS_KM.max}
              step={RADIUS_KM.step}
              onChange={setRadius}
              accessibilityLabel={t('imFree.radius')}
            />
            <View style={styles.scaleRow}>
              {[RADIUS_KM.min, RADIUS_KM.max / 2, RADIUS_KM.max].map(km => (
                <Text key={km} style={styles.hint}>
                  {t('imFree.km', { value: km })}
                </Text>
              ))}
            </View>
            <View style={styles.nearbyRow}>
              <View style={styles.nearbyInfo}>
                <Text style={styles.nearbyEmoji}>🔥</Text>
                <Text style={styles.nearbyText} numberOfLines={1}>
                  {t('imFree.activeNearby', { count: nearby })}
                </Text>
              </View>
              <View style={styles.avatarStack}>
                {NEARBY_PREVIEW.map((initials, i) => (
                  <View
                    key={initials}
                    style={[
                      styles.avatar,
                      i > 0 && styles.avatarOverlap,
                      { backgroundColor: avatarColors[i].backgroundColor },
                    ]}
                  >
                    <Text
                      style={[
                        styles.avatarText,
                        { color: avatarColors[i].color },
                      ]}
                    >
                      {initials}
                    </Text>
                  </View>
                ))}
                <View style={[styles.avatar, styles.avatarOverlap]}>
                  <Text style={styles.avatarText}>
                    {`+${Math.max(nearby - NEARBY_PREVIEW.length, 0)}`}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>

        {!hideFooter && (
          <View
            style={[
              styles.footer,
              { paddingBottom: Math.max(insets.bottom, ms(12)) },
            ]}
          >
            <PrimaryButton
              title={
                broadcasting
                  ? t('imFree.broadcasting')
                  : t('imFree.findBuddies', { activity: activityLabel })
              }
              leadingIcon="radio-outline"
              loading={broadcasting}
              onPress={onBroadcast}
            />
          </View>
        )}
      </View>

      <TimePickerSheet
        visible={pickerOpen}
        value={customTime}
        onClose={() => setPickerOpen(false)}
        onConfirm={time => {
          setCustomTime(time);
          setWhen('custom');
          setPickerOpen(false);
        }}
      />
    </SafeAreaView>
  );
}
