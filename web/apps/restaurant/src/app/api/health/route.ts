import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export function GET() {
  return NextResponse.json(
    {
      status: 'ok',
      service: 'foodflow-restaurant',
      timestamp: new Date().toISOString(),
    },
    { status: 200 },
  )
}
