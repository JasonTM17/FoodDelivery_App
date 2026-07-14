# Tổng quan dự án và yêu cầu sản phẩm FoodFlow

Ngôn ngữ: [English](./project-overview-pdr.md) | [Tiếng Việt](./project-overview-pdr.vi.md) | [日本語](./project-overview-pdr.ja.md)

## Mục tiêu

FoodFlow hỗ trợ khách đặt món, nhà hàng vận hành đơn/menu, tài xế hoàn thành đơn được phân công và quản trị viên vận hành marketplace. Hệ thống multi-tenant: nhân viên nhà hàng, event realtime, theo dõi đơn, export và thao tác quản trị luôn phải bị giới hạn theo actor được cấp quyền.

## Bề mặt sản phẩm

| Bề mặt | Người dùng chính | Trách nhiệm | Runtime / entrypoint |
|---|---|---|---|
| NestJS API và worker | Toàn bộ client; vận hành | Auth, RBAC, tenant check, job bền vững, tích hợp, audit | NestJS 11; Railway đã provision topology nhưng API/worker chưa deploy |
| Admin dashboard | Vận hành marketplace | KPI, support, review, audit, tài xế, user, nhà hàng | Next.js 15 web |
| Restaurant dashboard | Nhân viên nhà hàng | Đơn, menu, staff, promotion, revenue, review, giờ mở cửa | Next.js 15 web |
| Customer app | Khách hàng | Duyệt món, giỏ hàng, thanh toán, theo dõi đơn, hỗ trợ | Flutter/Riverpod native; [`main_customer.dart`](../mobile/lib/main_customer.dart) |
| Driver app | Tài xế | Onboarding/KYC, trạng thái GPS, dispatch, giao hàng, thu nhập | Flutter/Riverpod native; [`main_driver.dart`](../mobile/lib/main_driver.dart) |

Production managed dùng Supabase cho PostgreSQL/PostGIS, Realtime, Storage; Railway cho API, worker, migrator, Redis; Vercel chỉ cho Admin và Restaurant. Docker Compose là topology riêng cho local/self-hosted.

## Yêu cầu cốt lõi

- Order, payment, dispatch, notification, export và audit dùng dữ liệu thật đã lưu; provider thiếu/lỗi phải trả trạng thái rõ ràng, không giả thành công.
- API kiểm tra identity, role và tenant/ownership tại operation được bảo vệ; realtime claim ngắn hạn và private.
- Trạng thái tài xế dựa trên GPS. UI chỉ chuyển pause/offline sau khi lệnh availability chuẩn thành công; logout phải hủy subscription để session cũ không cập nhật session mới.
- Notification là durable job. FCM dùng Firebase Admin SDK/HTTP v1 với `FCM_PROJECT_ID` và ADC/workload identity hoặc `FCM_SERVICE_ACCOUNT_JSON` trong secret manager; lỗi request được retry, token invalid vĩnh viễn bị stale. Mobile chỉ đăng ký FCM token sau session đã xác thực, API validate contract `POST /notifications/fcm-token`, cập nhật token xoay vòng và lưu ý định cleanup trước khi gỡ có giới hạn lúc logout. UUID client, PostgreSQL advisory lock theo token và tombstone bảy ngày bảo đảm cleanup thắng POST đăng ký đến muộn. Backend có payload notification cho app nền, Android channel và âm thanh APNs; client hiển thị message khi foreground và tap chỉ cho deep link nội bộ, kể cả lúc app khởi động lại từ terminated. Inbox Driver đang mở nhận realtime đã xác thực và khử trùng lặp theo ID thông báo.
- Admin/Restaurant responsive, điều hướng bằng bàn phím, có skip link, focus rõ, giảm motion và giữ locale.
- Copy hiển thị cho người dùng có `vi`, `en`, `ja`.

## Yêu cầu phi chức năng

| Mảng | Yêu cầu |
|---|---|
| Độ tin cậy | Công việc async đổi session an toàn khi hủy; notification fanout idempotent và retryable. |
| Bảo mật | Secret chỉ ở server; production từ chối cấu hình yếu/example; không fallback ngầm managed sang local. |
| Khả năng truy cập | Dashboard quan trọng có control có nhãn, dialog semantic, mục tiêu chạm 44px khi phù hợp, bàn phím và không có axe serious/critical trước release. |
| Quan sát | Health/readiness, trạng thái durable job, log không lộ secret, thao tác Admin có audit. |
| Chất lượng release | Final head phải qua local gate, remote CI mới, provider preflight và production smoke đã xác thực. |

## Tiêu chí chấp nhận đợt hardening

1. Backend không còn dùng FCM server key cũ; validate input đăng ký FCM tại API boundary và có test cho provider lỗi, token invalid.
2. Login/logout, availability, dispatch và realtime của Driver không để async cũ thay đổi session mới hoặc báo offline sai khi request thất bại.
3. Sidebar/drawer Restaurant responsive, accessible, giữ locale/focus/motion preference.
4. Docs mô tả đúng Railway/Supabase/Vercel, FCM, phạm vi test, blocker release và thứ tự deploy; không gọi kiểm tra chưa đủ là production approval.

## Ranh giới release

Repo không thể tự deploy hay xác thực secret bên ngoài. Trước release phải có secret đã rotate, full gate ở final head, remote CI mới, FCM gửi thật với token kiểm soát và browser smoke đã xác thực trên deployment hiện tại.
