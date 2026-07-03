# AI Chatbot Guide

Languages: [English](./ai-chatbot-guide.md) | [Tiếng Việt](./ai-chatbot-guide.vi.md) | [日本語](./ai-chatbot-guide.ja.md)

FoodFlow uses an LLM-first chatbot path in Batch 4. The chatbot is owned by the backend AI module, not by an external workflow engine.

## Runtime direction

- Default provider: DeepSeek V4 Flash through the backend provider adapter.
- Entry point: backend `/ai/stream` and related AI tool endpoints.
- No runtime dependency on an external workflow engine.
- Missing or failing model configuration returns an explicit degraded response.
- Recommendation features should use real order, menu, restaurant, user, and support context through backend tools; they must not invent unavailable business data.

## Required configuration

Store real values only in ignored `.env` files or provider secret stores.

| Variable | Purpose |
|---|---|
| `DEEPSEEK_API_KEY` | LLM provider key for chatbot replies |
| `DEEPSEEK_BASE_URL` | OpenAI-compatible provider URL |
| `DEEPSEEK_MODEL` | Model name, default `deepseek-v4-flash` |
| `DEEPSEEK_TIMEOUT_MS` | Upstream timeout |
| `AI_SERVICE_JWT_SECRET` | Service-to-service tool authorization |

Any key pasted into chat, screenshots, logs, tickets, or Git history must be rotated before production.

## Product behavior

- Prefer fast-path answers for safe static questions.
- Use tool-grounded answers for order, refund, restaurant, delivery, or user-specific claims.
- Escalate to support when confidence is low, safety policy blocks the answer, or customer intent requires human handling.
- Do not fabricate refunds, delivery ETAs, promotion eligibility, restaurant availability, or support outcomes.

## Validation

Before release, run:

- Backend AI focused unit tests.
- Seeded AI chatbot E2E scenarios.
- Prompt-injection and no-false-promise checks.
- Secret scan over env examples and docs.
- Admin AI monitor checks for configured and degraded states.
