# Hướng dẫn Restaurant

Ngôn ngữ: [English](./restaurant-guide.md) | **Tiếng Việt** | [日本語](./restaurant-guide.ja.md)

FoodFlow Restaurant là workspace Next.js theo locale cho chủ nhà hàng và nhân viên được cấp quyền. Hướng dẫn này bám route và permission hiện tại; không phải chứng nhận production.

## Điều kiện

- Chạy API và Restaurant, rồi mở `http://localhost:3002/{locale}/login` với `locale` là `vi`, `en` hoặc `ja`.
- Dùng account có membership nhà hàng đang hoạt động. Nhân viên chỉ thấy khu vực mà permission membership cho phép.
- Manifest chỉ lưu seed identity không bí mật, không lưu mật khẩu. Không chép credential vào docs, screenshot, ticket hoặc chat.

## Đăng nhập và xử lý đơn

1. Nhập email/mật khẩu Restaurant rồi gửi một lần.
2. Đăng nhập thành công mở **Đơn hàng**. Nếu thiếu membership/quyền, xử lý authorization thay vì vượt route guard.
3. Xem queue, mở đúng đơn và chỉ thực hiện transition được UI/API cho phép.
4. Sang **Thực đơn** để quản lý category, món và option; kiểm tra lại availability/price trước khi lưu.
5. Đăng xuất khi kết thúc phiên vận hành.

![Luồng đơn hàng Restaurant tới thực đơn](./media/gifs/restaurant-orders-to-menu.gif)

## Luồng chính

| Khu vực | Thao tác hiện có |
|---|---|
| Tổng quan | Xem dashboard summary của nhà hàng. |
| Đơn hàng | Theo dõi queue và chi tiết đơn; API state là nguồn quyết định cuối. |
| Thực đơn | Quản lý category, tạo/sửa món và option. |
| Khuyến mãi | Tạo, xem và sửa promotion hợp lệ của nhà hàng. |
| Phân tích và Insight | Xem aggregate/insight thật; không thay bằng fallback data giả. |
| Nhân viên | Mời staff, gán permission hỗ trợ và quản lý ca; quyền kitchen/manager có thể hẹp hơn owner. |
| Doanh thu | Xem tổng và lịch sử/transaction thuộc tenant nhà hàng. |
| Đánh giá | Xem review và summary liên quan. |
| Thông báo | Xem inbox Restaurant đã xác thực. |
| Cài đặt | Sửa general/profile và giờ mở cửa trong permission được cấp. |

Dữ liệu Restaurant được scope theo tenant. Staff không được dùng URL chép tay để vào nhà hàng khác hoặc khu vực ngoài membership. Bản đồ tracking web Restaurant chỉ chấp nhận OpenFreeMap không cần key qua MapLibre, nên không cần Google Maps browser API key; directions backend là integration riêng và fail closed khi chưa cấu hình.

## Hình ảnh

| Dashboard | Hàng đợi đơn |
|---|---|
| ![Dashboard Restaurant](./screenshots/restaurant/02-dashboard.png) | ![Đơn hàng Restaurant](./screenshots/restaurant/03-orders.png) |

| Thực đơn | Doanh thu |
|---|---|
| ![Thực đơn Restaurant](./screenshots/restaurant/04-menu.png) | ![Doanh thu Restaurant](./screenshots/restaurant/06-revenue.png) |

| Nhân viên | Cài đặt |
|---|---|
| ![Nhân viên Restaurant](./screenshots/restaurant/08-staff.png) | ![Cài đặt Restaurant](./screenshots/restaurant/10-settings.png) |

Xem đủ mười ảnh Restaurant trong [gallery sản phẩm](./product-gallery.vi.md#restaurant).

## Xử lý sự cố

| Dấu hiệu | Cách xử lý |
|---|---|
| Bị trả về đăng nhập | Kiểm tra API healthy và membership nhà hàng active, rồi đăng nhập lại. |
| Bị cấm vào khu vực | Nhờ owner kiểm tra permission staff; không vượt guard bằng URL trực tiếp. |
| Queue/menu rỗng sau lỗi | Retry và xem lỗi hiển thị; không xem request lỗi là dữ liệu bằng 0 thật. |
| Cập nhật đơn bị từ chối | Reload đơn và theo server state mới nhất; không lặp transition stale. |
| Map/route unavailable | Kiểm tra OpenFreeMap style và cấu hình route/telemetry backend; không bịa route hay ETA. |

## Ranh giới bằng chứng

Ảnh PNG và GIF Restaurant được capture bằng Google Chrome từ Docker E2E local cô lập với seed data deterministic. Manifest ghi working tree dirty và image local. Đây là bằng chứng product/regression đã review riêng tư, không chứng minh tenant production, artifact release hay provider live. Xem [nguồn gốc capture](./screenshots/README.md) và [gallery đầy đủ](./product-gallery.vi.md).
