import type { KnowledgeEntry } from '../rag/rag-document.types'

/**
 * Vietnamese FAQ knowledge base for FoodFlow chatbot.
 * Each entry is a self-contained Q&A chunk optimised for semantic retrieval.
 */
export const FAQ_VI: KnowledgeEntry[] = [
  // ── Đặt món ──────────────────────────────────────────────────────────────
  {
    docType: 'faq',
    locale: 'vi',
    title: 'Cách đặt món trên FoodFlow',
    content:
      'Để đặt món, mở ứng dụng FoodFlow → chọn nhà hàng → thêm món vào giỏ hàng → nhấn "Đặt hàng" → chọn địa chỉ giao hàng → chọn phương thức thanh toán → xác nhận đơn. Bạn sẽ nhận thông báo xác nhận qua ứng dụng.',
  },
  {
    docType: 'faq',
    locale: 'vi',
    title: 'Có thể đặt nhiều món từ nhiều nhà hàng không?',
    content:
      'Mỗi đơn hàng chỉ có thể đặt từ một nhà hàng. Nếu bạn muốn đặt từ nhiều nhà hàng, hãy tạo nhiều đơn hàng riêng biệt.',
  },
  {
    docType: 'faq',
    locale: 'vi',
    title: 'Thời gian giao hàng ước tính là bao lâu?',
    content:
      'Thời gian giao hàng trung bình từ 20–45 phút tuỳ theo khoảng cách, tình trạng nhà hàng và mật độ tài xế trong khu vực. Ứng dụng hiển thị thời gian ước tính sau khi bạn đặt hàng.',
  },
  {
    docType: 'faq',
    locale: 'vi',
    title: 'Làm sao theo dõi đơn hàng đang giao?',
    content:
      'Vào mục "Đơn hàng của tôi" → chọn đơn hàng đang giao → xem bản đồ theo dõi tài xế theo thời gian thực. Bạn cũng nhận được thông báo tự động khi đơn chuyển trạng thái.',
  },
  {
    docType: 'faq',
    locale: 'vi',
    title: 'Tôi có thể thêm ghi chú cho đơn hàng không?',
    content:
      'Có. Ở bước xem giỏ hàng, có ô "Ghi chú cho nhà hàng" để bạn yêu cầu thêm không ớt, ít dầu, đặc biệt… Nhà hàng sẽ cố gắng đáp ứng nhưng không đảm bảo 100%.',
  },

  // ── Huỷ đơn & Thay đổi ───────────────────────────────────────────────────
  {
    docType: 'faq',
    locale: 'vi',
    title: 'Tôi có thể huỷ đơn hàng không?',
    content:
      'Bạn có thể huỷ đơn miễn phí trong vòng 2 phút sau khi đặt, hoặc khi nhà hàng chưa xác nhận. Sau khi nhà hàng bắt đầu chuẩn bị, đơn không thể huỷ qua ứng dụng — hãy liên hệ bộ phận hỗ trợ.',
  },
  {
    docType: 'faq',
    locale: 'vi',
    title: 'Tôi có thể thay đổi địa chỉ giao hàng sau khi đặt không?',
    content:
      'Thay đổi địa chỉ sau khi đặt không được hỗ trợ qua ứng dụng. Vui lòng liên hệ hỗ trợ ngay lập tức nếu bạn cần điều chỉnh; chúng tôi sẽ cố gắng xử lý nếu tài xế chưa lấy hàng.',
  },

  // ── Thanh toán ────────────────────────────────────────────────────────────
  {
    docType: 'faq',
    locale: 'vi',
    title: 'Các phương thức thanh toán được hỗ trợ',
    content:
      'FoodFlow hỗ trợ: (1) Ví FoodFlow — nạp tiền trước và thanh toán nhanh; (2) Tiền mặt khi nhận hàng (COD); (3) Chuyển khoản ngân hàng qua SePay. Thẻ tín dụng/ghi nợ quốc tế đang được phát triển.',
  },
  {
    docType: 'faq',
    locale: 'vi',
    title: 'Nạp tiền vào ví FoodFlow như thế nào?',
    content:
      'Vào "Ví của tôi" → "Nạp tiền" → nhập số tiền → chọn chuyển khoản ngân hàng → thực hiện chuyển khoản đến tài khoản SePay hiển thị với đúng nội dung chuyển khoản. Số dư cập nhật tự động trong 1–3 phút.',
  },
  {
    docType: 'faq',
    locale: 'vi',
    title: 'Tại sao đơn hàng của tôi hiển thị "Chờ thanh toán"?',
    content:
      'Trạng thái "Chờ thanh toán" xuất hiện khi hệ thống chưa nhận được xác nhận thanh toán. Với chuyển khoản, hãy đợi 3–5 phút và kiểm tra lại. Nếu đã quá 10 phút, liên hệ hỗ trợ kèm ảnh chụp màn hình giao dịch.',
  },

  // ── Hoàn tiền ─────────────────────────────────────────────────────────────
  {
    docType: 'faq',
    locale: 'vi',
    title: 'Chính sách hoàn tiền của FoodFlow',
    content:
      'Hoàn tiền được xem xét trong các trường hợp: đơn bị huỷ sau khi đã thanh toán; món không đúng với mô tả; thiếu món hoặc sai món; tài xế không giao hàng. Tiền hoàn về ví FoodFlow trong 24 giờ hoặc tài khoản ngân hàng trong 3–5 ngày làm việc.',
  },
  {
    docType: 'faq',
    locale: 'vi',
    title: 'Làm sao yêu cầu hoàn tiền?',
    content:
      'Vào "Đơn hàng của tôi" → chọn đơn cần yêu cầu → "Báo cáo sự cố" → mô tả vấn đề và đính kèm ảnh nếu cần. Hoặc chat trực tiếp với trợ lý AI và ghi rõ mã đơn hàng; AI sẽ kiểm tra tự động điều kiện hoàn tiền.',
  },
  {
    docType: 'faq',
    locale: 'vi',
    title: 'Bao lâu thì nhận được tiền hoàn?',
    content:
      'Sau khi yêu cầu được duyệt: hoàn vào ví FoodFlow trong 24 giờ; hoàn về ngân hàng trong 3–5 ngày làm việc. Bạn sẽ nhận thông báo khi tiền được xử lý.',
  },

  // ── Phí giao hàng ─────────────────────────────────────────────────────────
  {
    docType: 'faq',
    locale: 'vi',
    title: 'Phí giao hàng được tính như thế nào?',
    content:
      'Phí giao hàng tính theo khoảng cách từ nhà hàng đến địa chỉ giao. Phí cơ bản áp dụng cho 1–3 km đầu, sau đó tính theo km. Phí hiển thị rõ trước khi bạn xác nhận đặt hàng. Một số nhà hàng có chương trình miễn phí giao hàng từ giá trị đơn tối thiểu.',
  },
  {
    docType: 'faq',
    locale: 'vi',
    title: 'Làm sao được miễn phí giao hàng?',
    content:
      'Miễn phí giao hàng khi: (1) Áp dụng mã khuyến mãi miễn phí ship; (2) Đơn hàng đạt ngưỡng tối thiểu của chương trình khuyến mãi nhà hàng; (3) Thành viên hạng Gold/Platinum và Điểm thưởng đủ điều kiện.',
  },

  // ── Loyalty & Điểm thưởng ─────────────────────────────────────────────────
  {
    docType: 'faq',
    locale: 'vi',
    title: 'Chương trình tích điểm FoodFlow hoạt động như thế nào?',
    content:
      'Mỗi 10.000đ chi tiêu = 1 điểm FoodFlow. Điểm dùng để đổi voucher giảm giá, miễn phí giao hàng hoặc quà tặng. Điểm có hiệu lực 12 tháng kể từ ngày tích. Tích điểm áp dụng cho thanh toán qua ví và chuyển khoản.',
  },
  {
    docType: 'faq',
    locale: 'vi',
    title: 'Xem và đổi điểm thưởng ở đâu?',
    content:
      'Vào "Tài khoản" → "Điểm thưởng & Hạng thành viên". Ở đây bạn thấy tổng điểm, lịch sử điểm và danh sách phần thưởng có thể đổi. Nhấn "Đổi điểm" để chọn phần thưởng.',
  },
  {
    docType: 'faq',
    locale: 'vi',
    title: 'Hạng thành viên và quyền lợi',
    content:
      'FoodFlow có 4 hạng: Bronze (mặc định), Silver (>500 điểm), Gold (>2.000 điểm), Platinum (>5.000 điểm). Hạng càng cao, tỷ lệ tích điểm càng lớn, ưu tiên hỗ trợ cao hơn và nhận ưu đãi độc quyền.',
  },

  // ── Khuyến mãi & Mã giảm giá ─────────────────────────────────────────────
  {
    docType: 'faq',
    locale: 'vi',
    title: 'Cách áp dụng mã giảm giá',
    content:
      'Ở bước thanh toán, nhập mã vào ô "Mã giảm giá / Coupon" → nhấn "Áp dụng". Giảm giá hiển thị ngay trong tổng đơn. Mỗi đơn chỉ dùng được 1 mã; mã không áp dụng khi đơn đã đặt.',
  },
  {
    docType: 'faq',
    locale: 'vi',
    title: 'Tại sao mã giảm giá của tôi không hoạt động?',
    content:
      'Mã có thể không hoạt động vì: đã hết hạn; chưa đến thời gian áp dụng; không đủ giá trị đơn tối thiểu; nhà hàng không tham gia chương trình; đã dùng tối đa số lần cho phép. Kiểm tra điều kiện mã trong mục "Khuyến mãi".',
  },

  // ── Thiếu món / Sai món ───────────────────────────────────────────────────
  {
    docType: 'faq',
    locale: 'vi',
    title: 'Tôi nhận được đơn bị thiếu món / sai món',
    content:
      'Chụp ảnh túi hàng và món nhận được → vào "Đơn hàng" → "Báo cáo sự cố" → chọn "Thiếu món" hoặc "Sai món" → đính kèm ảnh. Chúng tôi sẽ xem xét và hoàn tiền hoặc gửi lại trong vòng 24 giờ.',
  },
  {
    docType: 'faq',
    locale: 'vi',
    title: 'Tôi nhận được món ăn không đảm bảo chất lượng / nghi ngờ hư hỏng',
    content:
      'Đây là vấn đề nghiêm trọng. Không ăn món đó. Chụp ảnh ngay → báo cáo trong ứng dụng với lý do "Chất lượng món ăn" → nhóm hỗ trợ sẽ liên hệ trong vòng 1 giờ. Trường hợp dị ứng hoặc ngộ độc, liên hệ cơ sở y tế ngay.',
  },

  // ── Tài khoản ─────────────────────────────────────────────────────────────
  {
    docType: 'faq',
    locale: 'vi',
    title: 'Quên mật khẩu, làm sao đặt lại?',
    content:
      'Màn hình đăng nhập → "Quên mật khẩu" → nhập email đăng ký → kiểm tra hộp thư (bao gồm thư rác) để nhận liên kết đặt lại → liên kết có hiệu lực 60 phút.',
  },
  {
    docType: 'faq',
    locale: 'vi',
    title: 'Cách thay đổi số điện thoại / email tài khoản',
    content:
      'Vào "Tài khoản" → "Thông tin cá nhân" → chọn trường muốn thay đổi. Một mã OTP sẽ được gửi để xác minh. Số điện thoại/email mới phải chưa được dùng bởi tài khoản khác.',
  },
  {
    docType: 'faq',
    locale: 'vi',
    title: 'Làm sao xoá tài khoản FoodFlow?',
    content:
      'Vào "Tài khoản" → "Cài đặt" → "Xoá tài khoản" → xác nhận bằng mật khẩu. Dữ liệu sẽ bị xoá sau 30 ngày (trừ dữ liệu giao dịch giữ theo quy định pháp luật). Số dư ví còn lại cần rút trước khi xoá.',
  },

  // ── Tài xế & Giao hàng ───────────────────────────────────────────────────
  {
    docType: 'faq',
    locale: 'vi',
    title: 'Tài xế không liên lạc được / không giao hàng',
    content:
      'Nếu tài xế không phản hồi sau 5 phút gọi điện, hãy báo cáo qua "Đơn hàng" → "Báo cáo sự cố" → "Tài xế không liên lạc được". Hệ thống sẽ điều phối tài xế khác hoặc hoàn tiền đơn.',
  },
  {
    docType: 'faq',
    locale: 'vi',
    title: 'Tại sao đơn tôi bị giao trễ so với dự kiến?',
    content:
      'Giao trễ có thể do: tình trạng giao thông; nhà hàng chuẩn bị lâu hơn; thiếu tài xế trong khu vực; thời tiết xấu. Ứng dụng cập nhật thời gian ước tính theo thời gian thực. Nếu trễ quá 30 phút so với dự kiến, bạn có thể yêu cầu hỗ trợ.',
  },

  // ── Ứng dụng & Kỹ thuật ──────────────────────────────────────────────────
  {
    docType: 'faq',
    locale: 'vi',
    title: 'Ứng dụng FoodFlow bị lỗi hoặc không mở được',
    content:
      'Thử các bước: (1) Đóng và mở lại ứng dụng; (2) Kiểm tra kết nối internet; (3) Cập nhật ứng dụng lên phiên bản mới nhất; (4) Xoá cache ứng dụng trong cài đặt máy; (5) Khởi động lại thiết bị. Nếu vẫn lỗi, liên hệ hỗ trợ kỹ thuật.',
  },
  {
    docType: 'faq',
    locale: 'vi',
    title: 'Tôi không nhận được thông báo đơn hàng',
    content:
      'Kiểm tra: (1) Quyền thông báo cho FoodFlow trong cài đặt hệ thống; (2) Không bật Chế độ Không làm phiền; (3) Kết nối internet ổn định. Vào "Cài đặt" → "Thông báo" trong ứng dụng để bật lại thông báo.',
  },
]
