# Hướng dẫn Admin

Ngôn ngữ: [English](./admin-guide.md) | **Tiếng Việt** | [日本語](./admin-guide.ja.md)

FoodFlow Admin là dashboard vận hành Next.js có route theo locale. Hướng dẫn này bám theo route và bằng chứng local hiện tại; không chứng nhận một hành trình production đã deploy.

## Điều kiện

- Chạy API và Admin, rồi mở `http://localhost:3000/{locale}/login` với `locale` là `vi`, `en` hoặc `ja`.
- Dùng tài khoản có quyền Admin. Manifest chỉ ghi seed identity không bí mật; tài liệu và media cố ý không chứa mật khẩu.
- Khi dùng stack E2E cô lập, giữ origin `localhost` như [gallery](./product-gallery.vi.md#tạo-lại).

## Đăng nhập và điều hướng

1. Nhập email và mật khẩu Admin, rồi gửi một lần.
2. Đăng nhập thành công mở **Tổng quan**. Lỗi xác thực/phân quyền phải giữ ở error state an toàn; không xem loading hoặc màn trống là thành công.
3. Dùng sidebar; mọi link giữ locale `vi`, `en` hoặc `ja` đang chọn.
4. Đăng xuất ở cuối sidebar khi hoàn tất review.

![Luồng đăng nhập Admin tới tổng quan](./media/gifs/admin-login-flow.gif)

## Luồng chính

| Khu vực | Thao tác hiện có |
|---|---|
| Tổng quan | Xem KPI và biểu đồ vận hành trước khi mở danh sách chi tiết. |
| Đơn hàng | Lọc đơn, mở chi tiết và kiểm tra trạng thái thật từ server. |
| Nhà hàng | Xem hồ sơ, chi tiết và thao tác phê duyệt nhà hàng. |
| Người dùng và Tài xế | Kiểm tra account/driver; chỉ dùng bản đồ tài xế với location hợp lệ, đã cấp quyền. |
| Khuyến mãi | Xem, tạo, sửa promotion; server vẫn là nguồn xác thực cuối. |
| Hỗ trợ | Xử lý queue/ticket; không biến request lỗi thành queue rỗng. |
| Phân tích và Báo cáo | Xem aggregate/report; theo dõi export bất đồng bộ tại Export Jobs. |
| AI Monitor | Xem usage telemetry; thiếu provider phải hiện trạng thái degraded rõ ràng. |
| Cài đặt | Quản lý general, branding, compliance và integration trong quyền Admin. |

Bản đồ web Admin chỉ chấp nhận style OpenFreeMap không cần key qua MapLibre; không cần Google Maps browser API key. Directions backend là phần riêng và fail closed nếu không có Google Directions hoặc OSRM do dự án sở hữu.

## Hình ảnh

| Tổng quan | Đơn hàng |
|---|---|
| ![Tổng quan Admin](./screenshots/admin/02-overview.png) | ![Đơn hàng Admin](./screenshots/admin/03-orders.png) |

| Tài xế | Cài đặt |
|---|---|
| ![Tài xế Admin](./screenshots/admin/06-drivers.png) | ![Cài đặt Admin](./screenshots/admin/10-settings.png) |

Xem đủ mười ảnh Admin trong [gallery sản phẩm](./product-gallery.vi.md#admin).

## Xử lý sự cố

| Dấu hiệu | Cách xử lý |
|---|---|
| Bị trả về đăng nhập | Kiểm tra API local healthy và account có role Admin; đăng nhập lại, không inject session. |
| Sai ngôn ngữ/route | Mở URL `/{vi|en|ja}/...` phù hợp và dùng điều hướng giữ locale. |
| Danh sách trống sau lỗi | Retry và đọc lỗi hiển thị; không ghi nhận request lỗi thành empty state hợp lệ. |
| Bản đồ không dùng được | Kiểm tra OpenFreeMap style và telemetry backend; không bịa tọa độ, route hay ETA. |
| Export/AI unavailable | Xem trạng thái job/provider rõ ràng; không thêm secret giả hay tuyên bố thành công. |

## Ranh giới bằng chứng

Ảnh PNG và GIF Admin được capture bằng Google Chrome từ Docker E2E local cô lập với seed data deterministic. Manifest ghi working tree dirty và runtime image local. Đây là bằng chứng product/regression đã review riêng tư, không phải chứng nhận release hay production. Xem [nguồn gốc capture](./screenshots/README.md) và [gallery đầy đủ](./product-gallery.vi.md).
