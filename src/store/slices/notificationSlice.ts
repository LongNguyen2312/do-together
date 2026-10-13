import {
  createSelector,
  createSlice,
  type PayloadAction,
} from '@reduxjs/toolkit';

import {
  arrivingNotification,
  NOTIFICATION_SETTING,
  seedNotifications,
} from '@/services/notifications';
import type { AppDispatch, RootState } from '@/store';
import type {
  AppNotification,
  FriendRequestAnswer,
  NotificationSettingKey,
  NotificationSettings,
} from '@/types/notification';

/** A pull to refresh takes this long, until there's a server to ask. */
const REFRESH_MS = 800;

export interface NotificationState {
  /** Everything sent this session (seeded at app start), newest first. */
  items: AppNotification[];
  readIds: string[];
  deletedIds: string[];
  /** Friend requests answered right in their notification. */
  answers: Record<string, FriendRequestAnswer>;
  /** How many of the demo arrivals a refresh has brought in. */
  arrived: number;
  settings: NotificationSettings;
}

const initialState: NotificationState = {
  items: seedNotifications(),
  readIds: [],
  deletedIds: [],
  answers: {},
  arrived: 0,
  settings: {
    paused: false,
    enabled: {
      members: true,
      starting: true,
      checkIns: true,
      invites: true,
      mentions: true,
      replies: true,
      friendRequests: true,
      follows: true,
      storyActivity: true,
      friendStories: false,
    },
  },
};

const notificationSlice = createSlice({
  name: 'notification',
  initialState,
  reducers: {
    receiveNotification: (state, action: PayloadAction<AppNotification>) => {
      state.items.unshift(action.payload);
      state.arrived += 1;
    },
    /** Counted as tried even when the settings keep it out. */
    skipArrival: state => {
      state.arrived += 1;
    },
    markNotificationRead: (state, action: PayloadAction<string>) => {
      if (!state.readIds.includes(action.payload)) {
        state.readIds.push(action.payload);
      }
    },
    markAllNotificationsRead: state => {
      const read = new Set(state.readIds);
      state.items.forEach(item => read.add(item.id));
      state.readIds = [...read];
    },
    deleteNotification: (state, action: PayloadAction<string>) => {
      if (!state.deletedIds.includes(action.payload)) {
        state.deletedIds.push(action.payload);
      }
    },
    answerFriendRequest: (
      state,
      action: PayloadAction<{ id: string; answer: FriendRequestAnswer }>,
    ) => {
      state.answers[action.payload.id] = action.payload.answer;
      if (!state.readIds.includes(action.payload.id)) {
        state.readIds.push(action.payload.id);
      }
    },
    setNotificationsPaused: (state, action: PayloadAction<boolean>) => {
      state.settings.paused = action.payload;
    },
    setNotificationSetting: (
      state,
      action: PayloadAction<{ key: NotificationSettingKey; on: boolean }>,
    ) => {
      state.settings.enabled[action.payload.key] = action.payload.on;
    },
  },
});

export const {
  receiveNotification,
  skipArrival,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  answerFriendRequest,
  setNotificationsPaused,
  setNotificationSetting,
} = notificationSlice.actions;
export default notificationSlice.reducer;

/** The list as shown: deleted ones gone, read ones marked. */
export const selectNotifications = createSelector(
  [
    (state: RootState) => state.notification.items,
    (state: RootState) => state.notification.readIds,
    (state: RootState) => state.notification.deletedIds,
  ],
  (items, readIds, deletedIds) => {
    const read = new Set(readIds);
    const deleted = new Set(deletedIds);
    return items
      .filter(item => !deleted.has(item.id))
      .map(item =>
        item.read || !read.has(item.id) ? item : { ...item, read: true },
      );
  },
);

/** On the bell and beside the title, until every one's been read. */
export const selectUnreadCount = createSelector(
  [selectNotifications],
  list => list.filter(item => !item.read).length,
);

const delay = (ms: number) =>
  new Promise<void>(resolve => setTimeout(resolve, ms));

/** Checks for new notifications; resolves once the list is up to date. */
export const refreshNotifications =
  () => async (dispatch: AppDispatch, getState: () => RootState) => {
    await delay(REFRESH_MS);
    const { arrived, settings } = getState().notification;
    const next = arrivingNotification(arrived);
    if (!next) {
      return;
    }
    // Paused, or that kind switched off: it never comes through.
    const allowed =
      !settings.paused && settings.enabled[NOTIFICATION_SETTING[next.kind]];
    dispatch(allowed ? receiveNotification(next) : skipArrival());
  };
