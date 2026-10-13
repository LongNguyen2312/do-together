/**
 * The notification list: reading, deleting, answering friend requests, and
 * refreshes that respect the settings.
 */
import { configureStore } from '@reduxjs/toolkit';

import type { AppDispatch, RootState } from '@/store';
import reducer, {
  answerFriendRequest,
  deleteNotification,
  markAllNotificationsRead,
  markNotificationRead,
  refreshNotifications,
  selectNotifications,
  selectUnreadCount,
  setNotificationSetting,
  setNotificationsPaused,
} from '@/store/slices/notificationSlice';

const makeStore = () => configureStore({ reducer: { notification: reducer } });
const stateOf = (store: ReturnType<typeof makeStore>) =>
  store.getState() as unknown as RootState;
// Run against this store alone, not the app's.
const refresh = (store: ReturnType<typeof makeStore>) =>
  refreshNotifications()(store.dispatch as unknown as AppDispatch, () =>
    stateOf(store),
  );

describe('notifications', () => {
  it('starts with unread ones', () => {
    expect(selectUnreadCount(stateOf(makeStore()))).toBeGreaterThan(0);
  });

  it('reads one, or all', () => {
    const store = makeStore();
    const [first] = selectNotifications(stateOf(store)).filter(n => !n.read);
    const before = selectUnreadCount(stateOf(store));
    store.dispatch(markNotificationRead(first.id));
    expect(selectUnreadCount(stateOf(store))).toBe(before - 1);
    store.dispatch(markAllNotificationsRead());
    expect(selectUnreadCount(stateOf(store))).toBe(0);
  });

  it('deletes one from the list', () => {
    const store = makeStore();
    const list = selectNotifications(stateOf(store));
    store.dispatch(deleteNotification(list[0].id));
    const after = selectNotifications(stateOf(store));
    expect(after).toHaveLength(list.length - 1);
    expect(after.find(n => n.id === list[0].id)).toBeUndefined();
  });

  it('answers a friend request, which reads it', () => {
    const store = makeStore();
    const request = selectNotifications(stateOf(store)).find(
      n => n.kind === 'friendRequest',
    )!;
    store.dispatch(answerFriendRequest({ id: request.id, answer: 'accepted' }));
    expect(stateOf(store).notification.answers[request.id]).toBe('accepted');
    expect(
      selectNotifications(stateOf(store)).find(n => n.id === request.id)?.read,
    ).toBe(true);
  });

  it('brings in a new one on refresh, unless paused or switched off', async () => {
    const store = makeStore();
    const count = () => selectNotifications(stateOf(store)).length;
    const start = count();

    // The first arrival is someone joining.
    store.dispatch(setNotificationsPaused(true));
    await refresh(store);
    expect(count()).toBe(start);

    // The second is a follow.
    store.dispatch(setNotificationsPaused(false));
    store.dispatch(setNotificationSetting({ key: 'follows', on: false }));
    await refresh(store);
    expect(count()).toBe(start);

    // The third, a check-in, comes through.
    await refresh(store);
    expect(count()).toBe(start + 1);
    expect(selectNotifications(stateOf(store))[0].kind).toBe('checkIn');
  });
});
