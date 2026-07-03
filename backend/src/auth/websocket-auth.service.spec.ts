import { UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { UserRole } from '@prisma/client'
import { sign } from 'jsonwebtoken'
import type { Socket } from 'socket.io'
import { PrismaService } from '../database/prisma.service'
import { Ed25519Service } from './keys/ed25519.service'
import { WebSocketAuthService } from './websocket-auth.service'

describe('WebSocketAuthService', () => {
  const secret = 'test-websocket-secret-at-least-32-characters'
  const config = { get: jest.fn() }
  const ed25519 = { resolveKeyForAlg: jest.fn() }
  const findUser = jest.fn()
  const service = new WebSocketAuthService(
    config as unknown as ConfigService,
    ed25519 as unknown as Ed25519Service,
    { user: { findUnique: findUser } } as unknown as PrismaService,
  )

  beforeEach(() => {
    jest.clearAllMocks()
    config.get.mockImplementation((key: string) => ({
      JWT_SECRET: secret,
      LEGACY_HS256_FALLBACK: 'true',
    }[key]))
    ed25519.resolveKeyForAlg.mockReturnValue(secret)
    findUser.mockResolvedValue({
      id: 'user-1',
      role: UserRole.admin,
      isActive: true,
    })
  })

  it('verifies an access token and trusts the active database role', async () => {
    const client = makeClient(accessToken({ role: UserRole.customer }))

    await expect(service.authenticate(client)).resolves.toEqual({
      sub: 'user-1',
      role: UserRole.admin,
    })
    expect(client.data.user).toEqual({ sub: 'user-1', role: UserRole.admin })
    expect(findUser).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      select: { id: true, role: true, isActive: true },
    })
  })

  it('rejects refresh tokens before querying the database', async () => {
    const client = makeClient(sign(
      { sub: 'user-1', role: UserRole.admin, type: 'refresh' },
      secret,
      { algorithm: 'HS256', expiresIn: '1h' },
    ))

    await expect(service.authenticate(client)).rejects.toThrow(
      'SOCKET_ACCESS_TOKEN_REQUIRED',
    )
    expect(findUser).not.toHaveBeenCalled()
  })

  it('rejects missing tokens and inactive users', async () => {
    await expect(service.authenticate(makeClient())).rejects.toThrow(
      UnauthorizedException,
    )

    findUser.mockResolvedValueOnce({
      id: 'user-1',
      role: UserRole.admin,
      isActive: false,
    })
    await expect(service.authenticate(makeClient(accessToken()))).rejects.toThrow(
      'SOCKET_USER_INACTIVE',
    )
  })

  function accessToken(overrides: Record<string, unknown> = {}): string {
    return sign(
      {
        sub: 'user-1',
        role: UserRole.admin,
        type: 'access',
        ...overrides,
      },
      secret,
      { algorithm: 'HS256', expiresIn: '1h' },
    )
  }
})

function makeClient(token?: string): Socket {
  return {
    handshake: {
      auth: token ? { token } : {},
      headers: {},
    },
    data: {},
  } as unknown as Socket
}
