# TaleX FE Context for Gemini - Creator Tiers

## 1. Muc dich

Tai lieu nay tom tat hien trang frontend TaleX lien quan den luong Creator
Tiers/Creator Program, gom:

- Source architecture, routing, auth/RBAC, admin shell.
- Creator Dashboard hien co, Staff Creator Applications, Admin UI lien quan.
- API inventory FE dang goi, response wrapper, env/config cong nghe.
- Diem da co, diem dang mock, khoang trong can BE cung cap de FE dung Creator
  Tiers chinh xac.

Luu y quan trong: trong source hien tai chua co module, route, type hay API nao
ten truc tiep `creator-tier`, `creatorTier`, `tier`. Creator Tiers moi dang nam
gian tiep trong role `CREATOR`, creator dashboard, staff application review,
admin users/financials/analytics/terms.

## 2. Stack va setup

- Next.js `16.2.6`, App Router. Theo Next 16, `middleware.ts` da doi convention
  sang `proxy.ts`; repo hien dang dung `src/proxy.ts`.
- React `19.2.4`, React DOM `19.2.4`.
- TypeScript strict, alias `@/* -> ./src/*`.
- Tailwind CSS 4 + `@tailwindcss/postcss`.
- TanStack React Query 5 cho server state/mutations.
- Axios cho REST client.
- Zustand cho auth state.
- Lucide React icons.
- HLS.js cho playback.
- Cloudinary/S3 upload paths dang co trong Creator Dashboard.

Commands:

```bash
npm install
npm run dev
npm run lint
npm run build
npm run start
```

Env dang duoc FE doc:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
NEXT_PUBLIC_GOOGLE_CLIENT_ID=
NEXT_PUBLIC_CREATOR_ID=
NEXT_PUBLIC_ACTOR_ID=
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=
NEXT_PUBLIC_CLOUDINARY_FOLDER=
NEXT_PUBLIC_CLOUDINARY_HLS_STREAMING_PROFILE=sp_auto
COOKIE_SECURE=false
```

Ket noi BE:

- Browser goi relative `/api/...`.
- `next.config.ts` rewrite `/api/:path*` sang
  `${NEXT_PUBLIC_API_BASE_URL}/api/:path*`.
- Server-side actions/route handlers co the goi thang
  `NEXT_PUBLIC_API_BASE_URL`.
- `httpClient` dung `withCredentials: true`.

## 3. Source architecture

Repo huong Feature-Sliced Design:

```text
src/
|-- app/       Next.js route entries, layout, route handlers
|-- features/  feature modules: components, hooks, api
|-- shared/    shared api client, ui, utils
`-- core/      config va providers
```

Quy tac noi bo:

- Khong dat business logic/API phuc tap trong `src/app`.
- Feature nen nam trong `src/features/<feature>/{components,hooks,api}`.
- Admin/Staff nhieu page van la prototype/mock.
- `creator-dashboard.tsx` la monolith lon, gom nhieu view va logic trong 1 file.

Feature folders hien co:

- `admin`
- `auth`
- `coin`
- `creator-dashboard`
- `home`
- `intro`
- `mission`
- `playback`
- `staff`

## 4. Routing lien quan Creator/Admin/Staff

Public/user:

- `/`: home.
- `/intro`: landing intro, co `CreatorHighlight`.
- `/watch/[episodeId]`: HLS playback page.
- `/profile`: profile/update/password.
- `/creator-dashboard`: Creator Studio.

Auth:

- `/login`
- `/register`
- `/forgot-password`
- `/complete-profile`

Admin:

- `/admin/dashboard`
- `/admin/videos`
- `/admin/comics`
- `/admin/users`
- `/admin/analytics`
- `/admin/financials`
- `/admin/campaigns`
- `/admin/coin-management`
- `/admin/mission-management`
- `/admin/terms`
- `/admin/settings`

Staff:

- `/staff/dashboard`
- `/staff/applications`
- `/staff/moderation`
- `/staff/reports`

Chua co:

- `/admin/creator-tiers`
- `/admin/creators`
- `/creator`
- `/creator/tiers`
- `/creator-dashboard/tier`

Ghi chu route/link:

- `siteConfig.mainNav` co item `Creator` tro den `/creator-dashboard`.
- `SiteHeader` va `SiteFooter` co CTA/link `Trở thành Creator`/`Chương trình
  Creator` tro den `/creator`, nhung route `/creator` chua ton tai.

## 5. Auth va RBAC hien co

Role type:

```ts
type UserRole = "VIEWER" | "CREATOR" | "ADMIN" | "STAFF";
```

`src/proxy.ts`:

- Auth routes: `/login`, `/register`, `/forgot-password`, `/complete-profile`.
- Admin routes: `/admin`.
- Staff routes: `/staff`.
- Creator routes: `/creator-dashboard`.
- General protected: `/settings`, `/profile`.
- Neu khong co access/refresh token thi redirect login voi `callbackUrl`.
- `/admin/*` chi cho `ADMIN`.
- `/staff/*` cho `STAFF` hoac `ADMIN`.
- `/creator-dashboard/*` chi cho `CREATOR`.
- Proxy chi decode JWT payload va doc `payload.role`, khong verify signature.
  BE van phai enforce permission o moi API.

Post-login landing:

- `ADMIN -> /admin/dashboard`
- `STAFF -> /staff/dashboard`
- `CREATOR -> /creator-dashboard`
- `VIEWER -> /`

Auth state:

- Zustand store luu `user`, `isAuthenticated`, `isInitialized`.
- `UserProfile` hien co chua co field tier:

```ts
type UserProfile = {
  accountId: string;
  email: string;
  username: string;
  fullName: string;
  avatarUrl?: string;
  roleName: UserRole;
  status: string;
  dateOfBirth?: string;
  phone?: string;
  hasPassword?: boolean;
  googleLinked?: boolean;
  createdAt: string;
};
```

Neu Creator Tier can hien trong header/profile/dashboard, BE can them vao
`GET /api/auth/me` hoac cung cap endpoint Creator profile rieng.

## 6. Shared API client va response wrapper

`src/shared/api/http-client.ts`:

- Axios instance `httpClient`.
- Browser baseURL la same-origin `""`, server baseURL la
  `NEXT_PUBLIC_API_BASE_URL`.
- Interceptor bat `401`, goi `POST /api/internal/auth/refresh`, retry request.
- Refresh fail thi redirect `/login` neu dang o protected page.

Shared unwrap:

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

Khong dong nhat hien co:

- Auth server actions xu ly wrapper `{ success, message, data, timestamp }`.
- Terms tu dinh nghia `ApiResponse<T> = { code, message, data, timestamp? }`.
- Nhieu API dung `unwrapBaseResponse<T>` voi `{ code, message, data }`.

Khuyen nghi cho Creator Tiers: thong nhat contract voi BE ngay tu dau, uu tien
`BaseResponse<T>` va `BasePageResponse<T>` neu BE co the dap ung.

## 7. Creator Dashboard hien co

Route:

- `src/app/creator-dashboard/page.tsx` render `CreatorDashboard`.

Core files:

- `src/features/creator-dashboard/components/creator-dashboard.tsx`
- `src/features/creator-dashboard/api/creator-content-api.ts`
- `src/features/creator-dashboard/api/video-upload-api.ts`
- `src/features/creator-dashboard/api/s3-upload-api.ts`
- `src/features/creator-dashboard/api/cloudinary-api.ts`
- `src/features/creator-dashboard/hooks/use-resumable-video-upload.ts`
- `src/features/creator-dashboard/components/resumable-video-uploader.tsx`

Dashboard views:

- `series`: list/filter/manage series.
- `seasons`: manage seasons of selected series.
- `episodes`: manage episodes of selected season.
- `create`: create new series.
- `comic`: upload comic pages for selected episode.
- `video`: upload one video media for selected episode.

Client route state:

- Dashboard view and selected IDs are stored in URL query params.
- Keys: `view`, `seriesId`, `seasonId`, `episodeId`.

Creator ID:

- FE currently uses env `NEXT_PUBLIC_CREATOR_ID` and
  `NEXT_PUBLIC_ACTOR_ID`.
- This is not derived from logged-in user profile yet.
- For production, BE/FE should move toward creatorId from auth/session/profile
  instead of public env.

Content model types:

```ts
type ContentType = "VIDEO" | "COMIC";
type SeriesStatus = "DRAFT" | "PUBLISHED" | "HIDDEN" | "DELETED";
type SeasonStatus = "DRAFT" | "PUBLISHED" | "HIDDEN" | "DELETED";
type EpisodeStatus = "DRAFT" | "PUBLISHED" | "HIDDEN" | "DELETED";
type Visibility = "PUBLIC" | "PRIVATE";
type MediaType = "VIDEO" | "IMAGE";
```

Media status:

```ts
type MediaStatus =
  | "PROCESSING"
  | "HLS_PROCESSING"
  | "HLS_READY"
  | "ACTIVE"
  | "HIDDEN"
  | "DELETED"
  | "FAILED";
```

Series response hien co:

```ts
type SeriesResponse = {
  seriesId: string;
  creatorId?: string;
  title: string;
  description?: string;
  coverUrl?: string;
  bannerUrl?: string;
  contentType: "VIDEO" | "COMIC";
  status: SeriesStatus;
  visibility?: Visibility;
  ageRating?: string;
  language?: string;
  totalViews?: number;
  totalSubscriptions?: number;
  categories?: CategoryResponse[];
  tags?: TagResponse[];
  createdAt?: string;
  updatedAt?: string;
};
```

UI `SeriesRow` co optional `revenue?: string`, nhung mapper tu
`SeriesResponse` khong map revenue. Nghia la revenue/performance trong creator
dashboard chua co API contract that.

Creator Dashboard API endpoints:

```text
GET    /api/v1/series/by-creator/{creatorId}?page=&pageSize=
POST   /api/v1/series
PUT    /api/v1/series/{id}
DELETE /api/v1/series/{id}?actorId=

GET    /api/v1/series/{seriesId}/seasons
POST   /api/v1/series/{seriesId}/seasons
PUT    /api/v1/seasons/{id}
DELETE /api/v1/seasons/{id}?actorId=

GET    /api/v1/seasons/{seasonId}/episodes
POST   /api/v1/seasons/{seasonId}/episodes
PUT    /api/v1/episodes/{id}
DELETE /api/v1/episodes/{id}?actorId=

GET    /api/v1/episodes/{episodeId}/media
POST   /api/v1/episodes/{episodeId}/media
POST   /api/v1/episodes/{episodeId}/media/comic-pages
PUT    /api/v1/episodes/{episodeId}/media/reorder
PUT    /api/v1/media/{id}
PUT    /api/v1/media/{id}/url
DELETE /api/v1/media/{id}?actorId=
```

Image upload:

```text
POST /api/v1/media/image/presigned-upload
PUT  presigned S3 uploadUrl directly from browser
```

Video upload session:

```text
POST  /api/v1/episodes/{episodeId}/media/video/upload-session
GET   /api/v1/media/upload-sessions/{uploadSessionId}
PATCH /api/v1/media/upload-sessions/{uploadSessionId}/progress
PATCH /api/v1/media/upload-sessions/{uploadSessionId}/pause
PATCH /api/v1/media/upload-sessions/{uploadSessionId}/fail
PATCH /api/v1/media/upload-sessions/{uploadSessionId}/cancel
POST  /api/v1/media/upload-sessions/{uploadSessionId}/complete
```

Video upload flow:

1. Creator selects a video file.
2. FE calls create upload session with `episodeId`, `creatorId`, `actorId`,
   `fileName`, `fileSize`, `mimeType`, `chunkSize`, `protectionType`.
3. FE persists resumable session in `localStorage` by episode.
4. If provider is `AWS`, FE uploads to S3 presigned URL.
5. If provider is `CLOUDINARY`, FE uploads chunks with signed params.
6. FE reports progress to BE.
7. FE calls complete session.
8. BE returns `MediaResponse`.
9. Creator Dashboard refetches media and polls every 5s while video is
   `PROCESSING`/`HLS_PROCESSING`.

Playback:

```text
GET /api/v1/public/episodes/{episodeId}/playback
GET /api/v1/episodes/{episodeId}/playback
```

- Public endpoint for viewer playback.
- Creator-authenticated endpoint can play draft episodes.

Creator Dashboard UI placeholders:

- Unlock settings: Free, Points Required, Fast Pass are UI only in current
  component; no persisted API payload.
- Publishing schedule UI exists, but no API call wired.
- Monetization and Visibility section has point unlock/fast pass toggles in
  UI only, not connected to SeriesRequest.

## 8. Staff Creator Applications hien co

Route:

- `/staff/applications`

Files:

- `src/app/staff/applications/page.tsx`
- `src/features/staff/components/creator-applications-table.tsx`
- `src/features/staff/components/staff-sidebar.tsx`

What exists:

- Staff layout/sidebar/topbar.
- Applications page with task stats:
  - Pending Review.
  - Approved This Week.
  - Avg Review Time.
- Applications table with mock rows:
  - applicant name/email/avatar.
  - content type.
  - legal/tax info status.
  - application status.
  - actions: view, approve, reject.

No real API currently:

- No `creator-applications.api.ts`.
- No hooks.
- Buttons do not call backend.

Creator Tiers relation:

- This can be treated as Creator onboarding/review flow.
- If tier upgrade requires review/KYC, this Staff area may need real APIs.

## 9. Admin UI hien co lien quan Creator/Tiers

Admin shell:

- `src/app/admin/layout.tsx`
- `src/features/admin/components/admin-sidebar.tsx`
- `src/features/admin/components/admin-topbar.tsx`

Admin sidebar items:

- Dashboard
- Videos
- Comics
- Users
- Analytics
- Financials
- Coin Economy
- Mission Management
- Campaigns
- Terms
- Settings

No Creator Tiers menu item currently.

Admin Users:

- Route `/admin/users`.
- `UserManagementTable` is mock.
- Shows role badges: CREATOR, MODERATOR, VIEWER.
- No real user API, no tier column.

Admin Financials:

- Route `/admin/financials`.
- Contains mock revenue cards and `PayoutRequestsTable`.
- Payout table is mock: creator, amount, payment method, date, Process/Reject.
- No payout API.

Admin Analytics:

- Route `/admin/analytics`.
- Mock charts and Top Creators leaderboard.
- No analytics API.

Admin Settings:

- Route `/admin/settings`.
- Local state only.
- Tabs include Payment Gateways, API Keys etc. No API.

Admin Terms:

- Route `/admin/terms`.
- Real API module exists.
- TermsType includes `"CREATOR"` and `"GENERAL_TOS"`.
- Useful if Creator Tier policy/terms need to be shown/managed.

Admin Coin Economy:

- Route `/admin/coin-management`.
- Real API:

```text
GET /api/v1/admin/coin/economy/config
PUT /api/v1/admin/coin/economy/config
```

Admin Missions:

- Route `/admin/mission-management`.
- Real API:

```text
GET   /api/v1/admin/missions
POST  /api/v1/admin/missions
PUT   /api/v1/admin/missions/{id}
PATCH /api/v1/admin/missions/{id}/toggle
```

Best pattern for Creator Tiers:

- Follow `admin/terms` or `admin/coin-management` style:
  - route entry in `src/app/admin/creator-tiers/page.tsx`
  - feature folder `src/features/admin/creator-tiers`
  - `types` or `api` DTO types
  - `api/creator-tiers.api.ts`
  - `hooks/useCreatorTiers.ts`
  - `components/creator-tiers-management-table.tsx`
  - optional form modal/detail drawer.

## 10. API inventory tong quan FE dang goi

Auth:

```text
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

Internal Next BFF:

```text
POST /api/internal/auth/refresh
```

Coin/user:

```text
GET  /api/v1/coins/wallet
GET  /api/v1/coins/transactions?page=&size=
GET  /api/v1/check-in/status
POST /api/v1/check-in
```

Mission:

```text
GET  /api/v1/missions
POST /api/v1/missions/heartbeat
POST /api/v1/missions/ads/start
POST /api/v1/missions/ads/complete
```

Admin mission:

```text
GET   /api/v1/admin/missions
POST  /api/v1/admin/missions
PUT   /api/v1/admin/missions/{id}
PATCH /api/v1/admin/missions/{id}/toggle
```

Admin coin:

```text
GET /api/v1/admin/coin/economy/config
PUT /api/v1/admin/coin/economy/config
```

Terms:

```text
GET    /api/v1/terms-versions
GET    /api/v1/terms-versions/{id}
POST   /api/v1/terms-versions
PUT    /api/v1/terms-versions/{id}
DELETE /api/v1/terms-versions/{id}
```

Creator content/media/playback:

See section 7.

## 11. Khoang trong cho Creator Tiers

Trong FE hien tai chua co:

- Creator tier entity/type.
- Creator tier API client.
- React Query hooks for tiers.
- Admin Creator Tiers route/page.
- Admin sidebar item for Creator Tiers.
- Tier column in Users/Creators list.
- Tier badge in Creator Dashboard.
- Tier benefits/limits in Creator Dashboard.
- Tier-aware upload/monetization restrictions.
- Tier revenue share/commission config.
- Tier history/audit/upgrade/downgrade flow.
- Mapping between creator application approval and assigned initial tier.
- API to list creators with tier/performance.
- API to manually assign/override a creator tier.

## 12. BE contract de xuat de FE co the dung

Day la de xuat contract de FE xay Admin Creator Tiers chinh xac. BE co the doi
ten endpoint/field, nhung nen thong nhat som.

Tier entity:

```ts
type CreatorTierStatus = "ACTIVE" | "INACTIVE" | "ARCHIVED";
type TierEvaluationPeriod = "MONTHLY" | "QUARTERLY" | "LIFETIME";

type CreatorTier = {
  tierId: string;
  code: string;              // STARTER, BRONZE, SILVER, GOLD, PLATINUM
  name: string;
  description?: string;
  level: number;             // sort/order
  status: CreatorTierStatus;
  revenueShareRate: number;  // e.g. 0.7
  platformFeeRate?: number;  // e.g. 0.3
  minTotalViews?: number;
  minMonthlyViews?: number;
  minSubscribers?: number;
  minRevenue?: number;
  maxSeries?: number;
  maxEpisodesPerMonth?: number;
  maxStorageGb?: number;
  maxVideoSizeMb?: number;
  allowFastPass: boolean;
  allowPremiumUnlock: boolean;
  priorityReview: boolean;
  payoutMinAmount?: number;
  evaluationPeriod: TierEvaluationPeriod;
  createdAt: string;
  updatedAt?: string | null;
};
```

Creator tier assignment:

```ts
type CreatorTierAssignment = {
  assignmentId: string;
  creatorId: string;
  accountId?: string;
  creatorName?: string;
  currentTier: CreatorTier;
  assignedBy?: string;
  assignedAt: string;
  effectiveFrom: string;
  effectiveTo?: string | null;
  reason?: string;
  isManualOverride: boolean;
};
```

Creator tier summary:

```ts
type CreatorTierSummary = {
  creatorId: string;
  accountId: string;
  username: string;
  fullName: string;
  avatarUrl?: string;
  status: string;
  tier: CreatorTier;
  totalViews: number;
  monthlyViews: number;
  subscribers: number;
  grossRevenue: number;
  netCreatorRevenue: number;
  pendingPayoutAmount: number;
  nextTier?: CreatorTier;
  progressToNextTier?: {
    viewsPercent?: number;
    subscribersPercent?: number;
    revenuePercent?: number;
  };
};
```

Admin endpoints de xuat:

```text
GET    /api/v1/admin/creator-tiers
GET    /api/v1/admin/creator-tiers/{tierId}
POST   /api/v1/admin/creator-tiers
PUT    /api/v1/admin/creator-tiers/{tierId}
PATCH  /api/v1/admin/creator-tiers/{tierId}/toggle
DELETE /api/v1/admin/creator-tiers/{tierId}

GET    /api/v1/admin/creators?page=&pageSize=&tierCode=&status=&search=
GET    /api/v1/admin/creators/{creatorId}/tier
PUT    /api/v1/admin/creators/{creatorId}/tier
GET    /api/v1/admin/creators/{creatorId}/tier-history
POST   /api/v1/admin/creators/{creatorId}/tier/recalculate
POST   /api/v1/admin/creator-tiers/recalculate-all
```

Creator/self endpoints de xuat:

```text
GET /api/v1/creators/me/tier
GET /api/v1/creators/me/tier-progress
```

Neu dung current auth profile:

- Them field `creatorProfile` hoac `creatorTier` vao `GET /api/auth/me`.
- Can ro rang viewer/admin/staff co field nay hay null.

Payload create/update tier:

```ts
type CreatorTierRequest = {
  code: string;
  name: string;
  description?: string;
  level: number;
  status?: CreatorTierStatus;
  revenueShareRate: number;
  platformFeeRate?: number;
  minTotalViews?: number;
  minMonthlyViews?: number;
  minSubscribers?: number;
  minRevenue?: number;
  maxSeries?: number;
  maxEpisodesPerMonth?: number;
  maxStorageGb?: number;
  maxVideoSizeMb?: number;
  allowFastPass: boolean;
  allowPremiumUnlock: boolean;
  priorityReview: boolean;
  payoutMinAmount?: number;
  evaluationPeriod: TierEvaluationPeriod;
};
```

Payload assign tier:

```ts
type AssignCreatorTierRequest = {
  tierId: string;
  reason?: string;
  effectiveFrom?: string;
  isManualOverride?: boolean;
};
```

## 13. Admin Creator Tiers UI nen dung gi tu source hien co

Route:

```text
src/app/admin/creator-tiers/page.tsx
```

Feature:

```text
src/features/admin/creator-tiers/
|-- index.ts
|-- api/creator-tiers.api.ts
|-- hooks/useCreatorTiers.ts
|-- types/creator-tiers.types.ts
`-- components/
    |-- creator-tiers-dashboard.tsx
    |-- creator-tiers-table.tsx
    |-- creator-tier-form-modal.tsx
    |-- creator-tier-assignment-table.tsx
    `-- creator-tier-history-drawer.tsx
```

Admin sidebar:

- Add item `Creator Tiers` under Users or Financials.
- Suggested icon: `BadgeCheck`, `Crown`, `Layers`, or `ShieldCheck` from
  lucide-react.

Views nen co:

- KPI cards:
  - Total creators.
  - Active tiers.
  - Creators pending upgrade/review.
  - Estimated creator revenue/payout impact.
- Tier config table:
  - Level/code/name/status.
  - Revenue share.
  - Entry criteria.
  - Limits/benefits.
  - Actions edit/toggle/archive.
- Creator assignment table:
  - Creator.
  - Current tier.
  - Performance.
  - Next tier progress.
  - Manual assign/recalculate.
- Tier history/audit:
  - Previous tier, new tier, reason, assignedBy, assignedAt.

Implementation style:

- Use React Query query key factory like `termsKeys`/`coinAdminKeys`.
- Keep route page thin like `AdminCoinManagementPage`.
- Put DTO and API in feature folder, not `src/app`.
- Use `getApiErrorMessage` for mutation errors.
- Prefer real API integration over mock once BE contract exists.

## 14. BE/FE can xac nhan truoc khi code

1. Tier la cau hinh global hay theo market/content type?
2. Initial tier khi Staff approve Creator Application la tier nao?
3. Upgrade/downgrade tu dong theo scheduler hay admin manual?
4. Tieu chi tier tinh theo total views, monthly views, subscribers, revenue,
   completed uploads, approval rate, violation count hay KYC?
5. Revenue share rate la decimal `0.7` hay percent `70`?
6. Currency/revenue field dung VND, USD hay coin?
7. Pagination page la zero-based hay one-based?
8. Response wrapper chuan la `{ code, message, data }` hay
   `{ success, message, data }`?
9. Array query params serialize dang nao: `types=A&types=B` hay `types[]=A`?
10. BE co enforce ADMIN/STAFF/CREATOR permission cho tung endpoint khong?
11. Creator Dashboard co can hide/disable features theo tier limits khong?
12. `creatorId` lay tu JWT/profile hay FE van truyen tu env?
13. Payout/revenue APIs co lien ket voi tier revenue share khong?
14. Terms CREATOR co can version acceptance per tier khong?

## 15. Prompt cho Gemini

Copy prompt duoi day vao Gemini khi can no hieu source va ho tro xay Creator
Tiers:

```text
Ban la AI senior frontend engineer dang lam trong repo TaleX FE.
Hay doc va ton trong boi canh sau:

- Repo la Next.js 16.2.6 App Router, React 19.2.4, TypeScript strict,
  Tailwind CSS 4, TanStack Query 5, Axios, Zustand, Lucide, HLS.js.
- Next.js 16 dung `proxy.ts`, khong phai middleware convention cu. Truoc khi
  sua Next APIs, hay doc docs local trong `node_modules/next/dist/docs/`.
- Kien truc mong muon la Feature-Sliced Design:
  `src/app` chi lam route/layout/page entry, business logic/API nam trong
  `src/features/<feature>/{components,hooks,api}`.
- Shared API client o `src/shared/api/http-client.ts`, browser goi relative
  `/api/...`; `next.config.ts` rewrite sang BE Spring Boot qua
  `NEXT_PUBLIC_API_BASE_URL`.
- Auth roles hien co: VIEWER, CREATOR, ADMIN, STAFF.
- `src/proxy.ts` bao ve `/admin` cho ADMIN, `/staff` cho STAFF/ADMIN,
  `/creator-dashboard` cho CREATOR. BE van phai enforce permission.
- Auth profile type hien chua co creator tier. `GET /api/auth/me` tra
  `UserProfile` gom accountId/email/username/fullName/avatarUrl/roleName/status.
- Creator Dashboard hien co tai `/creator-dashboard`, file chinh
  `src/features/creator-dashboard/components/creator-dashboard.tsx`.
  No quan ly Series -> Seasons -> Episodes -> Media, upload comic pages,
  resumable video upload, signed HLS playback.
- Creator Dashboard dang dung env `NEXT_PUBLIC_CREATOR_ID` va
  `NEXT_PUBLIC_ACTOR_ID`, chua lay creatorId tu user session.
- Creator content APIs hien co:
  GET /api/v1/series/by-creator/{creatorId}
  POST/PUT/DELETE /api/v1/series
  GET/POST /api/v1/series/{seriesId}/seasons
  PUT/DELETE /api/v1/seasons/{id}
  GET/POST /api/v1/seasons/{seasonId}/episodes
  PUT/DELETE /api/v1/episodes/{id}
  GET/POST /api/v1/episodes/{episodeId}/media
  POST /api/v1/episodes/{episodeId}/media/comic-pages
  PUT /api/v1/episodes/{episodeId}/media/reorder
  PUT/DELETE /api/v1/media/{id}
  POST /api/v1/media/image/presigned-upload
  POST /api/v1/episodes/{episodeId}/media/video/upload-session
  GET/PATCH/POST /api/v1/media/upload-sessions/{uploadSessionId}/*
  GET /api/v1/public/episodes/{episodeId}/playback
  GET /api/v1/episodes/{episodeId}/playback
- Admin shell da co tai `/admin/*` voi sidebar/topbar. Admin Users,
  Financials, Analytics, Settings phan lon dang mock. Admin Terms, Coin
  Management, Mission Management la cac module co API that va la pattern nen
  bat chuoc.
- Staff Creator Applications co UI mock tai `/staff/applications`, co approve/
  reject/view buttons nhung chua co API.
- Trong source hien tai chua co module hay endpoint Creator Tiers. Neu xay,
  can tao feature rieng `src/features/admin/creator-tiers` va route
  `/admin/creator-tiers`.

Nhiem vu cua ban:

1. Thiet ke/tien hanh code cho Admin Creator Tiers dua tren pattern Admin Terms
   hoac Coin Management, khong dat logic trong `src/app`.
2. De xuat/khop API contract voi BE truoc khi code neu endpoint chua ton tai.
3. Phan biet ro cai dang co that, cai dang mock, va cai can BE bo sung.
4. Khi them UI, dung phong cach Admin light dashboard hien co, icon lucide,
   React Query hooks, Axios `httpClient`, TypeScript DTO ro rang.
5. Cac API de xuat nen gom:
   GET/POST/PUT/PATCH/DELETE /api/v1/admin/creator-tiers
   GET /api/v1/admin/creators?... filters
   GET/PUT /api/v1/admin/creators/{creatorId}/tier
   GET /api/v1/admin/creators/{creatorId}/tier-history
   GET /api/v1/creators/me/tier
   GET /api/v1/creators/me/tier-progress
6. CreatorTier nen co code/name/level/status/revenueShareRate/criteria/limits/
   benefits/evaluationPeriod/audit timestamps.
7. Neu BE response wrapper khac nhau, tao adapter ro rang va khong pha
   `unwrapBaseResponse`.

Hay bat dau bang viec doc cac file lien quan:
- package.json
- next.config.ts
- src/shared/api/http-client.ts
- src/proxy.ts
- src/features/auth/api/auth.dto.ts
- src/app/admin/layout.tsx
- src/features/admin/components/admin-sidebar.tsx
- src/features/admin/terms/**
- src/features/admin/coin-management/**
- src/features/creator-dashboard/api/**
- src/features/creator-dashboard/components/creator-dashboard.tsx
- src/features/staff/components/creator-applications-table.tsx

Sau khi doc, hay dua ra plan ngan gon, sau do code theo pham vi duoc yeu cau.
```

