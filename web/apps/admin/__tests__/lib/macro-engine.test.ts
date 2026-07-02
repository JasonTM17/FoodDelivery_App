import { describe, expect, it } from 'vitest';
import { applyMacro, extractVariables, type MacroContext } from '@/lib/macro-engine';

describe('applyMacro', () => {
  it('substitutes a customer variable', () => {
    const result = applyMacro('Hello {{customer.name}}', { customer: { name: 'World' } });
    expect(result).toBe('Hello World');
  });

  it('substitutes nested variables', () => {
    const result = applyMacro('Order {{order.id}} by {{customer.name}}', {
      order: { id: 'ORD-1' },
      customer: { name: 'An' },
    });
    expect(result).toBe('Order ORD-1 by An');
  });

  it('leaves unresolved variables unchanged', () => {
    expect(applyMacro('Hello {{unknown}}', {})).toBe('Hello {{unknown}}');
    expect(applyMacro('Hello {{customer.name}}', {} as MacroContext))
      .toBe('Hello {{customer.name}}');
  });

  it('substitutes agent and ticket fields', () => {
    const result = applyMacro('{{agent.name}} xử lý ticket {{ticket.subject}}', {
      agent: { name: 'Agent01' },
      ticket: { subject: 'Đơn hủy' },
    });
    expect(result).toBe('Agent01 xử lý ticket Đơn hủy');
  });

  it('substitutes refund fields', () => {
    const result = applyMacro('Hoàn {{refund.amount}} vì {{refund.reason}}', {
      refund: { amount: '50.000đ', reason: 'Giao trễ' },
    });
    expect(result).toBe('Hoàn 50.000đ vì Giao trễ');
  });

  it('only replaces the exact variable token', () => {
    const result = applyMacro('{{customer.name}}s order', { customer: { name: 'An' } });
    expect(result).toBe('Ans order');
  });
});

describe('extractVariables', () => {
  it('extracts unique variables', () => {
    expect(extractVariables('{{a}} {{b}} {{a}}').sort()).toEqual(['a', 'b']);
  });

  it('extracts nested variables', () => {
    expect(extractVariables('{{customer.name}} and {{order.id}}').sort())
      .toEqual(['customer.name', 'order.id']);
  });

  it('returns an empty array when a template has no variables', () => {
    expect(extractVariables('No variables here')).toEqual([]);
  });
});
