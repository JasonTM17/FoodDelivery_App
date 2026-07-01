export interface MacroContext {
  customer?: { id?: string; name?: string; email?: string; phone?: string };
  order?: { id?: string; code?: string; total?: number; status?: string };
  agent?: { id?: string; name?: string; email?: string };
  ticket?: { id?: string; subject?: string };
  refund?: { amount?: string; reason?: string };
}

export interface MacroTemplate {
  id: string;
  name: string;
  category: string;
  shortcut: string;
  body: string;
  variables: string[];
  tags: string[];
}

function get(obj: Record<string, unknown>, path: string): string {
  const keys = path.split('.');
  let current: unknown = obj;
  for (const key of keys) {
    if (current == null || typeof current !== 'object') return `{{${path}}}`;
    current = (current as Record<string, unknown>)[key];
  }
  return current != null ? String(current) : `{{${path}}}`;
}

export function applyMacro(template: string, context: MacroContext): string {
  return template.replace(/\{\{([\w.]+)\}\}/g, (_, path: string) => {
    return get(context as unknown as Record<string, unknown>, path);
  });
}

export function extractVariables(template: string): string[] {
  const matches = template.matchAll(/\{\{([\w.]+)\}\}/g);
  const vars = Array.from(matches, (m) => m[1]);
  return Array.from(new Set(vars));
}

export const DEFAULT_MACROS: MacroTemplate[] = [
  {
    id: 'macro_refund_full',
    name: 'Hoàn tiền toàn bộ',
    category: 'refund',
    shortcut: '/refund',
    body: 'Xin chào {{customer.name}},\n\nĐơn hàng {{order.id}} đã được hoàn tiền {{refund.amount}} vào ví FoodFlow. Thời gian xử lý: 3-5 ngày làm việc.\n\nTrân trọng,\n{{agent.name}}',
    variables: ['customer.name', 'order.id', 'refund.amount', 'agent.name'],
    tags: ['refund', 'resolved'],
  },
  {
    id: 'macro_escalate',
    name: 'Chuyển cấp quản lý',
    category: 'escalation',
    shortcut: '/escalate',
    body: 'Xin chào {{customer.name}},\n\nYêu cầu của bạn đã được chuyển đến quản lý cấp cao để xử lý. Chúng tôi sẽ phản hồi trong vòng 24 giờ.\n\nTrân trọng,\n{{agent.name}}',
    variables: ['customer.name', 'agent.name'],
    tags: ['escalation'],
  },
  {
    id: 'macro_info_request',
    name: 'Yêu cầu thông tin thêm',
    category: 'info',
    shortcut: '/moreinfo',
    body: 'Xin chào {{customer.name}},\n\nĐể xử lý yêu cầu của bạn nhanh hơn, vui lòng cung cấp thêm thông tin về:\n- Ảnh chụp màn hình lỗi\n- Thời gian xảy ra sự cố\n- Phiên bản ứng dụng\n\nTrân trọng,\n{{agent.name}}',
    variables: ['customer.name', 'agent.name'],
    tags: ['info_request'],
  },
  {
    id: 'macro_resolved',
    name: 'Đã giải quyết',
    category: 'close',
    shortcut: '/resolved',
    body: 'Xin chào {{customer.name}},\n\nYêu cầu của bạn đã được xử lý xong. Nếu cần hỗ trợ thêm, vui lòng tạo yêu cầu mới.\n\nĐánh giá trải nghiệm: [link CSAT]\n\nTrân trọng,\n{{agent.name}}',
    variables: ['customer.name', 'agent.name'],
    tags: ['resolved', 'csat'],
  },
];
