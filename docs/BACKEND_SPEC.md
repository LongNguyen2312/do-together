# DoTogether — Backend Spec (v0.2)

Tài liệu mô tả dữ liệu, nghiệp vụ và API mà app mobile cần, dựa trên các màn hình đã làm (Home, Discover, Activity Detail, I'm Free, Free nearby map, Lịch sử, Profile, Auth, Chats, Group chat, Story: xem / đăng / trả lời). Mục tiêu: làm đầu vào để thiết kế BE; chỗ nào còn mở được đánh dấu ở mục [Câu hỏi mở](#14-câu-hỏi-mở).

> Hiện app chạy bằng dữ liệu giả trong `src/services/mockData.ts`, `src/services/discover.ts`, `src/services/chat.ts` và `src/services/stories.ts`. Mỗi endpoint dưới đây ghi rõ đang thay cho hàm/màn nào. Riêng nhạc cho story đã chạy thật: file nằm trên Cloudflare R2 (xem [3.10](#310-musictrack-nhạc-cho-story)).
>
> **Hạ tầng đã chốt** (Cloudflare, xem [mục 0](#0-hạ-tầng-cloudflare)): **D1** lưu dữ liệu, **R2** lưu media, **Durable Objects** lo mọi thứ realtime.
>
> **v0.2** thêm: upload media ([1.3](#13-upload-media)), Chat nhóm ([3.8](#38-chat-nhóm), [4.8](#48-chat-nhóm), [mục 9](#9-api--chat-nhóm)), Story và nhạc ([3.9](#39-story), [3.10](#310-musictrack-nhạc-cho-story), [4.9](#49-story), [mục 10](#10-api--story--nhạc)), thông báo / realtime, mã lỗi, bảng lưu trữ và câu hỏi mở tương ứng.

---

## 0. Hạ tầng (Cloudflare)

Toàn bộ BE chạy trên Cloudflare:

| Thành phần               | Dùng cho                                                                                                                                                                                          |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Workers**              | REST API `/v1/*`: xác thực, kiểm tra quyền, nghiệp vụ, ký URL upload R2, gửi push. Không giữ trạng thái.                                                                                          |
| **D1** (SQLite)          | **Database chính, nguồn sự thật** cho mọi dữ liệu có cấu trúc: user, hoạt động, thành viên, broadcast, quan hệ xã hội, tin nhắn chat, story, lượt xem, trả lời…                                   |
| **R2**                   | **Mọi media**: ảnh hoạt động, avatar, ảnh và voice trong chat, ảnh / video story (kèm ảnh bìa), nhạc cho story. Media được **nén ở app trước khi upload** ([1.4](#14-nén-trước-khi-upload)).      |
| **Durable Objects (DO)** | **Mọi thứ realtime**: chat nhóm, vị trí live khi đi hoạt động, trạng thái thành viên ("Đang tới…", check-in), số người, đẩy cập nhật về app đang mở ([11.1](#111-realtime-bằng-durable-objects)). |
| Cron Triggers            | Việc định kỳ: xoá story hết hạn (bản ghi D1 + file R2; trừ story đã ghim lên trang cá nhân), xoá upload không dùng, nhắc hoạt động sắp bắt đầu.                                                                                        |

```
App ──REST──▶ Worker ──▶ D1   (đọc / ghi dữ liệu)
 │                 └───▶ R2   (ký URL upload / đọc media)
 │──PUT file (URL ký sẵn)──▶ R2
 └──WebSocket──▶ Worker ──▶ Durable Object (1 phòng / hoạt động, 1 hộp thư / user)
                                   └──▶ D1 (ghi tin nhắn, sự kiện cần lưu)
```

Nguyên tắc:

- **D1 là nguồn sự thật.** DO giữ kết nối WebSocket và trạng thái ngắn hạn (ai đang online, vị trí live); thứ cần lưu lâu (tin nhắn, cảm xúc, check-in) DO ghi vào D1 trước rồi mới phát cho các kết nối.
- **Media không đi qua Worker / DO.** App upload thẳng lên R2 bằng URL ký sẵn, API chỉ nhận lại mã upload.
- **Workers không xử lý được video** (không có ffmpeg): mọi việc nén, đổi định dạng, cắt ảnh bìa đều làm ở app ([1.4](#14-nén-trước-khi-upload)). Server chỉ kiểm tra loại file, dung lượng và thời lượng.

---

## 1. Quy ước chung

| Mục         | Quy ước                                                                        |
| ----------- | ------------------------------------------------------------------------------ |
| Base URL    | `https://api.<domain>/v1` trên Workers (FE đọc từ `API_BASE_URL`)              |
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
| 409  | Xung đột nghiệp vụ (xem bảng mã lỗi ở [mục 12](#12-mã-lỗi-nghiệp-vụ)) |
| 429  | Gọi quá nhiều (`RATE_LIMITED`)                                        |

### 1.3 Upload media

Mọi media lưu trên **R2**. Ảnh, video và tin nhắn thoại không đi qua API mà app upload thẳng lên R2 bằng URL do Worker ký sẵn (presigned URL kiểu S3 của R2):

1. `POST /uploads` → xin chỗ upload
2. Client `PUT` file lên `uploadUrl` (kèm đúng `Content-Type`)
3. Gửi `uploadId` vào API nghiệp vụ (tạo story, gửi tin nhắn…). Server kiểm tra file đã lên, đúng loại, đúng giới hạn rồi mới gắn vào bản ghi.

```json
// POST /uploads
{ "purpose": "story" | "story_poster" | "chat_photo" | "chat_video" | "chat_video_poster" | "chat_voice" | "avatar" | "custom_activity" | "broadcast_photo",
  "contentType": "image/jpeg", "sizeBytes": 412345 }
// 201
{ "uploadId": "upl_123", "uploadUrl": "https://…r2.cloudflarestorage.com/…?X-Amz-Signature=…",
  "expiresAt": "2026-10-09T08:00:00Z" }
```

| `purpose`                   | Loại cho phép                                  | Giới hạn (gợi ý, cần chốt)           |
| --------------------------- | ---------------------------------------------- | ------------------------------------ |
| `story`                     | `image/jpeg`, `video/mp4`                      | Ảnh ≤ 2 MB; video ≤ 30 giây, ≤ 20 MB |
| `story_poster`              | `image/jpeg` (ảnh bìa video story, app tự cắt) | ≤ 300 KB                             |
| `chat_photo`                | `image/jpeg`                                   | ≤ 2 MB / ảnh, tối đa 5 ảnh / tin     |
| `chat_video`                | `video/mp4`                                    | ≤ 10 giây, ≤ 5 MB                    |
| `chat_video_poster`         | `image/jpeg` (ảnh bìa video chat, app tự cắt)  | ≤ 300 KB                             |
| `broadcast_photo`           | `image/jpeg` (ảnh mô tả "Mình rảnh")           | ≤ 2 MB, 1 ảnh / broadcast            |
| `chat_voice`                | `audio/mp4` (AAC, đuôi `.m4a`)                 | ≤ 5 phút, ≤ 3 MB                     |
| `avatar`, `custom_activity` | `image/jpeg`                                   | ≤ 1 MB                               |

Giới hạn trên là **sau khi nén** ([1.4](#14-nén-trước-khi-upload)), cần chốt lại khi có số liệu thật. File vượt giới hạn hoặc sai loại bị từ chối (`MEDIA_TOO_LARGE`, `UNSUPPORTED_MEDIA`).

- Upload chưa được dùng sau 24 giờ thì Cron xoá (bản ghi `uploads` trong D1 + file trên R2).
- Khi gắn file vào bản ghi, Worker đọc đầu file trên R2 (range request) để kiểm tra: ảnh đúng JPEG; video đọc thời lượng từ hộp `mvhd` của MP4 (story > 30,5 giây, chat > 10,5 giây → `VIDEO_TOO_LONG`).
- Thay cho `POST /uploads/images` ghi ở [8.5](#85-hoạt-động-tự-đặt-im-free--khác).

### 1.4 Nén trước khi upload

App **bắt buộc nén** mọi media trước khi lưu hoặc upload lên R2, **không bao giờ gửi file gốc**, để tiết kiệm dung lượng lưu trữ, dữ liệu di động của người dùng và thời gian tải khi xem. Server không nén lại (Workers không xử lý được ảnh / video), chỉ chặn file vượt giới hạn ở [1.3](#13-upload-media).

| Loại                         | Chuẩn sau khi nén                                                                                              | Dung lượng thường gặp | Hiện trạng FE                                                                                                                                                                      |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ảnh story, chat              | JPEG, cạnh dài ≤ 1600 px, chất lượng 0.8; bỏ EXIF (vị trí GPS); HEIC / PNG đổi sang JPEG                       | 200–600 KB            | **Đã làm** (`compressPhoto` trong `src/services/media.ts`): story nén khi mở màn soạn, ảnh chat nén trước khi gửi. Đo thử: ảnh 4000×3000 → 1600×1200, 131 KB.                      |
| Avatar, ảnh hoạt động tự đặt | JPEG, cạnh dài ≤ 800 px, chất lượng 0.8                                                                        | 80–200 KB             | **Đã làm** cho ảnh hoạt động tự đặt (320 px vì lưu thẳng trong store, `compressPhotoToDataUri`). App chưa có màn đổi avatar.                                                       |
| Video story, video chat      | H.264 + AAC trong MP4, cạnh dài ≤ 1280 px (720p), ~2,5 Mbps, 30 fps; story tối đa 30 giây, chat tối đa 10 giây | 5–10 MB / 30 giây     | **Đã làm** (`compressVideo`): nén ngầm khi mở màn soạn, nút "Chia sẻ" hiện % và chỉ bấm được khi nén xong; đóng màn thì huỷ. Đo thử: 1080p 12 Mbps 45,8 MB → 720p 2,5 Mbps 9,9 MB. |
| Ảnh bìa video                | JPEG khung hình đầu, cạnh dài ≤ 720 px                                                                         | 30–100 KB             | **Đã làm** (`videoPoster`): cắt khung đầu sau khi nén, ô story ở tab Chats dùng ảnh này. Đo thử: 720×1280, 76 KB.                                                                  |
| Tin nhắn thoại               | AAC trong `.m4a`, mono, 64 kbps, 44.1 kHz                                                                      | ~0,5 MB / phút        | **Đã làm**: ghi âm AAC mono 64 kbps, 44,1 kHz (`VOICE_FORMAT` trong `src/services/audio.ts`).                                                                                      |

Upload nên chạy nền, có thanh tiến trình và cho thử lại khi mất mạng; story / tin nhắn chỉ được tạo sau khi upload xong.

> Thư viện nén: `react-native-compressor` 2.0.3. Bản gốc trên iOS đọc sai kích thước tối đa và chất lượng ảnh (luôn ra 1280 px, chất lượng 0.8); đã vá bằng `patches/react-native-compressor+2.0.3.patch` (tự áp dụng khi `yarn install`).

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
| `ReportReason`         | `spam`, `harassment`, `inappropriate`, `scam`, `other`                                                                     |
| `StoryMediaType`       | `photo`, `video`                                                                                                           |
| `StoryOverlayKind`     | `text`, `sticker`                                                                                                          |

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
  customInterests: string[]; // sở thích tự nhập ngoài danh mục: ≤ 10 mục, mỗi mục ≤ 24 ký tự, không trùng (bỏ dấu, không phân biệt hoa thường) với nhau và với tên danh mục
  hometown?: ProvinceId | null; // quê quán, cấp tỉnh/thành
  currentCity?: ProvinceId | null; // nơi ở hiện tại, cấp tỉnh/thành
  createdAt: string;
}
```

`ProvinceId` là id một trong 34 tỉnh/thành (sau sáp nhập 07/2025), vd `ha-noi`, `ho-chi-minh`, `nghe-an`: chính là `codename` của [API tỉnh thành mở](https://provinces.open-api.vn/api/v2/p/) (v2) với `_` đổi thành `-`. FE gọi API này mỗi lần mở app (ngay lúc splash, chạy ngầm) và giữ kết quả trong Redux (`placesSlice`), các màn chỉ đọc từ đó; chỉ khi gọi lỗi mới dùng bản dựng sẵn trong app (`src/services/places.ts`). Tên cũ để tìm kiếm (vd "Sài Gòn", "Bình Dương") do FE tự thêm vì API không có. BE nên kiểm tra `hometown` / `currentCity` thuộc danh sách codename của cùng API (id lạ → `400 VALIDATION_ERROR`); FE gặp id lạ thì bỏ qua (không hiện).

**Thông tin công khai (`PublicUser`)** — dùng khi hiển thị người khác: bỏ `email`, thêm các trường theo ngữ cảnh:

```ts
interface PublicUser {
  id: string;
  name: string;
  age?: number;
  avatarUrl?: string;
  note?: string;
  bio?: string; // giới thiệu; không có thì màn hồ sơ ẩn dòng này
  trust: number;
  activitiesCount: number;
  interests: ActivityCategory[];
  hometown?: ProvinceId | null;
  currentCity?: ProvinceId | null;
  distanceKm?: number; // so với vị trí người xem
  // Quan hệ với người xem:
  isFollowing?: boolean;
  friendRequestStatus?: FriendRequestStatus | null;
  invitedByMe?: boolean;
  isFriend?: boolean;
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
  photoUrl?: string; // ảnh mô tả host đăng kèm (tối đa 1): làm thumbnail trên mọi card hoạt động (Home, Discover, danh sách chat, thông báo); không có thì card giữ như cũ
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
  description?: string; // giới thiệu, hiện ở màn chi tiết cộng đồng
  meetingPlace?: string; // nơi hay gặp, vd "Thanh Nien Rd, West Lake"
  coverUrl?: string; // ảnh bìa màn chi tiết; không có thì FE dùng ảnh theo category
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
  photoUrl?: string; // ảnh mô tả, tối đa 1 ảnh (upload purpose `broadcast_photo`)
  thumbnailUrl?: string; // = photoUrl nếu có, không thì ảnh của hoạt động tự đặt (nếu có); không có cả hai → FE dùng icon của hoạt động
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

### 3.8 Chat nhóm

Mỗi hoạt động có đúng một nhóm chat; **id nhóm = `activityId`**, thành viên = `ActivityMember` của hoạt động. Chưa có chat 1–1. FE: `src/types/chat.ts`.

```ts
interface ChatMessage {
  id: string;
  activityId: string;
  senderId: string;
  sentAt: string;
  // Một tin có thể có text, ảnh, voice hoặc sticker (FE gửi mỗi loại một tin riêng)
  text?: string; // tối đa 2000 ký tự (cần chốt)
  photos?: ChatPhoto[]; // tối đa 5 ảnh trong một tin
  video?: { url: string; durationMs: number; posterUrl: string }; // tối đa 10 giây, gửi riêng (không kèm ảnh)
  // waveform: 32 số 0–1 (độ to dọc theo voice), app đo lúc ghi âm; server chỉ lưu và trả lại
  voice?: { url: string; durationMs: number; waveform?: number[] };
  stickerId?: string; // id trong bộ sticker dựng sẵn của app, vd "moves-3", "phrases-letsGo"
  replyToId?: string; // trả lời một tin trong cùng nhóm
  // Gắn thẻ: `text` chứa nguyên tên người được gắn, `mentionIds` là danh sách user tương ứng
  mentionIds?: string[];
  reactions: ChatReaction[];
}
// FE còn có `status?: 'sending' | 'failed'` chỉ ở phía app: tin ảnh/video hiện ngay khi bấm gửi
// (file gốc, đang nén + upload), BE không lưu trường này. Tin chỉ được tạo trên BE sau khi upload xong.

interface ChatPhoto {
  url: string;
  width: number;
  height: number;
}

interface ChatReaction {
  emoji: string; // FE: ❤️ 😂 😮 😢 🔥 👍
  count: number;
  mine: boolean; // người xem có nằm trong `count` không
}

/** Một dòng trong tab Chats (`src/screens/Chats`). */
/** Loại cuộc trò chuyện: nhắn riêng với một người, nhóm của hoạt động, nhóm của cộng đồng. */
type ChatKind = 'personal' | 'activity' | 'community';

interface ChatSummary {
  id: string; // activityId | `community-{communityId}` | id hội thoại cá nhân
  kind: ChatKind;
  category: ActivityCategory; // để lọc theo loại hoạt động (cá nhân: không có)
  activity?: ActivityCard; // kind = activity: tiêu đề, category, ảnh, giờ, status, số thành viên
  community?: { id: string; name: string; category: ActivityCategory; membersCount: number }; // kind = community
  peer?: PublicUser; // kind = personal (chưa có UI)
  lastMessage?: ChatMessage;
  unreadCount: number; // tin của người khác gửi sau `lastReadAt`
  lastReadAt?: string;
  muted: boolean;
  memberIds: string[]; // để vẽ avatar nhóm
}

interface MessageReport {
  id: string;
  messageId: string;
  reporterId: string;
  reason: ReportReason;
  createdAt: string;
}
```

### 3.9 Story

Ảnh hoặc video ngắn chia sẻ cho **bạn bè** trong 24 giờ. FE: `src/types/story.ts`.

```ts
interface Story {
  id: string;
  userId: string;
  media: StoryMedia;
  filter?: StoryFilterId; // bộ lọc màu chọn ở camera; không có = 'normal'
  overlays: StoryOverlay[]; // chữ / sticker dán lên, theo thứ tự vẽ
  music?: StoryMusic;
  postedAt: string;
  expiresAt: string; // postedAt + 24h
  seen?: boolean; // người xem đã mở story này chưa (không trả cho chính chủ)
  pinnedAt?: string; // đã ghim lên trang cá nhân lúc nào; chỉ trả cho chính chủ
  pinnedTitle?: string | null; // chữ dưới story đã ghim, ≤ 30 ký tự, 1 dòng; "" = không hiện chữ; null = hiện ngày đăng
}

type StoryMedia =
  | {
      type: 'photo';
      url: string;
      width: number;
      height: number;
    }
  | {
      type: 'video';
      url: string;
      posterUrl: string; // khung hình đầu do app cắt và upload, cho ô thu nhỏ ở tab Chats
      durationMs: number; // ≤ 30000
      width: number;
      height: number;
    };

interface StoryOverlay {
  id: string;
  kind: StoryOverlayKind;
  text?: string; // kind = text, tối đa 200 ký tự
  color?: string; // kind = text, mã hex, vd "#FFFFFF"
  stickerId?: string; // kind = sticker, id trong bộ sticker dựng sẵn
  // Tâm của overlay, tính theo tỉ lệ chiều rộng / cao màn hình người đăng (0–1)
  x: number;
  y: number;
  scale: number; // FE giới hạn 0.3–6
  rotation: number; // radian
}

/** Bài nhạc gắn vào story: chép lại lúc đăng, để story vẫn phát dù bài bị gỡ khỏi thư viện. */
interface StoryMusic {
  trackId: string;
  title: string;
  url: string;
  durationMs: number;
}

/** Một nhóm story trên hàng story ở tab Chats. */
interface StoryGroup {
  user: PublicUser;
  stories: Story[]; // còn hạn, cũ trước mới sau
  hasUnseen: boolean;
}

/** Trả lời / thả cảm xúc vào story của bạn bè. */
interface StoryReply {
  id: string;
  storyId: string;
  fromUserId: string;
  toUserId: string; // chủ story
  text?: string; // tối đa 500 ký tự
  emoji?: string; // đúng một trong hai: text hoặc emoji
  sentAt: string;
}

interface StoryView {
  storyId: string;
  viewerId: string;
  viewedAt: string;
}
```

`StoryFilterId` = `'normal' | 'vivid' | 'warm' | 'cool' | 'rose' | 'vintage' | 'fade' | 'mono'` (`src/utils/storyFilters.ts`). Bộ lọc **không** được “in” vào ảnh/video: FE vẽ các lớp màu hoà trộn (`mixBlendMode`) lên trên khi hiển thị, giống chữ/sticker. BE chỉ lưu và trả lại `filter` như một chuỗi; giá trị lạ thì bỏ qua (coi như `normal`) để bản app cũ không lỗi khi có bộ lọc mới.

### 3.10 MusicTrack (nhạc cho story)

```ts
interface MusicTrack {
  id: string; // vd "hype-drill"
  title: string; // vd "Hype Drill"
  url: string; // file mp3 công khai
  durationMs: number;
}
```

**Hiện trạng:** chưa cần BE. 28 bài nằm trong bucket R2 công khai `dotogether-media` (`https://pub-d361b952046a4af8866eeea07fdd5900.r2.dev`), thư mục `music/`, kèm `music/manifest.json` (mảng `{ id, title, file, durationMs }`, bản gốc ở `scripts/music/manifest.json`). FE đọc qua `MUSIC_BASE_URL` (`src/utils/constants.ts`) và `src/services/music.ts`. Khi có BE, chỉ cần thay bằng `GET /music/tracks` ([10.6](#106-nhạc)); kiểu dữ liệu giữ nguyên.

> `r2.dev` có giới hạn lượt truy cập, chỉ hợp cho giai đoạn phát triển. Lên production cần gắn tên miền riêng cho bucket rồi đổi `MUSIC_BASE_URL`.

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

> Cần chốt: hoạt động **đầy nhưng user đã tham gia** có hiện ở Home với chính user đó không (FE hiện tại: không xử lý riêng). Xem [Câu hỏi mở](#14-câu-hỏi-mở).

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

### 4.8 Chat nhóm

- Chỉ **thành viên** của hoạt động (đã join, kể cả host) mới đọc / gửi được → ngược lại `403 NOT_A_MEMBER`. Rời hoạt động thì mất quyền vào nhóm.
- **Gửi tin được khi hoạt động `upcoming` hoặc `ongoing`**; khi `completed` nhóm thành **chỉ đọc** (FE thay ô nhập bằng dòng "Hoạt động đã kết thúc. Bạn vẫn có thể xem lại tin nhắn.") → gửi / thả cảm xúc trả `409 CHAT_READ_ONLY`. Đây là ngoại lệ của quy tắc "chỉ xem khi đang diễn ra" ở [4.4](#44-tham-gia--rời).
- **Cảm xúc:** mỗi người tối đa **một** cảm xúc trên một tin. Thả emoji khác thì chuyển sang emoji đó; thả lại đúng emoji đang có thì gỡ.
- **Trả lời:** `replyToId` phải là tin trong cùng nhóm. Tin gốc bị xoá thì vẫn giữ tin trả lời (hiển thị "tin nhắn không còn").
- **Gắn thẻ:** `mentionIds` chỉ gồm thành viên nhóm; người được gắn nhận thông báo kể cả khi đã tắt thông báo nhóm.
- **Đã đọc / chưa đọc:** mỗi người một mốc `lastReadAt` cho mỗi nhóm. `unreadCount` = số tin của người khác có `sentAt > lastReadAt`. FE đánh dấu đã đọc khi mở nhóm.
- **Tắt thông báo** (mute) theo từng nhóm: không push, nhưng vẫn đếm chưa đọc.
- **Nhóm chat cộng đồng:** mỗi cộng đồng có một nhóm chat (`chatId = community-{communityId}`), thành viên là thành viên cộng đồng. Gia nhập cộng đồng là vào nhóm chat; nút trên dòng cộng đồng đổi thành "Mở nhóm chat". Nhóm chat cộng đồng luôn mở (không có trạng thái sắp/đang/đã kết thúc) và không có "Xem chi tiết hoạt động". `/me/chats` trả cả nhóm hoạt động lẫn nhóm cộng đồng (`kind: 'activity' | 'community'`).
- **Rời khỏi nhóm** (Thông tin nhóm → Rời khỏi nhóm, có xác nhận): nhóm cộng đồng → rời cộng đồng (`DELETE /communities/{id}/membership`); nhóm hoạt động → chỉ rời nhóm chat (`DELETE /chats/{id}/membership`), user vẫn tham gia hoạt động; nhóm không còn trong `/me/chats` và user không nhận tin của nhóm, cho tới khi mở lại nhóm chat (vd từ màn chi tiết hoạt động → `PUT /chats/{id}/membership`) hoặc gia nhập lại cộng đồng.
- **Bộ lọc tab Chats:** `Tất cả`, `Chưa đọc` (`unreadCount > 0`), theo loại `Cá nhân` / `Nhóm hoạt động` / `Nhóm cộng đồng` (`kind`), và theo loại hoạt động (`category`, chỉ những loại user đang có chat). `GET /me/chats?filter=all|unread&kind=personal|activity|community&category=&q=`.
- **Xoá đoạn chat** (vuốt trái một dòng ở tab Chats, có xác nhận): **không phải rời nhóm**. Chỉ xoá tin nhắn và lịch sử trò chuyện **phía người xoá**; người khác không bị ảnh hưởng, user vẫn là thành viên, vẫn nhận tin mới và nhóm **vẫn ở trong** `/me/chats` (không có tin cuối thì hiện "Chưa có tin nhắn"). Lưu mốc `clearedAt` cho (user, chat) trong `chat_clears`: tin có `sentAt <= clearedAt` không bao giờ trả về cho user này nữa (kể cả ảnh trong "Ảnh và đa phương tiện", số tin, tìm kiếm); `unreadCount` chỉ đếm tin sau mốc. Xoá lần nữa thì dời mốc lên.
- **Rời nhóm khác xoá đoạn chat:** rời là thôi là thành viên của chat (`chat_members.leftAt`): không nhận tin, không còn trong `/me/chats`. Với nhóm cộng đồng, rời nhóm chat = huỷ gia nhập cộng đồng (xoá `community_members`) và ngược lại; gia nhập lại cộng đồng thì vào lại nhóm chat (lịch sử trước khi rời vẫn ẩn nếu đã có `clearedAt`).
- **Gợi ý bảng:** `chats (id, kind, activity_id?, community_id?, created_at)`; `chat_members (chat_id, user_id, joined_at, left_at?)` — nguồn sự thật cho ai ở trong nhóm (nhóm hoạt động: đồng bộ với `activity_members`, nhóm cộng đồng: với `community_members`); `chat_clears (chat_id, user_id, cleared_at)`; `chat_reads`, `chat_mutes` như cũ, khoá theo `chat_id`.
- **Báo cáo:** người báo cáo không được báo cáo tin của chính mình; mỗi người chỉ báo cáo một tin một lần (gửi lại coi như thành công). Người bị báo cáo không biết.
- **Tab Chats** liệt kê nhóm của mọi hoạt động user đã join (kể cả đã kết thúc), sắp theo tin mới nhất. Bộ lọc: Tất cả / Chưa đọc / Nhóm (hơn 2 người) / theo `ActivityCategory`. Tìm kiếm theo tên hoạt động, tên thành viên.

### 4.9 Story

- **Ai xem được:** chính chủ và **bạn bè** (đã kết bạn, xem [3.7](#37-quan-hệ-xã-hội)). Người khác → `404 STORY_NOT_FOUND` (không lộ là có story).
- **Hết hạn:** 24 giờ sau `postedAt` không còn trả về ở bất kỳ đâu (`410 STORY_EXPIRED` khi mở bằng id). Media dọn sau khi hết hạn (cần chốt có lưu trữ / "kỷ niệm" không).
- **Media:** ảnh, hoặc video **≤ 30 giây** (FE từ chối video dài hơn 30,5 giây ngay khi chọn; BE kiểm tra lại bằng thời lượng thật đọc từ file → `400 VIDEO_TOO_LONG`). App nén video và tự cắt ảnh bìa (`posterUrl`) trước khi upload ([1.4](#14-nén-trước-khi-upload)).
- **Thời gian hiển thị** (FE tính, `storyDurationMs` trong `src/services/stories.ts`): ảnh không nhạc 5 giây; ảnh có nhạc bằng thời lượng bài nhạc (`music.durationMs`); video bằng thời lượng video (có nhạc hay không), tối đa 30 giây. Thiếu thời lượng thì tính 30 giây.
- **Âm thanh:** video không chọn nhạc thì phát tiếng gốc; có nhạc thì tắt tiếng video, phát nhạc. Người xem có nút tắt tiếng (chỉ trên máy).
- **Overlay:** toạ độ `x`, `y` là tỉ lệ (0–1) của khung màn hình người đăng, FE giữ cả khối overlay trong vùng an toàn khi kéo. `stickerId` phải thuộc bộ sticker dựng sẵn (BE chỉ kiểm tra định dạng, xem câu hỏi mở). Tối đa 20 overlay / story (cần chốt).
- **Nhạc:** `trackId` phải có trong thư viện lúc đăng; server chép `title`, `url`, `durationMs` vào story.
- **Đã xem:** mở một story → ghi `StoryView` (idempotent). Danh sách story của bạn bè: nhóm có story chưa xem lên trước, sau đó theo story mới nhất. Mở một nhóm thì bắt đầu từ story chưa xem đầu tiên.
- **Trả lời / cảm xúc:** chỉ cho story của **người khác** và còn hạn. Mỗi lần gửi là một bản ghi riêng (không gộp). Hiện FE chỉ lưu tạm trên máy và báo "Đã gửi"; khi có chat 1–1 thì nên chuyển thành tin nhắn riêng kèm trích story (xem câu hỏi mở).
- **Xoá:** chỉ chính chủ; xoá xong story biến mất ngay với mọi người.
- **Không chia sẻ / tải xuống** story của người khác trên FE hiện tại.

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

| Method | Path           | Mô tả                                 | Màn            |
| ------ | -------------- | ------------------------------------- | -------------- |
| GET    | `/me`          | Hồ sơ của tôi + thống kê              | Profile        |
| PATCH  | `/me`          | Sửa tên, avatar, giới thiệu, sở thích (cả tự nhập), quê quán, nơi ở (`null` = bỏ) | Sửa hồ sơ      |
| PUT    | `/me/location` | Cập nhật vị trí hiện tại              | Home, I'm Free |
| GET    | `/users/{id}`  | Hồ sơ công khai                       | Hồ sơ người khác |

`GET /users/{id}` (màn `UserProfile`, dùng chung giao diện Profile) trả `PublicUser` kèm:

```ts
{
  user: PublicUser; // có isFriend, isFollowing, friendRequestStatus
  history: Activity[]; // hoạt động đã kết thúc người đó tham gia, mới trước (tab "Đã tham gia")
  stories: Story[]; // story còn hạn, chỉ khi người xem là bạn bè; không có thì []
  commonGround: {
    interests: ActivityCategory[]; // sở thích chung với người xem, theo thứ tự của người đó
    activities: number; // số hoạt động đã kết thúc cả hai cùng tham gia
  };
}
```

Không có tab "Lưu trữ" cho người khác (hoạt động đã lưu chỉ chủ tài khoản thấy). FE hiện tại: `userHistory` trong `src/services/mockData.ts`, `commonGround` trong `src/services/profile.ts`; nút Nhắn tin chưa có API tin nhắn riêng (đang báo "Sắp ra mắt").

```http
PUT /me/location
{ "lat": 21.0515, "lng": 105.833 }
```

`GET /me` trả `User` + `joinedAt` (lúc đăng ký) + thống kê cho màn Profile:

```json
{
  "stats": {
    "completedCount": 9, // hoạt động đã tham gia và đã kết thúc
    "hoursTogether": 16, // tổng thời lượng các hoạt động đó, làm tròn giờ
    "friendCount": 6,
    "usualCategories": [{ "category": "coffee", "count": 4 }] // hay đi nhất, nhiều trước
  }
}
```

`PATCH /me` (gửi trường nào sửa trường đó):

```json
{
  "displayName": "Gray", // bắt buộc khác rỗng, tối đa 40 ký tự
  "bio": "Sáng chạy quanh Hồ Tây", // tối đa 150 ký tự; "" hoặc null để xoá
  "avatarUploadId": "upl_9", // ảnh đã upload với purpose "avatar"; null để gỡ ảnh
  "interests": ["running", "coffee"] // ActivityCategory, không trùng
}
```

Hiện FE giữ ảnh đại diện trong store dưới dạng `data:` uri (JPEG ≤ 512 px) cho tới khi có upload thật. Ngôn ngữ và chế độ sáng / tối chỉ lưu trên máy, không gửi lên server.

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

Sau khi join: thông báo cho host ([mục 11](#11-thông-báo--realtime)).

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

| Method | Path                       | Màn                                   |
| ------ | -------------------------- | ------------------------------------- |
| PUT    | `/activities/{id}/save`    | Chi tiết hoạt động → nút lưu          |
| DELETE | `/activities/{id}/save`    | Chi tiết hoạt động → bỏ lưu           |
| GET    | `/me/saved?limit=&cursor=` | Profile → tab Lưu trữ (mới lưu trước) |

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
| GET    | `/communities/{id}`                     | Màn chi tiết cộng đồng: `Community` + `description`, `meetingPlace`, `joined`, `membersPreview` (≤ 5 `PublicUser`, bạn bè của người xem lên trước), `friendsCount`, `upcomingActivities` (hoạt động sắp/đang diễn ra cùng `category`, sớm trước). Chưa gia nhập: vẫn trả `membersCount` và `membersPreview` để hiện avatar, nhưng danh sách thành viên đầy đủ (`/chats/{id}/members`), hồ sơ từ đây và `upcomingActivities` chỉ dành cho thành viên → `403 MEMBERS_ONLY` (FE hiện hộp "Chỉ dành cho thành viên" kèm nút Gia nhập) |
| PUT    | `/communities/{id}/membership`          | Tham gia nhóm, đồng thời vào nhóm chat của cộng đồng (hiện ở tab Chats)          |
| DELETE | `/communities/{id}/membership`          | Rời nhóm, đồng thời rời nhóm chat (Thông tin nhóm → Rời khỏi nhóm)                 |

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
  "photoUploadId": "upl_123",
  "location": { "lat": 21.05, "lng": 105.83 },
  "locationPublic": true
}
```

- Mỗi user tối đa **1** broadcast hiệu lực; tạo mới thì thay cái cũ (cần chốt).
- Response gồm `matchedCount` (số người rảnh phù hợp trong bán kính).
- Giờ tự chọn không được ở quá khứ (FE đã chặn; BE validate lại).
- **Phát tín hiệu = tạo một hoạt động.** `POST /broadcasts` tạo luôn một `Activity` (trả về `activityId`): host là người phát, `category` = `activity` (hoạt động tự đặt → `other`, kèm `customActivityId`), `title` = tên hoạt động, `description` = `note`, `startsAt` = `availableFrom`, `durationMinutes` theo `duration`, vị trí = `location`, `photoUrl` = ảnh mô tả (nếu có), `instantMatch = true`, không giới hạn số người. Người phát tự động là thành viên (và host), có nhóm chat riêng rỗng. Hoạt động này hiện trên Home/Discover cho người khác như mọi hoạt động; FE sau khi phát mở luôn màn chi tiết của nó. Huỷ broadcast (`DELETE /broadcasts/{id}`) thì huỷ luôn hoạt động (báo cho người đã tham gia). FE hiện lưu trên máy (`createdActivities` trong `activitySlice`, `src/services/myActivities.ts`).
- `photoUploadId` không bắt buộc, tối đa 1 ảnh. Có ảnh thì ảnh đó là thumbnail của broadcast (danh sách / bản đồ người rảnh); không có thì giữ như cũ: ảnh của hoạt động tự đặt hoặc icon của loại hoạt động. FE (màn "Mình rảnh", thẻ "Ảnh mô tả") nén ảnh cạnh dài ≤ 1600 px trước khi upload và có ô "Xem trước" theo đúng quy tắc này.

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
| POST   | `/friend-requests/{id}/accept` \| `/decline`       | Trả lời                                            | Thông báo                 |
| GET    | `/me/friend-requests?direction=incoming\|outgoing` | Danh sách                                          | (chưa có UI)              |
| POST   | `/invites`                                         | Rủ người đang rảnh `{ "toUserId", "activityId?" }` | Discover, Activity Detail |

Lỗi: `ALREADY_FRIENDS`, `CANNOT_TARGET_SELF`. Rủ cùng một người nhiều lần trong một khoảng thời gian → `429` hoặc trả lại invite cũ (cần chốt).

---

## 9. API — Chat nhóm

Thay cho `src/services/chat.ts` (đoạn chat dựng sẵn) và `src/store/slices/chatSlice.ts`.

| Method | Path                                                | Mô tả                                                                         | Màn                         |
| ------ | --------------------------------------------------- | ----------------------------------------------------------------------------- | --------------------------- |
| GET    | `/me/chats?filter=&kind=&category=&q=&limit=&cursor=` | Danh sách `ChatSummary`; `filter` = `all` \| `unread`; `kind` = `personal` \| `activity` \| `community` | Tab Chats                   |
| GET    | `/chats/{activityId}/messages?before=&limit=30`     | Tin nhắn, mới nhất trước (FE vẽ danh sách đảo ngược)                          | Group chat                  |
| POST   | `/chats/{activityId}/messages`                      | Gửi tin                                                                       | Group chat                  |
| DELETE | `/chats/{activityId}/messages/{messageId}`          | Thu hồi tin của mình (chưa có UI)                                             | —                           |
| PUT    | `/chats/{activityId}/messages/{messageId}/reaction` | `{ "emoji": "🔥" }`; thả lại đúng emoji đang có = gỡ                          | Giữ tin → hàng cảm xúc      |
| DELETE | `/chats/{activityId}/messages/{messageId}/reaction` | Gỡ cảm xúc                                                                    | —                           |
| POST   | `/chats/{activityId}/messages/{messageId}/reports`  | `{ "reason": ReportReason }`                                                  | Giữ tin → Báo cáo           |
| POST   | `/chats/{activityId}/read`                          | `{ "lastReadAt": "…" }` (chỉ tăng, không lùi)                                 | Mở nhóm                     |
| PUT    | `/chats/{activityId}/mute` \| `DELETE …/mute`       | Tắt / bật thông báo nhóm                                                      | Thông tin nhóm              |
| DELETE | `/chats/{activityId}/membership` \| `PUT …`         | Rời nhóm chat hoạt động / vào lại (nhóm cộng đồng: dùng membership của cộng đồng) | Thông tin nhóm → Rời khỏi nhóm |
| DELETE | `/me/chats/{activityId}`                            | Xoá tin nhắn và lịch sử phía mình (đặt `clearedAt` = bây giờ), vẫn ở trong nhóm, xem [4.8](#48-chat-nhóm) | Tab Chats → vuốt trái       |
| GET    | `/chats/{activityId}/photos?limit=&cursor=`         | Mọi ảnh trong nhóm, mới trước                                                 | Thông tin nhóm → Ảnh        |
| GET    | `/chats/{activityId}/members`                       | Thành viên (`PublicUser` + `isHost`)                                          | Thông tin nhóm → Thành viên |

### 9.1 Gửi tin

```json
// POST /chats/{activityId}/messages
{
  "clientId": "c_8f2…", // FE tự sinh, để gửi lại không bị trùng và khớp tin "đang gửi"
  "text": "Hẹn 6h ở cổng số 2 nhé @Minh Trần",
  "mentionIds": ["minh"],
  "replyToId": "m_120",
  "photoUploadIds": ["upl_1", "upl_2"], // hoặc
  "voiceUploadId": "upl_3",
  "voiceDurationMs": 4200,
  "voiceWaveform": [0.2, 0.6, 1, 0.8 /* … đủ 32 số */], // hoặc
  "stickerId": "phrases-letsGo"
}
// 201 → ChatMessage
```

- Cần ít nhất một trong: `text`, ảnh, voice, sticker.
- `voiceWaveform` (tuỳ chọn): đúng 32 số trong khoảng 0–1, làm tròn 2 chữ số; sai thì bỏ qua (app vẽ sóng thay thế), không từ chối tin.
- `clientId` trùng với tin đã gửi → trả lại tin cũ (idempotent).
- FE hiện thêm tin ngay (lạc quan), khớp lại theo `clientId` khi server trả về.

---

## 10. API — Story & nhạc

Thay cho `src/services/stories.ts`, `src/store/slices/storySlice.ts` và danh sách nhạc đọc thẳng từ R2.

| Method | Path                                   | Mô tả                                                | Màn                               |
| ------ | -------------------------------------- | ---------------------------------------------------- | --------------------------------- |
| GET    | `/stories/feed`                        | `{ mine: Story[], friends: StoryGroup[] }` (còn hạn) | Hàng story ở tab Chats, xem story |
| POST   | `/stories`                             | Đăng story                                           | Soạn story → "Chia sẻ lên story"  |
| DELETE | `/stories/{id}`                        | Xoá story của mình                                   | Xem story của mình → 🗑            |
| PUT    | `/stories/{id}/pin`                    | Ghim story của mình lên trang cá nhân (idempotent)   | Xem story của mình → 📌            |
| DELETE | `/stories/{id}/pin`                    | Bỏ ghim                                              | Xem story của mình → 📌            |
| PATCH  | `/stories/{id}/pin`                    | Đổi `pinnedTitle` (`{ "title": string \| null }`)   | Profile → nhấn giữ story đã ghim   |
| GET    | `/users/me/pinned-stories`             | `Story[]` đã ghim, ghim sau trước, kể cả hết hạn     | Profile → hàng tròn sau "Story mới" |
| POST   | `/stories/{id}/views`                  | Đánh dấu đã xem (idempotent)                         | Xem story                         |
| GET    | `/stories/{id}/views?limit=&cursor=`   | Ai đã xem (chỉ chính chủ; chưa có UI)                | —                                 |
| POST   | `/stories/{id}/replies`                | Trả lời / thả cảm xúc                                | Xem story của bạn bè              |
| GET    | `/stories/{id}/replies?limit=&cursor=` | Trả lời nhận được (chỉ chính chủ; chưa có UI)        | —                                 |
| GET    | `/music/tracks`                        | Thư viện nhạc (`MusicTrack[]`)                       | Soạn story → Nhạc                 |

### 10.1 Đăng story

```json
// POST /stories
{
  "uploadId": "upl_456", // ảnh hoặc video đã nén và upload (purpose = story)
  "posterUploadId": "upl_457", // chỉ với video: ảnh bìa (purpose = story_poster)
  "filter": "warm", // tuỳ chọn, xem 3.9
  "overlays": [
    {
      "id": "o1",
      "kind": "text",
      "text": "Chạy sáng nay",
      "color": "#FFFFFF",
      "x": 0.5,
      "y": 0.3,
      "scale": 1,
      "rotation": -0.08
    },
    {
      "id": "o2",
      "kind": "sticker",
      "stickerId": "phrases-letsGo",
      "x": 0.7,
      "y": 0.55,
      "scale": 1.2,
      "rotation": 0.15
    }
  ],
  "musicTrackId": "hype-drill" // không gửi = không có nhạc
}
// 201 → Story
```

Lỗi: `VIDEO_TOO_LONG`, `MEDIA_TOO_LARGE`, `UNSUPPORTED_MEDIA`, `UPLOAD_NOT_FOUND`, `MUSIC_NOT_FOUND`, `VALIDATION_ERROR` (overlay sai).

### 10.2 Feed

- `mine`: story còn hạn của chính user, cũ trước mới sau.
- `friends`: một `StoryGroup` cho mỗi người bạn có story còn hạn; nhóm còn story chưa xem lên trước, sau đó theo story mới nhất; trong nhóm cũ trước mới sau; mỗi story có `seen`.
- Không phân trang ở giai đoạn đầu (số bạn bè ít); cần thì thêm cursor.

### 10.3 Đã xem

`POST /stories/{id}/views` khi story bắt đầu hiện (không chờ hết thời gian). Không ghi cho story của chính mình.

### 10.4 Trả lời / cảm xúc

```json
// POST /stories/{id}/replies
{ "text": "Cho mình đi với" }   // hoặc
{ "emoji": "❤️" }
// 201 → StoryReply
```

- Gợi ý trả lời nhanh và các emoji (thanh cảm xúc: ❤️ 👍 😆 🥰 😮 😢 😡; lưới khi đang gõ: 😂 😭 ❤️ 🙏 😍 🔥) là của FE, server nhận text / emoji như bình thường.
- Lỗi: `CANNOT_TARGET_SELF` (story của mình), `STORY_EXPIRED`, `STORY_NOT_FOUND`.

### 10.5 Xoá

`DELETE /stories/{id}` → `204`. Không phải chủ → `403 FORBIDDEN`.

**Ghim lên trang cá nhân:** `PUT /stories/{id}/pin` đặt `pinnedAt = now` (đã ghim thì giữ nguyên), `DELETE /stories/{id}/pin` xoá nó; cả hai trả `204`, không phải chủ → `403 FORBIDDEN`. Story đã ghim **không** bị cron xoá khi hết 24 giờ (cả bản ghi lẫn file R2) và vẫn mở được từ trang cá nhân, nhưng không còn trong `/stories/feed`. Bỏ ghim một story đã hết hạn thì cron lần sau xoá nó. Xoá story thì bỏ ghim luôn. `PATCH /stories/{id}/pin` đổi chữ hiện dưới story trên trang cá nhân: cắt khoảng trắng hai đầu, không cho xuống dòng, tối đa 30 ký tự (quá → `400 VALIDATION_ERROR`); `""` là không hiện chữ, `null` là quay về ngày đăng; story chưa ghim → `409 STORY_NOT_PINNED`. Bỏ ghim thì xoá luôn chữ này. FE: `pinnedIds` trong `src/store/slices/storySlice.ts`, `pinnedStories` trong `src/services/stories.ts`; hiện story của mình chưa lưu qua lần mở app (ảnh nằm ở thư mục tạm), nên ghim cũng mất khi tắt app cho tới khi có API này.

### 10.6 Nhạc

`GET /music/tracks` → `MusicTrack[]` (đủ ít bài nên không phân trang). FE tải một lần mỗi phiên, kéo xuống để tải lại. Nghe thử phát thẳng từ `url`. Đến khi có endpoint này, FE dùng `music/manifest.json` trên R2 (xem [3.10](#310-musictrack-nhạc-cho-story)).

---

## 11. Thông báo & realtime

Chuông trên header (`src/components/AppHeader.tsx`) mở màn **Thông báo** (`src/screens/Notifications`), có số thông báo chưa đọc và rung nhẹ khi có thông báo mới. FE hiện dùng dữ liệu giả ở `src/services/notifications.ts` + `src/store/slices/notificationSlice.ts`; khi có BE, thay bằng các endpoint bên dưới, kiểu dữ liệu giữ nguyên (`src/types/notification.ts`).

Các sự kiện cần thông báo (push + danh sách trong app):

| Sự kiện                                  | Người nhận                                        |
| ---------------------------------------- | ------------------------------------------------- |
| Có người join / rời hoạt động            | Host                                              |
| Hoạt động sắp bắt đầu (vd trước 15 phút) | Member                                            |
| Có người check-in                        | Member khác                                       |
| Được rủ (invite)                         | Người được rủ                                     |
| Lời mời kết bạn mới / được chấp nhận     | Người liên quan                                   |
| Có người theo dõi                        | Người được theo dõi                               |
| Tin nhắn mới trong nhóm chat             | Thành viên khác (trừ người đã tắt thông báo nhóm) |
| Được gắn thẻ trong chat                  | Người được gắn (kể cả khi đã tắt thông báo nhóm)  |
| Có người trả lời tin của mình            | Người gửi tin gốc                                 |
| Có người trả lời / thả cảm xúc story     | Chủ story                                         |
| Bạn bè đăng story (tuỳ chọn)             | Bạn bè                                            |

```ts
type NotificationKind =
  | 'join'
  | 'leave'
  | 'starting'
  | 'checkIn'
  | 'invite' // nhóm "Hoạt động"
  | 'mention'
  | 'reply' // nhóm "Chat"
  | 'friendRequest'
  | 'friendAccepted'
  | 'follow' // nhóm "Bạn bè"
  | 'storyReaction'
  | 'storyReply'
  | 'friendStory'; // nhóm "Story"

interface AppNotification {
  id: string;
  kind: NotificationKind;
  createdAt: string;
  read: boolean;
  actorId?: string; // người gây ra; không có với `starting`
  activityId?: string;
  emoji?: string; // storyReaction
  quote?: string; // tin nhắn / câu trả lời story được trích
  minutes?: number; // starting: còn bao nhiêu phút
  friendRequestId?: string; // friendRequest: trả lời qua `/friend-requests/{id}/accept` | `/decline` (mục 8.6)
  friendRequestAnswer?: 'accepted' | 'declined'; // friendRequest đã trả lời
}

interface NotificationSettings {
  paused: boolean; // tạm dừng tất cả (không push, không thêm vào danh sách)
  enabled: Record<
    | 'members'
    | 'starting'
    | 'checkIns'
    | 'invites'
    | 'mentions'
    | 'replies'
    | 'friendRequests'
    | 'follows'
    | 'storyActivity'
    | 'friendStories',
    boolean
  >;
}
```

Quy tắc màn Thông báo:

- **Số chưa đọc** hiện trên chuông ở header và cạnh tiêu đề màn Thông báo; chỉ mất khi mọi thông báo đã đọc. Một dòng thành **đã đọc** khi bấm vào nó, khi trả lời lời mời kết bạn, hoặc khi bấm "Đánh dấu tất cả là đã đọc". Mở màn Thông báo **không** tự đánh dấu đã đọc.
- **Bộ lọc:** Tất cả / Chưa đọc / Hoạt động / Chat / Bạn bè / Story (theo nhóm của `kind`). Danh sách chia mục Hôm nay / Hôm qua / Tuần này / Trước đó theo giờ máy.
- **Bấm vào:** `mention`, `reply` → nhóm chat (nếu còn là thành viên, không thì chi tiết hoạt động); các loại có `activityId` → chi tiết hoạt động; `storyReaction`, `storyReply` → story của mình; `friendStory` → story của người đó.
- **Lời mời kết bạn** trả lời ngay trên dòng (Chấp nhận / Từ chối); câu chữ đổi theo câu trả lời.
- **Vuốt trái để xoá** từng thông báo (chỉ xoá phía user, không cần xác nhận).
- **Cài đặt:** tắt một mục hoặc tạm dừng tất cả thì thông báo loại đó không push và không được thêm vào danh sách. `starting` gửi trước 30 phút. `friendStories` mặc định tắt. Tin nhắn mới trong nhóm chat vẫn bật / tắt theo từng nhóm ([9](#9-api--chat-nhóm), `mute`); `mention` vẫn tới kể cả khi nhóm đã tắt thông báo.

Endpoint gợi ý:

| Method | Path                                                               | Màn                             |
| ------ | ------------------------------------------------------------------ | ------------------------------- |
| POST   | `/me/devices` `{ "pushToken", "platform": "ios" \| "android" }`    | Đăng nhập                       |
| GET    | `/me/notifications?group=&unread=&limit=&cursor=`                  | Thông báo (`group` theo bộ lọc) |
| GET    | `/me/notifications/summary` → `{ unreadCount }`                    | Chuông trên header              |
| POST   | `/me/notifications/read` `{ "ids": [] }` \| `{ "all": true }`      | Bấm một dòng / Đánh dấu tất cả  |
| DELETE | `/me/notifications/{id}`                                           | Vuốt trái → Xoá                 |
| GET    | `/me/notification-settings` \| `PUT` (body `NotificationSettings`) | Cài đặt thông báo               |

### 11.1 Realtime bằng Durable Objects

Mọi thứ realtime chạy trên **Durable Objects**. App mở WebSocket tới Worker (`GET /v1/realtime/...` kèm vé đăng nhập ngắn hạn), Worker kiểm tra quyền rồi chuyển kết nối sang đúng DO. DO dùng WebSocket Hibernation để không tốn chi phí khi phòng im lặng.

| Durable Object          | Một bản cho           | Ai kết nối                                  | Lo việc gì                                                                                                                                                                                   |
| ----------------------- | --------------------- | ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ChatRoom`              | mỗi hoạt động         | Thành viên đang mở nhóm chat                | Nhận tin / cảm xúc / thu hồi, **ghi vào D1 trước** rồi phát cho mọi người trong phòng; giữ thứ tự tin; chặn ghi khi hoạt động đã kết thúc. Sau này: "đang gõ…", "đã xem".                    |
| `ActivityLive`          | mỗi hoạt động         | Thành viên khi hoạt động sắp / đang diễn ra | **Vị trí live** của thành viên trên bản đồ (Activity Detail → bản đồ live), trạng thái ("Đang tới…"), check-in, số người. Vị trí chỉ giữ trong DO, không ghi D1; xoá khi hoạt động kết thúc. |
| `UserInbox`             | mỗi user              | App của user khi đang mở                    | Đẩy cập nhật cá nhân: tab Chats (tin mới, số chưa đọc của mọi nhóm), story bạn bè mới / bị xoá, thông báo, lời rủ, lời mời kết bạn. App ở nền thì dùng push.                                 |
| `NearbyCell` (tuỳ chọn) | mỗi ô geohash (~1 km) | App đang mở bản đồ Free nearby              | Cập nhật ngay khi có người bắt đầu / dừng "Mình rảnh" trong khu vực. Giai đoạn đầu có thể bỏ, app tải lại bằng REST.                                                                         |

Vị trí live (`ActivityLive`):

- App gửi vị trí khi di chuyển quá ~10 m hoặc mỗi 5–10 giây (cần chốt), chỉ khi user đã cho phép và trong khung giờ hoạt động.
- Chỉ thành viên của hoạt động nhận được vị trí của nhau. Rời hoạt động hoặc hoạt động kết thúc thì ngừng nhận và xoá.
- FE hiện giả lập ở `src/screens/ActivityDetail/useLiveMembers.ts`.

Sự kiện gửi xuống app:

| Sự kiện                          | Từ DO          | Payload                                        | FE dùng cho                            |
| -------------------------------- | -------------- | ---------------------------------------------- | -------------------------------------- |
| `chat.message`                   | `ChatRoom`     | `ChatMessage`                                  | Thêm tin vào nhóm đang mở              |
| `chat.message_deleted`           | `ChatRoom`     | `{ activityId, messageId }`                    | —                                      |
| `chat.reactions`                 | `ChatRoom`     | `{ activityId, messageId, reactions }`         | Cập nhật hàng cảm xúc                  |
| `member.location`                | `ActivityLive` | `{ activityId, userId, lat, lng, at }`         | Di chuyển avatar trên bản đồ live      |
| `member.status`                  | `ActivityLive` | `{ activityId, userId, status, checkedInAt? }` | "Đang tới…", đã check-in               |
| `activity.members`               | `ActivityLive` | `{ activityId, membersCount }`                 | Số người                               |
| `chats.summary`                  | `UserInbox`    | `ChatSummary`                                  | Cập nhật dòng ở tab Chats, số chưa đọc |
| `story.posted` / `story.deleted` | `UserInbox`    | `{ userId, storyId }`                          | Làm mới hàng story                     |
| `notification`                   | `UserInbox`    | Thông báo                                      | Chấm đỏ trên chuông                    |

App gửi lên (qua WebSocket, kèm `clientId` để chống trùng): gửi tin, thả / gỡ cảm xúc, cập nhật vị trí, cập nhật trạng thái. Các thao tác này cũng có REST tương ứng ([mục 9](#9-api--chat-nhóm), [7.7](#77-check-in), [7.8](#78-cập-nhật-trạng-thái-thành-viên)) để dùng khi chưa có kết nối.

Khi mất kết nối, app tải lại phần bị lỡ bằng REST (`/chats/{id}/messages?before=` …) rồi kết nối lại.

---

## 12. Mã lỗi nghiệp vụ

| Code                    | HTTP | Ý nghĩa                                                     | FE xử lý                                                        |
| ----------------------- | ---- | ----------------------------------------------------------- | --------------------------------------------------------------- |
| `TIME_CONFLICT`         | 409  | Đã join hoạt động khác trùng giờ                            | Modal "Trùng thời gian", "Vẫn tham gia" → gửi lại `force: true` |
| `ACTIVITY_FULL`         | 409  | Hết chỗ                                                     | Báo đầy, làm mới dữ liệu                                        |
| `ACTIVITY_NOT_JOINABLE` | 409  | Đã bắt đầu / kết thúc                                       | Chuyển màn chi tiết sang chỉ xem                                |
| `NOT_A_MEMBER`          | 403  | Check-in / sửa trạng thái khi chưa join                     | —                                                               |
| `ALREADY_CHECKED_IN`    | 409  | Đã check-in                                                 | Coi như thành công                                              |
| `TOO_FAR_TO_CHECK_IN`   | 409  | Cách điểm hẹn > 50 m                                        | Hiện khoảng cách còn lại                                        |
| `EMAIL_TAKEN`           | 409  | Email đã đăng ký                                            | Lỗi ở ô email                                                   |
| `INVALID_CREDENTIALS`   | 401  | Sai email / mật khẩu                                        | —                                                               |
| `ALREADY_FRIENDS`       | 409  | Đã là bạn                                                   | —                                                               |
| `CANNOT_TARGET_SELF`    | 400  | Tự follow / kết bạn / rủ mình; trả lời / báo cáo chính mình | —                                                               |
| `NOT_A_MEMBER`          | 403  | Đọc / gửi chat nhóm khi không phải thành viên               | Quay lại tab Chats                                              |
| `CHAT_READ_ONLY`        | 409  | Gửi / thả cảm xúc khi hoạt động đã kết thúc                 | Thay ô nhập bằng dòng "Hoạt động đã kết thúc"                   |
| `MESSAGE_NOT_FOUND`     | 404  | Trả lời / thả cảm xúc / báo cáo tin không tồn tại           | Bỏ trích dẫn                                                    |
| `STORY_NOT_FOUND`       | 404  | Story không có hoặc không được xem                          | Đóng story, làm mới hàng story                                  |
| `STORY_EXPIRED`         | 410  | Story đã quá 24 giờ                                         | Bỏ qua, sang story kế                                           |
| `VIDEO_TOO_LONG`        | 400  | Video story dài hơn 30 giây                                 | "Video dài quá"                                                 |
| `MEDIA_TOO_LARGE`       | 400  | File vượt giới hạn                                          | Báo lỗi, cho chọn lại                                           |
| `UNSUPPORTED_MEDIA`     | 400  | Sai loại file                                               | Báo lỗi, cho chọn lại                                           |
| `UPLOAD_NOT_FOUND`      | 400  | `uploadId` sai, hết hạn hoặc chưa upload xong               | Upload lại                                                      |
| `MUSIC_NOT_FOUND`       | 400  | `musicTrackId` không có trong thư viện                      | Bỏ nhạc, tải lại danh sách                                      |
| `STORY_NOT_PINNED`      | 409  | Đổi chữ dưới story chưa ghim                                | Tải lại trang cá nhân                                           |
| `MEMBERS_ONLY`          | 403  | Xem thành viên / hoạt động của cộng đồng khi chưa gia nhập  | Hộp "Chỉ dành cho thành viên" + nút Gia nhập                    |

---

## 13. Gợi ý lưu trữ

### 13.1 D1 (dữ liệu)

D1 là SQLite nên **không có PostGIS, `unaccent`, `pg_trgm`**; cách thay thế:

- **Toạ độ / bán kính:** lưu `lat`, `lng` (REAL) kèm cột `geohash` (độ chính xác 6 ≈ 1,2 km) có index. Tìm trong bán kính: lấy các ô geohash quanh điểm (hoặc khung `lat BETWEEN … AND lng BETWEEN …`) bằng index, rồi tính khoảng cách chính xác (haversine) trong Worker. Áp dụng cho `activities`, `broadcasts`, `user_locations`.
- **Tìm kiếm không dấu:** lưu thêm cột đã chuẩn hoá (chữ thường, bỏ dấu tiếng Việt) và dùng bảng ảo **FTS5** (D1 hỗ trợ) cho tên hoạt động, tên thành viên.
- **Không lưu `status` / `slotStatus` cứng**: tính khi query theo giờ hiện tại để không bị lệch.
- **Chống tranh slot khi join:** dùng `batch` của D1 (chạy nguyên khối) với `INSERT … SELECT … WHERE (SELECT COUNT(*) …) < capacity`, rồi kiểm tra số dòng được thêm.
- **Index:** `activities (starts_at, ends_at)`, `activities (geohash)`, `activity_members (activity_id, user_id)` unique, `follows (follower_id, followee_id)` unique.
- **Chat:** `chat_messages (activity_id, sent_at)` để phân trang theo `before`; `message_reactions (message_id, user_id)` unique (một cảm xúc / người); `chat_reads (user_id, activity_id)` unique giữ `last_read_at`. Số chưa đọc đếm theo index, hoặc để `ChatRoom` / `UserInbox` giữ bộ đếm.
- **Story:** `stories (user_id, expires_at)`; feed lọc `expires_at > now` và quan hệ bạn bè; `story_views (story_id, viewer_id)` unique; overlay lưu dạng JSON (TEXT) trong `stories`. Cron xoá story hết hạn và chưa ghim (`pinned_at IS NULL`) cùng file trên R2; `stories (user_id, pinned_at)` cho danh sách đã ghim.
- **Vị trí:** chỉ giữ vị trí mới nhất mỗi user (`user_locations`) để tìm người rảnh gần đây; vị trí live khi đi hoạt động nằm trong `ActivityLive`, không ghi D1. Broadcast hết hạn thì xoá hoặc ẩn toạ độ.
- **Giới hạn D1:** mỗi database tối đa 10 GB và chỉ một luồng ghi. Tin nhắn chat to nhanh nhất: nên để **chat ở một database D1 riêng**, và chuyển chat của hoạt động đã kết thúc lâu (vd > 90 ngày) sang R2 dạng JSON nếu cần (cần chốt).

Bảng tối thiểu: `users`, `auth_identities`, `refresh_tokens`, `activities`, `activity_members`, `activity_saves`, `communities`, `community_members`, `broadcasts`, `custom_activities`, `follows`, `friend_requests`, `invites`, `user_locations`, `devices`, `notifications`, `uploads`, `chats`, `chat_members`, `chat_messages`, `chat_message_photos`, `chat_message_mentions`, `message_reactions`, `message_reports`, `chat_reads`, `chat_mutes`, `chat_clears`, `stories`, `story_views`, `story_replies`, `music_tracks`.

### 13.2 R2 (media)

- Khoá gợi ý: `avatars/{userId}/{uploadId}.jpg`, `activities/{activityId}/{uploadId}.jpg`, `chat/{activityId}/{messageId}/{n}.jpg`, `chat/{activityId}/{messageId}.m4a`, `stories/{userId}/{storyId}.{jpg|mp4}`, `stories/{userId}/{storyId}-poster.jpg`, `music/{file}.mp3`.
- **Riêng tư:** media chat và story chỉ thành viên / bạn bè được xem → đọc qua URL ký có hạn (vd 1 giờ) do Worker cấp, hoặc qua Worker kiểm tra quyền rồi trả file. **Nhạc** và avatar có thể công khai (gắn tên miền riêng, có cache).
- Đặt `Cache-Control` dài cho file (khoá chứa id nên không bao giờ ghi đè).

### 13.3 Durable Objects (realtime)

- Thứ cần lưu lâu thì ghi D1; bộ nhớ / storage của DO chỉ giữ thứ ngắn hạn (kết nối, vị trí live, bộ đếm tạm).
- `ChatRoom` / `ActivityLive` tự dọn khi hoạt động kết thúc và không còn ai kết nối.

---

## 14. Câu hỏi mở

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
11. **Trả lời story đi đâu?** Hiện chỉ lưu tạm trên máy. Có làm chat 1–1 để trả lời story thành tin nhắn riêng (kèm trích story) không, hay chỉ là danh sách trong "Ai đã xem / trả lời"?
12. Story: **ai xem được** — chỉ bạn bè (như FE hiện tại), hay cả người theo dõi / thành viên chung hoạt động? Có danh sách "Ai đã xem" cho chủ story không?
13. Story hết hạn có **lưu lại** (kỷ niệm / highlight) không, hay xoá hẳn media?
14. **Toạ độ overlay** đang tính theo màn hình người đăng (tỉ lệ khung mỗi máy một khác). Có cần chuẩn hoá về một khung cố định (vd 9:19.5) để mọi máy hiện giống hệt không?
15. **Bộ sticker** đang nằm trong app (`src/services/stickers.ts`). Có cần đưa danh mục sticker lên server (để thêm sticker không cần ra bản app mới) không?
16. Video dài hơn 30 giây: tiếp tục **từ chối** (như FE hiện tại) hay cho **cắt** về 30 giây (cần thư viện xử lý video)?
17. Giới hạn dung lượng / số lượng: ảnh, video, voice tối đa bao nhiêu MB; mỗi ngày đăng tối đa bao nhiêu story?
18. Thư viện nhạc: có cần **bản quyền** / ghi nguồn cho từng bài, phân loại theo tâm trạng, tìm kiếm không? Có cho người dùng tải nhạc riêng lên không?
19. Chat: có **thu hồi / sửa** tin, chỉ báo "đang gõ…", báo "đã xem" từng người không? Báo cáo tin nhắn xong thì ai xử lý (admin tool)?
20. Sau khi **rời hoạt động** thì còn xem lại lịch sử chat được không (FE hiện tại: nhóm biến khỏi tab Chats)?
21. Vị trí live: gửi bao lâu một lần, bắt đầu từ bao lâu trước giờ hoạt động, có cho tắt chia sẻ vị trí không?
22. Chat cũ: giữ trong D1 bao lâu trước khi chuyển sang R2 (hoặc xoá)? Có tách D1 riêng cho chat ngay từ đầu không?
