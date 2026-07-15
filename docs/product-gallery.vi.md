# Gallery sản phẩm FoodFlow

Ngôn ngữ: [English](product-gallery.md) · **Tiếng Việt** · [日本語](product-gallery.ja.md)

Đây là gallery non-production đã review riêng tư. `docs/screenshots/manifest.json` ghi source head, thời gian, runtime và ranh giới working tree dirty cho media hiện tại. Ảnh/GIF chứng minh hành vi sản phẩm local thật, không chứng minh clean release head, Docker build cuối hay hành trình production.

## Phạm vi bề mặt

| Bề mặt | Sản phẩm | Media trực quan đã lưu | Hướng dẫn chính | Ranh giới bằng chứng |
|---|---|---|---|---|
| Admin | Dashboard web Next.js | 10 PNG local và một GIF | [Hướng dẫn Admin](./admin-guide.vi.md) | Bằng chứng Google Chrome từ E2E stack cô lập; chỉ non-production. |
| Restaurant | Dashboard web Next.js | 10 PNG local và một GIF | [Hướng dẫn Restaurant](./restaurant-guide.vi.md) | Bằng chứng Google Chrome từ E2E stack cô lập; chỉ non-production. |
| Customer | Ứng dụng Flutter/Riverpod native Android/iOS; Android flavor `customer` | Một WebP local đã kiểm duyệt riêng tư | [Hướng dẫn Khách hàng](./customer-guide.vi.md) | Bằng chứng mở app trên Android AVD; ảnh có tọa độ chính xác đã bị loại. |
| Driver | Ứng dụng Flutter/Riverpod native Android/iOS; Android flavor `driver` | Sáu WebP role/GPS và hai asset tracking/quyền | [Hướng dẫn Tài xế](./driver-guide.vi.md) | Bằng chứng role/GPS trên Android AVD; không chứng nhận release, provider, payout hay production. |

## Chọn hướng dẫn theo vai trò

- [Admin](./admin-guide.vi.md): vận hành nền tảng, support, report, export và settings.
- [Restaurant](./restaurant-guide.vi.md): queue đơn, menu, staff, revenue và settings nhà hàng.
- [Customer](./customer-guide.vi.md): discovery, giỏ, checkout, tracking và trợ giúp.
- [Driver](./driver-guide.vi.md): onboarding, Online/GPS, dispatch, thu nhập và hồ sơ.

Customer/Driver không có URL trình duyệt. Chạy đúng Flutter entrypoint trên thiết bị/emulator; không thay UI mobile bằng ảnh Admin/Restaurant.

## Luồng chuyển động

| Luồng | Xem trước |
|---|---|
| Đăng nhập Admin → tổng quan | ![Admin](media/gifs/admin-login-flow.gif) |
| Đơn hàng Restaurant → thực đơn | ![Restaurant](media/gifs/restaurant-orders-to-menu.gif) |

GIF là preview im lặng, tối ưu từ frame Google Chrome đã review. Evidence Customer/Driver dùng ảnh tĩnh Android AVD đã kiểm duyệt riêng tư ở bên dưới.

## Admin

Xem [hướng dẫn Admin](./admin-guide.vi.md) cho đăng nhập, điều hướng, ranh giới quyền và xử lý lỗi.

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

Xem [hướng dẫn Restaurant](./restaurant-guide.vi.md) cho đơn hàng, menu, quyền staff, settings và xử lý lỗi.

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

Ảnh đã review riêng tư dưới đây cho thấy app launch, Trang chủ đã xác thực và danh sách nhà hàng gần từ GPS mô phỏng trên Android API 35. Manifest ghi working tree dirty, nên đây chỉ là evidence regression/product; cần capture clean head mới cho release.

![Mở ứng dụng Customer](./screenshots/customer/01-login.webp)

Các ảnh Customer đã xác thực hiển thị tọa độ mô phỏng chính xác đã bị loại khỏi gallery. Hành vi ẩn tọa độ được chứng minh bằng regression test mobile thay vì sửa ảnh.

## Driver

Driver là sản phẩm Flutter/Riverpod native Android/iOS. Khởi chạy từ [`main_driver.dart`](../mobile/lib/main_driver.dart) với Android flavor `driver`. Xem [hướng dẫn Tài xế](./driver-guide.vi.md) cho đăng nhập, onboarding, Online thật, dispatch, thu nhập và hồ sơ; xem [hướng dẫn mobile](../mobile/README.md) cho runtime/build.

| Đăng nhập | Trang chủ |
|---|---|
| ![Đăng nhập Driver](./screenshots/driver/01-login.webp) | ![Trang chủ Driver](./screenshots/driver/02-home.webp) |

| Thu nhập | Hồ sơ |
|---|---|
| ![Thu nhập Driver](./screenshots/driver/03-earnings.webp) | ![Hồ sơ Driver](./screenshots/driver/04-profile.webp) |

### GPS và foreground tracking local E2E

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

Dùng `localhost`, không dùng `127.0.0.1`, vì overlay CORS cố ý xem host sau là error-state. Script dùng API thật, Google Chrome channel, tạo GIF tối ưu và xóa frame trung gian nhưng vẫn phải review từng ảnh. Capture dùng cho release phải kèm source commit, Compose/image reference và nêu rõ clean final head hay dirty workspace. Manifest hiện tại ghi Android API 35 x86_64 AVD cho mobile, seed identity deterministic, mật khẩu che, GPS mô phỏng cố định và không dùng Google Maps API key. Bản đồ web Admin/Restaurant chỉ chấp nhận OpenFreeMap không cần key; không gắn nhãn OpenFreeMap cho widget mobile.

Checklist: locale/title/`html lang`, không có 404/`Failed to fetch`/console error, data thật từ API, không lộ secret/token, không có crop/clipping và không che lỗi thành empty state. Media hiện có vẫn là lịch sử cho tới khi recapture từ release candidate đã commit và ghi source/runtime reference; capture từ dirty workspace chỉ là runtime evidence, không phải release proof.

Xem [gallery EN chi tiết](product-gallery.md), [testing](testing-guide.vi.md), [Docker](docker-local-dev-guide.vi.md).
