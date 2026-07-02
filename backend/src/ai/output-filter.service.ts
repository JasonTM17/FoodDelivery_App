import { Injectable, Logger } from '@nestjs/common'

const INJECTION_PATTERNS: RegExp[] = [
  /ignore\s+(previous|prior|above|all)\s+(instructions?|prompts?|rules?)/gi,
  /forget\s+(everything|all|previous|prior|instructions?)/gi,
  /you\s+are\s+now\s+(a|an)\s+/gi,
  /new\s+persona\s*:/gi,
  /\bsystem\s*:\s*(?!FoodFlow)/gi,
  /<\/?system>/gi,
  /\[SYSTEM\]/gi,
  /\[\[INST\]\]/gi,
  /act\s+as\s+(a\s+)?(different|new|another|unrestricted)/gi,
  /jailbreak|DAN\s+mode|developer\s+mode|god\s+mode/gi,
  /disregard\s+(your|the|all)\s+(previous|safety|instructions?)/gi,
  /pretend\s+(you\s+are|to\s+be)\s+(a\s+)?(different|new|unrestricted)/gi,
  /\bprompt\s+injection\b/gi,
  /override\s+(your\s+)?(programming|instructions?|rules?)/gi,
]

// Full Vietnamese phone: 0[3-9]xxxxxxxx or +84[3-9]xxxxxxxx — mask all but last 4
const VN_PHONE_RE = /(?<!\*\*\*\*)(\+?84|0)[3-9]\d{8}\b/g

// Email mask: keep first char + *** before @, keep domain
const EMAIL_RE = /[a-zA-Z0-9._%+-]{2,}@([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}/g

// Full national ID (CCCD 12 digits) — mask middle 8
const CCCD_RE = /\b(\d{3})\d{6}(\d{3})\b/g

@Injectable()
export class OutputFilterService {
  private readonly logger = new Logger(OutputFilterService.name)

  filter(text: string): string {
    let out = text

    for (const pattern of INJECTION_PATTERNS) {
      // reset lastIndex for global regex on each pass
      pattern.lastIndex = 0
      if (pattern.test(out)) {
        this.logger.warn('Injection pattern detected in AI output — stripping')
        pattern.lastIndex = 0
        out = out.replace(pattern, '[nội dung đã được lọc]')
      }
    }

    out = out.replace(VN_PHONE_RE, (match) => `****${match.slice(-4)}`)
    out = out.replace(EMAIL_RE, (match) => {
      const at = match.indexOf('@')
      const local = match.slice(0, at)
      const domain = match.slice(at)
      return `${local[0]}***${domain}`
    })
    out = out.replace(CCCD_RE, '$1********$2')

    return out
  }

  containsInjection(text: string): boolean {
    return INJECTION_PATTERNS.some(p => {
      p.lastIndex = 0
      const result = p.test(text)
      p.lastIndex = 0
      return result
    })
  }

  maskPii(text: string): string {
    return text
      .replace(VN_PHONE_RE, (m) => `****${m.slice(-4)}`)
      .replace(EMAIL_RE, (m) => `${m[0]}***@***`)
      .replace(CCCD_RE, '************')
  }
}
