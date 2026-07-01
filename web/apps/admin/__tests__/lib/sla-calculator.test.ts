import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { calculateSla, getSlaRules } from '@/lib/sla-calculator';

describe('calculateSla', () => {
  const now = new Date('2026-06-09T12:00:00Z');

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(now);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('calculates critical SLA (15min FRT, 4h resolution)', () => {
    const created = new Date('2026-06-09T11:58:00Z'); // 2 min ago
    const result = calculateSla('critical', created);
    expect(result.overdue).toBe(false);
    expect(result.percentRemaining).toBeGreaterThan(0.9);
    expect(result.firstResponseDue.getTime()).toBe(
      created.getTime() + 15 * 60 * 1000
    );
  });

  it('marks overdue when past resolution time', () => {
    const created = new Date('2026-06-09T07:00:00Z'); // 5h ago, > 4h resolution
    const result = calculateSla('critical', created);
    expect(result.overdue).toBe(true);
    expect(result.percentRemaining).toBe(0);
  });

  it('calculates high priority SLA (60min FRT, 24h resolution)', () => {
    const created = new Date('2026-06-09T11:30:00Z'); // 30 min ago
    const result = calculateSla('high', created);
    expect(result.overdue).toBe(false);
    expect(result.minutesUntilFrt).toBeCloseTo(30, -1);
  });

  it('calculates normal priority SLA (240min FRT, 72h resolution)', () => {
    const created = new Date('2026-06-09T10:00:00Z'); // 2h ago
    const result = calculateSla('normal', created);
    expect(result.overdue).toBe(false);
    expect(result.minutesUntilResolution).toBeGreaterThan(4000);
  });

  it('calculates low priority SLA (480min FRT, 168h resolution)', () => {
    const created = new Date('2026-06-09T12:00:00Z'); // just now
    const result = calculateSla('low', created);
    expect(result.overdue).toBe(false);
    expect(result.minutesUntilFrt).toBeCloseTo(480, -1);
  });

  it('falls back to normal for unknown priority', () => {
    const created = new Date('2026-06-09T10:00:00Z');
    const result = calculateSla('unknown' as never, created);
    const normal = calculateSla('normal', created);
    expect(result.minutesUntilResolution).toBe(normal.minutesUntilResolution);
  });

  it('accepts string dates', () => {
    const result = calculateSla('normal', '2026-06-09T11:30:00Z');
    expect(result.firstResponseDue).toBeDefined();
  });

  it('percentRemaining decreases as time passes', () => {
    const created = new Date('2026-06-09T11:00:00Z'); // 1h ago
    const result = calculateSla('normal', created);
    expect(result.percentRemaining).toBeLessThan(1);
    expect(result.percentRemaining).toBeGreaterThan(0);
  });

  it('clamps percentRemaining to [0, 1]', () => {
    const freshResult = calculateSla('low', new Date('2026-06-09T12:00:00Z'));
    expect(freshResult.percentRemaining).toBeGreaterThanOrEqual(0);
    expect(freshResult.percentRemaining).toBeLessThanOrEqual(1);

    const oldResult = calculateSla('critical', new Date('2026-06-01T00:00:00Z'));
    expect(oldResult.percentRemaining).toBe(0);
  });
});

describe('getSlaRules', () => {
  it('returns all SLA rules', () => {
    const rules = getSlaRules();
    expect(rules).toHaveProperty('critical');
    expect(rules).toHaveProperty('high');
    expect(rules).toHaveProperty('normal');
    expect(rules).toHaveProperty('low');
  });

  it('critical SLA has shortest times', () => {
    const rules = getSlaRules();
    expect(rules.critical.firstResponseMin).toBeLessThan(rules.high.firstResponseMin);
    expect(rules.critical.resolutionHr).toBeLessThan(rules.high.resolutionHr);
  });
});
