import { describe, expect, it } from 'vitest';
import { validateMenuItem, validateOption } from '@/lib/schemas/menu-item-schema';
import { validateStaffInvite, validateStaffPermissions } from '@/lib/schemas/staff-schema';

describe('menu item validation', () => {
  const validItem = {
    name: 'Pho bo',
    categoryId: 'category-1',
    basePrice: 65_000,
    options: [],
  };

  it('accepts a valid item', () => {
    expect(validateMenuItem(validItem)).toEqual({ valid: true, errors: [] });
  });

  it.each([
    [{ ...validItem, name: 'A' }, 'short name'],
    [{ ...validItem, categoryId: '' }, 'missing category'],
    [{ ...validItem, basePrice: 0 }, 'zero price'],
    [{ ...validItem, options: Array.from({ length: 6 }, () => ({})) }, 'too many options'],
  ])('rejects %s (%s)', (item) => {
    expect(validateMenuItem(item).valid).toBe(false);
  });

  it('requires at least one option choice', () => {
    expect(validateOption({ name: 'Size', choices: [] }).valid).toBe(false);
  });

  it('accepts an option with choices', () => {
    expect(validateOption({ name: 'Size', choices: [{ label: 'Large', priceDelta: 10_000 }] }).valid).toBe(true);
  });
});

describe('staff validation', () => {
  it('accepts multiple valid invitation emails', () => {
    const result = validateStaffInvite({
      emails: ['chef@example.com', 'cashier@example.com'],
      role: 'kitchen',
    });

    expect(result).toEqual({ valid: true, errors: [] });
  });

  it('rejects invalid emails and roles', () => {
    const result = validateStaffInvite({ emails: ['not-an-email'], role: 'super-admin' });

    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(2);
  });

  it('rejects capabilities outside the restaurant permission model', () => {
    const result = validateStaffPermissions({
      role: 'manager',
      permissions: ['orders', 'delete-platform'],
    });

    expect(result.valid).toBe(false);
  });

  it('accepts supported capabilities', () => {
    const result = validateStaffPermissions({
      role: 'manager',
      permissions: ['orders', 'menu', 'promotions'],
    });

    expect(result).toEqual({ valid: true, errors: [] });
  });
});
