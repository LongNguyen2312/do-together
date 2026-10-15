/**
 * Friend requests and unfriending, as the profile's buttons drive them.
 */
import reducer, {
  cancelFriendRequest,
  sendFriendRequest,
  unfriend,
} from '@/store/slices/activitySlice';

const initial = reducer(undefined, { type: 'init' });

test('a request can be sent and taken back', () => {
  const sent = reducer(initial, sendFriendRequest('huy'));
  expect(sent.friendRequestIds).toEqual(['huy']);
  expect(reducer(sent, cancelFriendRequest('huy')).friendRequestIds).toEqual(
    [],
  );
});

test('unfriending takes them off, once, and drops any request', () => {
  const requested = reducer(initial, sendFriendRequest('minh'));
  const gone = reducer(reducer(requested, unfriend('minh')), unfriend('minh'));
  expect(gone.unfriendedIds).toEqual(['minh']);
  expect(gone.friendRequestIds).toEqual([]);
});
