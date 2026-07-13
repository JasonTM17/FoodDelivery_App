# Tổng quan dự án và yêu cầu sản phẩm FoodFlow

Ngôn ngữ: [English](./project-overview-pdr.md) | [Tiếng Việt](./project-overview-pdr.vi.md) | [日本語](./project-overview-pdr.ja.md)

## Mục tiêu

FoodFlow hỗ trợ khách đặt món, nhà hàng vận hành đơn/menu, tài xế hoàn thành đơn được phân công và quản trị viên vận hành marketplace. Hệ thống multi-tenant: nhân viên nhà hàng, event realtime, theo dõi đơn, export và thao tác quản trị luôn phải bị giới hạn theo actor được cấp quyền.

## Bề mặt sản phẩm

| Bề mặt | Người dùng chính | Trách nhiệm |
|---|---|---|
| NestJS API và worker | Toàn bộ client; vận hành | Auth, RBAC, tenant check, job bền vững, tích hợp, audit |
| Admin dashboard | Vận hành marketplace | KPI, support, review, audit, tài xế, user, nhà hàng |
| Restaurant dashboard | Nhân viên nhà hàng | Đơn, menu, staff, promotion, revenue, review, giờ mở cửa |
| Customer app | Khách hàng | Duyệt món, giỏ hàng, thanh toán, theo dõi đơn, hỗ trợ |
| Driver app | Tài xế | Onboarding/KYC, trạng thái GPS, dispatch, giao hàng, thu nhập |

Production managed dùng Supabase cho PostgreSQL/PostGIS, Realtime, Storage; Railway cho API, worker, migrator, Redis; Vercel chỉ cho Admin và Restaurant. Docker Compose là topology riêng cho local/self-hosted.

## Yêu cầu cốt lõi

- Order, payment, dispatch, notification, export và audit dùng dữ liệu thật đã lưu; provider thiếu/lỗi phải trả trạng thái rõ ràng, không giả thành công.
- API kiểm tra identity, role và tenant/ownership tại operation được bảo vệ; realtime claim ngắn hạn và private.
- Trạng thái tài xế dựa trên GPS. UI chỉ chuyển pause/offline sau khi lệnh availability chuẩn thành công; logout phải hủy subscription để session cũ không cập nhật session mới.
- Notification là durable job. FCM dùng Firebase Admin SDK/HTTP v1 với `FCM_PROJECT_ID` và ADC/workload identity hoặc `FCM_SERVICE_ACCOUNT_JSON` trong secret manager; lỗi request được retry, token invalid vĩnh viễn bị stale.
- Admin/Restaurant responsive, điều hướng bằng bàn phím, có skip link, focus rõ, giảm motion và giữ locale.
- Copy hiển thị cho người dùng có `vi`, `en`, `ja`.

## Tiêu chí chấp nhận đợt hardening

1. Backend không còn dùng FCM server key cũ; có test cho provider lỗi và token invalid.
2. Login/logout, availability, dispatch và realtime của Driver không để async cũ thay đổi session mới hoặc báo offline sai khi request thất bại.
3. Sidebar/drawer Restaurant responsive, accessible, giữ locale/focus/motion preference.
4. Docs mô tả đúng Railway/Supabase/Vercel, FCM, phạm vi test, blocker release và thứ tự deploy; không gọi kiểm tra chưa đủ là production approval.

## Ranh giới release

Repo không thể tự deploy hay xác thực secret bên ngoài. Trước release phải có secret đã rotate, full gate ở final head, remote CI mới, FCM gửi thật với token kiểm soát và browser smoke đã xác thực trên deployment hiện tại.
