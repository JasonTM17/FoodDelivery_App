import { websocketCorsOrigins } from './websocket-cors'

describe('websocketCorsOrigins', () => {
  const originalOrigins = process.env.CORS_ORIGINS
  const originalNodeEnv = process.env.NODE_ENV

  afterEach(() => {
    if (originalOrigins === undefined) delete process.env.CORS_ORIGINS
    else process.env.CORS_ORIGINS = originalOrigins
    if (originalNodeEnv === undefined) delete process.env.NODE_ENV
    else process.env.NODE_ENV = originalNodeEnv
  })

  it('supports every local FoodFlow web port by default', () => {
    delete process.env.CORS_ORIGINS

    expect(websocketCorsOrigins()).toEqual([
      'http://localhost:3000',
      'http://localhost:3002',
      'http://localhost:3003',
    ])
  })

  it('trims configured production origins and removes empty entries', () => {
    process.env.CORS_ORIGINS = ' https://admin.example.com, ,https://merchant.example.com '

    expect(websocketCorsOrigins()).toEqual([
      'https://admin.example.com',
      'https://merchant.example.com',
    ])
  })

  it('fails closed when production websocket CORS origins are missing', () => {
    delete process.env.CORS_ORIGINS
    process.env.NODE_ENV = 'production'

    expect(() => websocketCorsOrigins()).toThrow('CORS_ORIGINS is required in production')
  })
})
