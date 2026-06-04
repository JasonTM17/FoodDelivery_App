export interface JwtPayload {
  sub: string
  role: string
  iat?: number
  exp?: number
}
