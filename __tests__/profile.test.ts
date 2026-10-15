/**
 * The numbers and lists on the profile, worked out from what the user has
 * joined.
 */
import {
  addCustomInterest,
  CUSTOM_INTERESTS_MAX,
  commonGround,
  friendsInCommon,
  profileStats,
  usualCategories,
} from '@/services/profile';
import { FRIEND_IDS, USERS } from '@/services/mockData';
import type { Activity } from '@/types/activity';

const friends = FRIEND_IDS.map(id => USERS[id]);

const at = (id: string, durationMinutes: number, category = 'running') =>
  ({ id, durationMinutes, category } as unknown as Activity);

describe('profileStats', () => {
  it('counts finished activities, friends and followers', () => {
    const stats = profileStats([at('a', 90), at('b', 45)], 6);
    expect(stats.activities).toBe(2);
    expect(stats.friends).toBe(6);
    expect(stats.followers).toBeGreaterThan(0);
  });

  it('is zero activities for a new user', () => {
    expect(profileStats([], 0).activities).toBe(0);
  });
});

describe('usualCategories', () => {
  it('orders categories by how often the user went, most first', () => {
    const usual = usualCategories([
      at('a', 60, 'coffee'),
      at('b', 60, 'running'),
      at('c', 60, 'coffee'),
    ]);
    expect(usual).toEqual([
      { category: 'coffee', count: 2 },
      { category: 'running', count: 1 },
    ]);
  });
});

describe('friendsInCommon', () => {
  it('finds friends who share an interest, most in common first', () => {
    const common = friendsInCommon(['running', 'football'], friends);
    expect(common.length).toBeGreaterThan(0);
    common.forEach(({ friend, shared }) => {
      expect(shared.length).toBeGreaterThan(0);
      shared.forEach(category => expect(friend.interests).toContain(category));
      expect(shared.every(c => c === 'running' || c === 'football')).toBe(true);
    });
    const counts = common.map(({ shared }) => shared.length);
    expect([...counts].sort((a, b) => b - a)).toEqual(counts);
  });

  it('is nobody without interests', () => {
    expect(friendsInCommon([], friends)).toEqual([]);
  });
});

describe('commonGround', () => {
  const together = (id: string, userIds: string[]) =>
    ({
      id,
      members: userIds.map(userId => ({ userId })),
    } as unknown as Activity);

  it('finds shared interests and activities done together', () => {
    const ground = commonGround(
      { id: 'minh', interests: ['running', 'coffee', 'football'] },
      ['coffee', 'running', 'food'],
      [together('a', ['minh', 'lan']), together('b', ['lan'])],
    );
    expect(ground).toEqual({
      interests: ['running', 'coffee'],
      customInterests: [],
      activities: 1,
    });
  });

  it('is nothing for strangers with nothing alike', () => {
    expect(
      commonGround({ id: 'x', interests: ['gaming'] }, ['food'], []),
    ).toEqual({ interests: [], customInterests: [], activities: 0 });
  });
});

describe('addCustomInterest', () => {
  const mine = (name: string) => ({ id: name, name, emoji: '🧗', image: null });

  it('adds it, its name tidied', () => {
    expect(
      addCustomInterest([], mine('  Leo   núi ')).map(i => i.name),
    ).toEqual(['Leo núi']);
  });

  it('skips blanks, repeats (accents and case aside) and taken names', () => {
    const list = [mine('Leo núi')];
    expect(addCustomInterest(list, mine('   '))).toBe(list);
    expect(addCustomInterest(list, mine('LEO NUI'))).toBe(list);
    expect(addCustomInterest(list, mine('cà phê'), ['Cà phê'])).toBe(list);
  });

  it('stops at the most there can be', () => {
    const full = Array.from({ length: CUSTOM_INTERESTS_MAX }, (_, i) =>
      mine(`x${i}`),
    );
    expect(addCustomInterest(full, mine('one more'))).toBe(full);
  });
});

describe('interests of their own', () => {
  const made = (name: string) => ({ id: name, name, emoji: '🏀', image: null });

  it('match friends by name, accents and case aside', () => {
    const friend = {
      ...friends[0],
      interests: [],
      customInterests: [made('Bóng rổ')],
    };
    const [match] = friendsInCommon([], [friend], [made('bong ro')]);
    expect(match.sharedCustom.map(item => item.name)).toEqual(['Bóng rổ']);
    expect(
      commonGround(friend, [], [], [made('BÓNG RỔ')]).customInterests,
    ).toHaveLength(1);
  });
});
