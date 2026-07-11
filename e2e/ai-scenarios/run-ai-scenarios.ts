#!/usr/bin/env ts-node
/**
 * run-ai-scenarios.ts — Smoke gate for FoodFlow AI chat endpoint.
 *
 * Loads canonical-conversations.json, POSTs each user turn to the backend
 * AI endpoint, and validates assertions per turn.
 *
 * Usage:
 *   AI_ACCESS_TOKEN=<seeded-customer-token> \
 *   cd backend && pnpm test:ai-scenarios -- \
 *     --endpoint http://localhost:3001/api/ai/chat \
 *     --token <authenticated-customer-access-token>
 *
 * Fixture-only validation never needs a provider key or access token:
 *   cd backend && pnpm test:ai-scenarios:validate
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
  status?: number
  action?: string
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

interface CliArgs {
  endpoint: string
  fixtures: string
  accessToken: string
  validateOnly: boolean
}

interface BotResponse {
  text: string
  toolCalls: Array<{ name: string; args: Record<string, unknown> }>
  status: number
  action?: string
  severity?: string
  language?: string
  sessionId?: string
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

function parseArgs(argv: string[]): CliArgs {
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
    accessToken: args.token ?? process.env.AI_ACCESS_TOKEN ?? '',
    validateOnly: args['validate-only'] === 'true',
  }
}

const ASSERTION_ROLES = new Set([
  'assert_action',
  'assert_http_status',
  'assert_no_hallucination',
  'assert_no_tool_called',
  'assert_response_contains',
  'assert_response_does_not_contain',
  'assert_response_language',
  'assert_severity',
  'assert_tool_called',
])

function assertFixture(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`Invalid AI scenario fixture: ${message}`)
}

function validatePatterns(value: unknown, location: string): void {
  assertFixture(Array.isArray(value) && value.length > 0, `${location} must contain at least one pattern`)
  for (const pattern of value) {
    assertFixture(typeof pattern === 'string' && pattern.length > 0, `${location} contains an empty pattern`)
    try {
      new RegExp(pattern, 'i')
    } catch {
      throw new Error(`Invalid AI scenario fixture: ${location} contains an invalid regular expression`)
    }
  }
}

function validateFixtures(value: unknown): Fixtures {
  assertFixture(isRecord(value), 'root must be an object')
  assertFixture(Array.isArray(value.conversations) && value.conversations.length > 0, 'conversations must be non-empty')

  const ids = new Set<string>()
  for (const [conversationIndex, candidate] of value.conversations.entries()) {
    const prefix = `conversations[${conversationIndex}]`
    assertFixture(isRecord(candidate), `${prefix} must be an object`)
    assertFixture(typeof candidate.id === 'string' && candidate.id.length > 0, `${prefix}.id is required`)
    assertFixture(!ids.has(candidate.id), `${prefix}.id must be unique`)
    ids.add(candidate.id)
    assertFixture(typeof candidate.title === 'string' && candidate.title.length > 0, `${prefix}.title is required`)
    assertFixture(isRecord(candidate.context), `${prefix}.context must be an object`)
    assertFixture(!('userId' in candidate.context), `${prefix}.context.userId must come from the access token`)
    assertFixture(!('sessionId' in candidate.context), `${prefix}.context.sessionId must be issued by the server`)
    if ('knownOrderId' in candidate.context) {
      assertFixture(
        typeof candidate.context.knownOrderId === 'string' && /^(?:FD\d{10}|F[DF]-?\d{3,10})$/i.test(candidate.context.knownOrderId),
        `${prefix}.context.knownOrderId must be a FoodFlow order code`,
      )
    }
    assertFixture(Array.isArray(candidate.turns) && candidate.turns.length > 1, `${prefix}.turns must contain a user turn and assertions`)

    let hasUserTurn = false
    let assertionCount = 0
    for (const [turnIndex, turn] of candidate.turns.entries()) {
      const turnPrefix = `${prefix}.turns[${turnIndex}]`
      assertFixture(isRecord(turn) && typeof turn.role === 'string', `${turnPrefix}.role is required`)
      if (turn.role === 'user') {
        assertFixture(typeof turn.message === 'string' && turn.message.trim().length > 0, `${turnPrefix}.message is required`)
        hasUserTurn = true
        continue
      }

      assertFixture(ASSERTION_ROLES.has(turn.role), `${turnPrefix}.role is unsupported`)
      assertFixture(hasUserTurn, `${turnPrefix} cannot assert before a user turn`)
      assertionCount++
      if (turn.role === 'assert_tool_called') {
        assertFixture(typeof turn.tool === 'string' && turn.tool.length > 0, `${turnPrefix}.tool is required`)
      }
      if (turn.role === 'assert_http_status') {
        assertFixture(Number.isInteger(turn.status) && Number(turn.status) >= 100 && Number(turn.status) <= 599, `${turnPrefix}.status is invalid`)
      }
      if (turn.role === 'assert_action') {
        assertFixture(typeof turn.action === 'string' && turn.action.length > 0, `${turnPrefix}.action is required`)
      }
      if (turn.role === 'assert_severity') {
        assertFixture(typeof turn.level === 'string' && turn.level.length > 0, `${turnPrefix}.level is required`)
      }
      if (turn.role === 'assert_response_language') {
        assertFixture(typeof turn.language === 'string' && ['vi', 'en', 'ja'].includes(turn.language), `${turnPrefix}.language is invalid`)
      }
      if (turn.role === 'assert_response_contains' || turn.role === 'assert_response_does_not_contain') {
        validatePatterns(turn.patterns, `${turnPrefix}.patterns`)
      }
      if (turn.role === 'assert_no_hallucination') {
        validatePatterns(turn.patterns ?? turn.forbidden_patterns, `${turnPrefix}.forbidden_patterns`)
      }
    }
    assertFixture(hasUserTurn && assertionCount > 0, `${prefix} must contain user input and at least one assertion`)
  }

  return value as unknown as Fixtures
}

// ---------------------------------------------------------------------------
// HTTP helper — POST a user message to the backend AI endpoint
// ---------------------------------------------------------------------------

async function callEndpoint(
  endpoint: string,
  message: string,
  context: Record<string, unknown>,
  accessToken: string,
): Promise<BotResponse> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${accessToken}`,
  }
  const sessionId = optionalUuid(context.sessionId)
  const orderId = typeof context.knownOrderId === 'string' ? context.knownOrderId : undefined
  const res = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify({ message, sessionId, orderId }),
    signal: AbortSignal.timeout(15_000),
  })
  const raw = await res.text()
  let json: Record<string, unknown> = {}
  try {
    json = raw ? JSON.parse(raw) as Record<string, unknown> : {}
  } catch {
    json = { message: raw }
  }
  if (!res.ok) {
    return {
      text: String(json.message ?? json.error ?? raw ?? ''),
      toolCalls: [],
      status: res.status,
    }
  }
  const payload = isRecord(json.data) ? json.data : json
  return {
    text: String(payload.reply ?? payload.text ?? payload.response ?? payload.message ?? ''),
    toolCalls: Array.isArray(payload.toolCalls)
      ? (payload.toolCalls as Array<{ name: string; args: Record<string, unknown> }>)
      : [],
    status: res.status,
    action: typeof payload.action === 'string' ? payload.action : undefined,
    severity: typeof payload.severity === 'string' ? payload.severity : undefined,
    language: typeof payload.language === 'string' ? payload.language : undefined,
    sessionId: optionalUuid(payload.sessionId),
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function optionalUuid(value: unknown): string | undefined {
  if (value === undefined || value === null) return undefined
  if (typeof value !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) {
    throw new Error('AI scenario sessionId must be a server-issued UUID')
  }
  return value
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
  accessToken: string,
): Promise<AssertionResult[]> {
  const results: AssertionResult[] = []
  let lastResp: BotResponse | null = null
  const runtimeContext = { ...conv.context }

  for (let i = 0; i < conv.turns.length; i++) {
    const turn = conv.turns[i]

    if (turn.role === 'user' && turn.message) {
      try {
        lastResp = await callEndpoint(endpoint, turn.message, runtimeContext, accessToken)
        if (lastResp.sessionId) runtimeContext.sessionId = lastResp.sessionId
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
      if (lastResp.status >= 200 && lastResp.status < 300 && !lastResp.text.trim()) {
        results.push({
          conversationId: conv.id,
          turnIndex: i,
          assertion: 'provider_response',
          passed: false,
          detail: 'successful AI response was empty',
        })
        return results
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
      case 'assert_http_status':
        r =
          lastResp.status === turn.status
            ? { ok: true, detail: 'ok' }
            : {
                ok: false,
                detail: `status "${lastResp.status}" expected "${turn.status}"`,
              }
        break
      case 'assert_action':
        r =
          lastResp.action === turn.action
            ? { ok: true, detail: 'ok' }
            : {
                ok: false,
                detail: `action "${lastResp.action}" expected "${turn.action}"`,
              }
        break
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
      case 'assert_response_language':
        r =
          lastResp.language === turn.language
            ? { ok: true, detail: 'ok' }
            : {
                ok: false,
                detail: `language "${lastResp.language}" expected "${turn.language}"`,
              }
        break
      default:
        r = { ok: false, detail: `unknown assertion type: "${turn.role}"` }
    }

    results.push({
      conversationId: conv.id,
      turnIndex: i,
      assertion: turn.role,
      passed: r.ok,
      detail: r.detail,
    })
  }

  return results
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const { endpoint, fixtures, accessToken, validateOnly } = parseArgs(process.argv.slice(2))
  const fixturesPath = resolve(process.cwd(), fixtures)
  const raw = readFileSync(fixturesPath, 'utf-8')
  const data = validateFixtures(JSON.parse(raw) as unknown)

  if (validateOnly) {
    console.log(`[ai-scenarios] valid fixture: ${data.conversations.length} conversations`)
    return
  }
  if (!accessToken) {
    throw new Error('AI_ACCESS_TOKEN is required for the authenticated /ai/chat endpoint')
  }

  console.log(`[ai-scenarios] endpoint: ${endpoint}`)
  console.log(`[ai-scenarios] conversations: ${data.conversations.length}`)

  const allResults: AssertionResult[] = []

  for (const conv of data.conversations) {
    console.log(`\n  running ${conv.id}: ${conv.title}`)
    const results = await runConversation(endpoint, conv, accessToken)
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
