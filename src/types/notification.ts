/** What a notification is about; decides its text, badge and where it leads. */
export type NotificationKind =
  | 'join'
  | 'leave'
  | 'starting'
  | 'checkIn'
  | 'invite'
  | 'mention'
  | 'reply'
  | 'friendRequest'
  | 'friendAccepted'
  | 'follow'
  | 'storyReaction'
  | 'storyReply'
  | 'friendStory';

/** The filters on the notifications screen, beside all and unread. */
export type NotificationGroup = 'activity' | 'chat' | 'friends' | 'story';

export interface AppNotification {
  id: string;
  kind: NotificationKind;
  /** Epoch ms. */
  createdAt: number;
  read: boolean;
  /** Whoever did it; none for e.g. an activity about to start. */
  actorId?: string;
  activityId?: string;
  /** A story reaction. */
  emoji?: string;
  /** The message or story reply it's about, quoted under it. */
  quote?: string;
  /** `starting`: minutes until the activity starts. */
  minutes?: number;
}

/** The user's answer to a friend request, right in the notification. */
export type FriendRequestAnswer = 'accepted' | 'declined';

/** One switch on the notification settings screen. */
export type NotificationSettingKey =
  | 'members'
  | 'starting'
  | 'checkIns'
  | 'invites'
  | 'mentions'
  | 'replies'
  | 'friendRequests'
  | 'follows'
  | 'storyActivity'
  | 'friendStories';

export interface NotificationSettings {
  /** Nothing comes through while paused, whatever the switches say. */
  paused: boolean;
  enabled: Record<NotificationSettingKey, boolean>;
}
