# ai — Backend Service

## Purpose

AI customer-support assistant proxy. SSE streaming chat endpoint, conversation memory Redis (10 turns × 1h TTL), sentiment detection (regex + keyword Vietnamese), tool-call justification (keyword match before execution), output filter (strip injection patterns), pre-classification fast-path (~70% queries answered without LLM). Runtime chat can use direct DeepSeek V4 Flash or the legacy N8N workflow. N8N still owns the service-JWT tool endpoints.

## API surface

- `POST /ai/stream` — SSE streaming chat (auth required)
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
| `AI_CHAT_PROVIDER` | no | auto | `deepseek` or `n8n`. Auto selects DeepSeek when `DEEPSEEK_API_KEY` exists, otherwise N8N |
| `DEEPSEEK_API_KEY` | no | — | DeepSeek API key for direct chatbot replies. Store as secret, never commit |
| `DEEPSEEK_BASE_URL` | no | `https://api.deepseek.com` | OpenAI-compatible DeepSeek base URL |
| `DEEPSEEK_MODEL` | no | `deepseek-v4-flash` | Direct chatbot model |
| `DEEPSEEK_THINKING` | no | `disabled` | Set `enabled` for slower high-effort reasoning |
| `DEEPSEEK_REASONING_EFFORT` | no | `high` | `high` or `max` when thinking is enabled |
| `DEEPSEEK_MAX_OUTPUT_TOKENS` | no | `600` | Direct chatbot response cap |
| `DEEPSEEK_TIMEOUT_MS` | no | `15000` | Direct chatbot upstream timeout |
| `N8N_WEBHOOK_URL` | no | `http://n8n:5678/webhook/ai-support-chat` | Legacy workflow endpoint |
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

- **DeepSeek missing/down:** Backend emits `i18n.t('ai_templates.service_unavailable')` and marks the reply as `degraded`; it does not fabricate a successful answer.
- **N8N down:** Legacy provider emits the same degraded response. Customer sees graceful message; ticket auto-created if severity HIGH.
- **Hallucination report:** Inspect `ai_chat_audit` table. Tool-grounded mode requires tool call before reference đến order data — if missing, response was fabricated.
- **Cost runaway:** Rate limiter `AI_CHAT_RATE_LIMIT_PER_MIN` + daily cap. Pre-classify hit-rate target ≥ 70% (see Prometheus `ai_classify_hit_total`).
- **Prompt update:** Edit `infra/n8n/prompts/system-prompt.vi.md` → bump version footer → restart n8n container (bind mount auto-reloads).
