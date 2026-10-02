# DoTogether — Coding Guidelines

Checklist bắt buộc mỗi khi **viết mới** hoặc **update** code. Đọc trước khi mở PR / merge.

---

## 1. Checklist trước khi merge

- [ ] **i18n**: mọi text UI dùng `i18next` (Anh + Việt), không hardcode chuỗi.
- [ ] **Form / input**: đã xử lý keyboard (KeyboardAvoidingView / dismiss / returnKey).
- [ ] **Search**: đã debounce, không gọi API/filter mỗi lần gõ.
- [ ] **List**: có empty state, pull-to-refresh, load more (nếu phân trang).
- [ ] **Tối thiểu file**, nhưng code sạch, dễ đọc, tách trách nhiệm rõ.
- [ ] Logic / UI dùng lại → đưa vào `components` hoặc `hooks`.
- [ ] Types dùng `interface`, nằm trong `src/types`.
- [ ] API nằm trong `src/services`.
- [ ] State: Redux Toolkit + Persist trong `src/store`.
- [ ] Navigation: React Navigation trong `src/navigators`.
- [ ] Token / style dùng chung trong `src/theme`.
- [ ] Helper, constant → `src/utils`.
- [ ] Custom hook → `src/hooks`.
- [ ] Mỗi screen là một folder module (`index` + `styles`), style dùng `react-native-size-matters` (`ms` ưu tiên).

---

## 2. Cấu trúc thư mục

```
src/
├── assets/          # fonts, icons, images, svg
├── components/      # UI tái sử dụng
├── hooks/           # custom hooks
├── navigators/      # React Navigation
├── screens/         # màn hình theo module
├── services/        # gọi API
├── store/           # Redux Toolkit + Persist
├── theme/           # màu, spacing, typography dùng chung
├── translations/    # i18next (en / vi)
├── types/           # interface / type
├── utils/           # helpers, constants
└── App.tsx
```

---

## 3. i18next (Anh + Việt)

- Mọi copy hiển thị cho user đi qua `t('key')`.
- Key đặt có namespace theo feature: `home.title`, `auth.login`, …
- File ngôn ngữ trong `src/translations` (ví dụ `en.json`, `vi.json`).
- Không nối chuỗi i18n bằng template hardcode nếu có thể dùng interpolation: `t('user.greeting', { name })`.

```tsx
import { useTranslation } from 'react-i18next';

const { t } = useTranslation();
return <Text>{t('home.title')}</Text>;
```

Khi thêm UI mới: **cập nhật đủ cả `en` và `vi`** trong cùng PR.

---

## 4. Form / Input — Keyboard

Khi màn có input:

- Bọc nội dung bằng `KeyboardAvoidingView` (iOS/Android behavior phù hợp).
- Cho phép dismiss keyboard (tap ngoài, `Keyboard.dismiss`, `keyboardShouldPersistTaps` trên ScrollView/FlatList).
- `returnKeyType` / `onSubmitEditing` để chuyển field hoặc submit hợp lý.
- Input trong list/scroll: đảm bảo field đang focus không bị che.

---

## 5. Search — Debounce

- Không gọi filter/API trên mỗi `onChangeText`.
- Dùng debounce (hook dùng chung trong `hooks` nếu tái sử dụng nhiều nơi).
- Delay hợp lý (thường ~300–500ms); hủy request cũ nếu có race.

```tsx
const [query, setQuery] = useState('');
const debouncedQuery = useDebounce(query, 400);

useEffect(() => {
  searchApi(debouncedQuery);
}, [debouncedQuery]);
```

---

## 6. List — Empty / Refresh / Load more

Mỗi list data từ API/store cần:

| Trạng thái | Yêu cầu |
|------------|---------|
| Empty | UI trống + copy i18n (không chỉ `null`) |
| Refresh | Pull-to-refresh (`Refreshing` + handler) |
| Load more | `onEndReached` / pagination khi còn trang |

Xử lý loading initial khác empty; tránh flash empty khi đang fetch lần đầu.

---

## 7. Clean code — Ít file, rõ ràng

- Chỉ tách file khi có lý do: tái sử dụng, file quá dài, hoặc trách nhiệm khác biệt rõ.
- Ưu tiên đọc được: tên rõ, hàm ngắn, không magic number (đưa vào `utils`/`theme` nếu dùng lại).
- Không over-abstract cho case chỉ dùng một lần.

---

## 8. Components tái sử dụng

Đặt trong `src/components` khi:

- Dùng ở ≥ 2 màn, hoặc
- Là UI chuẩn app (Button, EmptyState, SearchBar, …).

Component chỉ nhận props cần thiết; style đặc thù màn giữ ở screen module.

---

## 9. Types (`src/types`)

- Define bằng **`interface`** (trừ union/utility cần `type`).
- Một domain một file hoặc group theo feature: `user.ts`, `auth.ts`, …
- Import type từ `types`, không khai báo interface API response rải rác trong screen.

```ts
// src/types/user.ts
export interface User {
  id: string;
  name: string;
  email: string;
}
```

---

## 10. Services (`src/services`)

- Mọi gọi API nằm đây (không `fetch`/`axios` trực tiếp trong screen).
- Nhận/trả dữ liệu đã type; map lỗi về format thống nhất nếu cần.
- Screen / thunk chỉ gọi service.

---

## 11. Store — Redux Toolkit + Persist

- Slice, store config trong `src/store`.
- Dùng **Redux Toolkit** (`createSlice`, `createAsyncThunk`, …).
- Persist (redux-persist) cấu hình tại store; chỉ whitelist field cần giữ.
- Không mutate state ngoài reducer Immer của RTK.

---

## 12. Navigation (`src/navigators`)

- Stack / tab / param list khai báo trong `src/navigators`.
- Type param với React Navigation (`RootStackParamList`, …) — type liên quan có thể đặt `types` nếu dùng rộng.
- Screen không tự tạo navigator lẻ nếu đã có navigator cha.

---

## 13. Theme (`src/theme`)

- Màu, font, spacing, radius dùng chung → `src/theme`.
- Screen styles import token từ theme; tránh hardcode màu lặp lại.
- Không nhét style chỉ dùng một màn vào theme.

---

## 14. Utils (`src/utils`)

- Helpers thuần (format date, validate, …), constants, config không thuộc theme/i18n.
- Không để React component trong utils.

---

## 15. Hooks (`src/hooks`)

- Logic stateful / side-effect tái sử dụng (debounce, keyboard, pagination, …).
- Tên `useXxx`; hook không phụ thuộc UI cụ thể một screen nếu có thể generic.

---

## 16. Screen module + Styles

Mỗi màn hình = **một folder** trong `src/screens`:

```
src/screens/Home/
├── index.tsx    # UI + logic màn
└── styles.ts    # StyleSheet của màn
```

### Styles

- Tách riêng `styles.ts`, không viết `StyleSheet` dài trong `index.tsx`.
- Dùng **`react-native-size-matters`** để scale.
- **Ưu tiên `ms`** (moderate scale) cho hầu hết kích thước (padding, margin, font, radius, icon…).
- Chỉ dùng `s` / `vs` khi có lý do rõ (chiều ngang / dọc đặc biệt).

```ts
import { StyleSheet } from 'react-native';
import { ms } from 'react-native-size-matters';
import { colors } from '@/theme';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: ms(16),
    backgroundColor: colors.background,
  },
  title: {
    fontSize: ms(18),
    marginBottom: ms(8),
  },
});
```

```tsx
// index.tsx
import { styles } from './styles';
```

---

## 17. Luồng làm việc gợi ý khi thêm feature

1. Types → `types`
2. API → `services`
3. State (nếu cần) → `store`
4. Copy EN/VI → `translations`
5. Hook / component dùng lại (nếu có)
6. Screen module (`index` + `styles`) + đăng ký `navigators`
7. Chạy lại checklist mục 1

---

## 18. Những việc không làm

- Hardcode text UI thay vì i18n.
- Gọi API trong component screen khi đã có service layer.
- Nhét mọi thứ vào một `App.tsx` / một file khổng lồ.
- Style inline dài hoặc scale cứng (số px fixed) khi cần responsive.
- Tạo hàng loạt file wrapper vô nghĩa chỉ để “đủ folder”.
