import { describe, it, expect } from 'vitest';
import { heatmapColorScale, slaColorScale } from '@/lib/color-scales';

describe('heatmapColorScale', () => {
  it('returns gray for zero value', () => {
    expect(heatmapColorScale(0, 100)).toBe('#F1F5F9');
  });

  it('returns gray for max=0', () => {
    expect(heatmapColorScale(50, 0)).toBe('#F1F5F9');
  });

  it('returns darkest green at max intensity', () => {
    expect(heatmapColorScale(100, 100)).toBe('#15803D');
  });

  it('returns correct bands at boundaries', () => {
    // Each band: 0, <0.2, <0.4, <0.6, <0.8, >=0.8
    expect(heatmapColorScale(1, 100)).toBe('#BBF7D0'); // any non-zero value enters a green band
    // Wait, intensity=0.01, so it's <0.2 after the ===0 check
    expect(heatmapColorScale(19, 100)).toBe('#BBF7D0'); // 0.19 < 0.2
    expect(heatmapColorScale(20, 100)).toBe('#86EFAC'); // 0.2 - second band
    expect(heatmapColorScale(39, 100)).toBe('#86EFAC'); // 0.39 < 0.4
    expect(heatmapColorScale(59, 100)).toBe('#4ADE80'); // 0.59 < 0.6
    expect(heatmapColorScale(79, 100)).toBe('#22C55E'); // 0.79 < 0.8
    expect(heatmapColorScale(80, 100)).toBe('#15803D'); // 0.8 → max
  });

  it('clamps value > max to darkest', () => {
    expect(heatmapColorScale(200, 100)).toBe('#15803D');
  });

  it('all bands are valid hex colors', () => {
    const colors = [
      heatmapColorScale(0, 100),
      heatmapColorScale(10, 100),
      heatmapColorScale(30, 100),
      heatmapColorScale(50, 100),
      heatmapColorScale(70, 100),
      heatmapColorScale(90, 100),
    ];
    for (const c of colors) {
      expect(c).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });
});

describe('slaColorScale', () => {
  it('returns green for >50% remaining', () => {
    expect(slaColorScale(0.75)).toBe('#22C55E');
    expect(slaColorScale(0.51)).toBe('#22C55E');
  });

  it('returns amber for 25-50% remaining', () => {
    expect(slaColorScale(0.5)).toBe('#F59E0B');
    expect(slaColorScale(0.26)).toBe('#F59E0B');
  });

  it('returns red for <=25% remaining', () => {
    expect(slaColorScale(0.25)).toBe('#EF4444');
    expect(slaColorScale(0.1)).toBe('#EF4444');
    expect(slaColorScale(0)).toBe('#EF4444');
  });

  it('handles edge: exactly 50% is amber', () => {
    expect(slaColorScale(0.5)).toBe('#F59E0B');
  });

  it('handles edge: exactly 25% is red', () => {
    expect(slaColorScale(0.25)).toBe('#EF4444');
  });
});
