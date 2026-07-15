# Hướng dẫn Tài xế

Ngôn ngữ: [English](./driver-guide.md) | **Tiếng Việt** | [日本語](./driver-guide.ja.md)

FoodFlow Driver là ứng dụng giao hàng Flutter/Riverpod native cho Android/iOS. Hướng dẫn này bám các route xác thực và Driver shell hiện tại; không tuyên bố mobile release, dispatch provider live hay ma trận background location production đã được chứng nhận.

![Luồng đăng nhập, Trang chủ, Thu nhập và Hồ sơ Driver](./media/gifs/driver-role-flow.gif)

GIF bốn frame chỉ được tạo từ ảnh Android AVD local deterministic đã kiểm duyệt riêng tư. Đây là tài liệu product/regression, không phải hành trình production đã xác thực.

## Điều kiện

- Cài/chạy flavor Driver từ [main_driver.dart](../mobile/lib/main_driver.dart).
- Dùng account Driver có trạng thái agreement/xác minh phù hợp. Capture local dùng seed identity deterministic; mật khẩu được che và không ghi trong tài liệu.
- Chỉ bật location khi kiểm tra Online/dispatch. App không được hiện Online trước khi có GPS mới và API xác thực thành công.

```powershell
cd mobile
flutter pub get --enforce-lockfile
flutter run --flavor driver -t lib/main_driver.dart `
  --dart-define=API_BASE_URL=http://10.0.2.2:3001/api `
  --dart-define=REALTIME_PROVIDER=socketio
```

Thiết bị thật dùng địa chỉ LAN truy cập được của máy phát triển thay cho host emulator Android `10.0.2.2`.

## Đăng nhập và vào Trang chủ

1. Nhập email/mật khẩu Driver rồi gửi một lần.
2. Nếu chưa chấp nhận điều khoản hiện tại, hoàn tất agreement. Nếu còn cần xác minh, hoàn tất phương tiện, tài liệu và KYC.
3. Driver sẵn sàng vào **Trang chủ**. Khi có đơn đang giao, màn hình cho biết GPS đang chia sẻ hay cần bật lại; công tắc vẫn phản ánh đúng trạng thái Online.
4. Dùng ba tab chính: **Trang chủ**, **Thu nhập**, **Hồ sơ**.

## Bật Online và giao đơn

1. Tại **Trang chủ**, bật control Online.
2. Cấp quyền location/foreground notification cần thiết. App lấy vị trí thiết bị còn mới trước khi yêu cầu Online.
3. Chờ API xác nhận. GPS stale/lỗi hoặc command bị từ chối phải giữ Driver ở Ngoại tuyến.
4. Offer đã cấp quyền mở dialog nhận/từ chối. Chỉ nhận khi sẵn sàng giao.
5. Đi qua delivery flow, xác nhận lấy hàng và hoàn tất. Geometry route/ETA phải từ backend chấp nhận; thiếu thì để unavailable.
6. Chuyển Ngoại tuyến khi kết thúc ca để foreground tracking dừng.

Capture role local dùng GPS mô phỏng cố định và không dùng Google Maps API key. Đây chỉ là thuộc tính capture, không chứng nhận mobile map provider hay routing live. Bản đồ web Admin/Restaurant là OpenFreeMap không cần key; không gắn lại nhãn OpenFreeMap cho widget mobile.

## Thu nhập, lịch sử và hồ sơ

- **Thu nhập** chuyển giữa hôm nay, tuần này, tháng này và hiển thị lịch sử do API trả về.
- **Trang chủ** hiển thị thu nhập, số đơn, thời gian online, rating, đơn đang chạy và đơn gần đây khi có.
- **Hồ sơ** hiển thị thông tin Driver/phương tiện, rating/tổng, ngôn ngữ và đăng xuất. Route xác thực khác có lịch sử/chi tiết chuyến, incentive, heatmap, rating, bank account, notification, support và settings.
- Mọi value trong ảnh là seed data local deterministic, không phải người, payout hoặc balance production thật.

## Hình ảnh

| Đăng nhập | Trang chủ khi đang giao |
|---|---|
| ![Đăng nhập Driver](./screenshots/driver/01-login.webp) | ![Trang chủ Driver](./screenshots/driver/02-home.webp) |

| Thu nhập | Hồ sơ |
|---|---|
| ![Thu nhập Driver](./screenshots/driver/03-earnings.webp) | ![Hồ sơ Driver](./screenshots/driver/04-profile.webp) |

[Gallery sản phẩm](./product-gallery.vi.md#driver) còn giữ bằng chứng GPS/foreground tracking local từ E2E stack cô lập.

## Xử lý sự cố

| Dấu hiệu | Cách xử lý |
|---|---|
| Đăng nhập quay lại login | Kiểm tra API và role Driver; không inject hoặc dùng token của role khác. |
| Bị chuyển tới agreement/KYC | Hoàn tất onboarding bắt buộc; không vượt route bằng URL chép tay. |
| Không bật được Online | Kiểm tra quyền location, GPS mới, mạng và API response; lỗi phải giữ Ngoại tuyến thật. |
| Không có offer | Xác nhận Online đã được server chấp nhận và realtime provider connected; không bịa offer. |
| Không có route/ETA | Chờ dữ liệu backend hợp lệ; không vẽ đường thẳng hoặc ETA giả. |
| Không có push thiết bị | Kiểm tra quyền notification và metadata Firebase theo build; dùng inbox đã xác thực làm fallback. |

## Ranh giới bằng chứng

Bốn ảnh role Driver được capture trên Android API 35 x86_64 AVD nối với E2E stack local cô lập. Flutter debug APK build từ working tree dirty hiện tại, dùng seed data deterministic và che mật khẩu. Đây là bằng chứng regression/product đã review riêng tư—không chứng nhận mobile release, background location, payout, dispatch, Supabase/Railway hay production. Xem [nguồn gốc capture](./screenshots/README.md) và [tổng quan mobile](./customer-driver-guide.vi.md).
