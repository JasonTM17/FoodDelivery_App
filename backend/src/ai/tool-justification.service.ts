import { Injectable, Logger } from '@nestjs/common'

export type AiToolName =
  | 'getOrderStatus'
  | 'getDriverLocation'
  | 'getRestaurantStatus'
  | 'getRefundEligibility'
  | 'createSupportTicket'
  | 'getRecommendedFoods'
  | 'notifyAdmin'

const TOOL_REQUIRED_KEYWORDS: Record<AiToolName, RegExp> = {
  getOrderStatus:
    /đơn|order|mã\s*đơn|tình\s*trạng|trạng\s*thái|đang\s*ở\s*đâu|tới\s*chưa|giao\s*chưa|bao\s*giờ\s*tới/i,
  getDriverLocation:
    /tài\s*xế|shipper|driver|vị\s*trí|đang\s*chạy|đang\s*đi|bao\s*lâu\s*nữa/i,
  getRestaurantStatus:
    /nhà\s*hàng|quán|restaurant|mở\s*cửa|đang\s*mở|đóng\s*cửa|còn\s*mở/i,
  getRefundEligibility:
    /hoàn\s*tiền|refund|trả\s*lại\s*tiền|huỷ\s*hoàn|tiền\s*lại|lấy\s*lại\s*tiền|đòi\s*tiền/i,
  createSupportTicket:
    /khiếu\s*nại|báo\s*cáo|hỗ\s*trợ|vấn\s*đề|sự\s*cố|bị\s*lỗi|tạo\s*ticket|issue|complaint|problem|unreachable|charged|dị\s*ứng|allerg|không\s*bắt\s*máy|bị\s*trừ\s*tiền|thiếu\s*món|sai\s*món|quá\s*tệ|đợi\s*\d+\s*tiếng|đợi\s*cả\s*tiếng|cả\s*tiếng|trễ\s*quá|chậm\s*thế|muộn\s*quá/i,
  getRecommendedFoods:
    /gợi\s*ý|recommend|nên\s*đặt|món\s*ngon|ăn\s*gì|đề\s*xuất|suggest|gợi\s*món/i,
  notifyAdmin:
    /__SEVERITY_HIGH__|__ESCALATE__|__ANGRY_CONFIRMED__|severity.*high/i,
}

// Known injection probe patterns — blocked regardless of tool justification
const KNOWN_INJECTION_PROBES: RegExp[] = [
  /ignore\s+previous/i,
  /forget\s+(all|everything|instructions)/i,
  /you\s+are\s+now\s+(a|an)/i,
  /system\s*:\s*(you|ignore|forget)/i,
  /call\s+notifyAdmin\s+directly/i,
  /tool_call.*notifyAdmin/i,
]

@Injectable()
export class ToolJustificationService {
  private readonly logger = new Logger(ToolJustificationService.name)

  validate(toolName: string, userMessage: string, severity?: string): boolean {
    // Block any known injection probe
    for (const probe of KNOWN_INJECTION_PROBES) {
      if (probe.test(userMessage)) {
        this.logger.warn(`Injection probe blocked — tool: ${toolName}, probe matched`)
        return false
      }
    }

    const pattern = TOOL_REQUIRED_KEYWORDS[toolName as AiToolName]
    if (!pattern) {
      this.logger.warn(`Unknown tool attempted: ${toolName}`)
      return false
    }

    // notifyAdmin requires severity HIGH/CRITICAL set by system, not user text
    if (toolName === 'notifyAdmin') {
      const sev = (severity ?? '').toUpperCase()
      const allowed = sev === 'HIGH' || sev === 'CRITICAL'
      if (!allowed) {
        this.logger.warn(`notifyAdmin blocked — severity not HIGH (got: ${severity})`)
      }
      return allowed
    }

    const justified = pattern.test(userMessage)
    if (!justified) {
      this.logger.warn(`Potential tool injection — unjustified tool: ${toolName}`)
    }
    return justified
  }

  validateBatch(
    calls: Array<{ tool: string; args?: Record<string, unknown> }>,
    userMessage: string,
    severity?: string,
  ): Array<{ tool: string; allowed: boolean }> {
    return calls.map(c => ({
      tool: c.tool,
      allowed: this.validate(c.tool, userMessage, severity),
    }))
  }
}
