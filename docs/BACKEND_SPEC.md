# DoTogether — Backend Spec (v0.1)

Tài liệu mô tả dữ liệu, nghiệp vụ và API mà app mobile cần, dựa trên các màn hình đã làm (Home, Discover, Activity Detail, I'm Free, Free nearby map, Lịch sử, Profile, Auth). Mục tiêu: làm đầu vào để thiết kế BE; chỗ nào còn mở được đánh dấu ở mục [Câu hỏi mở](#12-câu-hỏi-mở).

> Hiện app chạy bằng dữ liệu giả trong `src/services/mockData.ts` và `src/services/discover.ts`. Mỗi endpoint dưới đây ghi rõ đang thay cho hàm/màn nào.

---

## 1. Quy ước chung

| Mục         | Quy ước                                                                        |
| ----------- | ------------------------------------------------------------------------------ |
| Base URL    | `https://api.<domain>/v1` (FE đọc từ `API_BASE_URL`)                           |
| Định dạng   | JSON, `camelCase`                                                              |
| Thời gian   | ISO 8601 UTC (`2026-10-06T07:30:00Z`). FE tự đổi sang giờ máy.                 |
| Toạ độ      | `{ "lat": number, "lng": number }` (WGS84)                                     |
| Khoảng cách | Server trả `distanceKm` (number) tính từ vị trí user gửi lên                   |
| Auth        | `Authorization: Bearer <accessToken>` cho mọi endpoint trừ nhóm `/auth/*`      |
| Ngôn ngữ    | Header `Accept-Language: vi` \| `en` (cho text do server sinh: thông báo, lỗi) |
| ID          | String (UUID/ULID), FE không giả định định dạng                                |

### 1.1 Phân trang (cursor)

Mọi danh sách dài (hoạt động hot, cộng đồng, lịch sử…) dùng chung một kiểu, FE đã có hook `usePagedList` cho pull-to-refresh + load more.

Request: `?limit=20&cursor=<opaque>` (không gửi `cursor` = trang đầu)

```json
{
  "items": [],
  "nextCursor": "eyJvZmZzZXQiOjIwfQ",
  "hasMore": true
}
```

### 1.2 Lỗi

```json
{
  "error": {
    "code": "ACTIVITY_FULL",
    "message": "This activity is already full.",
    "details": {}
  }
}
```

| HTTP | Khi nào                                                               |
| ---- | --------------------------------------------------------------------- |
| 400  | Dữ liệu sai (`VALIDATION_ERROR`, kèm `details.fields`)                |
| 401  | Thiếu/hết hạn token (`UNAUTHENTICATED`)                               |
| 403  | Không có quyền (`FORBIDDEN`)                                          |
| 404  | Không tìm thấy (`NOT_FOUND`)                                          |
| 409  | Xung đột nghiệp vụ (xem bảng mã lỗi ở [mục 10](#10-mã-lỗi-nghiệp-vụ)) |
| 429  | Gọi quá nhiều (`RATE_LIMITED`)                                        |

---

## 2. Enum dùng chung

| Enum                   | Giá trị                                                                                                                    |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `ActivityCategory`     | `running`, `coffee`, `food`, `football`, `badminton`, `gaming`, `movie`, `walking`, `photography`, `coworking`, `language` |
| `BroadcastActivityId`  | `ActivityCategory` + `other` (hoạt động tự đặt)                                                                            |
| `ActivityStatus`       | `upcoming`, `ongoing`, `completed`                                                                                         |
| `ParticipationStatus`  | `joined`, `not_joined`                                                                                                     |
| `SlotStatus`           | `available`, `full`                                                                                                        |
| `ActivityInfoTileKind` | `pace`, `vibe`                                                                                                             |
| `CommunityTone`        | `primary`, `neutral`, `success` (màu hiển thị)                                                                             |
| `BroadcastDuration`    | `30m`, `1h`, `2h`, `3h`                                                                                                    |
| `FriendRequestStatus`  | `pending`, `accepted`, `declined`, `cancelled`                                                                             |

---

## 3. Thực thể (data model)

Kiểu viết theo TypeScript cho dễ đối chiếu với FE. `?` = có thể không có.

### 3.1 User

```ts
interface User {
  id: string;
  name: string;
  email: string; // chỉ trả cho chính chủ
  age?: number;
  avatarUrl?: string;
  note?: string; // dòng giới thiệu ngắn, vd "Pace ~5:45 min/km"
  trust: number; // 0–100, % tin cậy (xem 4.6)
  activitiesCount: number; // số hoạt động đã hoàn thành
  interests: ActivityCategory[];
  createdAt: string;
}
```

**Thông tin công khai (`PublicUser`)** — dùng khi hiển thị người khác: bỏ `email`, thêm các trường theo ngữ cảnh:

```ts
interface PublicUser {
  id: string;
  name: string;
  age?: number;
  avatarUrl?: string;
  note?: string;
  trust: number;
  activitiesCount: number;
  interests: ActivityCategory[];
  distanceKm?: number; // so với vị trí người xem
  // Quan hệ với người xem:
  isFollowing?: boolean;
  friendRequestStatus?: FriendRequestStatus | null;
  invitedByMe?: boolean;
}
```

### 3.2 Activity

```ts
interface Activity {
  id: string;
  category: ActivityCategory;
  title: string;
  markerTitle: string; // nhãn ngắn trên marker bản đồ
  tag: string; // vd "Run • 5 km"
  description: string; // 1 dòng trên card
  longDescription: string; // màn chi tiết
  coverUrl?: string; // ảnh bìa → card lớn có ảnh
  location: { lat: number; lng: number };
  meetingPoint: string; // tên điểm hẹn
  routeLabel: string;
  routeName: string;
  showRouteDetails: boolean;
  startsAt: string;
  endsAt: string; // = startsAt + thời lượng
  createdAt: string;
  instantMatch: boolean;
  hostId: string;
  capacity?: number; // không có = không giới hạn
  extraTile: { kind: ActivityInfoTileKind; value: string; hint: string };

  // Server tính sẵn cho người xem (xem mục 4):
  status: ActivityStatus;
  slotStatus: SlotStatus;
  participation: ParticipationStatus;
  membersCount: number; // đã gồm host và người xem nếu đã join
  spotsLeft: number | null; // null khi không giới hạn
  distanceKm: number;
  checkedIn: boolean; // người xem đã check-in chưa
  host: PublicUser;
  membersPreview: PublicUser[]; // tối đa 3, host đầu tiên (avatar trên card)
}
```

> FE hiện dùng `startsInMinutes`, `durationMinutes`, `createdMinutesAgo` (tương đối). Khi nối API sẽ đổi sang `startsAt` / `endsAt` / `createdAt`.

### 3.3 ActivityMember

```ts
interface ActivityMember {
  user: PublicUser;
  isHost: boolean;
  statusText: string; // vd "On the way • 5 min", do member tự cập nhật
  ready: boolean;
  checkedInAt?: string;
  joinedAt: string;
}
```

### 3.4 Community

```ts
interface Community {
  id: string;
  name: string;
  category: ActivityCategory;
  icon: string; // tên icon (Ionicons) — hoặc đổi sang iconUrl
  tone: CommunityTone;
  membersCount: number;
  schedule: string; // vd "Daily runs at 18:00"
  joined: boolean; // người xem đã tham gia nhóm
}
```

### 3.5 Broadcast ("Mình rảnh")

User báo đang/sắp rảnh để người gần đó thấy và rủ.

```ts
interface Broadcast {
  id: string;
  userId: string;
  activity: BroadcastActivityId;
  customActivityId?: string; // khi activity = "other"
  availableFrom: string; // "now" / "+30 phút" / "tối nay" / giờ tự chọn → FE gửi thời điểm cụ thể
  availableUntil: string; // availableFrom + duration
  radiusKm: number; // 0.5 – 10, bước 0.5
  note?: string; // ≤ 200 ký tự, hiển thị như "freeWish"
  location: { lat: number; lng: number };
  locationPublic: boolean; // cho phép hiện trên bản đồ Free nearby
  createdAt: string;
  cancelledAt?: string;
}
```

### 3.6 CustomActivity (hoạt động tự đặt cho I'm Free)

```ts
interface CustomActivity {
  id: string;
  name: string; // ≤ 30 ký tự, không trùng tên (không phân biệt hoa thường) trong cùng user
  emoji: string;
  imageUrl?: string;
  updatedAt: string;
}
```

Tối đa **8** mục mỗi user; lưu tên trùng thì ghi đè và đưa lên đầu; quá 8 thì xoá mục cũ nhất.

### 3.7 Quan hệ xã hội

```ts
interface Follow {
  followerId: string;
  followeeId: string;
  createdAt: string;
}

interface FriendRequest {
  id: string;
  fromUserId: string;
  toUserId: string;
  status: FriendRequestStatus;
  createdAt: string;
  respondedAt?: string;
}

interface Invite {
  // "Rủ" một người đang rảnh
  id: string;
  fromUserId: string;
  toUserId: string;
  activityId?: string; // rủ vào một hoạt động cụ thể (màn chi tiết) hoặc rủ chung (Discover)
  createdAt: string;
}
```

---

## 4. Quy tắc nghiệp vụ

### 4.1 Trạng thái hoạt động (server tính theo giờ hiện tại)

| `status`    | Điều kiện                 |
| ----------- | ------------------------- |
| `upcoming`  | `now < startsAt`          |
| `ongoing`   | `startsAt ≤ now < endsAt` |
| `completed` | `now ≥ endsAt`            |

### 4.2 Trạng thái slot

- `full` khi `capacity` có giá trị và `membersCount ≥ capacity`; ngược lại `available`.
- Không giới hạn (`capacity` null) → luôn `available`.

### 4.3 Hiển thị ở đâu

| Nơi                                              | Hiện những hoạt động                                                      |
| ------------------------------------------------ | ------------------------------------------------------------------------- |
| Home (bản đồ + danh sách "Happening right now")  | `status ∈ {upcoming, ongoing}` **và** `slotStatus = available`            |
| Discover — "Hoạt động hot sắp diễn ra", tìm kiếm | `status = upcoming` (tìm kiếm: `upcoming` + `ongoing`) **và** `available` |
| Lịch sử (tab Hoạt động, Profile)                 | `status = completed` **và** user đã tham gia                              |
| Màn chi tiết                                     | Mọi trạng thái (mở qua id)                                                |

> Cần chốt: hoạt động **đầy nhưng user đã tham gia** có hiện ở Home với chính user đó không (FE hiện tại: không xử lý riêng). Xem [Câu hỏi mở](#12-câu-hỏi-mở).

### 4.4 Tham gia / rời

- Chỉ join được khi `status = upcoming` và `slotStatus = available` → ngược lại `409 ACTIVITY_NOT_JOINABLE` / `409 ACTIVITY_FULL`.
- Join phải chống race condition (2 người cùng lấy slot cuối) → khoá/transaction trên số member.
- **Trùng giờ**: nếu user đã join một hoạt động chưa kết thúc mà khoảng `[startsAt, endsAt)` giao nhau với hoạt động mới → trả `409 TIME_CONFLICT` kèm hoạt động bị trùng. FE hiện modal cảnh báo; nếu user chọn "Vẫn tham gia" thì gọi lại với `force: true`.
  - Hai khoảng giao nhau khi `a.startsAt < b.endsAt && b.startsAt < a.endsAt`.
- Rời: chỉ khi `status = upcoming`. Host không được rời (phải huỷ hoạt động — chưa có trên FE).
- Khi `ongoing` hoặc `completed`: **chỉ xem**, mọi thao tác ghi (join, leave, check-in, mời, nhắn, lưu, chia sẻ) đều bị chặn ở FE; BE cũng phải chặn.

### 4.5 Check-in

- Chỉ người đã join, chưa check-in, và hoạt động đang `upcoming`.
- Client gửi vị trí hiện tại; server kiểm tra khoảng cách tới `location` **≤ 50 m** (haversine). Xa hơn → `409 TOO_FAR_TO_CHECK_IN` kèm `details.distanceMeters`.
- Bán kính 50 m nên là cấu hình server.

> Cần chốt: có cho check-in khi đã `ongoing` không (FE hiện chặn vì "đang diễn ra chỉ xem thông tin").

### 4.6 Trust & activitiesCount

- `activitiesCount` = số hoạt động `completed` user đã tham gia (với host: số đã dẫn).
- `trust` (0–100): chưa có công thức trên FE. Gợi ý: dựa trên tỉ lệ check-in so với số lần join, đánh giá sau hoạt động. Cần chốt.

### 4.7 Người rảnh gần đây (Free nearby)

- Nguồn: các `Broadcast` đang hiệu lực (`availableFrom ≤ now + 30' ` hoặc tuỳ chốt, `now < availableUntil`, chưa huỷ).
- Discover lấy trong bán kính **2 km** quanh user, chỉ người có `note` (freeWish).
- Bản đồ Free nearby chỉ hiện người có `locationPublic = true`. Toạ độ trả về nên làm tròn (vd ~50–100 m) để không lộ vị trí chính xác.
- Màn chi tiết hoạt động: "Đang rảnh gần đây" = người rảnh có `interests` chứa `category` của hoạt động và chưa là member.

---

## 5. API — Auth

Thay cho `src/services/auth.ts` (đang giả lập).

| Method | Path                    | Mô tả                                  |
| ------ | ----------------------- | -------------------------------------- |
| POST   | `/auth/signup`          | Đăng ký email                          |
| POST   | `/auth/login`           | Đăng nhập email                        |
| POST   | `/auth/social`          | Đăng nhập Google / Apple               |
| POST   | `/auth/refresh`         | Đổi refresh token lấy access token mới |
| POST   | `/auth/logout`          | Thu hồi refresh token                  |
| POST   | `/auth/password/forgot` | Gửi mã đặt lại mật khẩu qua email      |
| POST   | `/auth/password/reset`  | Đặt lại mật khẩu bằng mã               |

```http
POST /auth/signup
{ "fullName": "Gray", "email": "gray@mail.com", "password": "******" }

POST /auth/login
{ "email": "gray@mail.com", "password": "******" }

POST /auth/social
{ "provider": "google" | "apple", "idToken": "..." }
```

Response chung:

```json
{
  "accessToken": "...",
  "refreshToken": "...",
  "expiresIn": 3600,
  "user": { "id": "u_1", "email": "gray@mail.com", "displayName": "Gray" }
}
```

Validate: email đúng định dạng, mật khẩu ≥ 6 ký tự (khớp FE). Lỗi: `EMAIL_TAKEN`, `INVALID_CREDENTIALS`, `INVALID_RESET_CODE`.

---

## 6. API — User & Profile

| Method | Path           | Mô tả                                  | Màn            |
| ------ | -------------- | -------------------------------------- | -------------- |
| GET    | `/me`          | Hồ sơ của tôi + thống kê               | Profile        |
| PATCH  | `/me`          | Sửa tên, tuổi, avatar, note, interests | (chưa có UI)   |
| PUT    | `/me/location` | Cập nhật vị trí hiện tại               | Home, I'm Free |
| GET    | `/users/{id}`  | Hồ sơ công khai                        | (chưa có UI)   |

```http
PUT /me/location
{ "lat": 21.0515, "lng": 105.833 }
```

`GET /me` trả `User` + `{ "stats": { "completedCount": 3 } }`.

---

## 7. API — Activities

### 7.1 Danh sách cho Home

`GET /activities/nearby?lat=&lng=&category=&q=&radiusKm=5`

- Lọc theo [4.3](#43-hiển-thị-ở-đâu) (upcoming + ongoing, còn slot).
- `category`: một `ActivityCategory` hoặc bỏ trống = tất cả. `q`: tìm theo `title`, không dấu, không phân biệt hoa thường.
- Trả toàn bộ trong bán kính (bản đồ cần hết để gom cụm marker); nếu nhiều có thể thêm `bbox`.
- Sắp xếp: `ongoing` trước, rồi `startsAt` tăng dần.

```json
{
  "items": [
    /* Activity */
  ]
}
```

### 7.2 Hoạt động hot sắp diễn ra (Discover + màn "Tất cả")

`GET /activities/upcoming?lat=&lng=&category=&limit=&cursor=`

- `status = upcoming`, còn slot, sắp theo `startsAt` tăng dần. Discover lấy 3 mục đầu; màn "Tất cả" phân trang (thay `fetchUpcomingActivities`).

### 7.3 Tìm kiếm (Discover)

`GET /activities/search?q=&category=&lat=&lng=&limit=&cursor=`

- FE debounce 400 ms. Khớp theo tên hoạt động, bỏ dấu tiếng Việt ("ca phe" tìm ra "Cà phê").

### 7.4 Chi tiết

`GET /activities/{id}?lat=&lng=`

```json
{
  "activity": {
    /* Activity */
  },
  "members": [
    /* ActivityMember, host đầu tiên */
  ],
  "nearbyFree": [
    /* PublicUser + freeInMinutes, chỉ khi status = upcoming */
  ],
  "permissions": {
    "canJoin": true,
    "canLeave": false,
    "canCheckIn": false,
    "canInvite": true,
    "canChat": true
  }
}
```

`permissions` giúp FE không phải tự suy luận (ongoing/completed → tất cả `false`).

### 7.5 Tham gia

`POST /activities/{id}/join`

```json
{ "force": false }
```

| Kết quả                         | Response                                                                              |
| ------------------------------- | ------------------------------------------------------------------------------------- |
| Thành công                      | `200` `{ "activity": Activity }`                                                      |
| Trùng giờ (khi `force = false`) | `409` `TIME_CONFLICT`, `details.conflict = { id, title, category, startsAt, endsAt }` |
| Hết chỗ                         | `409` `ACTIVITY_FULL`                                                                 |
| Đã bắt đầu / kết thúc           | `409` `ACTIVITY_NOT_JOINABLE`                                                         |
| Đã join                         | `200` (idempotent)                                                                    |

> Có thể thêm `GET /activities/{id}/conflicts` để FE kiểm tra trước khi bấm; nhưng dựa vào `409` là đủ.

Sau khi join: thông báo cho host ([mục 9](#9-thông-báo--realtime)).

### 7.6 Rời

`DELETE /activities/{id}/join` → `204`. Lỗi `ACTIVITY_NOT_JOINABLE` nếu đã bắt đầu; `FORBIDDEN` nếu là host.

### 7.7 Check-in

`POST /activities/{id}/check-in`

```json
{ "lat": 21.05152, "lng": 105.83301, "accuracyM": 12 }
```

- Thành công `200` `{ "checkedInAt": "..." }`.
- `409 TOO_FAR_TO_CHECK_IN` `{ "distanceMeters": 320, "radiusMeters": 50 }`.
- Cân nhắc từ chối khi `accuracyM` quá lớn (vd > 100 m) để tránh gian lận.

### 7.8 Cập nhật trạng thái thành viên

`PATCH /activities/{id}/members/me` `{ "statusText": "On the way • 5 min", "ready": true }` (FE đang hiển thị, chưa có UI sửa).

### 7.9 Lưu / chia sẻ (header màn chi tiết)

| Method | Path                    |
| ------ | ----------------------- |
| PUT    | `/activities/{id}/save` |
| DELETE | `/activities/{id}/save` |

Chia sẻ dùng share sheet của máy; BE chỉ cần deep link `https://<domain>/a/{id}` (cần chốt).

### 7.10 Tạo hoạt động

Nút "+" trên tab bar — **chưa có màn tạo**. Dự kiến `POST /activities` với các trường của [3.2](#32-activity) do người tạo nhập (`hostId` = người gọi, host tự là member đầu tiên).

---

## 8. API — Lịch sử, Discover phụ, I'm Free, Xã hội

### 8.1 Lịch sử hoạt động

`GET /me/activities/history?limit=&cursor=`

- `status = completed` và user đã tham gia, mới nhất trước. Dùng cho tab Hoạt động (toàn bộ) và Profile (3 mục đầu + tổng số).
- Mỗi item cần: `id, category, title, meetingPoint, startsAt, endsAt, membersCount, membersPreview`.

(Tuỳ chọn) `GET /me/activities/upcoming` — các hoạt động đã join sắp tới, nếu sau này tab Hoạt động có thêm mục "Sắp tham gia".

### 8.2 Cộng đồng

| Method | Path                                    | Mô tả                                                                              |
| ------ | --------------------------------------- | ---------------------------------------------------------------------------------- |
| GET    | `/communities?category=&limit=&cursor=` | Sắp theo `membersCount` giảm dần (thay `fetchCommunities`); Discover lấy 3 mục đầu |
| PUT    | `/communities/{id}/membership`          | Tham gia nhóm                                                                      |
| DELETE | `/communities/{id}/membership`          | Rời nhóm                                                                           |

### 8.3 Người rảnh gần đây

| Method | Path                                               | Mô tả                                                                               |
| ------ | -------------------------------------------------- | ----------------------------------------------------------------------------------- |
| GET    | `/free-people?lat=&lng=&radiusKm=2&category=`      | Discover "Free nearby": người có broadcast hiệu lực + note                          |
| GET    | `/free-people/map?lat=&lng=&radiusKm=2`            | Bản đồ: chỉ `locationPublic = true`, kèm `location` (đã làm tròn)                   |
| GET    | `/free-people/count?lat=&lng=&radiusKm=&activity=` | Số người rảnh phù hợp + 3 avatar xem trước (màn I'm Free cập nhật khi kéo bán kính) |

Item:

```json
{
  "user": {
    /* PublicUser */
  },
  "freeInMinutes": 0,
  "freeWish": {
    "category": "badminton",
    "text": "Need a doubles partner tonight"
  },
  "location": { "lat": 21.0498, "lng": 105.8318 }
}
```

### 8.4 Broadcast ("Mình rảnh")

| Method | Path                    | Mô tả                       |
| ------ | ----------------------- | --------------------------- |
| POST   | `/broadcasts`           | Phát "mình rảnh"            |
| GET    | `/broadcasts/me/active` | Broadcast đang chạy của tôi |
| DELETE | `/broadcasts/{id}`      | Huỷ                         |

```http
POST /broadcasts
{
  "activity": "running",
  "customActivityId": null,
  "availableFrom": "2026-10-06T11:00:00Z",
  "duration": "1h",
  "radiusKm": 3,
  "note": "Easy 5k around West Lake",
  "location": { "lat": 21.05, "lng": 105.83 },
  "locationPublic": true
}
```

- Mỗi user tối đa **1** broadcast hiệu lực; tạo mới thì thay cái cũ (cần chốt).
- Response gồm `matchedCount` (số người rảnh phù hợp trong bán kính).
- Giờ tự chọn không được ở quá khứ (FE đã chặn; BE validate lại).

### 8.5 Hoạt động tự đặt (I'm Free → "Khác")

| Method | Path                                                                      |
| ------ | ------------------------------------------------------------------------- |
| GET    | `/me/custom-activities`                                                   |
| PUT    | `/me/custom-activities/{id}` (tạo hoặc ghi đè)                            |
| DELETE | `/me/custom-activities/{id}`                                              |
| POST   | `/uploads/images` → `{ "url": "..." }` (ảnh của hoạt động tự đặt, avatar) |

Quy tắc ở [3.6](#36-customactivity-hoạt-động-tự-đặt-cho-im-free). Hiện FE lưu trên máy (redux-persist), ảnh là data URI; khi có BE sẽ upload rồi lưu `imageUrl`.

### 8.6 Theo dõi, kết bạn, rủ

| Method | Path                                               | Mô tả                                              | Màn                       |
| ------ | -------------------------------------------------- | -------------------------------------------------- | ------------------------- |
| PUT    | `/users/{id}/follow`                               | Theo dõi                                           | Free nearby map           |
| DELETE | `/users/{id}/follow`                               | Bỏ theo dõi                                        | Free nearby map           |
| POST   | `/users/{id}/friend-requests`                      | Gửi lời mời kết bạn (idempotent)                   | Free nearby map           |
| DELETE | `/friend-requests/{id}`                            | Huỷ lời mời đã gửi                                 | (chưa có UI)              |
| POST   | `/friend-requests/{id}/accept` \| `/decline`       | Trả lời                                            | (chưa có UI)              |
| GET    | `/me/friend-requests?direction=incoming\|outgoing` | Danh sách                                          | (chưa có UI)              |
| POST   | `/invites`                                         | Rủ người đang rảnh `{ "toUserId", "activityId?" }` | Discover, Activity Detail |

Lỗi: `ALREADY_FRIENDS`, `CANNOT_TARGET_SELF`. Rủ cùng một người nhiều lần trong một khoảng thời gian → `429` hoặc trả lại invite cũ (cần chốt).

---

## 9. Thông báo & realtime

Nút chuông trên header hiện "Sắp ra mắt". Các sự kiện cần thông báo (push + danh sách trong app):

| Sự kiện                                  | Người nhận          |
| ---------------------------------------- | ------------------- |
| Có người join / rời hoạt động            | Host                |
| Hoạt động sắp bắt đầu (vd trước 15 phút) | Member              |
| Có người check-in                        | Member khác         |
| Được rủ (invite)                         | Người được rủ       |
| Lời mời kết bạn mới / được chấp nhận     | Người liên quan     |
| Có người theo dõi                        | Người được theo dõi |

Endpoint gợi ý:

| Method | Path                                                            |
| ------ | --------------------------------------------------------------- |
| POST   | `/me/devices` `{ "pushToken", "platform": "ios" \| "android" }` |
| GET    | `/me/notifications?limit=&cursor=`                              |
| POST   | `/me/notifications/read` `{ "ids": [] }`                        |

Realtime (WebSocket/SSE, tuỳ chọn giai đoạn sau): số người trong hoạt động, trạng thái member ("On the way…"), chat nhóm (nút "Mở nhóm chat" hiện "Sắp ra mắt").

---

## 10. Mã lỗi nghiệp vụ

| Code                    | HTTP | Ý nghĩa                                 | FE xử lý                                                        |
| ----------------------- | ---- | --------------------------------------- | --------------------------------------------------------------- |
| `TIME_CONFLICT`         | 409  | Đã join hoạt động khác trùng giờ        | Modal "Trùng thời gian", "Vẫn tham gia" → gửi lại `force: true` |
| `ACTIVITY_FULL`         | 409  | Hết chỗ                                 | Báo đầy, làm mới dữ liệu                                        |
| `ACTIVITY_NOT_JOINABLE` | 409  | Đã bắt đầu / kết thúc                   | Chuyển màn chi tiết sang chỉ xem                                |
| `NOT_A_MEMBER`          | 403  | Check-in / sửa trạng thái khi chưa join | —                                                               |
| `ALREADY_CHECKED_IN`    | 409  | Đã check-in                             | Coi như thành công                                              |
| `TOO_FAR_TO_CHECK_IN`   | 409  | Cách điểm hẹn > 50 m                    | Hiện khoảng cách còn lại                                        |
| `EMAIL_TAKEN`           | 409  | Email đã đăng ký                        | Lỗi ở ô email                                                   |
| `INVALID_CREDENTIALS`   | 401  | Sai email / mật khẩu                    | —                                                               |
| `ALREADY_FRIENDS`       | 409  | Đã là bạn                               | —                                                               |
| `CANNOT_TARGET_SELF`    | 400  | Tự follow / kết bạn / rủ mình           | —                                                               |

---

## 11. Gợi ý lưu trữ

- **PostgreSQL + PostGIS**: cột `geography(Point)` cho `activities.location`, `broadcasts.location`, `user_locations`; truy vấn bán kính bằng `ST_DWithin`, khoảng cách bằng `ST_Distance`.
- Index: `activities (starts_at, ends_at)`, GiST trên location, `activity_members (user_id, activity_id)` unique, `follows (follower_id, followee_id)` unique.
- Tìm kiếm không dấu: extension `unaccent` + `pg_trgm` trên `title`.
- Không lưu `status` / `slotStatus` cứng — tính khi query (hoặc cột generated / view) để không lệch theo thời gian.
- Lịch sử vị trí: chỉ giữ vị trí mới nhất mỗi user; broadcast hết hạn thì xoá hoặc ẩn toạ độ.

Bảng tối thiểu: `users`, `auth_identities`, `refresh_tokens`, `activities`, `activity_members`, `activity_saves`, `communities`, `community_members`, `broadcasts`, `custom_activities`, `follows`, `friend_requests`, `invites`, `user_locations`, `devices`, `notifications`.

---

## 12. Câu hỏi mở

1. Hoạt động **đầy nhưng user đã join**: có hiện ở Home/Discover với chính user đó không?
2. Có cho **check-in khi đã `ongoing`** không? (FE hiện chặn mọi thao tác khi đang diễn ra.)
3. **Trùng giờ** chỉ cảnh báo (cho "Vẫn tham gia") hay chặn hẳn?
4. Công thức **trust** (% tin cậy)?
5. Broadcast: một user được có **nhiều broadcast** cùng lúc không? "Rảnh" tính từ khi nào để hiện ở Free nearby (ngay lúc phát hay chỉ khi tới `availableFrom`)?
6. Bản đồ Free nearby: làm tròn toạ độ bao nhiêu mét?
7. Theo dõi một chiều và kết bạn hai chiều khác nhau ở quyền gì (vd chỉ bạn bè mới thấy vị trí chính xác)?
8. Hoạt động có **lặp lại** (cộng đồng "Daily runs at 18:00") không, hay mỗi buổi là một activity riêng?
9. Ai được **tạo hoạt động**, có cần duyệt không; host huỷ hoạt động thì thông báo thế nào?
10. Múi giờ: chỉ Việt Nam (UTC+7) hay đa múi giờ?
