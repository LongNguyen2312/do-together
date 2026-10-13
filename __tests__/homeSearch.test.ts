/**
 * The Home search box finds activities by name, by short map label, by tag
 * and by category name in either language, accents or not.
 */
import { matchesSearch, searchTextsOf } from '@/screens/Home/data';
import { ACTIVITIES } from '@/services/mockData';

const run = ACTIVITIES.find(activity => activity.category === 'running')!;
const coffee = ACTIVITIES.find(activity => activity.category === 'coffee')!;

describe('Home search', () => {
  it('finds an activity by its name', () => {
    const word = run.title.split(' ')[0];
    expect(matchesSearch(searchTextsOf(run), word)).toBe(true);
  });

  it('finds it by category, in Vietnamese with or without accents', () => {
    expect(matchesSearch(searchTextsOf(run), 'Chạy bộ')).toBe(true);
    expect(matchesSearch(searchTextsOf(run), 'chay bo')).toBe(true);
    expect(matchesSearch(searchTextsOf(coffee), 'ca phe')).toBe(true);
  });

  it('finds it by category in English, and by tag', () => {
    expect(matchesSearch(searchTextsOf(run), 'running')).toBe(true);
    expect(matchesSearch(searchTextsOf(run), run.tag)).toBe(true);
  });

  it('leaves out what matches none of it', () => {
    expect(matchesSearch(searchTextsOf(run), 'ca phe')).toBe(false);
  });

  it('matches everything when nothing is typed', () => {
    expect(matchesSearch(searchTextsOf(run), '  ')).toBe(true);
  });
});
