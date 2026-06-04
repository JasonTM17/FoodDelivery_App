import { PrismaService } from './prisma.service'

describe('PrismaService', () => {
  it('should be defined', () => {
    const service = new PrismaService()
    expect(service).toBeDefined()
  })
})
