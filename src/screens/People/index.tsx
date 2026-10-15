import { useMemo } from 'react';
import {
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ms } from 'react-native-size-matters';
import Icon from 'react-native-vector-icons/Ionicons';

import ScreenHeader from '@/components/ScreenHeader';
import { useFriendIds, useFriends } from '@/hooks/useFriends';
import { followerList } from '@/services/mockData';
import { fonts, fs, useTheme, type AppColors } from '@/theme';
import type { User } from '@/types/activity';
import type { RootStackParamList } from '@/types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'People'>;

const AVATAR_SIZE = ms(48);
const ROW_PADDING = ms(12);

/**
 * The user's friends, or the people following them (friends among them
 * marked); each opens their profile.
 */
export default function PeopleScreen({ navigation, route }: Props) {
  const { kind } = route.params;
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const friends = useFriends();
  const friendIds = useFriendIds();
  const people = useMemo(
    () => (kind === 'friends' ? friends : followerList()),
    [kind, friends],
  );

  const renderPerson = ({ item, index }: { item: User; index: number }) => (
    <Pressable
      onPress={() => navigation.navigate('UserProfile', { userId: item.id })}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
      accessibilityRole="button"
    >
      <Image source={item.avatar} style={styles.avatar} />
      {/* Lined off from the one above, past the photos. */}
      <View style={[styles.body, index > 0 && styles.divider]}>
        <View style={styles.text}>
          <Text style={styles.name} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.note} numberOfLines={1}>
            {item.note}
          </Text>
        </View>
        {kind === 'followers' && friendIds.has(item.id) ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {t('profile.people.friendBadge')}
            </Text>
          </View>
        ) : null}
        <Icon name="chevron-forward" size={ms(16)} color={colors.textMuted} />
      </View>
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader
        title={t(`profile.people.${kind}`, { count: people.length })}
        onBack={navigation.goBack}
      />
      <FlatList
        data={people}
        keyExtractor={person => person.id}
        renderItem={renderPerson}
        ListEmptyComponent={
          <Text style={styles.empty}>
            {kind === 'friends'
              ? t('profile.people.emptyFriends')
              : t('profile.people.emptyFollowers')}
          </Text>
        }
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
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
    list: {
      flexGrow: 1,
      paddingHorizontal: ms(16),
      paddingTop: ms(4),
      paddingBottom: ms(32),
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: ms(12),
    },
    avatar: {
      width: AVATAR_SIZE,
      height: AVATAR_SIZE,
      borderRadius: AVATAR_SIZE / 2,
      backgroundColor: colors.surfaceHigh,
    },
    body: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: ms(8),
      paddingVertical: ROW_PADDING,
    },
    divider: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
    },
    text: {
      flex: 1,
    },
    name: {
      fontSize: fs(15),
      fontFamily: fonts.semibold,
      color: colors.text,
    },
    note: {
      marginTop: ms(2),
      fontSize: fs(12.5),
      fontFamily: fonts.regular,
      color: colors.textMuted,
    },
    badge: {
      paddingHorizontal: ms(8),
      paddingVertical: ms(3),
      borderRadius: ms(10),
      backgroundColor: colors.primarySoft,
    },
    badgeText: {
      fontSize: fs(11.5),
      fontFamily: fonts.semibold,
      color: colors.primaryDark,
    },
    empty: {
      marginTop: ms(48),
      paddingHorizontal: ms(24),
      textAlign: 'center',
      fontSize: fs(13.5),
      fontFamily: fonts.regular,
      color: colors.textSecondary,
    },
  });
}
