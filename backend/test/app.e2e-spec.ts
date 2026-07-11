import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication } from '@nestjs/common'
import * as request from 'supertest'
import { AppModule } from '../src/app.module'

describe('AppController (e2e)', () => {
  let app: INestApplication

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    app = moduleFixture.createNestApplication()
    app.setGlobalPrefix('api')
    await app.init()
  })

  afterAll(async () => { await app.close() })

  it('/api/healthz (GET)', () => {
    return request(app.getHttpServer())
      .get('/api/healthz')
      .expect(200)
      .expect(res => {
        expect(res.body.status).toBe('ok')
      })
  })

  it('/api/readyz (GET)', () => {
    return request(app.getHttpServer())
      .get('/api/readyz')
      .expect(200)
      .expect(res => {
        expect(res.body).toMatchObject({ status: 'ready', ready: true })
      })
  })
})
