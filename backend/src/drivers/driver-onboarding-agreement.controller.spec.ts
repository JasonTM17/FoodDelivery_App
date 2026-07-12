import { INestApplication, ValidationPipe } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { RolesGuard } from '../auth/roles.guard'
import { DriverOnboardingAgreementController } from './driver-onboarding-agreement.controller'
import { DriverOnboardingAgreementService } from './driver-onboarding-agreement.service'

// CJS interop under ts-jest: namespace imports are not callable.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const request = require('supertest') as typeof import('supertest')

describe('DriverOnboardingAgreementController', () => {
  let app: INestApplication
  const agreementService = {
    accept: jest.fn(),
  }

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [DriverOnboardingAgreementController],
      providers: [
        { provide: DriverOnboardingAgreementService, useValue: agreementService },
        { provide: JwtAuthGuard, useValue: { canActivate: jest.fn() } },
        { provide: RolesGuard, useValue: { canActivate: jest.fn() } },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context: { switchToHttp: () => { getRequest: () => Record<string, unknown> } }) => {
          context.switchToHttp().getRequest().user = { sub: 'driver-1', role: 'driver' }
          return true
        },
      })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile()

    app = module.createNestApplication()
    app.setGlobalPrefix('api')
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }))
    await app.init()
  })

  beforeEach(() => {
    agreementService.accept.mockReset()
    agreementService.accept.mockResolvedValue({
      termsAcceptedAt: '2026-07-12T00:00:00.000Z',
      termsVersion: 'driver-terms-2026-07',
    })
  })

  afterAll(async () => {
    await app?.close()
  })

  it('validates the request body without applying the body schema to the JWT user', async () => {
    await request(app.getHttpServer())
      .post('/api/driver/onboarding/agreement')
      .send({ termsVersion: 'driver-terms-2026-07' })
      .expect(201)
      .expect({
        termsAcceptedAt: '2026-07-12T00:00:00.000Z',
        termsVersion: 'driver-terms-2026-07',
      })

    expect(agreementService.accept).toHaveBeenCalledWith('driver-1', {
      termsVersion: 'driver-terms-2026-07',
    })
  })
})
