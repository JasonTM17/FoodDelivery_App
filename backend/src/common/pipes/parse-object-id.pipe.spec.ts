import { BadRequestException } from '@nestjs/common'
import { ParseUUIDPipe } from './parse-object-id.pipe'

describe('ParseUUIDPipe', () => {
  let pipe: ParseUUIDPipe

  beforeEach(() => { pipe = new ParseUUIDPipe() })

  describe('transform — valid UUIDs', () => {
    it('returns the value unchanged for a lowercase UUID v4', () => {
      const id = '550e8400-e29b-41d4-a716-446655440000'
      expect(pipe.transform(id)).toBe(id)
    })

    it('accepts uppercase UUIDs (case-insensitive regex)', () => {
      const id = '550E8400-E29B-41D4-A716-446655440000'
      expect(pipe.transform(id)).toBe(id)
    })

    it('accepts a mixed-case UUID', () => {
      const id = '550E8400-e29b-41D4-a716-446655440000'
      expect(pipe.transform(id)).toBe(id)
    })
  })

  describe('transform — invalid UUIDs', () => {
    it('throws BadRequestException for a plain string', () => {
      expect(() => pipe.transform('not-a-uuid')).toThrow(BadRequestException)
    })

    it('throws BadRequestException for an empty string', () => {
      expect(() => pipe.transform('')).toThrow(BadRequestException)
    })

    it('throws BadRequestException for a numeric string', () => {
      expect(() => pipe.transform('12345')).toThrow(BadRequestException)
    })

    it('exception message includes the invalid value', () => {
      let caught: BadRequestException | undefined
      try {
        pipe.transform('bad-input')
      } catch (err) {
        caught = err as BadRequestException
      }
      const msg = caught!.message
      expect(msg).toContain('bad-input')
    })

    it('throws for UUID with wrong segment lengths', () => {
      expect(() => pipe.transform('550e8400-e29b-41d4-a716')).toThrow(BadRequestException)
    })
  })
})
