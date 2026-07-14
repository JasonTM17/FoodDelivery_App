# Hướng dẫn ứng dụng Customer và Driver

Ngôn ngữ: [English](./customer-driver-guide.md) | **Tiếng Việt** | [日本語](./customer-driver-guide.ja.md)

FoodFlow có hai ứng dụng mobile native độc lập cho **Khách hàng** và **Tài
xế**, không phải chỉ có dashboard Admin. Tài liệu này đối chiếu trực tiếp với
router và màn hình Flutter hiện có. Đây là hướng dẫn theo source, không phải
xác nhận app đã được phát hành hay production provider đã sẵn sàng.

## Chọn đúng ứng dụng

| Ứng dụng | Người dùng | Android package/flavor | Entrypoint |
|---|---|---|---|
| Customer | Khách đặt món | `vn.foodflow.customer` / `customer` | [`main_customer.dart`](../mobile/lib/main_customer.dart) |
| Driver | Tài xế đã xác minh | `vn.foodflow.driver` / `driver` | [`main_driver.dart`](../mobile/lib/main_driver.dart) |

Cả hai gọi NestJS API đã xác thực. Ở managed production, app nhận event được
allow-list qua credential Supabase Realtime có scope; Socket.IO chỉ là lựa chọn
local/self-hosted được chỉ định rõ. Customer và Driver không có URL web để mở
bằng trình duyệt.

## Hướng dẫn Khách hàng

Xem [hướng dẫn Khách hàng](./customer-guide.vi.md) độc lập để thao tác đặt món
từng bước, quyền, giới hạn địa chỉ, checkout, theo dõi và trợ giúp. Tài liệu
này vẫn là phần tổng quan mobile/runtime dùng chung cho Customer và Driver.

## Hành trình Khách hàng

1. **Mở app và đăng nhập.** App bắt đầu ở splash, sau đó dùng các route Customer
   đã xác thực. Người mới có thể đăng ký và đi qua welcome, vị trí, thông báo.
   Có thể từ chối location/notification; app phải hiển thị trạng thái giới hạn
   thực tế, không được bịa vị trí hay push thành công.
2. **Tìm món.** Home, search, danh sách/lọc nhà hàng, chi tiết nhà hàng và món
   dẫn tới giỏ hàng. Favorite và voucher là các route Customer đã xác thực.
3. **Kiểm tra giỏ và thanh toán.** Checkout bắt buộc chọn địa chỉ giao. App gửi
   địa chỉ, phương thức thanh toán, ghi chú tùy chọn và mã khuyến mãi trong giỏ
   cho API. UI hiện có tiền mặt và ví; server là nguồn quyết định cuối cùng về
   khả dụng, giá, khuyến mãi và kết quả thanh toán.
4. **Theo dõi đơn.** Checkout thành công mở theo dõi đơn. App tải chi tiết đơn,
   bắt đầu tracking đã xác thực cho đúng đơn và dừng khi rời màn hình. Camera/
   route map chỉ dùng điểm hợp lệ; client không tự vẽ đường thẳng hay ETA giả.
5. **Hoàn tất hoặc cần hỗ trợ.** Lịch sử đơn dẫn tới tracking và đánh giá. Hủy
   đơn gửi lý do và ghi chú tùy chọn; việc hủy/hoàn tiền có được chấp nhận hay
   không do server quyết định. Profile có địa chỉ, ví, loyalty, referral,
   favorite, thông báo và help center/chat.

### Thông báo Customer

Sau khi có session Customer hợp lệ, app có thể xin quyền thông báo và đăng ký
FCM token nếu build có metadata Firebase công khai. Push tap chỉ nhận deep link
nội bộ tới thông báo hoặc đơn; link không hỗ trợ rơi về inbox trong app. Thiếu
cấu hình Firebase chỉ tắt đăng ký FCM, không được giả vờ push đã gửi thành công.

## Hành trình Tài xế

1. **Đăng nhập và onboarding.** Driver chưa chấp nhận điều khoản hiện hành sẽ
   tới màn agreement. Driver chưa xác minh đi theo vehicle, documents, KYC.
   KYC dùng dữ liệu typed và private upload grant; không dán signed upload URL
   hoặc credential vào app.
2. **Bật Online bằng GPS thật.** Trang chủ Driver có control Online. Khi bật,
   app lấy mẫu vị trí còn mới rồi API chấp nhận hoặc từ chối availability. GPS
   stale/lỗi phải giữ UI đúng trạng thái; không được hiện Online chỉ vì đã bấm
   công tắc.
3. **Nhận và xử lý cuốc.** Offer được cấp quyền mở dialog accept/reject không
   thể dismiss. Đơn được nhận đi qua delivery flow, xác nhận lấy hàng và hoàn
   tất giao. Geometry/ETA route lấy từ backend đã chấp nhận; thiếu dữ liệu phải
   hiển thị unavailable.
4. **Vận hành tài khoản.** Route Driver có lịch sử/chi tiết chuyến, earnings,
   incentives, heatmap, ratings, bank account, hỗ trợ, cài đặt và offline
   status. Đây là route đã xác thực dành riêng cho Driver, không thay thế quyền
   Admin hay Restaurant.

### Thông báo Driver

Inbox Driver là route đã xác thực và khi đang mở còn nhận stream realtime được
phép, khử trùng lặp theo notification ID. Push tap chỉ có thể tới notifications,
earnings hoặc profile sau khi trạng thái đăng nhập Driver cho phép; tap tới lúc
đang restore session sẽ đợi xác thực xong. Đích lạ luôn rơi về notification
inbox.

## Chạy trên emulator hoặc thiết bị

Với API local trên máy phát triển, Android emulator dùng `10.0.2.2`. Thiết bị
thật phải dùng địa chỉ LAN truy cập được của máy đó.

```powershell
cd mobile
flutter pub get --enforce-lockfile

flutter run --flavor customer -t lib/main_customer.dart `
  --dart-define=API_BASE_URL=http://10.0.2.2:3001/api `
  --dart-define=REALTIME_PROVIDER=socketio

flutter run --flavor driver -t lib/main_driver.dart `
  --dart-define=API_BASE_URL=http://10.0.2.2:3001/api `
  --dart-define=REALTIME_PROVIDER=socketio
```

Managed production phải dùng provider alias đã xác minh cùng
`REALTIME_PROVIDER=supabase`; test Firebase cũng cần đủ bốn `FIREBASE_*` công
khai khớp flavor. Không đưa FCM service account, Supabase service-role,
database URL hoặc signing secret vào Dart define. Cài đặt đầy đủ, build Android
và xử lý sự cố nằm trong [mobile README](../mobile/README.md).

## Ranh giới visual và release

Gallery hiện chưa có ảnh Customer. Hai ảnh Driver chỉ là evidence GPS/quyền
thông báo local test. Chúng cố ý không được trình bày là bằng chứng mobile
release hay production. Muốn có visual publishable phải capture mới từ
emulator/thiết bị, ghi source SHA và runtime reference, sau đó review bằng mắt;
xem [quy trình capture](./product-gallery.vi.md#tạo-lại).

Liên quan: [yêu cầu sản phẩm](./project-overview-pdr.vi.md),
[hướng dẫn test](./testing-guide.vi.md), [product gallery](./product-gallery.vi.md).
