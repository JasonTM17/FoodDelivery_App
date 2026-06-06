let counter = 0

export const nanoid = jest.fn((_size?: number): string => {
  counter += 1
  return `test-id-${counter}`
})

beforeEach(() => {
  counter = 0
  nanoid.mockClear()
  nanoid.mockImplementation((_size?: number): string => {
    counter += 1
    return `test-id-${counter}`
  })
})
