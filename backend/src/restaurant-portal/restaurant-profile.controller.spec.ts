import { BadRequestException } from '@nestjs/common'
import { RestaurantProfileController } from './restaurant-profile.controller'
import { RestaurantProfileService } from './restaurant-profile.service'
import { StorageService, UploadedFile } from '../storage/storage.service'

describe('RestaurantProfileController', () => {
  const profile = {
    get: jest.fn(),
    update: jest.fn(),
    getMembership: jest.fn(),
  }
  const storage = {
    uploadFile: jest.fn(),
  }
  const controller = new RestaurantProfileController(
    profile as unknown as RestaurantProfileService,
    storage as unknown as StorageService,
  )

  beforeEach(() => {
    jest.clearAllMocks()
    profile.getMembership.mockResolvedValue({ restaurantId: 'restaurant-1' })
    storage.uploadFile.mockResolvedValue({ url: 'https://cdn.test/restaurants/restaurant-1/logo.png' })
  })

  it('uploads profile images under the authenticated restaurant namespace', async () => {
    const file = makeFile()

    const result = await controller.uploadImage({ sub: 'owner-1', role: 'restaurant' }, file)

    expect(profile.getMembership).toHaveBeenCalledWith('owner-1')
    expect(storage.uploadFile).toHaveBeenCalledWith(file, 'restaurants/restaurant-1')
    expect(result).toEqual({ url: 'https://cdn.test/restaurants/restaurant-1/logo.png' })
  })

  it('rejects missing files before calling storage', async () => {
    await expect(
      controller.uploadImage({ sub: 'owner-1', role: 'restaurant' }, undefined as unknown as UploadedFile),
    ).rejects.toThrow(BadRequestException)

    expect(storage.uploadFile).not.toHaveBeenCalled()
  })
})

function makeFile(): UploadedFile {
  return {
    fieldname: 'file',
    originalname: 'logo.png',
    encoding: '7bit',
    mimetype: 'image/png',
    buffer: Buffer.from('png'),
    size: 3,
  }
}
