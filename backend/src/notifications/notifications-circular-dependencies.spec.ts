import { JwtService } from '@nestjs/jwt'
import { Test } from '@nestjs/testing'
import { PrismaService } from '../database/prisma.service'
import { FcmChannel } from './channels/fcm.channel'
import { InAppChannel } from './channels/in-app.channel'
import { SmtpChannel } from './channels/smtp.channel'
import { TwilioChannel } from './channels/twilio.channel'
import { NotificationsGateway } from './notifications.gateway'
import { NotificationsService } from './notifications.service'
import { TemplateLoader } from './templates/template.loader'

describe('Notifications dependency graph', () => {
  it('resolves the gateway and service together', async () => {
    const module = await Test.createTestingModule({
      providers: [
        NotificationsGateway,
        NotificationsService,
        InAppChannel,
        { provide: JwtService, useValue: { verify: jest.fn() } },
        { provide: PrismaService, useValue: {} },
        { provide: 'REDIS_CLIENT', useValue: {} },
        { provide: TemplateLoader, useValue: {} },
        { provide: FcmChannel, useValue: {} },
        { provide: SmtpChannel, useValue: {} },
        { provide: TwilioChannel, useValue: {} },
      ],
    }).compile()

    expect(module.get(NotificationsGateway)).toBeDefined()
    expect(module.get(NotificationsService)).toBeDefined()

    await module.close()
  })
})
