import 'reflect-metadata'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { AdminDriversQueryDto } from './admin-drivers.dto'

describe('AdminDriversQueryDto', () => {
  it('transforms valid pagination values from query strings', async () => {
    const dto = plainToInstance(AdminDriversQueryDto, {
      page: '2',
      limit: '50',
      status: 'online',
    })

    await expect(validate(dto)).resolves.toHaveLength(0)
    expect(dto).toMatchObject({ page: 2, limit: 50, status: 'online' })
  })

  it.each([
    { page: '0' },
    { limit: '101' },
    { status: 'busy' },
    { search: 'a'.repeat(101) },
  ])('rejects invalid list input %#', async input => {
    const errors = await validate(plainToInstance(AdminDriversQueryDto, input))

    expect(errors.length).toBeGreaterThan(0)
  })
})
