# Hướng dẫn Khách hàng

Ngôn ngữ: [English](./customer-guide.md) | **Tiếng Việt** | [日本語](./customer-guide.ja.md)

FoodFlow Customer là ứng dụng đặt món Flutter/Riverpod native cho Android và iOS. Đây là hướng dẫn đã đối chiếu source với luồng Customer hiện tại, không phải xác nhận rằng một bản production, thanh toán, bản đồ hay push provider cụ thể đã live. Customer không có địa chỉ web; dùng ứng dụng mobile đã cài hoặc chạy [main_customer.dart](../mobile/lib/main_customer.dart) với Android flavor customer.

## Khách hàng có thể làm gì

| Nhóm | Khả năng Customer hiện có |
|---|---|
| Khám phá | Xem nhà hàng gần, tìm món, xem chi tiết nhà hàng/món và lọc kết quả nhà hàng. |
| Đặt món | Thêm món và tùy chọn vào giỏ, ghi chú, dùng mã khuyến mãi, chọn địa chỉ giao và trả tiền mặt hoặc ví. |
| Theo dõi | Xem đơn đang hoạt động/đã giao/đã hủy, theo dõi đơn phù hợp, yêu cầu hủy và đánh giá đơn đã giao. |
| Tài khoản | Dùng favorite, voucher, inbox thông báo, ví, loyalty, referral, địa chỉ, trợ giúp và AI chat trong app. |

## Bắt đầu nhanh

1. Xem nhà hàng, thêm món và tùy chọn đã chọn vào giỏ.
2. Đăng nhập hoặc đăng ký trước khi đi tới giỏ và checkout cần xác thực.
3. Xác nhận địa chỉ giao hợp lệ, chờ giá giao hàng, rồi chọn tiền mặt hoặc ví.
4. Gửi checkout một lần, chờ xác nhận đơn và mở **Đơn hàng** để theo dõi.

Đây là luồng ngắn nhất được hỗ trợ. Favorite, voucher, ví, loyalty, referral,
thông báo và Trợ giúp là tính năng tài khoản tùy chọn; không tính năng nào thay
thế kiểm tra địa chỉ giao và giá giao hàng bắt buộc khi checkout.

## 1. Mở app, tài khoản và quyền

1. Mở Customer. Bạn có thể xem Home, tìm kiếm, danh sách nhà hàng và chi tiết món trước khi đăng nhập.
2. Chọn **Đăng ký** để nhập họ tên, email, số điện thoại và mật khẩu; hoặc chọn **Đăng nhập** bằng email và mật khẩu.
3. Sau khi đăng nhập thành công, đi qua welcome, onboarding vị trí và thông báo. Từ chối quyền không được tạo ra vị trí giả hoặc trạng thái push thành công giả.

### Lưu ý về quyền

- Vị trí giúp tìm nhà hàng gần và cung cấp ngữ cảnh giao hàng. Nếu Android/iOS không hiện hộp thoại quyền, hãy kiểm tra quyền FoodFlow trong cài đặt thiết bị thay vì cho rằng quyền đã được cấp.
- Thông báo là tùy chọn. Inbox thông báo trong app vẫn dùng được khi thiếu cấu hình Firebase; push thiết bị chỉ được thử sau session hợp lệ và trên build có đủ metadata Firebase công khai.
- Chạm push chỉ mở inbox thông báo hoặc điểm đến đơn hàng nội bộ. Không hứa hỗ trợ mọi liên kết web/universal link.

## 2. Tìm món và lập giỏ hàng

1. Tại **Home**, xem nhà hàng hoặc dùng **Tìm kiếm**.
2. Mở nhà hàng để xem thực đơn; mở món để chọn tùy chọn trước khi thêm vào giỏ.
3. Trong **Giỏ hàng**, thay đổi số lượng, xóa món, ghi chú món hoặc áp dụng mã khuyến mãi nếu có.
4. Kiểm tra lại giỏ trước checkout. Giá, tồn kho, điều kiện khuyến mãi và kết quả thanh toán cuối cùng do server xác nhận, không chỉ do màn hình hiển thị.

Nếu yêu cầu đăng nhập bị từ chối khi giỏ vẫn ở local, app không tự âm thầm xóa giỏ. Đăng nhập lại rồi kiểm tra nội dung trước khi đặt đơn.

## 3. Địa chỉ giao hàng và checkout

Checkout chỉ mở khi giá giao hàng đã tải xong và đã chọn địa chỉ giao. Tại checkout, bạn có thể chọn **tiền mặt** hoặc **ví**, thêm ghi chú cho tài xế và dùng mã khuyến mãi của giỏ.

### Checklist trước checkout

Trước khi gửi, hãy xác nhận:

- nhà hàng, tùy chọn món, số lượng và ghi chú món là đúng;
- đã chọn một địa chỉ giao hợp lệ;
- giá giao hàng đang hiển thị, không còn chờ tải;
- lựa chọn tiền mặt hoặc ví là đúng; và
- mã khuyến mãi vẫn hiển thị trong giỏ nếu bạn muốn dùng.

Server vẫn có thể từ chối yêu cầu do tồn kho, giá, voucher, thanh toán hoặc trạng
thái đơn. Đọc thông báo trả về và sửa đúng lựa chọn bị ảnh hưởng; không coi việc
bấm nút là đơn đã được tạo.

### Chọn điểm giao trên bản đồ

Khi thêm địa chỉ mới, nhập nhãn và địa chỉ chi tiết, sau đó chạm bản đồ để đặt
điểm giao. Điểm phải nằm trong vùng giao hàng hỗ trợ tại Việt Nam. Không thể
lưu địa chỉ chỉ có chữ vì API giao hàng còn cần latitude/longitude; điều này
ngăn tracking và dispatch dùng một vị trí bịa ra.

Nếu app báo vị trí không hợp lệ, hãy chạm lại một điểm hợp lệ trên bản đồ.
Không gửi checkout lặp lại. Không thể đặt đơn cho tới khi có địa chỉ giao hợp
lệ và giá giao hàng.

Sau khi xác nhận checkout, chờ xác nhận đơn. App chỉ xóa giỏ và mở theo dõi khi API trả về order ID; không gửi cùng đơn ở nhiều màn hình khi đang chờ kết quả.

## 4. Theo dõi, hủy và đánh giá đơn

- Mở **Đơn hàng** để xem đơn đang hoạt động, đã giao và đã hủy.
- Chọn một đơn đang hoạt động để xem trạng thái theo dõi. Khi có tọa độ giao và tài xế hợp lệ, app có thể hiển thị bản đồ/route. Nếu thiếu tọa độ hoặc route, app hiển thị trạng thái đó, không tự bịa route hay ETA.
- Chọn **Hủy đơn** chỉ khi màn đơn cho phép. Có thể nêu lý do giao chậm, đổi ý, sai đơn hoặc khác; server quyết định hủy/refund có được chấp nhận hay không.
- Sau khi giao, dùng luồng đánh giá để chấm món, giao hàng và nhập nhận xét tùy chọn.

## 5. Hồ sơ, thông báo và trợ giúp

Từ **Hồ sơ**, Khách hàng vào địa chỉ, favorite, voucher, ví, loyalty, referral, inbox thông báo và Trợ giúp.

- **Favorite** giữ lại nhà hàng hoặc món muốn tìm lại.
- Voucher, số dư ví và loyalty vẫn được server xác thực khi checkout.
- **Thông báo** hỗ trợ đọc từng mục và đánh dấu đã đọc; đây là fallback an toàn khi push có điểm đến không hỗ trợ.
- **Trợ giúp** có AI chat trong app. Nó trả phản hồi đã kiểm tra hoặc trạng thái escalation, không cam kết có nhân viên trả lời ngay.

### Gửi yêu cầu trợ giúp đúng cách

Khi có vấn đề về đơn, hãy mở đúng đơn trước. Trong Trợ giúp, nêu trạng thái đơn
đang thấy, điều bạn mong đợi, điều đã xảy ra và đúng mã lỗi nếu có. Không gửi
mật khẩu hay thông tin xác thực tài khoản vào chat. Cách này giúp hỗ trợ có ngữ
cảnh thay vì phải đoán đơn cần xử lý.

## Xử lý sự cố

| Dấu hiệu | Cách xử lý |
|---|---|
| Không có hộp thoại quyền | Kiểm tra quyền FoodFlow trong cài đặt thiết bị, rồi quay lại app. |
| Không có vị trí gần hoặc route | Kiểm tra quyền vị trí và mạng. Bản đồ cố ý không hiện route/ETA bịa ra. |
| Vị trí địa chỉ bị yêu cầu hoặc không hợp lệ | Thêm lại địa chỉ và chạm một điểm giao hợp lệ trên bản đồ trước khi lưu. |
| Checkout không đi tiếp | Kiểm tra địa chỉ hợp lệ, chờ giá giao hàng, rồi xem lại thanh toán, tồn kho và voucher. |
| Không nhận push | Kiểm tra quyền thông báo và cài đặt thiết bị. Inbox là fallback trong app; Firebase phụ thuộc build. |
| Cần hỗ trợ đơn | Mở đúng đơn trước, rồi dùng Trợ giúp/AI chat và nêu trạng thái hoặc mã lỗi đang thấy. |

## Ranh giới visual và release

[Gallery sản phẩm](./product-gallery.vi.md#customer) có một ảnh Customer discovery test-only đã review riêng tư từ Android API 35 dùng GPS mô phỏng. Đây là evidence regression từ workspace dirty, không phải bằng chứng release hay production. GIF Admin/Restaurant chỉ giữ cho luồng web tương ứng, không được gắn lại thành UI Customer; hiện chưa có GIF Customer.

Xem [hướng dẫn mobile Customer/Driver](./customer-driver-guide.vi.md) và [mobile README](../mobile/README.md) để biết runtime, cấu hình và lệnh build.
