import { http } from '@/services/api';
import { normalizeSearch } from '@/utils/format';

/**
 * Vietnam's 34 province-level places since the July 2025 merger, the ones
 * hometowns and where people live are picked from, by id. The list comes
 * from the open provinces API (provinces.open-api.vn, v2), fetched as the
 * app starts and kept in the store (see placesSlice); the copy below is
 * only for when that fails.
 */
export interface Province {
  /** The API's codename with dashes, e.g. `ha-noi`: what profiles store. */
  id: string;
  name: string;
  kind: 'city' | 'province';
  /** Other names people search by, e.g. the old provinces merged into it. */
  aliases?: string[];
}

/** The list as it was last checked against the API, for when it can't be reached. */
export const FALLBACK_PROVINCES: readonly Province[] = [
  { id: 'ha-noi', name: 'Hà Nội', kind: 'city', aliases: ['hn', 'hanoi'] },
  {
    id: 'ho-chi-minh',
    name: 'TP. Hồ Chí Minh',
    kind: 'city',
    aliases: [
      'hcm',
      'tphcm',
      'sài gòn',
      'saigon',
      'bình dương',
      'bà rịa - vũng tàu',
      'vũng tàu',
    ],
  },
  { id: 'hai-phong', name: 'Hải Phòng', kind: 'city', aliases: ['hải dương'] },
  { id: 'da-nang', name: 'Đà Nẵng', kind: 'city', aliases: ['quảng nam'] },
  {
    id: 'can-tho',
    name: 'Cần Thơ',
    kind: 'city',
    aliases: ['sóc trăng', 'hậu giang'],
  },
  { id: 'hue', name: 'Huế', kind: 'city', aliases: ['thừa thiên huế'] },
  {
    id: 'an-giang',
    name: 'An Giang',
    kind: 'province',
    aliases: ['kiên giang', 'phú quốc'],
  },
  {
    id: 'bac-ninh',
    name: 'Bắc Ninh',
    kind: 'city',
    aliases: ['bắc giang'],
  },
  { id: 'ca-mau', name: 'Cà Mau', kind: 'province', aliases: ['bạc liêu'] },
  { id: 'cao-bang', name: 'Cao Bằng', kind: 'province' },
  { id: 'dak-lak', name: 'Đắk Lắk', kind: 'province', aliases: ['phú yên'] },
  { id: 'dien-bien', name: 'Điện Biên', kind: 'province' },
  {
    id: 'dong-nai',
    name: 'Đồng Nai',
    kind: 'city',
    aliases: ['bình phước'],
  },
  {
    id: 'dong-thap',
    name: 'Đồng Tháp',
    kind: 'province',
    aliases: ['tiền giang'],
  },
  {
    id: 'gia-lai',
    name: 'Gia Lai',
    kind: 'province',
    aliases: ['bình định', 'quy nhơn'],
  },
  { id: 'ha-tinh', name: 'Hà Tĩnh', kind: 'province' },
  {
    id: 'hung-yen',
    name: 'Hưng Yên',
    kind: 'province',
    aliases: ['thái bình'],
  },
  {
    id: 'khanh-hoa',
    name: 'Khánh Hòa',
    kind: 'province',
    aliases: ['ninh thuận', 'nha trang'],
  },
  { id: 'lai-chau', name: 'Lai Châu', kind: 'province' },
  {
    id: 'lam-dong',
    name: 'Lâm Đồng',
    kind: 'province',
    aliases: ['đắk nông', 'bình thuận', 'đà lạt'],
  },
  { id: 'lang-son', name: 'Lạng Sơn', kind: 'province' },
  {
    id: 'lao-cai',
    name: 'Lào Cai',
    kind: 'province',
    aliases: ['yên bái', 'sa pa'],
  },
  { id: 'nghe-an', name: 'Nghệ An', kind: 'province', aliases: ['vinh'] },
  {
    id: 'ninh-binh',
    name: 'Ninh Bình',
    kind: 'province',
    aliases: ['hà nam', 'nam định'],
  },
  {
    id: 'phu-tho',
    name: 'Phú Thọ',
    kind: 'province',
    aliases: ['vĩnh phúc', 'hòa bình'],
  },
  {
    id: 'quang-ngai',
    name: 'Quảng Ngãi',
    kind: 'province',
    aliases: ['kon tum'],
  },
  {
    id: 'quang-ninh',
    name: 'Quảng Ninh',
    kind: 'city',
    aliases: ['hạ long'],
  },
  {
    id: 'quang-tri',
    name: 'Quảng Trị',
    kind: 'province',
    aliases: ['quảng bình'],
  },
  { id: 'son-la', name: 'Sơn La', kind: 'province' },
  { id: 'tay-ninh', name: 'Tây Ninh', kind: 'province', aliases: ['long an'] },
  {
    id: 'thai-nguyen',
    name: 'Thái Nguyên',
    kind: 'province',
    aliases: ['bắc kạn'],
  },
  { id: 'thanh-hoa', name: 'Thanh Hóa', kind: 'province' },
  {
    id: 'tuyen-quang',
    name: 'Tuyên Quang',
    kind: 'province',
    aliases: ['hà giang'],
  },
  {
    id: 'vinh-long',
    name: 'Vĩnh Long',
    kind: 'province',
    aliases: ['bến tre', 'trà vinh'],
  },
];

const API_URL = 'https://provinces.open-api.vn/api/v2/p/';
/** One place as the API gives it (only what's used). */
export interface ApiProvince {
  name: string;
  code: number;
  division_type: string;
  codename: string;
}

/** Old names to search by, which the API doesn't have: by id. */
const ALIASES = new Map(
  FALLBACK_PROVINCES.map(place => [place.id, place.aliases ?? []]),
);

/**
 * The API's place as the app's: "Thành phố Hà Nội" as "Hà Nội", a city if
 * it's run from the centre, with the old names to search by.
 */
export function toProvince(item: ApiProvince): Province {
  const id = item.codename.replace(/_/g, '-');
  const name = item.name.replace(/^(Thành phố|Tỉnh)\s+/i, '');
  return {
    id,
    name,
    kind: /thành phố/i.test(item.division_type) ? 'city' : 'province',
    aliases: [item.name, ...(ALIASES.get(id) ?? [])],
  };
}

/** Cities first, then provinces, each by name. */
export const sortProvinces = (list: readonly Province[]) =>
  [...list].sort(
    (a, b) =>
      Number(a.kind === 'province') - Number(b.kind === 'province') ||
      a.name.localeCompare(b.name, 'vi'),
  );

/** The 34 from the API, as the app's places; throws when it can't get them. */
export async function fetchProvinces(): Promise<Province[]> {
  const { data } = await http.get<ApiProvince[]>(API_URL);
  if (!Array.isArray(data) || !data.length) {
    throw new Error('provinces: empty list');
  }
  return sortProvinces(data.map(toProvince));
}

export const getProvince = (
  id: string | undefined,
  list: readonly Province[],
) => (id ? list.find(place => place.id === id) : undefined);

/** A place's name, or nothing for an id that isn't (or no longer is) one. */
export const provinceName = (
  id: string | undefined,
  list: readonly Province[],
) => getProvince(id, list)?.name;

/**
 * Places matching what was typed, accents or not, by name or an old name;
 * names starting with it first. Nothing typed: all of them, cities first.
 */
export function searchProvinces(
  query: string,
  list: readonly Province[],
): Province[] {
  const q = normalizeSearch(query);
  if (!q) {
    return [...list];
  }
  const scored = list.map(place => {
    const name = normalizeSearch(place.name);
    const aliases = (place.aliases ?? []).map(normalizeSearch);
    const score = name.startsWith(q)
      ? 0
      : name.includes(q)
      ? 1
      : aliases.some(alias => alias.includes(q))
      ? 2
      : -1;
    return { place, score };
  });
  return scored
    .filter(({ score }) => score >= 0)
    .sort((a, b) => a.score - b.score)
    .map(({ place }) => place);
}
