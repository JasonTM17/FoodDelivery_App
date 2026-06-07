import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq'
import { Logger } from '@nestjs/common'
import { Job } from 'bullmq'
import { PrismaService } from '../database/prisma.service'
import { DirectionsApiService } from './directions-api.service'
import { EtaCacheService } from './eta-cache.service'
import { RecomputeJobData } from './tracking.service'

interface DestCoords {
  destLat: number
  destLng: number
}

@Processor('tracking-eta')
export class EtaRecomputeProcessor extends WorkerHost {
  private readonly logger = new Logger(EtaRecomputeProcessor.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly directionsApi: DirectionsApiService,
    private readonly etaCache: EtaCacheService,
  ) {
    super()
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    this.logger.debug(`ETA recompute completed for order ${job.data.orderId}`)
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, err: Error) {
    this.logger.error(`ETA recompute failed for order ${job.data.orderId}: ${err.message}`)
  }

  async process(job: Job<RecomputeJobData>): Promise<void> {
    const { orderId, lat, lng } = job.data

    const coords = await this.prisma.$queryRawUnsafe<DestCoords[]>(
      `SELECT ST_Y(a.location::geometry)::float8 AS "destLat",
              ST_X(a.location::geometry)::float8 AS "destLng"
       FROM orders o
       JOIN addresses a ON a.id = o.delivery_address_id
       WHERE o.id = $1::uuid
       LIMIT 1`,
      orderId,
    )

    if (!coords.length) {
      this.logger.warn(`No delivery address found for order ${orderId} — skipping recompute`)
      return
    }

    const { destLat, destLng } = coords[0]
    const route = await this.directionsApi.fetchRoute(
      { lat, lng },
      { lat: destLat, lng: destLng },
    )

    // Invalidate stale cache then write fresh entry
    await this.etaCache.invalidate(orderId)
    await this.etaCache.setRoute(orderId, route)

    this.logger.log(
      `Recomputed route for order ${orderId}: ${Math.round(route.durationSeconds / 60)} min via ${route.provider}`,
    )
  }
}
