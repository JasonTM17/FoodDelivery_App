import { SetMetadata } from '@nestjs/common'
import { AUDIT_LOG_KEY, AuditLogMeta } from './audit-log.interceptor'

export const AuditLog = (meta: AuditLogMeta) => SetMetadata(AUDIT_LOG_KEY, meta)
