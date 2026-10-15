import { useMemo, type ReactNode } from 'react';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { ms } from 'react-native-size-matters';
import Icon from 'react-native-vector-icons/Ionicons';

import { useConfirm } from '@/components/ConfirmDialog';
import ScreenHeader from '@/components/ScreenHeader';
import { useCommunityActions } from '@/hooks/useCommunity';
import { useFriendIds } from '@/hooks/useFriends';
import {
  activityStatus,
  CATEGORY_EMOJI,
  communityActivities,
  communityChatId,
  communityMembers,
  COMMUNITIES,
  getCommunity,
} from '@/services/mockData';
import { activityPhoto, categoryPhoto } from '@/services/profile';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { leaveCommunity } from '@/store/slices/activitySlice';
import { leaveChat } from '@/store/slices/chatSlice';
import { useTheme } from '@/theme';
import type { Activity } from '@/types/activity';
import type { RootStackParamList } from '@/types/navigation';
import { chatTime, formatCount, formatDistance } from '@/utils/format';

import { createStyles, type CommunityDetailStyles } from './styles';

type Props = NativeStackScreenProps<RootStackParamList, 'CommunityDetail'>;

/** Faces shown before "+N". */
const FACES = 5;
/** Friends named before "and N more". */
const FRIEND_NAMES = 2;

/**
 * A community: what it's about, when and where it meets, who's in it
 * (friends first), what's coming up of its kind, and joining it or, once
 * joined, its group chat.
 */
export default function CommunityDetailScreen({ navigation, route }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const confirm = useConfirm();
  const actions = useCommunityActions();
  const friendIds = useFriendIds();

  const community = getCommunity(route.params.communityId) ?? COMMUNITIES[0];
  const joined = useAppSelector(state =>
    state.activity.joinedCommunityIds.includes(community.id),
  );
  // Friends first, then everyone else.
  const members = useMemo(
    () =>
      [...communityMembers(community.id)].sort(
        (a, b) => Number(friendIds.has(b.id)) - Number(friendIds.has(a.id)),
      ),
    [community.id, friendIds],
  );
  const friendsHere = members.filter(member => friendIds.has(member.id));
  const friendNames = friendsHere
    .slice(0, FRIEND_NAMES)
    .map(friend => friend.name)
    .join(', ');
  const upcoming = useMemo(() => communityActivities(community), [community]);
  const cover = categoryPhoto(community.category);
  const kind = `${CATEGORY_EMOJI[community.category] ?? ''} ${t(
    `imFree.activities.${community.category}`,
  )}`.trim();

  // Members and what's coming up are for members: until then, a tap says so
  // and offers to join.
  const membersOnly = (open: () => void) => () => {
    if (joined) {
      open();
      return;
    }
    confirm({
      icon: 'lock-closed-outline',
      title: t('community.membersOnlyTitle'),
      message: t('community.membersOnlyMessage', { name: community.name }),
      confirmLabel: t('discover.joinGroup'),
      onConfirm: () => actions.join(community.id),
    });
  };

  const askLeave = () =>
    confirm({
      icon: 'log-out-outline',
      title: t('community.leaveTitle'),
      message: t('chat.info.leaveCommunityMessage', { name: community.name }),
      confirmLabel: t('community.leave'),
      onConfirm: () => {
        dispatch(leaveCommunity(community.id));
        dispatch(leaveChat(communityChatId(community.id)));
      },
    });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader title={t('community.title')} onBack={navigation.goBack} />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + ms(24) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Its kind's photo, darkened at the foot for the name over it. */}
        <View style={styles.hero}>
          {cover ? (
            <Image source={cover} style={styles.heroImage} />
          ) : (
            <View style={[styles.heroImage, styles.heroPlain]} />
          )}
          <View style={styles.heroShade} />
          <View style={styles.heroBody}>
            <View style={styles.heroIcon}>
              <Icon name={community.icon} size={ms(22)} color={colors.white} />
            </View>
            <View style={styles.heroText}>
              <Text style={styles.heroName} numberOfLines={2}>
                {community.name}
              </Text>
              <Text style={styles.heroMeta} numberOfLines={1}>
                {`${kind} · ${t('discover.members', {
                  count: formatCount(community.membersCount),
                })}`}
              </Text>
            </View>
          </View>
        </View>

        {joined ? (
          <View style={styles.actions}>
            <Pressable
              onPress={() => actions.openChat(community.id)}
              style={({ pressed }) => [
                styles.action,
                styles.actionPrimary,
                pressed && styles.pressed,
              ]}
              accessibilityRole="button"
            >
              <Icon
                name="chatbubbles-outline"
                size={ms(17)}
                color={colors.white}
              />
              <Text style={[styles.actionText, styles.actionTextPrimary]}>
                {t('discover.openGroupChat')}
              </Text>
            </Pressable>
            <Pressable
              onPress={askLeave}
              style={({ pressed }) => [
                styles.action,
                pressed && styles.pressed,
              ]}
              accessibilityRole="button"
              accessibilityHint={t('community.leave')}
            >
              <Icon
                name="checkmark-circle"
                size={ms(17)}
                color={colors.success}
              />
              <Text style={styles.actionText}>{t('community.joined')}</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable
            onPress={() => actions.join(community.id)}
            style={({ pressed }) => [
              styles.action,
              styles.actionPrimary,
              styles.actionWide,
              pressed && styles.pressed,
            ]}
            accessibilityRole="button"
          >
            <Icon name="add-circle" size={ms(18)} color={colors.white} />
            <Text style={[styles.actionText, styles.actionTextPrimary]}>
              {t('community.join')}
            </Text>
          </Pressable>
        )}

        {community.description ? (
          <Card
            icon="information-circle-outline"
            title={t('community.about')}
            styles={styles}
          >
            <Text style={styles.body}>{community.description}</Text>
          </Card>
        ) : null}

        <Card
          icon="calendar-outline"
          title={t('community.schedule')}
          styles={styles}
        >
          <InfoRow
            icon="time-outline"
            text={community.schedule}
            styles={styles}
          />
          {community.meetingPlace ? (
            <InfoRow
              icon="location-outline"
              text={community.meetingPlace}
              styles={styles}
            />
          ) : null}
        </Card>

        <Card
          icon="people-outline"
          title={t('community.members')}
          locked={!joined}
          right={
            <Pressable
              onPress={membersOnly(() =>
                navigation.navigate('GroupMembers', {
                  activityId: communityChatId(community.id),
                }),
              )}
              hitSlop={ms(8)}
              accessibilityRole="button"
            >
              <Text style={styles.link}>{t('community.seeAll')}</Text>
            </Pressable>
          }
          styles={styles}
        >
          <View style={styles.membersRow}>
            <View style={styles.faces}>
              {members.slice(0, FACES).map((member, index) => (
                <Pressable
                  key={member.id}
                  onPress={membersOnly(() =>
                    navigation.navigate('UserProfile', { userId: member.id }),
                  )}
                  style={index > 0 && styles.faceOverlap}
                  accessibilityRole="button"
                  accessibilityLabel={member.name}
                >
                  <Image source={member.avatar} style={styles.face} />
                </Pressable>
              ))}
            </View>
            <View style={styles.membersText}>
              <Text style={styles.membersCount}>
                {t('discover.members', {
                  count: formatCount(community.membersCount),
                })}
              </Text>
              {friendsHere.length ? (
                <Text style={styles.membersFriends} numberOfLines={1}>
                  {friendsHere.length > FRIEND_NAMES
                    ? t('community.friendsHereMore', {
                        names: friendNames,
                        count: friendsHere.length - FRIEND_NAMES,
                      })
                    : t('community.friendsHere', { names: friendNames })}
                </Text>
              ) : null}
            </View>
          </View>
        </Card>

        <Card
          icon="flash-outline"
          title={t('community.upcoming')}
          locked={!joined}
          styles={styles}
        >
          {upcoming.length ? (
            upcoming.map((activity, index) => (
              <UpcomingRow
                key={activity.id}
                activity={activity}
                divided={index > 0}
                onPress={membersOnly(() =>
                  navigation.navigate('ActivityDetail', {
                    activityId: activity.id,
                  }),
                )}
                styles={styles}
              />
            ))
          ) : (
            <Text style={styles.empty}>{t('community.noUpcoming')}</Text>
          )}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

/** A white card headed by an outline icon and a title, as elsewhere. */
function Card({
  icon,
  title,
  right,
  locked,
  styles,
  children,
}: {
  icon: string;
  title: string;
  right?: ReactNode;
  /** For members only: a small lock by the title. */
  locked?: boolean;
  styles: CommunityDetailStyles;
  children: ReactNode;
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleRow}>
          <Icon name={icon} size={ms(17)} color={colors.textSecondary} />
          <Text style={styles.cardTitle} accessibilityRole="header">
            {title}
          </Text>
          {locked ? (
            <Icon name="lock-closed" size={ms(13)} color={colors.textMuted} />
          ) : null}
        </View>
        {right}
      </View>
      {children}
    </View>
  );
}

function InfoRow({
  icon,
  text,
  styles,
}: {
  icon: string;
  text: string;
  styles: CommunityDetailStyles;
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.infoRow}>
      <Icon name={icon} size={ms(16)} color={colors.primary} />
      <Text style={styles.infoText}>{text}</Text>
    </View>
  );
}

/** An activity of the community's kind: its picture, name, when and how far. */
function UpcomingRow({
  activity,
  divided,
  onPress,
  styles,
}: {
  activity: Activity;
  divided: boolean;
  onPress: () => void;
  styles: CommunityDetailStyles;
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const photo = activityPhoto(activity);
  const live = activityStatus(activity) === 'ongoing';
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.upcoming,
        divided && styles.divided,
        pressed && styles.pressed,
      ]}
      accessibilityRole="button"
    >
      {photo ? (
        <Image source={photo} style={styles.upcomingThumb} />
      ) : (
        <View style={[styles.upcomingThumb, styles.upcomingThumbPlain]}>
          <Text style={styles.upcomingEmoji}>
            {CATEGORY_EMOJI[activity.category]}
          </Text>
        </View>
      )}
      <View style={styles.upcomingText}>
        <Text style={styles.upcomingTitle} numberOfLines={1}>
          {activity.title}
        </Text>
        <Text
          style={[styles.upcomingMeta, live && styles.upcomingLive]}
          numberOfLines={1}
        >
          {`${
            live
              ? t('community.liveNow')
              : chatTime(Date.now() + activity.startsInMinutes * 60 * 1000)
          } · ${formatDistance(activity.distanceKm)}`}
        </Text>
      </View>
      <Icon name="chevron-forward" size={ms(16)} color={colors.textMuted} />
    </Pressable>
  );
}
