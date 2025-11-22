/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    // Handle CSS imports (with CSS modules)
    '\\.(css|less|scss|sass)$': '<rootDir>/src/__mocks__/fileMocks.js',

    // Handle image imports
    '\\.(jpg|jpeg|png|gif|svg|webp)$': '<rootDir>/src/__mocks__/fileMocks.js',

    // Mock Milkdown packages
    '^@milkdown/react$': '<rootDir>/__mocks__/@milkdown/react.tsx',
    '^@milkdown/core$': '<rootDir>/__mocks__/@milkdown/core.ts',
    '^@milkdown/theme-nord$': '<rootDir>/__mocks__/@milkdown/theme-nord.ts',
    '^@milkdown/preset-commonmark$': '<rootDir>/__mocks__/@milkdown/preset-commonmark.ts',
    '^@milkdown/plugin-listener$': '<rootDir>/__mocks__/@milkdown/plugin-listener.ts',
    '^@milkdown/plugin-history$': '<rootDir>/__mocks__/@milkdown/plugin-history.ts',
    '^@milkdown/plugin-math$': '<rootDir>/__mocks__/@milkdown/plugin-math.ts',

    // Handle path aliases (must match tsconfig.json)
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@main/(.*)$': '<rootDir>/src/main/$1',
    '^@renderer/(.*)$': '<rootDir>/src/renderer/$1',
    '^@shared/(.*)$': '<rootDir>/src/shared/$1',
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: {
        jsx: 'react-jsx',
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
      },
    }],
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
    '!src/**/__mocks__/**',
    '!src/main/index.ts', // Electron entry point
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  testMatch: [
    '**/__tests__/**/*.test.[jt]s?(x)',
    '**/?(*.)+(spec|test).[jt]s?(x)',
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  modulePaths: ['<rootDir>'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
};
