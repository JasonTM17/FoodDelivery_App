# Hướng dẫn thiết kế FoodFlow

Ngôn ngữ: [English](./design-guidelines.md) | [Tiếng Việt](./design-guidelines.vi.md) | [日本語](./design-guidelines.ja.md)

## Màu thương hiệu

| Token | Hex | Cách dùng |
|---|---|---|
| Primary Green | `#2ECC71` | Nút, liên kết, trạng thái đang chọn, thành công |
| Accent Orange | `#F39C12` | Nhấn mạnh, cảnh báo, marker tài xế |
| Background | `#FFFFFF` | Nền trang |
| Card | `#FFFFFF` | Card và bề mặt nổi |
| Text Primary | `#1A1A1A` | Tiêu đề, nội dung chính |
| Text Muted | `#6B7280` | Nội dung phụ, chú thích |
| Sidebar BG | `#14532D` | Sidebar tối của Admin/Restaurant |
| Destructive | `#EF4444` | Lỗi, thao tác xóa, đơn bị hủy |

## Hệ logo

- Mark: hình vuông bo góc với gradient, tuyến giao hàng, bát đồ ăn, lá xanh và ghim bản đồ.
- Ý nghĩa: đặt món, độ tươi, luồng giao hàng và khả năng nhìn thấy vị trí realtime.
- Asset chính: `web/apps/admin/public/favicon.svg`, `web/apps/admin/public/foodflow-mark.svg`, `web/apps/restaurant/public/favicon.svg`, `web/apps/restaurant/public/foodflow-mark.svg`.
- Dùng component `FoodFlowLogo` từ `@foodflow/ui/foodflow-logo` cho sidebar, login, empty state và error state.
- Kích thước gợi ý: 36-40px trên sidebar tối, 64-80px ở error/empty state.
- Không thay SVG vector bằng raster nếu nền tảng đích không bắt buộc PNG.

## Typography

- Font: Inter, hỗ trợ Latin và dấu tiếng Việt.
- Heading: 20-28px, bold 700.
- Body: 14-16px, regular 400.
- Caption: 12px, medium 500.
- Giá tiền: 16-18px, semibold 600, màu xanh.

## Bo góc và khoảng cách

- Card, button, input: 12px.
- Badge: pill/full radius.
- Spacing: xs 4px, sm 8px, md 12px, lg 16px, xl 24px, 2xl 32px.

## Pattern component

### Badge trạng thái đơn

- created/pending: xám.
- preparing/delivering: amber/yellow.
- completed/delivered: xanh.
- cancelled/refunded: đỏ.

### Marker bản đồ

- Nhà hàng: ghim xanh.
- Tài xế online: chấm xanh.
- Tài xế đang giao: motorcycle màu cam.
- Khách hàng: ghim xanh dương.
