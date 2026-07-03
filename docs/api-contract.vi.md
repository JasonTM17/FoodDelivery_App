# Hợp đồng API

Ngôn ngữ: [English](./api-contract.md) | [Tiếng Việt](./api-contract.vi.md) | [日本語](./api-contract.ja.md)

Tài liệu này mô tả hợp đồng API cho web Admin và Restaurant trong Batch 4. Batch 4 không đổi hợp đồng customer/mobile cũ trừ khi endpoint được version hoặc có alias tương thích rõ ràng.

## Chính sách version

- Đường dẫn public có version dùng `/v1`, `/v2`, v.v.
- Endpoint web Batch 4 có thể giữ alias tương thích một chu kỳ nếu Admin hoặc Restaurant cũ đã dùng route đó.
- Breaking change cần version mới hoặc alias tương thích được ghi rõ.
- Thay đổi cộng thêm có thể ở cùng version.

Breaking change gồm xóa/đổi tên field, đổi kiểu field, biến optional thành required, xóa endpoint/enum, đổi auth/authz, hoặc đổi ngữ nghĩa pagination.

Không phải breaking change: thêm endpoint, thêm field optional, thêm enum value, nới validation, hoặc đổi câu chữ lỗi trong khi giữ nguyên `code`.

## Envelope thành công

Response thành công cho web/admin/restaurant dùng một dạng:

```json
{
  "success": true,
  "data": {},
  "meta": {}
}
```

`meta` là optional cho response một resource. Endpoint collection đặt danh sách trong `data` và thông tin trang/tổng hợp trong `meta`.

```json
{
  "success": true,
  "data": [],
  "meta": {
    "total": 0,
    "page": 1,
    "limit": 20,
    "hasMore": false
  }
}
```

## Dạng lỗi

Lỗi dùng RFC 7807 Problem Details và không bọc trong success envelope.

```json
{
  "type": "https://api.foodflow.vn/errors/validation",
  "title": "Validation Error",
  "status": 422,
  "detail": "Email khong dung dinh dang",
  "instance": "/v1/auth/register",
  "code": "VALIDATION_INVALID_EMAIL"
}
```

Client phải rẽ nhánh theo `code`, không dựa vào text đã dịch.

| Code | Ý nghĩa |
|---|---|
| `AUTH_INVALID_CREDENTIALS` | Sai email hoặc mật khẩu. |
| `AUTH_ACCOUNT_LOCKED` | Tài khoản bị khóa tạm thời. |
| `VALIDATION_INVALID_EMAIL` | Email sai định dạng. |
| `ORDER_CANNOT_CANCEL` | Đơn đã đi quá xa trong luồng để hủy. |
| `PAYMENT_INSUFFICIENT_BALANCE` | Số dư ví không đủ. |
| `PROMOTION_EXPIRED` | Khuyến mãi đã hết hạn. |
| `PROMOTION_LIMIT_REACHED` | Khuyến mãi đã hết lượt dùng. |
| `DUPLICATE_REQUEST` | Dùng lại idempotency key. |
| `NOT_FOUND` | Resource không tồn tại hoặc không hiển thị với actor. |
| `FORBIDDEN` | Actor thiếu quyền. |

## Pagination

Endpoint collection dùng:

- `data`: mảng resource.
- `meta.total`: tổng số resource khớp khi có thể tính.
- `meta.page`: số trang bắt đầu từ 1.
- `meta.limit`: kích thước trang.
- `meta.hasMore`: còn trang tiếp theo hay không.

Endpoint cursor-based có thể thêm cursor vào `meta`, nhưng collection vẫn nằm trong `data`.

## Auth và refresh

- Web dashboard dùng bearer access token trong Batch 4.
- Request refresh phải dùng access token hiện tại và không retry với header `Authorization` cũ.
- Web API client chặn vòng lặp refresh.
- Khi hết phiên, redirect phải giữ locale hiện tại.
- Chuyển web auth sang httpOnly cookie là hạng mục riêng, không thuộc Batch 4.

## Quy ước HMAC

### Webhook SePay inbound

| Field | Giá trị |
|---|---|
| Header | `x-sepay-signature` |
| Algorithm | HMAC-SHA256 |
| Input | Raw request body |
| Secret | `SEPAY_WEBHOOK_SECRET` |
| Replay protection | Redis deduplication key theo transaction reference, TTL 24h |

Luồng verify: đọc header, tính HMAC trên raw body, so sánh timing-safe, reject bằng `WEBHOOK_INVALID_SIGNATURE` nếu sai, deduplicate transaction đã xử lý, rồi persist kết quả thanh toán.

### Webhook service outbound

| Field | Giá trị |
|---|---|
| Header | `X-Signature-SHA256` |
| Algorithm | HMAC-SHA256 |
| Input | Raw request body |
| Secret | `WEBHOOK_SECRET` hoặc secret riêng theo target |

LLM tools và service receiver nội bộ khác phải verify chữ ký trước khi xử lý.

### Callback API key

| Header | Secret |
|---|---|
| `x-api-key` | `SERVICE_API_KEY` hoặc service key riêng theo endpoint |

## Idempotency

Mutation có thể tạo giao dịch tiền hoặc công việc vận hành trùng lặp nhận header:

```http
Idempotency-Key: <UUID v4>
```

Server giữ replay guard 24 giờ. Request trùng không chạy mutation lần hai.

## Nguồn OpenAPI

- Spec chuẩn: [openapi.yaml](./openapi.yaml)
- Changelog: [openapi/changelog.md](./openapi/changelog.md)
- Web client package: `web/packages/api-client`

OpenAPI phải mô tả endpoint Admin và Restaurant mà web dùng trước khi coi endpoint đó hoàn tất.

## CI gate

Workflow OpenAPI kiểm Spectral lint, YAML hợp lệ, typecheck generated client, và contract tests cho hành vi rủi ro cao khi route thay đổi.
