import { useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ms } from 'react-native-size-matters';
import Icon from 'react-native-vector-icons/Ionicons';

import PhotoViewer from '@/components/PhotoViewer';
import Toggle from '@/components/Toggle';
import { photosIn } from '@/services/chat';
import {
  ACTIVITIES,
  activityStatus,
  CATEGORY_EMOJI,
  getActivity,
} from '@/services/mockData';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectThread, toggleMute } from '@/store/slices/chatSlice';
import { useTheme } from '@/theme';
import type { ActivityStatus } from '@/types/activity';
import type { ChatPhoto } from '@/types/chat';
import type { RootStackParamList } from '@/types/navigation';
import { clockIn, formatCount } from '@/utils/format';

import MemberRow, { groupMembers } from './MemberRow';
import { createStyles, type GroupChatInfoStyles } from './styles';

const PREVIEW_PHOTOS = 4;
const MEMBER_PREVIEW = 5;

type Props = NativeStackScreenProps<RootStackParamList, 'GroupChatInfo'>;

export default function GroupChatInfoScreen({ navigation, route }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const dispatch = useAppDispatch();

  const activity = getActivity(route.params.activityId) ?? ACTIVITIES[0];
  const status = activityStatus(activity);
  const thread = useAppSelector(state => selectThread(state, activity.id));
  const photos = useMemo(() => photosIn(thread), [thread]);
  const muted = useAppSelector(state =>
    state.chat.mutedIds.includes(activity.id),
  );
  const me = useAppSelector(state => state.auth.user);
  const myName = me?.displayName || t('chat.you');
  const members = groupMembers(activity, myName);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  const statusColor: Record<ActivityStatus, string> = {
    upcoming: colors.primary,
    ongoing: colors.success,
    completed: colors.textMuted,
  };
  const statusText =
    status === 'upcoming'
      ? t('chat.info.upcoming', { time: clockIn(activity.startsInMinutes) })
      : status === 'ongoing'
      ? t('chat.info.ongoing', {
          time: clockIn(activity.startsInMinutes + activity.durationMinutes),
        })
      : t('chat.info.completed');

  const openMedia = () =>
    navigation.navigate('GroupMedia', { activityId: activity.id });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.topBar}>
        <Pressable
          onPress={navigation.goBack}
          hitSlop={6}
          style={({ pressed }) => [
            styles.roundButton,
            pressed && styles.pressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel={t('auth.back')}
        >
          <Icon name="chevron-back" size={ms(20)} color={colors.text} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.identity}>
          <View style={styles.groupAvatar}>
            <Text style={styles.groupEmoji}>
              {CATEGORY_EMOJI[activity.category]}
            </Text>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: statusColor[status] },
              ]}
            />
          </View>
          <Text style={styles.groupName}>{activity.title}</Text>
          <Text style={[styles.statusText, { color: statusColor[status] }]}>
            {statusText}
          </Text>
        </View>

        <View style={styles.stats}>
          <Stat
            label={t('chat.info.messages')}
            value={formatCount(thread.length)}
            styles={styles}
          />
          <Stat
            label={t('chat.info.members')}
            value={String(members.length)}
            styles={styles}
          />
          <Stat
            label={t('chat.info.photos')}
            value={formatCount(photos.length)}
            styles={styles}
          />
        </View>

        <View style={styles.card}>
          <Pressable
            onPress={openMedia}
            style={styles.cardHeader}
            accessibilityRole="button"
          >
            <Text style={styles.cardTitle}>{t('chat.info.media')}</Text>
            <Icon
              name="chevron-forward"
              size={ms(16)}
              color={colors.textSecondary}
            />
          </Pressable>
          {photos.length === 0 ? (
            <Text style={styles.emptyText}>{t('chat.info.noPhotos')}</Text>
          ) : (
            <PhotoPreview
              photos={photos}
              onOpen={setViewerIndex}
              styles={styles}
            />
          )}
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>
              {t('chat.info.memberList', { count: members.length })}
            </Text>
            {members.length > MEMBER_PREVIEW ? (
              <Pressable
                onPress={() =>
                  navigation.push('GroupMembers', { activityId: activity.id })
                }
                hitSlop={8}
                accessibilityRole="button"
              >
                <Text style={styles.seeAll}>
                  {t('chat.info.seeAllMembers', { count: members.length })}
                </Text>
              </Pressable>
            ) : null}
          </View>
          {members.slice(0, MEMBER_PREVIEW).map(member => (
            <MemberRow key={member.id} member={member} styles={styles} />
          ))}
        </View>

        <View style={styles.cardFlush}>
          <View style={styles.settingRow}>
            <Icon
              name={
                muted ? 'notifications-off-outline' : 'notifications-outline'
              }
              size={ms(20)}
              color={colors.text}
            />
            <View style={styles.settingBody}>
              <Text style={styles.settingLabel}>
                {t('chat.info.notifications')}
              </Text>
              <Text style={styles.settingHint}>
                {muted
                  ? t('chat.info.notificationsOff')
                  : t('chat.info.notificationsOn')}
              </Text>
            </View>
            <Toggle
              value={!muted}
              onValueChange={() => {
                dispatch(toggleMute(activity.id));
              }}
              accessibilityLabel={t('chat.info.notifications')}
            />
          </View>
          <SettingLink
            icon="information-circle-outline"
            label={t('chat.info.viewActivity')}
            onPress={() =>
              navigation.push('ActivityDetail', {
                activityId: activity.id,
                viewOnly: true,
              })
            }
            styles={styles}
          />
        </View>
      </ScrollView>

      <PhotoViewer
        photos={photos}
        startIndex={viewerIndex}
        onClose={() => setViewerIndex(null)}
      />
    </SafeAreaView>
  );
}

function Stat({
  label,
  value,
  styles,
}: {
  label: string;
  value: string;
  styles: GroupChatInfoStyles;
}) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel} numberOfLines={1}>
        {label}
      </Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

function PhotoPreview({
  photos,
  onOpen,
  styles,
}: {
  photos: readonly ChatPhoto[];
  onOpen: (index: number) => void;
  styles: GroupChatInfoStyles;
}) {
  const { t } = useTranslation();
  const shown = photos.slice(0, PREVIEW_PHOTOS);
  // The last tile also stands for every photo that doesn't fit.
  const hidden = photos.length - PREVIEW_PHOTOS + 1;

  return (
    <View style={styles.thumbs}>
      {shown.map((photo, index) => {
        const last = index === PREVIEW_PHOTOS - 1 && hidden > 1;
        return (
          <Pressable
            key={index}
            onPress={() => onOpen(index)}
            style={({ pressed }) => [styles.thumb, pressed && styles.pressed]}
            accessibilityRole="imagebutton"
            accessibilityLabel={t('chat.info.openPhoto', { index: index + 1 })}
          >
            <Image source={photo} style={styles.thumbImage} />
            {last ? (
              <View style={styles.thumbMore}>
                <Text style={styles.thumbMoreText}>{`+${hidden}`}</Text>
              </View>
            ) : null}
          </Pressable>
        );
      })}
      {Array.from({ length: PREVIEW_PHOTOS - shown.length }, (_, i) => (
        <View key={`empty-${i}`} style={styles.flex} />
      ))}
    </View>
  );
}

function SettingLink({
  icon,
  label,
  onPress,
  styles,
}: {
  icon: string;
  label: string;
  onPress: () => void;
  styles: GroupChatInfoStyles;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.settingRow,
        styles.settingDivider,
        pressed && styles.pressed,
      ]}
      accessibilityRole="button"
    >
      <Icon name={icon} size={ms(20)} color={colors.text} />
      <View style={styles.settingBody}>
        <Text style={styles.settingLabel}>{label}</Text>
      </View>
      <Icon name="chevron-forward" size={ms(16)} color={colors.textSecondary} />
    </Pressable>
  );
}
