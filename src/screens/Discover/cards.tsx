import { memo, type ReactNode } from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import {
  isLiquidGlassSupported,
  LiquidGlassView,
} from '@callstack/liquid-glass';
import type { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import Icon from 'react-native-vector-icons/Ionicons';
import { ms } from 'react-native-size-matters';

import PulseDot from '@/components/PulseDot';
import {
  activityStatus,
  CATEGORY_EMOJI,
  getUser,
  spotsLeft,
} from '@/services/mockData';
import { lightColors, useTheme, type AppColors } from '@/theme';
import type { Activity, Community, User } from '@/types/activity';
import { clockIn, formatCount, formatDistance } from '@/utils/format';

import { MAX_AVATARS } from './data';
import type { DiscoverStyles } from './styles';

export function FreePersonCard({
  person,
  styles,
  glassScheme,
  style,
  actions,
}: {
  person: User;
  styles: DiscoverStyles;
  /** Draw on liquid glass (when the system supports it), e.g. over a map. */
  glassScheme?: 'light' | 'dark';
  style?: StyleProp<ViewStyle>;
  /** Buttons along the bottom, e.g. InviteButton or SocialActions. */
  actions: ReactNode;
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const wish = person.freeWish;
  const glass = !!glassScheme && isLiquidGlassSupported;

  const content = (
    <>
      <View style={styles.freeTop}>
        <View>
          <Image source={person.avatar} style={styles.freeAvatar} />
          <View style={styles.onlineDot} />
        </View>
        <View style={styles.flexShrink}>
          <Text style={styles.freeName} numberOfLines={1}>
            {t('discover.nameAge', { name: person.name, age: person.age })}
          </Text>
          <View style={styles.distanceRow}>
            <Icon
              name="navigate-outline"
              size={ms(12)}
              color={colors.textSecondary}
            />
            <Text style={styles.distanceText} numberOfLines={1}>
              {t('home.distanceAway', {
                distance: formatDistance(person.distanceKm),
              })}
            </Text>
          </View>
        </View>
      </View>
      {wish ? (
        <View style={[styles.wish, glass && styles.wishGlass]}>
          <Text style={styles.wishText} numberOfLines={2}>
            {`${CATEGORY_EMOJI[wish.category] ?? ''} ${wish.text}`}
          </Text>
        </View>
      ) : null}
      {actions}
    </>
  );

  return glass ? (
    <LiquidGlassView
      colorScheme={glassScheme}
      style={[styles.freeCard, styles.freeCardGlass, style]}
    >
      {content}
    </LiquidGlassView>
  ) : (
    <View style={[styles.freeCard, style]}>{content}</View>
  );
}

export function InviteButton({
  person,
  invited,
  styles,
  onInvite,
}: {
  person: User;
  invited: boolean;
  styles: DiscoverStyles;
  onInvite: (person: User) => void;
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={() => onInvite(person)}
      disabled={invited}
      style={({ pressed }) => [
        styles.inviteButton,
        invited && styles.invitedButton,
        pressed && styles.pressed,
      ]}
      accessibilityRole="button"
      accessibilityState={{ disabled: invited }}
    >
      <Icon
        name={invited ? 'checkmark-circle' : 'paper-plane'}
        size={ms(14)}
        color={invited ? colors.success : colors.white}
      />
      <Text style={[styles.inviteText, invited && styles.invitedText]}>
        {invited ? t('discover.invited') : t('discover.invite')}
      </Text>
    </Pressable>
  );
}

/** Follow and add-friend, side by side. */
export function SocialActions({
  person,
  following,
  requested,
  styles,
  onToggleFollow,
  onAddFriend,
}: {
  person: User;
  following: boolean;
  /** A friend request has already been sent. */
  requested: boolean;
  styles: DiscoverStyles;
  onToggleFollow: (person: User) => void;
  onAddFriend: (person: User) => void;
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  return (
    <View style={styles.socialRow}>
      <Pressable
        onPress={() => onToggleFollow(person)}
        style={({ pressed }) => [
          styles.inviteButton,
          styles.socialButton,
          styles.followButton,
          following && styles.followingButton,
          pressed && styles.pressed,
        ]}
        accessibilityRole="button"
        accessibilityState={{ selected: following }}
      >
        <Icon
          name={following ? 'checkmark' : 'add'}
          size={ms(14)}
          color={following ? colors.textSecondary : colors.primary}
        />
        <Text
          style={[
            styles.inviteText,
            styles.followText,
            following && styles.followingText,
          ]}
          numberOfLines={1}
        >
          {following ? t('discover.following') : t('discover.follow')}
        </Text>
      </Pressable>
      <Pressable
        onPress={() => onAddFriend(person)}
        disabled={requested}
        style={({ pressed }) => [
          styles.inviteButton,
          styles.socialButton,
          requested && styles.invitedButton,
          pressed && styles.pressed,
        ]}
        accessibilityRole="button"
        accessibilityState={{ disabled: requested }}
      >
        <Icon
          name={requested ? 'checkmark-circle' : 'person-add'}
          size={ms(14)}
          color={requested ? colors.success : colors.white}
        />
        <Text
          style={[styles.inviteText, requested && styles.invitedText]}
          numberOfLines={1}
        >
          {requested ? t('discover.friendRequested') : t('discover.addFriend')}
        </Text>
      </Pressable>
    </View>
  );
}

interface ActivityCardProps {
  activity: Activity;
  joined: boolean;
  styles: DiscoverStyles;
  onOpen: (activityId: string) => void;
  onJoin: (activityId: string) => void;
}

function startLabel(activity: Activity, t: TFunction) {
  return activity.startsInMinutes <= 0
    ? t('discover.live')
    : t('discover.today', { time: clockIn(activity.startsInMinutes) });
}

function ActivityAction({
  activity,
  joined,
  styles,
  onOpen,
  onJoin,
}: ActivityCardProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  if (joined) {
    return (
      <Pressable
        onPress={() => onOpen(activity.id)}
        style={({ pressed }) => [
          styles.joinedButton,
          pressed && styles.pressed,
        ]}
        accessibilityRole="button"
      >
        {activityStatus(activity) === 'ongoing' ? (
          <PulseDot color={colors.white} size={ms(6)} />
        ) : (
          <Icon name="checkmark-circle" size={ms(14)} color={colors.white} />
        )}
        <Text style={styles.joinedText}>
          {activityStatus(activity) === 'ongoing'
            ? t('home.joinedLiveBadge')
            : t('home.joinedBadge')}
        </Text>
      </Pressable>
    );
  }
  // Only upcoming activities with room can be joined; the rest open read-only details.
  if (activityStatus(activity) !== 'upcoming' || spotsLeft(activity) === 0) {
    return (
      <Pressable
        onPress={() => onOpen(activity.id)}
        style={({ pressed }) => [
          styles.secondaryButton,
          pressed && styles.pressed,
        ]}
        accessibilityRole="button"
      >
        <Text style={styles.secondaryText}>{t('discover.details')}</Text>
      </Pressable>
    );
  }
  return (
    <Pressable
      onPress={() => onJoin(activity.id)}
      style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
      accessibilityRole="button"
    >
      <Text style={styles.primaryText}>{t('discover.joinNow')}</Text>
    </Pressable>
  );
}

function Participants({
  activity,
  large,
  styles,
}: {
  activity: Activity;
  large?: boolean;
  styles: DiscoverStyles;
}) {
  const extra = activity.members.length - MAX_AVATARS;
  const size = [styles.participant, large && styles.participantLarge];

  return (
    <View style={styles.avatarStack}>
      {activity.members.slice(0, MAX_AVATARS).map((member, i) => (
        <Image
          key={member.userId}
          source={getUser(member.userId).avatar}
          style={[size, i > 0 && styles.participantOverlap]}
        />
      ))}
      {extra > 0 ? (
        <View
          style={[size, styles.participantOverlap, styles.moreParticipants]}
        >
          <Text style={styles.moreText}>{`+${extra}`}</Text>
        </View>
      ) : null}
    </View>
  );
}

/** Large card with the activity's photo, used for the top pick. */
export const FeaturedActivityCard = memo(function FeaturedActivityCardView(
  props: ActivityCardProps,
) {
  const { activity, joined, styles, onOpen } = props;
  const { t } = useTranslation();
  const { colors } = useTheme();
  const host = getUser(activity.hostId);
  const count = activity.members.length + (joined ? 1 : 0);
  const left = activity.capacity ? Math.max(activity.capacity - count, 0) : 0;
  const tile = activity.extraTile;

  return (
    <Pressable
      onPress={() => onOpen(activity.id)}
      style={({ pressed }) => [
        styles.featuredCard,
        pressed && styles.cardPressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={activity.title}
    >
      <View style={styles.hero}>
        {activity.cover ? (
          <Image source={activity.cover} style={styles.heroImage} />
        ) : null}
        <Svg style={StyleSheet.absoluteFill}>
          <Defs>
            <LinearGradient id="heroShade" x1="0" y1="0" x2="0" y2="1">
              <Stop
                offset="0.35"
                stopColor={lightColors.black}
                stopOpacity="0"
              />
              <Stop
                offset="1"
                stopColor={lightColors.black}
                stopOpacity="0.6"
              />
            </LinearGradient>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#heroShade)" />
        </Svg>
        <View style={styles.heroTop}>
          <View style={styles.heroChip}>
            <Icon
              name="time-outline"
              size={ms(13)}
              color={lightColors.primary}
            />
            <Text style={[styles.heroChipText, styles.heroChipTime]}>
              {startLabel(activity, t)}
            </Text>
          </View>
          <View style={styles.heroChip}>
            <Text style={styles.tagEmoji}>
              {CATEGORY_EMOJI[activity.category]}
            </Text>
            <Text style={styles.heroChipText}>{activity.tag}</Text>
          </View>
        </View>
        <View style={styles.heroBottom}>
          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeText} numberOfLines={1}>
              {tile.kind === 'pace'
                ? t('discover.pace', { value: tile.value })
                : tile.value}
            </Text>
          </View>
          <View style={styles.heroBadge}>
            <Icon
              name="shield-checkmark"
              size={ms(13)}
              color={lightColors.mint}
            />
            <Text style={styles.heroBadgeText} numberOfLines={1}>
              {t('discover.host', { name: host.name, trust: host.trust })}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.featuredBody}>
        <View>
          <Text style={styles.cardTitle}>{activity.title}</Text>
          <View style={styles.locationRow}>
            <Icon name="location" size={ms(15)} color={colors.primary} />
            <Text style={styles.locationText}>
              {`${activity.meetingPoint} (${formatDistance(
                activity.distanceKm,
              )})`}
            </Text>
          </View>
        </View>

        {activity.capacity ? (
          <View style={styles.capacity}>
            <View style={styles.capacityLabels}>
              <Text style={styles.capacityCount}>
                {t('discover.peopleOf', { count, capacity: activity.capacity })}
              </Text>
              <Text style={styles.capacityLeft}>
                {left > 0
                  ? t('discover.spotsLeft', { count: left })
                  : t('discover.full')}
              </Text>
            </View>
            <View style={styles.capacityTrack}>
              <View
                style={[
                  styles.capacityFill,
                  { width: `${Math.min(count / activity.capacity, 1) * 100}%` },
                ]}
              />
            </View>
          </View>
        ) : null}

        <View style={styles.cardBottom}>
          <Participants activity={activity} large styles={styles} />
          <ActivityAction {...props} />
        </View>
      </View>
    </Pressable>
  );
});

export const ActivityCard = memo(function ActivityCardView(
  props: ActivityCardProps,
) {
  const { activity, joined, styles, onOpen } = props;
  const { t } = useTranslation();
  const { colors } = useTheme();
  const host = getUser(activity.hostId);
  const count = activity.members.length + (joined ? 1 : 0);

  return (
    <Pressable
      onPress={() => onOpen(activity.id)}
      style={({ pressed }) => [
        styles.activityCard,
        pressed && styles.cardPressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={activity.title}
    >
      <View>
        <View style={styles.tags}>
          <View style={styles.tag}>
            <Text style={styles.tagEmoji}>
              {CATEGORY_EMOJI[activity.category]}
            </Text>
            <Text style={styles.tagText}>
              {t('discover.people', {
                count: activity.capacity ?? count,
              })}
            </Text>
          </View>
          <View style={styles.tag}>
            <Text style={styles.tagText}>{startLabel(activity, t)}</Text>
          </View>
          <View style={[styles.tag, styles.tagSuccess]}>
            <Text style={[styles.tagText, styles.tagTextSuccess]}>
              {activity.extraTile.hint}
            </Text>
          </View>
        </View>
        <Text style={[styles.cardTitle, styles.cardTitleBelowTags]}>
          {activity.title}
        </Text>
        <View style={styles.locationRow}>
          <Icon name="location" size={ms(15)} color={colors.primary} />
          <Text style={styles.locationText}>
            {`${activity.meetingPoint} (${formatDistance(
              activity.distanceKm,
            )}) • ${t('discover.host', {
              name: host.name,
              trust: host.trust,
            })}`}
          </Text>
        </View>
      </View>

      <View style={styles.cardBottom}>
        <View style={styles.cardMeta}>
          <Participants activity={activity} styles={styles} />
          <Text style={styles.metaText} numberOfLines={2}>
            {activity.capacity
              ? t('discover.spotsSummary', {
                  count,
                  capacity: activity.capacity,
                  left: Math.max(activity.capacity - count, 0),
                })
              : t('home.joined', { count })}
          </Text>
        </View>
        <ActivityAction {...props} />
      </View>
    </Pressable>
  );
});

export const CommunityRow = memo(function CommunityRowView({
  community,
  joined,
  styles,
  onToggle,
}: {
  community: Community;
  joined: boolean;
  styles: DiscoverStyles;
  onToggle: (communityId: string) => void;
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const tone = toneColors(community.tone, colors);

  return (
    <View style={styles.communityRow}>
      <View
        style={[styles.communityIcon, { backgroundColor: tone.background }]}
      >
        <Icon name={community.icon} size={ms(21)} color={tone.icon} />
      </View>
      <View style={styles.communityInfo}>
        <Text style={styles.communityName} numberOfLines={1}>
          {community.name}
        </Text>
        <Text style={styles.communityMeta} numberOfLines={1}>
          {`${t('discover.members', {
            count: formatCount(community.membersCount),
          })} • ${community.schedule}`}
        </Text>
      </View>
      <Pressable
        onPress={() => onToggle(community.id)}
        style={({ pressed }) => [
          joined ? styles.joinedButton : styles.secondaryButton,
          pressed && styles.pressed,
        ]}
        accessibilityRole="button"
      >
        {joined ? (
          <Icon name="checkmark-circle" size={ms(14)} color={colors.white} />
        ) : null}
        <Text style={joined ? styles.joinedText : styles.secondaryText}>
          {joined ? t('discover.joinedGroup') : t('discover.joinGroup')}
        </Text>
      </Pressable>
    </View>
  );
});

function toneColors(tone: Community['tone'], colors: AppColors) {
  switch (tone) {
    case 'primary':
      return { background: colors.primarySoft, icon: colors.primary };
    case 'success':
      return { background: `${colors.success}1F`, icon: colors.success };
    default:
      return { background: colors.surfaceHigh, icon: colors.textSecondary };
  }
}
