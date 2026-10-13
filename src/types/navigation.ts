import type { NavigatorScreenParams } from '@react-navigation/native';

import type { ActivityCategory } from '@/types/activity';
import type { ChatPick } from '@/types/chat';
import type { StoryFilterId, StoryMedia } from '@/types/story';

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
  /** `picked`: photos or a clip handed back by the chat gallery, to send. */
  GroupChat: { activityId: string; picked?: ChatPick };
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
  /** The camera and the phone's photos and videos, to start a story. */
  StoryGallery: undefined;
  /** The same gallery, picking photos or a clip to send in a group chat. */
  ChatGallery: { activityId: string };
  /** Takes a photo or records a clip, with a filter, for a story. */
  StoryCamera: undefined;
  /** Everything the user's been notified of, by day. */
  Notifications: undefined;
  /** Which notifications come through, or none for a while. */
  NotificationSettings: undefined;
  /** `filter` comes from the camera. */
  StoryEditor: { media: StoryMedia; filter?: StoryFilterId };
};
