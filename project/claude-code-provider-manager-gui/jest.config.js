const path = require('path');

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: [
    '**/__tests__/**/*.+(ts|tsx|js)',
    '**/*.(test|spec).+(ts|tsx|js)'
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/tests/e2e/', // 排除E2E测试，由Playwright单独运行
    '/dist/',
    '/dist-electron/',
    '/src-tauri/',
  ],
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: 'tsconfig.test.json',
    }],
    '^.+\\.(js|jsx)$': 'babel-jest',
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/main/**/*.ts',
    '!src/preload.ts',
    '!src/**/*.stories.{ts,tsx}',
    '!src/**/*.mock.{ts,tsx}',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: [
    'text',
    'lcov',
    'html',
    'json-summary'
  ],
  coverageThreshold: {
    global: {
      branches: 85,
      functions: 90,
      lines: 85,
      statements: 85,
    },
    './src/services/': {
      branches: 95,
      functions: 95,
      lines: 95,
      statements: 95,
    },
    './src/contexts/': {
      branches: 90,
      functions: 95,
      lines: 90,
      statements: 90,
    },
    './src/components/ui/': {
      branches: 75,
      functions: 85,
      lines: 80,
      statements: 80,
    },
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@/components/(.*)$': '<rootDir>/src/components/$1',
    '^@/pages/(.*)$': '<rootDir>/src/pages/$1',
    '^@/services/(.*)$': '<rootDir>/src/services/$1',
    '^@/types/(.*)$': '<rootDir>/src/types/$1',
    '^@/utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@/contexts/(.*)$': '<rootDir>/src/contexts/$1',
    '^@/fixtures/(.*)$': '<rootDir>/tests/fixtures/$1',
    '^@/mocks/(.*)$': '<rootDir>/tests/mocks/$1',
  },
  testEnvironmentOptions: {
    url: 'http://localhost:1420',
  },
  testTimeout: 10000,
  maxWorkers: '50%',
  verbose: false
};