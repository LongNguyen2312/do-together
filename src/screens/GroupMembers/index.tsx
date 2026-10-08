import { useMemo } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ms } from 'react-native-size-matters';
import Icon from 'react-native-vector-icons/Ionicons';

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
      <View style={[styles.topBar, styles.topBarTitled]}>
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
        <Text style={styles.cardTitle}>
          {t('chat.info.memberList', { count: members.length })}
        </Text>
      </View>
      <FlatList
        data={members}
        keyExtractor={member => member.id}
        renderItem={({ item }) => <MemberRow member={item} styles={styles} />}
        contentContainerStyle={styles.memberList}
      />
    </SafeAreaView>
  );
}
