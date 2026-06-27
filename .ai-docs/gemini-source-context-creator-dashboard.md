# TaleX FE context for Creator, Terms, APIs, and BE integration

Tai lieu nay tom tat source FE hien tai de BE va Gemini hieu dung nhung gi FE da co, FE dang goi API nao, luong creator hien dang thiet ke ra sao, va can bo sung contract nao khi dung Creator UI chuyen nghiep.

## 1. Tong quan stack va kien truc

- Framework: Next.js `16.2.6`, App Router trong `src/app`.
- React: `19.2.4`.
- Language: TypeScript strict.
- Styling: Tailwind CSS v4, global theme trong `src/app/globals.css`.
- UI/components: shadcn style config trong `components.json`, icons `lucide-react`, mot so component shared nhu `Button`, `SiteHeader`, `SiteFooter`.
- Data fetching/cache: TanStack Query v5.
- Form/validation: React Hook Form, Zod, `@hookform/resolvers` dung ro trong admin creator tiers; creator dashboard hien dung form native + FormData.
- State auth: Zustand store trong `src/features/auth/store/auth.store.ts`.
- HTTP: Axios shared client trong `src/shared/api/http-client.ts`.
- Media playback: `hls.js`, custom HLS player trong `src/features/playback/components`.
- Media upload:
  - Image: BE cap presigned URL, FE PUT truc tiep len S3.
  - Video: BE tao upload session; FE upload Cloudinary chunk hoac AWS presigned; co resume bang `localStorage`.

Thu muc chinh:

- `src/app`: routing, page entry, layout, internal API route.
- `src/features`: module theo nghiep vu: auth, creator-dashboard, admin/terms, admin/creator-tiers, playback, staff.
- `src/shared`: http-client, ui chung, utils.
- `src/core`: providers va config.

## 2. Runtime config va proxy API

File config:

- `src/core/config/api.ts`
- `next.config.ts`
- `.env.local`

Bien moi truong dang dung:

- `NEXT_PUBLIC_API_BASE_URL`: base BE, default `http://localhost:8080`.
- `NEXT_PUBLIC_CREATOR_ID`: creatorId tam thoi cho Creator Dashboard.
- `NEXT_PUBLIC_ACTOR_ID`: actorId tam thoi, fallback ve creatorId.
- `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`
- `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET`
- `NEXT_PUBLIC_CLOUDINARY_FOLDER`
- `NEXT_PUBLIC_CLOUDINARY_HLS_STREAMING_PROFILE`
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
- `COOKIE_SECURE`: true khi HTTPS production.

Next rewrite:

- Browser call `/api/...`.
- `next.config.ts` rewrite `/api/:path*` sang `${NEXT_PUBLIC_API_BASE_URL}/api/:path*`.
- Server-side fetch/action goi truc tiep `${NEXT_PUBLIC_API_BASE_URL}`.

HTTP client:

- `httpClient` trong browser co `baseURL = ""`, `withCredentials = true`.
- Server-side `baseURL = API_BASE_URL`.
- Response unwrap dung `BaseResponse<T>` dang:
  - `code: number`
  - `message: string`
  - `data: T`
- Mot so auth action lai ky vong response co `success: boolean`, vi vay BE can thong nhat wrapper giua auth va v1 APIs.

## 3. Auth, role, protected routes

Files:

- `src/proxy.ts`
- `src/features/auth/api/auth.actions.ts`
- `src/features/auth/api/auth.api.ts`
- `src/features/auth/api/auth.dto.ts`
- `src/features/auth/providers/auth-provider.tsx`
- `src/features/auth/store/auth.store.ts`
- `src/features/auth/lib/auth-routing.ts`

Role FE biet:

- `VIEWER`
- `CREATOR`
- `ADMIN`
- `STAFF`

Routing sau login:

- `ADMIN` -> `/admin/dashboard`
- `STAFF` -> `/staff/dashboard`
- `CREATOR` -> `/creator-dashboard`
- `VIEWER` -> `/`

Protected routes:

- Admin: `/admin`
- Staff: `/staff`
- Creator: `/creator-dashboard`
- General protected: `/settings`, `/profile`

Proxy doc cookie:

- `accessToken`
- `refreshToken`

Proxy decode JWT access token de lay `role`. Payload can co:

- `sub`: accountId
- `role`: role name, vi du `CREATOR`

Refresh token flow:

- Axios gap `401` se goi Next internal route `POST /api/internal/auth/refresh`.
- Route internal doc cookie `refreshToken`, goi BE `POST /api/auth/refresh-token` voi body `{ refreshToken }`.
- Neu thanh cong, route set lai HttpOnly cookies:
  - `accessToken`, maxAge 15 phut
  - `refreshToken`, maxAge 7 ngay
- Neu fail, xoa cookie va day user ve login neu dang o protected page.

Auth APIs FE dang dung:

- `POST /api/auth/login`
- `POST /api/auth/register`
- `POST /api/auth/verify-email`
- `POST /api/auth/resend-otp`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- `POST /api/auth/complete-profile`
- `POST /api/auth/google`
- `POST /api/auth/logout`
- `POST /api/auth/refresh-token`
- `GET /api/auth/me`
- `PUT /api/auth/me`
- `POST /api/auth/change-password`

BE can dam bao cookie/session contract phu hop voi Next proxy va Axios `withCredentials`.

## 4. Creator Dashboard hien co

Route:

- `src/app/creator-dashboard/page.tsx` -> render `CreatorDashboard`.

Core files:

- `src/features/creator-dashboard/components/creator-dashboard.tsx`
- `src/features/creator-dashboard/components/resumable-video-uploader.tsx`
- `src/features/creator-dashboard/api/creator-content-api.ts`
- `src/features/creator-dashboard/api/s3-upload-api.ts`
- `src/features/creator-dashboard/api/video-upload-api.ts`
- `src/features/creator-dashboard/hooks/use-resumable-video-upload.ts`

Model FE dang bam:

`Series -> Seasons -> Episodes -> Media`

Dashboard internal route state qua query string:

- `view`: `series | seasons | episodes | create | comic | video`
- `seriesId`
- `seasonId`
- `episodeId`

Vi du:

- `/creator-dashboard?view=series`
- `/creator-dashboard?view=seasons&seriesId=...`
- `/creator-dashboard?view=episodes&seriesId=...&seasonId=...`
- `/creator-dashboard?view=comic&seriesId=...&seasonId=...&episodeId=...`
- `/creator-dashboard?view=video&seriesId=...&seasonId=...&episodeId=...`

Quan trong: creatorId va actorId hien dang lay tu env:

- `CREATOR_DASHBOARD_CREATOR_ID = NEXT_PUBLIC_CREATOR_ID || "1"`
- `CREATOR_DASHBOARD_ACTOR_ID = NEXT_PUBLIC_ACTOR_ID || creatorId`

Day la tam thoi. Khi lam that, FE nen lay creator/account id tu auth profile/session hoac endpoint `/api/auth/me`, khong nen expose/cau hinh public creatorId.

### 4.1 Views/UI trong Creator Dashboard

`SeriesManagementView`

- List series cua creator.
- Filter client-side theo `ALL | COMIC | VIDEO`.
- Search input hien chi UI, chua filter thuc su.
- Action:
  - Create New Series
  - Edit series
  - Delete series
  - Manage Seasons

`SeasonManagementView`

- Hien selected series.
- List season theo series.
- Action:
  - Create Season
  - Edit season
  - Delete season
  - Manage Episodes

`EpisodeManagementView`

- Hien selected season.
- List episodes theo season.
- Action:
  - Create Episode
  - Edit episode
  - Delete episode
  - Open Comic Upload hoac Open Video Upload theo `contentType`.

`CreateSeriesView`

- Form tao series moi.
- Field:
  - title
  - description
  - contentType: `COMIC | VIDEO`
  - coverFile
  - bannerFile
  - categoryIds: nhap comma-separated IDs
  - tagIds: nhap comma-separated IDs
  - language, default `vi`
  - visibility hidden default `PUBLIC`
  - ageRating hidden default `13+`
- UI toggle "Point-based Unlock", "Fast Pass" moi la UI, chua gui field nao len BE.
- Cover/banner upload len S3 truoc, sau do create series bang URL.

`ComicUploadView`

- Edit metadata episode dang comic:
  - episodeNumber
  - totalPage
  - title
  - description
  - contentType = `COMIC`
- Unlock settings:
  - `unlockType: FREE | PAID`
  - `priceVnd`
- Upload pages:
  - user chon/drop nhieu image.
  - FE giu local draft page voi id `LOCAL-...`.
  - FE preview bang blob URL.
  - FE co drag/drop reorder va nut move up/down.
  - Khi Save Pages:
    - Reorder pages da ton tai qua `PUT /api/v1/episodes/{episodeId}/media/reorder`.
    - Upload local pages len S3 qua presigned URL.
    - Extract width/height o client.
    - Persist pages qua `POST /api/v1/episodes/{episodeId}/media/comic-pages`.
- Publishing:
  - Chi enable schedule khi co it nhat mot IMAGE media `status=ACTIVE`, `approvalStatus=APPROVED`, `isDeleted=false`.
  - Schedule goi `PATCH /api/v1/episodes/{episodeId}/schedule-publish`.

`VideoUploadView`

- Edit metadata episode dang video:
  - episodeNumber
  - title
  - description
  - contentType = `VIDEO`
- Unlock settings:
  - `unlockType: FREE | PAID`
  - `priceVnd`
- Media:
  - Hien video hien co tu `GET /api/v1/episodes/{episodeId}/media`.
  - Chi cho upload 1 video. Neu da co video thi uploader disabled, user phai delete video cu truoc.
  - Neu `status=ACTIVE` hoac `HLS_READY` thi dung `SignedHlsPlayer` voi `creatorMode`.
  - Neu `PROCESSING` hoac `HLS_PROCESSING` thi hien processing state va polling media moi 5 giay.
  - Neu `FAILED` hien error message.
- Publishing:
  - Chi enable schedule khi co VIDEO media `approvalStatus=APPROVED` va playable status `ACTIVE | HLS_READY`.

Modal dang co:

- `EditEntityModal`: edit series/season/episode.
- `SchedulePublishModal`: chon datetime-local, gui string `scheduledPublishAt`.
- `DeleteEntityModal`: confirm delete series/season/episode/media.

## 5. Creator content API FE dang goi

File: `src/features/creator-dashboard/api/creator-content-api.ts`

Response wrapper ky vong: `BaseResponse<T>` trong `shared/api/http-client`.

### Series

`GET /api/v1/series/by-creator/{creatorId}`

Params:

- `page`
- `pageSize`

Return: `BasePageResponse<SeriesResponse>`

`POST /api/v1/series`

Body `SeriesRequest`:

- `creatorId?: string`
- `title: string`
- `description?: string`
- `coverUrl?: string`
- `bannerUrl?: string`
- `contentType: VIDEO | COMIC`
- `status?: DRAFT | PUBLISHED | HIDDEN | DELETED`
- `visibility?: PUBLIC | PRIVATE`
- `ageRating?: string`
- `language?: string`
- `categoryIds?: string[]`
- `tagIds?: string[]`
- `actorId?: string`

`PUT /api/v1/series/{id}`

Body nhu `SeriesRequest`.

`DELETE /api/v1/series/{id}`

Params:

- `actorId`

### Seasons

`GET /api/v1/series/{seriesId}/seasons`

Return: `SeasonResponse[]`

`POST /api/v1/series/{seriesId}/seasons`

Body:

- `seasonNumber?: number`
- `title: string`
- `description?: string`
- `status?: DRAFT | PUBLISHED | HIDDEN | DELETED`
- `actorId?: string`

`PUT /api/v1/seasons/{id}`

`DELETE /api/v1/seasons/{id}?actorId=...`

### Episodes

`GET /api/v1/seasons/{seasonId}/episodes`

Return: `EpisodeResponse[]`

`POST /api/v1/seasons/{seasonId}/episodes`

Body:

- `episodeNumber?: number`
- `title: string`
- `description?: string`
- `contentType?: VIDEO | COMIC`
- `status?: DRAFT | PUBLISHED | HIDDEN | DELETED`
- `unlockType?: FREE | PAID`
- `priceVnd?: number`
- `totalPage?: number`
- `actorId?: string`

`PUT /api/v1/episodes/{id}`

`PATCH /api/v1/episodes/{id}/schedule-publish`

Body:

- `scheduledPublishAt: string`

`DELETE /api/v1/episodes/{id}?actorId=...`

### Media

`GET /api/v1/episodes/{episodeId}/media`

Return: `MediaResponse[]`

`POST /api/v1/episodes/{episodeId}/media`

Body `MediaMetadataRequest`.

`POST /api/v1/episodes/{episodeId}/media/comic-pages`

Body:

- `pages: MediaComicPageRequest[]`
- `actorId?: string`

Page item:

- `fileUrl`
- `displayOrder`
- `mimeType`
- `fileSize`
- `checksum?`
- `externalPublicId?`
- `storageProvider?`
- `width?`
- `height?`
- `resolution?`

`PUT /api/v1/episodes/{episodeId}/media/reorder`

Body:

- `items: [{ mediaId, displayOrder }]`
- `actorId?: string`

`PUT /api/v1/media/{id}`

`PUT /api/v1/media/{id}/url`

`PATCH /api/v1/media/{id}/approve`

`PATCH /api/v1/media/{id}/reject`

`DELETE /api/v1/media/{id}?actorId=...`

Note: approve/reject exists in creator content API file, but creator dashboard UI khong goi approve/reject. Moderation/staff UI hien dang mock.

## 6. Image upload S3 flow

File: `src/features/creator-dashboard/api/s3-upload-api.ts`

`POST /api/v1/media/image/presigned-upload`

Body:

- `fileName`
- `mimeType`
- `fileSize`
- `imageContext: cover | banner | comic-page | avatar`
- `entityId?`
- `actorId?`

Return:

- `uploadUrl`
- `key`
- `publicUrl`
- `bucket`
- `region`

Flow:

1. FE goi BE xin presigned URL.
2. FE PUT file truc tiep len `uploadUrl` bang XMLHttpRequest.
3. FE lay `publicUrl` va `key`.
4. FE luu URL vao series hoac tao media comic pages.

BE/S3 can enable CORS cho PUT tu origin FE va allow header `Content-Type`.

## 7. Video resumable upload flow

Files:

- `src/features/creator-dashboard/api/video-upload-api.ts`
- `src/features/creator-dashboard/hooks/use-resumable-video-upload.ts`
- `src/features/creator-dashboard/components/resumable-video-uploader.tsx`

Default chunk size FE: `8 * 1024 * 1024`.

LocalStorage key:

- `talex.video-upload.{episodeId}`

Create upload session:

`POST /api/v1/episodes/{episodeId}/media/video/upload-session`

Body:

- `fileName`
- `fileSize`
- `mimeType`
- `chunkSize?`
- `protectionType?`, default FE gui `SIGNED_URL`
- `creatorId?`
- `actorId?`

Return `VideoUploadSessionResponse`:

- `uploadSessionId`
- `mediaId`
- `episodeId`
- `provider: URL | CLOUDINARY | AWS | MUX | BITMOVIN`
- `cloudName?`
- `apiKey?`
- `timestamp?`
- `signature?`
- `publicId`
- `resourceType?`
- `uploadUrl`
- `uploadUniqueId?`
- `chunkSize`
- `fileSize`
- `fileName`
- `mimeType`
- `providerDeliveryType?`
- `uploadParams?`
- `uploadedBytes?`
- `lastUploadedChunkIndex?`
- `status`
- `expiredAt?`

Resume:

`GET /api/v1/media/upload-sessions/{uploadSessionId}`

Progress:

`PATCH /api/v1/media/upload-sessions/{uploadSessionId}/progress`

Body:

- `uploadedBytes`
- `lastUploadedChunkIndex?`
- `status?`
- `actorId?`

Pause:

`PATCH /api/v1/media/upload-sessions/{uploadSessionId}/pause?actorId=...`

Fail:

`PATCH /api/v1/media/upload-sessions/{uploadSessionId}/fail`

Body:

- `errorMessage?`
- `actorId?`

Cancel:

`PATCH /api/v1/media/upload-sessions/{uploadSessionId}/cancel?actorId=...`

Complete:

`POST /api/v1/media/upload-sessions/{uploadSessionId}/complete`

Body:

- `assetId?`
- `publicId`
- `secureUrl`
- `resourceType?`
- `format?`
- `bytes`
- `duration?`
- `width?`
- `height?`
- `actorId?`

Cloudinary upload behavior:

- FE uploads chunks direct to `uploadUrl`.
- Sends headers:
  - `Content-Range: bytes {start}-{end - 1}/{file.size}`
  - `X-Unique-Upload-Id: uploadUniqueId`
- Sends FormData:
  - file chunk
  - `api_key`
  - `signature`
  - `timestamp`
  - `public_id`
  - optional provider upload params
  - optional `type = providerDeliveryType`
- FE retries transient errors.
- 4xx except 408/409/425/429 is treated permanent and FE calls fail session.

AWS video upload behavior:

- FE PUT whole file to presigned `uploadUrl` using `uploadToS3`.
- FE extracts duration/width/height locally.
- FE completes session with:
  - `publicId`
  - `secureUrl` currently set to `publicId` for S3 key
  - `bytes`
  - metadata

## 8. Playback API used by creator dashboard and watch page

Files:

- `src/features/playback/api/playback-api.ts`
- `src/features/playback/components/signed-hls-player.tsx`
- `src/features/playback/components/hls-video-player.tsx`
- `src/app/watch/[episodeId]/page.tsx`

Public watch page:

- `/watch/{episodeId}` -> `SignedHlsPlayer` public mode.

Public playback endpoint:

`GET /api/v1/public/episodes/{episodeId}/playback?viewerId=...`

Creator-authenticated playback endpoint:

`GET /api/v1/episodes/{episodeId}/playback?viewerId=...`

Creator dashboard uses creator mode de xem DRAFT episode.

Expected `EpisodePlaybackResponse`:

- `episodeId`
- `mediaId`
- `mediaType`
- `playbackType`
- `provider`
- `protectionType`
- `hlsUrl?`
- `playbackUrl?`
- `manifestUrl?`
- `thumbnailUrl?`
- `duration?`
- `expiresAt?`
- `drm?`
- `token?`

HLS player:

- HLS.js for browsers that support MSE.
- Native HLS fallback.
- Saves watch position in `localStorage` key `talex.watch-position.{episodeId}`.
- If CloudFront signed HLS manifest has query params `Policy`, `Signature`, `Key-Pair-Id`, `Expires`, FE forwards them to HLS subrequests.
- Retry playback query for processing errors:
  - `VIDEO_PROCESSING`
  - `VIDEO_NOT_READY`
  - `VIDEO_FAILED`

## 9. Terms module hien co

Route:

- `src/app/admin/terms/page.tsx`

Files:

- `src/features/admin/terms/api/terms.api.ts`
- `src/features/admin/terms/types/terms.types.ts`
- `src/features/admin/terms/hooks/useTermsQueries.ts`
- `src/features/admin/terms/components/terms-management-table.tsx`
- `src/features/admin/terms/components/terms-form-modal.tsx`

Types:

- `TermsType = CREATOR | GENERAL_TOS`
- `TermsVersion`:
  - `id`
  - `version`
  - `type`
  - `content`
  - `isActive`
  - `createdAt`
  - `updatedAt | null`

APIs:

`GET /api/v1/terms-versions`

Params FE gui len BE:

- `page`
- `pageSize`
- `sortBy`
- `sortDirection`
- `types`

Important: FE dung Axios `paramsSerializer: { indexes: null }` de Spring Boot nhan array dang lap key, vi du `types=CREATOR&types=GENERAL_TOS`.

FE filters local-only:

- `version`
- `isActive`

`GET /api/v1/terms-versions/{id}`

`POST /api/v1/terms-versions`

Body:

- `version`
- `type`
- `content`
- `isActive`

`PUT /api/v1/terms-versions/{id}`

Body:

- `version?`
- `type?`
- `content?`
- `isActive?`

Note FE comment noi khi update se gui full formData gom ca `type` de tranh BE NullPointerException.

`DELETE /api/v1/terms-versions/{id}`

FE ky vong delete mem, BE chuyen `isActive = false`.

UI:

- Admin list terms, filter type/status/search, pagination.
- Modal create/edit/view.
- Content textarea chap nhan HTML/Markdown text.

Gap voi creator flow:

- Chua co public route `/terms`.
- Header/Footer co link `/terms` nhung source hien khong co `src/app/terms/page.tsx`.
- Chua co API FE de lay active creator terms cho creator onboarding.
- Chua co API FE de creator accept terms/version.
- Chua co acceptedTerms state trong auth/profile.

## 10. Creator tiers admin module

Route:

- `src/app/admin/creator-tiers/page.tsx`

Files:

- `src/features/admin/creator-tiers/api/creator-tiers.api.ts`
- `src/features/admin/creator-tiers/types/creator-tiers.types.ts`
- `src/features/admin/creator-tiers/hooks/use-creator-tiers.ts`
- `src/features/admin/creator-tiers/components/*`

Endpoint base:

- `/api/v1/creator-tiers`

APIs:

- `GET /api/v1/creator-tiers`
- `GET /api/v1/creator-tiers/{creatorTierId}`
- `POST /api/v1/creator-tiers`
- `PUT /api/v1/creator-tiers/{creatorTierId}`
- `DELETE /api/v1/creator-tiers/{creatorTierId}`

CreatorTier fields:

- `creatorTierId`
- `tierName`
- `tierLevel`
- `minFollowerRequired`
- `minViewsRequired`
- `minWatchTimeRequired`
- `premiumFundShareRatio`
- `directPurchaseShareRatio`
- `isDefault`
- `createdAt`
- `updatedAt`

Filters:

- `tierName`
- `tierLevel`
- `isDefault`
- `createdAtFrom`
- `createdAtTo`
- `updatedAtFrom`
- `updatedAtTo`
- `page`
- `pageSize`
- `sortBy`
- `sortDirection`

Lien quan Creator:

- Day la module admin setup dieu kien tier va revenue share.
- Creator Dashboard hien chua hien tier hien tai, dieu kien len tier, revenue share, payout/wallet creator.

## 11. Staff creator applications hien co

Route:

- `src/app/staff/applications/page.tsx`

File:

- `src/features/staff/components/creator-applications-table.tsx`

Tinh trang:

- Dang dung mock data.
- Chua co API cho creator application.
- UI co cac cot:
  - applicant
  - content type
  - legal/tax info
  - status
  - actions view/approve/reject

Gap can BE:

- Creator application entity/API.
- Upload/xac minh legal docs, tax, banking.
- Staff review/approve/reject.
- Khi approve thi user role/tai khoan/creator profile chuyen sang `CREATOR`.

## 12. Nhu cau API/contract con thieu de lam Creator chuyen nghiep

Hien FE co CRUD content kha day du, nhung con thieu cac contract sau:

1. Current creator context
   - Endpoint lay creator profile hien tai theo auth, vi du `GET /api/v1/creators/me`.
   - Response nen co `creatorId`, `accountId`, displayName, avatar, bio, status, tier, stats, onboarding flags.
   - FE khong nen dung `NEXT_PUBLIC_CREATOR_ID`.

2. Creator onboarding/application
   - Viewer nop don tro thanh creator.
   - Lay active creator terms.
   - Accept terms version.
   - Gui application info: content type, portfolio, legal/tax/banking documents.
   - Theo doi application status.

3. Terms acceptance
   - `GET active CREATOR terms`.
   - `POST accept termsVersionId`.
   - Profile/Auth response can cho FE biet user da accept creator terms chua.

4. Category/tag APIs
   - Creator create series hien nhap categoryIds/tagIds bang text comma.
   - Can APIs list active categories/tags de FE lam select/multi-select.

5. Dashboard analytics
   - Series views/subscriptions hien co field `totalViews`, `totalSubscriptions`, nhung UI chua co data day du.
   - Can endpoints cho creator metrics: views, likes, revenue, watch time, followers, top content.

6. Revenue and payout
   - Creator tiers co admin config, nhung creator dashboard chua co wallet/payout.
   - Can APIs cho earnings, revenue split, payout request, payout status.

7. Moderation status
   - Media co `approvalStatus`.
   - Staff moderation UI hien mock, can API list pending media/content, approve/reject with reason.
   - Creator dashboard can show reject reason/action required.

8. Publish lifecycle
   - FE schedule publish chi can `scheduledPublishAt`.
   - BE can can endpoint publish/unpublish/hide explicit hoac lifecycle transition rules.
   - Can contract ro: khi nao episode status chuyen `DRAFT -> REVIEW -> PUBLISHED`.

9. Upload security
   - S3/Cloudinary CORS, signed params, expiry, cancel/fail session semantics.
   - BE can validate actor owns creator/episode before issuing upload session.

10. Response wrapper consistency
   - Shared APIs expect `{ code, message, data }`.
   - Auth server actions expect `{ success, message, data }`.
   - Nen thong nhat hoac FE tao adapter rieng.

## 13. Prompt de dua cho Gemini

Ban co the copy prompt duoi day cho Gemini:

```text
Ban la AI senior full-stack architect ho tro du an TaleX. Hay doc va phan tich ngữ cảnh FE hien tai duoi day, sau do de xuat contract API BE ro rang cho module Creator, Terms, Upload media, Creator onboarding, Moderation va Creator dashboard moi.

Boi canh source FE:
- Frontend la Next.js 16.2.6 App Router, React 19.2.4, TypeScript strict, Tailwind CSS v4.
- Data fetching dung TanStack Query v5, HTTP dung Axios `httpClient`, auth state dung Zustand.
- Browser goi API qua `/api/...`; Next rewrite sang `${NEXT_PUBLIC_API_BASE_URL}/api/...`.
- Cookie auth la HttpOnly `accessToken` va `refreshToken`. FE proxy decode JWT access token, ky vong payload co `sub` va `role`.
- Role hien co: VIEWER, CREATOR, ADMIN, STAFF.
- Creator route protected: `/creator-dashboard`, chi role CREATOR vao duoc.
- Auth refresh flow: Axios gap 401 goi `POST /api/internal/auth/refresh`, route nay goi BE `POST /api/auth/refresh-token`, neu thanh cong set lai cookies.

Creator Dashboard hien co:
- Route: `/creator-dashboard`.
- Model UI: Series -> Seasons -> Episodes -> Media.
- Query string state: `view`, `seriesId`, `seasonId`, `episodeId`.
- Views:
  1. Series list/create/edit/delete.
  2. Seasons list/create/edit/delete per series.
  3. Episodes list/create/edit/delete per season.
  4. Comic upload: edit episode metadata, unlock FREE/PAID, upload multiple pages, reorder pages, schedule publish only if approved active pages exist.
  5. Video upload: edit episode metadata, unlock FREE/PAID, upload one video, show processing state, play ready video by creator-authenticated playback endpoint, schedule publish only if approved playable video exists.
- CreatorId/actorId hien dang tam lay tu `NEXT_PUBLIC_CREATOR_ID` va `NEXT_PUBLIC_ACTOR_ID`. Can thay bang creator/account id tu session/profile.

Creator content APIs FE dang goi:
- `GET /api/v1/series/by-creator/{creatorId}?page&pageSize`
- `POST /api/v1/series`
- `PUT /api/v1/series/{id}`
- `DELETE /api/v1/series/{id}?actorId=...`
- `GET /api/v1/series/{seriesId}/seasons`
- `POST /api/v1/series/{seriesId}/seasons`
- `PUT /api/v1/seasons/{id}`
- `DELETE /api/v1/seasons/{id}?actorId=...`
- `GET /api/v1/seasons/{seasonId}/episodes`
- `POST /api/v1/seasons/{seasonId}/episodes`
- `PUT /api/v1/episodes/{id}`
- `PATCH /api/v1/episodes/{id}/schedule-publish`
- `DELETE /api/v1/episodes/{id}?actorId=...`
- `GET /api/v1/episodes/{episodeId}/media`
- `POST /api/v1/episodes/{episodeId}/media`
- `POST /api/v1/episodes/{episodeId}/media/comic-pages`
- `PUT /api/v1/episodes/{episodeId}/media/reorder`
- `PUT /api/v1/media/{id}`
- `PUT /api/v1/media/{id}/url`
- `PATCH /api/v1/media/{id}/approve`
- `PATCH /api/v1/media/{id}/reject`
- `DELETE /api/v1/media/{id}?actorId=...`

Image upload:
- `POST /api/v1/media/image/presigned-upload`
- FE expects `{ uploadUrl, key, publicUrl, bucket, region }`.
- FE PUT file directly to S3 presigned URL, then saves `publicUrl` into series/media.

Video upload:
- `POST /api/v1/episodes/{episodeId}/media/video/upload-session`
- `GET /api/v1/media/upload-sessions/{uploadSessionId}`
- `PATCH /api/v1/media/upload-sessions/{uploadSessionId}/progress`
- `PATCH /api/v1/media/upload-sessions/{uploadSessionId}/pause`
- `PATCH /api/v1/media/upload-sessions/{uploadSessionId}/fail`
- `PATCH /api/v1/media/upload-sessions/{uploadSessionId}/cancel`
- `POST /api/v1/media/upload-sessions/{uploadSessionId}/complete`
- FE supports Cloudinary chunk upload and AWS presigned upload.
- FE stores resumable session in localStorage `talex.video-upload.{episodeId}`.

Playback:
- Public: `GET /api/v1/public/episodes/{episodeId}/playback`
- Creator-authenticated: `GET /api/v1/episodes/{episodeId}/playback`
- FE expects HLS URL in `manifestUrl` or `hlsUrl` or `playbackUrl`.
- Creator dashboard uses creator endpoint to play DRAFT episodes.

Terms admin:
- Route `/admin/terms`.
- Type: `CREATOR | GENERAL_TOS`.
- Entity: `{ id, version, type, content, isActive, createdAt, updatedAt }`.
- APIs:
  - `GET /api/v1/terms-versions?page&pageSize&sortBy&sortDirection&types=CREATOR`
  - `GET /api/v1/terms-versions/{id}`
  - `POST /api/v1/terms-versions`
  - `PUT /api/v1/terms-versions/{id}`
  - `DELETE /api/v1/terms-versions/{id}`
- FE currently only has admin management. Missing public `/terms`, active creator terms endpoint, and creator accept terms endpoint.

Creator tiers admin:
- Route `/admin/creator-tiers`.
- Endpoint base `/api/v1/creator-tiers`.
- Fields: creatorTierId, tierName, tierLevel, minFollowerRequired, minViewsRequired, minWatchTimeRequired, premiumFundShareRatio, directPurchaseShareRatio, isDefault, createdAt, updatedAt.
- FE has CRUD admin. Creator dashboard does not yet show current tier/progress/revenue share.

Staff creator applications:
- Route `/staff/applications` exists but uses mock data only.
- Need real APIs for creator application, legal/tax/banking verification, staff approve/reject, and role upgrade to CREATOR.

Hay thuc hien cac viec sau:
1. Lap danh sach API BE can co cho Creator end-to-end, tach theo nhom: Creator profile/me, application/onboarding, terms acceptance, series/season/episode/media, upload, playback, moderation, analytics, revenue/payout, categories/tags.
2. Voi tung API, de xuat method, path, request body/query params, response body, error codes, authorization role, validation quan trong.
3. Chi ra API nao da khop voi FE hien tai, API nao can sua o FE, API nao can BE bo sung.
4. De xuat response wrapper thong nhat cho FE vi hien auth dung `{ success, message, data }` con v1 APIs dung `{ code, message, data }`.
5. De xuat flow Creator moi that chuyen nghiep:
   - Viewer dang ky creator -> xem/accept creator terms -> nop application -> staff review -> approve -> user co role CREATOR -> vao dashboard -> tao series -> upload media -> moderation -> schedule/publish -> theo doi analytics/revenue.
6. De xuat UI/UX Creator Dashboard moi dep, chuyen nghiep, gom cac page/tab can co va data can tu BE.
7. Neu thay rui ro bao mat, ownership, upload, signed URL, cookie/token, hay neu ro va de xuat fix.

Tra loi bang tieng Viet, ro rang cho ca FE va BE cung doc duoc. Khong can viet code tru khi can minh hoa DTO.
```

