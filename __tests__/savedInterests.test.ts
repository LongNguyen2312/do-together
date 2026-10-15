/**
 * Interests the user makes stay on the device, picked or not; forgetting one
 * takes it off the profile too.
 */
import reducer, {
  forgetInterest,
  saveInterest,
  setUser,
  updateProfile,
} from '@/store/slices/authSlice';

const climbing = { id: 'c', name: 'Leo núi', emoji: '🧗', image: null };

test('saved once, kept whether picked or not', () => {
  let state = reducer(undefined, saveInterest(climbing));
  state = reducer(state, saveInterest(climbing));
  expect(state.savedInterests).toEqual([climbing]);
});

test('forgetting one takes it off the profile as well', () => {
  let state = reducer(
    undefined,
    setUser({ id: 'u', email: 'u@x.vn', displayName: 'U' }),
  );
  state = reducer(state, saveInterest(climbing));
  state = reducer(state, updateProfile({ customInterests: [climbing] }));
  state = reducer(state, forgetInterest('c'));
  expect(state.savedInterests).toEqual([]);
  expect(state.user?.customInterests).toEqual([]);
});
