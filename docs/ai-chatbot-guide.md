# AI Chatbot Guide

Languages: [English](./ai-chatbot-guide.md) | [Tiếng Việt](./ai-chatbot-guide.vi.md) | [日本語](./ai-chatbot-guide.ja.md)

FoodFlow uses an LLM-first chatbot path in Batch 4. The backend AI module owns the runtime; no external automation runner or public AI-tool route is required.

## Runtime direction

- Provider: DeepSeek through the backend provider adapter, default model `deepseek-v4-flash`.
- Entry points: `POST /ai/chat` and `POST /ai/stream`, both authenticated.
- Internal grounding tools fetch real order, driver, restaurant, refund, recommendation, and support-ticket context.
- Tool calls are scoped to the authenticated `user.sub`; user-supplied order IDs are never trusted alone.
- Missing or failing model configuration returns `action: "degraded"` instead of a fabricated answer.

## Required configuration

Store real values only in ignored `.env` files or provider secret stores.

| Variable | Purpose |
|---|---|
| `DEEPSEEK_API_KEY` | LLM provider key for chatbot replies |
| `DEEPSEEK_BASE_URL` | OpenAI-compatible provider URL |
| `DEEPSEEK_MODEL` | Model name, default `deepseek-v4-flash` |
| `DEEPSEEK_TIMEOUT_MS` | Upstream timeout |

Any key pasted into chat, screenshots, logs, tickets, or Git history must be rotated before production.

## Product behavior

- Prefer fast-path answers for safe static questions.
- Use tool-grounded answers for order, refund, restaurant, delivery, or user-specific claims.
- Return `grounded` and `toolCalls` metadata so clients and tests can tell whether account-specific context was verified.
- Escalate to support for angry, safety, fraud, refund dispute, or repeated delivery failure cases.
- Do not fabricate refunds, delivery ETAs, promotion eligibility, restaurant availability, support outcomes, or admin notifications.

## Validation

Before release, run:

- Backend AI focused unit tests.
- Seeded AI chatbot E2E scenarios against `/ai/chat` with a real test JWT.
- Prompt-injection and no-false-promise checks.
- Tenant isolation tests for order and support-ticket tools.
- Secret scan over env examples, docs, and staged diff.
- Admin AI monitor checks for configured and degraded states.
