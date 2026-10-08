import type { NavigatorScreenParams } from '@react-navigation/native';

import type { ActivityCategory } from '@/types/activity';

export type MainTabParamList = {
  /** focusKey changes on every request, so focusing the same activity twice still works. */
  Home: { focusActivityId: string; focusKey: number } | undefined;
  Discover: undefined;
  Chats: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  Onboarding: undefined;
  Login: undefined;
  SignUp: undefined;
  ForgotPassword: undefined;
  Main: NavigatorScreenParams<MainTabParamList>;
  ImFree: undefined;
  /** Completed activities the user took part in. */
  ActivityHistory: undefined;
  /** `viewOnly` hides every action, e.g. when opened from a group chat. */
  ActivityDetail: { activityId: string; viewOnly?: boolean };
  GroupChat: { activityId: string };
  GroupChatInfo: { activityId: string };
  GroupMedia: { activityId: string };
  GroupMembers: { activityId: string };
  FreeNearbyMap: undefined;
  /** Everyone free nearby who'd fit this activity. */
  FreeNearbyList: { activityId: string };
  HotActivities: { category: 'all' | ActivityCategory };
  Communities: { category: 'all' | ActivityCategory };
  /** Plays each person's stories in turn, starting at `startIndex`. */
  StoryViewer: { userIds: string[]; startIndex: number };
};
