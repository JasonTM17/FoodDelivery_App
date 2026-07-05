# Chuẩn code FoodFlow

Ngôn ngữ: [English](./code-standards.md) | [Tiếng Việt](./code-standards.vi.md) | [日本語](./code-standards.ja.md)

Các chuẩn này giữ FoodFlow dễ bảo trì trên backend, web, mobile, infra và tài liệu.

## Quy tắc chung

- Ưu tiên KISS, YAGNI, rồi DRY.
- Giữ thay đổi đúng phạm vi đã chấp nhận.
- Dùng tên mô tả rõ; tránh abstraction thông minh nhưng không có domain thật.
- Cân nhắc tách file code trên 200 dòng khi có ranh giới feature/component rõ.
- Không thêm runtime mock data, analytics giả, business value random, hoặc fallback thành công giả.
- Không commit secret, dotenv, private key, local tool state, screenshot test nhanh, hoặc file riêng của AI assistant.
- Commit theo conventional commits, không có AI attribution.
- Copy người dùng nhìn thấy phải nằm trong file localization, không hard-code trong component.

## Vệ sinh repository

- Source code, docs, tests và deploy config thuộc repo.
- Local assistant state nằm ngoài Git và được `.gitignore`.
- Visual asset được duyệt nằm trong app `public/` hoặc `docs/screenshots/`.
- Screenshot Playwright sinh ra, thử nghiệm logo login, map tạm, log và cache phải untracked.
- Cache lớn và backup folder ngoài repo chỉ xóa sau khi xác minh mục đích và có backup.

## Backend: NestJS và Prisma

Layout module điển hình:

```text
feature/
  feature.module.ts
  feature.controller.ts
  feature.service.ts
  dto/
  entities-or-types/
  feature.gateway.ts
```

Quy tắc:

- Validate input ngoài hệ thống ở boundary controller bằng DTO, pipe hoặc schema rõ ràng.
- Đặt authorization gần operation được bảo vệ.
- Dùng Prisma cho query thường; chỉ dùng `$queryRaw` cho PostGIS hoặc query Prisma không diễn đạt an toàn.
- Dùng transaction cho luồng tiền, chuyển trạng thái và invariant nhiều bảng.
- Lỗi web trả RFC 7807 Problem Details.
- Giữ tương thích customer/mobile trừ khi thay đổi được version rõ.
- Không giả lập payment success; thiếu cấu hình provider phải trả lỗi degraded/config rõ.

## Web: Next.js Admin và Restaurant

- Giữ Next.js 14, React 18, ESLint 8 và pnpm 11.7.0 đã pin cho đến khi có migration riêng.
- Route nằm dưới `app/[locale]`; route không locale chỉ redirect tương thích.
- Dùng next-intl cho `vi`, `en`, `ja`.
- Segment route mới cần `loading.tsx`, `error.tsx`, `not-found.tsx`.
- Mỗi server query cần loading, empty, retryable error và permission-denied state.
- Hành động destructive cần confirmation.
- Optimistic update chỉ dùng khi rollback an toàn.
- API access dùng `web/packages/api-client` hoặc wrapper đã duyệt.

## Mobile: Flutter

- Dùng localization generated từ ARB.
- Trong Batch 4, giữ API tương thích với mobile/customer contract.
- Không generate/commit mobile API client mới trước khi OpenAPI Batch 4 ổn định.
- Hòa giải Violet và Indigo trong branch mobile riêng sau khi web/backend ổn định.

## i18n

Backend:

- Locale files nằm trong `backend/src/i18n/locales/{vi|en|ja}`.
- Async job phải nhận locale rõ ràng; không suy từ request context.
- Test cần enforce key parity giữa `vi`, `en`, `ja`.

Web:

- Client Component dùng `useTranslations`.
- Server Component dùng `getTranslations`.
- Sidebar, breadcrumb, login redirect và session-expired redirect phải giữ locale.

Mobile:

- Thêm ARB key vào locale canonical trước, rồi nhân sang `en` và `ja`.
- Chạy generator localization của Flutter sau khi đổi ARB.

## Kiểm thử

Chạy test hẹp nhất trước, rồi mở rộng khi đụng contract hoặc shared behavior.

Gate tối thiểu trước PR Batch 4:

- Backend Prisma validate/generate, typecheck, lint, Jest, contract tests và build.
- Web API client generation/typecheck và OpenAPI validation.
- Admin và Restaurant typecheck, ESLint không warning, Vitest và production build.
- Playwright Chromium và Firefox với seeded data.
- Axe không có serious/critical.
- Secret scan và artifact scan trên diff.

## Tài liệu

- Cập nhật docs khi đổi behavior, setup, architecture, security posture, command hoặc public contract.
- Docs quan trọng cần có English, Vietnamese và Japanese.
- Chỉ document behavior đã xác minh. Nếu feature degraded hoặc pending, nói thẳng.
