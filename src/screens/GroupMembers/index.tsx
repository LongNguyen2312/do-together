import { useMemo } from 'react';
import { FlatList } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';

import ScreenHeader from '@/components/ScreenHeader';
import MemberRow, { groupMembers } from '@/screens/GroupChatInfo/MemberRow';
import { createStyles } from '@/screens/GroupChatInfo/styles';
import { ACTIVITIES, getActivity } from '@/services/mockData';
import { useAppSelector } from '@/store/hooks';
import { useTheme } from '@/theme';
import type { RootStackParamList } from '@/types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'GroupMembers'>;

export default function GroupMembersScreen({ navigation, route }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const activity = getActivity(route.params.activityId) ?? ACTIVITIES[0];
  const me = useAppSelector(state => state.auth.user);
  const members = groupMembers(activity, me?.displayName || t('chat.you'));

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader
        title={t('chat.info.memberList', { count: members.length })}
        onBack={navigation.goBack}
      />
      <FlatList
        data={members}
        keyExtractor={member => member.id}
        renderItem={({ item }) => <MemberRow member={item} styles={styles} />}
        contentContainerStyle={styles.memberList}
      />
    </SafeAreaView>
  );
}
