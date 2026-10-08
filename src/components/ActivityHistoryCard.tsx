import { memo, useMemo } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ms } from 'react-native-size-matters';
import Icon from 'react-native-vector-icons/Ionicons';

import { CATEGORY_EMOJI, getUser } from '@/services/mockData';
import { fonts, fs, useTheme, type AppColors } from '@/theme';
import type { Activity } from '@/types/activity';
import { dateTimeIn } from '@/utils/format';

const MAX_AVATARS = 3;
const ICON_SIZE = ms(48);
const AVATAR_SIZE = ms(22);

/** A completed activity in the user's history; opens its read-only details. */
export default memo(function ActivityHistoryCard({
  activity,
  onPress,
}: {
  activity: Activity;
  onPress: (activityId: string) => void;
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  // The user took part too.
  const people = activity.members.length + 1;

  return (
    <Pressable
      onPress={() => onPress(activity.id)}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={activity.title}
    >
      <View style={styles.icon}>
        <Text style={styles.emoji}>{CATEGORY_EMOJI[activity.category]}</Text>
      </View>
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={1}>
          {activity.title}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {`${dateTimeIn(activity.startsInMinutes)} • ${activity.meetingPoint}`}
        </Text>
        <View style={styles.bottom}>
          <View style={styles.avatars}>
            {activity.members.slice(0, MAX_AVATARS).map((member, i) => (
              <Image
                key={member.userId}
                source={getUser(member.userId).avatar}
                style={[styles.avatar, i > 0 && styles.avatarOverlap]}
              />
            ))}
          </View>
          <Text style={styles.meta}>
            {t('activityDetail.people', { count: people })}
          </Text>
          <View style={styles.endedPill}>
            <Text style={styles.endedText}>{t('history.ended')}</Text>
          </View>
        </View>
      </View>
      <Icon name="chevron-forward" size={ms(16)} color={colors.textSecondary} />
    </Pressable>
  );
});

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: ms(12),
      padding: ms(14),
      borderRadius: ms(16),
      backgroundColor: colors.card,
      shadowColor: colors.black,
      shadowOpacity: 0.07,
      shadowRadius: ms(10),
      shadowOffset: { width: 0, height: ms(3) },
      elevation: 3,
    },
    pressed: {
      opacity: 0.85,
    },
    icon: {
      width: ICON_SIZE,
      height: ICON_SIZE,
      borderRadius: ms(14),
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surfaceMuted,
    },
    emoji: {
      fontSize: fs(22),
    },
    body: {
      flex: 1,
      gap: ms(4),
    },
    title: {
      fontSize: fs(15),
      lineHeight: fs(20),
      fontFamily: fonts.semibold,
      color: colors.text,
    },
    meta: {
      flexShrink: 1,
      fontSize: fs(12),
      lineHeight: fs(16),
      fontFamily: fonts.regular,
      color: colors.textSecondary,
    },
    bottom: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: ms(8),
      marginTop: ms(2),
    },
    avatars: {
      flexDirection: 'row',
    },
    avatar: {
      width: AVATAR_SIZE,
      height: AVATAR_SIZE,
      borderRadius: AVATAR_SIZE / 2,
      borderWidth: 1.5,
      borderColor: colors.card,
    },
    avatarOverlap: {
      marginLeft: -ms(7),
    },
    endedPill: {
      marginLeft: 'auto',
      paddingHorizontal: ms(8),
      paddingVertical: ms(2),
      borderRadius: ms(999),
      backgroundColor: colors.surfaceMuted,
    },
    endedText: {
      fontSize: fs(10.5),
      fontFamily: fonts.semibold,
      color: colors.textSecondary,
    },
  });
}
