import { UsersController } from './users.controller'
import type { JwtPayload } from '../auth/jwt-payload.interface'

describe('UsersController', () => {
  const usersService = {
    getProfile: jest.fn(),
    listAddresses: jest.fn(),
    createAddress: jest.fn(),
    updateAddress: jest.fn(),
    deleteAddress: jest.fn(),
    updateProfile: jest.fn(),
  }
  const storageService = {
    uploadAvatar: jest.fn(),
  }
  const controller = new UsersController(usersService as never, storageService as never)
  const user = { sub: 'user-1', role: 'customer' } satisfies JwtPayload

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('uses JwtPayload.sub for profile and address reads', async () => {
    await controller.getProfile(user)
    await controller.listAddresses(user)

    expect(usersService.getProfile).toHaveBeenCalledWith('user-1')
    expect(usersService.listAddresses).toHaveBeenCalledWith('user-1')
  })

  it('uses JwtPayload.sub for address mutations', async () => {
    const createDto = {
      label: 'Home',
      addressLine: '2 Le Loi',
      latitude: 10.7769,
      longitude: 106.7009,
    }
    const updateDto = { label: 'Office' }

    await controller.createAddress(user, createDto)
    await controller.updateAddress(user, 'addr-1', updateDto)
    await controller.deleteAddress(user, 'addr-1')

    expect(usersService.createAddress).toHaveBeenCalledWith('user-1', createDto)
    expect(usersService.updateAddress).toHaveBeenCalledWith('user-1', 'addr-1', updateDto)
    expect(usersService.deleteAddress).toHaveBeenCalledWith('user-1', 'addr-1')
  })

  it('uses JwtPayload.sub for profile updates and avatar uploads', async () => {
    storageService.uploadAvatar.mockResolvedValueOnce({ url: 'https://cdn.foodflow.test/avatar.png' })

    await controller.updateProfile(user, { fullName: 'Nguyen Van A' })
    await controller.uploadAvatar(user, { buffer: Buffer.from('image') } as never)

    expect(usersService.updateProfile).toHaveBeenCalledWith('user-1', { fullName: 'Nguyen Van A' })
    expect(storageService.uploadAvatar).toHaveBeenCalledWith('user-1', { buffer: expect.any(Buffer) })
  })
})
