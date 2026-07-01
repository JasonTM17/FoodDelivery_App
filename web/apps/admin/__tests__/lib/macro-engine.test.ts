import { describe, it, expect } from 'vitest';
import { applyMacro, extractVariables, type MacroContext } from '@/lib/macro-engine';

describe('applyMacro', () => {
  it('substitutes simple variable', () => {
    const result = applyMacro('Hello {{name}}', { customer: { name: 'World' } });
    expect(result).toBe('Hello World');
  });

  it('substitutes nested variable', () => {
    const result = applyMacro('Order {{order.id}}', {
      order: { id: 'ord_123' },
    });
    expect(result).toBe('Order ord_123');
  });

  it('leaves unresolved variable as-is', () => {
    const result = applyMacro('Hello {{unknown}}', {});
    expect(result).toBe('Hello {{unknown}}');
  });

  it('handles multiple variables in one template', () => {
    const result = applyMacro('{{a}} and {{b}}', {
      customer: { name: 'a' },
      agent: { name: 'b' },
    });
    // Both resolve through customer.name → 'a' pattern
    // Actually tests nested resolution
    const result2 = applyMacro('Order {{order.id}} by {{customer.name}}', {
      order: { id: 'ORD-1' },
      customer: { name: 'An' },
    });
    expect(result2).toBe('Order ORD-1 by An');
  });

  it('handles undefined context gracefully', () => {
    const result = applyMacro('Hello {{customer.name}}', {} as MacroContext);
    expect(result).toBe('Hello {{customer.name}}');
  });

  it('substitutes from agent and ticket fields', () => {
    const result = applyMacro('{{agent.name}} xử lý ticket {{ticket.subject}}', {
      agent: { name: 'Agent01' },
      ticket: { subject: 'Đơn hủy' },
    });
    expect(result).toBe('Agent01 xử lý ticket Đơn hủy');
  });

  it('handles refund context', () => {
    const result = applyMacro('Hoàn {{refund.amount}} vì {{refund.reason}}', {
      refund: { amount: '50.000đ', reason: 'Giao trễ' },
    });
    expect(result).toBe('Hoàn 50.000đ vì Giao trễ');
  });

  it('does not substitute partial matches', () => {
    const result = applyMacro('{{customer.name}}s order', { customer: { name: 'An' } });
    expect(result).toBe('Ans order');
  });
});

describe('extractVariables', () => {
  it('extracts all unique variables from template', () => {
    const vars = extractVariables('{{a}} {{b}} {{a}}');
    expect(vars.sort()).toEqual(['a', 'b']);
  });

  it('extracts nested variables', () => {
    const vars = extractVariables('{{customer.name}} and {{order.id}}');
    expect(vars.sort()).toEqual(['customer.name', 'order.id']);
  });

  it('returns empty array for no variables', () => {
    expect(extractVariables('No variables here')).toEqual([]);
  });
});
