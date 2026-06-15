# TaleX Frontend Source Context for Gemini

## 1. Muc dich tai lieu

Tai lieu nay la ban do hien trang cua frontend TaleX, tap trung vao:

- Cau truc source va kien truc ung dung.
- Routing, layout, auth, state, API va giao dien.
- Cong nghe, cau hinh va quy trinh setup/deploy.
- Luong `Admin Terms Dashboard` tai `/admin/terms`.
- Cac gioi han, phan mock va diem ky thuat can luu y khi AI sua code.

Day la mo ta cua code dang ton tai, khong phai mo ta kien truc ly tuong.

## 2. Tong quan san pham

TaleX la nen tang noi dung video truyen tranh, comic va animation ngan cho bon nhom:

- Viewer: xem noi dung, quan ly ho so va tai khoan.
- Creator: quan ly series, season, episode, media va upload video.
- Staff: kiem duyet noi dung, xu ly report va don Creator.
- Admin: quan ly he thong, user, noi dung, tai chinh, campaign, analytics,
  settings va terms.

Frontend ket noi den backend Spring Boot qua REST API.

## 3. Technology stack

- Next.js `16.2.6`, App Router, Turbopack.
- React `19.2.4`, React DOM `19.2.4`.
- TypeScript 5, `strict: true`, alias `@/* -> ./src/*`.
- Tailwind CSS 4 qua `@tailwindcss/postcss`.
- Shadcn configuration theo style `radix-nova`, Radix UI.
- TanStack React Query 5 cho server state va mutation.
- Axios cho REST client.
- Zustand 5 cho auth state toan cuc.
- Framer Motion cho animation.
- Embla Carousel cho slider/carousel.
- HLS.js cho video HLS.
- Lucide React cho icon.
- ESLint 9 voi Next.js Core Web Vitals va TypeScript rules.
- npm va `package-lock.json`.
- GitHub Actions + SSH + PM2 de deploy VPS.

## 4. Setup va environment

Lenh:

```bash
npm install
npm run dev
npm run lint
npm run build
npm run start
```

Bien moi truong dang duoc code su dung:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
NEXT_PUBLIC_GOOGLE_CLIENT_ID=
NEXT_PUBLIC_CREATOR_ID=1
NEXT_PUBLIC_ACTOR_ID=1
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=
NEXT_PUBLIC_CLOUDINARY_FOLDER=
NEXT_PUBLIC_CLOUDINARY_HLS_STREAMING_PROFILE=sp_auto
COOKIE_SECURE=false
```

Luu y:

- CI hien tai chi tao `NEXT_PUBLIC_API_BASE_URL` va
  `NEXT_PUBLIC_GOOGLE_CLIENT_ID`.
- Cac bien `NEXT_PUBLIC_*` se nam trong client bundle.
- `COOKIE_SECURE=true` can dung khi chay HTTPS production.
- `next.config.ts` hien chua co custom config.

## 5. Kien truc source

Du an huong den Feature-Sliced Design:

```text
src/
|-- app/       Next.js routes, pages, layouts, route handlers
|-- features/  Nghiep vu theo feature
|-- shared/    HTTP client, reusable UI va utilities
|-- core/      App provider va config toan cuc
`-- middleware.ts
```

Quy uoc noi bo mong muon `src/app` chi lam routing, business logic nam trong
`features/<feature>/{components,hooks,api}` va feature co `index.ts`.

Hien trang chua hoan toan dung quy uoc:

- Chua co feature nao co `index.ts`.
- App va feature dang import truc tiep vao file sau ben trong feature.
- Nhieu page Admin/Staff chua tach het UI ra feature.
- `creator-dashboard.tsx` dang qua lon, khoang 3,827 dong.

## 6. Routing va layout

### Public/user routes

- `/`: trang chu gom hero, continue watching, categories, ranking va media rows.
- `/intro`: landing gioi thieu san pham.
- `/watch/[episodeId]`: lay dynamic `episodeId`, render signed HLS player.
- `/profile`: xem/sua profile va doi mat khau.
- `/creator-dashboard`: dashboard quan ly noi dung Creator.

### Auth route group

Folder `(auth)` khong xuat hien trong URL:

- `/login`
- `/register`
- `/forgot-password`
- `/complete-profile`

`src/app/(auth)/layout.tsx` tao giao dien auth rieng, nhung van nam trong root
layout.

### Admin routes

- `/admin/dashboard`
- `/admin/videos`
- `/admin/comics`
- `/admin/users`
- `/admin/analytics`
- `/admin/financials`
- `/admin/campaigns`
- `/admin/terms`
- `/admin/settings`

`src/app/admin/layout.tsx` boc cac route bang Admin Sidebar, Admin Topbar va
main content.

### Staff routes

- `/staff/dashboard`
- `/staff/moderation`
- `/staff/reports`
- `/staff/applications`

### Internal Next.js API

- `POST /api/internal/auth/refresh`: doc refresh token tu HttpOnly cookie, goi
  backend `/api/auth/refresh-token`, sau do rotate access/refresh cookies.

### Layout hierarchy

Moi route deu nam trong `src/app/layout.tsx`:

```text
RootLayout
`-- AppProviders (React Query)
    `-- AuthProvider (Zustand + /api/auth/me bootstrap)
        |-- SiteHeader
        |-- route content / nested layout
        |-- SiteFooter
        `-- BackToTop
```

Header/Footer tu an bang `usePathname()` tren auth, Creator dashboard, Admin va
Staff. `BackToTop` van duoc mount tren moi route.

## 7. Auth va request flow

### Login/session

1. Form goi Server Action trong `auth.actions.ts`.
2. Server Action goi Spring Boot auth endpoint.
3. Access token va refresh token duoc luu vao HttpOnly cookies.
4. Zustand nhan `PartialUser` gom `accountId` va `roleName`.
5. `AuthProvider` goi `GET /api/auth/me` de lay `UserProfile` day du.
6. UI doc Zustand de hien avatar/profile va trang thai login.

### Route protection

`src/middleware.ts`:

- Redirect user da co token khoi auth routes.
- Yeu cau token cho `/admin`, `/staff`, `/settings`, `/profile`.
- Decode payload access JWT de kiem tra role.
- `/admin/*` chi cho role `ADMIN`.
- `/staff/*` cho `STAFF` hoac `ADMIN`.

Quan trong:

- Next.js 16 da doi convention `middleware.ts` thanh `proxy.ts`.
- Build van chay nhung can migrate de bo deprecation.
- Middleware chi decode JWT, khong verify chu ky; no chi nen la optimistic
  routing check. Backend van phai enforce quyen cho moi Admin API.
- Neu chi con refresh token ma khong co access token, middleware cho route
  protected di qua nhung khong thuc hien role check.

### Axios refresh flow

`httpClient` co:

- `baseURL = NEXT_PUBLIC_API_BASE_URL` hoac `http://localhost:8080`.
- `withCredentials: true`.
- Response interceptor bat `401`.
- Chi mot refresh request duoc chay; cac request 401 khac vao queue.
- Refresh qua same-origin `POST /api/internal/auth/refresh`.
- Sau refresh, retry request cu.
- Refresh fail thi clear queue va redirect protected page ve `/login`.

## 8. State va data fetching

- React Query provider co `retry: 1`, `staleTime: 30 giay`.
- Zustand chi duoc dung ro rang cho auth state.
- React Query duoc dung cho Terms, Creator Dashboard va playback.
- Nhieu Home/Admin/Staff component hien dang dung hard-coded/mock arrays.
- Local component state quan ly modal, form, tab, filter va mock interaction.
- `localStorage` duoc dung cho video progress va resumable upload session.

## 9. Giao dien va design system

### Public site

- Dark cinematic theme.
- CSS variables: black background, gold primary, brown-red secondary,
  light-blue accent.
- Font thuc te: Montserrat cho heading va DM Sans cho body.
- Nhieu animation bang Framer Motion.
- Hero, carousel, media cards va external Unsplash placeholder images.

### Admin

- Light dashboard theme: background `#F8F9FA`, white cards.
- Mau nhan cyan, purple, teal, green va red.
- Sidebar rong 260px, sticky full height.
- Topbar sticky, co global search, notification/help va mock avatar.
- Dashboard Analytics, Financials, Settings va cac management table chu yeu la
  UI prototype/mock.

### Terms

- Light management table.
- Header, search theo version, type filter, status filter.
- Loading/error/empty states.
- Pagination Previous/Next.
- Create/Edit modal.
- Form gom version, type, active toggle va content textarea.
- Delete dung native `window.confirm`.

Bat nhat UI guideline:

- `.ai-docs/ui-ux-guidelines.md` noi font mac dinh la Inter.
- Root layout dang dung DM Sans + Montserrat.
- Public theme la dark cinematic, Admin Terms la light dashboard; day co ve la
  chu dich theo khu vuc, nhung AI khong nen tu dong ep Terms sang dark mode.

## 10. API inventory

### Auth

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

### Creator content

- Series CRUD va list by Creator.
- Season CRUD va list by Series.
- Episode CRUD va list by Season.
- Episode media create/list/reorder.
- Comic page batch create.
- Media update URL/update/delete.
- Resumable video upload session create/get/progress/pause/fail/cancel/complete.
- Cloudinary unsigned upload.

### Playback

- `GET /api/v1/public/episodes/{episodeId}/playback`

### Admin Terms

Base URL: `/api/v1/terms-versions`

- `GET /api/v1/terms-versions`
- `GET /api/v1/terms-versions/{id}`
- `POST /api/v1/terms-versions`
- `PUT /api/v1/terms-versions/{id}`
- `DELETE /api/v1/terms-versions/{id}`

## 11. Source file inventory

### Root/config/docs

- `AGENTS.md`: bat buoc doc Next.js 16 docs trong `node_modules` truoc khi sua.
- `CLAUDE.md`: hien gan nhu rong.
- `README.md`: gioi thieu, stack, FSD convention va setup.
- `.ai-docs/project-context.md`: domain va user roles.
- `.ai-docs/frontend-rules.md`: FSD, TypeScript, Tailwind, Query, Zustand.
- `.ai-docs/ui-ux-guidelines.md`: typography va cinematic/glass design.
- `.github/workflows/deploy.yml`: pull, tao env, install, build, restart PM2.
- `package.json`, `package-lock.json`: dependency va scripts.
- `tsconfig.json`: strict TypeScript, bundler resolution, alias `@`.
- `next.config.ts`: empty Next config.
- `eslint.config.mjs`: Next Core Web Vitals + TypeScript.
- `postcss.config.mjs`: Tailwind 4 PostCSS plugin.
- `components.json`: Shadcn aliases va style.
- `public/*.svg`, `public/icons/google.svg`, `favicon.ico`: static assets.

### Core/shared

- `src/core/config/api.ts`: backend, Creator va Cloudinary env config.
- `src/core/config/site.ts`: site name, navigation va social links.
- `src/core/providers/app-providers.tsx`: React Query provider.
- `src/shared/api/http-client.ts`: Axios, response types, refresh interceptor.
- `src/shared/utils/utils.ts`: `cn()` bang `clsx` + `tailwind-merge`.
- `src/shared/ui/button.tsx`: Shadcn-style reusable button.
- `src/shared/ui/site-header.tsx`: public navigation va auth dropdown.
- `src/shared/ui/site-footer.tsx`: public footer.
- `src/shared/ui/back-to-top.tsx`: floating scroll-to-top.
- `src/middleware.ts`: auth/RBAC redirect logic; deprecated convention.

### App routes

- `src/app/layout.tsx`: root metadata, fonts, providers va global shell.
- `src/app/globals.css`: Tailwind 4 theme va `.glass-panel`.
- `src/app/page.tsx`: compose Home sections.
- `src/app/intro/page.tsx`: compose Intro sections.
- `src/app/watch/[episodeId]/page.tsx`: dynamic playback page.
- `src/app/profile/page.tsx`: profile/update/password page.
- `src/app/creator-dashboard/page.tsx`: Creator feature entry.
- `src/app/(auth)/layout.tsx`: auth visual shell.
- `src/app/(auth)/*/page.tsx`: login/register/forgot/complete entries.
- `src/app/api/internal/auth/refresh/route.ts`: refresh-token BFF route.
- `src/app/admin/layout.tsx`: Admin shell.
- `src/app/admin/*/page.tsx`: Admin route entries.
- `src/app/staff/layout.tsx`: Staff shell.
- `src/app/staff/*/page.tsx`: Staff route entries.

### Auth feature

- `api/auth.dto.ts`: auth request/response/profile types.
- `api/auth.actions.ts`: server-side auth actions va cookie handling.
- `api/auth.api.ts`: authenticated profile/password Axios calls.
- `store/auth.store.ts`: Zustand auth state.
- `providers/auth-provider.tsx`: bootstrap/refresh full profile.
- `components/login-form.tsx`: password va Google login UI.
- `components/register-form.tsx`: registration va OTP flow.
- `components/forgot-password-container.tsx`: switch request/reset steps.
- `components/forgot-password-form.tsx`: request password reset.
- `components/reset-password-form.tsx`: OTP + new password.
- `components/complete-profile-form.tsx`: social-login profile completion.
- `components/profile-view.tsx`: account summary/logout.
- `components/update-profile-form.tsx`: edit profile.
- `components/change-password-form.tsx`: password mutation.

### Home/Intro

- Home: `main-hero-banner`, `continue-watching`, `interest-categories`,
  `top-10-today`, `featured-promo`, `editorial-spotlight`,
  `destiny-categories`, reusable `media-row` va cac row theo genre/release.
- Intro: `hero-banner`, `narrative-section`, `featured-series`,
  `trending-comics`, `explore-chambers`, `count-number`,
  `creator-highlight`, `final-cta`.
- Phan lon data tai day la static demo data va external image URL.

### Creator/Playback

- `creator-content-api.ts`: types va REST calls cho content hierarchy.
- `video-upload-api.ts`: resumable upload session API.
- `cloudinary-api.ts`: direct Cloudinary upload.
- `use-resumable-video-upload.ts`: chunk upload, retry, pause/resume va storage.
- `resumable-video-uploader.tsx`: uploader UI.
- `creator-dashboard.tsx`: tat ca Creator views/forms/queries hien tai.
- `playback-api.ts`: signed playback metadata.
- `signed-hls-player.tsx`: React Query wrapper va signed URL renewal.
- `hls-video-player.tsx`: custom HLS player, controls va watch progress.

### Admin/Staff

- Admin shell: `admin-sidebar.tsx`, `admin-topbar.tsx`.
- Admin mock tables: user, comic, video, campaign, payout.
- Admin Terms la module Admin duy nhat trong nhom nay co API + hooks + types
  tach rieng va CRUD backend that.
- Staff shell: `staff-sidebar.tsx`, `staff-topbar.tsx`.
- Staff mock tables: moderation, reports va Creator applications.

## 12. Admin Terms: file map

### Route

`src/app/admin/terms/page.tsx`

- Server Component mac dinh.
- Khai bao metadata.
- Chi render `TermsManagementTable`.
- Dung dung vai tro thin route entry.

### Types

`src/features/admin/terms/types/terms.types.ts`

- `TermsType = "CREATOR" | "GENERAL_TOS"`.
- `TermsVersion`.
- `CreateTermsPayload`.
- `UpdateTermsPayload`.
- `TermsFilterParams`.
- Dinh nghia lai `ApiResponse` va `PaginatedData`.

### API

`src/features/admin/terms/api/terms.api.ts`

- Dung shared `httpClient`.
- Tra ve full backend envelope `ApiResponse<T>`.
- List co pagination/filter.
- Detail, create, update va soft delete.

### React Query hooks

`src/features/admin/terms/hooks/useTermsQueries.ts`

- Query key factory `termsKeys`.
- List query dung `keepPreviousData`.
- Detail query chi enabled khi co ID.
- Create/update/delete invalidate list.
- Update invalidate them detail cache.

### List UI

`src/features/admin/terms/components/terms-management-table.tsx`

- Client Component.
- Quan ly filters, debounce search 500ms, modal state va edit ID.
- Search hien chi map vao `version`.
- Type filter gui mot phan tu trong `types`.
- Status filter gui boolean hoac undefined.
- Date format theo `vi-VN`.
- Delete mutation chay sau native confirm.
- More action button chua co handler.

### Form modal

`src/features/admin/terms/components/terms-form-modal.tsx`

- Client Component.
- Create mode dung empty initial state.
- Edit mode fetch detail theo ID.
- Dung `key` de reset local form khi detail thay doi.
- Validate version/content khong rong.
- Type bi disable khi edit.
- Gui full create-shaped payload khi update.
- Hien backend mutation error trong modal.

## 13. Admin Terms runtime flow

### Load list

```text
/admin/terms
-> middleware/proxy token + ADMIN check
-> RootLayout providers
-> AdminLayout
-> AdminTermsPage
-> TermsManagementTable
-> useTermsVersions(filters)
-> termsApi.getTermsVersions(filters)
-> Axios httpClient
-> Spring Boot GET /api/v1/terms-versions
-> response.data.content render table
```

### Filter/pagination

```text
search/type/status/page state changes
-> query key changes
-> React Query fetches new list
-> keepPreviousData keeps old rows while fetching
-> loading overlay appears
```

### Create

```text
Add New Version
-> modal create mode
-> validate
-> POST /api/v1/terms-versions
-> invalidate ["terms", "list"]
-> list refetch
-> close modal
```

### Edit

```text
Edit row
-> set editId and open modal
-> GET /api/v1/terms-versions/{id}
-> hydrate form
-> PUT /api/v1/terms-versions/{id}
-> invalidate list + detail
-> close modal
```

### Delete

```text
Delete row
-> window.confirm
-> DELETE /api/v1/terms-versions/{id}
-> backend soft delete/isActive=false
-> invalidate list
```

## 14. Terms API contract

Envelope:

```ts
type ApiResponse<T> = {
  code: number;
  message: string;
  data: T;
};
```

Entity:

```ts
type TermsVersion = {
  id: string;
  version: string;
  type: "CREATOR" | "GENERAL_TOS";
  content: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string | null;
};
```

List filters:

```ts
type TermsFilterParams = {
  page?: number;        // UI dang dung one-based page
  pageSize?: number;
  version?: string;
  content?: string;
  isActive?: boolean;
  types?: TermsType[];
  createdAtFrom?: string;
  createdAtTo?: string;
  updatedAtFrom?: string;
  updatedAtTo?: string;
  sortBy?: "version" | "type" | "createdAt" | "updatedAt";
  sortDirection?: "ASC" | "DESC";
};
```

Can xac nhan voi backend:

- `page` la one-based hay zero-based.
- Axios serialize `types[]` dung format backend mong doi hay khong.
- Quy tac unique cho `(type, version)`.
- Khi active mot version, backend co tu deactivate version active cu cung type.
- DELETE tra `data: null` va status nao.
- `content` la plain text, Markdown hay HTML.

## 15. Diem can uu tien khi tiep tuc Terms

1. Migrate `src/middleware.ts` sang `src/proxy.ts`, export `proxy`.
2. Xac nhan va test pagination index/array query serialization voi backend.
3. Them error handling/toast cho delete; hien tai `mutateAsync` co the tao
   unhandled rejection.
4. Thay `window.confirm` bang accessible confirmation dialog.
5. Bo hoac trien khai nut More.
6. Them sort control, date filters va content search neu product yeu cau.
7. Them preview Markdown/HTML co sanitize truoc khi render.
8. Them validation schema cho version/content va backend error mapping.
9. Dung shared `BaseResponse`/`BasePageResponse` thay vi duplicate types.
10. Them `index.ts` public API neu team muon enforce FSD guideline.
11. Them loading/error boundary tai route hoac feature.
12. Them test cho query keys, filter mapping, create/edit/delete va active rule.
13. Hien thong tin `updatedAt`, content preview hoac audit metadata neu BE co.
14. Lam Admin topbar/sidebar lay user that va logout that.

## 16. Known issues va technical debt

- Next.js 16 deprecates `middleware.ts`; build canh bao migrate sang `proxy.ts`.
- Build production hien pass.
- ESLint hien co 0 error, 21 warning, chu yeu `<img>` va unused variables.
- Khong co test framework hoac test files.
- Khong co `loading.tsx`, `error.tsx`, `not-found.tsx` custom.
- Nhieu route link trong public nav/footer chua co page tuong ung.
- `/admin` khong co `page.tsx`; truy cap truc tiep co the 404 thay vi redirect.
- Admin/Staff mock buttons chua co nghiep vu that.
- Creator dashboard la monolith rat lon.
- Internal guideline yeu cau feature `index.ts`, code hien tai khong co.
- Font guideline va font runtime khong dong nhat.
- External images dang dung raw `<img>`/CSS URL va khong co image config.
- Auth authorization can duoc enforce lai tai backend/DAL gan data source.

## 17. Prompt de dua cho Gemini

```text
Ban dang lam viec tren frontend TaleX tai repository hien tai.

Truoc khi sua code:
1. Doc AGENTS.md.
2. Day la Next.js 16.2.6, khong duoc dua vao kien thuc Next.js cu. Phai doc
   guide lien quan trong node_modules/next/dist/docs/ truoc khi thay doi API,
   routing, layout, proxy, Server/Client Component hoac data fetching.
3. Doc .ai-docs/project-context.md, .ai-docs/frontend-rules.md,
   .ai-docs/ui-ux-guidelines.md va
   .ai-docs/gemini-source-context-admin-terms.md.
4. Kiem tra code thuc te truoc khi dua ra ket luan. Khong coi mock data la API
   that va khong tu tao endpoint khong ton tai.

BOI CANH:
- Stack: Next.js 16.2.6 App Router, React 19.2.4, TypeScript strict,
  Tailwind CSS 4, React Query 5, Axios, Zustand, Lucide, Shadcn/Radix.
- Backend la Spring Boot tai NEXT_PUBLIC_API_BASE_URL.
- Auth dung HttpOnly access/refresh cookies, Server Actions, Zustand profile
  state, Axios 401 interceptor va internal refresh Route Handler.
- Admin duoc bao ve theo role ADMIN trong src/middleware.ts. Next.js 16 da
  deprecate middleware convention va nen migrate sang proxy.ts khi phu hop.
- Public site la dark cinematic; Admin la light dashboard. Khong tu doi design
  language cua Admin Terms neu khong duoc yeu cau.
- src/app chi nen la route entry/layout. Nghiep vu dat trong src/features.

MUC TIEU SAP TOI:
Tap trung phat trien Admin Terms Dashboard tai /admin/terms.

CAC FILE CHINH:
- src/app/admin/terms/page.tsx
- src/app/admin/layout.tsx
- src/features/admin/components/admin-sidebar.tsx
- src/features/admin/components/admin-topbar.tsx
- src/features/admin/terms/types/terms.types.ts
- src/features/admin/terms/api/terms.api.ts
- src/features/admin/terms/hooks/useTermsQueries.ts
- src/features/admin/terms/components/terms-management-table.tsx
- src/features/admin/terms/components/terms-form-modal.tsx
- src/shared/api/http-client.ts
- src/core/providers/app-providers.tsx
- src/middleware.ts

TERMS API HIEN CO:
- GET /api/v1/terms-versions
- GET /api/v1/terms-versions/{id}
- POST /api/v1/terms-versions
- PUT /api/v1/terms-versions/{id}
- DELETE /api/v1/terms-versions/{id}

TermsType chi co CREATOR va GENERAL_TOS.
List ho tro page, pageSize, version, content, isActive, types, date ranges,
sortBy va sortDirection. Response duoc boc trong { code, message, data }.

LUONG HIEN TAI:
- TermsManagementTable giu filter va modal state.
- Search version debounce 500 ms.
- React Query key thay doi de refetch list, keepPreviousData giu table cu.
- Create/update/delete invalidate list cache.
- Edit fetch detail theo ID.
- Delete hien dung window.confirm.
- More button chua co logic.

NGUYEN TAC KHI SUA:
- Giu thay doi dung pham vi yeu cau, khong refactor cac feature khong lien quan.
- Khong dat API call/business logic moi trong src/app.
- Dung shared httpClient de giu withCredentials va refresh-token behavior.
- Dung React Query cho Terms server state; local UI state dung React hooks.
- Bao toan backend response contract va query parameter names.
- Moi mutation Admin phai gia dinh backend can enforce ADMIN role.
- Neu render HTML/Markdown, phai co chien luoc sanitize chong XSS.
- Khong them dependency neu co the giai quyet bang stack hien tai.
- UI phai responsive, accessible, co loading/error/empty/disabled states.
- Khong xoa hoac ghi de thay doi cua nguoi khac.
- Sau khi sua, chay npm run lint va npm run build; bao cao warning con lai.

TRUOC KHI IMPLEMENT:
- Neu lien quan pagination, xac nhan page one-based/zero-based tu code/backend.
- Neu lien quan types filter, xac nhan format query array backend chap nhan.
- Neu lien quan active version, xac nhan backend co tu deactivate version cu.
- Neu yeu cau chua ro nhung co the suy ra an toan tu source, hay tu phan tich
  va thuc hien. Chi hoi lai khi co nguy co lam sai contract hoac mat du lieu.

KHI TRA LOI:
1. Tom tat code hien tai lien quan.
2. Neu ro file se sua va ly do.
3. Thuc hien thay doi day du.
4. Chay kiem tra.
5. Bao cao ket qua, rui ro va assumption con lai ngan gon.
```

## 18. Verification snapshot

Tai thoi diem tong hop:

- `npm run lint`: pass voi 0 error, 21 warning.
- `npm run build`: pass.
- Next.js build tao 25 route/page entries.
- Build canh bao `middleware` convention da deprecated va nen dung `proxy`.
