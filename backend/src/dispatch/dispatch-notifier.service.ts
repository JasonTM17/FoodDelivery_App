import { Injectable, Optional } from '@nestjs/common'
import type { Server } from 'socket.io'
import { realtimeChannels } from '../realtime/realtime-channels'
import { RealtimePublisherService } from '../realtime/realtime-publisher.service'

@Injectable()
export class DispatchNotifierService {
  private server?: Server

  constructor(
    @Optional() private readonly realtimePublisher?: RealtimePublisherService,
  ) {}

  attachSocketServer(server: Server): void {
    this.server = server
  }

  sendNewOrderOffer(driverId: string, data: Record<string, unknown>): void {
    this.server?.to(`driver:${driverId}`).emit('driver:new_order', data)
    void this.realtimePublisher?.publish(
      realtimeChannels.driver(driverId),
      'driver:new_order',
      data,
    )
  }

  sendAssignedOrder(driverId: string, data: { orderId: string }): void {
    this.server?.to(`driver:${driverId}`).emit('driver:order_assigned', data)
    void this.realtimePublisher?.publish(
      realtimeChannels.driver(driverId),
      'driver:order_assigned',
      data,
    )
  }

  emitToAdmins(event: string, data: Record<string, unknown>): void {
    this.server?.emit(event, data)
    void this.realtimePublisher?.publish(realtimeChannels.adminOrders, event, data)
  }
}
