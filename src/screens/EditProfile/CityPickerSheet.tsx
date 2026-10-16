import { useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { CheckIcon } from 'phosphor-react-native/src/icons/Check';
import { MagnifyingGlassIcon } from 'phosphor-react-native/src/icons/MagnifyingGlass';
import { useTranslation } from 'react-i18next';
import { ms } from 'react-native-size-matters';
import Icon from 'react-native-vector-icons/Ionicons';

import LogoLoader from '@/components/LogoLoader';
import { useDebounce } from '@/hooks/useDebounce';
import { useProvinces } from '@/hooks/useProvinces';
import { searchProvinces, type Province } from '@/services/places';
import { fonts, fs, useTheme, type AppColors } from '@/theme';

const ROW_HEIGHT = ms(56);

interface Props {
  visible: boolean;
  /** "Quê quán" or "Nơi ở hiện tại". */
  title: string;
  /** The province id picked now, if any. */
  value?: string;
  onClose: () => void;
  /** Undefined clears it. */
  onPick: (id: string | undefined) => void;
}

/**
 * A city or province, from the 34: searched as you type (once you pause),
 * accents or not, by its name or an old province's. Slides up as a sheet.
 */
export default function CityPickerSheet({
  visible,
  title,
  value,
  onClose,
  onPick,
}: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [query, setQuery] = useState('');
  const searched = useDebounce(query);
  const { provinces, loading } = useProvinces();
  const results = useMemo(
    () => searchProvinces(searched, provinces),
    [searched, provinces],
  );

  // Each opening starts from the whole list.
  const listRef = useRef<FlatList<Province>>(null);
  // Opening with a place picked: the list starts on it, in the middle.
  const pickedIndex =
    visible && !searched ? results.findIndex(place => place.id === value) : -1;
  useEffect(() => {
    if (pickedIndex < 0) {
      return;
    }
    // Once the sheet has laid the list out.
    const frame = requestAnimationFrame(() =>
      listRef.current?.scrollToIndex({
        index: pickedIndex,
        viewPosition: 0.5,
        animated: false,
      }),
    );
    return () => cancelAnimationFrame(frame);
  }, [pickedIndex]);

  useEffect(() => {
    if (visible) {
      setQuery('');
    }
  }, [visible]);

  const renderPlace = ({ item }: { item: Province }) => {
    const on = item.id === value;
    return (
      <Pressable
        onPress={() => onPick(item.id)}
        style={({ pressed }) => [styles.row, pressed && styles.pressed]}
        accessibilityRole="radio"
        accessibilityState={{ checked: on }}
      >
        <View style={styles.rowText}>
          <Text style={[styles.name, on && styles.nameOn]}>{item.name}</Text>
          <Text style={styles.kind}>
            {t(`profile.places.kind.${item.kind}`)}
          </Text>
        </View>
        {on ? (
          <CheckIcon size={ms(18)} color={colors.primary} weight="bold" />
        ) : null}
      </Pressable>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.root}>
        <View style={styles.header}>
          <Pressable
            onPress={onClose}
            hitSlop={ms(8)}
            style={styles.headerSide}
            accessibilityRole="button"
            accessibilityLabel={t('common.close')}
          >
            <Icon name="close" size={ms(24)} color={colors.text} />
          </Pressable>
          <Text style={styles.title} accessibilityRole="header">
            {title}
          </Text>
          <View style={[styles.headerSide, styles.headerRight]}>
            {value ? (
              <Pressable
                onPress={() => onPick(undefined)}
                hitSlop={ms(8)}
                accessibilityRole="button"
              >
                <Text style={styles.clear}>{t('profile.places.clear')}</Text>
              </Pressable>
            ) : null}
          </View>
        </View>

        <View style={styles.search}>
          <MagnifyingGlassIcon size={ms(18)} color={colors.textMuted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={t('profile.places.searchPlaceholder')}
            placeholderTextColor={colors.textMuted}
            selectionColor={colors.primary}
            autoCorrect={false}
            returnKeyType="search"
            style={styles.searchInput}
            accessibilityLabel={t('profile.places.searchPlaceholder')}
          />
          {query ? (
            <Pressable
              onPress={() => setQuery('')}
              hitSlop={ms(8)}
              accessibilityRole="button"
              accessibilityLabel={t('profile.pinned.clear')}
            >
              <Icon
                name="close-circle"
                size={ms(18)}
                color={colors.textMuted}
              />
            </Pressable>
          ) : null}
        </View>

        <FlatList
          ref={listRef}
          data={results}
          // Every row is the same height, so any one can be scrolled to.
          getItemLayout={(_, index) => ({
            length: ROW_HEIGHT + StyleSheet.hairlineWidth,
            offset: (ROW_HEIGHT + StyleSheet.hairlineWidth) * index,
            index,
          })}
          keyExtractor={place => place.id}
          renderItem={renderPlace}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          ItemSeparatorComponent={Separator}
          ListEmptyComponent={
            // Still waiting on the API started with the app.
            loading ? (
              <View style={styles.loading}>
                <LogoLoader color={colors.primary} size="large" />
              </View>
            ) : (
              <Text style={styles.empty}>{t('profile.places.noResults')}</Text>
            )
          }
          contentContainerStyle={styles.list}
        />
      </View>
    </Modal>
  );
}

function Separator() {
  const { colors } = useTheme();
  return (
    <View
      style={{
        height: StyleSheet.hairlineWidth,
        backgroundColor: colors.border,
      }}
    />
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.background,
    },
    pressed: {
      opacity: 0.7,
    },
    header: {
      height: ms(56),
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: ms(16),
    },
    headerSide: {
      width: ms(80),
    },
    headerRight: {
      alignItems: 'flex-end',
    },
    title: {
      flex: 1,
      textAlign: 'center',
      fontSize: fs(16),
      fontFamily: fonts.bold,
      color: colors.text,
    },
    clear: {
      fontSize: fs(14),
      fontFamily: fonts.semibold,
      color: colors.primary,
    },
    search: {
      height: ms(44),
      flexDirection: 'row',
      alignItems: 'center',
      gap: ms(8),
      marginHorizontal: ms(16),
      marginBottom: ms(8),
      paddingHorizontal: ms(14),
      borderRadius: ms(12),
      backgroundColor: colors.surface,
    },
    searchInput: {
      flex: 1,
      padding: 0,
      fontSize: fs(15),
      fontFamily: fonts.regular,
      color: colors.text,
    },
    list: {
      flexGrow: 1,
      paddingHorizontal: ms(16),
      paddingBottom: ms(32),
    },
    row: {
      height: ROW_HEIGHT,
      flexDirection: 'row',
      alignItems: 'center',
      gap: ms(12),
    },
    rowText: {
      flex: 1,
    },
    name: {
      fontSize: fs(15),
      fontFamily: fonts.medium,
      color: colors.text,
    },
    nameOn: {
      fontFamily: fonts.semibold,
      color: colors.primary,
    },
    kind: {
      marginTop: ms(1),
      fontSize: fs(12),
      fontFamily: fonts.regular,
      color: colors.textMuted,
    },
    loading: {
      marginTop: ms(48),
      alignItems: 'center',
    },
    empty: {
      marginTop: ms(40),
      textAlign: 'center',
      fontSize: fs(13.5),
      fontFamily: fonts.regular,
      color: colors.textSecondary,
    },
  });
}
