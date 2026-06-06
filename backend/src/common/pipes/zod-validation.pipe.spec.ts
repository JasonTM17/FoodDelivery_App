import { BadRequestException } from '@nestjs/common'
import { z } from 'zod'
import { ZodValidationPipe } from './zod-validation.pipe'

describe('ZodValidationPipe', () => {
  describe('transform — success', () => {
    it('returns parsed data for valid object input', () => {
      const schema = z.object({ name: z.string(), age: z.number() })
      const pipe = new ZodValidationPipe(schema)
      expect(pipe.transform({ name: 'Alice', age: 30 })).toEqual({ name: 'Alice', age: 30 })
    })

    it('coerces types when schema uses z.coerce', () => {
      const schema = z.object({ count: z.coerce.number() })
      const pipe = new ZodValidationPipe(schema)
      expect(pipe.transform({ count: '5' })).toEqual({ count: 5 })
    })

    it('strips unknown fields with .strip()', () => {
      const schema = z.object({ id: z.string() }).strip()
      const pipe = new ZodValidationPipe(schema)
      const result = pipe.transform({ id: 'abc', extra: 'ignored' }) as Record<string, unknown>
      expect(result).not.toHaveProperty('extra')
      expect(result.id).toBe('abc')
    })

    it('passes through a simple string schema', () => {
      const pipe = new ZodValidationPipe(z.string())
      expect(pipe.transform('hello')).toBe('hello')
    })

    it('passes through an array schema', () => {
      const pipe = new ZodValidationPipe(z.array(z.number()))
      expect(pipe.transform([1, 2, 3])).toEqual([1, 2, 3])
    })
  })

  describe('transform — failure', () => {
    it('throws BadRequestException for invalid email', () => {
      const pipe = new ZodValidationPipe(z.object({ email: z.string().email() }))
      expect(() => pipe.transform({ email: 'not-an-email' })).toThrow(BadRequestException)
    })

    it('exception response has message and errors fields', () => {
      const pipe = new ZodValidationPipe(z.object({ price: z.number().positive() }))
      let caught: BadRequestException | undefined
      try {
        pipe.transform({ price: -1 })
      } catch (err) {
        caught = err as BadRequestException
      }
      expect(caught).toBeInstanceOf(BadRequestException)
      const body = caught!.getResponse() as Record<string, unknown>
      expect(body.message).toBe('Validation failed')
      expect(body.errors).toBeDefined()
    })

    it('reports nested field paths like user.age', () => {
      const pipe = new ZodValidationPipe(z.object({ user: z.object({ age: z.number() }) }))
      let caught: BadRequestException | undefined
      try {
        pipe.transform({ user: { age: 'not-a-number' } })
      } catch (err) {
        caught = err as BadRequestException
      }
      const errors = (caught!.getResponse() as Record<string, unknown>).errors as Record<string, string[]>
      expect(errors['user.age']).toBeDefined()
      expect(errors['user.age'].length).toBeGreaterThan(0)
    })

    it('uses _root key for top-level schema mismatches', () => {
      const pipe = new ZodValidationPipe(z.string())
      let caught: BadRequestException | undefined
      try {
        pipe.transform(123)
      } catch (err) {
        caught = err as BadRequestException
      }
      const errors = (caught!.getResponse() as Record<string, unknown>).errors as Record<string, string[]>
      expect(errors['_root']).toBeDefined()
    })

    it('throws for empty object when required fields missing', () => {
      const pipe = new ZodValidationPipe(z.object({ name: z.string() }))
      expect(() => pipe.transform({})).toThrow(BadRequestException)
    })

    it('throws for null input on object schema', () => {
      const pipe = new ZodValidationPipe(z.object({ id: z.string() }))
      expect(() => pipe.transform(null)).toThrow(BadRequestException)
    })

    it('throws for type mismatch on array schema', () => {
      const pipe = new ZodValidationPipe(z.array(z.string()))
      expect(() => pipe.transform('not-an-array')).toThrow(BadRequestException)
    })

    it('collects multiple field errors', () => {
      const schema = z.object({ a: z.string(), b: z.number() })
      const pipe = new ZodValidationPipe(schema)
      let caught: BadRequestException | undefined
      try {
        pipe.transform({ a: 1, b: 'wrong' })
      } catch (err) {
        caught = err as BadRequestException
      }
      const errors = (caught!.getResponse() as Record<string, unknown>).errors as Record<string, string[]>
      expect(Object.keys(errors).length).toBeGreaterThanOrEqual(2)
    })
  })
})
