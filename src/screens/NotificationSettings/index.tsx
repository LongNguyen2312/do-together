import { Fragment, useMemo } from 'react';
import { ScrollView, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ms } from 'react-native-size-matters';
import Icon from 'react-native-vector-icons/Ionicons';

import ScreenHeader from '@/components/ScreenHeader';
import Toggle from '@/components/Toggle';
import { NOTIFICATION_SETTING_SECTIONS } from '@/services/notifications';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  setNotificationSetting,
  setNotificationsPaused,
} from '@/store/slices/notificationSlice';
import { useTheme } from '@/theme';
import type { RootStackParamList } from '@/types/navigation';
import type { NotificationSettingKey } from '@/types/notification';

import { createStyles } from './styles';

const SETTING_ICON: Record<NotificationSettingKey, string> = {
  members: 'people-outline',
  starting: 'alarm-outline',
  checkIns: 'location-outline',
  invites: 'paper-plane-outline',
  mentions: 'at-outline',
  replies: 'arrow-undo-outline',
  friendRequests: 'person-add-outline',
  follows: 'sparkles-outline',
  storyActivity: 'heart-outline',
  friendStories: 'images-outline',
};

type Props = NativeStackScreenProps<RootStackParamList, 'NotificationSettings'>;

/** Pause everything, or turn each kind of notification on or off. */
export default function NotificationSettingsScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const dispatch = useAppDispatch();
  const { paused, enabled } = useAppSelector(
    state => state.notification.settings,
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader
        title={t('notifications.settingsScreen.title')}
        onBack={navigation.goBack}
      />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.iconTile}>
              <Icon
                name="notifications-off-outline"
                size={ms(18)}
                color={colors.primary}
              />
            </View>
            <View style={styles.body}>
              <Text style={styles.label}>
                {t('notifications.settingsScreen.pauseAll')}
              </Text>
              <Text style={styles.hint}>
                {t('notifications.settingsScreen.pauseAllHint')}
              </Text>
            </View>
            <Toggle
              value={paused}
              onValueChange={value => dispatch(setNotificationsPaused(value))}
              accessibilityLabel={t('notifications.settingsScreen.pauseAll')}
            />
          </View>
        </View>

        {NOTIFICATION_SETTING_SECTIONS.map(({ group, keys }) => (
          <Fragment key={group}>
            <Text style={styles.sectionTitle} accessibilityRole="header">
              {t(`notifications.settingsScreen.sections.${group}`)}
            </Text>
            {/* Paused, the switches keep their places but take no taps. */}
            <View
              style={[styles.card, paused && styles.cardOff]}
              pointerEvents={paused ? 'none' : 'auto'}
              accessibilityElementsHidden={paused}
            >
              {keys.map((key, index) => {
                const label = t(
                  `notifications.settingsScreen.items.${key}.label`,
                );
                return (
                  <View
                    key={key}
                    style={[styles.row, index > 0 && styles.divider]}
                  >
                    <View
                      style={[
                        styles.iconTile,
                        !enabled[key] && styles.iconTilePaused,
                      ]}
                    >
                      <Icon
                        name={SETTING_ICON[key]}
                        size={ms(18)}
                        color={
                          enabled[key] ? colors.primary : colors.textSecondary
                        }
                      />
                    </View>
                    <View style={styles.body}>
                      <Text style={styles.label}>{label}</Text>
                      <Text style={styles.hint}>
                        {t(`notifications.settingsScreen.items.${key}.hint`)}
                      </Text>
                    </View>
                    <Toggle
                      value={enabled[key]}
                      onValueChange={on =>
                        dispatch(setNotificationSetting({ key, on }))
                      }
                      accessibilityLabel={label}
                    />
                  </View>
                );
              })}
            </View>
          </Fragment>
        ))}

        <Text style={styles.note}>
          {t('notifications.settingsScreen.chatNote')}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
