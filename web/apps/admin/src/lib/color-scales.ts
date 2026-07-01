export function heatmapColorScale(value: number, max: number): string {
  const intensity = max > 0 ? value / max : 0;
  if (intensity === 0) return '#F1F5F9';
  if (intensity < 0.2) return '#BBF7D0';
  if (intensity < 0.4) return '#86EFAC';
  if (intensity < 0.6) return '#4ADE80';
  if (intensity < 0.8) return '#22C55E';
  return '#15803D';
}

export function slaColorScale(percentRemaining: number): string {
  if (percentRemaining > 0.5) return '#22C55E';
  if (percentRemaining > 0.25) return '#F59E0B';
  return '#EF4444';
}
