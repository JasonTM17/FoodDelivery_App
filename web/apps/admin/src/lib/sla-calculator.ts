const SLA_RULES = {
  critical: { firstResponseMin: 15, resolutionHr: 4, businessHoursOnly: false },
  high:     { firstResponseMin: 60, resolutionHr: 24, businessHoursOnly: true },
  normal:   { firstResponseMin: 240, resolutionHr: 72, businessHoursOnly: true },
  low:      { firstResponseMin: 480, resolutionHr: 168, businessHoursOnly: true },
} as const;

export type Priority = keyof typeof SLA_RULES;

interface SlaResult {
  percentRemaining: number;
  overdue: boolean;
  firstResponseDue: Date;
  resolutionDue: Date;
  minutesUntilFrt: number;
  minutesUntilResolution: number;
}

export function calculateSla(
  priority: Priority,
  createdAt: Date | string,
  now: Date = new Date(),
): SlaResult {
  const rules = SLA_RULES[priority] || SLA_RULES.normal;
  const created = typeof createdAt === 'string' ? new Date(createdAt) : createdAt;

  const frtDue = new Date(created.getTime() + rules.firstResponseMin * 60 * 1000);
  const resolutionDue = new Date(created.getTime() + rules.resolutionHr * 3600 * 1000);

  const minutesUntilFrt = Math.max(0, (frtDue.getTime() - now.getTime()) / 60000);
  const minutesUntilResolution = Math.max(0, (resolutionDue.getTime() - now.getTime()) / 60000);
  const totalResolutionMin = rules.resolutionHr * 60;
  const percentRemaining = Math.max(0, Math.min(1, minutesUntilResolution / totalResolutionMin));
  const overdue = minutesUntilFrt <= 0 || minutesUntilResolution <= 0;

  return {
    percentRemaining: overdue ? 0 : percentRemaining,
    overdue,
    firstResponseDue: frtDue,
    resolutionDue,
    minutesUntilFrt,
    minutesUntilResolution,
  };
}

export function getSlaRules() {
  return SLA_RULES;
}
