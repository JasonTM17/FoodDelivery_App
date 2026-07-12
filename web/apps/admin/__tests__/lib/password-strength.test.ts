import { describe, expect, it } from 'vitest';
import { isStrongPassword } from '@/lib/password-strength';

describe('isStrongPassword', () => {
  it('accepts passwords with min 8 chars, upper, lower, and digit', () => {
    expect(isStrongPassword('NewPass123')).toBe(true);
    expect(isStrongPassword('Aa1aaaaa')).toBe(true);
  });

  it('rejects short or incomplete passwords', () => {
    expect(isStrongPassword('Short1A')).toBe(false);
    expect(isStrongPassword('alllowercase1')).toBe(false);
    expect(isStrongPassword('ALLUPPERCASE1')).toBe(false);
    expect(isStrongPassword('NoDigitsHere')).toBe(false);
    expect(isStrongPassword('')).toBe(false);
  });
});
