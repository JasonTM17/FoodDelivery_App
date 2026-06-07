#!/usr/bin/env tsx
/**
 * FoodFlow Bot regression eval runner
 *
 * Posts scripted conversations from test-conversations.json against the N8N
 * webhook (or backend AI proxy) and validates assertions per turn.
 *
 * Usage:
 *   pnpm tsx infra/n8n/eval/run-eval.ts \
 *     --webhook http://localhost:5678/webhook/ai-support-chat \
 *     --fixtures infra/n8n/eval/test-conversations.json
 *
 * Exit code 0 if all assertions pass, 1 otherwise.
 */

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

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
  detail?: string
}

function parseArgs(argv: string[]): { webhook: string; fixtures: string } {
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
  const webhook = args.webhook ?? 'http://localhost:5678/webhook/ai-support-chat'
  const fixtures = args.fixtures ?? 'infra/n8n/eval/test-conversations.json'
  return { webhook, fixtures }
}

async function callBot(
  webhook: string,
  message: string,
  context: Record<string, unknown>,
  history: Array<{ role: string; message: string }>,
): Promise<BotResponse> {
  const res = await fetch(webhook, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, context, history }),
  })
  if (!res.ok) {
    throw new Error(`webhook ${res.status} ${res.statusText}`)
  }
  const json = (await res.json()) as Record<string, unknown>
  return {
    text: String(json.text ?? json.response ?? ''),
    toolCalls: Array.isArray(json.toolCalls)
      ? (json.toolCalls as Array<{ name: string; args: Record<string, unknown> }>)
      : [],
    severity: typeof json.severity === 'string' ? json.severity : undefined,
    language: typeof json.language === 'string' ? json.language : undefined,
  }
}

function regexMatch(text: string, pattern: string): boolean {
  return new RegExp(pattern, 'i').test(text)
}

function assertToolCalled(
  resp: BotResponse,
  expectedTool: string,
  expectedArgs?: Record<string, unknown>,
): { ok: boolean; detail: string } {
  const call = resp.toolCalls.find((c) => c.name === expectedTool)
  if (!call) return { ok: false, detail: `expected tool ${expectedTool} not called` }
  if (expectedArgs) {
    for (const [k, v] of Object.entries(expectedArgs)) {
      if (call.args[k] !== v) {
        return { ok: false, detail: `arg mismatch ${k}=${String(call.args[k])} expected=${String(v)}` }
      }
    }
  }
  return { ok: true, detail: 'ok' }
}

function assertNoToolCalled(resp: BotResponse): { ok: boolean; detail: string } {
  if (resp.toolCalls.length > 0) {
    return { ok: false, detail: `expected no tool calls, got ${resp.toolCalls.map((c) => c.name).join(',')}` }
  }
  return { ok: true, detail: 'ok' }
}

function assertContains(resp: BotResponse, patterns: string[]): { ok: boolean; detail: string } {
  for (const p of patterns) {
    if (!regexMatch(resp.text, p)) {
      return { ok: false, detail: `text missing pattern: ${p}` }
    }
  }
  return { ok: true, detail: 'ok' }
}

function assertNotContains(resp: BotResponse, patterns: string[]): { ok: boolean; detail: string } {
  for (const p of patterns) {
    if (regexMatch(resp.text, p)) {
      return { ok: false, detail: `text contains forbidden pattern: ${p}` }
    }
  }
  return { ok: true, detail: 'ok' }
}

function assertSeverity(resp: BotResponse, expected: string): { ok: boolean; detail: string } {
  if (resp.severity !== expected) {
    return { ok: false, detail: `severity ${resp.severity} expected ${expected}` }
  }
  return { ok: true, detail: 'ok' }
}

function assertLanguage(resp: BotResponse, expected: string): { ok: boolean; detail: string } {
  if (resp.language && resp.language !== expected) {
    return { ok: false, detail: `language ${resp.language} expected ${expected}` }
  }
  return { ok: true, detail: 'ok' }
}

async function runConversation(
  webhook: string,
  conv: Conversation,
): Promise<AssertionResult[]> {
  const results: AssertionResult[] = []
  const history: Array<{ role: string; message: string }> = []
  let lastResp: BotResponse | null = null

  for (let i = 0; i < conv.turns.length; i++) {
    const t = conv.turns[i]
    if (t.role === 'user' && t.message) {
      try {
        lastResp = await callBot(webhook, t.message, conv.context, history)
        history.push({ role: 'user', message: t.message })
        history.push({ role: 'assistant', message: lastResp.text })
      } catch (err) {
        results.push({
          conversationId: conv.id,
          turnIndex: i,
          assertion: 'webhook_call',
          passed: false,
          detail: String(err),
        })
        return results
      }
      continue
    }

    if (!lastResp) {
      results.push({
        conversationId: conv.id,
        turnIndex: i,
        assertion: t.role,
        passed: false,
        detail: 'assertion before any user turn',
      })
      continue
    }

    let r: { ok: boolean; detail: string } = { ok: true, detail: 'ok' }
    switch (t.role) {
      case 'assert_tool_called':
        r = assertToolCalled(lastResp, t.tool ?? '', t.args)
        break
      case 'assert_no_tool_called':
        r = assertNoToolCalled(lastResp)
        break
      case 'assert_response_contains':
        r = assertContains(lastResp, t.patterns ?? [])
        break
      case 'assert_response_does_not_contain':
        r = assertNotContains(lastResp, t.patterns ?? [])
        break
      case 'assert_no_hallucination':
        r = assertNotContains(lastResp, t.forbidden_patterns ?? [])
        break
      case 'assert_severity':
        r = assertSeverity(lastResp, t.level ?? '')
        break
      case 'assert_response_language':
        r = assertLanguage(lastResp, t.language ?? 'vi')
        break
      case 'tool_response':
        r = { ok: true, detail: 'tool response stub (mock layer optional)' }
        break
      default:
        r = { ok: false, detail: `unknown assertion: ${t.role}` }
    }

    results.push({
      conversationId: conv.id,
      turnIndex: i,
      assertion: t.role,
      passed: r.ok,
      detail: r.detail,
    })
  }

  return results
}

async function main() {
  const { webhook, fixtures } = parseArgs(process.argv.slice(2))
  const fixturesPath = resolve(process.cwd(), fixtures)
  const raw = readFileSync(fixturesPath, 'utf-8')
  const data = JSON.parse(raw) as Fixtures

  console.log(`[eval] webhook=${webhook}`)
  console.log(`[eval] conversations=${data.conversations.length}`)

  const allResults: AssertionResult[] = []
  for (const conv of data.conversations) {
    console.log(`\n[eval] running ${conv.id}: ${conv.title}`)
    const results = await runConversation(webhook, conv)
    allResults.push(...results)
    const fails = results.filter((r) => !r.passed)
    if (fails.length === 0) {
      console.log(`  ok (${results.length} assertions passed)`)
    } else {
      console.log(`  FAIL: ${fails.length}/${results.length}`)
      for (const f of fails) {
        console.log(`    turn ${f.turnIndex} ${f.assertion}: ${f.detail}`)
      }
    }
  }

  const total = allResults.length
  const passed = allResults.filter((r) => r.passed).length
  const failed = total - passed
  console.log(`\n[eval] summary: ${passed}/${total} assertions passed (${failed} failed)`)

  if (failed > 0) {
    process.exit(1)
  }
}

main().catch((err) => {
  console.error('[eval] fatal', err)
  process.exit(2)
})
