#!/usr/bin/env tsx
/**
 * run-ai-scenarios.ts — Smoke gate for FoodFlow AI chat endpoint.
 *
 * Loads canonical-conversations.json, POSTs each user turn to the backend
 * AI endpoint, and validates assertions per turn.
 *
 * Usage:
 *   pnpm tsx e2e/ai-scenarios/run-ai-scenarios.ts \
 *     --endpoint http://localhost:3001/api/ai/chat \
 *     --fixtures e2e/ai-scenarios/canonical-conversations.json
 *
 * Exit code 0 if all assertions pass, 1 on assertion failures, 2 on fatal errors.
 */

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ConversationTurn {
  role: string
  message?: string
  tool?: string
  args?: Record<string, unknown>
  patterns?: string[]
  forbidden_patterns?: string[]
  level?: string
  language?: string
  data?: Record<string, unknown>
}

interface Conversation {
  id: string
  title: string
  context: Record<string, unknown>
  turns: ConversationTurn[]
}

interface Fixtures {
  conversations: Conversation[]
}

interface BotResponse {
  text: string
  toolCalls: Array<{ name: string; args: Record<string, unknown> }>
  severity?: string
  language?: string
}

interface AssertionResult {
  conversationId: string
  turnIndex: number
  assertion: string
  passed: boolean
  detail: string
}

// ---------------------------------------------------------------------------
// CLI argument parsing
// ---------------------------------------------------------------------------

function parseArgs(argv: string[]): { endpoint: string; fixtures: string } {
  const args: Record<string, string> = {}
  for (let i = 0; i < argv.length; i++) {
    const cur = argv[i]
    if (cur.startsWith('--')) {
      const key = cur.slice(2)
      const next = argv[i + 1]
      if (next && !next.startsWith('--')) {
        args[key] = next
        i++
      }
    }
  }
  return {
    endpoint:
      args.endpoint ??
      process.env.AI_ENDPOINT ??
      'http://localhost:3001/api/ai/chat',
    fixtures:
      args.fixtures ??
      'e2e/ai-scenarios/canonical-conversations.json',
  }
}

// ---------------------------------------------------------------------------
// HTTP helper — POST a user message to the backend AI endpoint
// ---------------------------------------------------------------------------

async function callEndpoint(
  endpoint: string,
  message: string,
  context: Record<string, unknown>,
  history: Array<{ role: string; message: string }>,
): Promise<BotResponse> {
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, context, history }),
    signal: AbortSignal.timeout(15_000),
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`AI endpoint ${res.status}: ${text.slice(0, 200)}`)
  }
  const json = (await res.json()) as Record<string, unknown>
  return {
    text: String(json.text ?? json.response ?? json.message ?? ''),
    toolCalls: Array.isArray(json.toolCalls)
      ? (json.toolCalls as Array<{ name: string; args: Record<string, unknown> }>)
      : [],
    severity: typeof json.severity === 'string' ? json.severity : undefined,
    language: typeof json.language === 'string' ? json.language : undefined,
  }
}

// ---------------------------------------------------------------------------
// Assertion helpers
// ---------------------------------------------------------------------------

function regexTest(text: string, pattern: string): boolean {
  return new RegExp(pattern, 'i').test(text)
}

function assertToolCalled(
  resp: BotResponse,
  tool: string,
  args?: Record<string, unknown>,
): { ok: boolean; detail: string } {
  const call = resp.toolCalls.find((c) => c.name === tool)
  if (!call) return { ok: false, detail: `tool "${tool}" not called` }
  if (args) {
    for (const [k, v] of Object.entries(args)) {
      if (call.args[k] !== v)
        return {
          ok: false,
          detail: `arg mismatch "${k}": got "${String(call.args[k])}" want "${String(v)}"`,
        }
    }
  }
  return { ok: true, detail: 'ok' }
}

// ---------------------------------------------------------------------------
// Per-conversation runner
// ---------------------------------------------------------------------------

async function runConversation(
  endpoint: string,
  conv: Conversation,
): Promise<AssertionResult[]> {
  const results: AssertionResult[] = []
  const history: Array<{ role: string; message: string }> = []
  let lastResp: BotResponse | null = null

  for (let i = 0; i < conv.turns.length; i++) {
    const turn = conv.turns[i]

    if (turn.role === 'user' && turn.message) {
      try {
        lastResp = await callEndpoint(endpoint, turn.message, conv.context, history)
        history.push({ role: 'user', message: turn.message })
        history.push({ role: 'assistant', message: lastResp.text })
      } catch (err) {
        results.push({
          conversationId: conv.id,
          turnIndex: i,
          assertion: 'endpoint_call',
          passed: false,
          detail: String(err),
        })
        return results // abort conversation on network error
      }
      continue
    }

    if (!lastResp) {
      results.push({
        conversationId: conv.id,
        turnIndex: i,
        assertion: turn.role,
        passed: false,
        detail: 'assertion before any user turn',
      })
      continue
    }

    let r: { ok: boolean; detail: string }

    switch (turn.role) {
      case 'assert_tool_called':
        r = assertToolCalled(lastResp, turn.tool ?? '', turn.args)
        break
      case 'assert_no_tool_called':
        r =
          lastResp.toolCalls.length === 0
            ? { ok: true, detail: 'ok' }
            : {
                ok: false,
                detail: `expected no tool calls, got: ${lastResp.toolCalls.map((c) => c.name).join(', ')}`,
              }
        break
      case 'assert_response_contains':
        r = (turn.patterns ?? []).every((p) => regexTest(lastResp!.text, p))
          ? { ok: true, detail: 'ok' }
          : {
              ok: false,
              detail: `missing pattern(s): ${(turn.patterns ?? []).filter((p) => !regexTest(lastResp!.text, p)).join(', ')}`,
            }
        break
      case 'assert_response_does_not_contain':
      case 'assert_no_hallucination': {
        const forbidden = (turn.patterns ?? turn.forbidden_patterns ?? []).filter((p) =>
          regexTest(lastResp!.text, p),
        )
        r =
          forbidden.length === 0
            ? { ok: true, detail: 'ok' }
            : { ok: false, detail: `forbidden pattern found: ${forbidden.join(', ')}` }
        break
      }
      case 'assert_severity':
        r =
          lastResp.severity === turn.level
            ? { ok: true, detail: 'ok' }
            : {
                ok: false,
                detail: `severity "${lastResp.severity}" expected "${turn.level}"`,
              }
        break
      case 'tool_response':
        // Stub — mock layer optional; just mark as pass
        r = { ok: true, detail: 'tool_response stub (no mock layer)' }
        break
      default:
        r = { ok: false, detail: `unknown assertion type: "${turn.role}"` }
    }

    results.push({ conversationId: conv.id, turnIndex: i, assertion: turn.role, ...r })
  }

  return results
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const { endpoint, fixtures } = parseArgs(process.argv.slice(2))
  const fixturesPath = resolve(process.cwd(), fixtures)
  const raw = readFileSync(fixturesPath, 'utf-8')
  const data = JSON.parse(raw) as Fixtures

  console.log(`[ai-scenarios] endpoint: ${endpoint}`)
  console.log(`[ai-scenarios] conversations: ${data.conversations.length}`)

  const allResults: AssertionResult[] = []

  for (const conv of data.conversations) {
    console.log(`\n  running ${conv.id}: ${conv.title}`)
    const results = await runConversation(endpoint, conv)
    allResults.push(...results)
    const fails = results.filter((r) => !r.passed)
    if (fails.length === 0) {
      console.log(`    ok (${results.length} assertions)`)
    } else {
      console.log(`    FAIL ${fails.length}/${results.length}`)
      for (const f of fails)
        console.log(`      turn ${f.turnIndex} [${f.assertion}]: ${f.detail}`)
    }
  }

  const total = allResults.length
  const passed = allResults.filter((r) => r.passed).length
  const failed = total - passed

  console.log(`\n[ai-scenarios] ${passed}/${total} assertions passed`)

  if (failed > 0) {
    console.error(`[ai-scenarios] FAILED: ${failed} assertion(s)`)
    process.exit(1)
  }
  console.log('[ai-scenarios] ALL PASS')
}

main().catch((err) => {
  console.error('[ai-scenarios] fatal', err)
  process.exit(2)
})
