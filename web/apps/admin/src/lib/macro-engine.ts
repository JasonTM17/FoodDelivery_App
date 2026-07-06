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
  body: string;
  tags?: string[];
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
