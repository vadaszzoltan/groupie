import type { Config } from 'jest';

const config: Config = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: ['src/**/*.(t|j)s'],
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@group-watch/shared$': '<rootDir>/../../packages/shared/src',
    '^@group-watch/shared/(.*)$': '<rootDir>/../../packages/shared/src/$1',
  },
};

export default config;
