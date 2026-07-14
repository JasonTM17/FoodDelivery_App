# Gallery sản phẩm FoodFlow

Ngôn ngữ: [English](product-gallery.md) · **Tiếng Việt** · [日本語](product-gallery.ja.md)

Ảnh và GIF trong gallery là media lịch sử, không phải production screenshot. `docs/screenshots/manifest.json` ghi `capturedAt` 2026-07-10 nhưng không có source SHA, Compose reference hoặc image reference; vì vậy chúng không chứng minh current source head, Docker build cuối hay production deploy.

## Phạm vi bề mặt

| Bề mặt | Sản phẩm | Media trực quan đã lưu | Hướng dẫn chính | Ranh giới bằng chứng |
|---|---|---|---|---|
| Admin | Dashboard web Next.js | Ảnh tĩnh và GIF lịch sử | — | Chỉ là media web non-production. |
| Restaurant | Dashboard web Next.js | Ảnh tĩnh và GIF lịch sử | — | Chỉ là media web non-production. |
| Customer | Ứng dụng Flutter/Riverpod native Android/iOS; Android flavor `customer` | Một ảnh Android API 35 chỉ phục vụ test | [Hướng dẫn Khách hàng](./customer-guide.vi.md) | Ảnh discovery từ GPS mô phỏng local; không phải bằng chứng release hay production. |
| Driver | Ứng dụng Flutter/Riverpod native Android/iOS; Android flavor `driver` | Bốn asset Android API 35 chỉ phục vụ test | [Hướng dẫn Customer/Driver](./customer-driver-guide.vi.md) | Chỉ là evidence GPS/notification mô phỏng local; không phải bằng chứng mobile release, Supabase, Railway hay production. |

## Bắt đầu với Khách hàng

Ứng dụng Customer native không có URL trình duyệt. Đọc [hướng dẫn Khách
hàng](./customer-guide.vi.md) đã đối chiếu source để xem đăng nhập, tìm món,
giỏ, chọn địa chỉ trên bản đồ, checkout, theo dõi, thông báo và Trợ giúp; sau đó chạy
[`main_customer.dart`](../mobile/lib/main_customer.dart) trên thiết bị hoặc
emulator. Bên dưới có một ảnh Customer đã review từ GPS mô phỏng; không thay
thế bằng ảnh Admin/Restaurant. Hiện chưa có GIF Customer.

## Luồng chuyển động

| Luồng | Xem trước |
|---|---|
| Đăng nhập Admin → tổng quan | ![Admin](media/gifs/admin-login-flow.gif) |
| Đơn hàng Restaurant → thực đơn | ![Restaurant](media/gifs/restaurant-orders-to-menu.gif) |

GIF chỉ mô tả luồng web Admin và Restaurant. Customer hiện có ảnh test-only ở
bên dưới, chưa có capture chuyển động.

## Admin

| Màn hình | Ảnh |
|---|---|
| Đăng nhập | ![Admin login](screenshots/admin/01-login.png) |
| Tổng quan | ![Admin overview](screenshots/admin/02-overview.png) |
| Đơn hàng | ![Admin orders](screenshots/admin/03-orders.png) |
| Nhà hàng | ![Admin restaurants](screenshots/admin/04-restaurants.png) |
| Người dùng | ![Admin users](screenshots/admin/05-users.png) |
| Tài xế | ![Admin drivers](screenshots/admin/06-drivers.png) |
| Khuyến mãi | ![Admin promotions](screenshots/admin/07-promotions.png) |
| Hỗ trợ | ![Admin support](screenshots/admin/08-support.png) |
| Phân tích | ![Admin analytics](screenshots/admin/09-analytics.png) |
| Cài đặt | ![Admin settings](screenshots/admin/10-settings.png) |

## Restaurant

| Màn hình | Ảnh |
|---|---|
| Đăng nhập | ![Restaurant login](screenshots/restaurant/01-login.png) |
| Dashboard | ![Restaurant dashboard](screenshots/restaurant/02-dashboard.png) |
| Hàng đợi đơn | ![Restaurant orders](screenshots/restaurant/03-orders.png) |
| Thực đơn | ![Restaurant menu](screenshots/restaurant/04-menu.png) |
| Khuyến mãi | ![Restaurant promotions](screenshots/restaurant/05-promotions.png) |
| Doanh thu | ![Restaurant revenue](screenshots/restaurant/06-revenue.png) |
| Đánh giá | ![Restaurant reviews](screenshots/restaurant/07-reviews.png) |
| Nhân sự | ![Restaurant staff](screenshots/restaurant/08-staff.png) |
| Insight | ![Restaurant insights](screenshots/restaurant/09-insights.png) |
| Cài đặt | ![Restaurant settings](screenshots/restaurant/10-settings.png) |

## Customer

Customer là sản phẩm Flutter/Riverpod native Android/iOS hạng nhất. Khởi chạy từ [`main_customer.dart`](../mobile/lib/main_customer.dart) với Android flavor `customer`. Phạm vi đã tài liệu hóa gồm discovery, ordering, cart, checkout, tracking và support; xem [hướng dẫn Khách hàng](./customer-guide.vi.md) cho hành trình sử dụng và [hướng dẫn mobile](../mobile/README.md) để biết runtime/build.

Xem workflow Customer/Driver dùng chung, permission, hành vi thông báo và lệnh chạy ở [hướng dẫn Customer và Driver](./customer-driver-guide.vi.md).

Ảnh đã kiểm duyệt riêng tư dưới đây cho thấy Customer tải nhà hàng gần đó từ GPS mô phỏng trên Android API 35. Manifest ghi rõ capture được tạo khi worktree còn dirty, vì vậy đây chỉ là bằng chứng regression; phải capture lại từ clean head mới được dùng làm bằng chứng release.

![Customer tải nhà hàng gần đó từ GPS mô phỏng](./screenshots/customer/customer-nearby-restaurants.webp)

## Driver GPS (local E2E, chỉ phục vụ test)

Driver là sản phẩm Flutter/Riverpod native Android/iOS hạng nhất. Khởi chạy từ [`main_driver.dart`](../mobile/lib/main_driver.dart) với Android flavor `driver`. Phạm vi đã tài liệu hóa gồm trạng thái Online, dispatch, GPS, route guidance, earnings, KYC và notifications; xem [hướng dẫn mobile](../mobile/README.md) để biết runtime và build.

Ảnh Android API 35 dùng route mô phỏng và dữ liệu test deterministic. Chúng minh họa thao tác Online, notification permission và foreground location notification của Driver; không hiển thị vị trí thật, tài khoản cá nhân, credential, token hoặc thông báo cá nhân không liên quan.

Local E2E lịch sử đã nhận GPS command xác thực, làm mới Redis liveness, ghi mẫu vào PostGIS và gửi một event Socket.IO cho Admin được cấp quyền. Đây chỉ là bằng chứng compatibility `socketio` local, không phải Supabase, Railway, Vercel hoặc production.

| Màn hình | Ảnh |
|---|---|
| Driver Online sau GPS verification | ![Driver Online](screenshots/driver/driver-online-gps-e2e.webp) |
| Driver Online trong device smoke hiện tại | ![Driver Online realtime GPS](screenshots/driver/driver-online-realtime-gps.webp) |
| Quyền notification foreground tracking | ![Driver notification permission](screenshots/gps/driver-notification-permission.webp) |
| Foreground location notification | ![Driver foreground location notification](screenshots/gps/driver-foreground-location-notification.webp) |

## Tạo lại

```powershell
docker compose -f docker-compose.yml -f docker-compose.e2e.yml up -d --build
$env:FOODFLOW_ADMIN_URL='http://localhost:13000'
$env:FOODFLOW_RESTAURANT_URL='http://localhost:13002'
$env:FOODFLOW_API_URL='http://localhost:13001/api'
node docs/scripts/capture-product-media.mjs
```

Dùng `localhost`, không dùng `127.0.0.1`, vì overlay CORS cố ý xem host sau là error-state. Script dùng API thật, tạo GIF tối ưu và xóa frame trung gian nhưng vẫn phải review từng ảnh. Capture dùng cho release phải kèm source commit, Compose/image reference và nêu rõ nó chạy từ clean final head hay dirty workspace; manifest hiện tại chỉ có thời gian, origin và seed identity.

Checklist: locale/title/`html lang`, không có 404/`Failed to fetch`/console error, data thật từ API, không lộ secret/token, không có crop/clipping và không che lỗi thành empty state. Media hiện có vẫn là lịch sử cho tới khi recapture từ release candidate đã commit và ghi source/runtime reference; capture từ dirty workspace chỉ là runtime evidence, không phải release proof.

Xem [gallery EN chi tiết](product-gallery.md), [testing](testing-guide.vi.md), [Docker](docker-local-dev-guide.vi.md).
