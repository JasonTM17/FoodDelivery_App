# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 0.1.x   | Yes       |

## Reporting a Vulnerability

Báo cáo lỗ hổng bảo mật qua email: jasonbmt06@gmail.com

Thời gian phản hồi: trong vòng 48 giờ.

## Security Measures

### Authentication
- JWT access token (HS256, 15 phút)
- Refresh token rotation (7 ngày, blocklist trong Redis)
- bcrypt password hashing (cost factor 12)
- Account lockout sau 5 lần đăng nhập sai

### Authorization
- Role-Based Access Control (RBAC): customer, driver, restaurant, admin
- Guards trên tất cả protected endpoints
- Admin audit log ghi lại mọi hành động quản trị

### API Security
- Helmet security headers
- CORS restricted origins
- Rate limiting: 100 req/phút global, 5 req/phút login
- Input validation qua Zod/class-validator
- SQL injection prevention (Prisma parameterized queries)

### Real-time Security
- WebSocket CORS origin restriction
- JWT authentication trên WebSocket handshake
- Room-based access control (chỉ customer của đơn mới xem được vị trí tài xế)

### Data Protection
- Không lưu thông tin thẻ thật (MVP: mock payment)
- Location data chỉ shared với customer của đơn hàng đó
- PII không gửi đến AI assistant
- API keys không commit vào git

### Production Upgrade Path
- HS256 → Ed25519 asymmetric keys
- JWKS endpoint cho service-to-service auth
- Docker secrets thay vì environment variables
- HTTPS/TLS với Let's Encrypt
