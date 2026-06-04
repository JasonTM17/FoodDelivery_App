import { Test, TestingModule } from '@nestjs/testing'
import { ConfigService } from '@nestjs/config'

describe('REDIS_CLIENT provider', () => {
  let module: TestingModule

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        {
          provide: 'REDIS_CLIENT',
          useFactory: () => ({ ping: () => 'PONG' }),
        },
      ],
    }).compile()
  })

  it('provides REDIS_CLIENT', () => {
    const client = module.get('REDIS_CLIENT')
    expect(client).toBeDefined()
  })
})
