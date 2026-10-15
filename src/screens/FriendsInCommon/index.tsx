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

import ScreenHeader from '@/components/ScreenHeader';
import { useFriends } from '@/hooks/useFriends';
import { CATEGORY_EMOJI } from '@/services/mockData';
import { friendsInCommon, type FriendInCommon } from '@/services/profile';
import { useAppSelector } from '@/store/hooks';
import { fonts, fs, useTheme, type AppColors } from '@/theme';
import type { RootStackParamList } from '@/types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'FriendsInCommon'>;

const AVATAR_SIZE = ms(48);
const ROW_PADDING = ms(14);

/**
 * Friends who like some of the same things as the user, the most in common
 * first, each with what they both like.
 */
export default function FriendsInCommonScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const interests = useAppSelector(state => state.auth.user?.interests);
  const customInterests = useAppSelector(
    state => state.auth.user?.customInterests,
  );
  const myFriends = useFriends();
  const friends = useMemo(
    () => friendsInCommon(interests ?? [], myFriends, customInterests ?? []),
    [interests, myFriends, customInterests],
  );

  const renderFriend = ({
    item,
    index,
  }: {
    item: FriendInCommon;
    index: number;
  }) => (
    <Pressable
      onPress={() =>
        navigation.navigate('UserProfile', { userId: item.friend.id })
      }
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
      accessibilityRole="button"
    >
      <Image source={item.friend.avatar} style={styles.avatar} />
      {/* Lined off from the one above, past the photos. */}
      <View style={[styles.body, index > 0 && styles.divider]}>
        <Text style={styles.name} numberOfLines={1}>
          {item.friend.name}
        </Text>
        <Text style={styles.meta}>
          {t('profile.inCommon.shared', {
            count: item.shared.length + item.sharedCustom.length,
          })}
        </Text>
        <View style={styles.chips}>
          {item.shared.map(category => (
            <View key={category} style={styles.chip}>
              <Text style={styles.chipEmoji}>{CATEGORY_EMOJI[category]}</Text>
              <Text style={styles.chipText}>
                {t(`imFree.activities.${category}`)}
              </Text>
            </View>
          ))}
          {item.sharedCustom.map(interest => (
            <View key={interest.id} style={styles.chip}>
              <Text style={styles.chipEmoji}>{interest.emoji}</Text>
              <Text style={styles.chipText}>{interest.name}</Text>
            </View>
          ))}
        </View>
      </View>
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader
        title={t('profile.inCommon.title')}
        onBack={navigation.goBack}
      />
      <FlatList
        data={friends}
        keyExtractor={({ friend }) => friend.id}
        renderItem={renderFriend}
        ListHeaderComponent={
          friends.length ? (
            <Text style={styles.intro}>
              {t('profile.inCommon.count', { count: friends.length })}
            </Text>
          ) : undefined
        }
        ListEmptyComponent={
          <Text style={styles.empty}>{t('profile.inCommon.empty')}</Text>
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
    list: {
      flexGrow: 1,
      paddingHorizontal: ms(16),
      paddingTop: ms(8),
      paddingBottom: ms(32),
    },
    intro: {
      marginBottom: ms(6),
      fontSize: fs(13),
      fontFamily: fonts.regular,
      color: colors.textSecondary,
    },
    pressed: {
      opacity: 0.7,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: ms(12),
    },
    divider: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
    },
    avatar: {
      marginTop: ROW_PADDING,
      width: AVATAR_SIZE,
      height: AVATAR_SIZE,
      borderRadius: AVATAR_SIZE / 2,
      backgroundColor: colors.surfaceHigh,
    },
    body: {
      flex: 1,
      paddingVertical: ROW_PADDING,
    },
    name: {
      fontSize: fs(15),
      fontFamily: fonts.semibold,
      color: colors.text,
    },
    meta: {
      marginTop: ms(1),
      fontSize: fs(12.5),
      fontFamily: fonts.regular,
      color: colors.textMuted,
    },
    // What they both like, as on the profile.
    chips: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: ms(6),
      marginTop: ms(8),
    },
    chip: {
      height: ms(28),
      flexDirection: 'row',
      alignItems: 'center',
      gap: ms(5),
      paddingHorizontal: ms(10),
      borderRadius: ms(14),
      backgroundColor: colors.surface,
    },
    chipEmoji: {
      fontSize: fs(12.5),
    },
    chipText: {
      fontSize: fs(12),
      fontFamily: fonts.semibold,
      color: colors.text,
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
