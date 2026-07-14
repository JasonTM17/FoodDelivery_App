import { resolveProcessEntrypoint } from './process-entrypoint'

describe('resolveProcessEntrypoint', () => {
  it.each([undefined, '', '  ', 'api'])('starts the API for non-production role %p', role => {
    expect(resolveProcessEntrypoint(role, 'development')).toBe('./main')
  })

  it('starts the worker only for the explicit worker role', () => {
    expect(resolveProcessEntrypoint('worker')).toBe('./workers/main')
  })

  it('fails closed for an unknown role', () => {
    expect(() => resolveProcessEntrypoint('workre')).toThrow(
      'Unsupported FOODFLOW_PROCESS_ROLE: workre',
    )
  })

  it.each([undefined, '', '  '])('requires an explicit role in production for %p', role => {
    expect(() => resolveProcessEntrypoint(role, 'production')).toThrow(
      'FOODFLOW_PROCESS_ROLE is required in production',
    )
  })
})
