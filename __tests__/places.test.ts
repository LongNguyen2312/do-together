/**
 * Picking a hometown or where someone lives: the 34 places, fetched from the
 * open provinces API as the app starts (the built-in copy only if that
 * fails), found with or without accents, by name or an old province's name.
 */
import { configureStore } from '@reduxjs/toolkit';

import { http } from '@/services/api';

import {
  FALLBACK_PROVINCES,
  provinceName,
  searchProvinces,
  sortProvinces,
  toProvince,
} from '@/services/places';
import placesReducer, { loadProvinces } from '@/store/slices/placesSlice';

const api = (
  code: number,
  codename: string,
  name: string,
  division_type = 'tỉnh',
) => ({ code, codename, name, division_type });

const API_LIST = [
  api(40, 'nghe_an', 'Tỉnh Nghệ An'),
  api(1, 'ha_noi', 'Thành phố Hà Nội', 'thành phố trung ương'),
];

const LIST = sortProvinces(FALLBACK_PROVINCES);

afterEach(() => jest.restoreAllMocks());

const makeStore = () => configureStore({ reducer: { places: placesReducer } });

test('the built-in copy has 34, each once', () => {
  expect(FALLBACK_PROVINCES).toHaveLength(34);
  expect(new Set(FALLBACK_PROVINCES.map(place => place.id)).size).toBe(34);
});

test("the API's places become the app's: short names, kinds, old names kept", () => {
  const hcm = toProvince(
    api(79, 'ho_chi_minh', 'Thành phố Hồ Chí Minh', 'thành phố trung ương'),
  );
  expect(hcm).toMatchObject({
    id: 'ho-chi-minh',
    name: 'Hồ Chí Minh',
    kind: 'city',
  });
  expect(hcm.aliases).toContain('sài gòn');
});

test('loading, then the API list in the store, cities first', async () => {
  jest
    .spyOn(http, 'get')
    .mockResolvedValue({ data: API_LIST } as Awaited<
      ReturnType<typeof http.get>
    >);
  const store = makeStore();
  const loading = store.dispatch(loadProvinces());
  expect(store.getState().places.status).toBe('loading');
  await loading;
  expect(store.getState().places.status).toBe('ready');
  expect(store.getState().places.provinces.map(place => place.id)).toEqual([
    'ha-noi',
    'nghe-an',
  ]);
});

test('the built-in copy only when the API fails', async () => {
  jest.spyOn(http, 'get').mockRejectedValue(new Error('offline'));
  const store = makeStore();
  await store.dispatch(loadProvinces());
  expect(store.getState().places.status).toBe('failed');
  expect(store.getState().places.provinces).toHaveLength(34);
});

test('found without accents, names starting with it first', () => {
  const found = searchProvinces('ha', LIST);
  expect(found[0].name).toBe('Hà Nội');
  expect(found.map(place => place.id)).toContain('ha-tinh');
});

test('found by an old name', () => {
  expect(searchProvinces('sai gon', LIST)[0].id).toBe('ho-chi-minh');
  expect(searchProvinces('Bắc Giang', LIST)[0].id).toBe('bac-ninh');
});

test('nothing typed is everything; nothing found is empty', () => {
  expect(searchProvinces('  ', LIST)).toHaveLength(34);
  expect(searchProvinces('zzz', LIST)).toEqual([]);
});

test('names by id, nothing for unknown ones or before the list is in', () => {
  expect(provinceName('nghe-an', LIST)).toBe('Nghệ An');
  expect(provinceName('atlantis', LIST)).toBeUndefined();
  expect(provinceName(undefined, LIST)).toBeUndefined();
  expect(provinceName('nghe-an', [])).toBeUndefined();
});

test('asked for once a run: again does nothing, even after a failure', async () => {
  const failing = jest
    .spyOn(http, 'get')
    .mockRejectedValue(new Error('offline'));
  const store = makeStore();
  await store.dispatch(loadProvinces());
  await store.dispatch(loadProvinces());
  expect(failing).toHaveBeenCalledTimes(1);
  expect(store.getState().places.status).toBe('failed');
  expect(store.getState().places.provinces).toHaveLength(34);
});
