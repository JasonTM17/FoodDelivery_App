import { Controller, Get, Header, OnModuleInit } from '@nestjs/common'
import { PrismaService } from '../database/prisma.service'
import * as client from 'prom-client'

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
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    await this.refreshGauges()
  }

  @Get()
  @Header('Content-Type', client.register.contentType)
  async metrics() {
    await this.refreshGauges()
    return client.register.metrics()
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
