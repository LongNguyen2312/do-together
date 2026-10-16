import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import type { CreatedActivity } from '@/services/myActivities';

/** Kept on the device, the newest. */
const MAX_CREATED = 20;

interface ActivityState {
  /** Activities the signed-in user has joined. */
  joinedIds: string[];
  /** Joined activities the user has checked in to at the meeting point. */
  checkedInIds: string[];
  joinedCommunityIds: string[];
  /** Free people invited this session; not persisted. */
  invitedUserIds: string[];
  /** Friends invited to a joined activity, by activity id; not persisted. */
  activityInvites: Record<string, string[]>;
  followedUserIds: string[];
  /** People the user has sent a friend request to. */
  friendRequestIds: string[];
  /** Friends (from the mock list) the user has since unfriended. */
  unfriendedIds: string[];
  /** Activities the user has saved, oldest first. */
  savedIds: string[];
  /** Activities the user made from "I'm free" signals, newest first. */
  createdActivities: CreatedActivity[];
}

const initialState: ActivityState = {
  // Mock: one joined activity per status, so every detail state is reachable.
  joinedIds: [
    'quang-an-doubles',
    'buoi-park-kickabout',
    'hoan-kiem-sunrise',
    'tay-ho-coffee-chat',
    'old-quarter-pho-crawl',
    'my-dinh-badminton',
    'old-quarter-photo-walk',
    'board-game-night',
    'english-coffee-exchange',
    'west-lake-evening-walk',
    'indie-movie-night',
  ],
  checkedInIds: ['buoi-park-kickabout'],
  joinedCommunityIds: [],
  invitedUserIds: [],
  activityInvites: {},
  followedUserIds: [],
  friendRequestIds: [],
  unfriendedIds: [],
  savedIds: [],
  createdActivities: [],
};

const activitySlice = createSlice({
  name: 'activity',
  initialState,
  reducers: {
    joinActivity: (state, action: PayloadAction<string>) => {
      if (!state.joinedIds.includes(action.payload)) {
        state.joinedIds.push(action.payload);
      }
    },
    leaveActivity: (state, action: PayloadAction<string>) => {
      state.joinedIds = state.joinedIds.filter(id => id !== action.payload);
      state.checkedInIds = state.checkedInIds.filter(
        id => id !== action.payload,
      );
    },
    checkIn: (state, action: PayloadAction<string>) => {
      if (
        state.joinedIds.includes(action.payload) &&
        !state.checkedInIds.includes(action.payload)
      ) {
        state.checkedInIds.push(action.payload);
      }
    },
    joinCommunity: (state, action: PayloadAction<string>) => {
      if (!state.joinedCommunityIds.includes(action.payload)) {
        state.joinedCommunityIds.push(action.payload);
      }
    },
    leaveCommunity: (state, action: PayloadAction<string>) => {
      state.joinedCommunityIds = state.joinedCommunityIds.filter(
        id => id !== action.payload,
      );
    },
    toggleCommunity: (state, action: PayloadAction<string>) => {
      const ids = state.joinedCommunityIds;
      state.joinedCommunityIds = ids.includes(action.payload)
        ? ids.filter(id => id !== action.payload)
        : [...ids, action.payload];
    },
    inviteUser: (state, action: PayloadAction<string>) => {
      if (!state.invitedUserIds.includes(action.payload)) {
        state.invitedUserIds.push(action.payload);
      }
    },
    toggleActivityInvite: (
      state,
      action: PayloadAction<{ activityId: string; userId: string }>,
    ) => {
      const { activityId, userId } = action.payload;
      const ids = state.activityInvites[activityId] ?? [];
      state.activityInvites[activityId] = ids.includes(userId)
        ? ids.filter(id => id !== userId)
        : [...ids, userId];
    },
    /** Made from an "I'm free" signal: it's theirs, and they're in it. */
    createActivity: (state, action: PayloadAction<CreatedActivity>) => {
      state.createdActivities = [
        action.payload,
        ...state.createdActivities,
      ].slice(0, MAX_CREATED);
      if (!state.joinedIds.includes(action.payload.id)) {
        state.joinedIds.push(action.payload.id);
      }
    },
    toggleSave: (state, action: PayloadAction<string>) => {
      const ids = state.savedIds;
      state.savedIds = ids.includes(action.payload)
        ? ids.filter(id => id !== action.payload)
        : [...ids, action.payload];
    },
    toggleFollow: (state, action: PayloadAction<string>) => {
      const ids = state.followedUserIds;
      state.followedUserIds = ids.includes(action.payload)
        ? ids.filter(id => id !== action.payload)
        : [...ids, action.payload];
    },
    cancelFriendRequest: (state, action: PayloadAction<string>) => {
      state.friendRequestIds = state.friendRequestIds.filter(
        id => id !== action.payload,
      );
    },
    unfriend: (state, action: PayloadAction<string>) => {
      if (!state.unfriendedIds.includes(action.payload)) {
        state.unfriendedIds.push(action.payload);
      }
      state.friendRequestIds = state.friendRequestIds.filter(
        id => id !== action.payload,
      );
    },
    sendFriendRequest: (state, action: PayloadAction<string>) => {
      if (!state.friendRequestIds.includes(action.payload)) {
        state.friendRequestIds.push(action.payload);
      }
    },
  },
});

export const {
  joinActivity,
  leaveActivity,
  checkIn,
  toggleCommunity,
  joinCommunity,
  leaveCommunity,
  inviteUser,
  toggleActivityInvite,
  toggleFollow,
  toggleSave,
  createActivity,
  sendFriendRequest,
  cancelFriendRequest,
  unfriend,
} = activitySlice.actions;
export default activitySlice.reducer;
