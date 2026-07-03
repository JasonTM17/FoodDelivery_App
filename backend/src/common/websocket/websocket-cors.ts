const DEFAULT_WEBSOCKET_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3002',
  'http://localhost:3003',
]

export function websocketCorsOrigins(): string[] {
  return (process.env.CORS_ORIGINS ?? DEFAULT_WEBSOCKET_ORIGINS.join(','))
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean)
}
