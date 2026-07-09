import type { IncomingMessage, ServerResponse } from 'http'
import { createFoodFlowApp } from '../src/bootstrap/create-foodflow-app'

type ExpressHandler = (req: IncomingMessage, res: ServerResponse) => void

let cachedHandler: ExpressHandler | null = null

async function getHandler(): Promise<ExpressHandler> {
  if (!cachedHandler) {
    const app = await createFoodFlowApp({
      enableWebSockets: false,
      setupSwagger: process.env.NODE_ENV !== 'production',
    })
    await app.init()
    cachedHandler = app.getHttpAdapter().getInstance() as ExpressHandler
  }
  return cachedHandler
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const expressHandler = await getHandler()
  return expressHandler(req, res)
}
