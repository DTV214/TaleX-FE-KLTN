# TaleX FE Context - Premium Package Payment via Sepay

> Muc tieu tai lieu: tong hop hien trang source Frontend Web TaleX lien quan den luong mua goi Premium va dinh huong tich hop thanh toan Sepay. Tai lieu nay co the dua cho BE hoac AI Gemini de hieu ro FE dang co gi, chua co gi, can BE cung cap API gi.

## 1. Ket luan nhanh

Hien tai FE da co:

- Trang user `/premium` hien thi danh sach goi Premium.
- API client lay goi Premium tu `GET /api/v1/subscriptions`.
- Admin page `/admin/subscriptions` de quan ly goi Premium: list, filter, paging, tao, sua, xoa.
- Auth/session flow dung HttpOnly cookie, Axios `withCredentials`, auto refresh token khi gap 401.
- Next rewrite de request browser goi `/api/*` tren cung origin va duoc proxy sang backend.
- Nut dieu huong den Premium o header va floating button.

Hien tai FE chua co:

- Chua co Sepay SDK/API client.
- Chua co endpoint FE goi tao giao dich thanh toan goi Premium.
- Chua co modal/page hien QR/chuyen khoan ngan hang.
- Chua co polling/SSE/WebSocket kiem tra trang thai thanh toan.
- Chua co trang thanh cong/that bai/het han cho thanh toan Premium.
- Nut "Chon Goi Nay" trong `/premium` moi `console.log(subscription.subscriptionId)`.
- Chua co type/DTO cho order/payment/invoice/user subscription.

Huong tich hop tiep theo nen lam:

- Tao `src/features/premium/api/premium-payment.api.ts` hoac mo rong `src/features/premium/api/premium.api.ts`.
- Tao hooks React Query mutations/queries cho payment: create payment, get payment status, cancel/expire.
- Tach UI payment thanh component trong `src/features/premium/components/`.
- Giu `src/app/premium/page.tsx` lam route entry, tranh nhan business logic vao `src/app`.

## 2. Cong nghe va cau hinh nen tang

Source FE:

- Framework: Next.js App Router, `next` `^16.2.9`.
- React: `19.2.4`.
- TypeScript strict mode.
- Styling: Tailwind CSS v4, shadcn style config, Radix UI, Lucide icons.
- Data fetching/cache: `@tanstack/react-query` v5.
- HTTP client: Axios.
- Global auth state: Zustand.
- Form/validation admin: React Hook Form + Zod.
- Toast: Sonner.
- Animation: Framer Motion.

Next.js 16 note:

- Theo docs trong `node_modules/next/dist/docs/`, `src/app/**/page.tsx` va `layout.tsx` mac dinh la Server Components.
- File nao can state, event handler, hook client nhu React Query phai co `"use client"`.
- Route Handler dat trong `app/api/**/route.ts`.
- Next 16 goi middleware la `proxy`; project dang dung `src/proxy.ts`.

## 3. Cau truc kien truc lien quan

Project dung huong Feature-Sliced Design:

- `src/app/`: routing, layout, page entry points.
- `src/features/`: business feature, gom `api/`, `hooks/`, `components/`, `types/`.
- `src/shared/`: UI/shared api/utils.
- `src/core/`: config va providers.
- `.ai-docs/`: tai lieu noi bo cho AI/team.

Quan trong cho Sepay:

- Khong nen viet truc tiep logic payment phuc tap trong `src/app/premium/page.tsx`.
- Nen tao feature-level API/hook/component trong `src/features/premium/`.
- Neu can BFF endpoint trong Next de giu secret Sepay, dat trong `src/app/api/internal/.../route.ts`; tuy nhien luong Sepay nen uu tien BE xu ly secret/webhook, FE chi goi BE.

## 4. Cau hinh API va proxy backend

File lien quan:

- `next.config.ts`
- `src/core/config/api.ts`
- `src/shared/api/http-client.ts`
- `.env.local`

Co che hien tai:

- `NEXT_PUBLIC_API_BASE_URL` xac dinh backend base URL.
- `next.config.ts` rewrite:
  - source: `/api/:path*`
  - destination: `${apiBaseUrl}/api/:path*`
- Browser request dung baseURL rong `""`, nen goi `/api/...` tren Next origin; Next rewrite sang BE.
- Server-side request dung `API_BASE_URL` truc tiep.
- `httpClient` bat `withCredentials: true`, phu hop cookie auth.
- `httpClient` co interceptor:
  - Neu API tra 401, tru login/refresh endpoint, FE goi `POST /api/internal/auth/refresh`.
  - Route handler nay doc `refreshToken` cookie va goi BE `/api/auth/refresh-token`.
  - Neu refresh thanh cong, Next set lai HttpOnly cookies `accessToken`, `refreshToken`, roi retry request cu.
  - Neu refresh that bai, xoa cookie va redirect login neu dang o protected page.

Luu y response shape:

- Shared API client dang khai bao `BaseResponse<T> = { code, message, data }`.
- Auth actions/dto lai dung shape `{ success, message, data, timestamp }`.
- Subscription/Premium hien dang expect `code/message/data`.
- Khi BE thiet ke API payment, can thong nhat FE se dung response shape nao. De an toan nen align voi `src/shared/api/http-client.ts` cho cac API Axios feature: `{ code: number, message: string, data: T }`.

## 5. Auth/session hien tai

File lien quan:

- `src/features/auth/api/auth.actions.ts`
- `src/features/auth/api/auth.api.ts`
- `src/features/auth/api/auth.dto.ts`
- `src/features/auth/providers/auth-provider.tsx`
- `src/features/auth/store/auth.store.ts`
- `src/app/api/internal/auth/refresh/route.ts`
- `src/proxy.ts`

Co che:

- Login/register/verify/google/complete-profile la Server Actions, goi BE truc tiep bang `fetch`.
- Sau khi BE tra token, Next set HttpOnly cookies:
  - `accessToken`, maxAge 15 phut.
  - `refreshToken`, maxAge 7 ngay.
  - `sameSite: "lax"`, `path: "/"`.
  - `secure` tuy theo `COOKIE_SECURE`.
- Zustand store chi giu user state de render UI, khong giu token.
- `AuthProvider` khi app load goi `GET /api/auth/me` de lay full profile.
- `src/proxy.ts` bao ve route admin/staff/creator/settings/profile bang cookie va role trong JWT.
- `/premium` hien khong nam trong protected routes, nen user chua login van xem duoc danh sach goi.

He qua cho payment:

- Khi user bam mua goi, FE nen kiem tra `isAuthenticated`.
- Neu chua login, redirect `/login?callbackUrl=/premium` hoac callback den payment intent neu co.
- API tao thanh toan Premium nen yeu cau authenticated user.
- BE nen doc user tu JWT/cookie/Authorization tuy kien truc backend, nhung FE hien gui cookie tu same-origin rewrite.

## 6. Trang user Premium hien tai

File chinh:

- `src/app/premium/page.tsx`
- `src/features/premium/api/premium.api.ts`
- `src/features/premium/components/floating-premium-button.tsx`
- `src/shared/ui/site-header.tsx`
- `src/app/layout.tsx`

`src/app/premium/page.tsx`:

- La Client Component (`"use client"`).
- Dung `useGetPremiumPackages()` de lay goi.
- Render hero "TaleX Premium".
- Render danh sach pricing cards.
- Co skeleton loading, error state, empty state.
- Xac dinh `isPopular` neu tier co chu premium hoac gia cao nhat.
- Format gia theo `vi-VN`.
- Lay benefit tu field BE:
  - `isAdBlocked`
  - `isStoryUnlocked`
  - `isMovieUnlocked`
- Nut `Chon Goi Nay` hien tai goi:
  - `console.log("Tien hanh thanh toan cho goi:", subscription.subscriptionId)`
- Chua co API mutation khi click mua.

`src/features/premium/api/premium.api.ts`:

- `PREMIUM_PACKAGES_ENDPOINT = "/api/v1/subscriptions"`.
- Hook `useGetPremiumPackages()` goi:
  - `GET /api/v1/subscriptions`
  - params:
    - `page: 1`
    - `pageSize: 20`
    - `sortBy: "price"`
    - `sortDirection: "ASC"`
- Query key: `["premium", "packages"]`.
- `staleTime: 60 * 1000`.

Navigation:

- `src/shared/ui/site-header.tsx` co link `/premium` voi icon Crown.
- `src/features/premium/components/floating-premium-button.tsx` hien nut "Nang cap Premium" tren cac route public, click `router.push("/premium")`.
- `src/app/layout.tsx` boc app bang `AppProviders`, `AuthProvider`, `SiteHeader`, `SiteFooter`, `FloatingPremiumButton`.

## 7. Admin quan ly goi Premium hien tai

File chinh:

- `src/app/admin/subscriptions/page.tsx`
- `src/features/admin/subscriptions/api/subscriptions.api.ts`
- `src/features/admin/subscriptions/hooks/use-subscriptions.ts`
- `src/features/admin/subscriptions/types/subscriptions.types.ts`
- `src/features/admin/subscriptions/types/subscriptions.schema.ts`
- `src/features/admin/subscriptions/components/subscriptions-dashboard.tsx`
- `src/features/admin/subscriptions/components/subscriptions-table.tsx`
- `src/features/admin/subscriptions/components/subscription-form-modal.tsx`

Endpoint hien co:

- `GET /api/v1/subscriptions` lay list/paging/filter/sort.
- `GET /api/v1/subscriptions/{subscriptionId}` lay detail.
- `POST /api/v1/subscriptions` tao goi.
- `PUT /api/v1/subscriptions/{subscriptionId}` cap nhat goi.
- `DELETE /api/v1/subscriptions/{subscriptionId}` xoa goi.

Type `Subscription` FE dang dung:

```ts
type Subscription = {
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

Type tao/sua FE dang gui:

```ts
type SubscriptionRequest = {
  tier: string;
  description: string;
  price: number;
  duration: number;
  durationUnit: "Days" | "Months" | "Years";
};
```

Filter list FE co the gui:

- `searchKey`
- `minPrice`, `maxPrice`
- `minDuration`, `maxDuration`
- `durationUnits`
- `minTotalPurchases`, `maxTotalPurchases`
- `isAdBlocked`, `isMovieUnlocked`, `isStoryUnlocked`
- `createdAtFrom`, `createdAtTo`
- `updatedAtFrom`, `updatedAtTo`
- `page`, `pageSize`
- `sortBy`: `price | duration | totalPurchases | createdAt | updatedAt`
- `sortDirection`: `ASC | DESC`

Luu y:

- Form admin chi cho nhap `tier`, `description`, `price`, `duration`, `durationUnit`.
- 3 benefit `isAdBlocked/isMovieUnlocked/isStoryUnlocked` dang duoc hien thi trong table/user page, nhung form admin khong gui cac field nay.
- Modal co `defaultBenefits` chi hien thi la quyen loi mac dinh, switch disabled.
- Neu BE muon admin cau hinh benefit, FE can update schema/form/payload.

## 8. Luong hien tai tu user den goi Premium

1. User vao home/public page.
2. User click link `Premium` tren header hoac floating button.
3. FE dieu huong den `/premium`.
4. `PremiumPage` goi `useGetPremiumPackages()`.
5. Axios browser request `GET /api/v1/subscriptions?...`.
6. Next rewrite request sang backend `${NEXT_PUBLIC_API_BASE_URL}/api/v1/subscriptions`.
7. BE tra danh sach goi theo `BaseResponse<BasePageResponse<Subscription>>`.
8. FE render cards.
9. User click "Chon Goi Nay".
10. Hien tai FE chi log `subscription.subscriptionId`; luong payment dung tai day.

## 9. Luong Sepay nen thiet ke tiep theo

De FE ket noi Sepay qua BE de dang, BE nen cung cap nhom API rieng cho Premium checkout/payment. Ten endpoint co the thay doi theo convention BE, nhung nen dam bao du cac use case sau.

### 9.1 Tao checkout/payment intent

FE event:

- User click "Chon Goi Nay" tren card.
- FE can gui `subscriptionId`.
- Neu chua login: redirect login.
- Neu da login: call create checkout.

De xuat API:

```http
POST /api/v1/premium/payments
Content-Type: application/json
Cookie: accessToken=...

{
  "subscriptionId": "uuid",
  "provider": "SEPAY"
}
```

Response de xuat:

```json
{
  "code": 200,
  "message": "Created premium payment",
  "data": {
    "paymentId": "uuid",
    "subscriptionId": "uuid",
    "amount": 99000,
    "currency": "VND",
    "status": "PENDING",
    "provider": "SEPAY",
    "bankName": "MB Bank",
    "bankAccountNumber": "123456789",
    "bankAccountName": "TALEX ...",
    "transferContent": "TALEX PREMIUM ABC123",
    "qrCodeUrl": "https://...",
    "expiresAt": "2026-07-04T10:30:00Z",
    "createdAt": "2026-07-04T10:15:00Z"
  }
}
```

FE can dung response de hien modal QR/chuyen khoan.

### 9.2 Kiem tra trang thai payment

De xuat API:

```http
GET /api/v1/premium/payments/{paymentId}
```

Response:

```json
{
  "code": 200,
  "message": "Payment detail",
  "data": {
    "paymentId": "uuid",
    "status": "PENDING",
    "paidAt": null,
    "expiresAt": "2026-07-04T10:30:00Z",
    "subscription": {
      "subscriptionId": "uuid",
      "tier": "Premium Thang",
      "duration": 1,
      "durationUnit": "Months"
    }
  }
}
```

Status nen co:

- `PENDING`: dang cho chuyen khoan.
- `PAID`: BE da nhan webhook Sepay/doi soat thanh cong va da kich hoat goi.
- `EXPIRED`: qua han thanh toan.
- `CANCELLED`: user/BE huy.
- `FAILED`: loi xu ly.

FE co the polling moi 3-5 giay khi modal QR dang mo. Neu BE co SSE/WebSocket thi co the nang cap sau.

### 9.3 Lay goi Premium hien tai cua user

De xuat API:

```http
GET /api/v1/premium/me
```

Response:

```json
{
  "code": 200,
  "message": "Current premium subscription",
  "data": {
    "active": true,
    "subscriptionId": "uuid",
    "tier": "Premium Thang",
    "startedAt": "2026-07-04T10:20:00Z",
    "expiresAt": "2026-08-04T10:20:00Z",
    "isAdBlocked": true,
    "isMovieUnlocked": true,
    "isStoryUnlocked": true
  }
}
```

Dung de:

- Doi CTA tu "Chon Goi Nay" sang "Dang su dung" hoac "Gia han".
- Khoa mua trung neu BE khong cho phep.
- Hien thong tin premium trong profile/user service page sau nay.

### 9.4 Lich su giao dich Premium

De xuat API:

```http
GET /api/v1/premium/payments?page=1&pageSize=10
```

Dung cho profile/user service/mobile sau nay.

### 9.5 Huy payment pending

De xuat API:

```http
POST /api/v1/premium/payments/{paymentId}/cancel
```

Dung khi user dong checkout hoac muon tao giao dich moi.

## 10. FE implementation plan de Gemini co the sinh code

Khi BE da co API, Gemini/AI nen sua theo thu tu:

1. Tao type payment:
   - `src/features/premium/types/premium-payment.types.ts`
2. Tao API functions:
   - `createPremiumPayment(subscriptionId)`
   - `getPremiumPayment(paymentId)`
   - `getMyPremiumSubscription()`
   - optional `cancelPremiumPayment(paymentId)`
3. Tao hooks:
   - `useCreatePremiumPayment()`
   - `usePremiumPaymentStatus(paymentId, enabled)`
   - `useMyPremiumSubscription()`
4. Tao UI component:
   - `PremiumCheckoutDialog`
   - Hien QR, amount, bank info, transfer content, countdown expiresAt, status.
5. Sua `src/app/premium/page.tsx`:
   - Lay auth tu `useAuthStore`.
   - Neu chua login, click mua redirect login.
   - Neu da login, goi create payment, mo dialog.
   - Poll status den khi `PAID/EXPIRED/FAILED/CANCELLED`.
   - Khi `PAID`, invalidate `premiumKeys` va query current user premium.
6. Neu can route ket qua:
   - Tao `src/app/premium/success/page.tsx` hoac xu ly trong dialog.

Khong nen:

- Khong dua Sepay secret/API key vao FE.
- Khong goi truc tiep Sepay tu browser neu can secret.
- Khong luu access token vao localStorage.
- Khong viet business logic payment day vao `src/app`.

## 11. Prompt de dua cho Gemini

Copy prompt duoi day cho Gemini khi can no code tiep:

```text
Ban la AI dang ho tro phat trien Frontend Web TaleX. Hay doc va tuan thu kien truc source sau:

- Project dung Next.js 16 App Router, React 19, TypeScript strict, Tailwind CSS v4, TanStack Query v5, Axios, Zustand.
- Theo Next 16 docs, `src/app/**/page.tsx` va `layout.tsx` mac dinh la Server Components; file can hooks/event/state phai co `"use client"`. Project co `src/proxy.ts` thay cho middleware.
- Kien truc theo Feature-Sliced Design: `src/app` chi la routing/page entry; business logic/API/hooks/components phai nam trong `src/features/[feature]/`.
- Shared Axios client nam tai `src/shared/api/http-client.ts`. Browser request dung same-origin `/api/...` va Next rewrite sang backend qua `next.config.ts`. Axios bat `withCredentials: true` va tu refresh token khi gap 401 bang `POST /api/internal/auth/refresh`.
- Auth token nam trong HttpOnly cookies `accessToken`/`refreshToken`, khong dung localStorage. Zustand chi luu user state.

Hien trang Premium:

- User page `/premium` o `src/app/premium/page.tsx` la Client Component.
- Page dung `useGetPremiumPackages()` tu `src/features/premium/api/premium.api.ts`.
- API hien co: `GET /api/v1/subscriptions` voi params `page=1`, `pageSize=20`, `sortBy=price`, `sortDirection=ASC`.
- Response type hien dung: `BaseResponse<BasePageResponse<Subscription>>`.
- `Subscription` co fields: `subscriptionId`, `tier`, `description`, `price`, `duration`, `durationUnit`, `isAdBlocked`, `isMovieUnlocked`, `isStoryUnlocked`, `totalPurchases`, `createdAt`, `updatedAt`.
- Nut "Chon Goi Nay" hien tai moi `console.log(subscription.subscriptionId)`, chua co thanh toan Sepay.
- Header va floating button deu dieu huong den `/premium`.

Admin Premium:

- `/admin/subscriptions` quan ly goi Premium.
- API admin hien co: `GET/POST /api/v1/subscriptions`, `GET/PUT/DELETE /api/v1/subscriptions/{subscriptionId}`.
- Form admin chi gui `tier`, `description`, `price`, `duration`, `durationUnit`; cac benefit boolean hien doc tu BE nhung chua cho sua trong form.

Nhiem vu sap toi:

Hay tich hop luong THANH TOAN GOI PREMIUM QUA SEPAY o FE dua tren API BE. Khong dua Sepay secret vao FE, khong goi Sepay truc tiep tu browser neu can secret. FE chi goi backend TaleX.

Gia su BE se cung cap cac API sau, neu ten endpoint thuc te khac thi tao constants de de sua:

1. `POST /api/v1/premium/payments`
Request:
{
  "subscriptionId": "uuid",
  "provider": "SEPAY"
}
Response data:
{
  "paymentId": "uuid",
  "subscriptionId": "uuid",
  "amount": 99000,
  "currency": "VND",
  "status": "PENDING",
  "provider": "SEPAY",
  "bankName": "...",
  "bankAccountNumber": "...",
  "bankAccountName": "...",
  "transferContent": "...",
  "qrCodeUrl": "...",
  "expiresAt": "ISO datetime",
  "createdAt": "ISO datetime"
}

2. `GET /api/v1/premium/payments/{paymentId}`
Tra ve status: `PENDING | PAID | EXPIRED | CANCELLED | FAILED`.

3. `GET /api/v1/premium/me`
Tra ve goi Premium hien tai cua user.

4. Optional: `POST /api/v1/premium/payments/{paymentId}/cancel`.

Hay code theo huong:

- Tao types trong `src/features/premium/types/`.
- Tao API functions/hook trong `src/features/premium/api/` hoac `src/features/premium/hooks/`.
- Tao component checkout dialog trong `src/features/premium/components/` de hien QR, so tien, ngan hang, noi dung chuyen khoan, countdown het han, status.
- Sua `src/app/premium/page.tsx` de:
  - Neu user chua login thi redirect `/login?callbackUrl=/premium`.
  - Neu da login thi call create payment khi bam "Chon Goi Nay".
  - Mo dialog QR Sepay.
  - Poll status moi 3-5 giay cho den khi `PAID`, `EXPIRED`, `FAILED`, `CANCELLED`.
  - Khi `PAID`, hien thanh cong, invalidate query lien quan va cap nhat UI.
- Dung `httpClient` san co, khong tao axios instance moi neu khong can.
- Dung TanStack Query cho mutation/query, Sonner/toast neu can.
- Giu UI theo style hien co: dark cinematic, vang `#D4AF37`, responsive.
- Khong thay doi cac feature khong lien quan.

Truoc khi code, hay doc cac file:

- `src/app/premium/page.tsx`
- `src/features/premium/api/premium.api.ts`
- `src/features/admin/subscriptions/types/subscriptions.types.ts`
- `src/shared/api/http-client.ts`
- `src/features/auth/store/auth.store.ts`
- `src/core/providers/app-providers.tsx`
- `next.config.ts`
- `src/app/layout.tsx`
```

## 12. Cau hoi can chot voi BE truoc khi FE code Sepay

1. BE se dung response shape nao cho payment: `{ code, message, data }` hay `{ success, message, data, timestamp }`?
2. Endpoint chinh thuc cho Premium checkout la gi?
3. Payment status enum chinh thuc gom nhung gia tri nao?
4. BE co tra `qrCodeUrl` san hay FE phai build QR tu bank/account/content/amount?
5. `transferContent` co bat buoc unique theo `paymentId` khong?
6. Payment pending het han sau bao lau?
7. Khi webhook Sepay thanh cong, BE co tu kich hoat subscription cho user khong?
8. User dang co Premium active thi co duoc mua them/gia han/chong lan goi khong?
9. BE co endpoint `GET /api/v1/premium/me` de FE hien trang thai goi hien tai khong?
10. Mobile se dung chung API payment voi web hay can response bo sung deeplink/app bank?

