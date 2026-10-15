import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { ProfileView } from '@/screens/Profile';
import type { RootStackParamList } from '@/types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'UserProfile'>;

/** Someone else's profile: the same page as the user's own, as others see it. */
export default function UserProfileScreen({ route }: Props) {
  return <ProfileView userId={route.params.userId} />;
}
