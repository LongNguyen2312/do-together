import { useMemo } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
  type ListRenderItem,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ms } from 'react-native-size-matters';
import Icon from 'react-native-vector-icons/Ionicons';

import type { PagedList } from '@/hooks/usePagedList';
import { fonts, fs, useTheme, type AppColors } from '@/theme';

const SCREEN_PADDING = ms(16);
const BACK_SIZE = ms(38);

/** Full-screen list with a back header, pull-to-refresh and load-more. */
export default function PagedListScreen<T>({
  title,
  subtitle,
  onBack,
  list,
  renderItem,
  keyExtractor,
  extraData,
  itemGap = ms(12),
  emptyText,
}: {
  title: string;
  subtitle?: string;
  onBack: () => void;
  list: PagedList<T>;
  renderItem: ListRenderItem<T>;
  keyExtractor: (item: T) => string;
  extraData?: unknown;
  itemGap?: number;
  emptyText: string;
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const { items, loading, failed } = list;

  const footer = () => {
    if (loading === 'more') {
      return (
        <View style={styles.footer}>
          <ActivityIndicator color={colors.primary} />
        </View>
      );
    }
    if (failed && items.length) {
      return (
        <Pressable
          onPress={list.retryMore}
          style={styles.footer}
          accessibilityRole="button"
        >
          <Text style={styles.message}>{t('discover.loadFailed')}</Text>
        </Pressable>
      );
    }
    return null;
  };

  const empty = () => (
    <View style={styles.center}>
      {loading === 'initial' ? (
        <ActivityIndicator color={colors.primary} />
      ) : (
        <Text style={styles.message}>
          {failed ? t('discover.loadFailed') : emptyText}
        </Text>
      )}
    </View>
  );

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + ms(8) }]}>
        <Pressable
          onPress={onBack}
          hitSlop={6}
          style={({ pressed }) => [
            styles.backButton,
            pressed && styles.pressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel={t('auth.back')}
        >
          <Icon name="chevron-back" size={ms(20)} color={colors.text} />
        </Pressable>
        <View style={styles.headerText}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>

      <FlatList
        data={items}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        extraData={extraData}
        contentContainerStyle={[
          styles.list,
          { gap: itemGap, paddingBottom: insets.bottom + ms(16) },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading === 'refresh'}
            onRefresh={list.refresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        onEndReached={list.loadMore}
        onEndReachedThreshold={0.4}
        ListFooterComponent={footer}
        ListEmptyComponent={empty}
      />
    </View>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: ms(10),
      paddingHorizontal: SCREEN_PADDING,
      paddingBottom: ms(8),
    },
    backButton: {
      width: BACK_SIZE,
      height: BACK_SIZE,
      borderRadius: BACK_SIZE / 2,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.card,
      shadowColor: colors.black,
      shadowOpacity: 0.08,
      shadowRadius: ms(8),
      shadowOffset: { width: 0, height: ms(2) },
      elevation: 3,
    },
    pressed: {
      opacity: 0.7,
    },
    headerText: {
      flex: 1,
    },
    title: {
      fontSize: fs(15.5),
      lineHeight: fs(20),
      fontFamily: fonts.bold,
      color: colors.text,
    },
    subtitle: {
      fontSize: fs(11.5),
      lineHeight: fs(15),
      fontFamily: fonts.regular,
      color: colors.textSecondary,
    },
    list: {
      flexGrow: 1,
      paddingTop: ms(8),
      paddingHorizontal: SCREEN_PADDING,
    },
    center: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: ms(32),
    },
    footer: {
      alignItems: 'center',
      paddingVertical: ms(16),
    },
    message: {
      fontSize: fs(13),
      lineHeight: fs(18),
      fontFamily: fonts.regular,
      textAlign: 'center',
      color: colors.textSecondary,
    },
  });
}
