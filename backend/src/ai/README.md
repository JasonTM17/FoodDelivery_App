# ai — Backend Service

## Purpose

AI customer-support assistant proxy. SSE streaming chat endpoint, conversation memory Redis (10 turns × 1h TTL), sentiment detection (regex + keyword Vietnamese), tool-call justification (keyword match before execution), output filter (strip injection patterns), pre-classification fast-path (~70% queries answered without LLM). Routes through N8N workflow `ai-support-chat` to Gemini với 8 tool endpoints. System prompt v2 + 22 few-shot examples loaded from `infra/n8n/prompts/`.

## API surface

- `POST /ai/chat/stream` — SSE streaming chat (auth required)
- `POST /ai/chat/classify` — Pre-classification fast-path (Accept-Language aware)
- `GET /ai/tools/order-status/:orderId` — Tool endpoint (service-JWT only)
- `GET /ai/tools/driver-location/:orderId`
- `GET /ai/tools/restaurant-status/:orderId`
- `GET /ai/tools/refund-eligibility/:orderId`
- `POST /ai/tools/create-ticket`
- `GET /ai/tools/nearby-restaurants?lat=&lng=`
- `GET /ai/tools/recommended-foods/:userId`
- `POST /ai/tools/notify-admin`

## Env vars

| Name | Required | Default | Description |
|---|---|---|---|
| `N8N_WEBHOOK_URL` | no | `http://n8n:5678/webhook/ai-support-chat` | Workflow endpoint |
| `AI_SERVICE_JWT_SECRET` | yes | — | Service-to-service JWT for tool endpoints |
| `AI_CHAT_RATE_LIMIT_PER_MIN` | no | `10` | Per-user msg cap |
| `AI_CHAT_DAILY_CAP` | no | `100` | Per-user daily msg cap |
| `MEMORY_TTL_SEC` | no | `3600` | Conversation memory Redis TTL |

## Test

```bash
npx jest ai
# Eval (e2e): pnpm tsx infra/n8n/eval/run-eval.ts --webhook http://localhost:5678/webhook/ai-support-chat
```

## Runbook

- **N8N down:** Backend fallback emits `i18n.t('ai_templates.service_unavailable')`. Customer sees graceful message; ticket auto-created if severity HIGH.
- **Hallucination report:** Inspect `ai_chat_audit` table. Tool-grounded mode requires tool call before reference đến order data — if missing, response was fabricated.
- **Cost runaway:** Rate limiter `AI_CHAT_RATE_LIMIT_PER_MIN` + daily cap. Pre-classify hit-rate target ≥ 70% (see Prometheus `ai_classify_hit_total`).
- **Prompt update:** Edit `infra/n8n/prompts/system-prompt.vi.md` → bump version footer → restart n8n container (bind mount auto-reloads).
