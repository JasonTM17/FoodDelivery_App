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

export interface DefaultMacroCopy {
  refundFull: { name: string; body: string };
  escalate: { name: string; body: string };
  infoRequest: { name: string; body: string };
  resolved: { name: string; body: string };
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

export function createDefaultMacros(copy: DefaultMacroCopy): MacroTemplate[] {
  return [
    {
      id: 'macro_refund_full',
      name: copy.refundFull.name,
      category: 'refund',
      shortcut: '/refund',
      body: copy.refundFull.body,
      variables: ['customer.name', 'order.id', 'refund.amount', 'agent.name'],
      tags: ['refund', 'resolved'],
    },
    {
      id: 'macro_escalate',
      name: copy.escalate.name,
      category: 'escalation',
      shortcut: '/escalate',
      body: copy.escalate.body,
      variables: ['customer.name', 'agent.name'],
      tags: ['escalation'],
    },
    {
      id: 'macro_info_request',
      name: copy.infoRequest.name,
      category: 'info',
      shortcut: '/moreinfo',
      body: copy.infoRequest.body,
      variables: ['customer.name', 'agent.name'],
      tags: ['info_request'],
    },
    {
      id: 'macro_resolved',
      name: copy.resolved.name,
      category: 'close',
      shortcut: '/resolved',
      body: copy.resolved.body,
      variables: ['customer.name', 'agent.name'],
      tags: ['resolved', 'csat'],
    },
  ];
}
