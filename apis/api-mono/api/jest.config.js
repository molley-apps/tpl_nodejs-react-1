const ignore = [
  '/.openapi-nodegen/',
  '/node_modules/',
  '/build/',
  '/dist/',
];

// Better Auth and some of its dependencies ship ESM only. Jest runs CommonJS, so
// these packages are excluded from the node_modules transform ignore below and
// transpiled by ts-jest (allowJs) like our own sources. Node itself needs none of
// this: Node 22+ can require() ESM natively, this is Jest's module loader only.
const esmOnlyPackages = [
  'better-auth',
  '@better-auth',
  'better-call',
  'rou3',
  'nanostores',
  'jose',
  'kysely',
  '@noble',
  '@better-fetch',
  'zod',
  '@standard-schema',
];

module.exports = {
  moduleFileExtensions: [
    'js',
    'mjs',
    'jsx',
    'json',
    'ts',
    'tsx',
  ],
  // Cap parallelism so a local run never saturates every core. Each ts-jest
  // worker does full project type-checking + coverage, so workers are heavy;
  // keep this low. CI can override with `--maxWorkers` on the command line.
  maxWorkers: '25%',
  collectCoverage: true,
  collectCoverageFrom: [
    'src/domains/*.{js,ts}',
    'src/services/*.{js,ts}',
    'src/utils/*.{js,ts}',
  ],
  coverageDirectory: 'coverage',
  transform: {
    // Inline options are merged over tsconfig.json. allowJs covers the ESM
    // dependencies; isolatedModules keeps them transpile-only (no type check).
    '^.+\\.m?[jt]sx?$': ['ts-jest', { tsconfig: { allowJs: true, isolatedModules: true } }],
  },
  testMatch: ['**/__tests__/**/*.ts', '**/*.test.ts', '**/*.spec.ts'],
  // Anchored to rootDir so a dependency's own dist/ folder is still transformed
  transformIgnorePatterns: [
    '<rootDir>/.openapi-nodegen/',
    `/node_modules/(?!(${esmOnlyPackages.join('|')})/)`,
    '<rootDir>/build/',
    '<rootDir>/dist/',
  ],
  testPathIgnorePatterns: ignore,
  modulePathIgnorePatterns: ignore,
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  setupFilesAfterEnv: [
    './jest.setup.js',
  ],
  testEnvironmentOptions: {
    url: 'http://localhost/',
  },
};
