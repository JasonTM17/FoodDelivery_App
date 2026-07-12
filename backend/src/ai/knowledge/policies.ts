import type { KnowledgeEntry } from '../rag/rag-document.types'

/**
 * FoodFlow app policies — used by RAG to answer policy-related questions.
 * Bi-lingual entries (one vi, one en per policy topic).
 */
export const POLICIES: KnowledgeEntry[] = [
  // ── Chính sách hoàn tiền (vi) ─────────────────────────────────────────────
  {
    docType: 'policy',
    locale: 'vi',
    title: 'Chính sách hoàn tiền chi tiết',
    content: `FoodFlow hỗ trợ hoàn tiền trong các trường hợp sau:
1. Đơn bị huỷ sau khi đã thanh toán: hoàn 100%.
2. Thiếu món: hoàn giá trị món thiếu + phí giao tương ứng.
3. Sai món: hoàn giá trị món không đúng hoặc giao lại miễn phí.
4. Tài xế không giao hàng và không liên lạc được: hoàn 100%.
5. Chất lượng món không đảm bảo (có bằng chứng ảnh): xem xét hoàn một phần hoặc toàn bộ.
6. Nhà hàng đóng cửa sau khi đã đặt: hoàn 100%.

Không hoàn tiền khi: khách hàng đặt nhầm món; không thích hương vị; thay đổi ý muốn sau khi nhà hàng đã chuẩn bị.

Thời gian xử lý: Ví FoodFlow 24 giờ; Ngân hàng 3–5 ngày làm việc.`,
  },
  // ── Refund Policy (en) ────────────────────────────────────────────────────
  {
    docType: 'policy',
    locale: 'en',
    title: 'Refund Policy Details',
    content: `FoodFlow issues refunds in the following cases:
1. Order cancelled after payment: 100% refund.
2. Missing items: refund for the missing item value plus proportional delivery fee.
3. Wrong items: refund or free re-delivery.
4. Driver did not deliver and is unreachable: 100% refund.
5. Food quality issue with photo evidence: partial or full refund at review.
6. Restaurant closed after order was placed: 100% refund.

Refunds are NOT issued for: ordering the wrong item by mistake; disliking the taste; changing your mind after the restaurant starts preparing.

Processing time: FoodFlow Wallet 24 hours; Bank account 3–5 business days.`,
  },

  // ── Chính sách bảo mật (vi) ───────────────────────────────────────────────
  {
    docType: 'policy',
    locale: 'vi',
    title: 'Chính sách bảo mật và quyền riêng tư',
    content: `FoodFlow cam kết bảo mật thông tin cá nhân của bạn:
- Thông tin tài khoản (họ tên, email, số điện thoại) được mã hóa và không bán cho bên thứ ba.
- Dữ liệu vị trí chỉ dùng để xác định địa chỉ giao hàng và không lưu trữ lịch sử vị trí cá nhân.
- Thông tin thanh toán được xử lý qua cổng thanh toán bảo mật (PCI-DSS), FoodFlow không lưu số thẻ.
- Bạn có quyền yêu cầu xuất, chỉnh sửa hoặc xoá dữ liệu cá nhân bất kỳ lúc nào qua Cài đặt tài khoản.`,
  },
  // ── Privacy Policy (en) ───────────────────────────────────────────────────
  {
    docType: 'policy',
    locale: 'en',
    title: 'Privacy and Data Protection Policy',
    content: `FoodFlow is committed to protecting your personal data:
- Account data (name, email, phone) is encrypted and never sold to third parties.
- Location data is used solely to determine your delivery address; personal location history is not stored.
- Payment data is handled through a PCI-DSS-compliant gateway; FoodFlow does not store card numbers.
- You may request export, correction, or deletion of your personal data at any time via Account Settings.`,
  },

  // ── Điều khoản sử dụng (vi) ───────────────────────────────────────────────
  {
    docType: 'policy',
    locale: 'vi',
    title: 'Điều khoản sử dụng FoodFlow',
    content: `Khi sử dụng FoodFlow, bạn đồng ý:
- Chỉ tạo một tài khoản thật và cung cấp thông tin chính xác.
- Không lạm dụng chương trình khuyến mãi hoặc tạo nhiều tài khoản để thu lợi bất hợp lệ.
- Không quấy rối, đe dọa tài xế hoặc nhân viên nhà hàng.
- Không sử dụng ứng dụng cho mục đích gian lận hoặc vi phạm pháp luật.
Vi phạm điều khoản có thể dẫn đến khóa tài khoản vĩnh viễn mà không hoàn số dư ví.`,
  },
  // ── Terms of Service (en) ─────────────────────────────────────────────────
  {
    docType: 'policy',
    locale: 'en',
    title: 'FoodFlow Terms of Service',
    content: `By using FoodFlow, you agree to:
- Maintain only one genuine account with accurate information.
- Not abuse promotions or create multiple accounts for fraudulent benefit.
- Not harass or threaten drivers or restaurant staff.
- Not use the app for fraudulent or illegal activities.
Violations may result in permanent account suspension without a wallet balance refund.`,
  },

  // ── Chính sách tài xế (vi) ────────────────────────────────────────────────
  {
    docType: 'policy',
    locale: 'vi',
    title: 'Tiêu chuẩn tài xế FoodFlow',
    content: `Tài xế FoodFlow được yêu cầu:
- Giữ đồ ăn nguyên vẹn, không mở túi/hộp thức ăn của khách.
- Giao đúng địa chỉ trong thời gian cam kết.
- Liên lạc lịch sự và chuyên nghiệp với khách hàng.
- Không yêu cầu thêm tiền ngoài phí đã thỏa thuận trong ứng dụng.
Nếu tài xế vi phạm, hãy báo cáo ngay trong ứng dụng để chúng tôi xử lý.`,
  },
  // ── Driver Standards (en) ─────────────────────────────────────────────────
  {
    docType: 'policy',
    locale: 'en',
    title: 'FoodFlow Driver Standards',
    content: `FoodFlow drivers are required to:
- Keep food intact and not open any packaging.
- Deliver to the correct address within the committed timeframe.
- Communicate politely and professionally with customers.
- Not request any additional payment beyond the in-app fee.
If a driver violates these standards, please report it immediately in the app.`,
  },
]
