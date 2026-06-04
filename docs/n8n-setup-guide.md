# N8N Setup Guide

## Quick Start

N8N is running in Docker at http://localhost:5678

### 1. Create Owner Account (First Time)
Open http://localhost:5678 in browser → fill in owner email/password

### 2. Import Workflows
- Go to Settings → Import
- Import each JSON from `infra/n8n/workflows/`:
  - `ai-support-chat.json` — AI customer support
  - `driver-delay-detector.json` — Delay monitoring
  - `driver-stopped-detector.json` — Driver inactivity
  - `daily-report.json` — Daily revenue report
  - `promotion-suggester.json` — Weekly promo suggestions

### 3. Configure Credentials
- **Backend API:** Set webhook URLs to `http://backend:3001/api/webhooks/n8n/`
- **Gemini AI:** Add API key from Google AI Studio
- **Email:** Configure SMTP for reports

### 4. Activate Workflows
Toggle each workflow from Inactive → Active

## Workflow Details

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| AI Support Chat | Webhook POST /chat | Customer service chatbot |
| Driver Delay | Cron */1 * * * * | Detect delayed orders |
| Driver Stopped | Cron */2 * * * * | Detect idle drivers |
| Daily Report | Cron 0 22 * * * | Revenue + stats report |
| Promotion | Cron 0 9 * * 1 | Lapsed customer promos |

## Verification

```bash
# Test AI chat webhook
curl -X POST http://localhost:5678/webhook/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Đơn FD-240604-0001 của tôi đang ở đâu?","userId":"test","sessionId":"test-1"}'

# Test N8N health
curl http://localhost:5678/healthz
```
