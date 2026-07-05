# TaleX FE current context - Creator Dashboard, upload flow, BE API contract

Ngay lap: 2026-07-05.
Pham vi: source FE hien tai lien quan route `/creator-dashboard`, luong Creator tao series/season/episode, upload comic/video, playback preview, moderation pipeline, combo, va ghi chu cho trang campaign/engagement-service trong tuong lai.

## 1. Stack va kien truc FE

- Framework: Next.js `16.2.9`, App Router trong `src/app`.
- React: `19.2.4`.
- TypeScript: strict mode, alias `@/* -> ./src/*`.
- Styling: Tailwind CSS v4 qua `@tailwindcss/postcss`, global CSS tai `src/app/globals.css`.
- UI: shadcn-style config `components.json`, Radix UI, lucide-react icons, shared UI trong `src/shared/ui`.
- Data fetching: TanStack React Query v5, provider tai `src/core/providers/app-providers.tsx`, default retry 1, staleTime 30s.
- HTTP: Axios `httpClient` tai `src/shared/api/http-client.ts`.
- Auth state: Zustand store tai `src/features/auth/store/auth.store.ts`.
- Toast: Sonner.
- Video playback: `hls.js`, custom player `src/features/playback/components/hls-video-player.tsx`.
- SSE: `@microsoft/fetch-event-source` cho pipeline events.

Kien truc thu muc:

- `src/app`: route entry, layout, internal route handler.
- `src/features`: business feature modules, trong do `creator-dashboard` chua UI/API/hooks cua Creator Studio.
- `src/shared`: http-client, UI dung chung, utils.
- `src/core`: config va providers.

Next.js App Router convention: route public duoc tao boi file `page.tsx`; route handler boi `route.ts`. Project dung `src/app`, va route group `(auth)` khong anh huong URL.

## 2. Runtime config, proxy API, auth refresh

Files chinh:

- `next.config.ts`
- `src/core/config/api.ts`
- `src/shared/api/http-client.ts`
- `src/app/api/internal/auth/refresh/route.ts`
- `.env.local`

Bien moi truong dang dung:

- `NEXT_PUBLIC_API_BASE_URL`: base URL BE, default `http://localhost:8080`.
- `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`
- `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET`
- `NEXT_PUBLIC_CLOUDINARY_FOLDER`
- `NEXT_PUBLIC_CLOUDINARY_HLS_STREAMING_PROFILE`
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
- `COOKIE_SECURE`: set cookie secure khi HTTPS production.
- `NEXT_PUBLIC_CREATOR_ID`, `NEXT_PUBLIC_ACTOR_ID` van co trong env nhung luong creator dashboard hien tai chu yeu lay `actorId` tu auth store `user.accountId`, va lay `creatorId` tu `SeriesResponse.creatorId` neu co.

Proxy API:

- Browser goi `/api/...` tren Next origin.
- `next.config.ts` rewrite `/api/:path*` sang `${NEXT_PUBLIC_API_BASE_URL}/api/:path*`.
- `httpClient` o browser co `baseURL = ""`, `withCredentials = true`.
- Server-side co `baseURL = API_BASE_URL`.

Response wrapper v1:

```ts
type BaseResponse<T> = {
  code: number;
  message: string;
  data: T;
}
```

Luu y: auth DTO/action o mot so cho lai ky vong wrapper co `success`, `message`, `data`, `timestamp`. BE nen thong nhat contract hoac FE can tach ro auth/v1 wrapper.

Auth refresh:

- Khi Axios gap `401`, interceptor goi `POST /api/internal/auth/refresh`.
- Internal route doc cookie `refreshToken`, goi BE `POST {API_BASE_URL}/api/auth/refresh-token` body `{ refreshToken }`.
- Thanh cong thi set lai HttpOnly cookies `accessToken` 15 phut, `refreshToken` 7 ngay.
- Fail thi xoa cookies va redirect login neu user dang o protected page.

## 3. Route protection va onboarding creator

Files:

- `src/proxy.ts`
- `src/features/auth/providers/auth-provider.tsx`
- `src/features/auth/store/auth.store.ts`
- `src/features/creator-dashboard/components/creator-guard.tsx`
- `src/features/creator-dashboard/components/terms-acceptance-modal.tsx`
- `src/features/creator-dashboard/api/creator-onboarding-api.ts`

Route `/creator-dashboard`:

- Entry: `src/app/creator-dashboard/page.tsx`.
- Render: `<CreatorGuard><CreatorDashboard /></CreatorGuard>`.
- Proxy cho phep role `CREATOR` va `VIEWER` vao route creator dashboard.
- Neu chua co token thi redirect login.
- `VIEWER` co token duoc vao de `CreatorGuard` xu ly onboarding/terms.

CreatorGuard flow:

1. Goi `GET /api/v1/creators/own`.
2. Neu success va `isAcceptedLatestTerms === true`: render dashboard.
3. Neu error code `4041`: hien locked backdrop va `TermsAcceptanceModal` mode `register`.
4. Neu success nhung `isAcceptedLatestTerms === false`: hien modal mode `update`, bat chap nhan terms moi.
5. Neu error khac: hien error screen va cho retry.

Onboarding APIs:

- `GET /api/v1/creators/own`
  - FE can: `creatorId`, `accountId`, `displayName`, `avatarUrl`, `bio`, `status`, `isAcceptedLatestTerms`, `termsVersion`.
- `GET /api/v1/terms-versions/active/CREATOR`
  - Dung khi user chua co creator record.
- `POST /api/v1/creators`
  - Body: `{ termsId }`.
  - Dang ky current account thanh creator.
- `POST /api/v1/terms-logs`
  - Body: `{ versionId }`.
  - Chap nhan dieu khoan creator version moi.

## 4. Creator Dashboard UI state va views

File monolith chinh: `src/features/creator-dashboard/components/creator-dashboard.tsx`.

Model FE bam theo:

```text
Series -> Season -> Episode -> Media
```

Dashboard route state nam tren query string:

- `view`: `series | seasons | episodes | create | comic | video | combos`
- `seriesId`
- `seasonId`
- `episodeId`

Vi du:

- `/creator-dashboard?view=series`
- `/creator-dashboard?view=seasons&seriesId=...`
- `/creator-dashboard?view=episodes&seriesId=...&seasonId=...`
- `/creator-dashboard?view=comic&seriesId=...&seasonId=...&episodeId=...`
- `/creator-dashboard?view=video&seriesId=...&seasonId=...&episodeId=...`
- `/creator-dashboard?view=combos`

Views:

- `series`: list/search/filter UI cho series cua creator, edit/delete/hide/unhide, open seasons.
- `seasons`: list seasons theo selected series, create/edit/delete/hide/unhide, open episodes.
- `episodes`: list episodes theo selected season, create/delete, open comic/video upload theo `contentType`.
- `create`: tao series moi, chon `COMIC` hoac `VIDEO`, upload cover/banner, categoryIds/tagIds nhap comma-separated IDs.
- `comic`: edit episode metadata, unlock FREE/PAID, upload/reorder/delete comic pages, publish/schedule khi co media da approved.
- `video`: edit episode metadata, unlock FREE/PAID, upload 1 video, xem status processing/moderation, preview HLS, publish/schedule khi co video playable va approved.
- `combos`: tao/sua/xoa combo tap hop nhieu episode co gia combo.

React Query keys quan trong:

- `["creator-dashboard", "series"]`
- `["creator-dashboard", "seasons", seriesId]`
- `["creator-dashboard", "episodes", seasonId]`
- `["creator-dashboard", "media", episodeId]`
- `["creator-dashboard", "combos"]`

Media query refetch:

- Chi enabled o view `comic` hoac `video`.
- Refetch moi 5s neu media co status `PENDING`, `PROCESSING`, hoac `HLS_PROCESSING`.
- Video processing view cung set interval 5s khi co video dang processing.

## 5. DTO FE expects for creator content

Series:

```ts
type SeriesResponse = {
  seriesId: string;
  creatorId?: string;
  title: string;
  description?: string;
  coverUrl?: string;
  bannerUrl?: string;
  contentType: "VIDEO" | "COMIC";
  status: "DRAFT" | "PUBLISHED" | "HIDDEN" | "DELETED" | "SCHEDULED";
  visibility?: "PUBLIC" | "PRIVATE";
  ageRating?: string;
  language?: string;
  totalViews?: number;
  totalSubscriptions?: number;
  categories?: { categoryId: string; categoryName: string; slug?: string; status?: string }[];
  tags?: { tagId: string; tagName: string; slug?: string; status?: string }[];
  createdAt?: string;
  updatedAt?: string;
}
```

Season:

```ts
type SeasonResponse = {
  seasonId: string;
  seriesId: string;
  creatorId?: string;
  seasonNumber?: number;
  title: string;
  description?: string;
  status: "DRAFT" | "PUBLISHED" | "HIDDEN" | "DELETED" | "SCHEDULED";
  createdAt?: string;
  updatedAt?: string;
}
```

Episode:

```ts
type EpisodeResponse = {
  episodeId: string;
  seasonId: string;
  creatorId?: string;
  episodeNumber?: number;
  title: string;
  description?: string;
  contentType: "VIDEO" | "COMIC";
  status: "DRAFT" | "PUBLISHED" | "HIDDEN" | "DELETED" | "SCHEDULED";
  scheduledPublishAt?: string;
  publishedAt?: string;
  unlockType?: "FREE" | "PAID";
  priceVnd?: number;
  likes?: number;
  views?: number;
  totalPage?: number;
  createdAt?: string;
  updatedAt?: string;
}
```

Media:

```ts
type MediaResponse = {
  mediaId: string;
  episodeId: string;
  mediaType: "VIDEO" | "IMAGE";
  mimeType: string;
  fileUrl?: string | null;
  originalUrl?: string | null;
  playbackUrl?: string | null;
  hlsUrl?: string | null;
  manifestUrl?: string | null;
  signedPlaybackUrl?: string | null;
  thumbnailUrl?: string | null;
  externalPublicId?: string;
  providerPublicId?: string;
  providerAssetId?: string;
  provider?: string;
  storageProvider?: string;
  providerDeliveryType?: string;
  fileSize: number;
  checksum?: string;
  format?: string;
  width?: number;
  height?: number;
  resolution?: string;
  duration?: number;
  displayOrder?: number;
  status: "PENDING" | "PROCESSING" | "HLS_PROCESSING" | "HLS_READY" | "ACTIVE" | "HIDDEN" | "INACTIVE" | "DELETED" | "FAILED";
  approvalStatus?: "PENDING_REVIEW" | "APPROVED" | "REJECTED";
  errorMessage?: string;
  pendingDelete?: boolean;
  createdAt?: string;
  updatedAt?: string;
  isDeleted?: boolean;
}
```

## 6. Creator content APIs FE dang goi

File: `src/features/creator-dashboard/api/creator-content-api.ts`.

Series:

- `GET /api/v1/series/by-creator?page=&pageSize=`
- `POST /api/v1/series`
- `PUT /api/v1/series/{id}`
- `DELETE /api/v1/series/{id}`
- `PATCH /api/v1/series/{id}/hide`
- `PATCH /api/v1/series/{id}/unhide`

Season:

- `GET /api/v1/series/{seriesId}/seasons`
- `POST /api/v1/series/{seriesId}/seasons`
- `PUT /api/v1/seasons/{id}`
- `DELETE /api/v1/seasons/{id}`
- `PATCH /api/v1/seasons/{id}/hide`
- `PATCH /api/v1/seasons/{id}/unhide`

Episode:

- `GET /api/v1/seasons/{seasonId}/episodes`
- `POST /api/v1/seasons/{seasonId}/episodes`
- `PUT /api/v1/episodes/{id}`
- `PATCH /api/v1/episodes/{id}/schedule-publish`
- `PATCH /api/v1/episodes/{id}/cancel-schedule`
- `PATCH /api/v1/episodes/{id}/publish`
- `DELETE /api/v1/episodes/{id}`
- `PATCH /api/v1/episodes/{id}/hide`
- `PATCH /api/v1/episodes/{id}/unhide`

Media:

- `GET /api/v1/episodes/{episodeId}/media`
- `POST /api/v1/episodes/{episodeId}/media`
  - Api function ton tai nhung creator dashboard hien khong dung cho video upload chinh.
- `POST /api/v1/episodes/{episodeId}/media/comic-pages`
- `PUT /api/v1/episodes/{episodeId}/media/reorder`
- `PUT /api/v1/media/{id}`
  - Function ton tai, UI creator hien khong goi.
- `PUT /api/v1/media/{id}/url`
  - Function ton tai, UI creator hien khong goi.
- `PATCH /api/v1/media/{id}/approve`
  - Function ton tai, creator UI khong goi, staff/moderation moi nen goi.
- `PATCH /api/v1/media/{id}/reject`
  - Function ton tai, creator UI khong goi.
- `DELETE /api/v1/media/{id}?actorId=...`

## 7. Luong tao series/season/episode

Tao series:

1. User vao view `create`.
2. Chon contentType `COMIC` hoac `VIDEO`.
3. Chon cover/banner file neu co.
4. FE goi `POST /api/v1/media/image/presigned-upload` cho cover va banner rieng neu co file.
5. FE PUT file truc tiep len S3 presigned URL.
6. FE goi `POST /api/v1/series` voi `coverUrl` va `bannerUrl` da upload.
7. On success, dashboard chuyen sang `view=seasons&seriesId={series.seriesId}` va invalidate series query.

Payload create series:

```ts
{
  title,
  description,
  coverUrl,
  bannerUrl,
  contentType: "COMIC" | "VIDEO",
  visibility: "PUBLIC" | "PRIVATE",
  ageRating,
  language,
  categoryIds: string[],
  tagIds: string[]
}
```

Tao season:

1. User chon series.
2. Click Create Season.
3. FE goi `POST /api/v1/series/{seriesId}/seasons`.
4. Payload default:

```ts
{
  seasonNumber: displaySeasonRows.length + 1,
  title: `Season ${nextSeasonNumber}`,
  description: "Draft season created from creator dashboard."
}
```

Tao episode:

1. User chon season.
2. Click Create Episode.
3. FE goi `POST /api/v1/seasons/{seasonId}/episodes`.
4. Payload default:

```ts
{
  episodeNumber: displayEpisodeRows.length + 1,
  title: selectedSeries.contentType === "COMIC" ? "New Comic Episode" : "New Video Episode",
  description: "Draft episode created from creator dashboard.",
  contentType: selectedSeries.contentType,
  unlockType: "FREE",
  priceVnd: 0
}
```

5. On success, FE map response va tu dong mo view upload:
   - COMIC -> `view=comic`
   - VIDEO -> `view=video`

Update episode metadata/unlock:

- Metadata save goi `PUT /api/v1/episodes/{id}`.
- Unlock FREE/PAID cung goi `PUT /api/v1/episodes/{id}`.
- Neu `unlockType=FREE`, FE gui `priceVnd=0`.
- Neu `unlockType=PAID`, FE yeu cau price > 0.

Publish/schedule:

- FE chi enable Schedule/Publish khi:
  - Comic: co it nhat 1 media IMAGE `status=ACTIVE`, `approvalStatus=APPROVED`, `!isDeleted`.
  - Video: co it nhat 1 media VIDEO `approvalStatus=APPROVED` va `status=ACTIVE` hoac `HLS_READY`.
- Schedule goi `PATCH /api/v1/episodes/{id}/schedule-publish` body `{ scheduledPublishAt }`.
- Publish now goi `PATCH /api/v1/episodes/{id}/publish`.
- Cancel schedule goi `PATCH /api/v1/episodes/{id}/cancel-schedule`.

## 8. Luong upload comic pages

Files:

- `src/features/creator-dashboard/components/creator-dashboard.tsx`
- `src/features/creator-dashboard/api/s3-upload-api.ts`

UI:

- User vao episode COMIC.
- Chon/drag multiple image files.
- FE tao local pages id `LOCAL-...`, preview bang blob URL.
- Chua upload ngay. Chi upload khi click Save Pages / Save Display Order.
- Co the drag reorder local/existing pages.

Save comic pages flow:

1. Lay `displayComicPages`, set `displayOrder = index + 1`.
2. Tach:
   - Saved pages: da co backend mediaId, khong phai `LOCAL-*`.
   - Local pages: co `file`.
3. Neu co saved pages, goi:

```http
PUT /api/v1/episodes/{episodeId}/media/reorder
```

Body:

```ts
{
  items: [{ mediaId, displayOrder }],
  actorId
}
```

4. Voi moi local image, FE goi:

```http
POST /api/v1/media/image/presigned-upload
```

Body:

```ts
{
  fileName,
  mimeType,
  fileSize,
  imageContext: "comic-page",
  entityId: episodeId,
  actorId?
}
```

5. BE tra:

```ts
{
  uploadUrl,
  key,
  publicUrl,
  bucket,
  region
}
```

6. FE PUT file truc tiep len `uploadUrl`, header `Content-Type`.
7. FE doc image dimensions local, tao payload:

```ts
{
  fileUrl: publicUrl,
  displayOrder,
  mimeType,
  fileSize,
  externalPublicId: key,
  storageProvider: "AWS",
  width,
  height,
  resolution: "WIDTHxHEIGHT"
}
```

8. FE goi:

```http
POST /api/v1/episodes/{episodeId}/media/comic-pages
```

Body:

```ts
{
  pages: MediaComicPageRequest[],
  actorId
}
```

9. On success invalidate episodes/media query.

Delete comic page:

- Neu page local `LOCAL-*`: chi remove local state.
- Neu da co backend media: `DELETE /api/v1/media/{mediaId}?actorId=...`.

BE can tu dong dua media moi vao pipeline moderation/copyright neu can. FE mong status ban dau co the la `PENDING` va ve sau thanh `ACTIVE/INACTIVE/FAILED`.

## 9. Luong upload video episode

Files:

- `src/features/creator-dashboard/components/resumable-video-uploader.tsx`
- `src/features/creator-dashboard/hooks/use-resumable-video-upload.ts`
- `src/features/creator-dashboard/api/video-upload-api.ts`
- `src/features/creator-dashboard/api/s3-upload-api.ts`

UI:

- Moi episode video chi cho 1 video active. Neu `videos.length > 0`, uploader bi disabled va yeu cau xoa video cu truoc.
- FE co preview local video.
- Progress: uploadedBytes/totalBytes, speed, pause/cancel/retry.
- Resume: luu session vao localStorage key `talex.video-upload.{episodeId}`.
- Chunk size default: 8 MB.
- Protection type gui len: `SIGNED_URL`.

Create session:

```http
POST /api/v1/episodes/{episodeId}/media/video/upload-session
```

Body:

```ts
{
  fileName,
  fileSize,
  mimeType,
  chunkSize: 8388608,
  protectionType: "SIGNED_URL",
  creatorId?,
  actorId?
}
```

Response FE can:

```ts
{
  uploadSessionId,
  mediaId,
  episodeId,
  provider: "URL" | "CLOUDINARY" | "AWS" | "MUX" | "BITMOVIN",
  cloudName?,
  apiKey?,
  timestamp?,
  signature?,
  publicId,
  resourceType?,
  uploadUrl,
  uploadUniqueId?,
  chunkSize,
  fileSize,
  fileName,
  mimeType,
  providerDeliveryType?,
  uploadParams?,
  uploadedBytes?,
  lastUploadedChunkIndex?,
  status,
  expiredAt?
}
```

Neu provider = `AWS`:

1. FE PUT toan bo file len `uploadUrl` bang `uploadToS3`.
2. FE doc metadata video local: duration, width, height.
3. FE goi complete:

```http
POST /api/v1/media/upload-sessions/{uploadSessionId}/complete
```

Body:

```ts
{
  publicId,
  secureUrl: publicId,
  bytes: file.size,
  duration,
  width,
  height,
  actorId
}
```

Luu y: voi AWS path hien tai FE set `secureUrl = publicId` vi comment noi day la S3 key, khong phai presigned URL. BE can hieu convention nay hoac FE can doi neu BE yeu cau URL khac.

Neu provider = `CLOUDINARY`:

1. FE chia file thanh chunks 8 MB.
2. Moi chunk POST truc tiep den `uploadUrl` cua Cloudinary.
3. Header:
   - `Content-Range: bytes {start}-{end-1}/{file.size}`
   - `X-Unique-Upload-Id: upload.uploadUniqueId`
4. FormData:
   - `file`
   - cac `uploadParams` BE tra ve
   - `api_key`
   - `signature`
   - `timestamp`
   - `public_id`
   - `type` neu `providerDeliveryType` co va formData chua co `type`.
5. Sau moi chunk, FE goi progress:

```http
PATCH /api/v1/media/upload-sessions/{uploadSessionId}/progress
```

Body:

```ts
{
  uploadedBytes,
  lastUploadedChunkIndex,
  status: "UPLOADING",
  actorId
}
```

6. Chunk response cuoi phai co `secure_url`.
7. FE goi complete:

```http
POST /api/v1/media/upload-sessions/{uploadSessionId}/complete
```

Body:

```ts
{
  assetId,
  publicId,
  secureUrl,
  resourceType,
  format,
  bytes,
  duration,
  width,
  height,
  actorId
}
```

Resume:

- Neu user chon lai dung file va session chua expired, FE goi:

```http
GET /api/v1/media/upload-sessions/{uploadSessionId}
```

- Neu remote status `COMPLETED`, `CANCELLED`, `EXPIRED`, FE xoa local session va bao loi.

Pause/cancel/fail:

- Pause UI:
  - Abort current fetch.
  - Goi `PATCH /api/v1/media/upload-sessions/{uploadSessionId}/pause?actorId=...`.
  - Set local status `paused`.
- Cancel UI:
  - Abort current fetch.
  - Goi `PATCH /api/v1/media/upload-sessions/{uploadSessionId}/cancel?actorId=...`.
  - Clear local session.
- Fail:
  - Neu loi permanent client error Cloudinary, FE goi:
  - `PATCH /api/v1/media/upload-sessions/{uploadSessionId}/fail`
  - Body `{ errorMessage, actorId }`.

On complete:

- BE tra `MediaResponse`.
- FE set status completed, clear localStorage, invalidate media/episodes.
- Sau do dashboard poll/SSE de cho pipeline chuyen media status.

## 10. Pipeline moderation, violation detail, SSE

Files:

- `src/features/creator-dashboard/hooks/use-pipeline-sse.ts`
- `src/features/creator-dashboard/api/pipeline-api.ts`
- `src/features/creator-dashboard/components/violation-detail-dialog.tsx`

SSE connect:

```http
GET /api/v1/sse/pipeline/connect
```

FE dung `fetchEventSource` voi `credentials: "include"`.

Events FE xu ly:

- `heartbeat`, `connected`: ignore.
- `pipeline:copyright_complete`
  - Neu duplicate/violationsCount > 0: toast warning.
  - Neu safe: toast info va tiep tuc moderation.
- `pipeline:moderation_complete`
  - Neu `isSafe`: toast success.
  - Neu unsafe: toast error, noi media bi tam an.
- `pipeline:failed`
  - Toast error theo failedStep `COPYRIGHT` hoac `MODERATION`.

Moi event hop le se invalidate:

- `["creator-dashboard", "media"]`
- `["creator-dashboard", "episodes"]`
- `["media"]`
- `["episodes"]`

Violation detail:

```http
GET /api/v1/media/{mediaId}/violations
```

Hien copyright violations va censorship results trong dialog khi media `INACTIVE`.

BE response hien FE expects:

```ts
{
  mediaId,
  contentId?,
  copyrightViolations: [{
    mediaCopyrightId,
    mediaId,
    sourceMediaId?,
    startTimeTarget?,
    endTimeTarget?,
    startTimeSource?,
    endTimeSource?,
    similarityScore?,
    violationType?,
    isValid?,
    note?,
    checkedAt?
  }],
  censorshipResults: [{
    censorshipId,
    mediaId,
    primaryViolationLabel?,
    confidenceScore?,
    checkedAt?,
    reviewedBy?,
    reviewerNotes?,
    status?,
    violationDetails?: [{
      violationDetailId,
      violationAt?,
      endViolationAt?,
      label?,
      confidence?,
      suggestion?
    }]
  }]
}
```

## 11. Playback APIs creator preview va watch page

Files:

- `src/features/playback/api/playback-api.ts`
- `src/features/playback/components/signed-hls-player.tsx`
- `src/features/playback/components/hls-video-player.tsx`
- `src/app/watch/[episodeId]/page.tsx`

Endpoints:

- Public watch page: `GET /api/v1/public/episodes/{episodeId}/playback?viewerId=...`
- Creator preview: `GET /api/v1/episodes/{episodeId}/playback?viewerId=...`

Creator dashboard dung `<SignedHlsPlayer creatorMode />`, nen co the preview DRAFT episode/video.

Response FE expects:

```ts
{
  episodeId,
  mediaId,
  mediaType,
  playbackType,
  provider,
  protectionType,
  hlsUrl?,
  playbackUrl?,
  manifestUrl?,
  thumbnailUrl?,
  duration?,
  expiresAt?,
  drm?,
  token?
}
```

FE chon URL theo thu tu:

```ts
manifestUrl || hlsUrl || playbackUrl
```

CloudFront signed HLS:

- `HlsVideoPlayer` trich query params `Policy`, `Signature`, `Key-Pair-Id`, `Expires` tu manifest URL.
- Neu segment/sub-playlist URL khong co signature, FE gan lai query signature cho request HLS con.
- BE nen tra signed manifest URL co du cac query params tren neu dung CloudFront signed URL.

Processing retry:

- Neu error message la `VIDEO_PROCESSING` hoac `VIDEO_NOT_READY`, FE retry playback moi 7s, toi da 12 lan.
- `VIDEO_FAILED` hien loi failed.

## 12. Combo Management trong creator dashboard

Files:

- `src/features/creator-dashboard/components/combo-management.tsx`
- `src/features/creator-dashboard/api/combo.api.ts`

UI:

- List combo cua creator.
- Create/edit combo.
- Select episodes bang cascade: series -> season -> episode.
- Tinh original total price tu selected episodes, creator nhap combo price.
- Status khi save hien hardcode `PUBLISHED`.

Endpoints:

- `GET /api/v1/combos`
- `GET /api/v1/combos/{id}`
- `POST /api/v1/combos`
- `PUT /api/v1/combos/{id}`
- `DELETE /api/v1/combos/{id}`

Payload:

```ts
{
  title,
  description,
  status: "PUBLISHED",
  priceVnd,
  episodeIds: string[]
}
```

Response:

```ts
{
  comboId,
  creatorId,
  title,
  description,
  status,
  priceVnd,
  originalPriceVnd,
  episodes: [{
    episodeId,
    title,
    episodeNumber,
    priceVnd,
    seasonId,
    seasonTitle,
    seriesTitle
  }],
  createdAt,
  updatedAt
}
```

## 13. Admin engagement services va campaign lien quan tuong lai

Hien tai source co:

1. Admin engagement services da co API thuc:
   - Route: `/admin/engagement-services`.
   - Files: `src/features/admin/engagement-services/*`.
   - Endpoint base: `/api/v1/engagement-services`.
   - Search endpoint: `GET /api/v1/engagement-services/search`.
   - CRUD: `GET /{id}`, `POST`, `PUT /{id}`, `DELETE /{id}`.
   - Types:
     - `EngagementType = "BROAD" | "TARGETED"`
     - `EngagementTarget = "VIEW" | "FOLLOW" | "LIKE"`
   - This is admin config for goi day tuong tac.

2. Admin campaigns hien dang mock UI:
   - Route: `/admin/campaigns`.
   - File: `src/features/admin/components/campaign-management-table.tsx`.
   - Data la mockCampaigns local, chua co API.

3. Creator-facing campaign purchase page chua co:
   - Chua co route `/campaign` hay `/creator-dashboard/campaigns` cho creator mua goi.
   - Chua co API FE cho creator order engagement service/campaign.
   - Khi lam tiep, nen tach feature moi, vi du `src/features/campaign` hoac `src/features/creator-campaign`.

Goi y BE/FE contract cho future creator campaign:

- Creator list active services: `GET /api/v1/engagement-services/search?isActive=true...` hoac endpoint public/creator rieng.
- Creator tao campaign/order: `POST /api/v1/creator/campaigns`.
- Fields can co: `creatorId` tu auth, `seriesId?`, `episodeId?`, `engagementServiceId`, `targetValue`, `priceVnd`, payment method/coin, schedule, status.
- Campaign payment/status/history endpoints can tach voi admin banner campaign vi admin `/admin/campaigns` hien la homepage banner management mock.

## 14. Nhung diem BE can xac nhan de FE cau API de dang

1. Creator identity:
   - FE nen lay `creatorId` tu `GET /api/v1/creators/own` hay BE tu suy ra tu auth?
   - `GET /api/v1/series/by-creator` hien FE khong truyen creatorId tren path, BE can lay creator tu cookie/JWT.

2. Response wrapper:
   - v1 creator APIs dung `{ code, message, data }`.
   - Auth APIs dang co cho dung `{ success, message, data, timestamp }`.
   - Can thong nhat de FE unwrap loi nhat quan.

3. Ownership/security:
   - Tat ca series/season/episode/media/upload-session endpoints can validate actor dang dang nhap co quyen tren creator/episode.
   - FE truyen `actorId` trong mot so payload/query, nhung BE khong nen tin actorId public tu client.

4. Categories/tags:
   - Creator create series hien nhap categoryIds/tagIds bang text comma.
   - Can endpoints list active categories/tags de FE lam select UI.

5. Media pipeline:
   - Sau comic/video upload complete, BE can tra MediaResponse ngay voi status ro rang.
   - Can chot status transitions: `HLS_PROCESSING -> HLS_READY -> PENDING -> ACTIVE/INACTIVE/FAILED` hay flow khac.

6. Publish rules:
   - FE chi enable khi media approved/playable, nhung BE van phai enforce publish/schedule rules.

7. Video provider:
   - FE da support AWS va Cloudinary. BE response upload-session phai noi ro `provider`.
   - Neu AWS, confirm `complete.secureUrl` can la S3 key/public URL/HLS manifest URL.
   - Neu Cloudinary, confirm signed params va chunk API contract nhu tren.

8. Playback:
   - Creator preview endpoint `/api/v1/episodes/{episodeId}/playback` can cho owner xem draft.
   - Public endpoint can enforce published/unlocked rules.
   - Neu dung signed HLS, manifest URL can co signing query de FE forward cho segment requests.

9. Analytics/revenue:
   - Creator dashboard UI hien moi co views map tu `series.totalViews`.
   - Chua co revenue dashboard/wallet/payout API cho creator.

## 15. Prompt de dua cho Gemini

Hay dung prompt sau cho Gemini khi can no hieu source FE va de xuat/doi chieu API BE:

```text
Ban la AI technical analyst cho du an TaleX. Hay doc context FE duoi day va tra loi bang tieng Viet ro rang, tap trung vao contract BE-FE, khong doan endpoint neu context da noi ro.

Du an FE:
- Next.js 16.2.9 App Router trong src/app, React 19.2.4, TypeScript strict, Tailwind CSS v4.
- Axios httpClient goi /api/... trong browser, Next rewrite /api/:path* sang NEXT_PUBLIC_API_BASE_URL/api/:path*. withCredentials=true.
- Auth dung HttpOnly cookies accessToken/refreshToken, Zustand auth store, proxy.ts protect routes.
- TanStack Query v5 cache query keys trong creator dashboard.

Route creator:
- /creator-dashboard render CreatorGuard + CreatorDashboard.
- proxy cho phep CREATOR va VIEWER vao /creator-dashboard; VIEWER duoc CreatorGuard xu ly onboarding.
- CreatorGuard goi GET /api/v1/creators/own. Neu 4041 thi hien terms modal va POST /api/v1/creators {termsId}. Neu creator da co nhung terms moi thi POST /api/v1/terms-logs {versionId}.

Creator Dashboard model:
- Series -> Season -> Episode -> Media.
- Query state: view=series|seasons|episodes|create|comic|video|combos, seriesId, seasonId, episodeId.
- Views: list/manage series, seasons, episodes; create series; upload comic pages; upload video episode; combo management.

Creator APIs FE dang goi:
- GET /api/v1/series/by-creator?page=&pageSize=
- POST /api/v1/series
- PUT /api/v1/series/{id}
- DELETE /api/v1/series/{id}
- PATCH /api/v1/series/{id}/hide
- PATCH /api/v1/series/{id}/unhide
- GET /api/v1/series/{seriesId}/seasons
- POST /api/v1/series/{seriesId}/seasons
- PUT /api/v1/seasons/{id}
- DELETE /api/v1/seasons/{id}
- PATCH /api/v1/seasons/{id}/hide
- PATCH /api/v1/seasons/{id}/unhide
- GET /api/v1/seasons/{seasonId}/episodes
- POST /api/v1/seasons/{seasonId}/episodes
- PUT /api/v1/episodes/{id}
- PATCH /api/v1/episodes/{id}/schedule-publish
- PATCH /api/v1/episodes/{id}/cancel-schedule
- PATCH /api/v1/episodes/{id}/publish
- DELETE /api/v1/episodes/{id}
- PATCH /api/v1/episodes/{id}/hide
- PATCH /api/v1/episodes/{id}/unhide
- GET /api/v1/episodes/{episodeId}/media
- POST /api/v1/episodes/{episodeId}/media/comic-pages
- PUT /api/v1/episodes/{episodeId}/media/reorder
- DELETE /api/v1/media/{id}?actorId=...
- POST /api/v1/media/image/presigned-upload
- POST /api/v1/episodes/{episodeId}/media/video/upload-session
- GET /api/v1/media/upload-sessions/{uploadSessionId}
- PATCH /api/v1/media/upload-sessions/{uploadSessionId}/progress
- PATCH /api/v1/media/upload-sessions/{uploadSessionId}/pause?actorId=...
- PATCH /api/v1/media/upload-sessions/{uploadSessionId}/fail
- PATCH /api/v1/media/upload-sessions/{uploadSessionId}/cancel?actorId=...
- POST /api/v1/media/upload-sessions/{uploadSessionId}/complete
- GET /api/v1/sse/pipeline/connect
- GET /api/v1/media/{mediaId}/violations
- GET /api/v1/episodes/{episodeId}/playback?viewerId=... (creator preview)
- GET /api/v1/public/episodes/{episodeId}/playback?viewerId=... (public watch)
- GET/POST/PUT/DELETE /api/v1/combos...

Luong tao/upload:
1. Tao series: upload cover/banner bang presigned S3 truoc, roi POST /api/v1/series voi coverUrl/bannerUrl, contentType COMIC/VIDEO, visibility, ageRating, language, categoryIds, tagIds.
2. Tao season: POST /api/v1/series/{seriesId}/seasons voi seasonNumber/title/description.
3. Tao episode: POST /api/v1/seasons/{seasonId}/episodes voi episodeNumber/title/description/contentType/unlockType/priceVnd.
4. Comic: chon image local, reorder, khi save thi PUT reorder cho saved media, upload local images bang presigned S3, roi POST comic-pages voi pages array.
5. Video: tao upload session, BE tra provider AWS hoac CLOUDINARY. AWS thi PUT file len presigned URL va complete. Cloudinary thi upload chunks 8MB truc tiep Cloudinary, report progress sau moi chunk, complete bang secure_url/public_id. FE co pause/cancel/resume localStorage.
6. Publish/schedule chi enable khi media approved va playable/active, nhung BE van phai enforce.

Hay phan tich:
- BE can dam bao contract nao de FE hien tai chay dung?
- Endpoint nao con thieu/nen doi de creator dashboard on dinh hon?
- Rui ro security/ownership/upload nao can BE enforce?
- Neu lam tiep trang creator mua goi day tuong tac/campaign, nen thiet ke API nao dua tren admin engagement-services hien co?
```
