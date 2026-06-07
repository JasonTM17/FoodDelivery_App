# chat — Backend Service

## Purpose

WebSocket-based chat between customer and driver during active delivery. Auto-opens when driver assigned, closes after delivered + 24h grace. Stores message history in Redis (TTL 24h post-delivery) for replay. Vietnamese profanity filter.

## API surface

- `WebSocket /chat` — Bi-directional message stream
- Events: `chat:join`, `chat:message`, `chat:typing`, `chat:read-receipt`, `chat:close`
- `GET /chat/orders/:orderId/history` — REST replay (admin support)

## Env vars

| Name | Default | Description |
|---|---|---|
| `CHAT_HISTORY_TTL_HOURS` | `48` | Redis retention after delivery |
| `CHAT_MESSAGE_MAX_LENGTH` | `500` | Per-message char cap |

## Test

```bash
npx jest chat
```

## Runbook

- **Stale chat session:** Auto-close when order transitions to `delivered` + grace window expires.
- **Profanity flag:** Message with profanity score > threshold logged to `chat_audit` for admin review (not auto-blocked, just flagged).
- **Driver disconnect:** WS gateway buffers messages 30s before fail; falls back to FCM push when chat closed.
