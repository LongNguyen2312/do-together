import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

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
  inviteUser,
  toggleActivityInvite,
  toggleFollow,
  sendFriendRequest,
  cancelFriendRequest,
} = activitySlice.actions;
export default activitySlice.reducer;
