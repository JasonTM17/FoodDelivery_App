export interface AuditLogEntry {
  id: string;
  adminId: string;
  admin: {
    id: string;
    email: string;
    fullName: string;
  };
  action: string;
  targetType: string;
  targetId: string | null;
  ipAddress: string;
  correlationId: string | null;
  severity: string;
  createdAt: string;
}

export interface AuditLogFilters {
  actor: string;
  action: string;
  dateFrom: string;
  dateTo: string;
}
