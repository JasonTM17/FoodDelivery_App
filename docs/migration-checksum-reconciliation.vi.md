# Đối soát checksum migration

**Trạng thái:** đã chuẩn bị đối soát ở source ngày 15/07/2026; rollout production vẫn còn gate.

Tài liệu này ghi lại cách FoodFlow phục hồi checksum của ba Prisma migration đã có sẵn trong Supabase production. Đây không phải migration thay đổi dữ liệu: không sửa row `_prisma_migrations`, không đánh dấu lại migration và không tạo dữ liệu nghiệp vụ.

## Vì sao cần tài liệu này

Prisma lưu SHA-256 của từng migration lúc apply. Migrator sau đó không được im lặng chấp nhận file khác, vì file đã đổi có thể che lỗi schema hoặc security. Ba record production lệch checksum so với checkout hiện tại. Source đã được phục hồi từ immutable build artifact và Git object, sau đó ghi thành các ngoại lệ provenance hẹp, so khớp tuyệt đối.

Không dùng `prisma migrate resolve` để che drift chưa biết. Prisma mô tả lệnh này cho failed migration/baselining, không phải công cụ sửa checksum của migration đã thành công ([Prisma migrate resolve](https://docs.prisma.io/docs/cli/migrate/resolve), [hướng dẫn Prisma của Supabase](https://supabase.com/docs/guides/database/prisma)).

## Ba record production đã xác minh

Các giá trị dưới đây được đọc bằng query read-only qua service `foodflow-api` trên Railway. Record chỉ được xem là effective khi có `finished_at` và `rolled_back_at` là null.

| Migration | Checksum production | Checksum source hiện tại | Bằng chứng phục hồi | Quyết định guard |
| --- | --- | --- | --- | --- |
| `20260709143000_add_realtime_outbox` | `3f9705062cd288d93484e62d3afa98e3e5d9190941a9a1d62af8169eafb325a7` | `40baeeddc6f209a7bbd257ba3acf07dad1be43cd34c7212f0457e945c48751c5` | SQL từ image immutable `foodflow-migrate:sha-1f761a65b4a7053858a512bf6eb09a3fd2adbef0`; nội dung nghiệp vụ khớp, chỉ khác biểu diễn line ending dirty. | Chỉ cho phép đúng cặp production/source này. |
| `20260709150000_add_job_outbox` | `72d4edd8a9a2397e604b38438025670f4b35d8beb7008ff0ae33157df58a7bdf` | `1b85653815a9c7a228bf49eedeaff15efffeda76177988727b4f098a259d4606` | SQL từ cùng image immutable; comment phục hồi về bản gốc, chỉ khác biểu diễn line ending dirty. | Chỉ cho phép đúng cặp production/source này. |
| `20260712143000_add_production_storage_bucket` | `4664ac4299eea854a16316be6a9ed689a3320c1fca2557a4fd00f011368fd8e6` | `a0812428130e34a0204d48b6227a98468105642e6b50dc8713f4a47d709c0d4f` | Blob chính xác từ Git object `c29c069ea180ed6c3107411759b8ceb2150dc8e7`; chỉ khác một blank line cuối file nên giữ source sạch và allow-list đúng cặp. | Chỉ cho phép đúng cặp production/source này. |

Production rows không bị thay đổi. SQL được so sánh trước khi sửa source; blank line cuối của artifact Storage được biểu diễn bằng exception exact-pair thay vì đưa vào source gây cảnh báo lint.

## Contract của guard

`backend/src/migrations/migration-checksum-guard.ts` chạy trước khi migrator chạm Supabase Storage hoặc mutation schema:

1. Đọc `_prisma_migrations`, chỉ giữ record đã finish và chưa rollback.
2. Hash mọi file migration bằng byte LF chuẩn hóa.
3. Chấp nhận checksum source trùng tuyệt đối.
4. Với exception lịch sử, bắt buộc migration name, production checksum và source checksum cùng trùng entry tĩnh trong `migration-checksum-exceptions.ts`.
5. Mọi mismatch khác throw `Applied migration checksum mismatch`.

Guard chỉ bỏ qua khi database chưa có bảng `_prisma_migrations` — trường hợp cần cho database local mới. Thiếu file, file bị đổi, exception lạ hoặc copy checksum sang migration khác đều fail-closed. Danh sách exception chỉ chứa hash/evidence, không chứa credential và không nới RLS/authz.

## Kiểm thử

Chạy từ `backend/` sau `corepack pnpm prisma generate`:

```powershell
corepack pnpm exec jest src/migrations/production-migrate.spec.ts --runInBand
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm build
```

Suite tập trung kiểm tra cặp được duyệt, từ chối production checksum bất ngờ và chứng minh `main()` dừng trước provider. Muốn release vẫn cần full gate backend/web/mobile, CI, provider preflight và evidence role/device đã xác thực.

## Quy tắc rollout production

Railway `foodflow-migrate`, API và worker hiện tại chạy image cũ hơn, nên chưa chứng minh guard này đang live. Chỉ được ghi “production đã được bảo vệ” sau khi build/scan/deploy một immutable image chứa guard cho one-off migrator và xác minh log preflight. Backup trước, chạy migrator một lần, sau đó deploy API/worker cùng SHA immutable nếu migrator thành công.

Giữ quyết định **NO-GO cho chứng nhận đầy đủ** cho tới khi có journey xác thực của Admin, Restaurant, Customer, Driver; Storage/KYC private; token refresh/deny; FCM trên thiết bị kiểm soát; và evidence background location Android/iOS. GIF Chrome local và capture Flutter chỉ mô tả bốn surface, không phải bằng chứng production.
