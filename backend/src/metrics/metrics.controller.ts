import {
  Controller,
  Get,
  Header,
  OnModuleInit,
  UnauthorizedException,
  Req,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PrismaService } from '../database/prisma.service'
import * as client from 'prom-client'
import type { Request } from 'express'
import { timingSafeEqual } from 'crypto'

const orderCountTotal = new client.Gauge({
  name: 'order_count_total',
  help: 'Total number of orders in the system',
})

const activeDrivers = new client.Gauge({
  name: 'active_drivers',
  help: 'Number of currently active delivery drivers',
})

@Controller('metrics')
export class MetricsController implements OnModuleInit {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async onModuleInit() {
    await this.refreshGauges()
  }

  @Get()
  @Header('Content-Type', client.register.contentType)
  async metrics(@Req() req: Request) {
    this.assertMetricsAccess(req)
    await this.refreshGauges()
    return client.register.metrics()
  }

  private assertMetricsAccess(req: Request): void {
    const expected = this.config.get<string>('METRICS_TOKEN')
    // Production requires token; development may omit for local scrapers
    if (!expected) {
      if (this.config.get<string>('NODE_ENV') === 'production') {
        throw new UnauthorizedException('METRICS_TOKEN not configured')
      }
      return
    }
    const header = req.headers['authorization']
    const bearer =
      typeof header === 'string' && header.startsWith('Bearer ')
        ? header.slice(7)
        : undefined
    const queryToken =
      typeof req.query?.token === 'string' ? req.query.token : undefined
    const provided = bearer ?? queryToken
    if (!provided || !this.tokensMatch(provided, expected)) {
      throw new UnauthorizedException('Invalid metrics token')
    }
  }

  private tokensMatch(a: string, b: string): boolean {
    try {
      const ba = Buffer.from(a)
      const bb = Buffer.from(b)
      if (ba.length !== bb.length) return false
      return timingSafeEqual(ba, bb)
    } catch {
      return false
    }
  }

  private async refreshGauges() {
    try {
      const count = await this.prisma.order.count()
      orderCountTotal.set(count)
    } catch {
      orderCountTotal.set(-1)
    }

    try {
      const drivers = await this.prisma.driverProfile.count({
        where: { isOnline: true },
      })
      activeDrivers.set(drivers)
    } catch {
      activeDrivers.set(-1)
    }
  }
}
