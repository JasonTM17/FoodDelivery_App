import { Controller, Get, Headers, Post, Query, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { JobOutboxService } from './job-outbox.service'

@ApiTags('jobs')
@Controller('jobs')
export class JobOutboxController {
  constructor(
    private readonly jobs: JobOutboxService,
    private readonly config: ConfigService,
  ) {}

  @Get('drain')
  @ApiOperation({ summary: 'Drain due Supabase/Postgres queue jobs for an authenticated recovery invocation' })
  async drainGet(
    @Headers('authorization') authorization?: string,
    @Query('limit') limit?: string,
  ) {
    this.assertCronSecret(authorization)
    return this.jobs.drain(parseLimit(limit))
  }

  @Post('drain')
  @ApiOperation({ summary: 'Drain due Supabase/Postgres queue jobs for secure worker invocations' })
  async drainPost(
    @Headers('authorization') authorization?: string,
    @Query('limit') limit?: string,
  ) {
    this.assertCronSecret(authorization)
    return this.jobs.drain(parseLimit(limit))
  }

  private assertCronSecret(authorization?: string): void {
    const secret = this.config.get<string>('CRON_SECRET')?.trim()
    if (!secret || authorization !== `Bearer ${secret}`) {
      throw new UnauthorizedException('INVALID_CRON_SECRET')
    }
  }
}

function parseLimit(value?: string): number | undefined {
  if (!value) return undefined
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}
