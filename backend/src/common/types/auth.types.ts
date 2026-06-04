import { UserRole } from '@prisma/client'

export interface TokenPayload {
  sub: string
  role: UserRole
  type?: 'access' | 'refresh'
  jti?: string
  iat?: number
  exp?: number
}

export interface TokenPair {
  accessToken: string
  refreshToken: string
}

export interface SanitizedUser {
  id: string
  email: string
  fullName: string
  role: UserRole
  phone: string | null
  avatarUrl: string | null
  isActive: boolean
  createdAt: Date
}
