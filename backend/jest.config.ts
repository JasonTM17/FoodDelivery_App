import type { Config } from 'jest'

const config: Config = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testRegex: '.*\\.spec\\.ts$',
  transform: { '^.+\\.(t|j)s$': 'ts-jest' },
  collectCoverageFrom: ['src/**/*.(t|j)s', '!src/**/*.spec.ts', '!src/workers/**'],
  coverageDirectory: './coverage',
  coverageThreshold: {
    global: {
      branches: 53,
      functions: 55,
      lines: 57,
      statements: 56,
    },
  },
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    // nanoid v5 ships pure ESM; redirect to a CJS-compatible test stub
    '^nanoid$': '<rootDir>/test/__mocks__/nanoid.ts',
  },
}

export default config
