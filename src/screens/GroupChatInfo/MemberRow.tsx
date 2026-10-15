import {
  Image,
  Pressable,
  Text,
  View,
  type ImageSourcePropType,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';

import { getUser } from '@/services/mockData';
import type { Activity } from '@/types/activity';
import type { RootStackParamList } from '@/types/navigation';
import { initialsOf } from '@/utils/format';

import type { GroupChatInfoStyles } from './styles';

export interface GroupMember {
  id: string;
  name: string;
  /** Missing for the signed-in user, who gets an initials avatar. */
  avatar?: ImageSourcePropType;
  role: 'host' | 'me' | null;
}

/** Host first, then the other members, then the signed-in user. */
export function groupMembers(activity: Activity, myName: string) {
  const members: GroupMember[] = activity.members.map(member => {
    const person = getUser(member.userId);
    return {
      id: member.userId,
      name: person.name,
      avatar: person.avatar,
      role: member.userId === activity.hostId ? 'host' : null,
    };
  });
  return [...members, { id: 'me', name: myName, role: 'me' } as GroupMember];
}

/** A member; anyone but the user opens their profile. */
export default function MemberRow({
  member,
  styles,
}: {
  member: GroupMember;
  styles: GroupChatInfoStyles;
}) {
  const { t } = useTranslation();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const isMe = member.role === 'me';
  return (
    <Pressable
      onPress={() => navigation.navigate('UserProfile', { userId: member.id })}
      disabled={isMe}
      style={({ pressed }) => [styles.memberRow, pressed && styles.pressed]}
      accessibilityRole={isMe ? undefined : 'button'}
    >
      {member.avatar ? (
        <Image source={member.avatar} style={styles.memberAvatar} />
      ) : (
        <View style={[styles.memberAvatar, styles.meAvatar]}>
          <Text style={styles.meAvatarText}>{initialsOf(member.name)}</Text>
        </View>
      )}
      <Text style={styles.memberName} numberOfLines={1}>
        {member.name}
      </Text>
      {member.role ? (
        <View style={styles.memberBadge}>
          <Text style={styles.memberBadgeText}>
            {member.role === 'host'
              ? t('activityDetail.hostBadge')
              : t('chat.you')}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}
