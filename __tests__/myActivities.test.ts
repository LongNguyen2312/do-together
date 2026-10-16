/**
 * An "I'm free" signal made into the user's own activity: theirs, joined,
 * listed with the rest, with its photo and no made-up chat.
 */
import { seedThread } from '@/services/chat';
import { ACTIVITIES, getActivity, setMyActivities } from '@/services/mockData';
import { toActivity, type CreatedActivity } from '@/services/myActivities';
import reducer, { createActivity } from '@/store/slices/activitySlice';
import { ME } from '@/types/chat';

const NOW = Date.UTC(2026, 9, 15, 10, 0);
const created: CreatedActivity = {
  id: 'mine-1',
  createdAt: NOW,
  startsAt: NOW + 30 * 60 * 1000,
  durationMinutes: 60,
  category: 'running',
  title: 'Chạy bộ',
  tag: 'Chạy bộ • 1 giờ',
  note: 'Quanh Hồ Tây',
  photo: 'data:image/jpeg;base64,xx',
  radiusKm: 3,
};

test('becomes an activity hosted by the user, times from now', () => {
  const activity = toActivity(created, NOW);
  expect(activity).toMatchObject({
    id: 'mine-1',
    mine: true,
    hostId: ME,
    startsInMinutes: 30,
    durationMinutes: 60,
    description: 'Quanh Hồ Tây',
    photo: { uri: 'data:image/jpeg;base64,xx' },
  });
});

test('making one keeps it and puts the user in it', () => {
  const state = reducer(undefined, createActivity(created));
  expect(state.createdActivities[0].id).toBe('mine-1');
  expect(state.joinedIds).toContain('mine-1');
});

test('listed with the rest, replaced as the store changes, no seeded chat', () => {
  const before = ACTIVITIES.length;
  setMyActivities([toActivity(created, NOW)]);
  expect(ACTIVITIES.length).toBe(before + 1);
  expect(getActivity('mine-1')?.mine).toBe(true);
  expect(seedThread('mine-1').messages).toEqual([]);
  setMyActivities([]);
  expect(ACTIVITIES.length).toBe(before);
});
