# TaleX FE Context cho Gemini và BE: Admin Engagement Service, Mission, Coin

Tài liệu này tổng hợp trạng thái hiện tại của source FE TaleX, đặc biệt là trang admin quản lý luồng engagement service/nhiệm vụ, các API FE đang gọi, kiến trúc, auth, cấu hình công nghệ và những phần cần BE nắm để đồng bộ contract.

## 1. Tổng quan source FE

Repository là web client của TaleX, dùng Next.js App Router, TypeScript, React, Tailwind CSS và TanStack Query. Code được tổ chức theo hướng Feature-Sliced Design:

```txt
src/
  app/        Next.js routes, layouts, route handlers
  features/   business modules: auth, admin, mission, coin, creator-dashboard...
  shared/     UI dùng chung, http client, utility
  core/       config và providers toàn cục
```

Các route chính đang có:

```txt
/                         Trang home
/intro                    Intro/landing
/series, /series/[id]     Public series
/watch/[episodeId]        Playback
/missions                 User mission center
/premium                  Premium packages
/profile                  Hồ sơ user
/creator-dashboard        Creator studio
/staff/*                  Staff moderation
/admin/*                  Admin console
/login, /register, ...    Auth flow
```

Admin console hiện có layout riêng tại `src/app/admin/layout.tsx`, sidebar tại `src/features/admin/components/admin-sidebar.tsx`, topbar tại `src/features/admin/components/admin-topbar.tsx`. Sidebar expose các mục:

```txt
/admin/dashboard
/admin/videos
/admin/comics
/admin/users
/admin/creator-tiers
/admin/subscriptions
/admin/analytics
/admin/financials
/admin/coin-management
/admin/mission-management
/admin/campaigns
/admin/terms
/admin/settings
```

## 2. Công nghệ và cấu hình

Package chính trong `package.json`:

```txt
next ^16.2.9
react 19.2.4
typescript ^5
tailwindcss ^4
@tanstack/react-query ^5.100.9
axios ^1.16.1
zustand ^5.0.13
react-hook-form ^7.80.0
zod ^4.4.3
lucide-react ^1.14.0
radix-ui ^1.4.3
sonner ^2.0.7
@microsoft/fetch-event-source ^2.0.1
hls.js ^1.6.16
```

Cấu hình quan trọng:

```txt
tsconfig: strict true, alias @/* -> ./src/*
Tailwind v4: src/app/globals.css, @tailwindcss/postcss
shadcn config: aliases ui -> src/shared/ui, iconLibrary lucide
Next rewrites: browser gọi /api/* trên FE origin, Next rewrite sang BE /api/*
```

`next.config.ts`:

```ts
const apiBaseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080").replace(/\/$/, "");

rewrites:
  /api/:path* -> `${apiBaseUrl}/api/:path*`
```

`src/core/config/api.ts`:

```ts
API_BASE_URL = NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080"
SWAGGER_URL = `${API_BASE_URL}/swagger-ui/index.html#/`
Cloudinary envs: cloud name, preset, folder, streaming profile
```

`.env.local` hiện đang trỏ BE:

```txt
NEXT_PUBLIC_API_BASE_URL=http://103.200.20.228:8080
COOKIE_SECURE=false
NEXT_PUBLIC_GOOGLE_CLIENT_ID=...
NEXT_PUBLIC_CLOUDINARY_* configured
NEXT_PUBLIC_CREATOR_ID, NEXT_PUBLIC_ACTOR_ID configured
```

## 3. HTTP client và response contract

HTTP client chung tại `src/shared/api/http-client.ts`.

Đặc điểm:

```txt
Client browser: baseURL = "" nên request đi cùng origin, ví dụ /api/v1/missions
Server-side: baseURL = API_BASE_URL, gọi trực tiếp BE
withCredentials = true
```

Response wrapper FE kỳ vọng cho đa số API:

```ts
type BaseResponse<T> = {
  code: number;
  message: string;
  data: T;
};

type BasePageResponse<T> = {
  content: T[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  isFirst: boolean;
  isLast: boolean;
};
```

Helper `unwrapBaseResponse<T>` lấy `response.data.data`. Vì vậy các API mission/coin/admin coin cần trả đúng dạng:

```json
{
  "code": 200,
  "message": "...",
  "data": {}
}
```

Riêng auth server actions đang kỳ vọng wrapper kiểu:

```ts
type BackendResponse<T> = {
  success?: boolean;
  message?: string;
  data?: T;
};
```

BE cần lưu ý đang tồn tại hai kiểu response wrapper trong FE: auth dùng `success/message/data`, các module v1/admin thường dùng `code/message/data`.

## 4. Auth, cookie, role guard

Auth state dùng Zustand tại `src/features/auth/store/auth.store.ts`.

Role FE hiểu:

```ts
type UserRole = "VIEWER" | "CREATOR" | "ADMIN" | "STAFF";
```

Sau login, FE decode JWT accessToken để lấy:

```txt
sub  -> accountId
role -> roleName
```

FE set cookie HttpOnly trong server actions:

```txt
accessToken  maxAge 15 phút
refreshToken maxAge 7 ngày
sameSite lax
secure = COOKIE_SECURE === "true"
```

Auth endpoints server actions gọi trực tiếp BE:

```txt
POST /api/auth/login
POST /api/auth/register
POST /api/auth/verify-email
POST /api/auth/resend-otp
POST /api/auth/forgot-password
POST /api/auth/reset-password
POST /api/auth/complete-profile
POST /api/auth/google
POST /api/auth/logout
POST /api/auth/refresh-token
GET  /api/auth/me
PUT  /api/auth/me
POST /api/auth/change-password
```

Refresh flow:

```txt
1. Axios nhận 401 với API thường.
2. FE gọi POST /api/internal/auth/refresh.
3. Route handler này đọc refreshToken cookie và gọi BE /api/auth/refresh-token.
4. Nếu BE trả token mới, FE set lại accessToken và refreshToken cookie.
5. Axios retry request cũ.
6. Nếu refresh fail, FE xóa cookie và redirect /login nếu đang ở protected page.
```

Route guard dùng `src/proxy.ts` theo Next 16 Proxy convention:

```txt
/admin chỉ ADMIN
/staff STAFF hoặc ADMIN
/creator-dashboard CREATOR hoặc VIEWER
/settings, /profile cần đăng nhập
/admin redirect sang /admin/dashboard
/staff redirect sang /staff/dashboard
```

## 5. Provider và cache

Global provider tại `src/core/providers/app-providers.tsx`:

```txt
TanStack Query QueryClientProvider
default queries: retry 1, staleTime 30s
Sonner Toaster top-right
```

Root layout bọc:

```txt
AppProviders -> AuthProvider -> SiteHeader -> page -> SiteFooter -> BackToTop -> FloatingPremiumButton
```

Admin layout nằm trong root layout, nhưng `SiteHeader` tự ẩn trên `/admin`, `/staff`, `/creator-dashboard`, auth pages.

## 6. Engagement/Mission Service, trọng tâm hiện tại

Feature nằm trong:

```txt
src/features/mission/
  api/mission.dto.ts
  api/mission.api.ts
  hooks/useMissionQueries.ts
  hooks/useMissionMutations.ts
  hooks/useMissionHeartbeat.ts
  components/admin-mission-dashboard.tsx
  components/admin-mission-form.tsx
  components/mission-center.tsx
  components/ad-reward-modal.tsx
```

Routes liên quan:

```txt
/admin/mission-management -> AdminMissionDashboard
/missions                  -> MissionCenter cho user web
```

### 6.1 DTO FE đang dùng

```ts
type MissionProgressResponseDto = {
  missionId: string;
  code: string;
  title: string;
  description: string;
  rewardAmount: number;
  targetValue: number;
  currentValue: number;
  isCompleted: boolean;
};

type AdSessionResponseDto = {
  sessionId: string;
  expiresInSeconds: number;
};

type MissionRequestDto = {
  code: string;
  title: string;
  description: string;
  rewardAmount: number;
  targetValue: number;
  isActive: boolean;
};

type Mission = MissionRequestDto & {
  missionId: string;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
};
```

### 6.2 API mission FE đang gọi

User side:

```txt
GET  /api/v1/missions
POST /api/v1/missions/heartbeat
POST /api/v1/missions/ads/start       body { missionCode: string }
POST /api/v1/missions/ads/complete    body { sessionId: string }
```

Admin side:

```txt
GET   /api/v1/admin/missions
POST  /api/v1/admin/missions
PUT   /api/v1/admin/missions/{id}
PATCH /api/v1/admin/missions/{id}/toggle
```

### 6.3 Query keys và cache

```ts
missionKeys.all = ["mission"]
missionKeys.myMissions() = ["mission", "my-missions"]
missionKeys.adminMissions() = ["mission", "admin-missions"]
```

Sau mutation:

```txt
heartbeat success -> invalidate myMissions
complete ad success -> invalidate myMissions và coin wallet
create mission success -> invalidate adminMissions
update/toggle mission success -> setQueryData update item trong adminMissions
```

### 6.4 Admin Mission UI flow

Page `/admin/mission-management` render:

```txt
Header: Admin / Mission System
AdminMissionDashboard
```

`AdminMissionDashboard`:

```txt
GET /api/v1/admin/missions
Hiển thị loading skeleton, error state, empty state
Bảng columns: code, title/description, rewardAmount, targetValue, isActive, actions
Actions:
  Add new -> mở AdminMissionForm với initialData null
  Edit -> mở AdminMissionForm với mission hiện tại
  Toggle -> PATCH /api/v1/admin/missions/{missionId}/toggle
```

`AdminMissionForm` validation bằng Zod:

```txt
title: required
description: required
rewardAmount: number > 0
targetValue: number > 0
isActive: boolean
code: string, nhưng code thực tế được FE tự generate theo loại mission
```

Loại mission admin đang tạo:

```txt
ONLINE:
  duration select: 1, 3, 5, 10, 15, 30, 60 phút
  code lưu: ONLINE_{duration}M
  ví dụ ONLINE_1M, ONLINE_5M

WATCH_AD:
  admin nhập suffix
  FE trim + uppercase suffix
  code lưu: WATCH_AD_{suffix}
  ví dụ WATCH_AD_DAILY, WATCH_AD_1, WATCH_AD_VIP

COMPLETE_PROFILE:
  code lưu: COMPLETE_PROFILE
```

Lưu ý cho BE:

```txt
FE hiện không có dropdown động lấy danh sách mission type từ BE.
FE hard-code 3 loại trên.
BE nên validate code unique, format code và mission active.
Nếu BE muốn mở rộng mission type mới, FE cần thay AdminMissionForm để lấy metadata/dynamic schema.
```

### 6.5 User Mission Center flow

Page `/missions` render `MissionCenter`.

`MissionCenter` gọi:

```txt
GET /api/v1/missions
GET /api/v1/check-in/status
POST /api/v1/check-in
```

Hiển thị:

```txt
Daily Check-in card
Mission cards
Reward amount
Progress currentValue/targetValue
Completed state
Button "Làm nhiệm vụ" chỉ bật cho mission có code startsWith("WATCH_AD_")
Các mission khác là passive, hiển thị trạng thái lắng nghe hệ thống/đang tiến hành
```

Icon mapping:

```txt
WATCH_AD_*         -> PlaySquare
ONLINE_DAILY      -> Clock3
WATCH_AD_DAILY    -> PlaySquare
READ_COMIC_DAILY  -> BookOpen
WATCH_VIDEO_DAILY -> Film
COMPLETE_PROFILE  -> UserRoundCheck
default           -> Target
```

Lưu ý: Admin form hiện tạo `ONLINE_{duration}M`, nhưng user icon mapping cũ có `ONLINE_DAILY`. BE và FE nên thống nhất code naming về sau.

### 6.6 Ad reward modal flow

`AdRewardModal` dùng cho mission `WATCH_AD_*`.

Flow:

```txt
1. User click Làm nhiệm vụ.
2. FE gọi POST /api/v1/missions/ads/start với { missionCode }.
3. BE trả { sessionId, expiresInSeconds }.
4. FE hiện modal xem quảng cáo giả lập trong 15 giây hard-code WATCH_SECONDS = 15.
5. Hết countdown, FE gọi POST /api/v1/missions/ads/complete với { sessionId }.
6. Success: invalidate myMissions và coin wallet, modal success.
7. Error: modal error.
```

Lưu ý cho BE:

```txt
FE hiện chưa dùng expiresInSeconds để set countdown, vẫn hard-code 15s.
UI text nói "Redis secured reward session", nghĩa là FE kỳ vọng BE có session tạm, chống spam/replay.
BE nên đảm bảo complete chỉ thành công nếu session hợp lệ, chưa hết hạn, chưa dùng, thuộc user hiện tại và mission code hợp lệ.
```

### 6.7 Online heartbeat flow

Hook `useMissionHeartbeat`:

```txt
Gắn trong SiteHeader.
Chỉ chạy khi Zustand isAuthenticated = true.
Set interval 60_000 ms.
Mỗi 60s nếu document.visibilityState === "visible", gọi POST /api/v1/missions/heartbeat.
Success invalidate myMissions.
```

Quan trọng:

```txt
SiteHeader ẩn trên /admin, /staff, /creator-dashboard, auth pages.
Vì vậy heartbeat chỉ chạy trên user-facing pages có SiteHeader.
Không gửi heartbeat ngay khi mount, chỉ gửi sau interval đầu tiên.
```

BE cần xử lý heartbeat idempotent/throttle được, tránh cộng progress quá nhanh nếu user mở nhiều tab. FE không gửi payload, BE tự lấy user từ cookie/JWT.

## 7. Coin và Daily Check-in liên quan Engagement

Feature nằm trong:

```txt
src/features/coin/
  api/coin.dto.ts
  api/coin.api.ts
  hooks/useCoinQueries.ts
  hooks/useCoinMutations.ts
  components/coin-wallet-widget.tsx
```

DTO:

```ts
type CoinWallet = {
  balance: number;
  totalEarned: number;
  totalSpent: number;
};

type CoinTransaction = {
  transactionId: string;
  amount: number;
  transactionType: string;
  balanceBefore: number;
  balanceAfter: number;
  referenceType: string;
  description: string;
  changedAt: string;
};

type DailyCheckInStatus = {
  isCheckedInToday: boolean;
  currentStreak: number;
};

type DailyCheckInResponse = {
  rewardAmount: number;
  currentStreak: number;
};
```

API:

```txt
GET  /api/v1/coins/wallet
GET  /api/v1/coins/transactions?page={page}&size={size}
GET  /api/v1/check-in/status
POST /api/v1/check-in
```

Query keys:

```txt
["coin", "wallet"]
["coin", "transactions", page, size]
["coin", "check-in-status"]
```

Daily check-in mutation invalidate:

```txt
wallet
transactions
check-in-status
```

`CoinWalletWidget` ở header gọi wallet, check-in status và preview 2 missions đầu từ `/api/v1/missions`. Vì vậy header user có thể tạo 3 request liên quan engagement khi authenticated:

```txt
GET /api/v1/coins/wallet
GET /api/v1/check-in/status
GET /api/v1/missions
```

## 8. Admin Coin Economy

Feature:

```txt
src/features/admin/coin-management/
  api/coin-admin.api.ts
  hooks/useCoinAdmin.ts
  components/coin-economy-form.tsx
```

Route:

```txt
/admin/coin-management
```

API:

```txt
GET /api/v1/admin/coin/economy/config
PUT /api/v1/admin/coin/economy/config
```

Request:

```ts
type CoinEconomyConfigRequest = {
  dailyCheckInBase: number;
  milestone7Reward: number;
  milestone14Reward: number;
  milestone30Reward: number;
};
```

Response:

```ts
type CoinEconomyConfigResponse = CoinEconomyConfigRequest & {
  configId: string;
  createdAt: string;
  createdBy: string;
};
```

FE validation:

```txt
all values > 0
dailyCheckInBase < milestone7Reward
milestone7Reward < milestone14Reward
milestone14Reward < milestone30Reward
```

Ý nghĩa BE cần nắm: config này ảnh hưởng phần thưởng check-in. Mission reward riêng nằm trong mission `rewardAmount`, không lấy từ config coin economy hiện tại.

## 9. Admin modules đã nối API thật

### 9.1 Creator Tiers

Route:

```txt
/admin/creator-tiers
```

API:

```txt
GET    /api/v1/creator-tiers
GET    /api/v1/creator-tiers/{creatorTierId}
POST   /api/v1/creator-tiers
PUT    /api/v1/creator-tiers/{creatorTierId}
DELETE /api/v1/creator-tiers/{creatorTierId}
```

Request/response fields:

```ts
CreatorTier = {
  creatorTierId: string;
  tierName: string;
  tierLevel: number;
  minFollowerRequired: number;
  minViewsRequired: number;
  minWatchTimeRequired: number;
  premiumFundShareRatio: number;
  directPurchaseShareRatio: number;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
};
```

Filter params:

```txt
tierName, tierLevel, isDefault
createdAtFrom, createdAtTo, updatedAtFrom, updatedAtTo
page, pageSize
sortBy: tierName | tierLevel | isDefault | createdAt | updatedAt
sortDirection: ASC | DESC
```

Validation:

```txt
tierName required, max 120
tierLevel/minFollower/minViews integer >= 0
minWatchTime >= 0
share ratios 0..100
Nếu isDefault true thì tierLevel, minFollowerRequired, minViewsRequired, minWatchTimeRequired phải bằng 0
```

### 9.2 Subscriptions/Premium packages

Route:

```txt
/admin/subscriptions
/premium dùng API package public tương tự /api/v1/subscriptions
```

API:

```txt
GET    /api/v1/subscriptions
GET    /api/v1/subscriptions/{subscriptionId}
POST   /api/v1/subscriptions
PUT    /api/v1/subscriptions/{subscriptionId}
DELETE /api/v1/subscriptions/{subscriptionId}
```

Fields:

```ts
Subscription = {
  subscriptionId: string;
  tier: string;
  description: string;
  price: number;
  duration: number;
  durationUnit: string;
  isAdBlocked: boolean;
  isMovieUnlocked: boolean;
  isStoryUnlocked: boolean;
  totalPurchases: number;
  createdAt: string;
  updatedAt: string;
};
```

Request:

```ts
{
  tier: string;
  description: string;
  price: number;
  duration: number;
  durationUnit: "Days" | "Months" | "Years";
}
```

Filter params:

```txt
searchKey
minPrice, maxPrice
minDuration, maxDuration
durationUnits[] serialized as repeated key, not indexed
minTotalPurchases, maxTotalPurchases
isAdBlocked, isMovieUnlocked, isStoryUnlocked
createdAtFrom, createdAtTo, updatedAtFrom, updatedAtTo
page, pageSize
sortBy: price | duration | totalPurchases | createdAt | updatedAt
sortDirection: ASC | DESC
```

### 9.3 Terms versions

Route:

```txt
/admin/terms
```

API:

```txt
GET    /api/v1/terms-versions
GET    /api/v1/terms-versions/{id}
POST   /api/v1/terms-versions
PUT    /api/v1/terms-versions/{id}
DELETE /api/v1/terms-versions/{id}
GET    /api/v1/terms-versions/active/CREATOR  dùng ở creator onboarding
```

Fields:

```ts
TermsType = "CREATOR" | "GENERAL_TOS";

TermsVersion = {
  id: string;
  version: string;
  type: TermsType;
  content: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string | null;
};
```

List params FE gửi lên BE:

```txt
page
pageSize
sortBy: version | type | createdAt | updatedAt
sortDirection: ASC | DESC
types[] serialized as repeated key
```

FE có filter `version` và `isActive` nhưng đang tự lọc ở frontend, không gửi lên BE.

## 10. Admin modules hiện còn mock/chưa nối API

Các màn này đã có UI, nhưng dữ liệu hard-code/mock hoặc local state, chưa có API contract thật trong FE:

```txt
/admin/dashboard       KPI, traffic chart, recent activity mock
/admin/users           UserManagementTable dùng mockUsers
/admin/videos          VideoManagementTable dùng mockVideos
/admin/comics          ComicManagementTable dùng mockComics
/admin/campaigns       CampaignManagementTable dùng mockCampaigns, toggle local state
/admin/analytics       Charts/KPI/Top creators mock
/admin/financials      PayoutRequestsTable dùng mockPayouts
/admin/settings        Tabs/toggles local state, chưa save API
```

Khi BE hỏi "FE đã có gì", cần nói rõ: UI skeleton và UX cho các trang này đã có, nhưng chưa có hook/API layer chính thức. Không nên coi các field mock là contract BE cuối cùng.

## 11. Các API khác trong source, để BE có toàn cảnh

Public/user:

```txt
GET /api/v1/public/series
GET /api/v1/public/series/{seriesId}
GET /api/v1/public/series/{seriesId}/seasons
GET /api/v1/public/seasons/{seasonId}/episodes
GET /api/v1/public/episodes/{episodeId}/playback
GET /api/v1/episodes/{episodeId}/playback
GET /api/v1/subscriptions
```

Creator dashboard/content:

```txt
GET    /api/v1/series/by-creator
POST   /api/v1/series
PUT    /api/v1/series/{id}
DELETE /api/v1/series/{id}
PATCH  /api/v1/series/{id}/hide
PATCH  /api/v1/series/{id}/unhide
GET    /api/v1/series/{seriesId}/seasons
POST   /api/v1/series/{seriesId}/seasons
PUT    /api/v1/seasons/{id}
DELETE /api/v1/seasons/{id}
PATCH  /api/v1/seasons/{id}/hide
PATCH  /api/v1/seasons/{id}/unhide
GET    /api/v1/seasons/{seasonId}/episodes
POST   /api/v1/seasons/{seasonId}/episodes
PUT    /api/v1/episodes/{id}
PATCH  /api/v1/episodes/{id}/schedule-publish
PATCH  /api/v1/episodes/{id}/cancel-schedule
PATCH  /api/v1/episodes/{id}/publish
DELETE /api/v1/episodes/{id}
PATCH  /api/v1/episodes/{id}/hide
PATCH  /api/v1/episodes/{id}/unhide
GET    /api/v1/episodes/{episodeId}/media
POST   /api/v1/episodes/{episodeId}/media
POST   /api/v1/episodes/{episodeId}/media/comic-pages
PUT    /api/v1/episodes/{episodeId}/media/reorder
PUT    /api/v1/media/{id}
PUT    /api/v1/media/{id}/url
PATCH  /api/v1/media/{id}/approve
PATCH  /api/v1/media/{id}/reject
DELETE /api/v1/media/{id}
POST   /api/v1/media/image/presigned-upload
POST   /api/v1/episodes/{episodeId}/media/video/upload-session
GET    /api/v1/media/upload-sessions/{uploadSessionId}
PATCH  /api/v1/media/upload-sessions/{uploadSessionId}/progress
PATCH  /api/v1/media/upload-sessions/{uploadSessionId}/pause
PATCH  /api/v1/media/upload-sessions/{uploadSessionId}/fail
PATCH  /api/v1/media/upload-sessions/{uploadSessionId}/cancel
POST   /api/v1/media/upload-sessions/{uploadSessionId}/complete
GET    /api/v1/media/{mediaId}/violations
GET    /api/v1/sse/pipeline/connect
GET    /api/v1/creators/own
POST   /api/v1/creators
POST   /api/v1/terms-logs
GET/POST/PUT/DELETE /api/v1/combos...
```

Staff:

```txt
GET   /api/v1/media/pending-review
PATCH /api/v1/media/{mediaId}/approve
PATCH /api/v1/media/{mediaId}/reject
```

## 12. Contract BE nên ưu tiên cho Engagement

Để FE dễ nối API và sau này dùng chung cho Web user/Mobile, BE nên thống nhất rõ:

```txt
1. Response wrapper cho mission/coin/admin: { code, message, data }.
2. Auth cookie/JWT: FE dựa vào HttpOnly cookies, JWT payload cần có sub và role.
3. Mission code taxonomy:
   ONLINE_{n}M
   WATCH_AD_{suffix}
   COMPLETE_PROFILE
   hoặc cung cấp endpoint metadata để FE render dynamic.
4. Mission admin:
   list, create, update, toggle cần trả Mission đầy đủ.
   rewardAmount và targetValue là number.
5. User mission:
   GET /api/v1/missions chỉ nên trả mission active relevant hôm nay.
   currentValue và isCompleted phải do BE tính theo user hiện tại.
6. Heartbeat:
   Không payload, lấy user từ token.
   BE cần chống multi-tab spam và cộng progress theo window thời gian.
7. Ads session:
   start trả sessionId và expiresInSeconds.
   complete phải validate user, session, expiry, one-time use.
   Nên trả lỗi nghiệp vụ rõ để FE hiển thị message.
8. Coin:
   Mọi reward completion cần cập nhật wallet và transaction history.
   Transaction nên ghi referenceType/referenceId cho mission/check-in/ad.
9. Mobile:
   Mobile nên dùng cùng mission/coin endpoints, không phụ thuộc Next rewrite.
   Auth mobile có thể dùng Authorization header hoặc cookie tùy thiết kế BE, nhưng response DTO nên giữ giống web.
```

## 13. Tình trạng kiểm tra kỹ thuật tại thời điểm phân tích

Lệnh đã chạy:

```txt
npx tsc --noEmit  -> pass
npm run lint      -> fail
```

Lint fail do lỗi có sẵn, không riêng engagement:

```txt
src/features/admin/terms/components/terms-form-modal.tsx: any
src/features/creator-dashboard/components/combo-management.tsx: any
src/features/creator-dashboard/components/violation-detail-dialog.tsx: react-hooks/set-state-in-effect
nhiều warning <img> thay vì next/image
một số unused variables
```

## 14. Prompt đề xuất đưa cho Gemini

Bạn là AI hỗ trợ phân tích và triển khai FE TaleX. Hãy đọc context dưới đây và trả lời như một senior frontend engineer phối hợp với BE.

Context:

- Source FE là Next.js 16 App Router, React 19, TypeScript strict, Tailwind v4, TanStack Query v5, Axios, Zustand, React Hook Form, Zod, Lucide, Sonner.
- Kiến trúc theo Feature-Sliced Design: `src/app` chỉ route/layout/page, `src/features` chứa business module, `src/shared` chứa HTTP client/UI common, `src/core` chứa config/providers.
- Browser request dùng `/api/...` cùng origin và được Next `rewrites` sang `NEXT_PUBLIC_API_BASE_URL`. Server-side/server actions gọi trực tiếp `API_BASE_URL`.
- Auth dùng HttpOnly cookies `accessToken`, `refreshToken`. JWT payload cần có `sub` và `role`. FE role guard: `/admin` chỉ ADMIN, `/staff` STAFF hoặc ADMIN, `/creator-dashboard` CREATOR hoặc VIEWER.
- Axios interceptor khi gặp 401 gọi `POST /api/internal/auth/refresh`, route này gọi BE `POST /api/auth/refresh-token`, set cookie token mới rồi retry request.
- Module trọng tâm là Engagement/Mission:
  - Admin route `/admin/mission-management`.
  - User route `/missions`.
  - DTO mission:
    - MissionRequestDto `{ code, title, description, rewardAmount, targetValue, isActive }`
    - Mission `{ missionId, code, title, description, rewardAmount, targetValue, isActive, createdAt?, updatedAt?, createdBy?, updatedBy? }`
    - MissionProgressResponseDto `{ missionId, code, title, description, rewardAmount, targetValue, currentValue, isCompleted }`
    - AdSessionResponseDto `{ sessionId, expiresInSeconds }`
  - FE gọi user APIs:
    - `GET /api/v1/missions`
    - `POST /api/v1/missions/heartbeat`
    - `POST /api/v1/missions/ads/start` body `{ missionCode }`
    - `POST /api/v1/missions/ads/complete` body `{ sessionId }`
  - FE gọi admin APIs:
    - `GET /api/v1/admin/missions`
    - `POST /api/v1/admin/missions`
    - `PUT /api/v1/admin/missions/{id}`
    - `PATCH /api/v1/admin/missions/{id}/toggle`
  - Admin form hiện hard-code mission type:
    - ONLINE tạo code `ONLINE_{duration}M`, duration là 1/3/5/10/15/30/60 phút.
    - WATCH_AD tạo code `WATCH_AD_{suffix}`, suffix trim và uppercase.
    - COMPLETE_PROFILE tạo code `COMPLETE_PROFILE`.
  - User chỉ có action button cho mission `code.startsWith("WATCH_AD_")`; các mission khác là passive và chờ BE cập nhật progress.
  - Heartbeat gắn ở SiteHeader, chạy mỗi 60 giây khi user authenticated và tab visible. Không chạy trên admin/staff/creator/auth vì SiteHeader bị ẩn.
  - Ad modal hiện countdown hard-code 15s, sau đó complete ad session. FE chưa dùng `expiresInSeconds`, nhưng BE vẫn nên trả.
- Coin liên quan engagement:
  - `GET /api/v1/coins/wallet`
  - `GET /api/v1/coins/transactions?page=&size=`
  - `GET /api/v1/check-in/status`
  - `POST /api/v1/check-in`
  - Daily check-in và ad completion invalidate wallet.
- Admin Coin Economy:
  - `/admin/coin-management`
  - `GET /api/v1/admin/coin/economy/config`
  - `PUT /api/v1/admin/coin/economy/config`
  - Request `{ dailyCheckInBase, milestone7Reward, milestone14Reward, milestone30Reward }`
  - FE validate các mốc tăng dần.
- Admin modules đã nối API thật: mission-management, coin-management, creator-tiers, subscriptions, terms.
- Admin modules còn mock/chưa có API integration: dashboard, users, videos, comics, campaigns, analytics, financials, settings.

Nhiệm vụ của bạn:

1. Khi phân tích hoặc đề xuất BE contract, hãy ưu tiên mission/engagement/coin vì đây là luồng đang tập trung.
2. Hãy phân biệt rõ phần đã có API thật và phần còn mock.
3. Nếu đề xuất API mới, giữ response wrapper `{ code, message, data }` cho mission/coin/admin v1.
4. Nếu đề xuất FE change, giữ pattern hiện tại: `api/*.ts`, `hooks/useXQueries.ts`, `hooks/useXMutations.ts`, component tách riêng, React Query invalidate cache.
5. Đề xuất giải pháp dùng được cho cả Web FE và Mobile trong tương lai, đặc biệt với mission progress, heartbeat, ads session và coin transaction.
6. Không giả định endpoint tồn tại nếu source FE chưa gọi. Nếu cần, ghi rõ là đề xuất mới.

Hãy trả lời bằng tiếng Việt, rõ ràng theo các mục: kiến trúc hiện tại, API contract hiện tại, rủi ro/lệch contract, đề xuất BE cần bổ sung, đề xuất FE cần chỉnh, kế hoạch mở rộng user web/mobile.
