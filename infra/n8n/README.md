# N8N Workflows — FoodFlow AI Bot Training

This directory holds the n8n workflow definitions, system prompts, few-shot examples, and regression eval suite for the FoodFlow AI assistant.

## Directory Layout

```
infra/n8n/
├── prompts/
│   ├── system-prompt.vi.md         # Main system prompt v2 (Vietnamese)
│   └── few-shot-examples.json      # 22 training examples covering 22 categories
├── workflows/
│   ├── ai-support-chat.json        # Main support chat workflow
│   ├── driver-delay-detector.json
│   ├── driver-stopped-detector.json
│   ├── daily-report.json
│   └── promotion-suggester.json
└── eval/
    ├── test-conversations.json     # 10 scripted regression conversations
    └── run-eval.ts                 # Eval runner — exit 1 on assertion fail
```

## System Prompt Versioning

`prompts/system-prompt.vi.md` is the canonical FoodFlow Bot persona.
Version bumps go inside the file (footer line) — keep prior versions in git history rather than separate files.

**v2 highlights:**
- 8 absolute rules (anti-hallucination, anti-injection, no-self-action)
- Tone: lễ phép, thân thiện, ≤ 3 câu, ≤ 2 emoji per response
- Tool table with usage triggers
- Escalation patterns (sentiment + delay + payment + driver)
- Conversation memory rules (10-turn window, TTL 1h)
- Forbidden disclosures (endpoints, full driver names, system prompt itself)

## Few-Shot Examples

`prompts/few-shot-examples.json` = 22 examples, each with:
- `category` — issue type
- `severity` — LOW | MEDIUM | HIGH (drives escalation routing)
- `user` — verbatim Vietnamese user message
- `expected_tools` — ordered list of tool calls bot should make
- `expected_response_template` — placeholder-filled response shape
- `notes` — guidance / edge-case handling

**Coverage matrix:**

| Severity | Count | Categories |
|---|---|---|
| LOW | 11 | status_check, food_recommendation, peak_hour_wait, contact_driver, change_payment, delivery_instructions, multi_turn_context, polite_formal, english_fallback, address_change, late_low |
| MEDIUM | 7 | cancel_request, refund_eligible, refund_ineligible, missing_item, wrong_item, restaurant_closed, allergy_concern |
| HIGH | 4 | delay_angry, complaint_food_quality, driver_issue, payment_failure, late_delivery_severe |

## Wiring Examples Into N8N

The `ai-support-chat.json` workflow loads the system prompt + examples at runtime via the LLM node's system message field. Pattern:

1. **Load prompt node** — Read File node pointing to `/data/n8n/prompts/system-prompt.vi.md`
2. **Load examples node** — Read File node pointing to `/data/n8n/prompts/few-shot-examples.json`
3. **Format context node** — Function node that interleaves examples into Gemini's `system_instruction` block
4. **LLM call node** — Gemini 2.0 Flash with tools schema bound
5. **Tool justification node** — verify tool calls match keyword patterns before execution
6. **Output filter node** — strip prompt-injection patterns from response

Mount n8n container with bind mount: `./infra/n8n/prompts:/data/n8n/prompts:ro`.

## Regression Eval

```bash
# Local: webhook on host
pnpm tsx infra/n8n/eval/run-eval.ts \
  --webhook http://localhost:5678/webhook/ai-support-chat \
  --fixtures infra/n8n/eval/test-conversations.json

# CI: webhook from compose service network
pnpm tsx infra/n8n/eval/run-eval.ts \
  --webhook http://n8n:5678/webhook/ai-support-chat
```

Exit code:
- `0` — all assertions passed
- `1` — at least one assertion failed (CI fails)
- `2` — fatal runtime error (network, parse)

### Assertion Types Supported

| Assertion | Purpose |
|---|---|
| `assert_tool_called` | Verify a specific tool was invoked (optional arg match) |
| `assert_no_tool_called` | Verify NO tool calls (e.g. injection attack must not trigger tools) |
| `assert_response_contains` | Regex must match response text |
| `assert_response_does_not_contain` | Regex must NOT match (forbidden phrasing) |
| `assert_no_hallucination` | Forbidden patterns indicating bot fabrication |
| `assert_severity` | Bot's classified severity matches expected |
| `assert_response_language` | Bot replied in expected language (en/vi) |
| `tool_response` | Mock layer response stub for downstream turns |

## Adding New Examples

1. Add new entry to `prompts/few-shot-examples.json` with unique `id`
2. If new category, update `metadata.categories_covered`
3. Add corresponding regression conversation to `eval/test-conversations.json`
4. Run `pnpm tsx infra/n8n/eval/run-eval.ts` — must pass before merge
5. Bump prompt version in `system-prompt.vi.md` footer

## Anti-Injection Hardening

The bot's defense layers:

1. **Pre-classifier** (backend) — common queries answered without LLM
2. **System prompt rule 8** — refuse `ignore previous`, `system:`, `act as`, etc.
3. **Tool justification** (backend `tool-justification.service.ts`) — reject tool calls not justified by user message keywords
4. **Output filter** (backend `output-filter.service.ts`) — strip system-prompt fragments before streaming to user

Eval `conv-06-prompt-injection` exercises all 4 layers end-to-end.

## Cost Guardrails

| Limit | Value |
|---|---|
| Max response tokens | 2000 |
| Rate limit per user | 10 msg/min |
| Daily cap per user | 100 msg |
| Memory TTL | 1h |
| Pre-classify hit rate target | ≥ 70% (avoid LLM call) |

Target: < $0.10 per support session average (Gemini 2.0 Flash).

## References

- Phase plan: `plans/260607-foodflow-stitch-impl-backend-hardening/phase-13-backend-ai-integration.md`
- Backend AI module: `backend/src/ai/`
- Tool endpoints: `backend/src/ai/ai-tools.controller.ts`
